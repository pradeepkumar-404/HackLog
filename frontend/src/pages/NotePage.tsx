import { useNavigate, useParams } from "react-router-dom";
import { useNote, useUpdateNote, useDeleteNote, useProjectNotes, useProjectData } from "@/hooks/useApi";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";
import { format, isValid } from "date-fns";
import {
  ChevronRight,
  Trash2,
  Download,
  FileText,
  Paperclip,
  X,
  Loader2,
  Database,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { TagInput } from "@/components/TagInput";
import { fileToAttachment, type Attachment } from "@/lib/attachments";
import { downloadText, exportPDF } from "@/lib/export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DataReference } from "@/components/DataReference";
import { toast } from "sonner";

const NotePage = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: note, isLoading, error, refetch } = useNote(noteId!);
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const { data: projectNotes = [] } = useProjectNotes(note?.projectId || "");
  const { data: projectData } = useProjectData(note?.projectId || "");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showReference, setShowReference] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Refs for debouncing
  const titleTimeoutRef = useRef<NodeJS.Timeout>();
  const contentTimeoutRef = useRef<NodeJS.Timeout>();
  const tagsTimeoutRef = useRef<NodeJS.Timeout>();

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
      if (contentTimeoutRef.current) clearTimeout(contentTimeoutRef.current);
      if (tagsTimeoutRef.current) clearTimeout(tagsTimeoutRef.current);
    };
  }, []);

  // Load note data when fetched
  useEffect(() => {
  console.log("📝 Note data changed:", note);

  if (!note) return;

  if (typeof note !== "object") {
    console.error("❌ Invalid note type:", note);
    return;
  }

  console.log("✅ Loading note:", {
    id: note.id,
    projectId: note.projectId,
    name: note.name,
  });

  setTitle(note.name || "Untitled");
  setContent(note.content || "");
  setTags(Array.isArray(note.tags) ? note.tags : []);
  setAttachments(
    Array.isArray(note.attachments) ? note.attachments : []
  );

  const parsedDate = new Date(note.updatedAt);

  if (isValid(parsedDate)) {
    setLastSaved(parsedDate);
  } else {
    setLastSaved(null);
  }
}, [note]);

  const handleUpdate = useCallback(async (updates: Partial<any>) => {
    if (!note || !note.id || !note.projectId) {
      console.error("Cannot save note: missing note.id or note.projectId", { note });
      toast.error("Cannot save note: missing information");
      return;
    }
    
    setIsSaving(true);
    try {
      console.log("💾 Saving note:", { projectId: note.projectId, noteId: note.id, updates });
      await updateNote.mutateAsync(
        { projectId: note.projectId, noteId: note.id, data: updates }
      );
      setLastSaved(new Date());
      // Refetch to get updated data
      await refetch();
    } catch (error) {
      console.error("Failed to save note:", error);
      toast.error("Failed to save note");
    } finally {
      setIsSaving(false);
    }
  }, [note, updateNote, refetch]);

  const handleDeleteNote = useCallback(() => {
    if (!note || !note.id || !note.projectId) {
      console.error("Cannot delete note: missing note.id or note.projectId", { note });
      toast.error("Cannot delete note: missing information");
      return;
    }
    
    if (confirm("Delete this note?")) {
      deleteNote.mutate(
        { projectId: note.projectId, noteId: note.id },
        {
          onSuccess: () => {
            toast.success("Note deleted successfully");
            navigate(`/project/${note.projectId}`);
          },
          onError: (error) => {
            console.error("Failed to delete note:", error);
            toast.error("Failed to delete note");
          }
        }
      );
    }
  }, [note, deleteNote, navigate]);

  // Debounced title save
  const debouncedTitleSave = useCallback((newTitle: string) => {
    if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
    titleTimeoutRef.current = setTimeout(() => {
      if (note && note.id && note.projectId && newTitle !== note.name) {
        handleUpdate({ name: newTitle });
      }
    }, 1000);
  }, [note, handleUpdate]);

  // Debounced content save
  const debouncedContentSave = useCallback((newContent: string) => {
    if (contentTimeoutRef.current) clearTimeout(contentTimeoutRef.current);
    contentTimeoutRef.current = setTimeout(() => {
      if (note && note.id && note.projectId && newContent !== note.content) {
        handleUpdate({ content: newContent });
      }
    }, 1500);
  }, [note, handleUpdate]);

  // Debounced tags save
  const debouncedTagsSave = useCallback((newTags: string[]) => {
    if (tagsTimeoutRef.current) clearTimeout(tagsTimeoutRef.current);
    tagsTimeoutRef.current = setTimeout(() => {
      if (note && note.id && note.projectId && JSON.stringify(newTags) !== JSON.stringify(note.tags || [])) {
        handleUpdate({ tags: newTags });
      }
    }, 1000);
  }, [note, handleUpdate]);

  // Handle title change with debounce
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    debouncedTitleSave(newTitle);
  };

  // Handle content change with debounce
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    debouncedContentSave(newContent);
  };

  // Handle tags change with debounce
  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
    debouncedTagsSave(newTags);
  };

  const handleAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    toast.loading(`Uploading ${files.length} file(s)...`);
    
    const newAttachments = await Promise.all(files.map(fileToAttachment));
    const updated = [...attachments, ...newAttachments];
    setAttachments(updated);
    
    // Immediate save for attachments (no debounce)
    await handleUpdate({ attachments: updated });
    
    toast.dismiss();
    toast.success(`${files.length} file(s) attached`);
    e.target.value = "";
  };

  const removeAttachment = async (id: string) => {
    const updated = attachments.filter((a) => a.id !== id);
    setAttachments(updated);
    await handleUpdate({ attachments: updated });
    toast.success("Attachment removed");
  };

  const insertAtCursor = (text: string) => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + text + content.slice(end);
      setContent(newContent);
      handleUpdate({ content: newContent });
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = start + text.length;
        textarea.selectionEnd = start + text.length;
      }, 10);
    } else {
      const newContent = content + text;
      setContent(newContent);
      handleUpdate({ content: newContent });
    }
  };

  const insertClickableLink = (type: string, id: string, name: string) => {
    const linkSyntax = `[[${type}:${id}:${name}]]`;
    insertAtCursor(linkSyntax);
  };

  const exportContent = `# ${title}\n\n${content}`;

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state
  if (error) {
    console.error("Note page error:", error);
    return (
      <div className="p-8 font-mono text-muted-foreground">
        <p>Error loading note: {error.message}</p>
        <button onClick={() => navigate("/")} className="mt-4 text-primary underline">
          Go home
        </button>
      </div>
    );
  }

  // Show not found state
  if (!note || Array.isArray(note) || !note.id || !note.projectId) {
    console.error("Note page: Invalid note data", { note, isArray: Array.isArray(note) });
    return (
      <div className="p-8 font-mono text-muted-foreground">
        <p>Note not found or corrupted.</p>
        <p className="text-xs mt-2">Note ID: {noteId}</p>
        <button onClick={() => navigate("/")} className="mt-4 text-primary underline">
          Go home
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Save indicator */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-primary/10 text-primary px-3 py-1.5 rounded-md text-xs font-mono flex items-center gap-2 z-50">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving...
        </div>
      )}

      {/* Last saved indicator */}
      {lastSaved && !isSaving && isValid(lastSaved) && (
        <div className="fixed bottom-4 right-4 text-[10px] text-muted-foreground font-mono bg-background/80 px-2 py-1 rounded-md">
          Saved {format(lastSaved, "h:mm:ss a")}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3">
        <button onClick={() => navigate("/")} className="hover:text-primary">
          ~
        </button>
        <ChevronRight className="h-3 w-3" />
        <button
          onClick={() => navigate(`/project/${note.projectId}`)}
          className="hover:text-primary"
        >
          project
        </button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-primary truncate">{title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled"
          className="text-3xl font-bold font-mono border-0 px-0 h-auto bg-transparent focus-visible:ring-0"
        />
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 font-mono text-xs">
                <Download className="h-3.5 w-3.5" /> export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => downloadText(`${title}.md`, exportContent)}>
                <FileText className="h-3.5 w-3.5 mr-2" /> Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportPDF(title, exportContent)}>
                <FileText className="h-3.5 w-3.5 mr-2" /> PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteNote}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="text-[11px] font-mono text-muted-foreground mb-4 flex items-center gap-3">
        {note?.updatedAt && isValid(new Date(note.updatedAt)) ? (
          <span>
            last edited {format(new Date(note.updatedAt), "MMM d, yyyy 'at' HH:mm")}
          </span>
        ) : (
          <span>last edited unavailable</span>
        )}
        {attachments.length > 0 && (
          <span className="text-primary">📎 {attachments.length} attachment(s)</span>
        )}
      </div>

      {/* Markdown Editor with Data Reference */}
      <div className="mb-4">
        <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReference(!showReference)}
            className="gap-1.5 font-mono text-xs"
          >
            <Database className="h-3.5 w-3.5" />
            {showReference ? "Hide" : "Show"} Project Data
          </Button>
        </div>

        {showReference && projectData && (
          <div className="mb-4">
            <DataReference
              projectId={note.projectId}
              onInsert={insertAtCursor}
              onInsertLink={insertClickableLink}
              vulnerabilities={projectData.vulnerabilities}
              payloads={projectData.payloads}
              recon={projectData.recon}
            />
          </div>
        )}

        <MarkdownEditor
          value={content}
          onChange={handleContentChange}
          minHeight="500px"
          projectId={note.projectId}
          onInsertLink={(type, id, name) => {
            const linkSyntax = `[[${type}:${id}:${name}]]`;
            insertAtCursor(linkSyntax);
          }}
        />
      </div>

      {/* Tags & Attachments */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
            tags
          </div>
          <TagInput
            tags={tags}
            onChange={handleTagsChange}
            suggestions={["xss", "idor", "ssrf", "rce", "sqli", "csrf", "auth", "recon"]}
          />
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
            attachments ({attachments.length})
          </div>
          <label className="inline-flex items-center gap-1.5 text-xs font-mono text-primary cursor-pointer hover:underline">
            <Paperclip className="h-3.5 w-3.5" /> attach files
            <input type="file" multiple onChange={handleAttach} className="hidden" />
          </label>
          <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
            {attachments.length === 0 && (
              <p className="text-[10px] text-muted-foreground font-mono">No attachments yet.</p>
            )}
            {attachments.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2 bg-secondary rounded px-2 py-1 text-xs font-mono group"
              >
                {a.type.startsWith("image/") ? (
                  <img src={a.dataUrl} alt={a.name} className="h-8 w-8 object-cover rounded" />
                ) : (
                  <Paperclip className="h-3 w-3" />
                )}
                <a
                  href={a.dataUrl}
                  download={a.name}
                  className="flex-1 truncate text-foreground hover:text-primary"
                >
                  {a.name}
                </a>
                <span className="text-muted-foreground text-[9px]">{Math.round(a.size / 1024)}kb</span>
                <button
                  onClick={() => removeAttachment(a.id)}
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Note Linking */}
      {projectNotes && projectNotes.length > 1 && (
        <div className="mt-6 p-3 border border-border rounded-md">
          <h4 className="text-xs font-mono text-muted-foreground mb-2">Linked Notes</h4>
          <div className="flex flex-wrap gap-2">
            {projectNotes
              .filter((n: any) => n.id !== note.id)
              .map((other: any) => (
                <Badge
                  key={other.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-secondary"
                  onClick={() => navigate(`/note/${other.id}`)}
                >
                  {other.name}
                </Badge>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotePage;