package com.ranjit.projects.Taskly.service;

import com.ranjit.projects.Taskly.dto.subscription.CheckoutRequest;
import com.ranjit.projects.Taskly.dto.subscription.CheckoutResponse;
import com.ranjit.projects.Taskly.dto.subscription.PortalResponse;
import com.ranjit.projects.Taskly.dto.subscription.SubscriptionResponse;
import com.ranjit.projects.Taskly.enums.SubscriptionStatus;

import java.time.Instant;

public interface SubscriptionService {
    SubscriptionResponse getCurrentSubscription();


    void activateSubscription(Long userId, Long planId, String subscriptionId, String customerId);

    void updateSubscription(String gatewaySubscriptionId, SubscriptionStatus status, Instant periodStart, Instant periodEnd, Boolean cancelAtPeriodEnd, Long planId);

    void cancelSubscription(String gatewaySubscriptionId);

    void renewSubscriptionPeriod(String subId, Instant periodStart, Instant periodEnd);

    void markSubscriptionPastDue(String subId);

    boolean canCreateNewProject();
}
