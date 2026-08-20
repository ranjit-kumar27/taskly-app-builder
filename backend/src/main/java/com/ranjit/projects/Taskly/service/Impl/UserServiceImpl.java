package com.ranjit.projects.Taskly.service.Impl;

import com.ranjit.projects.Taskly.dto.auth.UserProfileResponse;
import com.ranjit.projects.Taskly.error.ResourceNotFoundException;
import com.ranjit.projects.Taskly.repository.UserRepository;
import com.ranjit.projects.Taskly.service.UserService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true,level = AccessLevel.PRIVATE)
public class UserServiceImpl implements UserService, UserDetailsService {

    UserRepository userRepository;

    @Override
    public UserProfileResponse getProfile(Long userId) {
        return null;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("user not found: ",username));
    }
}
