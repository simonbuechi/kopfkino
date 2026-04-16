import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('firebase')) return 'vendor-firebase'
          if (id.includes('@dnd-kit')) return 'vendor-dnd'
          if (id.includes('@headlessui') || id.includes('lucide-react') || id.includes('react-router-dom')) return 'vendor-ui'
        }
      }
    }
  },
  server: {
    proxy: {
      '/firebase-storage': {
        target: 'https://firebasestorage.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/firebase-storage/, '')
      }
    }
  }
})
