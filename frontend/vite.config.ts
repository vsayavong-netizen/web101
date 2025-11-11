import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: env.VITE_API_BASE_URL || 'http://localhost:8000',
            changeOrigin: true,
            secure: false,
            configure: (proxy, _options) => {
              proxy.on('error', (err, _req, _res) => {
                console.log('proxy error', err);
              });
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                console.log('Sending Request to the Target:', req.method, req.url);
              });
              proxy.on('proxyRes', (proxyRes, req, _res) => {
                console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
              });
            },
          },
          '/ws': {
            target: env.VITE_WS_URL || 'ws://localhost:8000',
            ws: true,
            changeOrigin: true,
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
        'process.env.VITE_DEBUG': JSON.stringify(env.VITE_DEBUG),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          '@components': path.resolve(__dirname, './components'),
          '@utils': path.resolve(__dirname, './utils'),
          '@hooks': path.resolve(__dirname, './hooks'),
          '@context': path.resolve(__dirname, './context'),
          '@config': path.resolve(__dirname, './config'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: mode === 'development',
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              // Vendor chunks
              if (id.includes('node_modules')) {
                // React core
                if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                  return 'vendor-react';
                }
                // MUI
                if (id.includes('@mui')) {
                  return 'vendor-ui';
                }
                // Google GenAI
                if (id.includes('@google/genai')) {
                  return 'vendor-ai';
                }
                // Other large dependencies
                if (id.includes('exceljs') || id.includes('jszip')) {
                  return 'vendor-utils';
                }
                // All other node_modules
                return 'vendor';
              }
              // Application chunks
              if (id.includes('/components/')) {
                // Heavy components
                if (id.includes('HomePage') || id.includes('ProjectTableEnhanced')) {
                  return 'chunk-main';
                }
                // Management components
                if (id.includes('Management') || id.includes('Dashboard')) {
                  return 'chunk-management';
                }
                // Modal components
                if (id.includes('Modal') || id.includes('Dialog')) {
                  return 'chunk-modals';
                }
                // Other components
                return 'chunk-components';
              }
              // Utils and hooks
              if (id.includes('/utils/') || id.includes('/hooks/')) {
                return 'chunk-utils';
              }
            },
            chunkFileNames: 'assets/js/[name]-[hash].js',
            entryFileNames: 'assets/js/[name]-[hash].js',
            assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
          }
        },
        chunkSizeWarningLimit: 1000, // 1MB
      },
      optimizeDeps: {
        include: ['react', 'react-dom', '@mui/material', '@mui/icons-material']
      }
    };
});
