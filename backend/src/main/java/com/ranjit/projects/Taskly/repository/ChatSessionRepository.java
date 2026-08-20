package com.ranjit.projects.Taskly.repository;

import com.ranjit.projects.Taskly.entity.ChatSession;
import com.ranjit.projects.Taskly.entity.ChatSessionId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatSessionRepository extends JpaRepository<ChatSession, ChatSessionId> {
}
