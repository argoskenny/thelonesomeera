import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: { hanami: "hanami/index.html", shirasagi: "shirasagi/index.html", home: "index.html", tsukikage: "tsukikage/index.html", afterlight: "afterlight/index.html", nightMarket: "night-market/index.html", vertigo: "vertigo/index.html", ignition: "ignition/index.html", aerie: "aerie/index.html", summertide: "summertide/index.html", aurelia: "aurelia/index.html", neoTaipei: "neo-taipei/index.html", kowloon: "kowloon/index.html", kurobe: "kurobe/index.html", raohe: "raohe/index.html" },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three-engine';
        },
      },
    },
  },
});
