package com.ranjit.projects.Taskly.mapper;

import com.ranjit.projects.Taskly.dto.member.MemberResponse;
import com.ranjit.projects.Taskly.entity.Project;
import com.ranjit.projects.Taskly.entity.ProjectMember;
import com.ranjit.projects.Taskly.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

@Mapper(componentModel = "spring")
public interface ProjectMemberMapper {

    @Mapping(target = "userId",source = "id")
    @Mapping(target = "role",constant = "OWNER")
    MemberResponse toProjectMemberResponseFromOwner(User owner);

    @Mapping(target = "userId",source = "user.id")
    @Mapping(target = "username",source = "user.username")
    @Mapping(target = "name",source = "user.name")
    @Mapping(target = "role",source = "projectRole")
    MemberResponse toProjectMemberResponseFromMember(ProjectMember projectMember);

}
