import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      // 将 API 请求代理到后端
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      // 将上传文件请求代理到后端
      "/uploads": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
})
