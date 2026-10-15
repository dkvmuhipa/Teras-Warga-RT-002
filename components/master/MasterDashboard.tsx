import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, ShieldCheck, Key, Lock, Unlock, Users, Home, TrendingUp, 
  Filter, Search, Plus, ExternalLink, ArrowRight, ArrowLeft, RefreshCw, 
  LogOut, CheckCircle2, AlertCircle, Phone, MessageSquare, Sparkles, 
  Layers, Wallet, BarChart3, Settings, Shield, ChevronRight, Eye, EyeOff,
  Edit2, Share2, Printer, MapPin, Send, HelpCircle
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Tenant, House, CashFlow, Announcement, Report } from '../../types';
import { Logo } from '../../constants';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface MasterDashboardProps {
  houses?: House[];
  cashFlow?: CashFlow[];
  announcements?: Announcement[];
  reports?: Report[];
}

export const MasterDashboard: React.FC<MasterDashboardProps> = ({
  houses = [],
  cashFlow = [],
  announcements = [],
  reports = []
}) => {
  const navigate = useNavigate();
  const { currentTenant, availableTenants, switchTenant } = useTenant();

  // Master Authentication State via SessionStorage
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('is_master_authenticated') === 'true';
    } catch {
      return false;
    }
  });

  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'finance' | 'broadcast' | 'settings'>('overview');
  const [selectedRwFilter, setSelectedRwFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Master PIN Configuration from localStorage
  const [masterPin, setMasterPin] = useState<string>(() => {
    try {
      return localStorage.getItem('rw_master_pin') || '999888';
    } catch {
      return '999888';
    }
  });

  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');

  // Extract distinct RWs
  const availableRws = useMemo(() => {
    const set = new Set<string>();
    availableTenants.forEach(t => {
      if (t.rw) set.add(t.rw);
    });
    return Array.from(set).sort();
  }, [availableTenants]);

  // Filtered tenants by selected RW and search
  const filteredTenants = useMemo(() => {
    return availableTenants.filter(t => {
      const matchRw = selectedRwFilter === 'all' || t.rw === selectedRwFilter;
      const matchSearch = !searchQuery || 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.kelurahan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.chairmanName && t.chairmanName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchRw && matchSearch;
    });
  }, [availableTenants, selectedRwFilter, searchQuery]);

  // Aggregated Stats
  const stats = useMemo(() => {
    const totalTenants = filteredTenants.length;
    let totalBlocks = 0;
    let estimatedUnits = 0;

    filteredTenants.forEach(t => {
      totalBlocks += (t.blocks ? t.blocks.length : 0);
      if (t.blockConfig && t.blockConfig.length > 0) {
        t.blockConfig.forEach(bc => {
          estimatedUnits += Math.max(1, (bc.end - bc.start + 1));
        });
      } else {
        estimatedUnits += (t.blocks ? t.blocks.length * 20 : 0);
      }
    });

    return {
      totalTenants,
      totalBlocks,
      estimatedUnits,
      activeScopeCount: availableTenants.length
    };
  }, [filteredTenants, availableTenants]);

  // Handle PIN submission
  const handleVerifyPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput.trim() === masterPin) {
      try {
        sessionStorage.setItem('is_master_authenticated', 'true');
      } catch (err) {}
      setIsAuthenticated(true);
      setPinError(false);
      setPinInput('');
      toast.success('Otorisasi Berhasil', {
        description: 'Selamat datang di Pusat Kendali Master RW 020.'
      });
    } else {
      setPinError(true);
      toast.error('PIN Tidak Valid', {
        description: 'PIN Master yang Anda masukkan salah. Silakan coba lagi.'
      });
    }
  };

  // Lock Master Session
  const handleLockSession = () => {
    try {
      sessionStorage.removeItem('is_master_authenticated');
    } catch (err) {}
    setIsAuthenticated(false);
    toast.info('Sesi Master Dikunci');
  };

  // Change PIN handler
  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      toast.error('PIN Minimal 4 Digit');
      return;
    }
    if (newPin !== confirmNewPin) {
      toast.error('Konfirmasi PIN Baru Tidak Cocok');
      return;
    }
    try {
      localStorage.setItem('rw_master_pin', newPin);
      setMasterPin(newPin);
      setNewPin('');
      setConfirmNewPin('');
      toast.success('PIN Master Berhasil Diperbarui!');
    } catch (err) {
      toast.error('Gagal memperbarui PIN');
    }
  };

  // WhatsApp Broadcast to all RT Leaders
  const handleBroadcastAll = () => {
    const activeContacts = filteredTenants
      .filter(t => t.phone)
      .map(t => `${t.name}: ${t.phone}`);

    const text = encodeURIComponent(
      `*PEMBERITAHUAN KOORDINASI PENGURUS RW 020*\n\n` +
      `Kepada Yth. Bapak/Ibu Ketua RT di Lingkungan RW 020 Tondo,\n\n` +
      `Mohon perhatian untuk update koordinasi wilayah terbaru.\n` +
      `Portal Master RW: ${window.location.origin}/#/master\n\n` +
      `Tertanda,\n*Ketua & Pengurus RW 020 Tondo*`
    );

    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // 1. PIN GATEKEEPER SCREEN (If not authenticated)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]"
        >
          {/* Header Icon & Brand */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 mb-4 ring-4 ring-indigo-50">
              <Building2 size={32} />
            </div>
            <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-2">
              Super Admin & RW Executive Tower
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Portal Master RW
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Pusat kendali agregasi seluruh Rukun Tetangga (RT) dan tata kelola platform multi-tenant.
            </p>
          </div>

          {/* Form PIN */}
          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Masukkan PIN Master RW</span>
                <span className="text-[10px] font-medium text-slate-400">Default: 999888</span>
              </label>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (pinError) setPinError(false);
                  }}
                  placeholder="Ketik 6 digit PIN Master..."
                  className={`w-full px-4 py-3 pr-11 bg-slate-50 border ${pinError ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'} rounded-2xl text-slate-900 text-center tracking-widest text-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {pinError && (
                <p className="text-[11px] font-semibold text-rose-600 mt-1.5 flex items-center gap-1 justify-center">
                  <AlertCircle size={13} /> PIN salah. Silakan coba kembali (default: 999888).
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock size={16} /> Buka Pusat Kendali Master
            </button>
          </form>

          {/* Return Links */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-slate-500 hover:text-indigo-600 font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={14} /> Beranda Publik
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="text-slate-500 hover:text-indigo-600 font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              Dashboard RT <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. AUTHENTICATED MASTER DASHBOARD
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Building2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Pusat Kendali Pengurus RW 020
              </h1>
              <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                Pengurus RW
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              Kelurahan Tondo, Kecamatan Mantikulore, Kota Palu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Return to Active RT Admin */}
          <button
            onClick={() => navigate('/admin')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <span>Kembali ke RT 02</span>
            <ArrowRight size={13} />
          </button>

          {/* Lock Session */}
          <button
            onClick={handleLockSession}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title="Kunci Sesi Master"
          >
            <Lock size={13} />
            <span className="hidden sm:inline">Kunci Sesi</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-auto">
          {[
            { id: 'overview', label: 'Ringkasan & Agregasi RW', icon: BarChart3 },
            { id: 'tenants', label: 'Direktori & Pengurus RT', icon: Users },
            { id: 'finance', label: 'Konsolidasi Iuran', icon: Wallet },
            { id: 'broadcast', label: 'Siaran WhatsApp RW', icon: MessageSquare },
            { id: 'settings', label: 'Pengaturan & PIN', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & AGGREGATION */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total RT Binaan</span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Building2 size={16} />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {stats.totalTenants} <span className="text-xs font-bold text-slate-400">RT</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  Wilayah RW 020 Huntap Tondo 2
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Estimasi Hunian/KK</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Home size={16} />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                  ~{stats.estimatedUnits} <span className="text-xs font-bold text-slate-400">Pintu</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  Kapasitas total hunian se-RW
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Kavling / Blok</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Layers size={16} />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {stats.totalBlocks} <span className="text-xs font-bold text-slate-400">Blok</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  Terbagi di seluruh RT aktif
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Status Partisi</span>
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <ShieldCheck size={16} />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-sky-600 tracking-tight">
                  100%
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  Data terisolasi aman per tenant
                </p>
              </div>
            </div>

            {/* Quick Actions & Directory Snapshot */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
              <div className="relative z-10 max-w-2xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-400/20">
                  Otoritas Master Wilayah
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-3">
                  Tata Kelola Komunitas Warga Berbasis Rukun Warga
                </h2>
                <p className="text-xs sm:text-sm text-indigo-200/80 mt-2 leading-relaxed">
                  Platform Teras Warga kini mengelola beberapa RT di bawah koordinasi satu RW terpadu. Pengurus RT fokus melayani warga internal, sementara pengurus RW mengawasi pertumbuhan demografi dan keselarasan iuran se-RW.
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-6">
                  <button
                    onClick={handleBroadcastAll}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <MessageSquare size={15} /> Broadcast Pesan se-RW
                  </button>
                  <a
                    href="#/superadmin"
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-extrabold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Server size={15} /> Akses Super Admin (Provisioning)
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TENANT DIRECTORY & MANAGEMENT */}
        {activeTab === 'tenants' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari RT, ketua RT, atau wilayah..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedRwFilter}
                  onChange={(e) => setSelectedRwFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Semua RW</option>
                  {availableRws.map(rw => (
                    <option key={rw} value={rw}>RW {rw}</option>
                  ))}
                </select>

                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-xl shrink-0 hidden sm:inline-block">
                  Registrasi RT Terpusat di Super Admin
                </span>
              </div>
            </div>

            {/* Tenant Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTenants.map((t) => {
                const isActiveTenant = currentTenant.id === t.id;
                return (
                  <div 
                    key={t.id}
                    className={`bg-white rounded-2xl p-5 border transition-all ${
                      isActiveTenant ? 'border-indigo-400 ring-2 ring-indigo-50 shadow-md' : 'border-slate-200/80 shadow-2xs hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-slate-900 tracking-tight">
                            {t.name}
                          </h3>
                          {t.id === 'tondo-rw20-rt02' && (
                            <span className="text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                              RT Induk
                            </span>
                          )}
                          {t.isDemo && (
                            <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
                              Pilot Demo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          RW {t.rw} • Kel. {t.kelurahan}, Kec. {t.kecamatan}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-indigo-600">
                          {t.blocks.length} Blok
                        </span>
                      </div>
                    </div>

                    {/* Metadata Details */}
                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50/80 rounded-xl text-xs mb-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Ketua RT:</span>
                        <p className="font-bold text-slate-800">{t.chairmanName || 'Belum diisi'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Kontak WA:</span>
                        <p className="font-bold text-slate-800">{t.phone || '-'}</p>
                      </div>
                      <div className="col-span-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Daftar Blok:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {t.blocks.map(b => (
                            <span key={b} className="text-[10px] font-black px-1.5 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-md">
                              Blok {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          switchTenant(t.id);
                          navigate('/admin');
                          toast.success(`Beralih ke ${t.name}`);
                        }}
                        className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Masuk ke Dashboard RT</span>
                        <ArrowRight size={13} />
                      </button>

                      {t.phone && (
                        <a
                          href={`https://wa.me/${t.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                          title="Hubungi Ketua RT via WhatsApp"
                        >
                          <Phone size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: CONSOLIDATED FINANCE */}
        {activeTab === 'finance' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
              <h3 className="text-sm font-black text-slate-900 mb-1">
                Perbandingan Struktur Iuran & Retribusi per RT
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Pemeriksaan keselarasan tarif iuran sampah, keamanan, dan air PAM di lingkungan RW 020.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black border-y border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">Nama Wilayah</th>
                      <th className="py-2.5 px-3">Iuran Sampah</th>
                      <th className="py-2.5 px-3">Iuran Keamanan</th>
                      <th className="py-2.5 px-3">Tarif Air PAM</th>
                      <th className="py-2.5 px-3">Bendahara</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredTenants.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {t.name}
                        </td>
                        <td className="py-3 px-3">
                          Rp {(t.feeConfig?.trashFee || 20000).toLocaleString('id-ID')} /bln
                        </td>
                        <td className="py-3 px-3">
                          Rp {(t.feeConfig?.securityFee || 15000).toLocaleString('id-ID')} /bln
                        </td>
                        <td className="py-3 px-3">
                          Rp {(t.feeConfig?.waterPerM3 || 5000).toLocaleString('id-ID')} /m³
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-bold">
                          {t.treasurerName || 'Kasir RT'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: WHATSAPP BROADCAST */}
        {activeTab === 'broadcast' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                Siaran Komunikasi RW
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">
                Kirim Pesan Koordinasi Serentak ke Semua Ketua RT
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kirim pesan WhatsApp kepada seluruh ketua RT terdaftar untuk musyawarah RW, edaran kerja bakti raya, atau peringatan darurat.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400">Target Penerima:</span>
              <ul className="text-xs font-bold text-slate-700 space-y-1">
                {filteredTenants.map(t => (
                  <li key={t.id} className="flex items-center justify-between">
                    <span>{t.name} ({t.chairmanName || 'Ketua RT'})</span>
                    <span className="text-[11px] font-mono text-emerald-600">{t.phone || 'Tanpa no. WA'}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleBroadcastAll}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send size={16} /> Buka WhatsApp untuk Siaran Serentak
            </button>
          </div>
        )}

        {/* TAB 5: MASTER SETTINGS & PIN */}
        {activeTab === 'settings' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs">
              <h3 className="text-sm font-black text-slate-900 mb-1 flex items-center gap-2">
                <Key size={16} className="text-indigo-600" />
                <span>Ubah PIN Keamanan Master RW</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                PIN ini digunakan oleh Pengurus RW untuk membuka portal master ini.
              </p>

              <form onSubmit={handleChangePin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PIN Baru (Minimal 4 Angka)
                  </label>
                  <input
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Masukkan PIN baru..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Konfirmasi PIN Baru
                  </label>
                  <input
                    type="password"
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value)}
                    placeholder="Ulangi PIN baru..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  Simpan Perubahan PIN
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
