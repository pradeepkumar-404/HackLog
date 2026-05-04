import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects, useAllLogs, useWorkspaceNotes, useWorkspaceVulnerabilities, useWorkspacePayloads, useWorkspaceRecon } from "@/hooks/useApi";
import { useUIStore } from "@/lib/uiStore";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Shield, Package, Search as SearchIcon, Calendar as CalIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

const SearchPage = () => {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useUIStore();
  const { data: projects = [] } = useProjects(activeWorkspaceId ?? undefined);
  const { data: logs = [] } = useAllLogs();
  const [q, setQ] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");

  // Fetch ALL data from workspace when "all" is selected
  // Or fetch specific project data when a project is selected
  const isAllProjects = projectFilter === "all";
  
  // Workspace-wide data (for "all targets")
  const { data: workspaceNotes = [] } = useWorkspaceNotes(isAllProjects ? activeWorkspaceId ?? undefined : undefined);
  const { data: workspaceVulns = [] } = useWorkspaceVulnerabilities(isAllProjects ? activeWorkspaceId ?? undefined : undefined);
  const { data: workspacePayloads = [] } = useWorkspacePayloads(isAllProjects ? activeWorkspaceId ?? undefined : undefined);
  const { data: workspaceRecon = [] } = useWorkspaceRecon(isAllProjects ? activeWorkspaceId ?? undefined : undefined);
  
  // Single project data (for specific project)
  const { data: singleNotes = [] } = useProjectNotes(!isAllProjects && projectFilter !== "all" ? projectFilter : "");
  const { data: singleVulns = [] } = useProjectVulnerabilities(!isAllProjects && projectFilter !== "all" ? projectFilter : "");
  const { data: singlePayloads = [] } = useProjectPayloads(!isAllProjects && projectFilter !== "all" ? projectFilter : "");
  const { data: singleRecon = [] } = useProjectRecon(!isAllProjects && projectFilter !== "all" ? projectFilter : "");

  // Use the appropriate data based on filter
  const allNotes = isAllProjects ? workspaceNotes : singleNotes;
  const allVulns = isAllProjects ? workspaceVulns : singleVulns;
  const allPayloads = isAllProjects ? workspacePayloads : singlePayloads;
  const allRecon = isAllProjects ? workspaceRecon : singleRecon;

  // Debug logging
  console.log("🔍 Search - Project Filter:", projectFilter);
  console.log("🔍 Search - isAllProjects:", isAllProjects);
  console.log("🔍 Search - Notes count:", allNotes.length);
  console.log("🔍 Search - Vulns count:", allVulns.length);
  console.log("🔍 Search - Payloads count:", allPayloads.length);
  console.log("🔍 Search - Recon count:", allRecon.length);
  console.log("🔍 Search - Logs count:", logs.length);

  // Collect all tags from all data sources
  const allTags = useMemo(() => {
    const set = new Set<string>();
    allNotes.forEach((n: any) => n.tags?.forEach((t: string) => set.add(t)));
    allVulns.forEach((v: any) => {
      if (v.severity) set.add(v.severity.toLowerCase());
      if (v.status) set.add(v.status.toLowerCase());
    });
    allPayloads.forEach((p: any) => {
      if (p.category) set.add(p.category.toLowerCase());
    });
    allRecon.forEach((r: any) => {
      if (r.type) set.add(r.type);
    });
    logs.forEach((l: any) => l.tags?.forEach((t: string) => set.add(t)));
    return Array.from(set).sort();
  }, [allNotes, allVulns, allPayloads, allRecon, logs]);

  const matches = useMemo(() => {
    const ql = q.toLowerCase().trim();
    if (!ql && tagFilter === "all") return { notes: [], vulns: [], payloads: [], recon: [], logs: [] };
    
    const matchNote = (note: any) => {
      if (tagFilter !== "all") {
        const matchesTag = note.tags?.some((t: string) => t.toLowerCase() === tagFilter.toLowerCase());
        if (!matchesTag) return false;
      }
      if (!ql) return true;
      return (
        note.name?.toLowerCase().includes(ql) ||
        note.content?.toLowerCase().includes(ql) ||
        note.tags?.some((t: string) => t.toLowerCase().includes(ql))
      );
    };
    
    const matchVuln = (vuln: any) => {
      if (tagFilter !== "all") {
        const matchesTag = 
          vuln.severity?.toLowerCase() === tagFilter.toLowerCase() ||
          vuln.status?.toLowerCase() === tagFilter.toLowerCase();
        if (!matchesTag) return false;
      }
      if (!ql) return true;
      return (
        vuln.title?.toLowerCase().includes(ql) ||
        vuln.notes?.toLowerCase().includes(ql) ||
        vuln.poc?.toLowerCase().includes(ql) ||
        vuln.severity?.toLowerCase().includes(ql) ||
        vuln.status?.toLowerCase().includes(ql)
      );
    };
    
    const matchPayload = (payload: any) => {
      if (tagFilter !== "all") {
        const matchesTag = payload.category?.toLowerCase() === tagFilter.toLowerCase();
        if (!matchesTag) return false;
      }
      if (!ql) return true;
      return (
        payload.name?.toLowerCase().includes(ql) ||
        payload.content?.toLowerCase().includes(ql) ||
        payload.description?.toLowerCase().includes(ql) ||
        payload.category?.toLowerCase().includes(ql)
      );
    };
    
    const matchRecon = (recon: any) => {
      if (tagFilter !== "all") {
        const matchesTag = recon.type?.toLowerCase() === tagFilter.toLowerCase();
        if (!matchesTag) return false;
      }
      if (!ql) return true;
      return (
        recon.value?.toLowerCase().includes(ql) ||
        recon.type?.toLowerCase().includes(ql) ||
        recon.source?.toLowerCase().includes(ql)
      );
    };
    
    const matchLog = (log: any) => {
      if (tagFilter !== "all" && !log.tags?.some((t: string) => t.toLowerCase() === tagFilter.toLowerCase())) return false;
      if (!ql) return true;
      return (
        log.notes?.toLowerCase().includes(ql) ||
        log.findings?.toLowerCase().includes(ql) ||
        log.vulnerabilities?.toLowerCase().includes(ql) ||
        log.cookies?.toLowerCase().includes(ql) ||
        log.headers?.toLowerCase().includes(ql) ||
        log.tags?.some((t: string) => t.toLowerCase().includes(ql))
      );
    };
    
    // Apply type filter
    const notes = (typeFilter === "all" || typeFilter === "notes") ? allNotes.filter(matchNote) : [];
    const vulns = (typeFilter === "all" || typeFilter === "vulnerabilities") ? allVulns.filter(matchVuln) : [];
    const payloads = (typeFilter === "all" || typeFilter === "payloads") ? allPayloads.filter(matchPayload) : [];
    const recon = (typeFilter === "all" || typeFilter === "recon") ? allRecon.filter(matchRecon) : [];
    // Filter logs by project if needed - logs already have projectId
    let filteredLogs = (typeFilter === "all" || typeFilter === "logs") ? logs.filter(matchLog) : [];
    
    // Add project filtering for logs (since logs aren't in the workspace hooks)
    if (projectFilter !== "all") {
      filteredLogs = filteredLogs.filter((log: any) => log.projectId === projectFilter);
    }
    
    return { notes, vulns, payloads, recon, logs: filteredLogs };
  }, [q, projectFilter, typeFilter, tagFilter, allNotes, allVulns, allPayloads, allRecon, logs]);

  // Helper function to get project name
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || "Unknown";
  };

  const highlight = (text: string) => {
    if (!q.trim()) return text?.slice(0, 200) || "";
    const idx = text?.toLowerCase().indexOf(q.toLowerCase()) ?? -1;
    if (idx === -1) return text?.slice(0, 200) || "";
    const start = Math.max(0, idx - 40);
    const snippet = text.slice(start, idx + q.length + 120);
    return (start > 0 ? "..." : "") + snippet;
  };

  const totalResults = matches.notes.length + matches.vulns.length + matches.payloads.length + matches.recon.length + matches.logs.length;

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3">
        <Search className="h-3 w-3" /> <span>search</span>
      </div>
      <h1 className="text-3xl font-bold font-mono mb-6">
        <span className="text-primary">›</span> grep across everything
      </h1>

      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search notes, vulnerabilities, payloads, recon, logs by title, content, tags..."
            className="pl-9 h-11 font-mono text-sm bg-card border-border"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="h-8 w-[180px] font-mono text-xs">
              <SelectValue placeholder="project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-mono text-xs">📊 all targets</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id} className="font-mono text-xs">🎯 {p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 w-[140px] font-mono text-xs">
              <SelectValue placeholder="type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-mono text-xs">all types</SelectItem>
              <SelectItem value="notes" className="font-mono text-xs">notes</SelectItem>
              <SelectItem value="vulnerabilities" className="font-mono text-xs">vulnerabilities</SelectItem>
              <SelectItem value="payloads" className="font-mono text-xs">payloads</SelectItem>
              <SelectItem value="recon" className="font-mono text-xs">recon</SelectItem>
              <SelectItem value="logs" className="font-mono text-xs">logs</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="h-8 w-[160px] font-mono text-xs">
              <SelectValue placeholder="tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-mono text-xs">all tags</SelectItem>
              {allTags.map((t) => (
                <SelectItem key={t} value={t} className="font-mono text-xs">#{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {totalResults > 0 && (
          <p className="text-[10px] font-mono text-muted-foreground">
            Found {totalResults} result{totalResults !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <div className="space-y-8">
        {/* Notes Section */}
        {(typeFilter === "all" || typeFilter === "notes") && matches.notes.length > 0 && (
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
              <FileText className="h-3 w-3" /> notes ({matches.notes.length})
            </h2>
            <div className="space-y-1">
              {matches.notes.map((n: any) => (
                <button
                  key={n.id}
                  onClick={() => navigate(`/note/${n.id}`)}
                  className="w-full text-left bg-card border border-border rounded-md p-3 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-mono text-sm font-bold">{n.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">· {getProjectName(n.projectId)}</span>
                    {n.tags?.slice(0, 3).map((t: string) => (
                      <Badge key={t} variant="secondary" className="h-4 px-1 text-[9px] font-mono">#{t}</Badge>
                    ))}
                  </div>
                  <p className="text-[11px] font-mono text-muted-foreground line-clamp-2">
                    {highlight(n.content)}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Vulnerabilities Section */}
        {(typeFilter === "all" || typeFilter === "vulnerabilities") && matches.vulns.length > 0 && (
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
              <Shield className="h-3 w-3 text-destructive" /> vulnerabilities ({matches.vulns.length})
            </h2>
            <div className="space-y-1">
              {matches.vulns.map((v: any) => (
                <button
                  key={v.id}
                  onClick={() => navigate(`/project/${v.projectId}?tab=vulns&highlight=${v.id}`)}
                  className="w-full text-left bg-card border border-border rounded-md p-3 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Shield className="h-3.5 w-3.5 text-destructive" />
                    <span className="font-mono text-sm font-bold">{v.title}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">· {getProjectName(v.projectId)}</span>
                    <Badge variant="outline" className="text-[9px]">{v.severity}</Badge>
                    <Badge variant="outline" className="text-[9px]">{v.status}</Badge>
                  </div>
                  <p className="text-[11px] font-mono text-muted-foreground line-clamp-2">
                    {highlight(v.notes || v.poc || "")}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Payloads Section */}
        {(typeFilter === "all" || typeFilter === "payloads") && matches.payloads.length > 0 && (
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
              <Package className="h-3 w-3 text-primary" /> payloads ({matches.payloads.length})
            </h2>
            <div className="space-y-1">
              {matches.payloads.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/project/${p.projectId}?tab=payloads&highlight=${p.id}`)}
                  className="w-full text-left bg-card border border-border rounded-md p-3 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Package className="h-3.5 w-3.5 text-primary" />
                    <span className="font-mono text-sm font-bold">{p.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">· {getProjectName(p.projectId)}</span>
                    <Badge variant="outline" className="text-[9px]">{p.category}</Badge>
                  </div>
                  <pre className="text-[10px] font-mono text-muted-foreground line-clamp-2 bg-secondary/30 p-1 rounded">
                    {highlight(p.content)}
                  </pre>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Recon Section */}
        {(typeFilter === "all" || typeFilter === "recon") && matches.recon.length > 0 && (
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
              <SearchIcon className="h-3 w-3 text-warning" /> recon ({matches.recon.length})
            </h2>
            <div className="space-y-1">
              {matches.recon.map((r: any) => (
                <button
                  key={r.id}
                  onClick={() => navigate(`/project/${r.projectId}?tab=recon&highlight=${r.id}`)}
                  className="w-full text-left bg-card border border-border rounded-md p-3 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <SearchIcon className="h-3.5 w-3.5 text-warning" />
                    <span className="font-mono text-[10px] text-primary">{r.type}</span>
                    <span className="font-mono text-sm">{r.value}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">· {getProjectName(r.projectId)}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Logs Section */}
        {(typeFilter === "all" || typeFilter === "logs") && matches.logs.length > 0 && (
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
              <CalIcon className="h-3 w-3" /> logs ({matches.logs.length})
            </h2>
            <div className="space-y-1">
              {matches.logs.map((l: any) => {
                const text = [l.notes, l.findings, l.vulnerabilities].filter(Boolean).join(" • ");
                return (
                  <button
                    key={l.id}
                    onClick={() => navigate(`/calendar/${l.date}?project=${l.projectId ?? ""}`)}
                    className="w-full text-left bg-card border border-border rounded-md p-3 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <CalIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-mono text-sm">{format(new Date(l.date), "MMM d, yyyy")}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">· {getProjectName(l.projectId)}</span>
                      {l.tags?.map((t: string) => (
                        <Badge key={t} variant="secondary" className="h-4 px-1 text-[9px] font-mono">#{t}</Badge>
                      ))}
                    </div>
                    <p className="text-[11px] font-mono text-muted-foreground line-clamp-2">
                      {highlight(text)}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {totalResults === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-mono text-muted-foreground">No results found.</p>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              Try searching by title, content, tags, or use filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Import missing hooks
import { useProjectNotes, useProjectVulnerabilities, useProjectPayloads, useProjectRecon } from "@/hooks/useApi";

export default SearchPage;