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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            const normalized = id.split("node_modules/")[1];
            if (!normalized) return "vendor";
            const parts = normalized.split("/");
            const packageName = parts[0].startsWith("@") ? `${parts[0]}-${parts[1]}` : parts[0];
            return `vendor-${packageName.replace("@", "").replace("/", "-")}`;
          }
          return undefined;
        },
      },
    },
  },
}));
