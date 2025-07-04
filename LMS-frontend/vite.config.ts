import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:2000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:2000',
        changeOrigin: true,
      }
    },
    allowedHosts: ['4f6f-152-59-7-120.ngrok-free.app'],
  },
  
  
}) 