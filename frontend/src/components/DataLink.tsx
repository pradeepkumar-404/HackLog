import { useNavigate } from "react-router-dom";
import { Shield, Package, Search, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataLinkProps {
  type: "vulnerability" | "payload" | "recon";
  id: string;
  name: string;
  projectId: string;
  className?: string;
}

export const DataLink = ({ type, id, name, projectId, className }: DataLinkProps) => {
  const navigate = useNavigate();

  const getIcon = () => {
    switch (type) {
      case "vulnerability":
        return <Shield className="h-3 w-3" />;
      case "payload":
        return <Package className="h-3 w-3" />;
      case "recon":
        return <Search className="h-3 w-3" />;
    }
  };

  const getPath = () => {
    switch (type) {
      case "vulnerability":
        return `/project/${projectId}?tab=vulns&highlight=${id}`;
      case "payload":
        return `/project/${projectId}?tab=payloads&highlight=${id}`;
      case "recon":
        return `/project/${projectId}?tab=recon&highlight=${id}`;
    }
  };

  const getColor = () => {
    switch (type) {
      case "vulnerability":
        return "text-destructive hover:text-destructive/80";
      case "payload":
        return "text-info hover:text-info/80";
      case "recon":
        return "text-warning hover:text-warning/80";
    }
  };

  const handleClick = () => {
    navigate(getPath());
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-secondary/50 border border-border",
        "hover:bg-secondary transition-all group cursor-pointer",
        className
      )}
      title={`View ${type}: ${name}`}
    >
      <span className={cn("inline-flex items-center gap-1 text-[11px] font-mono", getColor())}>
        {getIcon()}
        <span className="underline decoration-dotted">{name}</span>
        <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </span>
    </button>
  );
};