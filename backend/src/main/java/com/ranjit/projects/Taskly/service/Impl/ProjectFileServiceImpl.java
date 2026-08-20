package com.ranjit.projects.Taskly.service.Impl;

import com.ranjit.projects.Taskly.dto.project.FileContentResponse;
import com.ranjit.projects.Taskly.dto.project.FileNode;
import com.ranjit.projects.Taskly.dto.project.FileTreeResponse;
import com.ranjit.projects.Taskly.entity.Project;
import com.ranjit.projects.Taskly.entity.ProjectFile;
import com.ranjit.projects.Taskly.error.ResourceNotFoundException;
import com.ranjit.projects.Taskly.mapper.ProjectFileMapper;
import com.ranjit.projects.Taskly.repository.ProjectFileRepository;
import com.ranjit.projects.Taskly.repository.ProjectRepository;
import com.ranjit.projects.Taskly.service.ProjectFileService;
import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.w3c.dom.Node;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;


@Service
@Slf4j
@RequiredArgsConstructor
public class ProjectFileServiceImpl implements ProjectFileService {

    private final ProjectRepository projectRepository;
    private final ProjectFileRepository projectFileRepository;
    private final MinioClient minioClient;
    private final ProjectFileMapper projectFileMapper;

    @Value("${minio.project-bucket}")
    private String projectBucket;

    private static final String BUCKET_NAME="projects";

    @Override
    public FileTreeResponse getFileTree(Long projectId) {
        List<ProjectFile> projectFiles=projectFileRepository.findByProjectId(projectId);
        List<FileNode> projectFileNodes=projectFileMapper.toListOfFileNode(projectFiles);
        return new  FileTreeResponse(projectFileNodes);
    }

    @Override
    public FileContentResponse getFileContent(Long projectId, String path) {
        String objectName = projectId + "/" + path;
        try (
                InputStream is = minioClient.getObject(
                        GetObjectArgs.builder()
                                .bucket(BUCKET_NAME)
                                .object(objectName)
                                .build())) {

            String content = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            return new FileContentResponse(path, content);
        } catch (Exception e) {
            log.error("Failed to read file: {}/{}", projectId, path, e);
            throw new RuntimeException("Failed to read file content", e);
        }
    }
    @Override
    public void saveFile(Long projectId, String path, String content) {
        // log.info("projectId: {},Path: {},content: {}",projectId,Path,content);
        Project project = projectRepository.findById(projectId).orElseThrow(
                ()->new ResourceNotFoundException("project",projectId.toString())
        );

        String cleanPath= path.startsWith("/")?path.substring(1):path;
        String objectKey=projectId+"/"+cleanPath;

        try {
            byte[] contentBytes = content.getBytes(StandardCharsets.UTF_8);
            InputStream inputStream = new ByteArrayInputStream(contentBytes);
            // saving the file content
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(projectBucket)
                            .object(objectKey)
                            .stream(inputStream, contentBytes.length, -1)
                            .contentType(determineContentType(path))
                            .build());

            // Saving the metaData
            ProjectFile file = projectFileRepository.findByProjectIdAndPath(projectId, cleanPath)
                    .orElseGet(() -> ProjectFile.builder()
                            .project(project)
                            .path(cleanPath)
                            .minioObjectKey(objectKey) // Use the key we generated
                            .createdAt(Instant.now())
                            .build());

            file.setUpdatedAt(Instant.now());
            projectFileRepository.save(file);
            log.info("Saved file: {}", objectKey);
        } catch (Exception e) {
            log.error("Failed to save file {}/{}", projectId, cleanPath, e);
            throw new RuntimeException("File save failed", e);
        }

    }
    private String determineContentType(String path) {
        String type = URLConnection.guessContentTypeFromName(path);
        if (type != null) return type;
        if (path.endsWith(".jsx") || path.endsWith(".ts") || path.endsWith(".tsx")) return "text/javascript";
        if (path.endsWith(".json")) return "application/json";
        if (path.endsWith(".css")) return "text/css";

        return "text/plain";
    }
}
