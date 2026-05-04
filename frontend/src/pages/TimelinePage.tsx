import { useNavigate } from "react-router-dom";
import { useProjects, useAllLogs, useWorkspaceNotes, useWorkspaceVulnerabilities, useWorkspacePayloads, useWorkspaceRecon, useProjectNotes, useProjectVulnerabilities, useProjectPayloads, useProjectRecon } from "@/hooks/useApi";
import { useUIStore } from "@/lib/uiStore";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, FileText, Shield, Package, Search, Clock, Loader2 } from "lucide-react";

const TimelinePage = () => {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useUIStore();
  const { data: projects = [], isLoading: projectsLoading } = useProjects(activeWorkspaceId ?? undefined);
  const { data: logs = [], isLoading: logsLoading } = useAllLogs();
  const [projectFilter, setProjectFilter] = useState("all");

  // Fetch workspace-wide data when "all" is selected
  const { data: workspaceNotes = [], isLoading: workspaceNotesLoading } = useWorkspaceNotes(
    projectFilter === "all" ? activeWorkspaceId ?? undefined : undefined
  );
  const { data: workspaceVulns = [], isLoading: workspaceVulnsLoading } = useWorkspaceVulnerabilities(
    projectFilter === "all" ? activeWorkspaceId ?? undefined : undefined
  );
  const { data: workspacePayloads = [], isLoading: workspacePayloadsLoading } = useWorkspacePayloads(
    projectFilter === "all" ? activeWorkspaceId ?? undefined : undefined
  );
  const { data: workspaceRecon = [], isLoading: workspaceReconLoading } = useWorkspaceRecon(
    projectFilter === "all" ? activeWorkspaceId ?? undefined : undefined
  );

  // Fetch single project data when a specific project is selected
  const { data: singleNotes = [], isLoading: singleNotesLoading } = useProjectNotes(
    projectFilter !== "all" ? projectFilter : ""
  );
  const { data: singleVulns = [], isLoading: singleVulnsLoading } = useProjectVulnerabilities(
    projectFilter !== "all" ? projectFilter : ""
  );
  const { data: singlePayloads = [], isLoading: singlePayloadsLoading } = useProjectPayloads(
    projectFilter !== "all" ? projectFilter : ""
  );
  const { data: singleRecon = [], isLoading: singleReconLoading } = useProjectRecon(
    projectFilter !== "all" ? projectFilter : ""
  );

  // Use the appropriate data based on filter
  const notes = projectFilter === "all" ? workspaceNotes : singleNotes;
  const vulns = projectFilter === "all" ? workspaceVulns : singleVulns;
  const payloads = projectFilter === "all" ? workspacePayloads : singlePayloads;
  const recon = projectFilter === "all" ? workspaceRecon : singleRecon;

  const isLoading = 
    projectsLoading || 
    logsLoading ||
    (projectFilter === "all" 
      ? (workspaceNotesLoading || workspaceVulnsLoading || workspacePayloadsLoading || workspaceReconLoading)
      : (singleNotesLoading || singleVulnsLoading || singlePayloadsLoading || singleReconLoading)
    );

  // Combine all activities from all data sources
  const allActivities = useMemo(() => {
    const activities: any[] = [];

    // Add notes
    notes.forEach((note: any) => {
      const project = projects.find(p => p.id === note.projectId);
      activities.push({
        id: note.id,
        type: "note",
        title: `Created note: ${note.name}`,
        date: note.createdAt,
        link: `/note/${note.id}`,
        icon: <FileText className="h-3 w-3" />,
        color: "text-info",
        projectId: note.projectId,
        projectName: project?.name || "Unknown",
      });
      if (note.updatedAt !== note.createdAt) {
        activities.push({
          id: note.id,
          type: "note",
          title: `Updated note: ${note.name}`,
          date: note.updatedAt,
          link: `/note/${note.id}`,
          icon: <FileText className="h-3 w-3" />,
          color: "text-info",
          projectId: note.projectId,
          projectName: project?.name || "Unknown",
        });
      }
    });

    // Add vulnerabilities
    vulns.forEach((vuln: any) => {
      const project = projects.find(p => p.id === vuln.projectId);
      activities.push({
        id: vuln.id,
        type: "vuln",
        title: `Added vulnerability: ${vuln.title}`,
        date: vuln.createdAt,
        link: `/project/${vuln.projectId}?tab=vulns&highlight=${vuln.id}`,
        icon: <Shield className="h-3 w-3" />,
        color: "text-destructive",
        projectId: vuln.projectId,
        projectName: project?.name || "Unknown",
        severity: vuln.severity,
      });
      if (vuln.updatedAt !== vuln.createdAt) {
        activities.push({
          id: vuln.id,
          type: "vuln",
          title: `Updated vulnerability: ${vuln.title}`,
          date: vuln.updatedAt,
          link: `/project/${vuln.projectId}?tab=vulns&highlight=${vuln.id}`,
          icon: <Shield className="h-3 w-3" />,
          color: "text-destructive",
          projectId: vuln.projectId,
          projectName: project?.name || "Unknown",
          severity: vuln.severity,
        });
      }
    });

    // Add payloads
    payloads.forEach((payload: any) => {
      const project = projects.find(p => p.id === payload.projectId);
      activities.push({
        id: payload.id,
        type: "payload",
        title: `Added payload: ${payload.name}`,
        date: payload.createdAt,
        link: `/project/${payload.projectId}?tab=payloads&highlight=${payload.id}`,
        icon: <Package className="h-3 w-3" />,
        color: "text-primary",
        projectId: payload.projectId,
        projectName: project?.name || "Unknown",
        category: payload.category,
      });
      if (payload.updatedAt !== payload.createdAt) {
        activities.push({
          id: payload.id,
          type: "payload",
          title: `Updated payload: ${payload.name}`,
          date: payload.updatedAt,
          link: `/project/${payload.projectId}?tab=payloads&highlight=${payload.id}`,
          icon: <Package className="h-3 w-3" />,
          color: "text-primary",
          projectId: payload.projectId,
          projectName: project?.name || "Unknown",
          category: payload.category,
        });
      }
    });

    // Add recon data
    recon.forEach((reconItem: any) => {
      const project = projects.find(p => p.id === reconItem.projectId);
      activities.push({
        id: reconItem.id,
        type: "recon",
        title: `Added recon: ${reconItem.value}`,
        date: reconItem.createdAt,
        link: `/project/${reconItem.projectId}?tab=recon&highlight=${reconItem.id}`,
        icon: <Search className="h-3 w-3" />,
        color: "text-warning",
        projectId: reconItem.projectId,
        projectName: project?.name || "Unknown",
        reconType: reconItem.type,
      });
      if (reconItem.updatedAt !== reconItem.createdAt) {
        activities.push({
          id: reconItem.id,
          type: "recon",
          title: `Updated recon: ${reconItem.value}`,
          date: reconItem.updatedAt,
          link: `/project/${reconItem.projectId}?tab=recon&highlight=${reconItem.id}`,
          icon: <Search className="h-3 w-3" />,
          color: "text-warning",
          projectId: reconItem.projectId,
          projectName: project?.name || "Unknown",
          reconType: reconItem.type,
        });
      }
    });

    // Add calendar logs (research logs)
    logs.forEach((log: any) => {
      if (log.notes || log.findings || log.vulnerabilities) {
        const project = projects.find(p => p.id === log.projectId);
        const summary = log.notes?.split("\n")[0] || log.findings?.split("\n")[0] || log.vulnerabilities?.split("\n")[0] || "Log entry";
        activities.push({
          id: log.id,
          type: "log",
          title: `Research log: ${log.status || "entry"} - ${summary.substring(0, 50)}`,
          date: log.updatedAt,
          link: `/calendar/${log.date}?project=${log.projectId || ""}`,
          icon: <Clock className="h-3 w-3" />,
          color: "text-muted-foreground",
          projectId: log.projectId,
          projectName: project?.name || "Unknown",
          status: log.status,
        });
      }
    });

    // Sort by date descending (newest first)
    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [notes, vulns, payloads, recon, logs, projects]);

  // Group by month
  const grouped = useMemo(() => {
    const map: Record<string, typeof allActivities> = {};
    allActivities.forEach((activity) => {
      const month = format(new Date(activity.date), "yyyy-MM");
      (map[month] ||= []).push(activity);
    });
    return map;
  }, [allActivities]);

  const getStatusIcon = (type: string) => {
    switch (type) {
      case "vuln": return <Shield className="h-3 w-3 text-destructive" />;
      case "payload": return <Package className="h-3 w-3 text-primary" />;
      case "recon": return <Search className="h-3 w-3 text-warning" />;
      case "note": return <FileText className="h-3 w-3 text-info" />;
      default: return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  // Calculate total activities across all months
  const totalActivities = Object.values(grouped).reduce((sum, items) => sum + items.length, 0);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl font-bold font-mono">
          <span className="text-primary">›</span> Activity Timeline
        </h1>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="h-8 w-[160px] font-mono text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-mono text-xs">
              All Targets
            </SelectItem>
            {projects.map((p) => {
              // Count activities for this project
              const projectActivities = allActivities.filter(a => a.projectId === p.id);
              return (
                <SelectItem key={p.id} value={p.id} className="font-mono text-xs">
                  🎯 {p.name} ({projectActivities.length})
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-mono text-muted-foreground">No activity recorded yet.</p>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            Create notes, add vulnerabilities, payloads, or recon data to see them here.
          </p>
        </div>
      )}

      {Object.entries(grouped).map(([month, items]) => (
        <section key={month} className="mb-10">
          <h2 className="font-mono text-sm font-bold text-primary mb-4 sticky top-0 bg-background py-2 z-10">
            {format(parseISO(`${month}-01`), "MMMM yyyy")}
            <span className="text-muted-foreground text-xs ml-2">({items.length} activities)</span>
          </h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border"></div>
            <div className="space-y-4 pl-10">
              {items.slice(0, 50).map((activity, idx) => (
                <div
                  key={`${activity.id}-${idx}`}
                  className="relative group cursor-pointer"
                  onClick={() => navigate(activity.link)}
                >
                  <div className="absolute -left-[34px] top-1.5 w-3 h-3 rounded-full border-2 border-background bg-primary"></div>
                  <div className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-all hover:shadow-glow">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusIcon(activity.type)}
                        <span className="font-mono text-xs font-bold text-primary">
                          {format(new Date(activity.date), "MMM d, h:mm a")}
                        </span>
                        <Badge variant="outline" className="text-[9px] font-mono">
                          {activity.projectName}
                        </Badge>
                        {activity.severity && (
                          <Badge 
                            variant="outline" 
                            className={`text-[9px] ${
                              activity.severity === "Critical" ? "text-destructive" :
                              activity.severity === "High" ? "text-orange-400" :
                              activity.severity === "Medium" ? "text-yellow-400" :
                              "text-blue-400"
                            }`}
                          >
                            {activity.severity}
                          </Badge>
                        )}
                        {activity.category && (
                          <Badge variant="outline" className="text-[9px] text-primary">
                            {activity.category}
                          </Badge>
                        )}
                        {activity.reconType && (
                          <Badge variant="outline" className="text-[9px] text-warning">
                            {activity.reconType}
                          </Badge>
                        )}
                        {activity.status && (
                          <Badge variant="outline" className="text-[9px]">
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs font-mono text-foreground mt-1">
                      {activity.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export default TimelinePage;