import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Publicado no GitHub Pages em https://oyaga.github.io/shaiya-costumes/ → base com o nome do repo.
export default defineConfig({
  base: "/shaiya-costumes/",
  plugins: [react()],
  build: { chunkSizeWarningLimit: 900 },
});
