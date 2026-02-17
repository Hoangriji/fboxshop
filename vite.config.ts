import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { compression } from 'vite-plugin-compression2'
import type { Plugin } from 'vite'

// Plugin to ensure React loads before other chunks
const reorderChunks = (): Plugin => ({
  name: 'reorder-chunks',
  transformIndexHtml(html) {
    // Move react-vendor modulepreload to the top
    const reactPreloadRegex = /(<link rel="modulepreload"[^>]*react-vendor[^>]*>)/
    const match = html.match(reactPreloadRegex)
    
    if (match) {
      const reactPreload = match[1]
      // Remove from current position
      html = html.replace(reactPreloadRegex, '')
      // Insert right after the main script tag
      html = html.replace(
        /(<script type="module" crossorigin src="[^"]*"><\/script>)/,
        `$1\n    ${reactPreload}`
      )
    }
    
    return html
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression(),
    reorderChunks(),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React ecosystem - MUST BE FIRST for dependency resolution
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
          // Firebase
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'firebase-vendor';
          }
          // UI Libraries (Swiper, etc.)
          if (id.includes('node_modules/swiper') || id.includes('node_modules/gsap') || id.includes('node_modules/motion')) {
            return 'ui-vendor';
          }
          // Dashboard Pages
          if (id.includes('/src/pages/DashboardPage/')) {
            return 'dashboard';
          }
          // Other Pages
          if (id.includes('/src/pages/')) {
            return 'pages';
          }
          // Components
          if (id.includes('/src/components/')) {
            return 'components';
          }
        },
        assetFileNames: (assetInfo) => {
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp)$/i.test(assetInfo.name || '')) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/\.(woff|woff2|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'firebase/app', 'firebase/firestore', 'swiper'],
  },
})
