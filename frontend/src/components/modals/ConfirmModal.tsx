import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) => {
  const variantColors = {
    danger: "bg-destructive hover:bg-destructive/90",
    warning: "bg-warning hover:bg-warning/90",
    info: "bg-primary hover:bg-primary/90",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {variant === "danger" && <AlertTriangle className="h-5 w-5 text-destructive" />}
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            type="button"
            className={variantColors[variant]}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};