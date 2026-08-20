package com.ranjit.projects.Taskly.repository;

import com.ranjit.projects.Taskly.entity.Subscription;
import com.ranjit.projects.Taskly.enums.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.Optional;
import java.util.Set;

public interface SubscriptionRepository  extends JpaRepository<Subscription, Long> {

    /*
    * Get the current active subscription
    * */
    Optional<Subscription> findByUserIdAndStatusIn(Long userId, Set<SubscriptionStatus> statusSet);

    boolean existsByStripeSubscriptionId(String subscriptionId);

    Optional<Subscription> findByStripeSubscriptionId(String gatewaySubscriptionId);
}
