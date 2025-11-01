import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  root: resolve(__dirname, "."),
  resolve: {
    alias: {
      "@": resolve(__dirname, "../src"),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': '{}', // Prevents other process.env usages from breaking in browser
  },
  build: {
    lib: {
      entry: resolve(__dirname, "index.tsx"),
      name: "ChatWidget",
      fileName: "chat-widget",
      formats: ["iife"],
    },
    outDir: resolve(__dirname, "../public/widget-dist"),
    rollupOptions: {
      external: [],
    },
    emptyOutDir: true,
  },
  plugins: [react()],
});
