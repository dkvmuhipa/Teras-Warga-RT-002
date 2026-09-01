import React, { useState, useEffect } from 'react';
import { Download, X, Share2, PlusSquare, Smartphone, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from '../constants';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone / installed mode
    const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(!!isAppStandalone);

    if (isAppStandalone) return;

    // Check if user dismissed prompt recently (within 7 days)
    const dismissedTime = localStorage.getItem('rt02_pwa_prompt_dismissed');
    if (dismissedTime && Date.now() - parseInt(dismissedTime) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Android & Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a short delay (3.5s) for smooth page loading
      setTimeout(() => {
        setShowPrompt(true);
      }, 3500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If iOS Safari, show helper after 4 seconds
    if (isIosDevice && !(window.navigator as any).standalone) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 4000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('rt02_pwa_prompt_dismissed', Date.now().toString());
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className="fixed bottom-24 md:bottom-8 left-4 right-4 md:left-auto md:right-28 md:max-w-md z-[55] pointer-events-auto"
      >
        <div className="relative bg-slate-900/95 backdrop-blur-xl text-white p-5 rounded-[2rem] border border-slate-700/80 shadow-2xl shadow-slate-950/50 overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3.5 right-3.5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors"
            aria-label="Tutup Banner Install"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-0.5 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-900/40">
              <img src="/logo-rt.svg" alt="Teras RT 02" className="w-full h-full object-contain p-2 rounded-2xl" />
            </div>

            <div className="space-y-1 pr-6">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-mono font-black uppercase tracking-wider">
                  APLIKASI RESMI
                </span>
              </div>
              <h4 className="font-black text-sm text-white tracking-tight">Pasang Aplikasi TERAS RT 02</h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Akses cepat bebas kuota, Panic Button SOS instan, & notifikasi langsung di layar HP Anda.
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-4 pt-3.5 border-t border-slate-800 flex flex-col gap-2.5">
            {isIOS ? (
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 text-xs text-slate-300 space-y-1.5 font-medium">
                <p className="flex items-center gap-1.5 text-white font-bold">
                  <Smartphone size={14} className="text-emerald-400" /> Cara Install di iOS / iPhone:
                </p>
                <p className="flex items-center gap-2 text-slate-300">
                  1. Ketuk tombol <Share2 size={13} className="text-indigo-400 inline" /> <b>Share</b> di Safari bawah
                </p>
                <p className="flex items-center gap-2 text-slate-300">
                  2. Pilih <PlusSquare size={13} className="text-emerald-400 inline" /> <b>Add to Home Screen</b>
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-transform active:scale-95 cursor-pointer"
                >
                  <Download size={15} className="stroke-[2.5]" /> Install ke Layar HP
                </button>
                <button
                  onClick={handleDismiss}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Nanti Saja
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
