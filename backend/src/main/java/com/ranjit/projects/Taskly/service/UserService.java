package com.ranjit.projects.Taskly.service;

import com.ranjit.projects.Taskly.dto.auth.UserProfileResponse;

public interface UserService {
    UserProfileResponse getProfile(Long userId);
}
