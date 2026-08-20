package com.ranjit.projects.Taskly.service;

import com.ranjit.projects.Taskly.dto.subscription.UsageTodayResponse;
import com.ranjit.projects.Taskly.dto.subscription.PlanLimitsResponse;

public interface UsageService {
    void recordTokenUsage(Long userId, int actualTokens);
    void checkDailyTokensUsage();

}
