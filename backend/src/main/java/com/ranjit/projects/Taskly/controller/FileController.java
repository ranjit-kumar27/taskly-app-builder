package com.ranjit.projects.Taskly.controller;

import com.ranjit.projects.Taskly.dto.project.FileContentResponse;
import com.ranjit.projects.Taskly.dto.project.FileNode;
import com.ranjit.projects.Taskly.dto.project.FileTreeResponse;
import com.ranjit.projects.Taskly.service.ProjectFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/projects/{projectId}/files")
public class FileController {

        private final ProjectFileService projectFileService;

        @GetMapping
        public ResponseEntity<FileTreeResponse> getFileTree(@PathVariable Long projectId) {
            return ResponseEntity.ok(projectFileService.getFileTree(projectId));
        }

    @GetMapping("/content")
    public ResponseEntity<FileContentResponse> getFile(
            @PathVariable Long projectId,
            @RequestParam String path) {
        return ResponseEntity.ok(projectFileService.getFileContent(projectId, path));
    }


}
