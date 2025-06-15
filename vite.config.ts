import { defineConfig } from "vite";

export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: "src/lib/index.ts",
      name: "HtmlToMovie",
      fileName: "html-to-movie",
      formats: ["es", "umd"],
    },
    outDir: "dist/lib",
    sourcemap: true,
  },
});
