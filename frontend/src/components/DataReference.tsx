import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Shield, Package, Search, Copy, Check, Plus, Link2 } from "lucide-react";
import { toast } from "sonner";

interface DataReferenceProps {
  projectId: string;
  onInsert: (text: string) => void;
  onInsertLink: (type: string, id: string, name: string) => void; // ✅ Added for clickable links
  vulnerabilities?: any[];
  payloads?: any[];
  recon?: any[];
}

export const DataReference = ({ 
  projectId, 
  onInsert, 
  onInsertLink,  // ✅ New prop
  vulnerabilities = [], 
  payloads = [], 
  recon = [] 
}: DataReferenceProps) => {
  const [activeTab, setActiveTab] = useState<"vulns" | "payloads" | "recon">("vulns");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Insert formatted markdown (full details)
  const insertFormattedMarkdown = (type: string, data: any) => {
    let markdown = "";
    switch (type) {
      case "vuln":
        markdown = `\n## 🔴 Vulnerability: ${data.title}\n\n**Severity:** ${data.severity}\n**Status:** ${data.status}\n\n${data.notes || ""}\n\n**PoC:**\n\`\`\`\n${data.poc || "Not provided"}\n\`\`\`\n`;
        break;
      case "payload":
        markdown = `\n## 📦 Payload: ${data.name}\n\n**Category:** ${data.category}\n\n\`\`\`\n${data.content}\n\`\`\`\n\n${data.description ? `**Description:** ${data.description}\n` : ""}`;
        break;
      case "recon":
        markdown = `\n## 🔍 Recon: ${data.type}\n\n\`\`\`\n${data.value}\n\`\`\`\n${data.source ? `**Source:** ${data.source}\n` : ""}`;
        break;
    }
    onInsert(markdown);
    toast.success("Formatted markdown inserted");
  };

  // Insert clickable link syntax ([[type:id:name]])
  const insertClickableLink = (type: string, id: string, name: string) => {
    const linkSyntax = `[[${type}:${id}:${name}]]`;
    onInsertLink(type, id, name);
    toast.success("Clickable link inserted");
  };

  return (
    <Card className="p-3 border-border bg-secondary/30">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Reference Project Data
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 border-b border-border">
        <button
          onClick={() => setActiveTab("vulns")}
          className={`px-2 py-1 text-[10px] font-mono transition-colors ${
            activeTab === "vulns"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Shield className="h-3 w-3 inline mr-1" />
          Vulns ({vulnerabilities.length})
        </button>
        <button
          onClick={() => setActiveTab("payloads")}
          className={`px-2 py-1 text-[10px] font-mono transition-colors ${
            activeTab === "payloads"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package className="h-3 w-3 inline mr-1" />
          Payloads ({payloads.length})
        </button>
        <button
          onClick={() => setActiveTab("recon")}
          className={`px-2 py-1 text-[10px] font-mono transition-colors ${
            activeTab === "recon"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search className="h-3 w-3 inline mr-1" />
          Recon ({recon.length})
        </button>
      </div>

      {/* Content */}
      <div className="max-h-64 overflow-y-auto space-y-2">
        {activeTab === "vulns" && vulnerabilities.length === 0 && (
          <p className="text-[11px] text-muted-foreground font-mono text-center py-4">
            No vulnerabilities yet. Add some in the Vulnerabilities tab.
          </p>
        )}
        {activeTab === "vulns" && vulnerabilities.map((v) => (
          <div key={v.id} className="bg-card border border-border rounded p-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-destructive" />
                <span className="font-mono text-xs font-bold">{v.title}</span>
                <Badge variant="outline" className="text-[9px]">{v.severity}</Badge>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => copyToClipboard(v.title, v.id)}
                  title="Copy name"
                >
                  {copiedId === v.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-info"
                  onClick={() => insertClickableLink("vulnerability", v.id, v.title)}
                  title="Insert clickable link"
                >
                  <Link2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-primary"
                  onClick={() => insertFormattedMarkdown("vuln", v)}
                  title="Insert formatted details"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground line-clamp-2">
              {v.notes || "No description"}
            </p>
          </div>
        ))}

        {activeTab === "payloads" && payloads.length === 0 && (
          <p className="text-[11px] text-muted-foreground font-mono text-center py-4">
            No payloads yet. Add some in the Payloads tab.
          </p>
        )}
        {activeTab === "payloads" && payloads.map((p) => (
          <div key={p.id} className="bg-card border border-border rounded p-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Package className="h-3 w-3 text-info" />
                <span className="font-mono text-xs font-bold">{p.name}</span>
                <Badge variant="outline" className="text-[9px]">{p.category}</Badge>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => copyToClipboard(p.content, p.id)}
                  title="Copy payload"
                >
                  {copiedId === p.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-info"
                  onClick={() => insertClickableLink("payload", p.id, p.name)}
                  title="Insert clickable link"
                >
                  <Link2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-primary"
                  onClick={() => insertFormattedMarkdown("payload", p)}
                  title="Insert formatted details"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <pre className="text-[9px] font-mono bg-secondary/50 p-1 rounded overflow-x-auto">
              {p.content.slice(0, 60)}...
            </pre>
          </div>
        ))}

        {activeTab === "recon" && recon.length === 0 && (
          <p className="text-[11px] text-muted-foreground font-mono text-center py-4">
            No recon data yet. Add some in the Recon tab.
          </p>
        )}
        {activeTab === "recon" && recon.map((r) => (
          <div key={r.id} className="bg-card border border-border rounded p-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Search className="h-3 w-3 text-warning" />
                <span className="font-mono text-[10px] text-primary">{r.type}</span>
                <span className="font-mono text-xs">{r.value}</span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => copyToClipboard(r.value, r.id)}
                  title="Copy value"
                >
                  {copiedId === r.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-info"
                  onClick={() => insertClickableLink("recon", r.id, r.value)}
                  title="Insert clickable link"
                >
                  <Link2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-primary"
                  onClick={() => insertFormattedMarkdown("recon", r)}
                  title="Insert formatted details"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 pt-2 border-t border-border flex items-center justify-center gap-4 text-[9px] font-mono text-muted-foreground">
        <span className="flex items-center gap-1">
          <Link2 className="h-2.5 w-2.5 text-info" />
          Link (clickable badge)
        </span>
        <span className="flex items-center gap-1">
          <Plus className="h-2.5 w-2.5 text-primary" />
          Insert (formatted markdown)
        </span>
        <span className="flex items-center gap-1">
          <Copy className="h-2.5 w-2.5" />
          Copy
        </span>
      </div>
    </Card>
  );
};