import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
  isLoading?: boolean;
}

export const CreateNoteModal = ({
  isOpen,
  onClose,
  onCreate,
  isLoading = false,
}: CreateNoteModalProps) => {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onCreate(title.trim());
      setTitle("");
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Note" description="Create a new note in markdown format.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-mono text-muted-foreground block mb-1">
            Note Title
          </label>
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Recon Results, SQL Injection Findings"
            className="font-mono text-sm"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim() || isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Note"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};