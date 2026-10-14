import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base relativa: o mesmo build serve no GitHub Pages (https://oyaga.github.io/shaiya-costumes/) e na raiz de
// outro host (Vercel etc.). Os dados são buscados por import.meta.env.BASE_URL + "data/".
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { chunkSizeWarningLimit: 900 },
});
