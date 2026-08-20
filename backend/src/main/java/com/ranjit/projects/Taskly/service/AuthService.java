package com.ranjit.projects.Taskly.service;

import com.ranjit.projects.Taskly.dto.auth.AuthResponse;
import com.ranjit.projects.Taskly.dto.auth.LoginRequest;
import com.ranjit.projects.Taskly.dto.auth.SignupRequest;

public interface AuthService {
    AuthResponse signup(SignupRequest request);

    AuthResponse login(LoginRequest request);
}
