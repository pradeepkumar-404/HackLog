import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppSidebar } from "./AppSidebar";

export const AppLayout = () => {
  const navigate = useNavigate();
  const [isMaximized, setIsMaximized] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        navigate("/search");
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        navigate("/calendar");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  // Check if running in Electron
  const isElectron = !!(window as any).electronAPI;

  // Window control handlers
  const handleMinimize = () => {
    if (isElectron && (window as any).electronAPI) {
      (window as any).electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (isElectron && (window as any).electronAPI) {
      (window as any).electronAPI.maximizeWindow();
      // Update local state after a short delay
      setTimeout(async () => {
        try {
          const maximized = await (window as any).electronAPI.isMaximized();
          setIsMaximized(maximized);
        } catch (e) {
          console.error('Failed to get maximized state:', e);
        }
      }, 100);
    }
  };

  const handleClose = () => {
    if (isElectron && (window as any).electronAPI) {
      (window as any).electronAPI.closeWindow();
    }
  };

  // Listen for window state changes from Electron
  useEffect(() => {
    if (isElectron && (window as any).electronAPI) {
      const checkMaximized = async () => {
        try {
          const maximized = await (window as any).electronAPI.isMaximized();
          setIsMaximized(maximized);
        } catch (e) {
          console.error('Failed to get maximized state:', e);
        }
      };
      checkMaximized();

      // Listen for state changes - only if ipcRenderer is available
      if (window.electronAPI?.onWindowStateChanged) {
        window.electronAPI.onWindowStateChanged(
          (state: { isMaximized: boolean }) => {
            setIsMaximized(state.isMaximized);
          }
        );
      }
    }
  }, [isElectron]);

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      {/* 🔥 Terminal-Style Custom Title Bar - Only show in Electron */}
      {isElectron && (
        <div className="h-8 flex items-center justify-between px-3 bg-[#0a0a0f] border-b border-[#1a1a24] select-none drag-region">
          {/* App Name - Left Side with Terminal Prompt */}
          <div className="flex items-center gap-2 font-mono text-xs no-drag">
            <span className="text-primary/60">$</span>
            <span className="text-primary/80 font-semibold tracking-wide">hacklog</span>
            <span className="text-muted-foreground/40 animate-pulse">_</span>
          </div>

          {/* Terminal-Style Window Controls - Right Side */}
          <div className="flex items-center gap-2 no-drag">
            {/* Minimize Button */}
            <button
              onClick={handleMinimize}
              className="group relative w-5 h-5 rounded-full bg-[#1a1a24] hover:bg-[#2a2a35] transition-all duration-150 flex items-center justify-center"
              aria-label="Minimize"
            >
              <span className="text-muted-foreground/60 group-hover:text-foreground text-sm pb-2 font-mono">
                _
              </span>
            </button>

            {/* Maximize/Restore Button */}
            <button
              onClick={handleMaximize}
              className="group relative w-5 h-5 rounded-full bg-[#1a1a24] hover:bg-[#2a2a35] transition-all duration-150 flex items-center justify-center"
              aria-label="Maximize"
            >
              <span className="text-muted-foreground/60 group-hover:text-foreground text-xs font-mono">
                {isMaximized ? "❐" : "❐"}
              </span>
            </button>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="group relative w-5 h-5 rounded-full bg-[#1a1a24] hover:bg-destructive/80 transition-all duration-150 flex items-center justify-center"
              aria-label="Close"
            >
              <span className="text-muted-foreground/60 group-hover:text-white text-sm font-mono">
                ✕
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};