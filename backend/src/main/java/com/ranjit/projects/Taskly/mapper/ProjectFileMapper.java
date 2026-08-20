package com.ranjit.projects.Taskly.mapper;

import com.ranjit.projects.Taskly.dto.project.FileNode;
import com.ranjit.projects.Taskly.entity.ProjectFile;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProjectFileMapper {
    List<FileNode> toListOfFileNode(List<ProjectFile> projectFileList);
}
