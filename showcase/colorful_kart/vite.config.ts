import { defineConfig } from "vite";

export default defineConfig({
  base: "/showcase/colorful_kart/",
  server: {
    host: "127.0.0.1",
    port: 5188,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4188,
    strictPort: true,
  },
  build: {
    target: "es2022",
    sourcemap: false,
  },
});
