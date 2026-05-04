import { useState } from "react";
import { useProjectRecon, useCreateRecon, useDeleteRecon } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Loader2, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

export const ReconDataPanel = ({ projectId }: { projectId: string }) => {
  const { data: recon = [], isLoading } = useProjectRecon(projectId);
  const create = useCreateRecon();
  const del = useDeleteRecon();
  
  const [value, setValue] = useState("");
  const [type, setType] = useState<"subdomain" | "url" | "parameter" | "endpoint">("subdomain");
  const [source, setSource] = useState("manual");

  const handleCreate = () => {
    if (!value.trim()) return;
    create.mutate({ type, value: value.trim(), source, projectId });
    setValue("");
  };

  const exportRecon = () => {
    const content = recon.map(r => `${r.type}: ${r.value}`).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recon-${projectId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Add recon entry */}
      <div className="flex gap-2 flex-wrap">
        <Select value={type} onValueChange={(v: any) => setType(v)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="subdomain">Subdomain</SelectItem>
            <SelectItem value="url">URL</SelectItem>
            <SelectItem value="parameter">Parameter</SelectItem>
            <SelectItem value="endpoint">Endpoint</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="e.g. admin.example.com"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 font-mono text-sm"
        />
        <Button onClick={handleCreate} disabled={create.isPending} className="font-mono text-xs">
          {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
        </Button>
        {recon.length > 0 && (
          <Button variant="outline" size="sm" onClick={exportRecon} className="gap-1">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        )}
      </div>

      {/* Recon list */}
      {recon.length === 0 && <p className="text-xs text-muted-foreground font-mono py-4">No recon data yet. Add subdomains, URLs, etc.</p>}
      <div className="space-y-1">
        {recon.map((r: any) => (
          <div key={r.id} className="flex justify-between items-center p-2 border-b border-border group">
            <div className="flex gap-2 items-center">
              <span className="text-[10px] font-mono text-primary w-20">{r.type}</span>
              <span className="font-mono text-sm">{r.value}</span>
              {r.source && <span className="text-[10px] text-muted-foreground">({r.source})</span>}
            </div>
            <Button variant="ghost" size="sm" onClick={() => del.mutate(r.id)} className="opacity-0 group-hover:opacity-100">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};