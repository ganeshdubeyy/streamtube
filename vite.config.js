import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
  server: {
    proxy: {
      '/api/suggestions': {
        target: 'https://suggestqueries.google.com/complete/search',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/suggestions/, ''),
      },
    },
  },
})
