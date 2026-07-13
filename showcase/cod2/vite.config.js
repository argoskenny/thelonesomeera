import { defineConfig } from "vite";

export default defineConfig({
  root: "public",
  publicDir: false,
  base: "/showcase/cod2/",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
