import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/billing': 'http://localhost:8080',
      '/api/payment': 'http://localhost:8082',
      '/api/user': 'http://localhost:8081'
    }
  }
})
