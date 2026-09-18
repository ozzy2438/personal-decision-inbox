import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import netlify from "@netlify/vite-plugin";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    netlify({
      // Deno edge emulation crashes in this environment (`--allow-scripts`).
      // Serverless functions still serve POST /api/evaluate.
      edgeFunctions: { enabled: false },
      blobs: { enabled: false },
      database: { enabled: false },
      aiGateway: { enabled: false },
      images: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
});
