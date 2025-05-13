import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: '/static-image-viewer/',
  plugins: [vue()],
  build: {
    outDir: 'dist',
  },
});