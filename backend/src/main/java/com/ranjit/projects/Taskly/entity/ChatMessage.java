package com.ranjit.projects.Taskly.entity;

import com.ranjit.projects.Taskly.enums.MessageRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.aop.target.LazyInitTargetSource;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name="chat_messages")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch =  FetchType.LAZY,optional = false)
    @JoinColumns({
            @JoinColumn(name="project_id",referencedColumnName = "project_id",nullable = false),
            @JoinColumn(name = "user_id",referencedColumnName = "user_id",nullable = false)
    })
    private ChatSession chatSession;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageRole role;//USER ASSISTANT

    @OneToMany(mappedBy = "chatMessage",cascade =CascadeType.ALL,fetch = FetchType.LAZY)
    @OrderBy("sequenceOrder ASC")
    List<ChatEvent> events;//empty unless ASSISTANT role

    @Column(columnDefinition = "text")
    private String content;//NULL unless User role

    private Integer tokensUsed=0;
    @CreationTimestamp
    private Instant createdAt;
}
