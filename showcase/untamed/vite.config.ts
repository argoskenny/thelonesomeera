import { defineConfig } from "vite";

export default defineConfig({
  base: "/showcase/untamed/",
  build: {
    sourcemap: false,
    rollupOptions: { output: { manualChunks: { three: ["three"] } } },
  },
});
