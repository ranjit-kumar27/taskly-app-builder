package com.ranjit.projects.Taskly.repository;

import com.ranjit.projects.Taskly.entity.ProjectMember;
import com.ranjit.projects.Taskly.entity.ProjectMemberId;
import com.ranjit.projects.Taskly.enums.ProjectRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, ProjectMemberId> {

    List<ProjectMember> findByIdProjectId(Long projectId);

    @Query("""
        SELECT pm.projectRole
        FROM ProjectMember pm
        WHERE pm.id.projectId = :projectId
          AND pm.id.userId = :userId
    """)
    Optional<ProjectRole> findRoleByProjectIdAndUserId(@Param("projectId") Long projectId,
                                                       @Param("userId") Long userId);


    @Query("""
            SELECT COUNT(pm) FROM ProjectMember pm
            WHERE pm.id.userId = :userId AND pm.projectRole = 'OWNER'
            """)
    int countProjectOwnedByUser(@Param("userId") Long userId);

}
