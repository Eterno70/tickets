import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Detectar entorno de despliegue y ajustar base automáticamente
// Si se despliega en GitHub Pages, usar el nombre del repo como base
// Si se despliega en Vercel/Netlify, usar base '/'
const repoName = 'ticketflow'; // Cambia esto si tu repo tiene otro nombre
const isGithubPages = process.env.GITHUB_PAGES === 'true' || process.env.VITE_GITHUB_PAGES === 'true';

// https://vitejs.dev/config/
export default defineConfig({
  base: isGithubPages ? `/${repoName}/` : '/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
});
