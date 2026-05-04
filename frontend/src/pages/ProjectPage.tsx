import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Plus,
  FileText,
  Calendar,
  Trash2,
  Globe,
  ChevronRight,
  Loader2,
  Activity,
  Shield,
  Clock,
  Package,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useProject,
  useUpdateProject,
  useDeleteProject,
  useProjectNotes,
  useCreateNote,
  useProjectVulnerabilities,
  useProjectPayloads,
  useProjectRecon,
  useProjectLogs,
} from "@/hooks/useApi";
import { VulnerabilityPanel } from "@/components/VulnerabilityPanel";
import { PayloadLibrary } from "@/components/PayloadLibrary";
import { ReconDataPanel } from "@/components/ReconDataPanel";
import { CreateNoteModal } from "@/components/modals/CreateNoteModal";
import { ConfirmModal } from "@/components/modals/ConfirmModal";

const ProjectPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  // Modal states
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Get URL parameters for highlighting
  const highlightId = searchParams.get("highlight");
  const activeTab = searchParams.get("tab") || "notes";
  const [tab, setTab] = useState(activeTab);

  // Fetch project data
  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
  } = useProject(projectId!);

  // Mutations
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const createNote = useCreateNote();

  // Fetch related data
  const { data: notes = [] } = useProjectNotes(projectId!);
  const { data: logs = [] } = useProjectLogs(projectId!);
  const { data: vulns = [] } = useProjectVulnerabilities(projectId!);
  const { data: payloads = [] } = useProjectPayloads(projectId!);
  const { data: reconData = [] } = useProjectRecon(projectId!);

  // Scroll to highlighted item when component mounts
  useEffect(() => {
    if (highlightId) {
      setTimeout(() => {
        const element = document.getElementById(`item-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("ring-2", "ring-primary", "animate-pulse");
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-primary", "animate-pulse");
          }, 3000);
        }
      }, 500);
    }
  }, [highlightId, activeTab]);

  if (projectLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="p-8 font-mono text-muted-foreground">
        Project not found.{" "}
        <button onClick={() => navigate("/")} className="text-primary underline">
          Go home
        </button>
      </div>
    );
  }

  const handleUpdate = (data: any) => {
    updateProject.mutate({ id: project.id, data });
  };

  const handleDelete = () => {
    deleteProject.mutate(project.id, {
      onSuccess: () => navigate("/"),
    });
  };

  const handleCreateNote = (title: string) => {
    createNote.mutate(
      { projectId: project.id, name: title, content: "", tags: [] },
      {
        onSuccess: (res) => {
          const newId = res.data.id || res.data._id;
          navigate(`/note/${newId}`);
        },
      }
    );
  };

  const projectLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3">
        <button onClick={() => navigate("/")} className="hover:text-primary">
          ~
        </button>
        <ChevronRight className="h-3 w-3" />
        <span>targets</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-primary">{project.name}</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex-1">
          <Input
            value={project.name}
            onChange={(e) => handleUpdate({ name: e.target.value })}
            className="text-3xl font-bold font-mono border-0 px-0 h-auto bg-transparent focus-visible:ring-0 mb-2"
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
            <Globe className="h-3.5 w-3.5" />
            <Input
              value={project.target || ""}
              onChange={(e) => handleUpdate({ target: e.target.value })}
              placeholder="domain.com"
              className="border-0 px-0 h-auto bg-transparent focus-visible:ring-0 text-sm font-mono w-auto max-w-xs"
            />
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeleteModalOpen(true)}
          className="text-muted-foreground hover:text-destructive"
          disabled={deleteProject.isPending}
        >
          {deleteProject.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Project meta (scope & program info) */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-card border-border p-4">
          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2 block">
            scope
          </label>
          <Textarea
            value={project.scope || ""}
            onChange={(e) => handleUpdate({ scope: e.target.value })}
            placeholder="*.example.com&#10;api.example.com&#10;!admin.example.com"
            className="font-mono text-xs min-h-[100px] bg-secondary border-border resize-none"
          />
        </Card>
        <Card className="bg-card border-border p-4">
          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2 block">
            program info
          </label>
          <Textarea
            value={project.programInfo || ""}
            onChange={(e) => handleUpdate({ programInfo: e.target.value })}
            placeholder="HackerOne — Public. Rewards: $100-$5000&#10;Scope: *.example.com"
            className="font-mono text-xs min-h-[100px] bg-secondary border-border resize-none"
          />
        </Card>
      </div>

      {/* Target Summary Section - Shows actual counts from project data */}
      <div className="mb-6 p-4 bg-gradient-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="font-mono text-sm font-bold text-primary">Target Summary</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs font-mono mb-3">
          <div className="bg-secondary/50 rounded p-2 text-center">
            <div className="text-muted-foreground text-[10px]">Notes</div>
            <div className="text-xl font-bold text-primary">{notes.length}</div>
          </div>
          <div className="bg-secondary/50 rounded p-2 text-center">
            <div className="text-muted-foreground text-[10px]">Logs</div>
            <div className="text-xl font-bold text-primary">{projectLogs.length}</div>
          </div>
          <div className="bg-secondary/50 rounded p-2 text-center">
            <div className="text-muted-foreground text-[10px]">Vulnerabilities</div>
            <div className="text-xl font-bold text-destructive">{vulns.length}</div>
          </div>
          <div className="bg-secondary/50 rounded p-2 text-center">
            <div className="text-muted-foreground text-[10px]">Payloads</div>
            <div className="text-xl font-bold text-primary">{payloads.length}</div>
          </div>
          <div className="bg-secondary/50 rounded p-2 text-center">
            <div className="text-muted-foreground text-[10px]">Recon</div>
            <div className="text-xl font-bold text-warning">{reconData.length}</div>
          </div>
        </div>
        
        {/* Recent Activities from Notes, Vulns, Payloads, Recon */}
        <div className="mt-3 p-3 bg-secondary/30 rounded border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Recent Activity
            </span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {/* Recent Notes */}
            {[...notes]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 2)
              .map(note => (
                <div key={note.id} className="flex items-center gap-2 text-[11px] font-mono">
                  <FileText className="h-3 w-3 text-info" />
                  <span className="text-foreground">Created note:</span>
                  <button 
                    onClick={() => navigate(`/note/${note.id}`)}
                    className="text-primary hover:underline truncate"
                  >
                    {note.name}
                  </button>
                  <span className="text-muted-foreground text-[9px]">
                    {format(new Date(note.createdAt), "MMM d, h:mm a")}
                  </span>
                </div>
              ))}
            
            {/* Recent Vulnerabilities */}
            {[...vulns]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 2)
              .map(vuln => (
                <div key={vuln.id} className="flex items-center gap-2 text-[11px] font-mono">
                  <Shield className="h-3 w-3 text-destructive" />
                  <span className="text-foreground">Added vulnerability:</span>
                  <button 
                    onClick={() => navigate(`/project/${project.id}?tab=vulns&highlight=${vuln.id}`)}
                    className="text-destructive hover:underline truncate"
                  >
                    {vuln.title}
                  </button>
                  <span className="text-muted-foreground text-[9px]">
                    {format(new Date(vuln.createdAt), "MMM d, h:mm a")}
                  </span>
                </div>
              ))}
            
            {/* Recent Payloads */}
            {[...payloads]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 2)
              .map(payload => (
                <div key={payload.id} className="flex items-center gap-2 text-[11px] font-mono">
                  <Package className="h-3 w-3 text-primary" />
                  <span className="text-foreground">Added payload:</span>
                  <button 
                    onClick={() => navigate(`/project/${project.id}?tab=payloads&highlight=${payload.id}`)}
                    className="text-primary hover:underline truncate"
                  >
                    {payload.name}
                  </button>
                  <span className="text-muted-foreground text-[9px]">
                    {format(new Date(payload.createdAt), "MMM d, h:mm a")}
                  </span>
                </div>
              ))}
            
            {/* Recent Recon */}
            {[...reconData]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 2)
              .map(recon => (
                <div key={recon.id} className="flex items-center gap-2 text-[11px] font-mono">
                  <Search className="h-3 w-3 text-warning" />
                  <span className="text-foreground">Added recon:</span>
                  <button 
                    onClick={() => navigate(`/project/${project.id}?tab=recon&highlight=${recon.id}`)}
                    className="text-warning hover:underline truncate"
                  >
                    {recon.value}
                  </button>
                  <span className="text-muted-foreground text-[9px]">
                    {format(new Date(recon.createdAt), "MMM d, h:mm a")}
                  </span>
                </div>
              ))}
            
            {notes.length === 0 && vulns.length === 0 && payloads.length === 0 && reconData.length === 0 && (
              <div className="text-[11px] text-muted-foreground font-mono text-center py-2">
                No activity yet. Create notes, vulnerabilities, payloads, or recon data.
              </div>
            )}
          </div>
        </div>
      </div> {/* ✅ This closing div was missing */}

      {/* Tabs for Notes, Vulnerabilities, Payloads, Recon, Timeline */}
      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="notes" className="font-mono text-xs">
            Notes ({notes.length})
          </TabsTrigger>
          <TabsTrigger value="vulns" className="font-mono text-xs">
            Vulnerabilities ({vulns.length})
          </TabsTrigger>
          <TabsTrigger value="payloads" className="font-mono text-xs">
            Payloads ({payloads.length})
          </TabsTrigger>
          <TabsTrigger value="recon" className="font-mono text-xs">
            Recon ({reconData.length})
          </TabsTrigger>
          <TabsTrigger value="timeline" className="font-mono text-xs">
            Timeline ({projectLogs.length})
          </TabsTrigger>
        </TabsList>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
              notes
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setNoteModalOpen(true)}
              disabled={createNote.isPending}
              className="gap-1.5 font-mono text-xs h-7"
            >
              {createNote.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
              new note
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {notes.length === 0 && (
              <p className="col-span-full text-xs text-muted-foreground font-mono py-4 text-center">
                No notes yet. Create one to start documenting.
              </p>
            )}
            {notes.map((note: any) => (
              <button
                key={note.id}
                onClick={() => navigate(`/note/${note.id}`)}
                className="text-left bg-card border border-border rounded-md p-3 hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                  <h3 className="font-mono text-sm truncate flex-1">{note.name}</h3>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 font-mono mb-2">
                  {note.content?.slice(0, 120) || "(empty)"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {(note.tags || []).slice(0, 3).map((t: string) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="h-4 px-1 text-[9px] font-mono"
                    >
                      #{t}
                    </Badge>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </TabsContent>

        {/* Vulnerabilities Tab */}
        <TabsContent value="vulns">
          <VulnerabilityPanel projectId={project.id} />
        </TabsContent>

        {/* Payloads Tab */}
        <TabsContent value="payloads">
          <PayloadLibrary projectId={project.id} />
        </TabsContent>

        {/* Recon Tab */}
        <TabsContent value="recon">
          <ReconDataPanel projectId={project.id} />
        </TabsContent>

        {/* Timeline Tab - Shows ALL activities */}
        <TabsContent value="timeline">
          <div className="space-y-3">
            {(() => {
              const allActivities = [
                ...notes.map(n => ({
                  id: n.id,
                  type: "note",
                  title: `Created note: ${n.name}`,
                  date: n.createdAt,
                  link: `/note/${n.id}`,
                  icon: <FileText className="h-3 w-3" />,
                  color: "text-info",
                })),
                ...notes.map(n => ({
                  id: n.id,
                  type: "note",
                  title: `Updated note: ${n.name}`,
                  date: n.updatedAt,
                  link: `/note/${n.id}`,
                  icon: <FileText className="h-3 w-3" />,
                  color: "text-info",
                })).filter(a => new Date(a.date).getTime() !== notes.find(n => n.id === a.id)?.createdAt),
                ...vulns.map(v => ({
                  id: v.id,
                  type: "vuln",
                  title: `Added vulnerability: ${v.title}`,
                  date: v.createdAt,
                  link: `/project/${project.id}?tab=vulns&highlight=${v.id}`,
                  icon: <Shield className="h-3 w-3" />,
                  color: "text-destructive",
                })),
                ...vulns.map(v => ({
                  id: v.id,
                  type: "vuln",
                  title: `Updated vulnerability: ${v.title}`,
                  date: v.updatedAt,
                  link: `/project/${project.id}?tab=vulns&highlight=${v.id}`,
                  icon: <Shield className="h-3 w-3" />,
                  color: "text-destructive",
                })).filter(a => new Date(a.date).getTime() !== vulns.find(v => v.id === a.id)?.createdAt),
                ...payloads.map(p => ({
                  id: p.id,
                  type: "payload",
                  title: `Added payload: ${p.name}`,
                  date: p.createdAt,
                  link: `/project/${project.id}?tab=payloads&highlight=${p.id}`,
                  icon: <Package className="h-3 w-3" />,
                  color: "text-primary",
                })),
                ...payloads.map(p => ({
                  id: p.id,
                  type: "payload",
                  title: `Updated payload: ${p.name}`,
                  date: p.updatedAt,
                  link: `/project/${project.id}?tab=payloads&highlight=${p.id}`,
                  icon: <Package className="h-3 w-3" />,
                  color: "text-primary",
                })).filter(a => new Date(a.date).getTime() !== payloads.find(p => p.id === a.id)?.createdAt),
                ...reconData.map(r => ({
                  id: r.id,
                  type: "recon",
                  title: `Added recon: ${r.value}`,
                  date: r.createdAt,
                  link: `/project/${project.id}?tab=recon&highlight=${r.id}`,
                  icon: <Search className="h-3 w-3" />,
                  color: "text-warning",
                })),
                ...reconData.map(r => ({
                  id: r.id,
                  type: "recon",
                  title: `Updated recon: ${r.value}`,
                  date: r.updatedAt,
                  link: `/project/${project.id}?tab=recon&highlight=${r.id}`,
                  icon: <Search className="h-3 w-3" />,
                  color: "text-warning",
                })).filter(a => new Date(a.date).getTime() !== reconData.find(r => r.id === a.id)?.createdAt),
                ...projectLogs.map(l => ({
                  id: l.id,
                  type: "log",
                  title: `Research log: ${l.status || "entry"}`,
                  date: l.updatedAt,
                  link: `/calendar/${l.date}?project=${project.id}`,
                  icon: <Calendar className="h-3 w-3" />,
                  color: "text-muted-foreground",
                })),
              ];
              
              const sorted = allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              
              if (sorted.length === 0) {
                return (
                  <div className="text-center py-8">
                    <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground font-mono">
                      No activity yet. Create notes, vulnerabilities, payloads, or recon data.
                    </p>
                  </div>
                );
              }
              
              return (
                <div className="space-y-2">
                  {sorted.slice(0, 20).map((activity, idx) => (
                    <button
                      key={`${activity.id}-${idx}`}
                      onClick={() => navigate(activity.link)}
                      className="w-full text-left bg-card border border-border rounded-md p-2 hover:border-primary/50 transition-colors flex items-center gap-2 group"
                    >
                      <div className={`${activity.color}`}>{activity.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-mono text-foreground truncate">{activity.title}</p>
                      </div>
                      <div className="text-[9px] font-mono text-muted-foreground">
                        {format(new Date(activity.date), "MMM d, h:mm a")}
                      </div>
                      <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateNoteModal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        onCreate={handleCreateNote}
        isLoading={createNote.isPending}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? This action cannot be undone and will remove all associated notes, logs, vulnerabilities, payloads, and recon data.`}
        confirmText="Delete Project"
        variant="danger"
        isLoading={deleteProject.isPending}
      />
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    none: { label: "no progress", cls: "bg-muted text-muted-foreground" },
    testing: { label: "testing", cls: "bg-warning/20 text-warning border-warning/40" },
    finding: { label: "finding", cls: "bg-info/20 text-info border-info/40" },
    vuln: { label: "vuln", cls: "bg-destructive/20 text-destructive border-destructive/40" },
  };
  const m = map[status] ?? map.none;
  return (
    <Badge variant="outline" className={`h-4 px-1.5 text-[9px] font-mono uppercase ${m.cls}`}>
      {m.label}
    </Badge>
  );
};

export default ProjectPage;