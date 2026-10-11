package com.ranjit.projects.Taskly.controller;

import com.ranjit.projects.Taskly.dto.chat.ChatRequest;
import com.ranjit.projects.Taskly.dto.chat.ChatResponse;
import com.ranjit.projects.Taskly.dto.chat.StreamResponse;
import com.ranjit.projects.Taskly.service.AiGenerationService;
import com.ranjit.projects.Taskly.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Flux;

import java.awt.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatController {

    private  final AiGenerationService aiGenerationService;
    private final ChatService chatService;

    @PostMapping(value ="/stream",produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<StreamResponse>> streamChat(
            @RequestBody ChatRequest request
    ){
        return aiGenerationService.streamResponse(request.message(),request.projectId())
                .map(data->ServerSentEvent.<StreamResponse>builder()
                .data(data)
                .build())
                // The response is already committed once streaming starts, so an exception here would just
                // cut the connection (ERR_INCOMPLETE_CHUNKED_ENCODING). Send it as an "error" event and end cleanly.
                .onErrorResume(error -> Flux.just(ServerSentEvent.<StreamResponse>builder()
                        .event("error")
                        .data(new StreamResponse(describeAiError(error)))
                        .build()));
    }

    private static String describeAiError(Throwable error) {
        for (Throwable t = error; t != null; t = t.getCause()) {
            if (t instanceof WebClientResponseException http) {
                return switch (http.getStatusCode().value()) {
                    case 429 -> "The AI provider is rate-limiting requests (free daily quota used up or the model is busy). Try again later, or add credit on OpenRouter.";
                    case 402 -> "The OpenRouter account has no credit for this model. Add credit or switch AI_MODEL to a free model in backend/.env.";
                    case 401, 403 -> "The AI API key was rejected. Check AI_API_KEY in backend/.env.";
                    default -> "The AI provider returned an error (" + http.getStatusCode().value() + "). Please try again.";
                };
            }
        }
        return "Generation failed: " + (error.getMessage() != null ? error.getMessage() : "unexpected error");
    }

    @GetMapping("/projects/{projectId}")
    public ResponseEntity<List<ChatResponse>> getChatHistory(
            @PathVariable Long projectId
    ){
        return ResponseEntity.ok(chatService.getProjectChatHistory(projectId));
    }


}
