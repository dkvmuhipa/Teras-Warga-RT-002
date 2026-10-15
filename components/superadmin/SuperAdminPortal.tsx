import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, ShieldCheck, Key, Lock, Unlock, Users, Home, TrendingUp, 
  Filter, Search, Plus, ExternalLink, ArrowRight, ArrowLeft, RefreshCw, 
  LogOut, CheckCircle2, AlertCircle, Phone, MessageSquare, Sparkles, 
  Layers, Wallet, BarChart3, Settings, Shield, ChevronRight,
  Server, Globe, Database, Activity, Check, HelpCircle, Download,
  Radio, Megaphone, FileText, Bell, LayoutGrid, List, Copy,
  Edit3, Trash2, Sliders, CheckSquare, Eye, Share2, Info
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Tenant, Role } from '../../types';
import { TenantRegistrationModal } from '../TenantRegistrationModal';
import { TenantDetailModal } from './TenantDetailModal';
import { SUPER_ADMIN_EMAILS } from '../../constants';
import { auth } from '../../services/firebaseConfig';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface SuperAdminPortalProps {
  role?: Role | null;
}

interface SystemBroadcast {
  id: string;
  title: string;
  message: string;
  priority: 'info' | 'warning' | 'urgent' | 'maintenance';
  targetTenantId: 'all' | string;
  createdAt: string;
  isActive: boolean;
}

const BROADCAST_STORAGE_KEY = 'teras_system_broadcasts';

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  role
}) => {
  const navigate = useNavigate();
  const { currentTenant, availableTenants, switchTenant, isSuperAdmin, deleteTenant } = useTenant();

  // Tab State
  const [activeTab, setActiveTab] = useState<'tenants' | 'tariffs' | 'broadcast' | 'security'>('tenants');

  // Modal States
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [selectedTenantForDetail, setSelectedTenantForDetail] = useState<Tenant | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [kelurahanFilter, setKelurahanFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Broadcast Manager State
  const [broadcasts, setBroadcasts] = useState<SystemBroadcast[]>(() => {
    try {
      const stored = localStorage.getItem(BROADCAST_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse broadcasts:', e);
    }
    return [
      {
        id: 'bc-sample-1',
        title: 'Pembaruan Sistem Multi-Tenant v2.4 Selesai',
        message: 'Seluruh tenant RT/RW kini berjalan di bawah arsitektur basis data terisolasi dengan performa kilat dan pencadangan otomatis.',
        priority: 'info',
        targetTenantId: 'all',
        createdAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        isActive: true
      }
    ];
  });

  const [newBroadcastTitle, setNewBroadcastTitle] = useState('');
  const [newBroadcastMessage, setNewBroadcastMessage] = useState('');
  const [newBroadcastPriority, setNewBroadcastPriority] = useState<'info' | 'warning' | 'urgent' | 'maintenance'>('info');
  const [newBroadcastTarget, setNewBroadcastTarget] = useState<string>('all');

  // Save broadcasts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(BROADCAST_STORAGE_KEY, JSON.stringify(broadcasts));
    } catch (e) {
      console.error('Failed to store broadcasts:', e);
    }
  }, [broadcasts]);

  // Unique Kelurahan options for filtering
  const kelurahanOptions = useMemo(() => {
    const set = new Set<string>();
    availableTenants.forEach(t => {
      if (t.kelurahan) set.add(t.kelurahan.trim());
    });
    return Array.from(set);
  }, [availableTenants]);

  // Filtered tenants list
  const filteredTenants = useMemo(() => {
    return availableTenants.filter(t => {
      const matchSearch = !searchQuery || 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.kelurahan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.chairmanName && t.chairmanName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.rw && t.rw.includes(searchQuery)) ||
        (t.rt && t.rt.includes(searchQuery)) ||
        (t.slug && t.slug.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchKelurahan = kelurahanFilter === 'all' || 
        t.kelurahan.toLowerCase() === kelurahanFilter.toLowerCase();

      return matchSearch && matchKelurahan;
    });
  }, [availableTenants, searchQuery, kelurahanFilter]);

  // Global Telemetry Stats
  const platformStats = useMemo(() => {
    const totalTenants = availableTenants.length;
    let totalBlocks = 0;
    let totalEstimatedDoors = 0;

    let totalSampahUmum = 0;
    let totalKasFee = 0;
    let totalAirFee = 0;

    availableTenants.forEach(t => {
      totalBlocks += (t.blocks ? t.blocks.length : 0);
      if (t.blockConfig && t.blockConfig.length > 0) {
        t.blockConfig.forEach(bc => {
          totalEstimatedDoors += Math.max(1, (bc.end - bc.start + 1));
        });
      } else {
        totalEstimatedDoors += (t.blocks ? t.blocks.length * 20 : 0);
      }

      totalSampahUmum += (t.fees?.sampahUmum || 20000);
      totalKasFee += (t.fees?.kasFee || 20000);
      totalAirFee += (t.fees?.airFee || 10000);
    });

    const avgSampah = totalTenants > 0 ? Math.round(totalSampahUmum / totalTenants) : 0;
    const avgKas = totalTenants > 0 ? Math.round(totalKasFee / totalTenants) : 0;
    const avgAir = totalTenants > 0 ? Math.round(totalAirFee / totalTenants) : 0;

    return {
      totalTenants,
      totalBlocks,
      totalEstimatedDoors,
      avgSampah,
      avgKas,
      avgAir,
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

  // Export tenants directory as CSV
  const handleExportCSV = () => {
    try {
      const headers = ['ID Tenant', 'Nama RT', 'RT', 'RW', 'Kelurahan', 'Alamat', 'Ketua RT', 'No Telp', 'Blok Terdaftar', 'Tarif Sampah', 'Kas RT', 'Air PDAM'];
      const rows = availableTenants.map(t => [
        `"${t.id}"`,
        `"${t.name}"`,
        `"${t.rt}"`,
        `"${t.rw}"`,
        `"${t.kelurahan}"`,
        `"${(t.address || '').replace(/"/g, '""')}"`,
        `"${t.chairmanName || '-'}"`,
        `"${t.chairmanPhone || '-'}"`,
        `"${(t.blocks || []).join('; ')}"`,
        t.fees?.sampahUmum || 20000,
        t.fees?.kasFee || 20000,
        t.fees?.airFee || 10000
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `teras-warga-tenants-directory-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Direktori tenant berhasil diekspor ke CSV!');
    } catch (e) {
      toast.error('Gagal mengekspor data');
    }
  };

  // Copy quick public link
  const copyPublicLink = (slugOrId: string) => {
    const origin = window.location.origin + window.location.pathname;
    const url = `${origin}#/?rt=${slugOrId}`;
    navigator.clipboard.writeText(url);
    toast.success('Link Portal Publik berhasil disalin ke clipboard');
  };

  // Copy citizen registration link
  const copyRegisterLink = (slugOrId: string) => {
    const origin = window.location.origin + window.location.pathname;
    const url = `${origin}#/?rt=${slugOrId}#register`;
    navigator.clipboard.writeText(url);
    toast.success('Link Pendaftaran Warga Baru berhasil disalin ke clipboard');
  };

  // Add Broadcast
  const handleCreateBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBroadcastTitle.trim() || !newBroadcastMessage.trim()) {
      toast.error('Mohon isi judul dan pesan siaran');
      return;
    }

    const newBc: SystemBroadcast = {
      id: `bc-${Date.now()}`,
      title: newBroadcastTitle.trim(),
      message: newBroadcastMessage.trim(),
      priority: newBroadcastPriority,
      targetTenantId: newBroadcastTarget,
      createdAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      isActive: true
    };

    setBroadcasts([newBc, ...broadcasts]);
    setNewBroadcastTitle('');
    setNewBroadcastMessage('');
    toast.success('Siaran sistem platform berhasil diterbitkan!');
  };

  const handleToggleBroadcast = (id: string) => {
    setBroadcasts(prev => prev.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b));
  };

  const handleDeleteBroadcast = (id: string) => {
    setBroadcasts(prev => prev.filter(b => b.id !== id));
    toast.success('Siaran telah dihapus');
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
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Root Bar */}
      <header className="sticky top-0 z-30 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
            <Server size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>Teras Warga Control Tower</span>
              </h1>
              <span className="text-[9px] font-mono font-black uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                SUPER ADMIN ROOT
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              Pusat Tata Kelola, Pendaftaran Terpusat & Fleet Multi-Tenant Seluruh RT/RW
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

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Ekspor Direktori Tenant ke CSV"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>

          {/* Navigate to Public Home */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Buka Beranda Publik"
          >
            <span className="hidden sm:inline">Web Publik</span>
            <ExternalLink size={13} />
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 bg-slate-900 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
            title="Keluar dari Akun Super Admin"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Root Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-500/40 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-60"></div>
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
              Terdaftar aktif di platform
            </p>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-60"></div>
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
              Tersebar di seluruh rukun tetangga
            </p>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-60"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Estimasi Kapasitas</span>
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

          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group hover:border-cyan-500/40 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-60"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Status DB Security</span>
              <div className="w-8 h-8 rounded-xl bg-cyan-950/60 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <Database size={16} />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-cyan-400 tracking-tight uppercase flex items-center gap-1.5">
              <span>TERISOLASI</span>
              <ShieldCheck size={18} className="text-cyan-400" />
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Isolasi ketat antar-RT aktif
            </p>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('tenants')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tenants'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Globe size={14} />
              <span>Direktori Tenant</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-mono">
                {availableTenants.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tariffs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tariffs'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 size={14} />
              <span>Matriks Tarif & Kepatuhan</span>
            </button>

            <button
              onClick={() => setActiveTab('broadcast')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'broadcast'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Megaphone size={14} />
              <span>Siaran Platform</span>
              {broadcasts.filter(b => b.isActive).length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck size={14} />
              <span>Keamanan & Root</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Platform Engine: v2.4 Multi-Tenant Standard
          </div>
        </div>

        {/* TAB 1: DIREKTORI TENANT */}
        {activeTab === 'tenants' && (
          <div className="space-y-4">
            {/* Search, Filter & View Controls */}
            <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[220px]">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama RT, kelurahan, ketua RT, slug..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Filter Kelurahan */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs">
                  <Filter size={13} className="text-slate-500" />
                  <span className="text-slate-400 text-[11px] font-bold">Kelurahan:</span>
                  <select
                    value={kelurahanFilter}
                    onChange={(e) => setKelurahanFilter(e.target.value)}
                    className="bg-transparent text-white focus:outline-none text-xs cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900 text-white">Semua Kelurahan</option>
                    {kelurahanOptions.map(k => (
                      <option key={k} value={k} className="bg-slate-900 text-white">{k}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* View Switcher & Counter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">
                  Menampilkan <strong className="text-white">{filteredTenants.length}</strong> RT
                </span>

                <div className="flex items-center p-0.5 bg-slate-950 rounded-xl border border-slate-700/80">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Tampilan Tabel"
                  >
                    <List size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Tampilan Kartu Grid"
                  >
                    <LayoutGrid size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {filteredTenants.length === 0 && (
              <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Search size={20} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Tidak ada RT yang cocok</h3>
                <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                  Coba ubah kata kunci pencarian atau reset filter kelurahan untuk melihat daftar seluruh RT.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setKelurahanFilter('all'); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            )}

            {/* VIEW MODE: TABLE */}
            {viewMode === 'table' && filteredTenants.length > 0 && (
              <div className="bg-slate-900/80 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-mono font-black border-b border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4">Nama Wilayah / Tenant</th>
                        <th className="py-3.5 px-4">RW / Kelurahan</th>
                        <th className="py-3.5 px-4">Ketua RT / Kontak</th>
                        <th className="py-3.5 px-4">Blok Terdaftar</th>
                        <th className="py-3.5 px-4">Tarif Kas</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Aksi Super Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {filteredTenants.map((t) => {
                        const isMain = t.id === 'tondo-rw20-rt02';
                        return (
                          <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-white">
                              <div className="flex items-center gap-2.5">
                                <div 
                                  className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow-sm"
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
                              {t.chairmanPhone ? (
                                <a 
                                  href={`https://wa.me/${t.chairmanPhone.replace(/\D/g, '')}`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-mono mt-0.5"
                                >
                                  <Phone size={10} />
                                  <span>{t.chairmanPhone}</span>
                                </a>
                              ) : (
                                <span className="text-[11px] text-slate-500 font-mono">-</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {(t.blocks || []).map(b => (
                                  <span key={b} className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 border border-slate-700 text-slate-300 rounded">
                                    {b}
                                  </span>
                                ))}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono text-slate-300">
                              Rp {(t.fees?.kasFee || 20000).toLocaleString('id-ID')}
                            </td>

                            <td className="py-3.5 px-4">
                              {isMain ? (
                                <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 bg-indigo-950 border border-indigo-500/40 text-indigo-300 rounded">
                                  Default
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 bg-emerald-950 border border-emerald-500/40 text-emerald-300 rounded">
                                  Aktif
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => setSelectedTenantForDetail(t)}
                                  className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                                  title="Kelola Identitas, Pengurus, & Tarif RT"
                                >
                                  <Edit3 size={12} />
                                  <span>Kelola</span>
                                </button>

                                <button
                                  onClick={() => copyRegisterLink(t.slug || t.id)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-all cursor-pointer"
                                  title="Salin Link Registrasi Warga Baru"
                                >
                                  <Copy size={13} />
                                </button>

                                <button
                                  onClick={() => window.open(`#/?rt=${t.slug || t.id}`, '_blank')}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-all cursor-pointer"
                                  title="Buka Portal Publik RT"
                                >
                                  <ExternalLink size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VIEW MODE: CARDS GRID */}
            {viewMode === 'grid' && filteredTenants.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTenants.map((t) => {
                  const isMain = t.id === 'tondo-rw20-rt02';
                  return (
                    <div 
                      key={t.id} 
                      className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Card Top */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white shrink-0 shadow-md ring-1 ring-white/10"
                              style={{ backgroundColor: t.themeColor || '#4f46e5' }}
                            >
                              {t.rt}
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-white leading-tight">{t.name}</h3>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">RW {t.rw} • Kel. {t.kelurahan}</p>
                            </div>
                          </div>
                          {isMain ? (
                            <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 bg-indigo-950 border border-indigo-500/40 text-indigo-300 rounded shrink-0">
                              Default
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 bg-emerald-950 border border-emerald-500/40 text-emerald-300 rounded shrink-0">
                              Aktif
                            </span>
                          )}
                        </div>

                        {/* Ketua RT & Contact */}
                        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 mb-3 space-y-1">
                          <div className="text-[10px] font-mono font-black uppercase text-slate-500">Ketua RT</div>
                          <div className="text-xs font-bold text-slate-200">{t.chairmanName || 'Belum ditunjuk'}</div>
                          {t.chairmanPhone ? (
                            <a 
                              href={`https://wa.me/${t.chairmanPhone.replace(/\D/g, '')}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                            >
                              <Phone size={10} />
                              <span>{t.chairmanPhone}</span>
                            </a>
                          ) : null}
                        </div>

                        {/* Blocks */}
                        <div className="mb-4">
                          <div className="text-[10px] font-mono font-black uppercase text-slate-500 mb-1.5">
                            Blok Terdaftar ({t.blocks?.length || 0})
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {(t.blocks || []).map(b => (
                              <span key={b} className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md">
                                {b}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedTenantForDetail(t)}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/20"
                        >
                          <Edit3 size={13} />
                          <span>Detail & Kelola</span>
                        </button>

                        <button
                          onClick={() => copyRegisterLink(t.slug || t.id)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-all cursor-pointer"
                          title="Salin Link Pendaftaran Warga"
                        >
                          <Copy size={13} />
                        </button>

                        <button
                          onClick={() => window.open(`#/?rt=${t.slug || t.id}`, '_blank')}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-all cursor-pointer"
                          title="Buka Web Publik RT"
                        >
                          <ExternalLink size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MATRIKS TARIF & KEPATUHAN */}
        {activeTab === 'tariffs' && (
          <div className="space-y-6">
            {/* Tariff Benchmarks Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-mono">
                  <span>RATA-RATA IURAN SAMPAH</span>
                  <Wallet size={14} className="text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono">
                  Rp {platformStats.avgSampah.toLocaleString('id-ID')}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Tarif kategori Umum antar seluruh RT</p>
              </div>

              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-mono">
                  <span>RATA-RATA KAS RT</span>
                  <BarChart3 size={14} className="text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  Rp {platformStats.avgKas.toLocaleString('id-ID')}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Alokasi operasional kas lingkungan</p>
              </div>

              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-mono">
                  <span>RATA-RATA AIR / PDAM</span>
                  <Activity size={14} className="text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-cyan-400 font-mono">
                  Rp {platformStats.avgAir.toLocaleString('id-ID')}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Standar retribusi air bersih swadaya</p>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">Matriks Perbandingan Struktur Tarif Seluruh RT</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Data transparan untuk pengawasan disparitas iuran dan sinkronisasi kebijakan wilayah.
                  </p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={13} />
                  <span>Unduh Matriks CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-mono font-black border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Wilayah RT</th>
                      <th className="py-3 px-4">Sampah Umum</th>
                      <th className="py-3 px-4">Sampah PKH</th>
                      <th className="py-3 px-4">Sampah PNS</th>
                      <th className="py-3 px-4">Kas RT</th>
                      <th className="py-3 px-4">Air PDAM</th>
                      <th className="py-3 px-4">Beban Bulanan (Umum+Kas)</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {availableTenants.map((t) => {
                      const sampah = t.fees?.sampahUmum || 20000;
                      const pkh = t.fees?.sampahPkh || 10000;
                      const pns = t.fees?.sampahPns || 35000;
                      const kas = t.fees?.kasFee || 20000;
                      const air = t.fees?.airFee || 10000;
                      const totalStandard = sampah + kas;

                      return (
                        <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-sans font-bold text-white">
                            <div className="flex items-center gap-2">
                              <span 
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: t.themeColor || '#4f46e5' }}
                              ></span>
                              <span>{t.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">Kel. {t.kelurahan}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-200">
                            Rp {sampah.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 text-emerald-400">
                            Rp {pkh.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 text-purple-400">
                            Rp {pns.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 text-amber-400">
                            Rp {kas.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 text-cyan-400">
                            Rp {air.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-indigo-300">
                            Rp {totalStandard.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-sans">
                            <button
                              onClick={() => setSelectedTenantForDetail(t)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Edit Tarif
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SIARAN SISTEM PLATFORM (BROADCAST) */}
        {activeTab === 'broadcast' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Broadcast Form */}
            <div className="lg:col-span-1 bg-slate-900/80 rounded-3xl p-6 border border-slate-800 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                  <Megaphone size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Buat Siaran Platform</h3>
                  <p className="text-[11px] text-slate-400">Pemberitahuan resmi ke seluruh dashboard RT</p>
                </div>
              </div>

              <form onSubmit={handleCreateBroadcast} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Judul Siaran</label>
                  <input
                    type="text"
                    value={newBroadcastTitle}
                    onChange={(e) => setNewBroadcastTitle(e.target.value)}
                    placeholder="Contoh: Jadwal Maintenance Server..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Tingkat Prioritas</label>
                    <select
                      value={newBroadcastPriority}
                      onChange={(e) => setNewBroadcastPriority(e.target.value as any)}
                      className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="info">Informasi (Biru)</option>
                      <option value="warning">Penting (Kuning)</option>
                      <option value="urgent">Darurat (Merah)</option>
                      <option value="maintenance">Pemeliharaan (Ungu)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Target Tenant</label>
                    <select
                      value={newBroadcastTarget}
                      onChange={(e) => setNewBroadcastTarget(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="all">Semua RT (Global)</option>
                      {availableTenants.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Isi Pesan Siaran</label>
                  <textarea
                    rows={4}
                    value={newBroadcastMessage}
                    onChange={(e) => setNewBroadcastMessage(e.target.value)}
                    placeholder="Tuliskan pesan instruksi atau pengumuman platform..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Radio size={14} />
                  <span>Terbitkan Siaran Sekarang</span>
                </button>
              </form>
            </div>

            {/* Broadcast List & Live Preview */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>Daftar Siaran Aktif & Riwayat</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                    {broadcasts.length}
                  </span>
                </h3>
              </div>

              {broadcasts.length === 0 ? (
                <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-8 text-center text-xs text-slate-400">
                  Belum ada siaran yang diterbitkan.
                </div>
              ) : (
                <div className="space-y-3">
                  {broadcasts.map((bc) => {
                    const isUrgent = bc.priority === 'urgent';
                    const isWarning = bc.priority === 'warning';
                    const isMaint = bc.priority === 'maintenance';

                    const borderClass = isUrgent 
                      ? 'border-rose-500/40 bg-rose-950/20' 
                      : isWarning 
                        ? 'border-amber-500/40 bg-amber-950/20'
                        : isMaint
                          ? 'border-purple-500/40 bg-purple-950/20'
                          : 'border-indigo-500/40 bg-indigo-950/20';

                    const badgeClass = isUrgent
                      ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                      : isWarning
                        ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                        : isMaint
                          ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                          : 'bg-indigo-950 text-indigo-300 border-indigo-500/40';

                    return (
                      <div 
                        key={bc.id}
                        className={`rounded-2xl border p-4 transition-all shadow-sm ${borderClass} ${!bc.isActive ? 'opacity-50 grayscale-[40%]' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded border ${badgeClass}`}>
                              {bc.priority.toUpperCase()}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-white">{bc.title}</h4>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleToggleBroadcast(bc.id)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition-colors cursor-pointer border ${
                                bc.isActive 
                                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
                                  : 'bg-slate-800 border-slate-700 text-slate-400'
                              }`}
                            >
                              {bc.isActive ? 'Aktif' : 'Non-Aktif'}
                            </button>

                            <button
                              onClick={() => handleDeleteBroadcast(bc.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Hapus Siaran"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed mb-3">
                          {bc.message}
                        </p>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
                          <span>Target: {bc.targetTenantId === 'all' ? 'Semua RT (Platform)' : availableTenants.find(t => t.id === bc.targetTenantId)?.name || bc.targetTenantId}</span>
                          <span>Diterbitkan: {bc.createdAt}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: KEAMANAN & ROOT ENGINE */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800">
              <h3 className="text-sm font-black text-white mb-1 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>Daftar Akun Otorisasi Super Admin</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Daftar email yang telah disahkan memiliki kekebalan akses dan hak mutlak dalam fleet multi-tenant:
              </p>
              <div className="space-y-2">
                {SUPER_ADMIN_EMAILS.map((email) => {
                  const isCurrent = auth.currentUser?.email?.toLowerCase() === email.toLowerCase();
                  return (
                    <div key={email} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                        <div>
                          <span className="text-xs font-mono font-bold text-slate-200">{email}</span>
                          <p className="text-[10px] text-slate-500 font-sans mt-0.5">Level Akses: PLATFORM_ROOT_OPERATOR</p>
                        </div>
                      </div>
                      {isCurrent ? (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-400 font-mono">
                          Sesi Anda
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          Terverifikasi
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 p-3.5 bg-indigo-950/30 border border-indigo-500/20 rounded-2xl">
                <div className="flex items-start gap-2">
                  <Info size={15} className="text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Untuk menambahkan akun Super Admin baru, tambahkan email pada konstanta <code className="text-indigo-300 font-mono">SUPER_ADMIN_EMAILS</code> di konfigurasi sistem platform.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-white mb-1 flex items-center gap-2">
                  <Database size={16} className="text-indigo-400" />
                  <span>Audit Isolasi & Integritas Multi-Tenant</span>
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Pemeriksaan berkala standar pengamanan arsitektur data Teras Warga:
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-sans">Isolasi Prefix Database</strong>
                      <span className="text-slate-400 text-[11px]">
                        Semua koleksi warga, transaksi kas, dan aduan disimpan dengan prefix tenant unik terisolasi.
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-sans">Pemisahan Dashboard Admin RT</strong>
                      <span className="text-slate-400 text-[11px]">
                        Admin RT 02 atau RT lainnya tidak memiliki navigasi maupun hak pendaftaran RT baru.
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-sans">Perlindungan Tenant Utama</strong>
                      <span className="text-slate-400 text-[11px]">
                        Tenant acuan (<code className="text-indigo-300 font-mono">tondo-rw20-rt02</code>) dilindungi dari operasi penghapusan atau mutasi ilegal.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Security Engine Status:</span>
                <span className="text-emerald-400 font-bold">100% HEALTHY</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Centralized Onboarding Registration Modal */}
      <TenantRegistrationModal
        isOpen={showOnboardModal}
        onClose={() => setShowOnboardModal(false)}
        onSuccess={(created) => {
          toast.success(`Tenant ${created.name} Berhasil Didaftarkan oleh Super Admin!`);
        }}
      />

      {/* Tenant Detail, Edit & Manage Modal */}
      <TenantDetailModal
        tenant={selectedTenantForDetail}
        isOpen={!!selectedTenantForDetail}
        onClose={() => setSelectedTenantForDetail(null)}
        onUpdate={(updated) => {
          setSelectedTenantForDetail(updated);
        }}
        onDelete={(tenantId) => {
          setSelectedTenantForDetail(null);
        }}
      />
    </div>
  );
};
