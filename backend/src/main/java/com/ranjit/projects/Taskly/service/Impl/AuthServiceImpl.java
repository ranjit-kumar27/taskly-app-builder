package com.ranjit.projects.Taskly.service.Impl;

import ch.qos.logback.classic.spi.IThrowableProxy;
import com.ranjit.projects.Taskly.dto.auth.AuthResponse;
import com.ranjit.projects.Taskly.dto.auth.LoginRequest;
import com.ranjit.projects.Taskly.dto.auth.SignupRequest;
import com.ranjit.projects.Taskly.entity.User;
import com.ranjit.projects.Taskly.error.BadRequestException;
import com.ranjit.projects.Taskly.mapper.UserMapper;
import com.ranjit.projects.Taskly.repository.UserRepository;
import com.ranjit.projects.Taskly.security.AuthUtil;
import com.ranjit.projects.Taskly.service.AuthService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true,level = AccessLevel.PRIVATE )
public class AuthServiceImpl implements AuthService {

    UserRepository userRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;
    AuthUtil authUtil;
    AuthenticationManager authenticationManager;

    @Override
    public AuthResponse signup(SignupRequest request) {
        userRepository.findByUsername(request.username()).ifPresent(user -> {
            throw new BadRequestException("user already exists with username " + request.username());
        });

        User user = userMapper.toEntity(request);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user=userRepository.save(user);

        String token =authUtil.generateAccessToken(user);

        return new AuthResponse(token,userMapper.toUserProfileResponse(user));
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(),request.password())
        );

        User user = (User) authentication.getPrincipal();

        String token=authUtil.generateAccessToken(user);
        return new AuthResponse(token,userMapper.toUserProfileResponse(user));
    }
}
