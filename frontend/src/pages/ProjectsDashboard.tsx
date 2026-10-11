import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, ArrowUpRight, FilePlus, LogOut, Plus, Sparkles, Search, Loader2, MoreHorizontal, Trash, Download, Edit, X } from "lucide-react";
import { SegmentedControl } from "@/components/SegmentedControl";
import { formatDistanceToNow } from "date-fns";
import { Logo } from "@/components/Logo";
import { useConfirm } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { api, removeAuthToken, removeUserInfo, getUserInfo } from "@/lib/api";
import { ProjectSummaryResponse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { generateGradient, cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const PROMPT_IDEAS = [
    "Todo app with tags",
    "Expense tracker dashboard",
    "Portfolio landing page",
    "Pomodoro timer",
];

type RoleTab = "all" | "owned" | "shared";
const ROLE_TABS: { key: RoleTab; label: string; match: (p: ProjectSummaryResponse) => boolean }[] = [
    { key: "all", label: "All", match: () => true },
    { key: "owned", label: "Owned", match: (p) => !p.role || p.role === "OWNER" },
    { key: "shared", label: "Shared", match: (p) => !!p.role && p.role !== "OWNER" },
];

// Turn a free-form prompt into a short project name, cut at a word boundary
const nameFromPrompt = (text: string) => {
    const clean = text.trim().replace(/\s+/g, " ");
    if (clean.length <= 40) return clean;
    const cut = clean.slice(0, 40);
    return cut.slice(0, cut.lastIndexOf(" ") > 20 ? cut.lastIndexOf(" ") : 40) + "…";
};

export function ProjectsDashboard() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const confirm = useConfirm();
    const [prompt, setPrompt] = useState("");
    const promptRef = useRef<HTMLTextAreaElement>(null);

    // Navbar turns more solid once the page scrolls
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Ctrl/⌘ + K jumps to project search
    const searchRef = useRef<HTMLInputElement>(null);
    const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                searchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                searchRef.current?.focus({ preventScroll: true });
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);
    const [projects, setProjects] = useState<ProjectSummaryResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<RoleTab>("all");
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Rename state
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [projectToRename, setProjectToRename] = useState<ProjectSummaryResponse | null>(null);
    const [renameName, setRenameName] = useState("");

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const data = await api.getProjects();
            setProjects(data);
        } catch (error) {
            console.error("Failed to fetch projects:", error);
            toast({
                title: "Error",
                description: "Failed to load projects. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) return;

        setIsCreating(true);
        try {
            const newProject = await api.createProject(newProjectName);
            setProjects([newProject, ...projects]);
            setNewProjectName("");
            setIsDialogOpen(false);
            toast({
                title: "Success",
                description: "Project created successfully",
            });
            // Optionally navigate to the new project immediately
            // navigate(`/projects/${newProject.id}`);
        } catch (error) {
            console.error("Failed to create project:", error);
            toast({
                title: "Error",
                description: "Failed to create project",
                variant: "destructive",
            });
        } finally {
            setIsCreating(false);
        }
    };

    // Create a project from the hero prompt and open it; ProjectView sends the prompt as the first message
    const handleStartFromPrompt = async () => {
        const text = prompt.trim();
        if (!text || isCreating) return;

        setIsCreating(true);
        try {
            const project = await api.createProject(nameFromPrompt(text));
            navigate(`/projects/${project.id}`, { state: { initialPrompt: text } });
        } catch (error) {
            console.error("Failed to create project:", error);
            toast({ title: "Error", description: "Failed to create project", variant: "destructive" });
            setIsCreating(false);
        }
    };

    const handleDeleteProject = async (e: React.MouseEvent, projectId: number) => {
        e.stopPropagation();
        const name = projects.find((p) => p.id === projectId)?.name ?? "this project";
        const ok = await confirm({
            title: `Delete “${name}”?`,
            description: "This permanently deletes the project, its files and its chat history. This can't be undone.",
            confirmText: "Delete project",
            destructive: true,
        });
        if (!ok) return;

        try {
            await api.deleteProject(projectId.toString());
            setProjects(projects.filter(p => p.id !== projectId));
            toast({ title: "Success", description: "Project deleted successfully" });
        } catch (error) {
            console.error("Failed to delete:", error);
            toast({ title: "Error", description: "Failed to delete project", variant: "destructive" });
        }
    };

    const handleDownloadProject = async (e: React.MouseEvent, projectId: number) => {
        e.stopPropagation();
        try {
            const blob = await api.downloadProjectZip(projectId.toString());
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

    const handleRenameClick = (e: React.MouseEvent, project: ProjectSummaryResponse) => {
        e.stopPropagation();
        setProjectToRename(project);
        setRenameName(project.name);
        setIsRenameDialogOpen(true);
    };

    const handleRenameSubmit = async () => {
        if (!projectToRename || !renameName.trim()) return;

        try {
            await api.updateProject(projectToRename.id.toString(), renameName);
            setProjects(projects.map(p => p.id === projectToRename.id ? { ...p, name: renameName } : p));
            setIsRenameDialogOpen(false);
            setProjectToRename(null);
            toast({ title: "Success", description: "Project renamed successfully" });
        } catch (error) {
            console.error("Failed to rename:", error);
            toast({ title: "Error", description: "Failed to rename project", variant: "destructive" });
        }
    };

    const handleLogout = () => {
        removeAuthToken();
        removeUserInfo();
        navigate("/login");
    };

    const activeTab = ROLE_TABS.find((t) => t.key === roleFilter)!;
    const filteredProjects = projects
        .filter((project) => activeTab.match(project) && project.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const firstName = getUserInfo()?.name?.split(" ")[0];

    const focusPrompt = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        promptRef.current?.focus();
    };

    const focusSearch = () => {
        searchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        searchRef.current?.focus({ preventScroll: true });
    };

    return (
        <div className="relative min-h-screen bg-background">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-grid" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-spotlight" />
            <div className="pointer-events-none fixed inset-0 bg-aurora" />

            {/* Floating island navbar: content-width, centered */}
            <header className="pointer-events-none sticky top-0 z-40 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4">
                <nav
                    className={cn(
                        "liquid-glass pointer-events-auto flex items-center gap-1 rounded-full p-1.5 transition-colors duration-300",
                        scrolled && "bg-background/60"
                    )}
                >
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        aria-label="Taskly home"
                        className="flex items-center rounded-full py-1 pl-1 pr-1 transition-opacity hover:opacity-80 sm:pl-2 sm:pr-3"
                    >
                        <Logo showText={false} className="sm:hidden" /><Logo className="hidden sm:inline-flex" />
                    </button>

                    <span className="hidden h-5 w-px bg-border sm:block" />

                    <span className="relative hidden px-3 py-1.5 text-sm font-medium text-foreground sm:block">
                        Projects
                        <span className="absolute inset-x-3 -bottom-[7px] h-px bg-gradient-to-r from-transparent via-foreground/70 to-transparent" />
                    </span>

                    <button
                        onClick={focusSearch}
                        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                        <Search className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Search</span>
                        <kbd className="hidden rounded-md border border-border bg-background/60 px-1.5 py-0.5 font-mono text-[10px] leading-none text-muted-foreground whitespace-nowrap sm:inline">
                            {isMac ? "⌘K" : "Ctrl K"}
                        </kbd>
                    </button>

                    <span className="h-5 w-px bg-border" />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" className="h-8 w-8 rounded-full p-0 text-[13px] sm:w-auto sm:px-3">
                                <Plus className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">New</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={12} className="w-64 rounded-xl p-1.5">
                            <DropdownMenuItem onClick={focusPrompt} className="cursor-pointer items-start gap-3 rounded-lg p-2.5">
                                <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium">Describe an app</p>
                                    <p className="text-xs text-muted-foreground">Let Taskly generate it from a prompt</p>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsDialogOpen(true)} className="cursor-pointer items-start gap-3 rounded-lg p-2.5">
                                <FilePlus className="mt-0.5 h-4 w-4 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium">Blank project</p>
                                    <p className="text-xs text-muted-foreground">Start from the starter template</p>
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                aria-label="Account"
                                className="ml-0.5 rounded-full p-[1.5px] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                style={generateGradient(getUserInfo()?.username || "user")}
                            >
                                <Avatar className="h-7 w-7 border-2 border-background">
                                    <AvatarFallback className="bg-secondary text-foreground text-xs font-semibold">
                                        {(getUserInfo()?.name?.charAt(0) || "U").toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={12} className="w-60 rounded-xl p-1.5">
                            <div className="flex items-center gap-3 px-2 py-2">
                                <Avatar className="h-9 w-9 border border-border">
                                    <AvatarFallback className="bg-secondary text-foreground text-sm font-semibold">
                                        {(getUserInfo()?.name?.charAt(0) || "U").toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{getUserInfo()?.name || "User"}</p>
                                    <p className="truncate text-xs text-muted-foreground">{getUserInfo()?.username || ""}</p>
                                </div>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer rounded-lg text-red-400 focus:text-red-400">
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </nav>
            </header>

            <main className="relative mx-auto max-w-6xl px-6 pb-24">
                {/* Hero + prompt composer */}
                <section className="mx-auto flex max-w-2xl flex-col items-center pt-20 pb-16 text-center animate-fade-in">
                    <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {firstName ? `Welcome back, ${firstName}` : "Welcome to Taskly"}
                    </span>
                    <h1 className="gradient-text text-4xl sm:text-5xl font-semibold tracking-tight">
                        What do you want to build?
                    </h1>
                    <p className="mt-4 text-muted-foreground">
                        Describe an app in plain English. Taskly writes the code and runs it live.
                    </p>

                    <form
                        onSubmit={(e) => { e.preventDefault(); handleStartFromPrompt(); }}
                        className="liquid-glass mt-10 w-full rounded-3xl p-2 text-left"
                    >
                        <Textarea
                            ref={promptRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleStartFromPrompt();
                                }
                            }}
                            placeholder="A habit tracker with streaks, a weekly heatmap and dark mode..."
                            rows={3}
                            disabled={isCreating}
                            className="min-h-[96px] resize-none border-0 bg-transparent px-3 py-2 text-[15px] placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                        <div className="flex items-center justify-end px-2 pb-1">
                            <Button type="submit" size="icon" disabled={!prompt.trim() || isCreating} className="h-8 w-8 rounded-full">
                                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {PROMPT_IDEAS.map((idea) => (
                            <button
                                key={idea}
                                onClick={() => setPrompt(idea)}
                                className="rounded-full border border-border bg-card/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                            >
                                {idea}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Recent projects */}
                <section>
                    {/* Title on the left, glass search + filter grouped on the right */}
                    <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight">Your projects</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Newest first. Click a project to open it.</p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <label className="liquid-glass group flex h-10 w-full items-center gap-2.5 rounded-full pl-4 pr-1.5 transition-[width] duration-300 sm:w-64 sm:focus-within:w-80">
                                <Search className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-focus-within:text-foreground" />
                                <input
                                    ref={searchRef}
                                    placeholder="Search projects"
                                    className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery ? (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        aria-label="Clear search"
                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                ) : (
                                    <kbd className="hidden h-7 shrink-0 items-center whitespace-nowrap rounded-full bg-white/[0.06] px-2.5 font-mono text-[10px] text-muted-foreground sm:flex">
                                        {isMac ? "⌘K" : "Ctrl K"}
                                    </kbd>
                                )}
                            </label>

                            <SegmentedControl<RoleTab>
                                value={roleFilter}
                                onChange={setRoleFilter}
                                className="h-10 w-full sm:w-auto"
                                options={ROLE_TABS.map((tab) => ({
                                    value: tab.key,
                                    label: (
                                        <>
                                            {tab.label}
                                            <span className="text-[11px] text-muted-foreground">{projects.filter(tab.match).length}</span>
                                        </>
                                    ),
                                }))}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border py-16 text-center">
                            <p className="text-sm font-medium">
                                {searchQuery ? `No projects match "${searchQuery}"` : projects.length ? "Nothing here yet" : "No projects yet"}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {searchQuery ? "Try a different search." : projects.length ? "Projects shared with you will show up here." : "Describe your first app above to get started."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredProjects.map((project) => (
                                <div
                                    key={project.id}
                                    role="link"
                                    tabIndex={0}
                                    onClick={() => navigate(`/projects/${project.id}`)}
                                    onKeyDown={(e) => e.key === "Enter" && navigate(`/projects/${project.id}`)}
                                    className="liquid-glass group cursor-pointer rounded-[20px] p-1.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[inset_0_1px_0_hsl(0_0%_100%/0.18),0_20px_50px_-12px_rgb(0_0_0/0.7)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    {/* Inset preview: tinted backdrop with a small app-window mock */}
                                    <div
                                        className="relative aspect-[16/10] overflow-hidden rounded-[14px]"
                                        style={generateGradient(`${project.name}-${project.id}`)}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/60" />
                                        {project.thumbnailUrl ? (
                                            <img
                                                src={project.thumbnailUrl}
                                                alt={project.name}
                                                className="absolute inset-0 h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="absolute inset-x-7 bottom-0 top-7 overflow-hidden rounded-t-lg border border-b-0 border-white/15 bg-black/40 shadow-2xl backdrop-blur-md transition-transform duration-500 ease-out group-hover:-translate-y-1.5">
                                                <div className="flex items-center gap-1 border-b border-white/10 px-2.5 py-2">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
                                                    <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
                                                    <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
                                                    <span className="ml-2 h-1.5 w-16 rounded-full bg-white/10" />
                                                </div>
                                                <div className="space-y-2 p-3">
                                                    <div className="h-2 w-1/3 rounded-full bg-white/40" />
                                                    <div className="h-1.5 w-3/4 rounded-full bg-white/15" />
                                                    <div className="grid grid-cols-3 gap-1.5 pt-1.5">
                                                        <div className="h-8 rounded-md bg-white/10" />
                                                        <div className="h-8 rounded-md bg-white/10" />
                                                        <div className="h-8 rounded-md bg-white/10" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <span className="liquid-glass absolute right-2.5 top-2.5 flex translate-y-1 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                                            Open
                                            <ArrowUpRight className="h-3 w-3" />
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 px-2 pb-1 pt-3">
                                        <span
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-sm font-semibold text-white ring-1 ring-inset ring-white/15"
                                            style={generateGradient(`${project.name}-${project.id}`)}
                                        >
                                            {project.name.charAt(0).toUpperCase()}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate text-sm font-medium">{project.name}</p>
                                                {project.role && project.role !== "OWNER" && (
                                                    <span className={cn(
                                                        "shrink-0 rounded-full px-1.5 py-px text-[10px] font-medium capitalize",
                                                        project.role === "EDITOR" ? "bg-amber-400/10 text-amber-300" : "bg-white/[0.06] text-muted-foreground"
                                                    )}>
                                                        {project.role.toLowerCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-white/[0.08] hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100 focus-visible:opacity-100">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl p-1.5">
                                                <DropdownMenuItem className="rounded-lg" onClick={(e) => handleRenameClick(e, project)}>
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Rename
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-lg" onClick={(e) => handleDownloadProject(e, project.id)}>
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-lg text-red-400 focus:text-red-400" onClick={(e) => handleDeleteProject(e, project.id)}>
                                                    <Trash className="w-4 h-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* Blank project dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader className="items-center text-center sm:items-start sm:text-left">
                        {/* Live badge: initial + color follow the name as you type */}
                        <span
                            className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-semibold text-white ring-1 ring-inset ring-white/20 transition-all duration-300"
                            style={generateGradient(newProjectName.trim() || "new-project")}
                        >
                            {newProjectName.trim() ? newProjectName.trim().charAt(0).toUpperCase() : <FilePlus className="h-5 w-5" />}
                        </span>
                        <DialogTitle className="text-xl">New blank project</DialogTitle>
                        <DialogDescription>
                            Starts from the React + Tailwind starter. You can rename it anytime.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <label htmlFor="new-project-name" className="text-xs font-medium text-muted-foreground">
                            Project name
                        </label>
                        <Input
                            id="new-project-name"
                            autoFocus
                            placeholder="e.g. Habit tracker"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                            className="h-11 rounded-xl border-white/[0.08] bg-white/[0.04] shadow-[inset_0_1px_2px_rgb(0_0_0/0.25)] placeholder:text-muted-foreground/50 focus-visible:border-white/20 focus-visible:bg-white/[0.06] focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                    </div>

                    <DialogFooter className="pt-1">
                        <Button variant="ghost" className="h-10 px-5 hover:bg-white/10" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button className="h-10 px-5" onClick={handleCreateProject} disabled={isCreating || !newProjectName.trim()}>
                            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Create project
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                        <Button onClick={handleRenameSubmit} disabled={!renameName.trim() || renameName === projectToRename?.name}>
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
