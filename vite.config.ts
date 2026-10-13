import { defineConfig, loadEnv } from 'vite'
import type { ViteDevServer, Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import react from '@vitejs/plugin-react-swc'
import { compression } from 'vite-plugin-compression2'

function localApiPlugin(): Plugin {
  return {
    name: 'local-api-handler',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (req.url && req.url.startsWith('/api/akko-keyboard-import')) {
          try {
            let bodyBuffer = '';
            for await (const chunk of req) {
              bodyBuffer += chunk;
            }
            const body = bodyBuffer ? JSON.parse(bodyBuffer) : {};
            const { default: handler } = (await server.ssrLoadModule('./api/akko-keyboard-import.ts')) as {
              default: (req: { method?: string; body?: unknown }, res: { status: (code: number) => { json: (data: object) => void } }) => Promise<void>;
            };
            
            const mockRes = {
              status(code: number) {
                res.statusCode = code;
                return {
                  json(data: object) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                  }
                };
              }
            };
            await handler({ method: req.method, body }, mockRes);
          } catch (err: unknown) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Local API Error' }));
          }
          return;
        }

        if (req.url && req.url.startsWith('/api/cron/akko-sync')) {
          try {
            // Nạp toàn bộ biến môi trường từ .env / .env.local vào process.env để test Cron cục bộ
            const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
            Object.assign(process.env, env);

            const { default: handler } = (await server.ssrLoadModule('./api/cron/akko-sync.ts')) as {
              default: (req: { method?: string; headers?: Record<string, string | undefined> }, res: { status: (code: number) => { json: (data: object) => void } }) => Promise<void>;
            };
            const mockRes = {
              status(code: number) {
                res.statusCode = code;
                return {
                  json(data: object) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                  }
                };
              }
            };
            await handler({ method: req.method, headers: req.headers as Record<string, string | undefined> }, mockRes);
          } catch (err: unknown) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Local Cron Error' }));
          }
          return;
        }

        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [
    react(),
    compression(),
    localApiPlugin(),
  ],
  build: {
    chunkSizeWarningLimit: 600,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // NOTE: React and every library that depends on React (router, swr, zustand,
          // motion, swiper, ant-design charts...) MUST stay in the same 'vendor' chunk.
          // Splitting them creates circular chunk imports -> "Cannot read properties of
          // undefined (reading 'createContext')" in production.

          // Firebase - can be safely separated (doesn't use React internals)
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'firebase-vendor';
          }

          // Excel parser - pure JS, no React
          if (id.includes('node_modules/xlsx')) {
            return 'xlsx-vendor';
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
      'color-string',
      'eventemitter3', 
    ],
  },
    // Enable better tree-shaking
    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' }
    }
  };
});
