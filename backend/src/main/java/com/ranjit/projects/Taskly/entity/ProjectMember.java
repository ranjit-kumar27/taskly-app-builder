package com.ranjit.projects.Taskly.entity;

import com.ranjit.projects.Taskly.enums.ProjectRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "project_members")
public class ProjectMember {
    @EmbeddedId
    private ProjectMemberId id;

    @ManyToOne
    @MapsId("projectId")
    private Project project;

    @ManyToOne
    @MapsId("userId")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectRole projectRole;

    private Instant invitedAt;
    private Instant acceptedAt;

}
