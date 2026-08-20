package com.ranjit.projects.Taskly.service;



import com.ranjit.projects.Taskly.dto.chat.ChatResponse;

import java.util.List;

public interface ChatService {

    List<ChatResponse> getProjectChatHistory(Long projectId);

}
