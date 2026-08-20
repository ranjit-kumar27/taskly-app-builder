package com.ranjit.projects.Taskly.dto.project;

import java.time.Instant;

public record FileNode(
        String path
) {
    @Override
    public String toString() {
        return path;
    }
}
