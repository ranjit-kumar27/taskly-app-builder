package com.ranjit.projects.Taskly.dto.auth;

public record UserProfileResponse(
        Long id,
        String username,
        String name
) {
}
