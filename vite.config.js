import { defineConfig } from 'vite';

export default defineConfig({
  root: 'site',
  base: '/rabota-t2/',
  build: { outDir: '../dist', emptyOutDir: true },
});
