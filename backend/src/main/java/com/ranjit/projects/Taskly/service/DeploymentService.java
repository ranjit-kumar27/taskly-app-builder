package com.ranjit.projects.Taskly.service;

import com.ranjit.projects.Taskly.dto.deploy.DeployResponse;

public interface DeploymentService {

    DeployResponse deploy(Long projectId);
}
