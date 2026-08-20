package com.ranjit.projects.Taskly.service.Impl;

import com.ranjit.projects.Taskly.dto.chat.ChatResponse;
import com.ranjit.projects.Taskly.entity.ChatMessage;
import com.ranjit.projects.Taskly.entity.ChatSession;
import com.ranjit.projects.Taskly.entity.ChatSessionId;
import com.ranjit.projects.Taskly.mapper.ChatMapper;
import com.ranjit.projects.Taskly.repository.ChatMessageRepository;
import com.ranjit.projects.Taskly.repository.ChatSessionRepository;
import com.ranjit.projects.Taskly.security.AuthUtil;
import com.ranjit.projects.Taskly.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final AuthUtil authUtil;
    private final ChatMapper chatMapper;

    @Override
    public List<ChatResponse> getProjectChatHistory(Long projectId) {
        Long userId = authUtil.getCurrentUserId();

        ChatSession chatSession=chatSessionRepository.getReferenceById(
          new ChatSessionId(projectId,userId)
        );

        List<ChatMessage> chatMessageList=chatMessageRepository.findByChatSession(chatSession);
        return chatMapper.fromListOfChatMessage(chatMessageList);
    }
}
