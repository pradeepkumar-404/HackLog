import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MarkdownView } from "./MarkdownView";
import { Eye, EyeOff, Bold, Italic, Code, List, Link as LinkIcon, Heading1, Shield, Package, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  projectId?: string;
  onInsertLink?: (type: string, id: string, name: string) => void;
}

export const MarkdownEditor = ({
  value,
  onChange,
  placeholder = "# Start writing in markdown...\n\nUse ``` for code blocks, ## for headings, - for lists.",
  minHeight = "300px",
  className,
  projectId,
  onInsertLink,
}: Props) => {
  const [preview, setPreview] = useState(false);
  const [showLinkMenu, setShowLinkMenu] = useState(false);

  const wrap = (before: string, after = before) => {
    const ta = document.activeElement as HTMLTextAreaElement | null;
    if (!ta || ta.tagName !== "TEXTAREA") {
      onChange(value + before + after);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = end + before.length;
    });
  };

  const insertLink = (type: string, id: string, name: string) => {
    const linkSyntax = `[[${type}:${id}:${name}]]`;
    wrap(linkSyntax, "");
    setShowLinkMenu(false);
  };

  return (
    <div className={cn("rounded-md border border-border bg-card", className)}>
      <div className="flex items-center gap-1 border-b border-border px-2 py-1.5 flex-wrap">
        <ToolBtn onClick={() => wrap("**")} icon={<Bold className="h-3.5 w-3.5" />} label="Bold" />
        <ToolBtn onClick={() => wrap("_")} icon={<Italic className="h-3.5 w-3.5" />} label="Italic" />
        <ToolBtn onClick={() => wrap("# ", "")} icon={<Heading1 className="h-3.5 w-3.5" />} label="H1" />
        <ToolBtn onClick={() => wrap("`")} icon={<Code className="h-3.5 w-3.5" />} label="Code" />
        <ToolBtn onClick={() => wrap("- ", "")} icon={<List className="h-3.5 w-3.5" />} label="List" />
        
        {/* Insert Data Link Button */}
        {onInsertLink && (
          <div className="relative">
            <ToolBtn
              onClick={() => setShowLinkMenu(!showLinkMenu)}
              icon={<LinkIcon className="h-3.5 w-3.5" />}
              label="Insert Data Link"
            />
            {showLinkMenu && (
              <div className="absolute top-full left-0 mt-1 z-10 bg-popover border border-border rounded-md shadow-lg p-1 min-w-[180px]">
                <button
                  onClick={() => insertLink("vulnerability", "example-id", "Vulnerability Name")}
                  className="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-secondary rounded flex items-center gap-2"
                >
                  <Shield className="h-3 w-3 text-destructive" />
                  Link Vulnerability
                </button>
                <button
                  onClick={() => insertLink("payload", "example-id", "Payload Name")}
                  className="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-secondary rounded flex items-center gap-2"
                >
                  <Package className="h-3 w-3 text-info" />
                  Link Payload
                </button>
                <button
                  onClick={() => insertLink("recon", "example-id", "Recon Data")}
                  className="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-secondary rounded flex items-center gap-2"
                >
                  <Search className="h-3 w-3 text-warning" />
                  Link Recon
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="ml-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPreview((p) => !p)}
            className="h-7 gap-1.5 text-xs"
          >
            {preview ? <><EyeOff className="h-3.5 w-3.5" /> Edit</> : <><Eye className="h-3.5 w-3.5" /> Preview</>}
          </Button>
        </div>
      </div>

      {preview ? (
        <div className="p-4 overflow-auto pl-10 pt-7 rounded-none" style={{ minHeight }}>
          <MarkdownView content={value} projectId={projectId} />
        </div>
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="border-0 pl-10 pt-10 rounded-none bg-transparent font-mono text-sm focus-visible:ring-0 resize-none"
          style={{ minHeight }}
        />
      )}
    </div>
  );
};

const ToolBtn = ({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    title={label}
    className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
  >
    {icon}
  </Button>
);