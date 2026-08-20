package com.ranjit.projects.Taskly.dto.member;

import com.ranjit.projects.Taskly.enums.ProjectRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.jspecify.annotations.NonNull;

public record InviteMemberRequest(
       @Email @NotBlank String username,
       @NonNull ProjectRole role

) {
}
