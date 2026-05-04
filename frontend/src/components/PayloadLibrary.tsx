import { useState } from "react";
import { useProjectPayloads, useCreatePayload, useDeletePayload } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Loader2, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const PayloadLibrary = ({ projectId }: { projectId?: string }) => {
  const { data: payloads = [], isLoading } = useProjectPayloads(projectId);
  const create = useCreatePayload();
  const del = useDeletePayload();
  
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("XSS");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    if (!name.trim() || !content.trim()) {
      toast.error("Name and content are required");
      return;
    }
    create.mutate({ name, content, category, description, projectId: projectId || null });
    setName("");
    setContent("");
    setCategory("XSS");
    setDescription("");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Create form */}
      <Card className="p-4 border-border">
        <h3 className="text-sm font-mono mb-3">Add new payload</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="font-mono text-sm" />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="XSS">XSS</SelectItem>
                <SelectItem value="SQLi">SQLi</SelectItem>
                <SelectItem value="SSRF">SSRF</SelectItem>
                <SelectItem value="LFI">LFI</SelectItem>
                <SelectItem value="RCE">RCE</SelectItem>
                <SelectItem value="IDOR">IDOR</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Payload content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="font-mono text-xs"
            rows={3}
          />
          <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="font-mono text-sm" />
          <Button onClick={handleCreate} disabled={create.isPending} className="font-mono text-xs">
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Payload"}
          </Button>
        </div>
      </Card>

      {/* Payload list */}
      {payloads.length === 0 && <p className="text-xs text-muted-foreground font-mono py-4">No payloads yet.</p>}
      <div className="space-y-2">
        {payloads.map((p: any) => (
          <Card key={p.id} className="p-3 border-border">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm">{p.name}</span>
                  <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded">{p.category}</span>
                </div>
                {p.description && <p className="text-[11px] text-muted-foreground mt-1">{p.description}</p>}
                <pre className="text-xs bg-secondary p-2 rounded mt-2 overflow-x-auto font-mono">{p.content}</pre>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(p.content)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => del.mutate(p.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};