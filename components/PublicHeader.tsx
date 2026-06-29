import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User, ChevronDown, LayoutGrid, Wallet, Users, Info, Download, X, Smartphone, Sparkles, HelpCircle,
  FileText, AlertTriangle, Home, ShoppingBag, Trash2, Store, LineChart, Scale, Activity, Calendar, BookOpen
} from 'lucide-react';
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

  const isActive = (path: string) => {
    if (path.includes('?')) {
      return location.pathname + location.search === path;
    }
    return location.pathname === path;
  };

  const navGroups = [
    {
      id: 'layanan',
      label: 'Layanan',
      icon: LayoutGrid,
      columns: 2,
      width: 'w-[480px] sm:w-[540px]',
      items: [
        { path: '/services?tab=surat', label: 'Persuratan', desc: 'Pengisian form surat pengantar RT kilat', icon: FileText, color: 'text-indigo-600 bg-indigo-50/70 border-indigo-150' },
        { path: '/services?tab=lapor', label: 'Lapor Masalah', desc: 'Aduan fasilitas & kendala lingkungan', icon: AlertTriangle, color: 'text-rose-600 bg-rose-50/70 border-rose-150' },
        { path: '/services?tab=mutasi', label: 'Mutasi Warga', desc: 'Pencatatan data warga baru & pindah huni', icon: Users, color: 'text-emerald-600 bg-emerald-50/70 border-emerald-150' },
        { path: '/services?tab=tamu', label: 'Lapor Tamu', desc: 'Wajib lapor kunjungan menginap 24 jam', icon: Home, color: 'text-amber-600 bg-amber-50/70 border-amber-150' },
        { path: '/dokumen', label: 'Arsip Dokumen', desc: 'Berita acara, regulasi, & draf surat kosong', icon: Download, color: 'text-blue-600 bg-blue-50/70 border-blue-150' },
        { path: '/voting', label: 'E-Voting', desc: 'Salurkan hak suara mufakat bersama', icon: HelpCircle, color: 'text-violet-600 bg-violet-50/70 border-violet-150' },
      ]
    },
    {
      id: 'ekonomi',
      label: 'Ekonomi & Sosial',
      icon: Wallet,
      columns: 2,
      width: 'w-[480px] sm:w-[540px]',
      items: [
        { path: '/market', label: 'Pasar Warga', desc: 'Beli hasil dagangan & jasa warga lokal', icon: ShoppingBag, color: 'text-amber-600 bg-amber-50/70 border-amber-150' },
        { path: '/sampah', label: 'Bank Sampah', desc: 'Setor sampah anorganik jadi saldo digital', icon: Trash2, color: 'text-emerald-600 bg-emerald-50/70 border-emerald-150' },
        { path: '/umkm', label: 'Direktori UMKM', desc: 'Katalog usaha kreatif binaan kepengurusan', icon: Store, color: 'text-indigo-600 bg-indigo-50/70 border-indigo-150' },
        { path: '/literasi', label: 'Taman Bacaan', desc: 'Tukar & baca buku digital warga', icon: BookOpen, color: 'text-rose-600 bg-rose-50/70 border-rose-150' },
      ]
    },
    {
      id: 'info',
      label: 'Informasi',
      icon: Info,
      columns: 2,
      width: 'w-[480px] sm:w-[540px]',
      items: [
        { path: '/info', label: 'Info RT & Kas', desc: 'Metrik keuangan transparan terdistribusi', icon: LineChart, color: 'text-sky-600 bg-sky-50/70 border-sky-150' },
        { path: '/about', label: 'Tentang Kami', desc: 'Sejarah, visi kepengurusan & biografi', icon: Info, color: 'text-indigo-600 bg-indigo-50/70 border-indigo-150' },
        { path: '/rules', label: 'Peraturan RT 02', desc: 'Tata tertib resmi warga Huntap Tondo 2', icon: Scale, color: 'text-slate-700 bg-slate-50/70 border-slate-150' },
        { path: '/gempa', label: 'Monitor Gempa', desc: 'Siaga seismik regional & integrasi BMKG', icon: Activity, color: 'text-rose-600 bg-rose-50/70 border-rose-150' },
        { path: '/faq', label: 'E-FAQ RT', desc: 'Solusi mandiri kebingungan harian warga', icon: HelpCircle, color: 'text-violet-600 bg-violet-50/70 border-violet-150' },
        { path: '/kegiatan', label: 'Jadwal Agenda', desc: 'Jadwal kerja bakti, ronda & posyandu', icon: Calendar, color: 'text-emerald-600 bg-emerald-50/70 border-emerald-150' },
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
            className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white overflow-hidden relative z-50 shadow-md border-b border-indigo-900/35"
          >
            <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left select-none">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg hidden sm:block border border-indigo-500/20">
                  <Sparkles size={16} className="text-amber-300 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight flex items-center gap-1.5 justify-center sm:justify-start">
                    Pasang Aplikasi TERAS RT 02 
                    <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-md uppercase tracking-wider font-mono">PWA</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Akses super cepat serba instan langsung dari layar utama ponsel Anda.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
                <button
                  onClick={handleInstallClick}
                  className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-[11px] font-black uppercase tracking-wider px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer text-white"
                >
                  <Download size={13} strokeWidth={2.5} />
                  Pasang Sekarang
                </button>
                <button
                  onClick={dismissBanner}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors hover:bg-white/5 rounded-lg cursor-pointer"
                  title="Tutup banner"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-18">
            <div className="flex items-center cursor-pointer py-1" onClick={() => navigate('/')}>
              <Logo showText={true} imageSize="h-8 md:h-10" />
            </div>
            
            <div className="flex items-center gap-2">
                <div className="hidden lg:flex items-center space-x-1.5 mr-4">
                  <button 
                    onClick={() => navigate('/')} 
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${isActive('/') ? "text-indigo-600 bg-indigo-50/70" : "text-slate-600 hover:bg-slate-50"}`}
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
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                          group.items.some(item => isActive(item.path)) 
                          ? "text-indigo-600 bg-indigo-50/70" 
                          : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {group.label}
                        <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === group.id ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {activeDropdown === group.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-[1.75rem] shadow-xl p-4 z-50 overflow-hidden ${group.width}`}
                          >
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-500" />
                            <div className={group.columns === 2 ? 'grid grid-cols-2 gap-3' : 'space-y-2'}>
                              {group.items.map((item) => {
                                const ItemIcon = item.icon;
                                const isItemActive = isActive(item.path);
                                return (
                                  <button
                                    key={item.path}
                                    onClick={() => {
                                      navigate(item.path);
                                      setActiveDropdown(null);
                                    }}
                                    className={`group flex items-start gap-3 p-2.5 rounded-2xl w-full text-left transition-all ${
                                      isItemActive
                                      ? "bg-indigo-50/80 text-indigo-700 border border-indigo-100/40"
                                      : "hover:bg-slate-50/80 text-slate-700 hover:text-slate-900 border border-transparent"
                                    }`}
                                  >
                                    <div className={`p-2 rounded-xl transition-transform group-hover:scale-105 shrink-0 ${item.color}`}>
                                      <ItemIcon size={16} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-black tracking-tight text-slate-800 group-hover:text-indigo-600 transition-colors">
                                        {item.label}
                                      </p>
                                      <p className="text-[10px] text-slate-400 font-semibold leading-normal mt-0.5 max-w-[200px] truncate">
                                        {item.desc}
                                      </p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
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
                <button 
                  onClick={() => navigate('/admin')} 
                  className="hidden md:flex items-center gap-1.5 ml-2 text-xs font-black uppercase tracking-wider h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 text-white shadow-sm active:scale-95 transition-all cursor-pointer font-sans"
                >
                  <User size={13} />
                  Panel Admin
                </button>
            </div>
            <div className="flex items-center lg:hidden gap-2">
               {/* Mobile PWA Install Button */}
               {!isStandalone && (isInstallable || isIOS) && (
                 <button 
                   onClick={handleInstallClick}
                   className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-xl transition-all"
                   title="Pasang Aplikasi PWA"
                 >
                   <Download size={12} className="animate-bounce" />
                   <span>Pasang</span>
                 </button>
               )}
               <button 
                 onClick={() => navigate('/admin')} 
                 className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100/80 rounded-xl transition-all border border-slate-100 focus:outline-none"
                 title="Panel Admin"
               >
                 <User size={18}/>
               </button>
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
