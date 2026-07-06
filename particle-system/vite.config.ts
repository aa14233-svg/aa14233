import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          math: ['gl-matrix', 'simplex-noise'],
        },
      },
    },
  },
  server: {
    host: true,
    port: 3000,
  },
});
