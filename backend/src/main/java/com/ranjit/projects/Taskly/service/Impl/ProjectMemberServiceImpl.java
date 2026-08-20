package com.ranjit.projects.Taskly.service.Impl;

import com.ranjit.projects.Taskly.dto.member.InviteMemberRequest;
import com.ranjit.projects.Taskly.dto.member.MemberResponse;
import com.ranjit.projects.Taskly.dto.member.UpdateMemberRoleRequest;
import com.ranjit.projects.Taskly.entity.Project;
import com.ranjit.projects.Taskly.entity.ProjectMember;
import com.ranjit.projects.Taskly.entity.ProjectMemberId;
import com.ranjit.projects.Taskly.entity.User;
import com.ranjit.projects.Taskly.mapper.ProjectMemberMapper;
import com.ranjit.projects.Taskly.repository.ProjectMemberRepository;
import com.ranjit.projects.Taskly.repository.ProjectRepository;
import com.ranjit.projects.Taskly.repository.UserRepository;
import com.ranjit.projects.Taskly.security.AuthUtil;
import com.ranjit.projects.Taskly.service.ProjectMemberService;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
@Service
@FieldDefaults(makeFinal = true,level = AccessLevel.PRIVATE)
@RequiredArgsConstructor
@Transactional
public class ProjectMemberServiceImpl implements ProjectMemberService {

    ProjectMemberRepository projectMemberRepository;
    ProjectRepository projectRepository;
    ProjectMemberMapper projectMemberMapper;
    UserRepository userRepository;
    AuthUtil authUtil;

    @Override
    @PreAuthorize("@security.canViewMembers(#projectId)")
    public List<MemberResponse> getProjectMembers(Long projectId) {
        return projectMemberRepository.findByIdProjectId(projectId)
                .stream()
                .map(projectMemberMapper::toProjectMemberResponseFromMember)
                .toList();

    }

    @Override
    @PreAuthorize("@security.canManageMembers(#projectId)")
    public MemberResponse inviteMember(Long projectId, InviteMemberRequest request) {
        Long userId = authUtil.getCurrentUserId();
        Project project = getAccessibleProjectById(projectId, userId);


        User invitee=userRepository.findByUsername(request.username()).orElseThrow();

        if(invitee.getId().equals(userId)){
            throw new RuntimeException("cannot invite yourself");
        }

        ProjectMemberId projectMemberId = new ProjectMemberId(projectId,invitee.getId());

        if(projectMemberRepository.existsById(projectMemberId)){
            throw new RuntimeException("cannot invite once again");
        }

        ProjectMember member = ProjectMember.builder()
                .id(projectMemberId)
                .project(project)
                .user(invitee)
                .projectRole(request.role())
                .invitedAt(Instant.now())
                .build();

        projectMemberRepository.save(member);


        return projectMemberMapper.toProjectMemberResponseFromMember(member);
    }

    @Override
    @PreAuthorize("@security.canManageMembers(#projectId)")
    public void removeProjectMember(Long projectId, Long memberId) {
        Long userId = authUtil.getCurrentUserId();
        Project project = getAccessibleProjectById(projectId, userId);


        ProjectMemberId projectMemberId = new ProjectMemberId(projectId,memberId);
        if(!projectMemberRepository.existsById(projectMemberId)){
            throw new RuntimeException("member not found in project");
        }
        projectMemberRepository.deleteById(projectMemberId);

    }

    @Override
    @PreAuthorize("@security.canManageMembers(#projectId)")
    public MemberResponse updateMemberRole(Long projectId, Long memberId, UpdateMemberRoleRequest request) {
        Long userId = authUtil.getCurrentUserId();
        Project project = getAccessibleProjectById(projectId, userId);


        ProjectMemberId projectMemberId = new ProjectMemberId(projectId,memberId);
        ProjectMember projectMember = projectMemberRepository.findById(projectMemberId).orElseThrow();

        projectMember.setProjectRole(request.role());

        projectMemberRepository.save(projectMember);


        return projectMemberMapper.toProjectMemberResponseFromMember(projectMember);
    }

    public Project getAccessibleProjectById(Long projectId, Long userId) {
        return projectRepository.findAccessibleProjectById(projectId,userId).orElseThrow();
    }
}
