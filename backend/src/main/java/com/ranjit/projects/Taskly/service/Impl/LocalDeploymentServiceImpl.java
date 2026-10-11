package com.ranjit.projects.Taskly.service.Impl;

import com.ranjit.projects.Taskly.dto.deploy.DeployResponse;
import com.ranjit.projects.Taskly.service.DeploymentService;
import io.minio.GetObjectArgs;
import io.minio.ListObjectsArgs;
import io.minio.MinioClient;
import io.minio.Result;
import io.minio.messages.Item;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Preview runner for local development (no Kubernetes): mirrors a project's files from MinIO into a
 * local folder, runs `npm install` + `npm run dev` on a free port, and keeps re-syncing changed files
 * so Vite hot-reloads the AI's edits — the same job the syncer/runner pods do in the cluster.
 * Enabled with preview.mode=local (the default); preview.mode=kubernetes uses KubernetesDeploymentServiceImpl.
 */
@Service
@ConditionalOnProperty(name = "preview.mode", havingValue = "local", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class LocalDeploymentServiceImpl implements DeploymentService {

    private static final boolean WINDOWS = System.getProperty("os.name").toLowerCase().contains("win");

    private final MinioClient minioClient;

    @Value("${minio.project-bucket}")
    private String bucket;

    @Value("${preview.local.dir:${java.io.tmpdir}/taskly-previews}")
    private String baseDir;

    private record Preview(Process process, int port, Path dir, Map<String, String> etags) {}

    private final Map<Long, Preview> previews = new ConcurrentHashMap<>();
    private final ScheduledExecutorService syncer = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "preview-sync");
        t.setDaemon(true);
        return t;
    });

    @PostConstruct
    void startSyncLoop() {
        // Equivalent of `mc mirror --watch`: pick up files the AI writes while the preview runs
        syncer.scheduleWithFixedDelay(() -> previews.forEach((projectId, preview) -> {
            if (!preview.process().isAlive()) return;
            try {
                syncFiles(projectId, preview.dir(), preview.etags());
            } catch (Exception e) {
                log.debug("Preview sync failed for project {}", projectId, e);
            }
        }), 2, 2, TimeUnit.SECONDS);
    }

    // ponytail: one global lock, so a slow first `npm install` blocks other projects' deploys; per-project locks if that matters
    @Override
    @PreAuthorize("@security.canViewProject(#projectId)")
    public synchronized DeployResponse deploy(Long projectId) {
        Preview running = previews.get(projectId);
        if (running != null && running.process().isAlive()) {
            syncFiles(projectId, running.dir(), running.etags());
            return new DeployResponse(url(running.port()));
        }
        previews.remove(projectId);

        try {
            Path dir = Path.of(baseDir, String.valueOf(projectId)).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            Map<String, String> etags = new ConcurrentHashMap<>();
            syncFiles(projectId, dir, etags);

            log.info("Installing dependencies for project {} in {}", projectId, dir);
            Process install = npm(dir, dir.resolve("install.log"), "install", "--no-audit", "--no-fund");
            if (!install.waitFor(5, TimeUnit.MINUTES) || install.exitValue() != 0) {
                install.destroyForcibly();
                throw new IllegalStateException("npm install failed: " + tail(dir.resolve("install.log")));
            }

            int port = freePort();
            log.info("Starting dev server for project {} on port {}", projectId, port);
            Process dev = npm(dir, dir.resolve("dev.log"),
                    "run", "dev", "--", "--host", "127.0.0.1", "--port", String.valueOf(port), "--strictPort");

            if (!waitForPort(dev, port, 60)) {
                kill(dev);
                throw new IllegalStateException("Dev server did not start: " + tail(dir.resolve("dev.log")));
            }

            previews.put(projectId, new Preview(dev, port, dir, etags));
            log.info("Preview for project {} running at {}", projectId, url(port));
            return new DeployResponse(url(port));

        } catch (IOException e) {
            throw new IllegalStateException("Could not prepare preview for project " + projectId + ": " + e.getMessage(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Preview start interrupted", e);
        }
    }

    @PreDestroy
    void stopAll() {
        syncer.shutdownNow();
        previews.values().forEach(p -> kill(p.process()));
    }

    /** Download every object under {projectId}/ whose ETag changed since the last sync. */
    private void syncFiles(Long projectId, Path dir, Map<String, String> etags) {
        String prefix = projectId + "/";
        try {
            for (Result<Item> result : minioClient.listObjects(
                    ListObjectsArgs.builder().bucket(bucket).prefix(prefix).recursive(true).build())) {
                Item item = result.get();
                String relative = item.objectName().substring(prefix.length());
                if (relative.isBlank() || item.etag().equals(etags.get(relative))) continue;

                Path target = dir.resolve(relative).normalize();
                if (!target.startsWith(dir)) {           // AI-supplied paths: never write outside the project dir
                    log.warn("Skipping file outside preview dir: {}", relative);
                    continue;
                }
                Files.createDirectories(target.getParent());
                try (InputStream in = minioClient.getObject(
                        GetObjectArgs.builder().bucket(bucket).object(item.objectName()).build())) {
                    Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
                }
                etags.put(relative, item.etag());
            }
        } catch (Exception e) {
            throw new IllegalStateException("Failed to sync project files from storage: " + e.getMessage(), e);
        }
    }

    private static Process npm(Path dir, Path logFile, String... args) throws IOException {
        List<String> command = new ArrayList<>(WINDOWS ? List.of("cmd.exe", "/c", "npm") : List.of("npm"));
        command.addAll(List.of(args));
        return new ProcessBuilder(command)
                .directory(dir.toFile())
                .redirectErrorStream(true)
                .redirectOutput(logFile.toFile())
                .start();
    }

    private static boolean waitForPort(Process process, int port, int timeoutSeconds) throws InterruptedException {
        long deadline = System.currentTimeMillis() + timeoutSeconds * 1000L;
        while (System.currentTimeMillis() < deadline) {
            if (!process.isAlive()) return false;
            try (Socket ignored = new Socket("127.0.0.1", port)) {
                return true;
            } catch (IOException notYet) {
                Thread.sleep(500);
            }
        }
        return false;
    }

    private static int freePort() throws IOException {
        try (ServerSocket socket = new ServerSocket(0)) {
            return socket.getLocalPort();
        }
    }

    /** On Windows npm runs under cmd.exe, so the node process is a child: kill the whole tree. */
    private static void kill(Process process) {
        process.descendants().forEach(ProcessHandle::destroyForcibly);
        process.destroyForcibly();
    }

    private static String tail(Path logFile) {
        try {
            List<String> lines = Files.readAllLines(logFile);
            return String.join("\n", lines.subList(Math.max(0, lines.size() - 15), lines.size()));
        } catch (IOException e) {
            return "(no log)";
        }
    }

    // 127.0.0.1 rather than localhost: Vite binds IPv4 here, and "localhost" may resolve to ::1 first
    private static String url(int port) {
        return "http://127.0.0.1:" + port;
    }
}
