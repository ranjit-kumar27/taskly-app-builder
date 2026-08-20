package com.ranjit.projects.Taskly.dto.project;

import com.ranjit.projects.Taskly.dto.auth.UserProfileResponse;

public record ProjectResponse(
        Long id,
        String name,
        String createdAt,
        String updatedAt,
        UserProfileResponse owner
) {
}
