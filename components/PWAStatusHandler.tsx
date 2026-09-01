import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const PWAStatusHandler: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  // vite-plugin-pwa Service Worker update hook
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      // Periodically check for SW updates every 1 hour
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('SW registration error', error);
    }
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineToast(true);
      setTimeout(() => setShowOnlineToast(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineToast(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {/* Offline Alert Sticky Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-slate-950 font-bold px-4 py-2 text-xs flex items-center justify-center gap-2 shadow-md backdrop-blur-md"
          >
            <WifiOff size={15} className="animate-pulse" />
            <span>Mode Offline: Anda tidak terhubung ke internet. Data tersimpan di memori cache HP.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back Online Toast */}
      <AnimatePresence>
        {showOnlineToast && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-0 left-0 right-0 z-50 bg-emerald-600 text-white font-bold px-4 py-2 text-xs flex items-center justify-center gap-2 shadow-md backdrop-blur-md"
          >
            <Wifi size={15} />
            <span>Koneksi Kembali Online: Data tersinkronisasi otomatis dengan server RT 02.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* In-App Update Prompt (Versi Baru Tersedia) */}
      <AnimatePresence>
        {needRefresh && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-6 md:right-auto md:max-w-sm z-50"
          >
            <div className="bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <RefreshCw size={18} className="animate-spin" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-white">Versi Baru Tersedia!</h5>
                  <p className="text-[10px] text-slate-400 font-medium">Pembaruan sistem RT 02 siap dimuat.</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateServiceWorker(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-lg text-[10px] uppercase tracking-wider shadow-md transition-transform active:scale-95"
                >
                  Muat Ulang
                </button>
                <button
                  onClick={() => setNeedRefresh(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
