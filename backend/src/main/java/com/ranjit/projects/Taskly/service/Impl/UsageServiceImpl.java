package com.ranjit.projects.Taskly.service.Impl;

import com.ranjit.projects.Taskly.dto.subscription.PlanResponse;
import com.ranjit.projects.Taskly.dto.subscription.SubscriptionResponse;
import com.ranjit.projects.Taskly.entity.Subscription;
import com.ranjit.projects.Taskly.entity.UsageLog;
import com.ranjit.projects.Taskly.repository.UsageLogRepository;
import com.ranjit.projects.Taskly.security.AuthUtil;
import com.ranjit.projects.Taskly.service.SubscriptionService;
import com.ranjit.projects.Taskly.service.UsageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

@RequiredArgsConstructor
@Service
public class UsageServiceImpl implements UsageService {

    private final UsageLogRepository usageLogRepository;
    private final AuthUtil authUtil;
    private final SubscriptionService subscriptionService;

    @Override
    public void recordTokenUsage(Long userId, int actualTokens) {
        LocalDate today = LocalDate.now();

        UsageLog todayLog = usageLogRepository.findByUserIdAndDate(userId, today).
                orElseGet(() -> createNewDailyLog(userId, today));

        todayLog.setTokensUsed(todayLog.getTokensUsed() + actualTokens);
        usageLogRepository.save(todayLog);
    }


    @Override
    public void checkDailyTokensUsage() {
        Long userId = authUtil.getCurrentUserId();
        SubscriptionResponse subscriptionResponse=subscriptionService.getCurrentSubscription();
        PlanResponse plan=subscriptionResponse.plan();

        LocalDate today = LocalDate.now();

        UsageLog todayLog = usageLogRepository.findByUserIdAndDate(userId, today).
                orElseGet(() -> createNewDailyLog(userId, today));


        if(plan.unlimitedAi())return;
        int currentUsage=todayLog.getTokensUsed();
        int limit=plan.maxTokenPerDay();
        if(currentUsage >= limit) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Daily limit reached, Upgrade now");
        }

    }

    private UsageLog createNewDailyLog(Long userId, LocalDate date) {
        UsageLog newLog = UsageLog.builder()
                .userId(userId)
                .date(date)
                .tokensUsed(0)
                .build();
        return usageLogRepository.save(newLog);
    }
}
