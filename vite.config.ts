
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
  ],
  optimizeDeps: {
    exclude: [
      "@replit/vite-plugin-runtime-error-modal",
      "@replit/vite-plugin-shadcn-theme-json",
    ],
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    hmr: {
      clientPort: process.env.REPLIT ? 443 : undefined,
      protocol: "wss",
      host: process.env.REPLIT ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : undefined
    },
    watch: {
      usePolling: true,
    },
    strictPort: true,
    allowedHosts: ["all"]
  },
  resolve: {
    alias: {
      "@db": path.resolve(__dirname, "db"),
      "@": path.resolve(__dirname, "client", "src"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
