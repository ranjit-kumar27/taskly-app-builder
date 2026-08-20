package com.ranjit.projects.Taskly.service.Impl;

import com.ranjit.projects.Taskly.dto.chat.StreamResponse;
import com.ranjit.projects.Taskly.entity.*;
import com.ranjit.projects.Taskly.enums.ChatEventType;
import com.ranjit.projects.Taskly.enums.MessageRole;
import com.ranjit.projects.Taskly.error.ResourceNotFoundException;
import com.ranjit.projects.Taskly.llm.LlmResponseParser;
import com.ranjit.projects.Taskly.llm.PromptUtils;
import com.ranjit.projects.Taskly.llm.advisors.FileTreeContextAdvisor;
import com.ranjit.projects.Taskly.llm.tools.CodeGenerationTools;
import com.ranjit.projects.Taskly.repository.*;
import com.ranjit.projects.Taskly.security.AuthUtil;
import com.ranjit.projects.Taskly.service.AiGenerationService;
import com.ranjit.projects.Taskly.service.ProjectFileService;
import com.ranjit.projects.Taskly.service.UsageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
@RequiredArgsConstructor
public class AiGenerationServiceImpl implements AiGenerationService {

    private final ChatClient chatClient;
    private final AuthUtil authUtil;
    private final ProjectFileService projectFileService;
    private final FileTreeContextAdvisor fileTreeContextAdvisor;
    private final ChatSessionRepository chatSessionRepository;
    private final ProjectRepository projectRepository;
    private final LlmResponseParser llmResponseParser;
    private final UserRepository userRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatEventRepository chatEventRepository;
    private final UsageService usageService;

    private static final Pattern FILE_TAG_PATTERN = Pattern.compile("<file path=\"([^\"]+)\">(.*?)</file>", Pattern.DOTALL);

    @Override
    @PreAuthorize("@security.canEditProject(#projectId)")
    public Flux<StreamResponse> streamResponse(String userMessage, Long projectId) {

        // usageService.checkDailyTokensUsage();

        Long userId = authUtil.getCurrentUserId();
        ChatSession chatSession=createChatSessionIfNotExists(projectId,userId);

        Map<String,Object> advisorParams=Map.of(
                "userId",userId,
                "projectId",projectId
        );
        StringBuilder fullResponseBuffer=new StringBuilder();

        CodeGenerationTools codeGenerationTools=new CodeGenerationTools(projectFileService,projectId);

        AtomicReference<Long> startTime=new AtomicReference<>(System.currentTimeMillis());
        AtomicReference<Long> endTime=new AtomicReference<>(0L);
        AtomicReference<Usage> usageRef=new AtomicReference<>();

        return chatClient.prompt()
                .system(PromptUtils.CODE_GENERATION_SYSTEM_PROMPT)
                .user(userMessage)
                .tools(codeGenerationTools)
                .advisors(advisorSpec -> {
                        advisorSpec.params(advisorParams);
                        advisorSpec.advisors(fileTreeContextAdvisor);
                    }
                )
                .stream()
                .chatResponse()
                .doOnNext(response ->{
                    String content =response.getResult().getOutput().getText();

                    if(content!=null && !content.isEmpty() && endTime.get()==0){ //first nonempty chunks
                        endTime.set(System.currentTimeMillis());
                    }

                    if(response.getMetadata().getUsage()!=null){
                        usageRef.set(response.getMetadata().getUsage());
                    }

                    fullResponseBuffer.append(content);
                })
                .doOnComplete(()-> {
                    Schedulers.boundedElastic().schedule(() -> {
                        //parseAndSaveFiles(fullResponseBuffer.toString(), projectId);

                        long duration=(endTime.get()-startTime.get())/1000;

                        finalizeChats(userMessage,chatSession,fullResponseBuffer.toString(),duration,usageRef.get());
                    });
                })
            .doOnError(error->log.error("Error during streaming for projectId: {}",projectId))
                .map(response -> {
                    String text = response.getResult().getOutput().getText();
                    return new StreamResponse(text != null ? text : "");
                });

    }

    private void finalizeChats(String userMessage, ChatSession chatSession,String fullText,Long duration,Usage usage) {
        Long projectId=chatSession.getProject().getId();

        if(usage!=null){
            int totalTokens=usage.getTotalTokens();
            usageService.recordTokenUsage(chatSession.getUser().getId(),totalTokens);
        }

        //save the User message
        chatMessageRepository.save(
                ChatMessage.builder()
                        .chatSession(chatSession)
                        .role(MessageRole.USER)
                        .content(userMessage)
                        .tokensUsed(usage.getPromptTokens())
                        .build()
        );

        ChatMessage assistantChatMessage = ChatMessage.builder()
                .role(MessageRole.ASSISTANT)
                .content("Assistant Message here...")
                .chatSession(chatSession)
                .tokensUsed(usage.getCompletionTokens())
                .build();

        assistantChatMessage = chatMessageRepository.save(assistantChatMessage);

        List<ChatEvent> chatEventList = llmResponseParser.parseChatEvents(fullText, assistantChatMessage);
        chatEventList.addFirst(ChatEvent.builder()
                .type(ChatEventType.THOUGHT)
                .chatMessage(assistantChatMessage)
                .content("Thought for "+duration+"s")
                .sequenceOrder(0)
                .build());

        chatEventList.stream()
                .filter(e -> e.getType() == ChatEventType.FILE_EDIT)
                .forEach(e -> projectFileService.saveFile(projectId, e.getFilePath(), e.getContent()));

        chatEventRepository.saveAll(chatEventList);
    }


//    private void parseAndSaveFiles(String fullResponse, Long projectId) {
//        Matcher matcher = FILE_TAG_PATTERN.matcher(fullResponse);
//
//        while (matcher.find()) {
//            String filePath=matcher.group(1);
//            String fileContent=matcher.group(2).trim();
//
//            projectFileService.saveFile(projectId,filePath,fileContent);
//        }
//
//    }
    private ChatSession createChatSessionIfNotExists(Long projectId, Long userId) {
        ChatSessionId chatSessionId=new ChatSessionId(projectId,userId);
        ChatSession chatSession =chatSessionRepository.findById(chatSessionId).orElse(null);

        if(chatSession==null) {
            Project project=projectRepository.findById(projectId)
                    .orElseThrow(()->new ResourceNotFoundException("Project",projectId.toString()));

            User user=userRepository.findById(userId)
                    .orElseThrow(()->new ResourceNotFoundException("User",userId.toString()));

            chatSession=ChatSession.builder()
                    .id(chatSessionId)
                    .project(project)
                    .user(user)
                    .build();
            chatSession=chatSessionRepository.save(chatSession);
        }
        return chatSession;
    }
}
