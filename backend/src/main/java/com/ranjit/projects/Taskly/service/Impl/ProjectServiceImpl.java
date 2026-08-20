package com.ranjit.projects.Taskly.service.Impl;

import com.ranjit.projects.Taskly.dto.project.ProjectRequest;
import com.ranjit.projects.Taskly.dto.project.ProjectResponse;
import com.ranjit.projects.Taskly.dto.project.ProjectSummaryResponse;
import com.ranjit.projects.Taskly.entity.Project;
import com.ranjit.projects.Taskly.entity.ProjectMember;
import com.ranjit.projects.Taskly.entity.ProjectMemberId;
import com.ranjit.projects.Taskly.entity.User;
import com.ranjit.projects.Taskly.enums.ProjectRole;
import com.ranjit.projects.Taskly.error.BadRequestException;
import com.ranjit.projects.Taskly.error.ResourceNotFoundException;
import com.ranjit.projects.Taskly.mapper.ProjectMapper;
import com.ranjit.projects.Taskly.repository.ProjectMemberRepository;
import com.ranjit.projects.Taskly.repository.ProjectRepository;
import com.ranjit.projects.Taskly.repository.UserRepository;
import com.ranjit.projects.Taskly.security.AuthUtil;
import com.ranjit.projects.Taskly.service.ProjectService;
import com.ranjit.projects.Taskly.service.ProjectTemplateService;
import com.ranjit.projects.Taskly.service.SubscriptionService;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal=true,level = AccessLevel.PRIVATE)
@Transactional
public class ProjectServiceImpl implements ProjectService {

    ProjectRepository projectRepository;
    UserRepository userRepository;
    ProjectMapper projectMapper;
    ProjectMemberRepository projectMemberRepository;
    AuthUtil authUtil;
    SubscriptionService subscriptionService;
    ProjectTemplateService projectTemplateService;

    @Override
    public ProjectResponse createProject(ProjectRequest request) {

        if(!subscriptionService.canCreateNewProject()){
            throw new BadRequestException("User cannot create a new project with current Plan,Upgrade plan now.");
        }

        Long userId = authUtil.getCurrentUserId();
//        User owner=userRepository.findById(userId).orElseThrow(()->
//                new ResourceNotFoundException("User ",userId.toString()));

         User owner = userRepository.getReferenceById(userId);

        Project project= Project.builder()
                .name(request.name())
                .isPublic(false)
                .build();
        project=projectRepository.save(project);

        ProjectMemberId projectMemberId=new ProjectMemberId(project.getId(), owner.getId());
        ProjectMember projectMember=ProjectMember.builder()
                .id(projectMemberId)
                .projectRole(ProjectRole.OWNER)
                .user(owner)
                .acceptedAt(Instant.now())
                .invitedAt(Instant.now())
                .project(project)
                .build();
        projectMemberRepository.save(projectMember);

        projectTemplateService.initializeProjectFromTemplate(project.getId());

        return projectMapper.toProjectResponse(project);
    }

    @Override
    public List<ProjectSummaryResponse> getUserProjects() {
        Long userId = authUtil.getCurrentUserId();
        var projectsWithRoles=projectRepository.findAllAccessibleByUser(userId);
        return projectsWithRoles.stream()
                .map(p->projectMapper.toProjectSummaryResponse(p.getProject(),p.getRole()))
                .toList();
    }

    @Override
    @PreAuthorize("@security.canViewProject(#projectId)")
    public ProjectSummaryResponse getUserProjectById(Long projectId) {
        Long userId = authUtil.getCurrentUserId();

       var projectWithRole=projectRepository.findAccessibleProjectByIdWithRole(projectId,userId).orElseThrow(
                ()->new BadRequestException("Project Not Found"));



        return projectMapper.toProjectSummaryResponse(projectWithRole.getProject(),projectWithRole.getRole());
    }



    @Override
    @PreAuthorize("@security.canViewProject(#projectId)")
    public ProjectResponse updateProject(Long projectId, ProjectRequest request) {
        Long userId = authUtil.getCurrentUserId();
        Project project=getAccessibleProjectById(projectId,userId);


        project.setName(request.name());
        project=projectRepository.save(project);
        return projectMapper.toProjectResponse(project);
    }

    @Override
    @PreAuthorize("@security.canDeleteProject(#projectId)")
    public void softDelete(Long projectId) {
        Long userId = authUtil.getCurrentUserId();
        Project project=getAccessibleProjectById(projectId,userId);


        project.setDeletedAt(Instant.now());
        projectRepository.save(project);
    }

    /// INTERNAL FUNCTION
    public Project getAccessibleProjectById(Long projectId, Long userId) {
        return projectRepository.findAccessibleProjectById(projectId,userId).
                orElseThrow(() -> new ResourceNotFoundException("Project",projectId.toString()));
    }
}
