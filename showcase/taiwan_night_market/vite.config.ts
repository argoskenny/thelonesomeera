import { defineConfig } from 'vite';

export default defineConfig({
  base: '/showcase/taiwan_night_market/',
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          loader: ['three/addons/loaders/GLTFLoader.js'],
        },
      },
    },
  },
});
