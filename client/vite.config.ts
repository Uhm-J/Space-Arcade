import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    host: true
  },
  build: {
    target: 'esnext',
    minify: 'esbuild'
  },
  optimizeDeps: {
    include: ['three', 'cannon-es']
  }
})