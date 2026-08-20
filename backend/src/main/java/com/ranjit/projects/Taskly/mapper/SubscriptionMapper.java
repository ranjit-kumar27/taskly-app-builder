package com.ranjit.projects.Taskly.mapper;

import com.ranjit.projects.Taskly.dto.subscription.PlanResponse;
import com.ranjit.projects.Taskly.dto.subscription.SubscriptionResponse;
import com.ranjit.projects.Taskly.entity.Plan;
import com.ranjit.projects.Taskly.entity.Subscription;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface SubscriptionMapper {

    SubscriptionResponse toSubscriptionResponse(Subscription subscription);

    PlanResponse toPlanResponse(Plan plan);

}
