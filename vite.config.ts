import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const cwd = (process as any).cwd();
  const env = loadEnv(mode, cwd, '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(cwd, './'),
      },
    },
    define: {
      'process.env': env
    },
    build: {
      chunkSizeWarningLimit: 1000, // Increase limit slightly
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Split vendor chunks to avoid huge files
              if (id.includes('firebase')) return 'firebase';
              if (id.includes('react')) return 'react-vendor';
              if (id.includes('recharts')) return 'charts';
              if (id.includes('lucide')) return 'icons';
              if (id.includes('jspdf')) return 'pdf-lib';
              if (id.includes('@google/genai')) return 'ai-sdk';
              
              return 'vendor';
            }
          }
        }
      }
    }
  };
});