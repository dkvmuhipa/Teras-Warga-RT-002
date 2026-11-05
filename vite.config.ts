import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import process from 'node:process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const cwd = process.cwd();
  const env = loadEnv(mode, cwd, '');

  // Filter environment variables exposed to the client bundle to prevent leaking OS/CI secrets
  const safeClientEnv = Object.fromEntries(
    Object.entries(env).filter(
      ([key]) =>
        key.startsWith('VITE_') ||
        key === 'API_KEY' ||
        key === 'GEMINI_API_KEY' ||
        key === 'GOOGLE_MAPS_PLATFORM_KEY'
    )
  );
  const resolvedApiKey = env.GEMINI_API_KEY || env.API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  const resolvedMapsKey = env.GOOGLE_MAPS_PLATFORM_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: 'script',
        includeAssets: ['logo-rt.svg', 'robots.txt', 'sitemap.xml', 'llms.txt', 'firebase-messaging-sw.js'],
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
          globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
          globIgnores: [
            '**/excel-*.js',
            '**/excelService-*.js',
            '**/pdf-*.js',
            '**/pdfService-*.js',
            '**/charts-*.js',
            '**/Admin*.js',
            '**/SuperAdmin*.js',
            '**/MasterDashboard-*.js',
            '**/RWAggregationDashboard-*.js',
            '**/ResidentManager-*.js',
            '**/ResidentModals-*.js',
            '**/ServiceManager-*.js',
            '**/ContentManager-*.js',
            '**/FacilityManager-*.js',
            '**/FinanceManager-*.js',
            '**/ReportManager-*.js',
            '**/RentalManager-*.js',
            '**/WaterMeterManager-*.js',
            '**/DemographicAnalytics-*.js',
            '**/DashboardOverview-*.js',
            '**/STBMManager-*.js',
            '**/PBBManager-*.js',
            '**/SocialAidManager-*.js',
            '**/MeetingMinutesManager-*.js',
            '**/CommunityWorkManager-*.js',
            '**/DocumentManager-*.js',
            '**/GuestManager-*.js',
            '**/AssetManager-*.js',
            '**/ActivityManagement-*.js',
            '**/IncomingMailManager-*.js',
            '**/AuditLogManager-*.js',
            '**/PanicAlertLogs-*.js',
            '**/TenantRegistrationModal-*.js'
          ],
          runtimeCaching: [
            {
              urlPattern: /\/assets\/.*\.(?:js|css)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'teras-lazy-chunks-cache',
                expiration: {
                  maxEntries: 80,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|webp|gif)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'teras-images-cache',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        manifest: {
          name: 'TERAS RT 02 - Sistem Warga Digital',
          short_name: 'TERAS RT02',
          description: 'Sistem Informasi Digital, Pelayanan Warga, Siskamling & Bank Sampah RT 02',
          theme_color: '#0f172a',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          categories: ['social', 'utilities', 'productivity'],
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
          ],
          shortcuts: [
            {
              name: 'Tombol Darurat (SOS)',
              short_name: 'SOS',
              description: 'Aktifkan sinyal darurat Panic Button ke satpam & warga',
              url: '/?action=sos',
              icons: [{ src: 'logo-rt.svg', sizes: '192x192' }]
            },
            {
              name: 'Layanan Surat RT',
              short_name: 'Surat RT',
              description: 'Pengajuan & Unduh Surat Pengantar RT',
              url: '/#/services',
              icons: [{ src: 'logo-rt.svg', sizes: '192x192' }]
            },
            {
              name: 'Bank Sampah Digital',
              short_name: 'Bank Sampah',
              description: 'Cek saldo tabungan & setoran sampah anorganik',
              url: '/#/sampah',
              icons: [{ src: 'logo-rt.svg', sizes: '192x192' }]
            },
            {
              name: 'Jadwal Siskamling / Ronda',
              short_name: 'Ronda',
              description: 'Cek jadwal giliran ronda & presensi pos checkpoint',
              url: '/#/info',
              icons: [{ src: 'logo-rt.svg', sizes: '192x192' }]
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(cwd, './'),
        'react': path.resolve(cwd, './node_modules/react'),
        'react-dom': path.resolve(cwd, './node_modules/react-dom'),
      },
    },
    define: {
      'process.env.API_KEY': JSON.stringify(resolvedApiKey),
      'process.env.GEMINI_API_KEY': JSON.stringify(resolvedApiKey),
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(resolvedMapsKey),
      'process.env.NODE_ENV': JSON.stringify(mode),
      // Only expose safe whitelisted client variables
      'process.env': JSON.stringify({
        ...safeClientEnv,
        API_KEY: resolvedApiKey,
        GEMINI_API_KEY: resolvedApiKey,
        GOOGLE_MAPS_PLATFORM_KEY: resolvedMapsKey,
        NODE_ENV: mode
      })
    },
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('vite/preload-helper') || id.includes('commonjsHelpers')) return 'vendor';
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) return 'firebase';
              if (id.includes('recharts') || id.includes('d3')) return 'charts';
              if (id.includes('lucide-react')) return 'icons';
              if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf';
              if (id.includes('exceljs') || id.includes('file-saver')) return 'excel';
              if (id.includes('react-router-dom') || id.includes('react-router')) return 'router';
              if (id.includes('motion')) return 'motion';
              if (id.includes('@vis.gl') || id.includes('google-maps')) return 'maps';
              return 'vendor';
            }
          }
        }
      }
    },
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/socket.io': {
          target: 'http://127.0.0.1:8000',
          ws: true,
        }
      }
    }
  };
});
