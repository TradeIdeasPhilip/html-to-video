import { defineConfig } from 'vite';
import typescript from '@vitejs/plugin-typescript';

export default defineConfig({
  plugins: [typescript()],
  build: {
    lib: {
      entry: 'src/lib/index.ts',
      name: 'HtmlToMovie',
      fileName: 'html-to-movie',
      formats: ['es', 'umd']
    },
    outDir: 'dist/lib',
    sourcemap: true
  }
});
