import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, ShieldCheck, Key, Lock, Unlock, Users, Home, TrendingUp, 
  Filter, Search, Plus, ExternalLink, ArrowRight, ArrowLeft, RefreshCw, 
  LogOut, CheckCircle2, AlertCircle, Phone, MessageSquare, Sparkles, 
  Layers, Wallet, BarChart3, Settings, Shield, ChevronRight, Eye, EyeOff,
  Edit2, Trash2, Server, Globe, Database, Activity, Check, HelpCircle
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Tenant, House, CashFlow, Announcement, Report } from '../../types';
import { TenantRegistrationModal } from '../TenantRegistrationModal';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface SuperAdminPortalProps {
  houses?: House[];
  cashFlow?: CashFlow[];
  announcements?: Announcement[];
  reports?: Report[];
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  houses = [],
  cashFlow = [],
  announcements = [],
  reports = []
}) => {
  const navigate = useNavigate();
  const { currentTenant, availableTenants, switchTenant } = useTenant();

  // Root Super Admin Master Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('is_superadmin_authenticated') === 'true';
    } catch {
      return false;
    }
  });

  const [authKeyInput, setAuthKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'tenants' | 'provisioning' | 'telemetry' | 'security'>('tenants');
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'demo' | 'suspended'>('all');

  // Super Admin Root Key configuration (Stored securely in localStorage or default)
  const [superAdminKey, setSuperAdminKey] = useState<string>(() => {
    try {
      return localStorage.getItem('platform_superadmin_key') || 'superadmin2026';
    } catch {
      return 'superadmin2026';
    }
  });

  const [newKey, setNewKey] = useState('');
  const [confirmNewKey, setConfirmNewKey] = useState('');

  // Filtered tenants list
  const filteredTenants = useMemo(() => {
    return availableTenants.filter(t => {
      const matchSearch = !searchQuery || 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.kelurahan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.chairmanName && t.chairmanName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.rw && t.rw.includes(searchQuery));

      let matchStatus = true;
      if (statusFilter === 'demo') matchStatus = !!t.isDemo || !!t.isPilotDemo;
      if (statusFilter === 'active') matchStatus = !t.isDemo && !t.isPilotDemo;

      return matchSearch && matchStatus;
    });
  }, [availableTenants, searchQuery, statusFilter]);

  // Global Telemetry Stats
  const platformStats = useMemo(() => {
    const totalTenants = availableTenants.length;
    let totalBlocks = 0;
    let totalEstimatedDoors = 0;

    availableTenants.forEach(t => {
      totalBlocks += (t.blocks ? t.blocks.length : 0);
      if (t.blockConfig && t.blockConfig.length > 0) {
        t.blockConfig.forEach(bc => {
          totalEstimatedDoors += Math.max(1, (bc.end - bc.start + 1));
        });
      } else {
        totalEstimatedDoors += (t.blocks ? t.blocks.length * 20 : 0);
      }
    });

    return {
      totalTenants,
      totalBlocks,
      totalEstimatedDoors,
      activeScope: currentTenant.name
    };
  }, [availableTenants, currentTenant]);

  // Handle Super Admin Key Verification
  const handleVerifyKey = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (authKeyInput.trim() === superAdminKey) {
      try {
        sessionStorage.setItem('is_superadmin_authenticated', 'true');
      } catch (err) {}
      setIsAuthenticated(true);
      setAuthError(false);
      setAuthKeyInput('');
      toast.success('Super Admin Terverifikasi', {
        description: 'Selamat datang di Pusat Kendali Root Platform Teras Warga.'
      });
    } else {
      setAuthError(true);
      toast.error('Kunci Akses Ditolak', {
        description: 'Kunci Super Admin tidak valid. Periksa kembali kunci master Anda.'
      });
    }
  };

  // Lock Session
  const handleLockSession = () => {
    try {
      sessionStorage.removeItem('is_superadmin_authenticated');
    } catch (err) {}
    setIsAuthenticated(false);
    toast.info('Sesi Super Admin Ditutup');
  };

  // Update Master Key
  const handleChangeKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKey.length < 6) {
      toast.error('Kunci Super Admin minimal 6 karakter');
      return;
    }
    if (newKey !== confirmNewKey) {
      toast.error('Konfirmasi Kunci Baru tidak cocok');
      return;
    }
    try {
      localStorage.setItem('platform_superadmin_key', newKey);
      setSuperAdminKey(newKey);
      setNewKey('');
      setConfirmNewKey('');
      toast.success('Kunci Super Admin Berhasil Diperbarui!');
    } catch (err) {
      toast.error('Gagal memperbarui kunci akses');
    }
  };

  // 1. ROOT AUTHENTICATION SCREEN (If not authenticated)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-mono select-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(79,70,229,0.3)] backdrop-blur-2xl"
        >
          {/* Header Terminal Icon & Badge */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
              <ShieldAlert size={32} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-[10px] font-black tracking-widest text-indigo-300 uppercase bg-indigo-950/80 border border-indigo-500/30 px-3 py-0.5 rounded-full">
                PLATFORM SUPER ADMIN
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Central Control Tower
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs font-sans">
              Gerbang khusus pengelolaan dan pendaftaran terpusat seluruh penyewa (RT/RW) platform.
            </p>
          </div>

          {/* Form Auth */}
          <form onSubmit={handleVerifyKey} className="space-y-4 font-sans">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Super Admin Secret Key</span>
                <span className="text-[10px] font-mono text-slate-400">Default: superadmin2026</span>
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={authKeyInput}
                  onChange={(e) => {
                    setAuthKeyInput(e.target.value);
                    if (authError) setAuthError(false);
                  }}
                  placeholder="Masukkan kunci root super admin..."
                  className={`w-full px-4 py-3 pr-11 bg-slate-950 border ${authError ? 'border-rose-500 bg-rose-950/20' : 'border-slate-700 focus:border-indigo-500'} rounded-2xl text-white text-center tracking-widest text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {authError && (
                <p className="text-[11px] font-semibold text-rose-400 mt-1.5 flex items-center gap-1 justify-center">
                  <AlertCircle size={13} /> Kunci tidak valid. Default: superadmin2026
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.99] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock size={16} /> Otorisasi Akses Root
            </button>
          </form>

          {/* Quick Exit Links */}
          <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-xs font-sans">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-indigo-400 font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={14} /> Beranda Publik
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="text-slate-400 hover:text-indigo-400 font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              Dashboard RT <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. ROOT SUPER ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans">
      {/* Top Root Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Server size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight">
                Super Admin Fleet Control
              </h1>
              <span className="text-[9px] font-mono font-black uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                ROOT ACCESS
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              Pusat Tata Kelola & Registrasi Terpusat Seluruh RT / RW Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Action: Add New Tenant */}
          <button
            onClick={() => setShowOnboardModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            <Plus size={14} />
            <span>Daftarkan RT Baru</span>
          </button>

          {/* Lock Root Session */}
          <button
            onClick={handleLockSession}
            className="p-2 bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
            title="Kunci Sesi Root"
          >
            <Lock size={16} />
          </button>
        </div>
      </header>

      {/* Main Root Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Total Tenant RT</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-950/60 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Globe size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {platformStats.totalTenants} <span className="text-xs font-bold text-slate-400">Tenant</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Terdaftar dalam sistem Firestore
            </p>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Total Blok Kavling</span>
              <div className="w-8 h-8 rounded-xl bg-amber-950/60 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Layers size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
              {platformStats.totalBlocks} <span className="text-xs font-bold text-slate-400">Blok</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Dinaungi di seluruh wilayah
            </p>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Estimasi Hunian/KK</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Home size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              ~{platformStats.totalEstimatedDoors} <span className="text-xs font-bold text-slate-400">Kavling</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Kapasitas total platform
            </p>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Status DB Security</span>
              <div className="w-8 h-8 rounded-xl bg-sky-950/60 text-sky-400 flex items-center justify-center border border-sky-500/20">
                <Database size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-sky-400 tracking-tight">
              LOCKED
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Hanya Super Admin yang dapat menulis
            </p>
          </div>
        </div>

        {/* Centralized Tenant Provisioning Management Table */}
        <div className="bg-slate-900/80 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
          {/* Table Header & Controls */}
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>Direktori Penyewa Terdaftar (Tenants)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-500/30">
                  {filteredTenants.length} RT
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pengelolaan wewenang, batas kavling, dan akses masuk operasional per RT.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama RT, kelurahan..."
                  className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Semua Status</option>
                <option value="active">RT Aktif</option>
                <option value="demo">Pilot Demo</option>
              </select>
            </div>
          </div>

          {/* Tenants Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] font-mono font-black border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Nama Wilayah / Tenant</th>
                  <th className="py-3 px-4">RW / Kelurahan</th>
                  <th className="py-3 px-4">Ketua RT / Kontak</th>
                  <th className="py-3 px-4">Blok Terdaftar</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi Operasional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredTenants.map((t) => {
                  const isCurrent = currentTenant.id === t.id;
                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div className="flex items-center gap-2.5">
                          <div 
                            className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white shrink-0"
                            style={{ backgroundColor: t.themeColor || '#4f46e5' }}
                          >
                            {t.rt}
                          </div>
                          <div>
                            <p className="text-white font-bold leading-tight">{t.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{t.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        RW {t.rw} • Kel. {t.kelurahan}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="text-slate-200 font-bold leading-tight">{t.chairmanName || 'Belum ditunjuk'}</p>
                        <p className="text-[11px] text-emerald-400 font-mono mt-0.5">{t.phone || '-'}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {t.blocks.map(b => (
                            <span key={b} className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 border border-slate-700 text-slate-300 rounded">
                              {b}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {t.id === 'tondo-rw20-rt02' ? (
                          <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 bg-indigo-950 border border-indigo-500/40 text-indigo-300 rounded">
                            Utama
                          </span>
                        ) : t.isDemo || t.isPilotDemo ? (
                          <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 bg-amber-950 border border-amber-500/40 text-amber-300 rounded">
                            Demo
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 bg-emerald-950 border border-emerald-500/40 text-emerald-300 rounded">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            switchTenant(t.id);
                            navigate('/admin');
                            toast.success(`Beralih inspeksi ke ${t.name}`);
                          }}
                          className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Inspeksi RT</span>
                          <ExternalLink size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Settings Section */}
        <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 max-w-xl">
          <h3 className="text-sm font-black text-white mb-1 flex items-center gap-2">
            <Key size={16} className="text-indigo-400" />
            <span>Pengaturan Kunci Akses Super Admin</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Kunci ini digunakan secara eksklusif oleh pengembang / super admin untuk membuka portal ini.
          </p>

          <form onSubmit={handleChangeKey} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Kunci Baru (Minimal 6 karakter)
              </label>
              <input
                type="password"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Masukkan kunci baru..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Konfirmasi Kunci Baru
              </label>
              <input
                type="password"
                value={confirmNewKey}
                onChange={(e) => setConfirmNewKey(e.target.value)}
                placeholder="Ulangi kunci baru..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Simpan Kunci Akses
            </button>
          </form>
        </div>
      </main>

      {/* Centralized Onboarding Registration Modal */}
      <TenantRegistrationModal
        isOpen={showOnboardModal}
        onClose={() => setShowOnboardModal(false)}
        onSuccess={(created) => {
          toast.success(`Tenant ${created.name} Berhasil Didaftarkan oleh Super Admin!`);
        }}
      />
    </div>
  );
};
