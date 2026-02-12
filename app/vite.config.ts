import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "no-cache-json",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.includes(".json")) {
            res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
            res.setHeader("Pragma", "no-cache");
          }
          next();
        });
      },
    },
  ],
  root: ".",
  publicDir: "public",
  server: {
    host: true, // 携帯から同じWi‑FiのPCのIPでアクセス可能
  },
});
