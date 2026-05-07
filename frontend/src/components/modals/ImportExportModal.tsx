import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Download, Upload, FileJson, AlertCircle } from "lucide-react";
import { useExportWorkspace, useImportWorkspace, useBackupInfo } from "@/hooks/useApi";
import { useUIStore } from "@/lib/uiStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportExportModal = ({ isOpen, onClose }: ImportExportModalProps) => {
  console.log("🔵 [ImportExportModal] Component rendering, isOpen:", isOpen);
  
  const { activeWorkspaceId } = useUIStore();
  const [importMode, setImportMode] = useState<"export" | "import">("export");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [importing, setImporting] = useState(false);
  
  console.log("🔵 [ImportExportModal] activeWorkspaceId:", activeWorkspaceId);
  
  const exportWorkspace = useExportWorkspace();
  const importWorkspace = useImportWorkspace();
  const { data: backupInfo, isLoading: backupLoading, error: backupError } = useBackupInfo(activeWorkspaceId || "");
  
  console.log("🔵 [ImportExportModal] backupInfo:", backupInfo);
  console.log("🔵 [ImportExportModal] backupError:", backupError);
  
  useEffect(() => {
    if (isOpen) {
      console.log("🔵 [ImportExportModal] Modal opened");
    }
  }, [isOpen]);
  
  const handleExport = async () => {
    console.log("🔵 [ImportExportModal] Export clicked, workspaceId:", activeWorkspaceId);
    
    if (!activeWorkspaceId) {
      console.error("🔴 No active workspace selected");
      toast.error("No active workspace selected");
      return;
    }
    
    try {
      console.log("🔵 Starting export...");
      const blob = await exportWorkspace.mutateAsync(activeWorkspaceId);
      console.log("🔵 Export successful, blob size:", blob.size);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().split("T")[0];
      a.download = `hacklog_backup_${date}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Workspace exported successfully!");
      onClose();
    } catch (error) {
      console.error("🔴 Export failed:", error);
      toast.error("Failed to export workspace: " + (error as Error).message);
    }
  };
  
  const handleImport = async () => {
    console.log("🔵 [ImportExportModal] Import clicked");
    
    if (!importFile) {
      console.error("🔴 No file selected");
      toast.error("Please select a backup file");
      return;
    }
    
    if (!newWorkspaceName.trim()) {
      console.error("🔴 No workspace name entered");
      toast.error("Please enter a workspace name");
      return;
    }
    
    setImporting(true);
    
    try {
      console.log("🔵 Reading file...");
      const text = await importFile.text();
      console.log("🔵 File read, length:", text.length);
      
      console.log("🔵 Parsing JSON...");
      const data = JSON.parse(text);
      console.log("🔵 JSON parsed, workspace name from file:", data.workspace?.name);
      
      console.log("🔵 Importing workspace with name:", newWorkspaceName.trim());
      const result = await importWorkspace.mutateAsync({
        data,
        workspaceName: newWorkspaceName.trim(),
      });
      console.log("🔵 Import successful:", result);
      
      toast.success(`Workspace "${newWorkspaceName}" imported successfully!`);
      onClose();
      // Reload to show new workspace
      setTimeout(() => window.location.reload(), 500);
    } catch (error: any) {
      console.error("🔴 Import failed:", error);
      if (error.response?.status === 409) {
        toast.error(`Workspace "${newWorkspaceName}" already exists. Please use a different name.`);
      } else {
        toast.error(error.response?.data?.error || "Failed to import workspace");
      }
    } finally {
      setImporting(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("🔵 File selected:", file?.name, file?.type);
    
    if (file && file.type === "application/json") {
      setImportFile(file);
      toast.success(`File selected: ${file.name}`);
    } else if (file) {
      toast.error("Please select a valid JSON backup file");
      setImportFile(null);
    }
  };
  
  if (!isOpen) {
    return null;
  }
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import / Export Workspace"
      description="Backup your workspace or restore from a backup"
      size="lg"
    >
      <div className="space-y-4">
        {/* Mode Tabs */}
        <div className="flex gap-2 border-b border-border pb-2">
          <button
            onClick={() => {
              console.log("🔵 Switching to export mode");
              setImportMode("export");
            }}
            className={cn(
              "px-4 py-2 text-sm font-mono rounded-md transition-colors",
              importMode === "export"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Download className="h-4 w-4 inline mr-2" />
            Export
          </button>
          <button
            onClick={() => {
              console.log("🔵 Switching to import mode");
              setImportMode("import");
            }}
            className={cn(
              "px-4 py-2 text-sm font-mono rounded-md transition-colors",
              importMode === "import"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Upload className="h-4 w-4 inline mr-2" />
            Import
          </button>
        </div>
        
        {importMode === "export" && (
          <div className="space-y-4">
            {/* Export Info */}
            {backupLoading && (
              <div className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <p className="text-xs font-mono text-muted-foreground mt-2">Loading backup info...</p>
              </div>
            )}
            
            {backupInfo && (
              <div className="bg-secondary/30 border border-border rounded-lg p-4">
                <h3 className="text-sm font-mono font-bold mb-2">Backup contains:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                  <div className="text-muted-foreground">Projects:</div>
                  <div className="text-primary">{backupInfo.projects}</div>
                  <div className="text-muted-foreground">Notes:</div>
                  <div className="text-primary">{backupInfo.notes}</div>
                  <div className="text-muted-foreground">Vulnerabilities:</div>
                  <div className="text-primary">{backupInfo.vulnerabilities}</div>
                  <div className="text-muted-foreground">Payloads:</div>
                  <div className="text-primary">{backupInfo.payloads}</div>
                  <div className="text-muted-foreground">Recon Data:</div>
                  <div className="text-primary">{backupInfo.recon}</div>
                  <div className="text-muted-foreground">Calendar Logs:</div>
                  <div className="text-primary">{backupInfo.logs}</div>
                </div>
              </div>
            )}
            
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                <div className="text-xs font-mono text-foreground">
                  <p className="font-bold mb-1">Export will include:</p>
                  <p>All projects, notes, vulnerabilities, payloads, recon data, and calendar logs</p>
                  <p className="text-muted-foreground mt-1">The backup will be saved as a JSON file</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={exportWorkspace.isPending}
                className="gap-2"
              >
                {exportWorkspace.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export Workspace
              </Button>
            </div>
          </div>
        )}
        
        {importMode === "import" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-muted-foreground block mb-1">
                Backup File *
              </label>
              <Input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="font-mono text-sm cursor-pointer"
              />
              {importFile && (
                <p className="text-[10px] font-mono text-primary mt-1">
                  Selected: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
            
            <div>
              <label className="text-xs font-mono text-muted-foreground block mb-1">
                New Workspace Name *
              </label>
              <Input
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="Enter a name for the imported workspace"
                className="font-mono text-sm"
              />
            </div>
            
            <div className="bg-info/10 border border-info/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-info mt-0.5" />
                <div className="text-xs font-mono text-foreground">
                  <p className="font-bold mb-1">Import will:</p>
                  <p>• Create a new workspace with the name you provide</p>
                  <p>• Import all projects, notes, vulnerabilities, payloads, recon data, and logs</p>
                  <p className="text-muted-foreground mt-1">The original workspace will not be affected</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!importFile || !newWorkspaceName.trim() || importing}
                className="gap-2"
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Import Workspace
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};