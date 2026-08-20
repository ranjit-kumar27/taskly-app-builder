package com.ranjit.projects.Taskly.dto.project;

import com.ranjit.projects.Taskly.enums.ProjectRole;

import java.time.Instant;

public record ProjectSummaryResponse(
        Long id,
        String name,
        Instant createdAt,
        Instant updatedAt,
        ProjectRole role
) {
}
