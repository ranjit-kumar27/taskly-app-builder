package com.ranjit.projects.Taskly.dto.chat;

import com.ranjit.projects.Taskly.enums.ChatEventType;

public record ChatEventResponse(
        Long id,
        ChatEventType type,
        Integer sequenceOrder,
        String content,
        String filePath,
        String metadata
) {
}
