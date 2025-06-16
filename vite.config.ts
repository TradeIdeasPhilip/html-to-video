import { defineConfig } from "vite";

export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: "src/lib/index.ts",
      name: "HtmlToVideo",
      fileName: "html-to-video",
      formats: ["es", "umd"],
    },
    outDir: "dist/lib",
    sourcemap: true,
  },
});
