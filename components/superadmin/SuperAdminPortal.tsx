import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, ShieldCheck, Key, Lock, Unlock, Users, Home, TrendingUp, 
  Filter, Search, Plus, ExternalLink, ArrowRight, ArrowLeft, RefreshCw, 
  LogOut, CheckCircle2, AlertCircle, Phone, MessageSquare, Sparkles, 
  Layers, Wallet, BarChart3, Settings, Shield, ChevronRight,
  Server, Globe, Database, Activity, Check, HelpCircle
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Tenant, House, CashFlow, Announcement, Report, Role } from '../../types';
import { TenantRegistrationModal } from '../TenantRegistrationModal';
import { SUPER_ADMIN_EMAILS } from '../../constants';
import { auth } from '../../services/firebaseConfig';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface SuperAdminPortalProps {
  role?: Role | null;
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  role
}) => {
  const navigate = useNavigate();
  const { currentTenant, availableTenants, switchTenant, isSuperAdmin } = useTenant();

  // Modal & Search States
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active'>('all');

  // Filtered tenants list
  const filteredTenants = useMemo(() => {
    return availableTenants.filter(t => {
      const matchSearch = !searchQuery || 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.kelurahan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.chairmanName && t.chairmanName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.rw && t.rw.includes(searchQuery));

      return matchSearch;
    });
  }, [availableTenants, searchQuery]);

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Berhasil keluar dari sesi Super Admin');
      navigate('/');
    } catch (e) {
      toast.error('Gagal keluar sesi');
    }
  };

  // 1. NON-SUPERADMIN RESTRICTION SCREEN
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/30 text-rose-300 text-[10px] font-mono uppercase font-black mb-3">
            Otorisasi Terbatas
          </div>
          <h2 className="text-xl font-black text-white mb-2 tracking-tight">
            Khusus Super Admin Platform
          </h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Portal kendali fleet dan pendaftaran terpusat ini hanya dapat diakses oleh akun Super Admin platform ({SUPER_ADMIN_EMAILS.join(', ')}). 
            Akun pengurus RT reguler hanya memiliki akses ke wilayah RT masing-masing.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>Kembali ke Beranda</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. SUPER ADMIN FLEET CONTROL DASHBOARD
  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans">
      {/* Top Root Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Server size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight">
                Super Admin Fleet Control
              </h1>
              <span className="text-[9px] font-mono font-black uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                ROOT SUPER ADMIN
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              Pusat Tata Kelola & Registrasi Terpusat Seluruh RT / RW Platform
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Action: Add New Tenant */}
          <button
            onClick={() => setShowOnboardModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            <Plus size={14} />
            <span>Daftarkan RT Baru</span>
          </button>

          {/* Navigate to Public Home */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Buka Beranda Publik"
          >
            <span>Web Publik</span>
            <ExternalLink size={13} />
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
            title="Keluar dari Akun"
          >
            <LogOut size={16} />
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
              <div className="w-8 h-8 rounded-xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Database size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              TERISOLASI
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Isolasi ketat antar-RT aktif
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

              <button
                onClick={() => setShowOnboardModal(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                <Plus size={14} />
                <span>Tambah RT</span>
              </button>
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
                        <p className="text-[11px] text-emerald-400 font-mono mt-0.5">{t.chairmanPhone || '-'}</p>
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
                        ) : (
                          <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 bg-emerald-950 border border-emerald-500/40 text-emerald-300 rounded">
                            Aktif
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            window.open(`#/?rt=${t.slug || t.id}`, '_blank');
                          }}
                          className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                          title={`Buka Portal Publik ${t.name}`}
                        >
                          <span>Web Publik RT</span>
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

        {/* Security & Multi-Tenant Isolation Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800">
            <h3 className="text-sm font-black text-white mb-1 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Otorisasi Super Admin Platform</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Akun berikut terdaftar sebagai Super Admin dengan hak akses penuh ke registrasi tenant dan fleet switching.
            </p>
            <div className="space-y-2">
              {SUPER_ADMIN_EMAILS.map((email) => {
                const isCurrent = auth.currentUser?.email?.toLowerCase() === email.toLowerCase();
                return (
                  <div key={email} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                      <span className="text-xs font-mono text-slate-200">{email}</span>
                    </div>
                    {isCurrent && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-400">
                        Sesi Aktif
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800">
            <h3 className="text-sm font-black text-white mb-1 flex items-center gap-2">
              <Database size={16} className="text-indigo-400" />
              <span>Prinsip Isolasi Tenant Platform</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Standar perlindungan data multi-penyewa (multi-tenant) Teras Warga:
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Isolasi Tampilan:</strong> Pengurus & warga RT hanya dapat melihat data lingkungannya sendiri.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Pendaftaran Terpusat:</strong> Hanya Super Admin yang berwenang mendaftarkan RT baru.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Inspeksi Supervisi:</strong> Super Admin dapat beralih lingkungan RT untuk keperluan supervisi tanpa membocorkan data antar-warga.</span>
              </li>
            </ul>
          </div>
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
