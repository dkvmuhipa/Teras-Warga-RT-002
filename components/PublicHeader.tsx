import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ChevronDown, LayoutGrid, Wallet, Users, Info, Download, X, Smartphone, Sparkles, HelpCircle } from 'lucide-react';
import { RT_NAME, Logo } from '../constants';
import { Button } from './ui/Button';
import { NotificationCenter } from './NotificationCenter';
import { MobileBottomNav } from './MobileBottomNav';
import { AppNotification } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { usePWA } from '../hooks/usePWA';

interface PublicHeaderProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onDeleteNotification?: (id: string) => void;
  onDeleteAllNotifications?: () => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({ notifications, onMarkRead, onDeleteNotification, onDeleteAllNotifications }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // PWA & Mobile integration hooks
  const { isInstallable, isStandalone, installPWA } = usePWA();
  const [showInstallBanner, setShowInstallBanner] = useState(() => {
    if (typeof window !== "undefined") {
      const dismissed = sessionStorage.getItem('pwa_banner_dismissed');
      return dismissed !== 'true';
    }
    return false;
  });
  const [showiOSModal, setShowiOSModal] = useState(false);

  // Simple client-side iOS device detection
  const isIOS = typeof window !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowiOSModal(true);
    } else {
      const installed = await installPWA();
      if (installed) {
        setShowInstallBanner(false);
      }
    }
  };

  const dismissBanner = () => {
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
    setShowInstallBanner(false);
  };

  const isActive = (path: string) => location.pathname === path;

  
  const navGroups = [
    {
      id: 'layanan',
      label: 'Layanan',
      icon: LayoutGrid,
      items: [
        { path: '/services?tab=surat', label: 'Persuratan' },
        { path: '/services?tab=lapor', label: 'Lapor Masalah' },
        { path: '/services?tab=mutasi', label: 'Mutasi Warga' },
        { path: '/services?tab=tamu', label: 'Lapor Tamu' },
        { path: '/dokumen', label: 'Arsip Dokumen' },
        { path: '/voting', label: 'E-Voting' },
      ]
    },
    {
      id: 'ekonomi',
      label: 'Ekonomi',
      icon: Wallet,
      items: [
        { path: '/market', label: 'Pasar Warga' },
        { path: '/sampah', label: 'Bank Sampah' },
        { path: '/umkm', label: 'Direktori UMKM' },
      ]
    },
    {
      id: 'info',
      label: 'Informasi',
      icon: Info,
      items: [
        { path: '/info', label: 'Info RT & Kas' },
        { path: '/rules', label: 'Peraturan RT 02' },
        { path: '/gempa', label: 'Monitor Gempa BMKG' },
        { path: '/faq', label: 'Pertanyaan Umum (FAQ)' },
        { path: '/kegiatan', label: 'Jadwal Kegiatan' },
      ]
    }
  ];

  return (
    <>
      {/* PWA Installation Top Banner */}
      <AnimatePresence>
        {!isStandalone && showInstallBanner && (isInstallable || isIOS) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 text-white overflow-hidden relative z-50 shadow-md"
          >
            <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left select-none">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/10 rounded-lg hidden sm:block">
                  <Sparkles size={16} className="text-amber-300 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight flex items-center gap-1.5 justify-center sm:justify-start">
                    Pasang Aplikasi TERAS RT 02 
                    <span className="text-[9px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-widest">PWA</span>
                  </p>
                  <p className="text-[10px] text-indigo-100 font-medium mt-0.5">Akses super cepat serba instan langsung dari layar utama ponsel Anda.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
                <button
                  onClick={handleInstallClick}
                  className="bg-white text-indigo-700 hover:bg-indigo-50 active:scale-95 transition-all text-[11px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={13} strokeWidth={2.5} />
                  Pasang Sekarang
                </button>
                <button
                  onClick={dismissBanner}
                  className="p-1.5 text-indigo-200 hover:text-white transition-colors hover:bg-white/10 rounded-lg cursor-pointer animate-none"
                  title="Tutup banner"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <Logo showText={true} imageSize="h-8 md:h-10" />
            </div>
            
            <div className="flex items-center gap-2">
                <div className="hidden lg:flex items-center space-x-1 mr-4">
                  <button 
                    onClick={() => navigate('/')} 
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive('/') ? "text-blue-600 bg-blue-50" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    Beranda
                  </button>

                  {navGroups.map((group) => (
                    <div 
                      key={group.id}
                      className="relative"
                      onMouseEnter={() => setActiveDropdown(group.id)}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      <button 
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          group.items.some(item => isActive(item.path)) 
                          ? "text-blue-600 bg-blue-50" 
                          : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {group.label}
                        <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === group.id ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {activeDropdown === group.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl p-2 z-50 overflow-hidden"
                          >
                            {group.items.map((item) => (
                              <button
                                key={item.path}
                                onClick={() => {
                                  navigate(item.path);
                                  setActiveDropdown(null);
                                }}
                                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                  isActive(item.path)
                                  ? "bg-blue-50 text-blue-600"
                                  : "text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
                
                <NotificationCenter 
                  notifications={notifications} 
                  onMarkRead={onMarkRead} 
                  onDelete={onDeleteNotification}
                  onDeleteAll={onDeleteAllNotifications}
                />

                <div className="hidden md:block h-6 w-px bg-slate-200 mx-2"></div>
                <Button 
                  onClick={() => navigate('/admin')} 
                  variant="secondary" 
                  className="hidden md:flex ml-2 text-xs h-9 font-bold rounded-xl px-4"
                >
                  Panel Admin
                </Button>
            </div>
            <div className="flex items-center lg:hidden gap-1.5">
               {/* Mobile PWA Install Button */}
               {!isStandalone && (isInstallable || isIOS) && (
                 <Button 
                   onClick={handleInstallClick}
                   variant="ghost" 
                   className="p-2 text-indigo-600 bg-indigo-50/70 hover:bg-indigo-50 rounded-xl"
                   title="Pasang Aplikasi PWA"
                 >
                   <Download size={18} className="animate-bounce" />
                 </Button>
               )}
               <Button 
                 onClick={() => navigate('/admin')} 
                 variant="ghost" 
                 className="p-2 text-slate-400 hover:text-blue-600"
               >
                 <User size={20}/>
               </Button>
            </div>
          </div>
        </div>
      </nav>
      <MobileBottomNav />

      {/* iOS Safari PWA Installation Guideline Modal */}
      <AnimatePresence>
        {showiOSModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowiOSModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-w-sm z-[110] mx-auto text-slate-800"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                  <Smartphone size={24} />
                </div>
                <button
                  onClick={() => setShowiOSModal(false)}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <h3 className="text-lg font-black text-slate-900 tracking-tight">Pasang di iPhone Anda</h3>
              <p className="text-slate-500 font-medium text-xs mt-1.5 leading-relaxed">
                Ikuti langkah-langkah mudah di bawah ini untuk menambahkan aplikasi di Beranda iPhone Anda (menggunakan Safari browser):
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full flex items-center justify-center text-xs font-black">1</span>
                  <p className="text-xs font-semibold text-slate-700 leading-normal mt-0.5">
                    Ketuk tombol <strong className="text-indigo-600">Bagikan (Share)</strong> yang terletak di bilah navigasi bawah Safari.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full flex items-center justify-center text-xs font-black">2</span>
                  <p className="text-xs font-semibold text-slate-700 leading-normal mt-0.5">
                    Gulir opsi ke bawah lalu pilih menu <strong className="text-indigo-600">"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full flex items-center justify-center text-xs font-black">3</span>
                  <p className="text-xs font-semibold text-slate-700 leading-normal mt-0.5">
                    Ganti atau pertahankan nama aplikasi lalu ketuk <strong className="text-emerald-600 uppercase">Tambah (Add)</strong> di pojok kanan atas.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setShowiOSModal(false)}
                className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-blue-600 font-bold rounded-2xl h-10 text-xs text-white"
              >
                Saya Mengerti
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
