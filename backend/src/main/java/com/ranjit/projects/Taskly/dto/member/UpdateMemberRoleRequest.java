package com.ranjit.projects.Taskly.dto.member;

import com.ranjit.projects.Taskly.enums.ProjectRole;
import org.jspecify.annotations.NonNull;

public record UpdateMemberRoleRequest(
        @NonNull ProjectRole role
) {
}
