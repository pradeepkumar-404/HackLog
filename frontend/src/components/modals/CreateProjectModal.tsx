import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, target: string, scope: string) => void;
  isLoading?: boolean;
}

export const CreateProjectModal = ({
  isOpen,
  onClose,
  onCreate,
  isLoading = false,
}: CreateProjectModalProps) => {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [scope, setScope] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), target.trim(), scope.trim());
      setName("");
      setTarget("");
      setScope("");
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Target / Project" description="Add a new target to your workspace.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-mono text-muted-foreground block mb-1">
            Project Name *
          </label>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., example.com, API Security Assessment"
            className="font-mono text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground block mb-1">
            Target Domain / URL
          </label>
          <Input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="example.com, https://api.example.com"
            className="font-mono text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground block mb-1">
            Scope (Optional)
          </label>
          <Textarea
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            placeholder="*.example.com&#10;!admin.example.com&#10;192.168.1.0/24"
            className="font-mono text-xs"
            rows={3}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};