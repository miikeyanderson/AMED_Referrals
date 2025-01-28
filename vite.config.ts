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
    // Binding to 0.0.0.0 allows external access
    host: "0.0.0.0",
    port: 5173,
    hmr: {
      // Replit typically uses secure websockets on port 443
      clientPort: 443,
      protocol: "wss",
    },
    watch: {
      // For container environments
      usePolling: true,
    },
    strictPort: true,
    allowedHosts: [
      // The "friendly" name you might see in your Replit config
      "frontend_web",
      // Wildcard for any subdomain of .replit.dev
      ".replit.dev",
      // Wildcard for picard-based Replit domains
      ".picard.replit.dev",
      // "all" is sometimes needed, but can also cause conflicts;

      // see https://github.com/replit/vite/issues/1287
      "all",
    
      // The exact domain that’s currently being blocked
      "cbc514d7-546e-43c5-9cc5-9fb282cbb7d4-00-274h5wpqe1gyy.picard.replit.dev",
    ],
  },
  resolve: {
    alias: {
      "@db": path.resolve(__dirname, "db"),
      "@": path.resolve(__dirname, "client", "src"),
    },
  },
  // Assuming your code is in "client" directory
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
