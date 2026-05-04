import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  activeWorkspaceId: string | null;
  setActiveWorkspace: (id: string) => void;  // ✅ Keep consistent naming
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeWorkspaceId: null,
      
      setActiveWorkspace: (id: string) => {
        console.log("🔵 [UIStore] Setting active workspace:", id);
        set({ activeWorkspaceId: id });
      },
    }),
    { 
      name: "hacklog-ui-storage",
      onRehydrateStorage: () => {
        console.log("🟢 [UIStore] Rehydrating from localStorage");
        return (state) => {
          console.log("🟢 [UIStore] Rehydrated state:", state);
        };
      }
    }
  )
);