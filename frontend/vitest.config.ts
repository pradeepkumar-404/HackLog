import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5001,
    strictPort: true,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Remove or comment out the optimizeDeps section if it exists
  // or update to use rolldownOptions instead:
  optimizeDeps: {
    // Use this if you have custom optimizeDeps config
    // rolldownOptions: {
    //   ... your options
    // }
  },
}));