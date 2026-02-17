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
    chunkSizeWarningLimit: 600, // Reduce to catch large chunks earlier
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React ecosystem (always needed)
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-core';
          }
          
          // React Router (separate from core React)
          if (id.includes('node_modules/react-router')) {
            return 'react-router';
          }
          
          // Firebase - split into smaller chunks
          if (id.includes('node_modules/firebase/')) {
            if (id.includes('firestore')) return 'firebase-firestore';
            if (id.includes('storage')) return 'firebase-storage';
            if (id.includes('auth')) return 'firebase-auth';
            return 'firebase-core';
          }
          if (id.includes('node_modules/@firebase')) {
            return 'firebase-core';
          }
          
          // Ant Design Charts - Very heavy, separate chunk
          if (id.includes('node_modules/@ant-design') || id.includes('node_modules/@antv')) {
            return 'charts-vendor';
          }
          
          // UI Animation Libraries
          if (id.includes('node_modules/swiper')) {
            return 'swiper-vendor';
          }
          if (id.includes('node_modules/gsap') || id.includes('node_modules/motion')) {
            return 'animation-vendor';
          }
          
          // SWR for data fetching
          if (id.includes('node_modules/swr')) {
            return 'swr-vendor';
          }
          
          // Zustand for state management
          if (id.includes('node_modules/zustand')) {
            return 'zustand-vendor';
          }
          
          // Other heavy node_modules
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
          
          // Dashboard Pages - split by route
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
          
          // Other Pages
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
