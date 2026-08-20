package com.ranjit.projects.Taskly.dto.member;

import com.ranjit.projects.Taskly.enums.ProjectRole;

import java.time.Instant;

public record MemberResponse(
        Long userId,
        String username,
        String name,
        ProjectRole role,
        Instant invitedAt

) {
}

