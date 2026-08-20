package com.ranjit.projects.Taskly.service;

import com.ranjit.projects.Taskly.dto.project.ProjectRequest;
import com.ranjit.projects.Taskly.dto.project.ProjectResponse;
import com.ranjit.projects.Taskly.dto.project.ProjectSummaryResponse;

import java.util.List;

public interface ProjectService {
    List<ProjectSummaryResponse> getUserProjects();

    ProjectSummaryResponse getUserProjectById(Long id);

    ProjectResponse createProject(ProjectRequest request);

    ProjectResponse updateProject(Long id, ProjectRequest request);

    void softDelete(Long id);
}
