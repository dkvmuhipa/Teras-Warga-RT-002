import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User, ChevronDown, LayoutGrid, Wallet, Users, Info, Download, X, Smartphone, Sparkles, HelpCircle,
  FileText, AlertTriangle, Home, ShoppingBag, Trash2, Store, LineChart, Scale, Activity, Calendar, BookOpen, Package, ShieldAlert, UserPlus, Menu, Wrench, Zap
} from 'lucide-react';
import { RT_NAME, Logo } from '../constants';
import { Button } from './ui/Button';
import { NotificationCenter } from './NotificationCenter';
import { AppNotification } from '../types';
import { motion, AnimatePresence } from 'motion/react';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        { path: '/services?tab=tamu', label: 'Lapor Tamu 24 Jam', desc: 'Pelaporan tamu menginap & keberadaan', icon: ShieldAlert, color: 'text-amber-600 bg-amber-50/70 border-amber-150' },
        { path: '/inventaris', label: 'Peminjaman Inventaris', desc: 'Pinjam barang hajatan & peralatan RT', icon: Package, color: 'text-amber-600 bg-amber-50/70 border-amber-150' },
        { path: '/services?tab=mutasi', label: 'Mutasi Warga', desc: 'Pendataan lapor pindah, lahir & duka', icon: UserPlus, color: 'text-emerald-600 bg-emerald-50/70 border-emerald-150' },
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
        { path: '/market', label: 'Pasar Warga', desc: 'Beli hasil dagangan warga lokal', icon: ShoppingBag, color: 'text-amber-600 bg-amber-50/70 border-amber-150' },
        { path: '/resident?tab=skills', label: 'Jasa & Keahlian Warga', desc: 'Tukang, teknisi, guru les, & katering tetangga', icon: Wrench, color: 'text-amber-600 bg-amber-50/70 border-amber-150' },
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
        { path: '/resident?tab=outages', label: 'Info Padam PLN/Air', desc: 'Jadwal pemeliharaan listrik PLN & pipa PDAM', icon: Zap, color: 'text-sky-600 bg-sky-50/70 border-sky-150' },
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
      <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 transition-all">
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
                className="hidden md:flex items-center gap-1.5 ml-2 text-xs font-black uppercase tracking-wider h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm active:scale-95 transition-all cursor-pointer font-sans"
              >
                <User size={13} />
                Panel Admin
              </button>

              {/* Mobile Hamburger Menu Toggle Button */}
              <div className="flex items-center lg:hidden gap-1.5">
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                  className={`p-2 rounded-xl transition-all border focus:outline-none ${
                    isMobileMenuOpen 
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30" 
                      : "text-slate-700 bg-slate-50 hover:bg-slate-100/80 border-slate-200/80"
                  }`}
                  title="Buka Menu Lengkap"
                  aria-label="Toggle Mobile Menu"
                >
                  {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Slide-down Full Menu Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[95] top-0"
              />

              {/* Drawer Container */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="lg:hidden absolute left-0 right-0 top-full bg-white/98 backdrop-blur-2xl border-b border-slate-200 shadow-2xl z-[100] max-h-[calc(100vh-5rem)] overflow-y-auto p-4 sm:p-6"
              >
                {/* Quick Home & Admin Shortcuts */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => {
                      navigate('/');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                      isActive('/') 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20' 
                        : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    <Home size={15} /> Beranda
                  </button>

                  <button
                    onClick={() => {
                      navigate('/admin');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex-1 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 shadow-md transition-all"
                  >
                    <User size={15} /> Panel Admin
                  </button>
                </div>

                {/* Nav Groups Iteration */}
                <div className="space-y-6 pb-6">
                  {navGroups.map((group) => {
                    const GroupIcon = group.icon;
                    return (
                      <div key={group.id} className="space-y-2.5">
                        <div className="flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-slate-400">
                          <GroupIcon size={14} className="text-indigo-600" />
                          <span>{group.label}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {group.items.map((item) => {
                            const ItemIcon = item.icon;
                            const isItemActive = isActive(item.path);
                            return (
                              <button
                                key={item.path}
                                onClick={() => {
                                  navigate(item.path);
                                  setIsMobileMenuOpen(false);
                                }}
                                className={`flex items-center gap-3 p-3 rounded-2xl w-full text-left transition-all border ${
                                  isItemActive
                                    ? "bg-indigo-50/80 border-indigo-200 text-indigo-700 font-bold"
                                    : "bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-100/80"
                                }`}
                              >
                                <div className={`p-2 rounded-xl shrink-0 ${item.color}`}>
                                  <ItemIcon size={16} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-black text-slate-800 leading-snug">{item.label}</p>
                                  <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{item.desc}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};
