import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronDown, Code, Eye, LogOut, MessageSquare, Sparkles, Trash, Download, Edit, Users } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useConfirm } from "@/components/ConfirmDialog";
import { SegmentedControl } from "@/components/SegmentedControl";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ChatPanel, ChatMessage } from "@/components/ChatPanel";
import { CodePanel } from "@/components/CodePanel";
import { PreviewPanel } from "@/components/PreviewPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { api, isAuthenticated, removeAuthToken, getUserInfo, removeUserInfo } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { RuntimeErrorAlert, RuntimeError } from "@/components/RuntimeErrorAlert";
import { generateGradient, cn } from "@/lib/utils";
import { ProjectResponse } from "@/lib/types";
import { ShareDialog } from "@/components/ShareDialog";

type ViewMode = "code" | "preview";
type MobilePane = "chat" | ViewMode;

export function ProjectView() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const confirm = useConfirm();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [mobilePane, setMobilePane] = useState<MobilePane>("chat");
  const isMobile = useIsMobile(1024); // phones + tablets get the single-pane layout
  const [updatedFiles, setUpdatedFiles] = useState<Map<string, string>>(new Map());
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [runtimeError, setRuntimeError] = useState<RuntimeError | null>(null);
  const [project, setProject] = useState<ProjectResponse | null>(null);

  // Rename state
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [renameName, setRenameName] = useState("");

  // Track edited files for current streaming response
  const currentEditedFilesRef = useRef<string[]>([]);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [navigate]);

  // Load chat history on mount
  useEffect(() => {
    if (!projectId) return;

    const loadData = async () => {
      setIsLoadingHistory(true);
      try {
        const [history, projectData] = await Promise.all([
          api.getChatHistory(projectId),
          api.getProject(projectId)
        ]);

        const formattedMessages: ChatMessage[] = history.map((msg) => ({
          id: msg.id.toString(),
          role: msg.role === "USER" ? "user" : "assistant",
          content: msg.content,
          createdAt: msg.createdAt,
          events: msg.events,
        }));
        setMessages(formattedMessages);
        setProject(projectData);
      } catch (error) {
        console.error("Failed to load project data:", error);
        toast({
          title: "Error",
          description: "Failed to load project data",
          variant: "destructive"
        });
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadData();
  }, [projectId, toast]);

  const handleLogout = () => {
    removeAuthToken();
    removeUserInfo();
    navigate("/login");
  };

  const handleSendMessage = useCallback((content: string) => {
    if (!projectId) return;

    // Reset edited files tracker
    currentEditedFilesRef.current = [];

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);

    // Create placeholder for AI response
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      role: "assistant",
      content: "",
      isStreaming: true,
      editedFiles: [],
    };

    setMessages((prev) => [...prev, aiMessage]);

    const cleanup = api.streamChat(
      projectId,
      content,
      (chunk) => {
        // Append chunk to streaming message (character by character)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, content: msg.content + chunk, isStreaming: true }
              : msg
          )
        );
      },
      (path, fileContent) => {
        // Update file content
        setUpdatedFiles((prev) => new Map(prev).set(path, fileContent));

        // Track edited file
        if (!currentEditedFilesRef.current.includes(path)) {
          currentEditedFilesRef.current.push(path);
        }

        // Update the message with edited files
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, editedFiles: [...currentEditedFilesRef.current] }
              : msg
          )
        );
      },
      () => {
        // Stream complete
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, isStreaming: false, editedFiles: [...currentEditedFilesRef.current] }
              : msg
          )
        );
        setIsStreaming(false);
      },
      (error) => {
        // Handle error
        toast({
          title: "Chat error",
          description: error.message,
          variant: "destructive",
        });
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, content: error.message || "Sorry, an error occurred.", isStreaming: false }
              : msg
          )
        );
        setIsStreaming(false);
      }
    );

    return cleanup;
  }, [projectId, toast]);

  // Prompt typed on the dashboard: send it as the first message, once, then clear it from history state
  const location = useLocation();
  const initialPromptSentRef = useRef(false);
  useEffect(() => {
    const initialPrompt = (location.state as { initialPrompt?: string } | null)?.initialPrompt;
    if (isLoadingHistory || !initialPrompt || initialPromptSentRef.current) return;
    initialPromptSentRef.current = true;
    navigate(location.pathname, { replace: true, state: null });
    handleSendMessage(initialPrompt);
  }, [isLoadingHistory, location, navigate, handleSendMessage]);

  // Listen for runtime errors from the preview iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security check: ensure message is from our expected source if possible
      // In local dev, origins might be localhost:5173 or localhost:8080

      const data = event.data;
      if (data?.type === 'PreviewError') {
        const error = data.payload;
        console.log("Caught runtime error:", error);
        setRuntimeError({
          message: error.message,
          source: data.subType,
          stack: error.stack,
          filename: error.source, // Map filename from payload source
          lineno: error.lineno,
          colno: error.colno,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleFixError = useCallback((error: RuntimeError) => {
    const prompt = `I encountered a ${error.source || "runtime error"} in my application:
    
Error Message: ${error.message}
${error.filename ? `File: ${error.filename}` : ''}
${error.lineno ? `Line: ${error.lineno}` : ''}

Stack Trace:
${error.stack || "No stack trace available"}

Please analyze this error and fix the code to resolve it.`;

    handleSendMessage(prompt);
    setRuntimeError(null);
  }, [handleSendMessage]);

  const handleDeleteProject = async () => {
    if (!projectId) return;
    const ok = await confirm({
      title: `Delete “${project?.name ?? "this project"}”?`,
      description: "This permanently deletes the project, its files and its chat history. This can't be undone.",
      confirmText: "Delete project",
      destructive: true,
    });
    if (!ok) return;

    try {
      await api.deleteProject(projectId);
      navigate("/projects");
      toast({ title: "Success", description: "Project deleted successfully" });
    } catch (error) {
      console.error("Failed to delete:", error);
      toast({ title: "Error", description: "Failed to delete project", variant: "destructive" });
    }
  };

  const handleDownloadProject = async () => {
    if (!projectId) return;
    try {
      const blob = await api.downloadProjectZip(projectId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${projectId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Success", description: "Download started" });
    } catch (error) {
      console.error("Failed to download:", error);
      toast({ title: "Error", description: "Failed to download project", variant: "destructive" });
    }
  };

  const openRenameDialog = () => {
    if (project) {
      setRenameName(project.name);
      setIsRenameDialogOpen(true);
    }
  };

  const handleRenameSubmit = async () => {
    if (!projectId || !renameName.trim()) return;

    try {
      const updated = await api.updateProject(projectId, renameName);
      setProject(prev => prev ? { ...prev, name: updated.name } : null);
      setIsRenameDialogOpen(false);
      toast({ title: "Success", description: "Project renamed successfully" });
    } catch (error) {
      console.error("Failed to rename:", error);
      toast({ title: "Error", description: "Failed to rename project", variant: "destructive" });
    }
  };

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Invalid project ID</p>
      </div>
    );
  }

  const initial = (getUserInfo()?.name?.charAt(0) || "U").toUpperCase();
  const canEdit = project?.role !== 'VIEWER';

  const cardClass = "relative h-full overflow-hidden rounded-2xl border border-white/[0.07] bg-card/60 backdrop-blur-xl";
  const chatPanel = (
    <ChatPanel
      messages={messages}
      onSendMessage={handleSendMessage}
      isStreaming={isStreaming}
      isLoading={isLoadingHistory}
      readOnly={!canEdit}
    />
  );
  const codeAndPreview = (
    <>
      <div className={cn("h-full absolute inset-0", viewMode !== "code" && "hidden")}>
        <CodePanel projectId={projectId} updatedFiles={updatedFiles} />
      </div>
      <div className={cn("h-full absolute inset-0", viewMode !== "preview" && "hidden")}>
        <PreviewPanel
          projectId={projectId}
          runtimeError={runtimeError}
          onDismiss={() => setRuntimeError(null)}
          onFix={handleFixError}
        />
      </div>
    </>
  );

  return (
    <div className="relative h-[100dvh] flex flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-aurora" />

      {/* Header: project menu · view switch · actions (switch moves below the header on phones) */}
      <header className="relative z-20 h-14 shrink-0 flex items-center justify-between gap-2 px-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-4 lg:px-4">
        <div className="liquid-glass flex w-fit min-w-0 items-center rounded-full p-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={!project}>
              <button className="group flex min-w-0 items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3 transition-colors hover:bg-white/[0.06] data-[state=open]:bg-white/[0.06]">
                {project ? (
                  <>
                    <span className="h-5 w-5 shrink-0 rounded-full ring-1 ring-white/20" style={generateGradient(`${project.name}-${project.id}`)} />
                    <span className="truncate text-sm font-medium">{project.name}</span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Loading…</span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={8} className="w-56 rounded-xl p-1.5">
              <DropdownMenuItem onClick={() => navigate("/projects")} className="rounded-lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                All projects
              </DropdownMenuItem>
              {canEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={openRenameDialog} className="rounded-lg">
                    <Edit className="w-4 h-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadProject} className="rounded-lg">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg text-red-400 focus:text-red-400" onClick={handleDeleteProject}>
                    <Trash className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <SegmentedControl<ViewMode>
          value={viewMode}
          onChange={setViewMode}
          className="hidden w-[200px] lg:grid"
          options={[
            { value: "preview", label: <><Eye className="h-3.5 w-3.5" />Preview</> },
            { value: "code", label: <><Code className="h-3.5 w-3.5" />Code</> },
          ]}
        />

        <div className="flex shrink-0 items-center justify-end gap-2">
          <ShareDialog
            projectId={projectId}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                aria-label="Share"
                className="liquid-glass h-8 w-8 rounded-full p-0 text-[13px] hover:bg-white/10 sm:w-auto sm:px-4"
                disabled={!canEdit}
              >
                <Users className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            }
          />
          {canEdit && (
            <Button size="sm" className="h-8 rounded-full px-3.5 text-[13px] sm:px-4">
              Publish
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Account"
                className="ml-1 rounded-full p-[1.5px] transition-transform hover:scale-105"
                style={generateGradient(getUserInfo()?.username || "user")}
              >
                <Avatar className="h-7 w-7 border-2 border-background">
                  <AvatarFallback className="bg-secondary text-foreground text-xs font-semibold">{initial}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10} className="w-60 rounded-xl p-1.5">
              <div className="flex items-center gap-3 px-2 py-2">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarFallback className="bg-secondary text-foreground text-sm font-semibold">{initial}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{getUserInfo()?.name || "User"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {project?.role ? `${project.role.charAt(0)}${project.role.slice(1).toLowerCase()} of this project` : getUserInfo()?.username}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              {canEdit && (
                <DropdownMenuItem className="rounded-lg">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upgrade plan
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleLogout} className="rounded-lg text-red-400 focus:text-red-400">
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Phones: one pane at a time, switched here */}
      <div className="relative z-10 shrink-0 px-3 pb-3 lg:hidden">
        <SegmentedControl<MobilePane>
          value={mobilePane}
          onChange={(pane) => {
            setMobilePane(pane);
            if (pane !== "chat") setViewMode(pane);
          }}
          className="w-full"
          options={[
            { value: "chat", label: <><MessageSquare className="h-3.5 w-3.5" />Chat</> },
            { value: "preview", label: <><Eye className="h-3.5 w-3.5" />Preview</> },
            { value: "code", label: <><Code className="h-3.5 w-3.5" />Code</> },
          ]}
        />
      </div>

      {/* Main Content: floating cards with breathing room */}
      <div className="relative z-10 flex-1 overflow-hidden px-3 pb-3">
        {isMobile ? (
          <div className={cardClass}>
            <div className={cn("absolute inset-0", mobilePane !== "chat" && "hidden")}>{chatPanel}</div>
            <div className={cn("absolute inset-0", mobilePane === "chat" && "hidden")}>{codeAndPreview}</div>
          </div>
        ) : (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={34} minSize={25} maxSize={50}>
              <div className={cardClass}>{chatPanel}</div>
            </ResizablePanel>

            <ResizableHandle className="mx-1 w-1.5 rounded-full bg-transparent transition-colors hover:bg-white/10 data-[resize-handle-active]:bg-white/20" />

            <ResizablePanel defaultSize={66} minSize={50} maxSize={75}>
              <div className={cardClass}>{codeAndPreview}</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRenameSubmit} disabled={!renameName.trim() || renameName === project?.name}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
