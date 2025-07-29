import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: false // 在 herd 環境下不需要 HTTPS
  },
  build: {
    outDir: '../dist-androidtest', // 建置到主目錄的子資料夾
    emptyOutDir: true
  }
}) 