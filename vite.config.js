import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base relativa: o mesmo build serve no GitHub Pages (https://oyaga.github.io/shaiya-costumes/) e na raiz de
// outro host (Vercel etc.). Os dados são buscados por import.meta.env.BASE_URL + "data/".
// VITE_VERCEL: a Vercel define VERCEL=1 no build; só esse build liga o Web Analytics (src/main.jsx).
export default defineConfig({
  base: "./",
  plugins: [react()],
  define: { "import.meta.env.VITE_VERCEL": JSON.stringify(process.env.VERCEL === "1") },
  build: { chunkSizeWarningLimit: 900 },
});
