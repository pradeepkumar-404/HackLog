import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
}: ModalProps) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      {/* Modal */}
      <div
        className={cn(
          "relative z-50 w-full mx-4 bg-card border border-border rounded-lg shadow-xl animate-in zoom-in-95 fade-in duration-200",
          sizeClasses[size]
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-mono font-bold text-foreground">{title}</h2>
            {description && (
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        {/* Content */}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};