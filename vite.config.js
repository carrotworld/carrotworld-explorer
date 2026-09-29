import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // during `npm run dev`, forward /api calls to `wrangler pages dev`
      // (see README) so the frontend and Functions can run side by side
      "/api": "http://localhost:8788",
    },
  },
});
