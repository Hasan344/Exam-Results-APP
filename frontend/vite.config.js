import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  base: "./",

  server: {
    port: 5173,
    proxy: {
      "/students":  "http://localhost:5000",
      "/sections":  "http://localhost:5000",
      "/exercises": "http://localhost:5000",
      "/subjects":  "http://localhost:5000", // köhnə uyğunluq
      "/appeal":    "http://localhost:5000",
      "/auth":      "http://localhost:5000",
      "/experts":   "http://localhost:5000",
      "/exams":     "http://localhost:5000",
      "/imports":   "http://localhost:5000",
    },
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});