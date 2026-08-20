package com.ranjit.projects.Taskly.service;

import com.ranjit.projects.Taskly.dto.project.FileContentResponse;
import com.ranjit.projects.Taskly.dto.project.FileNode;
import com.ranjit.projects.Taskly.dto.project.FileTreeResponse;

import java.util.List;

public interface ProjectFileService {
    FileTreeResponse getFileTree(Long projectId);

    FileContentResponse getFileContent(Long projectId, String path);

    void saveFile(Long projectId, String filePath, String fileContent);

}
