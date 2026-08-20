package com.ranjit.projects.Taskly.service;

import com.ranjit.projects.Taskly.dto.subscription.PlanResponse;

import java.util.List;

public interface PlanService {
    List<PlanResponse> getAllActivePlans();
}
