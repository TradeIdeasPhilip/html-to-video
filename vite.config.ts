import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/lib/index.ts",
      name: "HtmlToVideo",
      fileName: "html-to-video",
      formats: ["es", "umd"],
    },
    outDir: "dist/vite", // Temporary output directory
    sourcemap: true,
  },
});
