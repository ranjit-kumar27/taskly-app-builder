package com.ranjit.projects.Taskly.dto.chat;

public record ChatRequest(
        String message,
        Long projectId
) {
}
