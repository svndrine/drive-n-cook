import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // ou vue selon votre framework

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Configuration du serveur de développement
  server: {
    host: '0.0.0.0',
    port: 5174,
    watch: {
      usePolling: true,
    },
  },

  // Configuration pour la production (vite preview)
  preview: {
    host: '0.0.0.0',
    port: 5174,
  },

  // Configuration du build
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
  },

  // Définir des variables globales
  define: {
    __API_URL__: JSON.stringify('http://193.70.0.27:8000/api'),
  },
})