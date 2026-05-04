import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNoteLinks, useCreateNoteLink, useDeleteNoteLink, useProjectNotes } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Link2, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface NoteLinksProps {
  noteId: string;
  projectId: string;
  currentNoteTitle: string;
}

export const NoteLinks = ({ noteId, projectId, currentNoteTitle }: NoteLinksProps) => {
  const queryClient = useQueryClient();
  const { data: backlinks = [], isLoading: backlinksLoading } = useNoteLinks(noteId, "backlinks");
  const { data: outgoingLinks = [], isLoading: outgoingLoading } = useNoteLinks(noteId, "outgoing");
  const createLink = useCreateNoteLink();
  const deleteLink = useDeleteNoteLink();
  const { data: projectNotes = [], isLoading: notesLoading } = useProjectNotes(projectId);
  const [targetNoteId, setTargetNoteId] = useState("");

  const otherNotes = projectNotes.filter((n: any) => n.id !== noteId);

  const handleCreateLink = () => {
    if (!targetNoteId) {
      toast.error("Select a note to link");
      return;
    }
    createLink.mutate(
      { fromNoteId: noteId, toNoteId: targetNoteId },
      {
        onSuccess: () => {
          toast.success("Note linked");
          setTargetNoteId("");
          queryClient.invalidateQueries({ queryKey: ["noteLinks", noteId] });
        },
        onError: () => toast.error("Failed to create link"),
      }
    );
  };

  const handleDeleteLink = (fromId: string, toId: string) => {
    deleteLink.mutate(
      { fromNoteId: fromId, toNoteId: toId },
      {
        onSuccess: () => {
          toast.success("Link removed");
          queryClient.invalidateQueries({ queryKey: ["noteLinks", noteId] });
        },
        onError: () => toast.error("Failed to remove link"),
      }
    );
  };

  if (backlinksLoading || outgoingLoading || notesLoading) {
    return (
      <Card className="p-4 border-border">
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-border space-y-4">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-primary" />
        <h3 className="font-mono text-sm font-semibold">Note Links</h3>
      </div>

      {/* Create new link */}
      <div className="flex gap-2">
        <Select value={targetNoteId} onValueChange={setTargetNoteId}>
          <SelectTrigger className="flex-1 font-mono text-xs">
            <SelectValue placeholder="Link to another note..." />
          </SelectTrigger>
          <SelectContent>
            {otherNotes.map((note: any) => (
              <SelectItem key={note.id} value={note.id} className="font-mono text-xs">
                {note.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={handleCreateLink} disabled={createLink.isPending || !targetNoteId}>
          {createLink.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Link"}
        </Button>
      </div>

      {/* Outgoing links */}
      {outgoingLinks.length > 0 && (
        <div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground mb-2">Outgoing links</div>
          <div className="space-y-1">
            {outgoingLinks.map((link: any) => (
              <div key={link.toNoteId._id} className="flex justify-between items-center bg-secondary/30 rounded px-2 py-1">
                <span className="font-mono text-xs">→ {link.toNoteId.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteLink(noteId, link.toNoteId._id)}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground mb-2">Backlinks</div>
          <div className="space-y-1">
            {backlinks.map((link: any) => (
              <div key={link.fromNoteId._id} className="flex justify-between items-center bg-secondary/30 rounded px-2 py-1">
                <span className="font-mono text-xs">← {link.fromNoteId.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteLink(link.fromNoteId._id, noteId)}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {outgoingLinks.length === 0 && backlinks.length === 0 && (
        <p className="text-[11px] text-muted-foreground font-mono text-center py-2">
          No links yet. Link this note to others to build your knowledge graph.
        </p>
      )}
    </Card>
  );
};