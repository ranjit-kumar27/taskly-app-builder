package com.ranjit.projects.Taskly.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Set;

import static com.ranjit.projects.Taskly.enums.ProjectPermission.*;

@RequiredArgsConstructor
@Getter
public enum ProjectRole {
    EDITOR(EDIT,VIEW,DELETE,VIEW_MEMBERS),
    VIEWER(Set.of(VIEW,VIEW_MEMBERS)),
    OWNER(Set.of(VIEW, EDIT,MANAGE_MEMBERS,DELETE,VIEW_MEMBERS)),;

    ProjectRole(ProjectPermission... permissions) {
        this.permissions = Set.of(permissions);
    }

    private final Set<ProjectPermission> permissions;
}