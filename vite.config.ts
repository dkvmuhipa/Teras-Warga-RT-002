
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
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
      tailwindcss()
    ],
    resolve: {
      alias: {
        '@': path.resolve(cwd, './'),
      },
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || ''),
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
