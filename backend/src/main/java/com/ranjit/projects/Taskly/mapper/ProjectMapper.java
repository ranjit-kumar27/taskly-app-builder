package com.ranjit.projects.Taskly.mapper;


import com.ranjit.projects.Taskly.dto.project.ProjectResponse;
import com.ranjit.projects.Taskly.dto.project.ProjectSummaryResponse;
import com.ranjit.projects.Taskly.entity.Project;
import com.ranjit.projects.Taskly.enums.ProjectRole;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProjectMapper {

    ProjectResponse toProjectResponse(Project project);


    ProjectSummaryResponse toProjectSummaryResponse(Project project, ProjectRole role);


    List<ProjectSummaryResponse> toListProjectSummaryResponse(List<Project> projects);

}
