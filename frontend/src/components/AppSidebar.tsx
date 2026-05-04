import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  Search,
  Plus,
  FolderOpen,
  Folder,
  FileText,
  ChevronRight,
  Trash2,
  Terminal,
  LayoutGrid,
} from "lucide-react";
import { useUIStore } from "@/lib/uiStore";
import {
  useWorkspaces,
  useProjects,
  useProjectNotes,
  useCreateWorkspace,
  useCreateProject,
  useCreateNote,
  useDeleteProject,
  useDeleteNote,
  useDeleteWorkspace,
} from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { CreateWorkspaceModal } from "@/components/modals/CreateWorkspaceModal";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";
import { CreateNoteModal } from "@/components/modals/CreateNoteModal";
import { ConfirmModal } from "@/components/modals/ConfirmModal";

export const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { activeWorkspaceId, setActiveWorkspace } = useUIStore();
  
  console.log("📌 [AppSidebar] Active Workspace ID from store:", activeWorkspaceId);
  
  const { data: workspaces = [] } = useWorkspaces();
  const { data: projects = [] } = useProjects(activeWorkspaceId ?? undefined);
  const createWorkspace = useCreateWorkspace();
  const createProject = useCreateProject();
  const createNote = useCreateNote();
  const deleteProject = useDeleteProject();
  const deleteNote = useDeleteNote();
  const deleteWorkspace = useDeleteWorkspace();

  console.log("📌 [AppSidebar] Workspaces loaded:", workspaces.length, workspaces);
  console.log("📌 [AppSidebar] Projects loaded:", projects.length);

  // Modal states
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "workspace" | "project"; id: string; name: string } | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({});

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];
  
  console.log("📌 [AppSidebar] Active Workspace object:", activeWs);

  useEffect(() => {
    // If no active workspace but workspaces exist, set first one as active
    if (!activeWorkspaceId && workspaces.length > 0) {
      console.log("🟡 [AppSidebar] No active workspace, setting first workspace:", workspaces[0].id);
      setActiveWorkspace(workspaces[0].id);
    }
  }, [activeWorkspaceId, workspaces, setActiveWorkspace]);

  const isActive = (path: string) => location.pathname === path;

  const handleCreateWorkspace = (name: string) => {
    console.log("🔵 [AppSidebar] Creating workspace:", name);
    createWorkspace.mutate(name, {
      onSuccess: (res) => {
        const newId = res.data.id ?? res.data._id;
        console.log("✅ [AppSidebar] Workspace created with ID:", newId);
        setActiveWorkspace(newId);
      },
    });
  };

  const handleDeleteWorkspace = () => {
    if (!activeWs) return;
    console.log("🔴 [AppSidebar] Deleting workspace:", activeWs.id);
    deleteWorkspace.mutate(activeWs.id, {
      onSuccess: () => {
        const remaining = workspaces.filter((w) => w.id !== activeWs.id);
        if (remaining.length > 0) {
          console.log("🟡 [AppSidebar] Switching to remaining workspace:", remaining[0].id);
          setActiveWorkspace(remaining[0].id);
        } else {
          console.log("🟡 [AppSidebar] No workspaces left");
          setActiveWorkspace(null as any);
        }
        navigate("/");
      },
    });
  };

  const handleCreateProject = (name: string, target: string, scope: string) => {
    if (!activeWs) return;
    console.log("🔵 [AppSidebar] Creating project:", { name, target, workspaceId: activeWs.id });
    createProject.mutate(
      { name, workspaceId: activeWs.id, target, scope },
      {
        onSuccess: (res) => {
          const newId = res.data.id ?? res.data._id;
          console.log("✅ [AppSidebar] Project created with ID:", newId);
          setOpenProjects((o) => ({ ...o, [newId]: true }));
          navigate(`/project/${newId}`);
        },
      }
    );
  };

  const handleCreateNote = (title: string) => {
    if (!selectedProjectId) return;
    console.log("🔵 [AppSidebar] Creating note:", { title, projectId: selectedProjectId });
    createNote.mutate(
      { projectId: selectedProjectId, name: title, content: "", tags: [] },
      {
        onSuccess: (res) => {
          const newId = res.data.id ?? res.data._id;
          console.log("✅ [AppSidebar] Note created with ID:", newId);
          setOpenProjects((o) => ({ ...o, [selectedProjectId]: true }));
          navigate(`/note/${newId}`);
        },
      }
    );
  };

  const handleDeleteProject = () => {
    if (!deleteTarget || deleteTarget.type !== "project") return;
    console.log("🔴 [AppSidebar] Deleting project:", deleteTarget.id);
    deleteProject.mutate(deleteTarget.id);
    if (params.projectId === deleteTarget.id) navigate("/");
    setDeleteTarget(null);
  };

  const handleDeleteNote = (noteId: string, projectId: string) => {
    console.log("🔴 [AppSidebar] Deleting note:", noteId);
    deleteNote.mutate({ projectId, noteId });
  };

  const openDeleteWorkspaceConfirm = () => {
    if (!activeWs) return;
    setDeleteTarget({ type: "workspace", id: activeWs.id, name: activeWs.name });
    setConfirmModalOpen(true);
  };

  const openDeleteProjectConfirm = (id: string, name: string) => {
    setDeleteTarget({ type: "project", id, name });
    setConfirmModalOpen(true);
  };

  return (
    <>
      <aside className="w-64 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col h-screen">
        {/* Header */}
        <div className="p-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-md bg-gradient-primary grid place-items-center shadow-glow">
              <Terminal className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-sm font-bold glow-text text-primary">HackLog</div>
              <div className="text-[10px] text-muted-foreground font-mono">research tracker</div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between bg-sidebar-accent border-sidebar-border text-sidebar-foreground hover:bg-secondary h-8 text-xs font-mono"
              >
                <span className="truncate">{activeWs?.name ?? "No workspace"}</span>
                <ChevronRight className="h-3 w-3 rotate-90" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel className="text-xs font-mono">Workspaces</DropdownMenuLabel>
              {workspaces.map((w) => (
                <DropdownMenuItem
                  key={w.id}
                  onClick={() => {
                    console.log("🟡 [AppSidebar] Switching workspace to:", w.id);
                    setActiveWorkspace(w.id);
                  }}
                  className={cn("font-mono text-xs", w.id === activeWs?.id && "text-primary")}
                >
                  {w.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setWorkspaceModalOpen(true)} className="text-xs font-mono">
                <Plus className="h-3 w-3 mr-2" /> New workspace
              </DropdownMenuItem>
              {activeWs && (
                <DropdownMenuItem
                  onClick={openDeleteWorkspaceConfirm}
                  className="text-destructive focus:text-destructive font-mono text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-2" /> Delete workspace
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main nav */}
        <nav className="px-2 py-2 space-y-0.5 border-b border-sidebar-border">
          <NavItem to="/" active={isActive("/")} icon={<LayoutGrid className="h-4 w-4" />} label="Dashboard" />
          <NavItem to="/calendar" active={location.pathname.startsWith("/calendar")} icon={<Calendar className="h-4 w-4" />} label="Calendar" />
          <NavItem to="/timeline" active={isActive("/timeline")} icon={<FileText className="h-4 w-4" />} label="Timeline" />
          <NavItem to="/search" active={isActive("/search")} icon={<Search className="h-4 w-4" />} label="Search" shortcut="⌘K" />
        </nav>

        {/* Projects with notes */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Targets / Projects
            </span>
            <button
              onClick={() => setProjectModalOpen(true)}
              className="text-muted-foreground hover:text-primary"
              title="New project"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {projects.length === 0 && (
            <div className="px-2 py-4 text-xs text-muted-foreground font-mono">
              No targets yet.
              <button onClick={() => setProjectModalOpen(true)} className="block mt-1 text-primary hover:underline">
                + New target
              </button>
            </div>
          )}

          <div className="space-y-0.5">
            {projects.map((p) => {
              const open = openProjects[p.id];
              const isProjectActive = params.projectId === p.id;
              
              return (
                <div key={p.id}>
                  <div
                    className={cn(
                      "group flex items-center gap-1 px-1.5 py-1 rounded text-sm hover:bg-sidebar-accent",
                      isProjectActive && "bg-sidebar-accent"
                    )}
                  >
                    <button
                      onClick={() => setOpenProjects((o) => ({ ...o, [p.id]: !o[p.id] }))}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <ChevronRight className={cn("h-3 w-3 transition-transform", open && "rotate-90")} />
                    </button>
                    <button
                      onClick={() => navigate(`/project/${p.id}`)}
                      className="flex-1 flex items-center gap-1.5 min-w-0 text-left"
                    >
                      {open ? (
                        <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                      ) : (
                        <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span className="truncate font-mono text-xs text-sidebar-foreground">{p.name}</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProjectId(p.id);
                        setNoteModalOpen(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary"
                      title="New note"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => openDeleteProjectConfirm(p.id, p.name)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  
                  {/* Notes inside project - fetch only when open */}
                  {open && <ProjectNotesList projectId={p.id} onDeleteNote={handleDeleteNote} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-sidebar-border">
          <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
            <span>online · synced</span>
          </div>
        </div>
      </aside>

      {/* Modals */}
      <CreateWorkspaceModal
        isOpen={workspaceModalOpen}
        onClose={() => setWorkspaceModalOpen(false)}
        onCreate={handleCreateWorkspace}
        isLoading={createWorkspace.isPending}
      />

      <CreateProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onCreate={handleCreateProject}
        isLoading={createProject.isPending}
      />

      <CreateNoteModal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        onCreate={handleCreateNote}
        isLoading={createNote.isPending}
      />

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={deleteTarget?.type === "workspace" ? handleDeleteWorkspace : handleDeleteProject}
        title={`Delete ${deleteTarget?.type === "workspace" ? "Workspace" : "Project"}`}
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone and will remove all associated notes and data.`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
};

// Fixed ProjectNotesList component with proper array handling
const ProjectNotesList = ({ projectId, onDeleteNote }: { projectId: string; onDeleteNote: (noteId: string, projectId: string) => void }) => {
  const { data: notes, isLoading, error } = useProjectNotes(projectId);
  const navigate = useNavigate();
  const params = useParams();

  // 🔥 SAFETY CHECK: Ensure notes is always an array
  const safeNotes = Array.isArray(notes) ? notes : [];
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="ml-5 border-l border-sidebar-border pl-1 my-0.5">
        <div className="px-2 py-1 text-[10px] text-muted-foreground font-mono animate-pulse">
          Loading notes...
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    console.error("Error loading notes for project", projectId, error);
    return (
      <div className="ml-5 border-l border-sidebar-border pl-1 my-0.5">
        <div className="px-2 py-1 text-[10px] text-destructive font-mono">
          ⚠️ Failed to load notes
        </div>
      </div>
    );
  }

  return (
    <div className="ml-5 border-l border-sidebar-border pl-1 space-y-0.5 my-0.5">
      {safeNotes.length === 0 && (
        <div className="px-2 py-1 text-[10px] text-muted-foreground font-mono">
          No notes yet
        </div>
      )}
      {safeNotes.map((note: any) => {
        const noteActive = params.noteId === note.id;
        return (
          <div
            key={note.id}
            className={cn(
              "group flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:bg-sidebar-accent",
              noteActive && "bg-sidebar-accent text-primary"
            )}
          >
            <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
            <button
              onClick={() => navigate(`/note/${note.id}`)}
              className="flex-1 text-left truncate font-mono"
            >
              {note.name || "Untitled"}
            </button>
            <button
              onClick={() => onDeleteNote(note.id, projectId)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

const NavItem = ({ to, active, icon, label, shortcut }: any) => (
  <NavLink
    to={to}
    className={cn(
      "flex items-center gap-2 px-2 py-1.5 rounded text-sm font-mono hover:bg-sidebar-accent transition-colors",
      active ? "bg-sidebar-accent text-primary" : "text-sidebar-foreground"
    )}
  >
    {icon}
    <span className="flex-1">{label}</span>
    {shortcut && <span className="text-[10px] text-muted-foreground">{shortcut}</span>}
  </NavLink>
);