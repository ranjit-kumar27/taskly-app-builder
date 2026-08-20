package com.ranjit.projects.Taskly.mapper;

import com.ranjit.projects.Taskly.dto.chat.ChatResponse;
import com.ranjit.projects.Taskly.entity.ChatMessage;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ChatMapper {

    List<ChatResponse> fromListOfChatMessage(List<ChatMessage> chatMessageList);
}
