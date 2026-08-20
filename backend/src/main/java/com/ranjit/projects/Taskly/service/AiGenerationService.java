package com.ranjit.projects.Taskly.service;

import aj.org.objectweb.asm.commons.Remapper;
import com.ranjit.projects.Taskly.dto.chat.StreamResponse;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;


public interface AiGenerationService {
    Flux<StreamResponse> streamResponse(String message, Long projectId);
}
