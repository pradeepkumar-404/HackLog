import { useNavigate } from "react-router-dom";
import { useWorkspaces, useWorkspaceStats, useWorkspaceRecent, useWorkspaceNotes, useWorkspaceVulnerabilities, useWorkspacePayloads, useWorkspaceRecon, useAllLogs } from "@/hooks/useApi";
import { useUIStore } from "@/lib/uiStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Folder, Activity, Plus, ChevronRight, Search, Shield } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { activeWorkspaceId, setActiveWorkspace } = useUIStore();
  const { data: workspaces = [], isLoading: workspacesLoading } = useWorkspaces();
  
  console.log("📊 [Dashboard] Active Workspace ID:", activeWorkspaceId);
  console.log("📊 [Dashboard] Workspaces:", workspaces);

  // Fetch ALL data for debugging
  const { data: allNotes = [] } = useWorkspaceNotes(activeWorkspaceId ?? undefined);
  const { data: allVulns = [] } = useWorkspaceVulnerabilities(activeWorkspaceId ?? undefined);
  const { data: allPayloads = [] } = useWorkspacePayloads(activeWorkspaceId ?? undefined);
  const { data: allRecon = [] } = useWorkspaceRecon(activeWorkspaceId ?? undefined);
  const { data: allLogs = [] } = useAllLogs();

  // Debug: Print all activities by project
  useEffect(() => {
    if (!activeWorkspaceId) return;
    
    console.log("\n========== 📊 ACTIVITY DEBUG ==========");
    console.log(`Workspace ID: ${activeWorkspaceId}`);
    
    // Group notes by project
    const notesByProject: Record<string, number> = {};
    allNotes.forEach((note: any) => {
      notesByProject[note.projectId] = (notesByProject[note.projectId] || 0) + 1;
    });
    console.log("📝 Notes by project:", notesByProject);
    console.log("Total notes:", allNotes.length);
    
    // Group vulnerabilities by project
    const vulnsByProject: Record<string, number> = {};
    allVulns.forEach((vuln: any) => {
      vulnsByProject[vuln.projectId] = (vulnsByProject[vuln.projectId] || 0) + 1;
    });
    console.log("🛡️ Vulnerabilities by project:", vulnsByProject);
    console.log("Total vulns:", allVulns.length);
    
    // Group payloads by project
    const payloadsByProject: Record<string, number> = {};
    allPayloads.forEach((payload: any) => {
      payloadsByProject[payload.projectId] = (payloadsByProject[payload.projectId] || 0) + 1;
    });
    console.log("📦 Payloads by project:", payloadsByProject);
    console.log("Total payloads:", allPayloads.length);
    
    // Group recon by project
    const reconByProject: Record<string, number> = {};
    allRecon.forEach((recon: any) => {
      reconByProject[recon.projectId] = (reconByProject[recon.projectId] || 0) + 1;
    });
    console.log("🔍 Recon by project:", reconByProject);
    console.log("Total recon:", allRecon.length);
    
    // Calendar logs
    console.log("📅 Calendar Logs:", allLogs.map((log: any) => ({
      date: log.date,
      projectId: log.projectId,
      status: log.status,
      hasNotes: !!log.notes,
      hasFindings: !!log.findings,
      hasVulns: !!log.vulnerabilities
    })));
    console.log("Total logs:", allLogs.length);
    
    // Calculate total activities
    const totalActivities = allNotes.length + allVulns.length + allPayloads.length + allRecon.length;
    console.log("\n📊 TOTAL ACTIVITIES:", totalActivities);
    console.log("   - Notes:", allNotes.length);
    console.log("   - Vulnerabilities:", allVulns.length);
    console.log("   - Payloads:", allPayloads.length);
    console.log("   - Recon:", allRecon.length);
    console.log("   - Calendar Logs:", allLogs.length);
    
    // Check which logs count as "active"
    const activeLogs = allLogs.filter((log: any) => 
      log.status === "testing" || log.status === "findings" || log.status === "vulnerability"
    );
    console.log("\n🔥 ACTIVE LOGS (status = testing/findings/vulnerability):", activeLogs.length);
    activeLogs.forEach((log: any) => {
      console.log(`   - ${log.date}: ${log.status} (Project: ${log.projectId})`);
    });
    
    console.log("==========================================\n");
  }, [activeWorkspaceId, allNotes, allVulns, allPayloads, allRecon, allLogs]);

  // Auto-select first workspace if none active
  useEffect(() => {
    if (!workspacesLoading && workspaces.length > 0 && !activeWorkspaceId) {
      console.log("🔄 No active workspace, setting to first:", workspaces[0].id);
      setActiveWorkspace(workspaces[0].id);
    }
  }, [workspaces, workspacesLoading, activeWorkspaceId, setActiveWorkspace]);

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];
  const workspaceId = activeWs?.id || "";
  
  console.log("📊 [Dashboard] Using workspace ID:", workspaceId);
  
  const { data: stats, isLoading: statsLoading, error: statsError } = useWorkspaceStats(workspaceId);
  const { data: recent, isLoading: recentLoading, error: recentError } = useWorkspaceRecent(workspaceId);

  console.log("📊 [Dashboard] Stats from API:", stats);
  console.log("📊 [Dashboard] Stats error:", statsError);
  console.log("📊 [Dashboard] Recent:", recent);

  const isLoading = workspacesLoading || statsLoading || recentLoading;

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-96">
        <div className="animate-pulse text-primary font-mono">Loading dashboard...</div>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="p-8 flex flex-col justify-center items-center h-96 text-center">
        <Folder className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-mono mb-2">No workspaces yet</h2>
        <p className="text-sm text-muted-foreground mb-4">Create a workspace to get started</p>
      </div>
    );
  }

  // Calculate total activities from fetched data for display
  const totalActivities = allNotes.length + allVulns.length + allPayloads.length + allRecon.length;
  const activeLogsCount = allLogs.filter((log: any) => 
    log.status === "testing" || log.status === "findings" || log.status === "vulnerability"
  ).length;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Hero */}
      <header className="mb-8">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
          <span>{activeWs?.name ?? "workspace"}</span>
          <span className="opacity-50">/</span>
          <span>dashboard</span>
        </div>
        <h1 className="text-4xl font-bold mb-1 font-mono">
          <span className="text-primary glow-text">›</span> Welcome back
          <span className="animate-blink ml-1 text-primary">_</span>
        </h1>
        <p className="text-muted-foreground font-mono text-sm">
          {format(new Date(), "EEEE, MMMM do, yyyy")} — track your bug bounty progress.
        </p>
      </header>

      {/* Debug info - remove in production */}
      {/* <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs font-mono">
        <details>
          <summary className="cursor-pointer text-yellow-400">🔍 Debug Info (click to expand)</summary>
          <div className="mt-2 space-y-1 text-muted-foreground">
            <p>Total Activities (Notes + Vulns + Payloads + Recon): <strong className="text-primary">{totalActivities}</strong></p>
            <p>Notes: {allNotes.length} | Vulns: {allVulns.length} | Payloads: {allPayloads.length} | Recon: {allRecon.length}</p>
            <p>Calendar Logs: {allLogs.length}</p>
            <p>Active Logs (from API): <strong className="text-yellow-400">{stats?.activeLogs ?? 0}</strong></p>
            <p>Active Logs (calculated): <strong className="text-green-400">{activeLogsCount}</strong></p>
            <p>Stats from API: {JSON.stringify(stats, null, 2)}</p>
          </div>
        </details>
      </div> */}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard 
          icon={<Folder className="h-4 w-4" />} 
          label="Targets" 
          value={stats?.targets || 0} 
          color="text-primary" 
        />
        <StatCard 
          icon={<FileText className="h-4 w-4" />} 
          label="Notes" 
          value={allNotes.length} 
          color="text-info" 
        />
        <StatCard 
          icon={<Shield className="h-4 w-4" />} 
          label="Vulnerabilities" 
          value={allVulns.length} 
          color="text-destructive" 
        />
        <StatCard 
          icon={<Activity className="h-4 w-4" />} 
          label="Total Activities" 
          value={totalActivities} 
          color="text-primary" 
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button onClick={() => navigate("/calendar")} variant="default" className="gap-2 font-mono">
          <Calendar className="h-4 w-4" /> Open calendar
        </Button>
        <Button onClick={() => navigate("/timeline")} variant="outline" className="gap-2 font-mono">
          <Activity className="h-4 w-4" /> Timeline ({totalActivities} activities)
        </Button>
        <Button onClick={() => navigate("/search")} variant="outline" className="gap-2 font-mono">
          <Search className="h-4 w-4" /> Search <kbd className="ml-1 text-[10px] opacity-60">⌘K</kbd>
        </Button>
      </div>

      {/* Recent Activity - Across ALL projects */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent Notes */}
        <Card className="bg-card border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" /> recent_notes ({recent?.notes?.length || 0})
            </h2>
            <button onClick={() => navigate("/search?type=notes")} className="text-xs font-mono text-primary hover:underline">
              view all
            </button>
          </div>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {recent?.notes?.length === 0 && (
              <p className="text-xs text-muted-foreground font-mono py-4">No notes yet across any target.</p>
            )}
            {recent?.notes?.map((note: any) => (
              <button
                key={note._id}
                onClick={() => navigate(`/note/${note._id}`)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-secondary text-left group"
              >
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-foreground truncate">{note.name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground flex gap-2">
                    <span>{note.projectId?.name || "unknown"}</span>
                    {note.tags?.slice(0, 2).map((t: string) => (
                      <Badge key={t} variant="secondary" className="h-4 px-1 text-[9px] font-mono">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </Card>

        {/* Recent Vulnerabilities */}
        <Card className="bg-card border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-destructive" /> recent_vulnerabilities ({recent?.vulnerabilities?.length || 0})
            </h2>
            <button onClick={() => navigate("/search?type=vulnerabilities")} className="text-xs font-mono text-primary hover:underline">
              view all
            </button>
          </div>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {recent?.vulnerabilities?.length === 0 && (
              <p className="text-xs text-muted-foreground font-mono py-4">No vulnerabilities yet.</p>
            )}
            {recent?.vulnerabilities?.map((v: any) => (
              <button
                key={v._id}
                onClick={() => navigate(`/project/${v.projectId?._id || v.projectId}?tab=vulns&highlight=${v._id}`)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-secondary text-left group"
              >
                <Shield className="h-3.5 w-3.5 text-destructive" />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-foreground truncate">{v.title}</div>
                  <div className="text-[10px] font-mono text-muted-foreground flex gap-2">
                    <span>{v.projectId?.name || "unknown"}</span>
                    <Badge variant="outline" className="h-4 px-1 text-[9px]">{v.severity}</Badge>
                    <Badge variant="outline" className="h-4 px-1 text-[9px]">{v.status}</Badge>
                  </div>
                </div>
                <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </Card>

        {/* Recent Logs - Full width */}
        {/* <Card className="bg-card border-border p-4 md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" /> recent_logs ({recent?.logs?.length || 0})
            </h2>
            <button onClick={() => navigate("/calendar")} className="text-xs font-mono text-primary hover:underline">
              open calendar
            </button>
          </div>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {recent?.logs?.length === 0 && (
              <p className="text-xs text-muted-foreground font-mono py-4">No logs yet across any target.</p>
            )}
            {recent?.logs?.map((log: any) => {
              const summary = log.notes?.split("\n")[0] || log.findings?.split("\n")[0] || log.vulnerabilities?.split("\n")[0] || "Log entry";
              return (
                <button
                  key={log._id}
                  onClick={() => navigate(`/calendar/${log.date}?project=${log.projectId || ""}`)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-secondary text-left group"
                >
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs text-foreground truncate">{summary}</div>
                    <div className="text-[10px] font-mono text-muted-foreground flex gap-2">
                      <span>{format(new Date(log.date), "MMM d, yyyy")}</span>
                      <StatusDot status={log.status || "none"} />
                      <span className="capitalize">{log.status || "none"}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </button>
              );
            })}
          </div>
        </Card> */}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) => (
  <Card className="bg-card border-border p-4 hover:border-primary/50 transition-colors">
    <div className={`flex items-center gap-2 ${color} mb-1`}>
      {icon}
      <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-3xl font-mono font-bold">{value}</div>
  </Card>
);

const StatusDot = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    no_progress: "bg-muted",
    testing: "bg-warning",
    findings: "bg-info",
    vulnerability: "bg-destructive animate-pulse-glow",
  };
  return <span className={`h-2 w-2 rounded-full ${map[status] ?? "bg-muted"}`} />;
};

export default Dashboard;