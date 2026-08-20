package com.ranjit.projects.Taskly.dto.auth;

public record AuthResponse(
        String token,
        UserProfileResponse user
) {
    
}
