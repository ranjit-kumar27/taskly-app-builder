package com.ranjit.projects.Taskly.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class Plan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;

    @Column(unique = true)
    private String stripePriceId;

    private Integer maxProjects;
    private Integer maxTokensPerDay;
    private Integer maxPreviews;//max number of previews allowed per plan
    private Boolean unlimitedAi;//unlimited access to LLM,ignore maxTokensPerDay if true


    private Boolean active;

}
