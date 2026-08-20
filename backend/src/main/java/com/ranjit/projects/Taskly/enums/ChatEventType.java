package com.ranjit.projects.Taskly.enums;

public enum ChatEventType {
    THOUGHT,  // "Thought for 2s"
    MESSAGE,  // Standard conversation text
    FILE_EDIT,// code generation file
    TOOL_LOG // "Reading file.." <tool>
}
