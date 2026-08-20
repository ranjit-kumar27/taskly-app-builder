package com.ranjit.projects.Taskly.service.Impl;

import com.ranjit.projects.Taskly.dto.subscription.CheckoutRequest;
import com.ranjit.projects.Taskly.dto.subscription.CheckoutResponse;
import com.ranjit.projects.Taskly.dto.subscription.PortalResponse;
import com.ranjit.projects.Taskly.dto.subscription.SubscriptionResponse;
import com.ranjit.projects.Taskly.entity.Plan;
import com.ranjit.projects.Taskly.entity.Subscription;
import com.ranjit.projects.Taskly.entity.User;
import com.ranjit.projects.Taskly.enums.SubscriptionStatus;
import com.ranjit.projects.Taskly.error.ResourceNotFoundException;
import com.ranjit.projects.Taskly.mapper.SubscriptionMapper;
import com.ranjit.projects.Taskly.repository.PlanRepository;
import com.ranjit.projects.Taskly.repository.ProjectMemberRepository;
import com.ranjit.projects.Taskly.repository.SubscriptionRepository;
import com.ranjit.projects.Taskly.repository.UserRepository;
import com.ranjit.projects.Taskly.security.AuthUtil;
import com.ranjit.projects.Taskly.service.SubscriptionService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionServiceImpl implements SubscriptionService {

    private final AuthUtil authUtil;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionMapper subscriptionMapper;
    private final UserRepository userRepository;
    private final PlanRepository planRepository;
    private final ProjectMemberRepository projectMemberRepository;

    private final Integer FREE_TIER_PROJECTS_ALLOWED=100;

    @Override
    public SubscriptionResponse getCurrentSubscription() {
        Long userId = authUtil.getCurrentUserId();
        var currentSubscription = subscriptionRepository.findByUserIdAndStatusIn(userId, Set.of(
                SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE,
                SubscriptionStatus.TRIALING)).orElse(
                        new Subscription()
        );

        return subscriptionMapper.toSubscriptionResponse(currentSubscription);
    }

    @Override
    public void activateSubscription(Long userId, Long planId, String subscriptionId, String customerId) {

        boolean exists=subscriptionRepository.existsByStripeSubscriptionId(subscriptionId);
        if(exists)return;

        User user = getUser(userId);
        Plan plan = getPlan(planId);
        Subscription subscription=Subscription.builder()
                .user(user)
                .plan(plan)
                .stripeSubscriptionId(subscriptionId)
                .status(SubscriptionStatus.INCOMPLETE)
                .build();

        subscriptionRepository.save(subscription);
    }

    @Override
    @Transactional
    public void updateSubscription(String gatewaySubscriptionId, SubscriptionStatus status, Instant periodStart,
                                   Instant periodEnd, Boolean cancelAtPeriodEnd, Long planId) {

        Subscription subscription=getSubscription(gatewaySubscriptionId);

        boolean hasSubscriptionUpdated = false;

        if(status!=null && status!=subscription.getStatus()){
            subscription.setStatus(status);
            hasSubscriptionUpdated = true;
        }

        if (periodStart != null && !periodStart.equals(subscription.getCurrentPeriodStart())) {
            subscription.setCurrentPeriodStart(periodStart);
            hasSubscriptionUpdated = true;
        }
        if(periodEnd != null && !periodEnd.equals(subscription.getCurrentPeriodEnd())) {
            subscription.setCurrentPeriodEnd(periodEnd);
            hasSubscriptionUpdated = true;
        }

        if(cancelAtPeriodEnd != null && cancelAtPeriodEnd!=subscription.getCancelAtPeriodEnd()){
            subscription.setCancelAtPeriodEnd(cancelAtPeriodEnd);
            hasSubscriptionUpdated = true;
        }

        if (planId !=null && !planId.equals(subscription.getPlan().getId())) {
            Plan newPlan =getPlan(planId);
            subscription.setPlan(newPlan);
        }

        if(hasSubscriptionUpdated) {
            log.debug("Subscription has been updated: {}", gatewaySubscriptionId);
            subscriptionRepository.save(subscription);
        }

    }

    @Override
    public void cancelSubscription(String gatewaySubscriptionId) {
        Subscription subscription=getSubscription(gatewaySubscriptionId);
        subscription.setStatus(SubscriptionStatus.CANCELED);
        subscriptionRepository.save(subscription);

    }

    @Override
    public void renewSubscriptionPeriod(String gatewaySubscriptionId, Instant periodStart, Instant periodEnd) {

        Subscription subscription= getSubscription(gatewaySubscriptionId);
        Instant newStart=periodStart!=null?periodStart:subscription.getCurrentPeriodEnd();
        subscription.setCurrentPeriodStart(newStart);
        subscription.setCurrentPeriodEnd(periodEnd);
        if(subscription.getStatus()==SubscriptionStatus.PAST_DUE ||subscription.getStatus()==SubscriptionStatus.INCOMPLETE ) {
            subscription.setStatus(SubscriptionStatus.ACTIVE);
        }

        subscriptionRepository.save(subscription);
    }



    @Override
    public void markSubscriptionPastDue(String gatewaySubscriptionId) {
        Subscription subscription = getSubscription(gatewaySubscriptionId);
        if(subscription.getStatus()==SubscriptionStatus.PAST_DUE) {
            log.debug("Subscription is already past due,gatewaySubscriptionId:{}",gatewaySubscriptionId);
            return;
        }
        subscription.setStatus(SubscriptionStatus.PAST_DUE);
        subscriptionRepository.save(subscription);

        //Notify user via email
    }



    @Override
    public boolean canCreateNewProject() {
        Long userId = authUtil.getCurrentUserId();
        SubscriptionResponse currentSubscription = getCurrentSubscription();

        int countOfOwnedProject= projectMemberRepository.countProjectOwnedByUser(userId);

        if(currentSubscription.plan()==null){
            return countOfOwnedProject < FREE_TIER_PROJECTS_ALLOWED;
        }

        return countOfOwnedProject < currentSubscription.plan().maxProjects();
    }

    // utility method
    private User getUser(Long userId) {
        return userRepository.findById(userId).orElseThrow(
                ()->new ResourceNotFoundException("User",userId.toString()));
    }

    private Plan getPlan(Long planId) {
        return planRepository.findById(planId).orElseThrow(()->
                new ResourceNotFoundException("plan",planId.toString()));
    }


    private @NonNull Subscription getSubscription(String gatewaySubscriptionId) {
        return subscriptionRepository.findByStripeSubscriptionId(gatewaySubscriptionId).orElseThrow(() ->
                new ResourceNotFoundException("Subscription", gatewaySubscriptionId));
    }
}
