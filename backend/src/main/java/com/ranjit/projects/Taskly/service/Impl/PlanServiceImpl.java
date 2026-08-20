package com.ranjit.projects.Taskly.service.Impl;

import com.ranjit.projects.Taskly.dto.subscription.PlanResponse;
import com.ranjit.projects.Taskly.service.PlanService;
import org.springframework.stereotype.Service;

import java.util.List;
@Service
public class PlanServiceImpl implements PlanService {
    @Override
    public List<PlanResponse> getAllActivePlans() {
        return List.of();
    }
}
