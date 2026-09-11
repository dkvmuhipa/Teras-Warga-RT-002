import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User, ChevronDown, LayoutGrid, Wallet, Users, Info, Download, X, Smartphone, Sparkles, HelpCircle,
  FileText, AlertTriangle, Home, ShoppingBag, Trash2, Store, LineChart, Scale, Activity, Calendar, BookOpen, Package, ShieldAlert, UserPlus, Menu, Wrench, Zap, MapPin, Building, History, Heart
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
      width: 'w-[540px] sm:w-[620px]',
      footer: {
        text: 'Layanan administrasi RT resmi & mandiri 24 jam',
        icon: Sparkles,
        color: 'text-indigo-600',
        note: 'Huntap Tondo 2, Palu'
      },
      items: [
        { path: '/services?tab=surat', label: 'Persuratan', desc: 'Pengisian form surat pengantar RT kilat digital', icon: FileText, color: 'text-indigo-600 bg-indigo-50/80 border-indigo-150' },
        { path: '/services?tab=tamu', label: 'Lapor Tamu 24 Jam', desc: 'Pelaporan tamu menginap & pendatang baru', icon: ShieldAlert, color: 'text-amber-600 bg-amber-50/80 border-amber-150' },
        { path: '/services?tab=lapor', label: 'Aduan & Aspirasi', desc: 'Keluhan fasilitas lingkungan, sampah & ketertiban', icon: AlertTriangle, color: 'text-rose-600 bg-rose-50/80 border-rose-150' },
        { path: '/services?tab=mutasi', label: 'Mutasi Warga', desc: 'Pendataan lapor pindah, kelahiran & berita duka', icon: UserPlus, color: 'text-emerald-600 bg-emerald-50/80 border-emerald-150' },
        { path: '/services?tab=sewa', label: 'Lapor Sewa & Kontrak', desc: 'Registrasi penghuni baru & verifikasi pemilik', icon: Building, color: 'text-purple-600 bg-purple-50/80 border-purple-150' },
        { path: '/services?tab=history', label: 'Cek Status & Berkas', desc: 'Lacak proses nomor resi surat & unduh salinan PDF', icon: History, color: 'text-sky-600 bg-sky-50/80 border-sky-150' },
      ]
    },
    {
      id: 'ekonomi',
      label: 'Ekonomi & Sosial',
      icon: Wallet,
      columns: 2,
      width: 'w-[520px] sm:w-[580px]',
      footer: {
        text: 'Mendukung kemandirian & gotong royong warga',
        icon: Heart,
        color: 'text-rose-600',
        note: 'RT 002 / RW 020'
      },
      items: [
        { path: '/umkm', label: 'Direktori UMKM & Jasa', desc: 'Katalog usaha kreatif, produk & jasa warga lingkungan', icon: Store, color: 'text-indigo-600 bg-indigo-50/80 border-indigo-150' },
        { path: '/sampah', label: 'Bank Sampah Digital', desc: 'Setor sampah anorganik terpilah jadi saldo kas', icon: Trash2, color: 'text-emerald-600 bg-emerald-50/80 border-emerald-150' },
        { path: '/donasi', label: 'Donasi & Kepedulian', desc: 'Program santunan duka, sosial & solidaritas warga', icon: Heart, color: 'text-rose-600 bg-rose-50/80 border-rose-150' },
        { path: '/kesehatan', label: 'Posyandu & Kesehatan', desc: 'Jadwal penimbangan balita, lansia & posbindu', icon: Activity, color: 'text-teal-600 bg-teal-50/80 border-teal-150' },
      ]
    },
    {
      id: 'info',
      label: 'Informasi',
      icon: Info,
      columns: 2,
      width: 'w-[540px] sm:w-[620px]',
      footer: {
        text: 'Pusat transparansi data & regulasi resmi lingkungan',
        icon: Info,
        color: 'text-sky-600',
        note: 'Kel. Tondo, Mantikulore'
      },
      items: [
        { path: '/info', label: 'Info RT & Kas', desc: 'Transparansi saldo kas, agenda & utilitas umum', icon: LineChart, color: 'text-sky-600 bg-sky-50/80 border-sky-150' },
        { path: '/about', label: 'Tentang Kami', desc: 'Sejarah, struktur kepengurusan RT & visi misi', icon: Info, color: 'text-indigo-600 bg-indigo-50/80 border-indigo-150' },
        { path: '/rules', label: 'Peraturan RT 02', desc: 'Tata tertib resmi bermukim di Huntap Tondo 2', icon: Scale, color: 'text-slate-700 bg-slate-50/80 border-slate-150' },
        { path: '/peta', label: 'Peta Wilayah & Mitigasi', desc: 'Denah kavling hunian, jalur evakuasi & live BMKG', icon: MapPin, color: 'text-rose-600 bg-rose-50/80 border-rose-150' },
        { path: '/faq', label: 'E-FAQ RT', desc: 'Panduan mandiri penyelesaian kendala harian', icon: HelpCircle, color: 'text-violet-600 bg-violet-50/80 border-violet-150' },
        { path: '/kegiatan', label: 'Jadwal Agenda', desc: 'Kalender kerja bakti, siskamling & pertemuan', icon: Calendar, color: 'text-emerald-600 bg-emerald-50/80 border-emerald-150' },
        { path: '/dokumen', label: 'Arsip Dokumen', desc: 'Download berita acara, regulasi & draf formulir', icon: Download, color: 'text-blue-600 bg-blue-50/80 border-blue-150' },
        { path: '/resident', label: 'Portal Warga Mandiri', desc: 'Akses kartu identitas digital & riwayat iuran kavling', icon: Users, color: 'text-amber-600 bg-amber-50/80 border-amber-150' },
      ]
    }
  ];

  const isGroupActive = (group: typeof navGroups[0]) => {
    if (group.id === 'layanan' && (location.pathname === '/services' || location.pathname === '/layanan')) {
      return true;
    }
    return group.items.some(item => isActive(item.path));
  };

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-18">
            <div className="flex items-center cursor-pointer py-1" onClick={() => navigate('/')}>
              <Logo showText={true} imageSize="h-8 md:h-10" />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center space-x-1 mr-2">
                <button 
                  onClick={() => navigate('/')} 
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${isActive('/') ? "text-indigo-600 bg-indigo-50/80 font-black" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  Beranda
                </button>

                {navGroups.map((group) => {
                  const active = isGroupActive(group);
                  return (
                    <div 
                      key={group.id}
                      className="relative"
                      onMouseEnter={() => setActiveDropdown(group.id)}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      <button 
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                          active 
                          ? "text-indigo-600 bg-indigo-50/80" 
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        {group.label}
                        <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === group.id ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {activeDropdown === group.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white/98 backdrop-blur-2xl border border-slate-200/80 rounded-[1.75rem] shadow-2xl p-4 z-50 overflow-hidden ${group.width}`}
                          >
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-500" />
                            
                            <div className={group.columns === 2 ? 'grid grid-cols-2 gap-2.5' : 'space-y-2'}>
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
                                    className={`group flex items-start gap-3 p-3 rounded-2xl w-full text-left transition-all ${
                                      isItemActive
                                      ? "bg-indigo-50/90 text-indigo-700 border border-indigo-200/60 shadow-xs"
                                      : "hover:bg-slate-50/90 text-slate-700 hover:text-slate-900 border border-transparent hover:border-slate-100"
                                    }`}
                                  >
                                    <div className={`p-2 rounded-xl transition-all group-hover:scale-105 shrink-0 ${item.color} shadow-2xs`}>
                                      <ItemIcon size={16} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-1">
                                        <p className="text-xs font-black tracking-tight text-slate-800 group-hover:text-indigo-600 transition-colors">
                                          {item.label}
                                        </p>
                                        <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-indigo-500 text-[11px] font-bold shrink-0">→</span>
                                      </div>
                                      <p className="text-[11px] text-slate-500 group-hover:text-slate-600 font-medium leading-relaxed mt-0.5 line-clamp-2">
                                        {item.desc}
                                      </p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Dropdown Footer */}
                            {group.footer && (
                              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between px-2 text-[10px] font-bold text-slate-400">
                                <span className={`flex items-center gap-1.5 ${group.footer.color}`}>
                                  <group.footer.icon size={12} />
                                  <span>{group.footer.text}</span>
                                </span>
                                <span className="text-slate-400">{group.footer.note}</span>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Quick Portal Warga Button on Desktop */}
              <button 
                onClick={() => navigate('/resident')} 
                className={`hidden xl:flex items-center gap-1.5 px-3.5 h-10 rounded-xl text-xs font-bold transition-all border ${
                  location.pathname === '/resident'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-700 border-indigo-200/70'
                }`}
                title="Akses Portal Mandiri Warga RT 002"
              >
                <Users size={14} />
                <span>Portal Warga</span>
              </button>
              
              <NotificationCenter 
                notifications={notifications} 
                onMarkRead={onMarkRead} 
                onDelete={onDeleteNotification}
                onDeleteAll={onDeleteAllNotifications}
              />

              <div className="hidden md:block h-6 w-px bg-slate-200 mx-1"></div>
              <button 
                onClick={() => navigate('/admin')} 
                className="hidden md:flex items-center gap-1.5 ml-1 text-xs font-black uppercase tracking-wider h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm active:scale-95 transition-all cursor-pointer font-sans"
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
                {/* Quick Home, Resident Portal & Admin Shortcuts */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <button
                    onClick={() => {
                      navigate('/');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`py-3 px-2 rounded-2xl font-black text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-1 border transition-all ${
                      isActive('/') 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20' 
                        : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    <Home size={15} /> 
                    <span>Beranda</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/resident');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`py-3 px-2 rounded-2xl font-black text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-1 border transition-all ${
                      isActive('/resident')
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200/80 hover:bg-indigo-100'
                    }`}
                  >
                    <Users size={15} /> 
                    <span>Warga</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/admin');
                      setIsMobileMenuOpen(false);
                    }}
                    className="py-3 px-2 rounded-2xl font-black text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-1 bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 shadow-md transition-all"
                  >
                    <User size={15} /> 
                    <span>Admin</span>
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
                                className={`flex items-start gap-3 p-3 rounded-2xl w-full text-left transition-all border ${
                                  isItemActive
                                    ? "bg-indigo-50/80 border-indigo-200 text-indigo-700 font-bold shadow-2xs"
                                    : "bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-100/80"
                                }`}
                              >
                                <div className={`p-2 rounded-xl shrink-0 ${item.color}`}>
                                  <ItemIcon size={16} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-black text-slate-800 leading-snug">{item.label}</p>
                                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">{item.desc}</p>
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
