import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { compression } from 'vite-plugin-compression2'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression(),
  ],
  build: {
    chunkSizeWarningLimit: 600,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // This prevents "Cannot read properties of undefined" errors
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router') ||
              id.includes('node_modules/scheduler')) {
            return 'react-vendor';
          }
          
          // Firebase - can be safely separated (doesn't use React internals)
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'firebase-vendor';
          }
          
          // Charts - Heavy but isolated (lazy loaded only in dashboard)
          if (id.includes('node_modules/@ant-design') || id.includes('node_modules/@antv')) {
            return 'charts-vendor';
          }
          
          // Swiper - Heavy UI library (lazy loaded)
          if (id.includes('node_modules/swiper')) {
            return 'swiper-vendor';
          }
          
          // Animation libraries (GSAP, Motion)
          if (id.includes('node_modules/gsap') || id.includes('node_modules/motion')) {
            return 'animation-vendor';
          }

          if (id.includes('node_modules/swr')) {
            return 'swr-vendor';
          }
          
          if (id.includes('node_modules/zustand')) {
            return 'zustand-vendor';
          }
        
          // Dashboard pages
          if (id.includes('/src/pages/DashboardPage/components/DashboardOverview')) {
            return 'dashboard-overview';
          }
          if (id.includes('/src/pages/DashboardPage/components/ProductsManagement')) {
            return 'dashboard-products';
          }
          if (id.includes('/src/pages/DashboardPage/components/FeaturedManagement')) {
            return 'dashboard-featured';
          }
          if (id.includes('/src/pages/DashboardPage/')) {
            return 'dashboard-core';
          }
          
          // Other pages
          if (id.includes('/src/pages/ProductsPage/')) {
            return 'page-products';
          }
          if (id.includes('/src/pages/ProductDetailPage/')) {
            return 'page-product-detail';
          }
          if (id.includes('/src/pages/WishlistPage/')) {
            return 'page-wishlist';
          }
          if (id.includes('/src/pages/ContactPage/')) {
            return 'page-contact';
          }
          if (id.includes('/src/pages/HomePage/')) {
            return 'page-home';
          }
          
          // Components
          if (id.includes('/src/components/')) {
            return 'components';
          }
          
          // This ensures compatibility and prevents orphaned modules
          if (id.includes('node_modules/')) {
            return 'vendor';
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
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
    ],
    exclude: [
      '@ant-design/plots', // Heavy charts, load on demand
      '@ant-design/charts',
    ]
  },
  // Enable better tree-shaking
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})
