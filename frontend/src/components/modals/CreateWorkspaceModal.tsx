import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  isLoading?: boolean;
}

export const CreateWorkspaceModal = ({
  isOpen,
  onClose,
  onCreate,
  isLoading = false,
}: CreateWorkspaceModalProps) => {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
      setName("");
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Workspace" description="A workspace contains all your targets and notes.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-mono text-muted-foreground block mb-1">
            Workspace Name
          </label>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Bug Bounty, Pentesting, My Research"
            className="font-mono text-sm"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Workspace"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};