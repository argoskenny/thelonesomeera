import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/dist-androidtest/',
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: false // 在 herd 環境下不需要 HTTPS
  },
  build: {
    outDir: '../public/dist-androidtest', // 直接輸出到 Next.js public 目錄
    emptyOutDir: true
  }
})
