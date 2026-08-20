package com.ranjit.projects.Taskly.entity;

import com.ranjit.projects.Taskly.enums.SubscriptionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Subscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false,name = "user_Id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false,name = "plan_Id")
    private Plan plan;

    @Enumerated(value = EnumType.STRING)
    private SubscriptionStatus status;

    private String stripeSubscriptionId;// can be renamed to gatewaySubscriptionId

    private Instant currentPeriodStart;
    private Instant currentPeriodEnd;
    private Boolean cancelAtPeriodEnd;

    @CreationTimestamp
    private Instant createdAt;
    @UpdateTimestamp
    private Instant updatedAt;

}
