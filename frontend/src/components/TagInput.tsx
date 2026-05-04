import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

export const TagInput = ({ tags, onChange, suggestions = [], placeholder = "add tag..." }: Props) => {
  const [input, setInput] = useState("");

  const add = (t: string) => {
    const v = t.trim().toLowerCase();
    if (!v || tags.includes(v)) return;
    onChange([...tags, v]);
    setInput("");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <Badge
            key={t}
            variant="secondary"
            className="gap-1 font-mono text-xs bg-secondary text-accent border border-border"
          >
            #{t}
            <button onClick={() => onChange(tags.filter((x) => x !== t))} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(input);
          }
        }}
        onBlur={() => input && add(input)}
        placeholder={placeholder}
        className="h-8 font-mono text-xs"
      />
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestions
            .filter((s) => !tags.includes(s))
            .slice(0, 6)
            .map((s) => (
              <button
                key={s}
                onClick={() => add(s)}
                className="text-xs font-mono text-muted-foreground hover:text-primary"
              >
                +#{s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
};
