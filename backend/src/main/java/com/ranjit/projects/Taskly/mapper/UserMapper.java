package com.ranjit.projects.Taskly.mapper;

import com.ranjit.projects.Taskly.dto.auth.SignupRequest;
import com.ranjit.projects.Taskly.dto.auth.UserProfileResponse;
import com.ranjit.projects.Taskly.entity.User;
import jakarta.validation.constraints.Min;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User toEntity(SignupRequest signupRequest);

    UserProfileResponse toUserProfileResponse(User user);
}
