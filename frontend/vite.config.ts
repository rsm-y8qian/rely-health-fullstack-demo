import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Dev proxy: the browser calls /api/* on the frontend origin (5173),
    // and Vite forwards it to the backend on 4000. Mirrors production where
    // frontend + API sit behind one domain, and avoids CORS in dev.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
