package com.ranjit.projects.Taskly.service;

import com.ranjit.projects.Taskly.dto.member.InviteMemberRequest;
import com.ranjit.projects.Taskly.dto.member.MemberResponse;
import com.ranjit.projects.Taskly.dto.member.UpdateMemberRoleRequest;

import java.util.List;

public interface ProjectMemberService {
    List<MemberResponse> getProjectMembers(Long projectId);

    MemberResponse inviteMember(Long projectId, InviteMemberRequest request);

    //MemberResponse updateMemberRole(Long projectId, Long memberId, InviteMemberRequest request);

    void  removeProjectMember(Long projectId, Long memberId);

    MemberResponse updateMemberRole(Long projectId, Long memberId, UpdateMemberRoleRequest request);
}
