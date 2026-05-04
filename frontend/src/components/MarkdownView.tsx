import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
import { DataLink } from "./DataLink";

interface Props {
  content: string;
  className?: string;
  projectId?: string;
}

// Parse custom notation like [[vuln:123:SQL Injection]] or [[payload:456:XSS Payload]] or [[recon:789:admin.example.com]]
const parseCustomLinks = (text: string, projectId?: string) => {
  const regex = /\[\[(vulnerability|payload|recon):([a-fA-F0-9]+):([^\]]+)\]\]/g;
  const parts: Array<{ type: "text" | "link"; content?: string; dataType?: string; id?: string; name?: string; projectId?: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    // Add custom link component
    parts.push({
      type: "link",
      dataType: match[1],
      id: match[2],
      name: match[3],
      projectId: projectId,
    });
    lastIndex = match.index + match[0].length;
  }
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }
  return parts;
};

export const MarkdownView = ({ content, className, projectId }: Props) => {
  const parsedParts = parseCustomLinks(content, projectId);

  // If there are custom links, render them with components
  if (parsedParts.some(part => part.type === "link")) {
    return (
      <div className={cn("prose-hack font-sans", className)}>
        {parsedParts.map((part, idx) => {
          if (part.type === "text" && part.content) {
            return (
              <ReactMarkdown key={idx} remarkPlugins={[remarkGfm]}>
                {part.content}
              </ReactMarkdown>
            );
          } else if (part.type === "link" && part.projectId && part.id && part.name) {
            return (
              <DataLink
                key={idx}
                type={part.dataType as any}
                id={part.id}
                name={part.name}
                projectId={part.projectId}
              />
            );
          }
          return null;
        })}
      </div>
    );
  }

  // No custom links - normal markdown rendering
  return (
    <div className={cn("prose-hack font-sans", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            if (!inline && match) {
              return (
                <SyntaxHighlighter
                  language={match[1]}
                  style={vscDarkPlus as any}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    background: "hsl(var(--secondary))",
                    fontSize: "0.875rem",
                  }}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content || "_Empty note. Start writing in markdown..._"}
      </ReactMarkdown>
    </div>
  );
};