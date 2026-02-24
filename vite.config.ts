import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    allowedHosts: ['api.eroderunnersclub.com', 'eroderunnersclub.com'],
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  optimizeDeps: {
    include: [
      "@capacitor/core",
      "@capacitor/app",
      "@capacitor/browser",
      "@capacitor/haptics",
      "@capacitor/keyboard",
      "@capacitor/push-notifications",
      "@capacitor/share",
      "@capacitor/splash-screen",
      "@capacitor/status-bar",
    ],
  },
}));
