
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
// Fix: Import process from node:process to ensure the TypeScript compiler recognizes Node.js process methods like cwd()
import process from 'node:process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Fix: Explicitly using the imported process object to get the current working directory
  const cwd = process.cwd();
  const env = loadEnv(mode, cwd, '');
  
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'script',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'firebase-messaging-sw.js'],
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        },
        manifest: {
          name: 'TERAS RT 02',
          short_name: 'TERAS',
          description: 'Sistem Informasi & Layanan Warga RT 02',
          theme_color: '#0f172a',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: 'logo-rt.svg',
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'any'
            },
            {
              src: 'logo-rt.svg',
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'maskable'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(cwd, './'),
      },
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || ''),
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(env.GOOGLE_MAPS_PLATFORM_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || ''),
      'process.env.NODE_ENV': JSON.stringify(mode),
      // Provide a stringified version of the entire env object to prevent ReferenceErrors
      'process.env': JSON.stringify(env)
    },
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) return 'firebase';
              if (id.includes('recharts') || id.includes('d3')) return 'charts';
              if (id.includes('lucide-react')) return 'icons';
              if (id.includes('jspdf')) return 'pdf';
              if (id.includes('exceljs')) return 'excel';
              if (id.includes('react-router-dom') || id.includes('react-router')) return 'router';
              if (id.includes('motion')) return 'motion';
              return 'vendor';
            }
          }
        }
      }
    },
    server: {
      port: 3000,
      host: true
    }
  };
});
