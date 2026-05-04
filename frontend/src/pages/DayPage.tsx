import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useProjects, useWorkspaceNotes, useWorkspaceVulnerabilities, useWorkspacePayloads, useWorkspaceRecon, useAllLogs } from "@/hooks/useApi";
import { useUIStore } from "@/lib/uiStore";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalIcon, FileText, Shield, Package, Search, Clock, Loader2, Activity } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

type ActivityType = "note" | "vulnerability" | "payload" | "recon" | "log";

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date;
  tags: string[];
  link: string;
  status?: string;
  severity?: string;
  category?: string;
  reconType?: string;
  projectId: string;
  projectName: string;
}

const DayPage = () => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeWorkspaceId } = useUIStore();
  
  // Get projectId from URL params - ALWAYS read this
  const projectId = searchParams.get("project");
  
  // ALL hooks must be called unconditionally and in the same order every render
  const { data: projects = [], isLoading: projectsLoading } = useProjects(activeWorkspaceId ?? undefined);
  const { data: allNotes = [], isLoading: notesLoading } = useWorkspaceNotes(activeWorkspaceId ?? undefined);
  const { data: allVulns = [], isLoading: vulnsLoading } = useWorkspaceVulnerabilities(activeWorkspaceId ?? undefined);
  const { data: allPayloads = [], isLoading: payloadsLoading } = useWorkspacePayloads(activeWorkspaceId ?? undefined);
  const { data: allRecon = [], isLoading: reconLoading } = useWorkspaceRecon(activeWorkspaceId ?? undefined);
  const { data: allLogs = [], isLoading: logsLoading } = useAllLogs();

  // Loading state - computed after all hooks
  const isLoading = projectsLoading || notesLoading || vulnsLoading || payloadsLoading || reconLoading || logsLoading;

  // Helper function to check if date is valid (NOT a hook, just a regular function)
  const isValidDate = (dateStr: string | undefined): boolean => {
    if (!dateStr) return false;
    try {
      const parsed = parseISO(dateStr);
      return !isNaN(parsed.getTime());
    } catch {
      return false;
    }
  };

  // Get selected project for display
  const selectedProject = projects.find(p => p.id === projectId);
  
  // Parse date object (safe to do before any early return)
  let dateObj: Date;
  let isDateValid: boolean;
  try {
    dateObj = date ? parseISO(date) : new Date();
    isDateValid = !isNaN(dateObj.getTime());
  } catch {
    dateObj = new Date();
    isDateValid = false;
  }
  
  // Calculate prev/next days for navigation
  const prevDay = isDateValid && date ? format(new Date(dateObj.getTime() - 86400000), "yyyy-MM-dd") : "";
  const nextDay = isDateValid && date ? format(new Date(dateObj.getTime() + 86400000), "yyyy-MM-dd") : "";
  
  // ALL useMemo hooks must be called unconditionally - no if statements around them!
  
  // Filter activities for the selected date
  const activities = useMemo(() => {
    if (!date || !isDateValid) return [];
    
    const targetDate = date;
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const activitiesList: Activity[] = [];
    
    // Filter function for project
    const shouldInclude = (itemProjectId: string) => {
      return !projectId || itemProjectId === projectId;
    };
    
    const getProjectName = (pid: string) => {
      const proj = projects.find(p => p.id === pid);
      return proj?.name || "Unknown";
    };
    
    // Notes activities
    allNotes.forEach((note: any) => {
      if (!shouldInclude(note.projectId)) return;
      const createdAt = new Date(note.createdAt);
      const updatedAt = new Date(note.updatedAt);
      
      if (createdAt >= startOfDay && createdAt <= endOfDay) {
        activitiesList.push({
          id: note.id,
          type: "note",
          title: `📝 Created note: ${note.name}`,
          description: note.content?.slice(0, 200) || "",
          timestamp: createdAt,
          tags: note.tags || [],
          link: `/note/${note.id}`,
          projectId: note.projectId,
          projectName: getProjectName(note.projectId),
        });
      } else if (updatedAt >= startOfDay && updatedAt <= endOfDay && updatedAt.getTime() !== createdAt.getTime()) {
        activitiesList.push({
          id: note.id,
          type: "note",
          title: `✏️ Updated note: ${note.name}`,
          description: note.content?.slice(0, 200) || "",
          timestamp: updatedAt,
          tags: note.tags || [],
          link: `/note/${note.id}`,
          projectId: note.projectId,
          projectName: getProjectName(note.projectId),
        });
      }
    });
    
    // Vulnerabilities activities
    allVulns.forEach((v: any) => {
      if (!shouldInclude(v.projectId)) return;
      const createdAt = new Date(v.createdAt);
      const updatedAt = new Date(v.updatedAt);
      
      if (createdAt >= startOfDay && createdAt <= endOfDay) {
        activitiesList.push({
          id: v.id,
          type: "vulnerability",
          title: `🛡️ Added vulnerability: ${v.title}`,
          description: v.notes || v.poc || "",
          timestamp: createdAt,
          tags: [],
          link: `/project/${v.projectId}?tab=vulns&highlight=${v.id}`,
          severity: v.severity,
          status: v.status,
          projectId: v.projectId,
          projectName: getProjectName(v.projectId),
        });
      } else if (updatedAt >= startOfDay && updatedAt <= endOfDay && updatedAt.getTime() !== createdAt.getTime()) {
        activitiesList.push({
          id: v.id,
          type: "vulnerability",
          title: `🔄 Updated vulnerability: ${v.title}`,
          description: `Status: ${v.status}, Severity: ${v.severity}`,
          timestamp: updatedAt,
          tags: [],
          link: `/project/${v.projectId}?tab=vulns&highlight=${v.id}`,
          severity: v.severity,
          status: v.status,
          projectId: v.projectId,
          projectName: getProjectName(v.projectId),
        });
      }
    });
    
    // Payloads activities
    allPayloads.forEach((p: any) => {
      if (!shouldInclude(p.projectId)) return;
      const createdAt = new Date(p.createdAt);
      const updatedAt = new Date(p.updatedAt);
      
      if (createdAt >= startOfDay && createdAt <= endOfDay) {
        activitiesList.push({
          id: p.id,
          type: "payload",
          title: `📦 Added payload: ${p.name}`,
          description: p.content?.slice(0, 100) || "",
          timestamp: createdAt,
          tags: [p.category],
          link: `/project/${p.projectId}?tab=payloads&highlight=${p.id}`,
          category: p.category,
          projectId: p.projectId,
          projectName: getProjectName(p.projectId),
        });
      } else if (updatedAt >= startOfDay && updatedAt <= endOfDay && updatedAt.getTime() !== createdAt.getTime()) {
        activitiesList.push({
          id: p.id,
          type: "payload",
          title: `🔄 Updated payload: ${p.name}`,
          description: p.content?.slice(0, 100) || "",
          timestamp: updatedAt,
          tags: [p.category],
          link: `/project/${p.projectId}?tab=payloads&highlight=${p.id}`,
          category: p.category,
          projectId: p.projectId,
          projectName: getProjectName(p.projectId),
        });
      }
    });
    
    // Recon activities
    allRecon.forEach((r: any) => {
      if (!shouldInclude(r.projectId)) return;
      const createdAt = new Date(r.createdAt);
      const updatedAt = new Date(r.updatedAt);
      
      if (createdAt >= startOfDay && createdAt <= endOfDay) {
        activitiesList.push({
          id: r.id,
          type: "recon",
          title: `🔍 Added recon: ${r.value}`,
          description: `Type: ${r.type}, Source: ${r.source || "manual"}`,
          timestamp: createdAt,
          tags: [r.type],
          link: `/project/${r.projectId}?tab=recon&highlight=${r.id}`,
          reconType: r.type,
          projectId: r.projectId,
          projectName: getProjectName(r.projectId),
        });
      } else if (updatedAt >= startOfDay && updatedAt <= endOfDay && updatedAt.getTime() !== createdAt.getTime()) {
        activitiesList.push({
          id: r.id,
          type: "recon",
          title: `🔄 Updated recon: ${r.value}`,
          description: `Type: ${r.type}, Source: ${r.source || "manual"}`,
          timestamp: updatedAt,
          tags: [r.type],
          link: `/project/${r.projectId}?tab=recon&highlight=${r.id}`,
          reconType: r.type,
          projectId: r.projectId,
          projectName: getProjectName(r.projectId),
        });
      }
    });
    
    // Calendar logs activities
    allLogs.forEach((log: any) => {
      if (log.date !== date) return;
      if (!shouldInclude(log.projectId)) return;
      
      const hasContent = log.notes || log.findings || log.vulnerabilities;
      if (hasContent) {
        const statusIcon = log.status === "vulnerability" ? "⚠️" : log.status === "findings" ? "🔎" : log.status === "testing" ? "🧪" : "📋";
        const summary = log.notes?.split("\n")[0] || log.findings?.split("\n")[0] || log.vulnerabilities?.split("\n")[0] || "Log entry";
        
        activitiesList.push({
          id: log.id,
          type: "log",
          title: `${statusIcon} Research log: ${log.status || "entry"}`,
          description: summary.substring(0, 150),
          timestamp: new Date(log.updatedAt),
          tags: [],
          link: `/calendar/${log.date}?project=${log.projectId || ""}`,
          status: log.status,
          projectId: log.projectId,
          projectName: log.projectName || getProjectName(log.projectId),
        });
      }
    });
    
    // Sort by timestamp ascending (oldest first for timeline)
    return activitiesList.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [allNotes, allVulns, allPayloads, allRecon, allLogs, date, projectId, projects, isDateValid]);
  
  // Group activities by project
  const groupedByProject = useMemo(() => {
    const grouped: Record<string, Activity[]> = {};
    activities.forEach(activity => {
      if (!grouped[activity.projectId]) {
        grouped[activity.projectId] = [];
      }
      grouped[activity.projectId].push(activity);
    });
    return grouped;
  }, [activities]);
  
  // Helper functions (NOT hooks, safe to define anywhere)
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "note": return <FileText className="h-4 w-4 text-info" />;
      case "vulnerability": return <Shield className="h-4 w-4 text-destructive" />;
      case "payload": return <Package className="h-4 w-4 text-primary" />;
      case "recon": return <Search className="h-4 w-4 text-warning" />;
      case "log": return <Activity className="h-4 w-4 text-muted-foreground" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case "vulnerability": return "border-destructive";
      case "payload": return "border-primary";
      case "recon": return "border-warning";
      case "note": return "border-info";
      default: return "border-muted-foreground";
    }
  };
  
  const formatTime = (date: Date) => {
    return format(date, "h:mm a");
  };
  
  // Early return ONLY AFTER all hooks have been called
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  // Invalid date check after loading
  if (!isDateValid || !date) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-muted-foreground font-mono">Invalid date</p>
      </div>
    );
  }
  
  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header with date navigation */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(`/calendar/${prevDay}${projectId ? `?project=${projectId}` : ""}`)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold font-mono">
              <span className="text-primary">›</span> {format(dateObj, "EEEE, MMMM d, yyyy")}
            </h1>
            {projectId && selectedProject ? (
              <p className="text-xs font-mono text-muted-foreground mt-1">Filtered by: {selectedProject.name}</p>
            ) : (
              <p className="text-xs font-mono text-muted-foreground mt-1">Showing all projects</p>
            )}
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(`/calendar/${nextDay}${projectId ? `?project=${projectId}` : ""}`)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/calendar")} className="gap-1.5 font-mono text-xs">
          <CalIcon className="h-3.5 w-3.5" /> Month View
        </Button>
      </div>
      
      {/* Summary stats */}
      <div className="mb-6 flex gap-3 flex-wrap">
        <div className="bg-card border border-border rounded-lg px-3 py-1.5">
          <span className="text-xs font-mono text-muted-foreground">Total Activities:</span>
          <span className="ml-2 text-sm font-mono font-bold text-primary">{activities.length}</span>
        </div>
        <div className="bg-card border border-border rounded-lg px-3 py-1.5">
          <span className="text-xs font-mono text-muted-foreground">Projects:</span>
          <span className="ml-2 text-sm font-mono font-bold text-primary">{Object.keys(groupedByProject).length}</span>
        </div>
      </div>
      
      {/* Timeline by Project */}
      {activities.length === 0 ? (
        <Card className="bg-card border-border p-8 text-center">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-mono text-muted-foreground">No activity recorded on this day.</p>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            Create notes, add vulnerabilities, payloads, or recon data to see them here.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByProject).map(([pid, projectActivities]) => {
            const projectName = projectActivities[0]?.projectName || "Unknown";
            return (
              <div key={pid}>
                <h2 className="font-mono text-sm font-bold text-primary mb-3 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  {projectName}
                  <span className="text-xs text-muted-foreground font-normal">
                    ({projectActivities.length} activities)
                  </span>
                </h2>
                <div className="relative pl-4">
                  <div className="absolute left-[11px] top-0 bottom-0 w-px bg-border"></div>
                  
                  <div className="space-y-4">
                    {projectActivities.map((activity, idx) => (
                      <div key={`${activity.id}-${idx}`} className="relative flex gap-4 group cursor-pointer" onClick={() => navigate(activity.link)}>
                        <div className="relative z-10 mt-1">
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center bg-background border-2 shadow-sm transition-all group-hover:scale-110",
                            getActivityColor(activity.type)
                          )}>
                            {getActivityIcon(activity.type)}
                          </div>
                        </div>
                        
                        <div className="flex-1 bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-all hover:shadow-glow">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {formatTime(activity.timestamp)}
                            </span>
                            <span className="font-mono text-sm font-bold line-clamp-1">{activity.title}</span>
                            {activity.status && (
                              <Badge variant="outline" className="text-[9px]">{activity.status}</Badge>
                            )}
                            {activity.severity && (
                              <Badge variant="outline" className={cn("text-[9px]", {
                                "text-destructive": activity.severity === "Critical",
                                "text-orange-400": activity.severity === "High",
                                "text-yellow-400": activity.severity === "Medium",
                                "text-blue-400": activity.severity === "Low",
                              })}>{activity.severity}</Badge>
                            )}
                            {activity.category && (
                              <Badge variant="outline" className="text-[9px] text-primary">{activity.category}</Badge>
                            )}
                            {activity.reconType && (
                              <Badge variant="outline" className="text-[9px] text-warning">{activity.reconType}</Badge>
                            )}
                          </div>
                          {activity.description && (
                            <p className="text-xs font-mono text-foreground/80 line-clamp-3">
                              {activity.description}
                            </p>
                          )}
                          {activity.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {activity.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="h-4 px-1 text-[9px] font-mono">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DayPage;