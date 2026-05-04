import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useProjects, useAllLogs, useWorkspaceNotes, useWorkspaceVulnerabilities, useWorkspacePayloads, useWorkspaceRecon } from "@/hooks/useApi";
import { useUIStore } from "@/lib/uiStore";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
  eachDayOfInterval,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalIcon, FileText, Shield, Package, Search, Activity } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const CalendarPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeWorkspaceId } = useUIStore();
  const { data: projects = [] } = useProjects(activeWorkspaceId ?? undefined);
  const { data: logs = [] } = useAllLogs();
  
  // Fetch all activities from workspace for the calendar
  const { data: allNotes = [] } = useWorkspaceNotes(activeWorkspaceId ?? undefined);
  const { data: allVulns = [] } = useWorkspaceVulnerabilities(activeWorkspaceId ?? undefined);
  const { data: allPayloads = [] } = useWorkspacePayloads(activeWorkspaceId ?? undefined);
  const { data: allRecon = [] } = useWorkspaceRecon(activeWorkspaceId ?? undefined);

  const projectFilter = searchParams.get("project") ?? "all";
  const setProjectFilter = (id: string) => {
    if (id === "all") searchParams.delete("project");
    else searchParams.set("project", id);
    setSearchParams(searchParams);
  };

  const [cursor, setCursor] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  // Combine all activities by date
  const activitiesByDate = useMemo(() => {
    const map: Record<string, Array<{ type: string; title: string; projectId: string; projectName: string; status?: string }>> = {};
    
    // Add notes
    allNotes.forEach((note: any) => {
      const date = format(new Date(note.createdAt), "yyyy-MM-dd");
      const project = projects.find(p => p.id === note.projectId);
      if (projectFilter === "all" || note.projectId === projectFilter) {
        if (!map[date]) map[date] = [];
        map[date].push({
          type: "note",
          title: `📝 Note: ${note.name}`,
          projectId: note.projectId,
          projectName: project?.name || "Unknown",
        });
      }
    });
    
    // Add vulnerabilities
    allVulns.forEach((vuln: any) => {
      const date = format(new Date(vuln.createdAt), "yyyy-MM-dd");
      const project = projects.find(p => p.id === vuln.projectId);
      if (projectFilter === "all" || vuln.projectId === projectFilter) {
        if (!map[date]) map[date] = [];
        map[date].push({
          type: "vuln",
          title: `🛡️ Vuln: ${vuln.title}`,
          projectId: vuln.projectId,
          projectName: project?.name || "Unknown",
          status: vuln.severity,
        });
      }
    });
    
    // Add payloads
    allPayloads.forEach((payload: any) => {
      const date = format(new Date(payload.createdAt), "yyyy-MM-dd");
      const project = projects.find(p => p.id === payload.projectId);
      if (projectFilter === "all" || payload.projectId === projectFilter) {
        if (!map[date]) map[date] = [];
        map[date].push({
          type: "payload",
          title: `📦 Payload: ${payload.name}`,
          projectId: payload.projectId,
          projectName: project?.name || "Unknown",
        });
      }
    });
    
    // Add recon
    allRecon.forEach((recon: any) => {
      const date = format(new Date(recon.createdAt), "yyyy-MM-dd");
      const project = projects.find(p => p.id === recon.projectId);
      if (projectFilter === "all" || recon.projectId === projectFilter) {
        if (!map[date]) map[date] = [];
        map[date].push({
          type: "recon",
          title: `🔍 Recon: ${recon.value}`,
          projectId: recon.projectId,
          projectName: project?.name || "Unknown",
        });
      }
    });
    
    // Add calendar logs
    logs.forEach((log: any) => {
      if (projectFilter === "all" || log.projectId === projectFilter) {
        if (!map[log.date]) map[log.date] = [];
        const statusIcon = log.status === "vulnerability" ? "⚠️" : log.status === "findings" ? "🔎" : log.status === "testing" ? "🧪" : "📋";
        map[log.date].push({
          type: "log",
          title: `${statusIcon} Log: ${log.status || "entry"}`,
          projectId: log.projectId,
          projectName: log.projectName || "Unknown",
          status: log.status,
        });
      }
    });
    
    return map;
  }, [allNotes, allVulns, allPayloads, allRecon, logs, projects, projectFilter]);

  // Get activity count and top status for each date
  const getDateInfo = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const activities = activitiesByDate[dateStr] || [];
    const hasActivity = activities.length > 0;
    
    // Determine top status for color coding
    let topStatus = "none";
    if (activities.some(a => a.type === "vuln")) topStatus = "vuln";
    else if (activities.some(a => a.type === "recon")) topStatus = "findings";
    else if (activities.some(a => a.type === "payload")) topStatus = "findings";
    else if (activities.some(a => a.type === "note")) topStatus = "testing";
    else if (activities.some(a => a.type === "log")) topStatus = activities.find(a => a.type === "log")?.status || "testing";
    
    return { count: activities.length, hasActivity, topStatus };
  };

  const goToDay = (d: Date) => {
    const dk = format(d, "yyyy-MM-dd");
    const proj = projectFilter !== "all" ? `?project=${projectFilter}` : "";
    navigate(`/calendar/${dk}${proj}`);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3">
        <CalIcon className="h-3 w-3" />
        <span>activity_calendar</span>
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCursor(subMonths(cursor, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold font-mono min-w-[200px]">
            <span className="text-primary">›</span> {format(cursor, "MMMM yyyy")}
          </h1>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCursor(addMonths(cursor, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())} className="font-mono text-xs">
            today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">filter:</span>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="h-8 w-[200px] font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-mono text-xs">all targets</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id} className="font-mono text-xs">{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-[11px] font-mono text-muted-foreground">
        <Legend dot="bg-muted" label="no activity" />
        <Legend dot="bg-warning" label="notes / testing" />
        <Legend dot="bg-info" label="findings / recon / payloads" />
        <Legend dot="bg-destructive animate-pulse-glow" label="vulnerabilities" />
      </div>

      {/* Calendar grid */}
      <div className="bg-card border border-border rounded-md overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-secondary">
          {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
            <div key={d} className="p-2 text-[10px] font-mono text-muted-foreground text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const dateStr = format(d, "yyyy-MM-dd");
            const inMonth = isSameMonth(d, cursor);
            const today = isToday(d);
            const { count, hasActivity, topStatus } = getDateInfo(d);
            const dayActivities = activitiesByDate[dateStr] || [];

            return (
              <HoverCard key={dateStr} openDelay={200}>
                <HoverCardTrigger asChild>
                  <button
                    onClick={() => goToDay(d)}
                    className={cn(
                      "min-h-[88px] p-2 text-left border-b border-r border-border flex flex-col gap-1 hover:bg-secondary transition-colors group",
                      !inMonth && "opacity-40",
                      today && "bg-primary/5",
                      hasActivity && "hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "font-mono text-sm",
                          today && "text-primary font-bold glow-text",
                          hasActivity && "font-bold"
                        )}
                      >
                        {format(d, "d")}
                      </span>
                      {hasActivity && <DayStatusDot status={topStatus} />}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      {hasActivity && (
                        <div className="text-[10px] font-mono text-primary">
                          {count} activit{count !== 1 ? 'ies' : 'y'}
                        </div>
                      )}
                      {dayActivities.slice(0, 2).map((activity, idx) => (
                        <div
                          key={idx}
                          className="text-[9px] font-mono truncate text-muted-foreground group-hover:text-foreground"
                        >
                          {/* {activity.title.substring(0, 30)} */}
                        </div>
                      ))}
                      {dayActivities.length > 2 && (
                        <div className="text-[9px] font-mono text-muted-foreground"></div>
                      )}
                    </div>
                  </button>
                </HoverCardTrigger>
                {dayActivities.length > 0 && (
                  <HoverCardContent className="w-80 bg-popover border-border" align="start">
                    <div className="text-xs font-mono text-muted-foreground mb-2">
                      {format(d, "EEEE, MMM d")} - {dayActivities.length} activities
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {dayActivities.map((activity, idx) => (
                        <div key={idx} className="border-l-2 border-primary pl-2">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {activity.type === "vuln" && <Shield className="h-3 w-3 text-destructive" />}
                            {activity.type === "payload" && <Package className="h-3 w-3 text-primary" />}
                            {activity.type === "recon" && <Search className="h-3 w-3 text-warning" />}
                            {activity.type === "note" && <FileText className="h-3 w-3 text-info" />}
                            {activity.type === "log" && <Activity className="h-3 w-3 text-muted-foreground" />}
                            <span className="text-xs font-mono font-bold text-primary truncate">
                              {activity.projectName}
                            </span>
                            {activity.status && (
                              <span className="text-[9px] px-1 py-0.5 rounded bg-secondary">
                                {activity.status}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground font-mono break-words">
                            {activity.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  </HoverCardContent>
                )}
              </HoverCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Legend = ({ dot, label }: { dot: string; label: string }) => (
  <div className="flex items-center gap-1.5">
    <span className={`h-2 w-2 rounded-full ${dot}`} />
    <span>{label}</span>
  </div>
);

const DayStatusDot = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    none: "bg-muted",
    testing: "bg-warning",
    findings: "bg-info",
    vuln: "bg-destructive animate-pulse-glow",
  };
  return <span className={`h-1.5 w-1.5 rounded-full ${map[status] ?? "bg-muted"}`} />;
};

export default CalendarPage;