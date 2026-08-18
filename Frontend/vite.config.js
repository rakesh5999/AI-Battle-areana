import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    proxy: {
      '/invoke': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        timeout: 180000,
        proxyTimeout: 180000,
      }
    }
  }
})
