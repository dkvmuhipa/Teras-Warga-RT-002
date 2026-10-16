import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, ShieldCheck, Key, Lock, Unlock, Users, Home, TrendingUp, 
  Filter, Search, Plus, ExternalLink, ArrowRight, ArrowLeft, RefreshCw, 
  LogOut, CheckCircle2, AlertCircle, Phone, MessageSquare, Sparkles, 
  Layers, Wallet, BarChart3, Settings, Shield, ChevronRight,
  Server, Globe, Database, Activity, Check, HelpCircle, Download,
  Radio, Megaphone, FileText, Bell, LayoutGrid, List, Copy,
  Edit3, Trash2, Sliders, CheckSquare, Eye, Share2, Info,
  AlertTriangle, Droplets, Package, Camera, AlertOctagon,
  History, UserPlus, HardDrive, Terminal, CheckCheck, ToggleLeft, ToggleRight, X,
  UploadCloud
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Tenant, Role, TenantStatus, TenantModules } from '../../types';
import { TenantRegistrationModal } from '../TenantRegistrationModal';
import { TenantDetailModal } from './TenantDetailModal';
import { RestoreSnapshotModal } from './RestoreSnapshotModal';
import { OfficialsDirectoryTab } from './OfficialsDirectoryTab';
import { HelpdeskSupportTab } from './HelpdeskSupportTab';
import { CivicAnalyticsTab } from './CivicAnalyticsTab';
import { GlobalTemplatesTab } from './GlobalTemplatesTab';
import { PaymentGatewayTab } from './PaymentGatewayTab';
import { SystemTelemetryTab } from './SystemTelemetryTab';
import { SUPER_ADMIN_EMAILS } from '../../constants';
import { auth } from '../../services/firebaseConfig';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface SuperAdminPortalProps {
  role?: Role | null;
}

export interface SystemBroadcast {
  id: string;
  title: string;
  message: string;
  priority: 'info' | 'warning' | 'urgent' | 'maintenance';
  targetTenantId: 'all' | string;
  createdAt: string;
  isActive: boolean;
}

export interface PlatformAuditEvent {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  targetTenantId?: string;
  targetTenantName?: string;
  details: string;
  category: 'lifecycle' | 'module' | 'tariff' | 'broadcast' | 'security' | 'export';
}

const BROADCAST_STORAGE_KEY = 'teras_system_broadcasts';
const AUDIT_STORAGE_KEY = 'teras_system_audit_trail';

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  role
}) => {
  const navigate = useNavigate();
  const { 
    currentTenant, 
    availableTenants, 
    switchTenant, 
    isSuperAdmin, 
    deleteTenant,
    updateTenant,
    startSupervision,
    isSupervising,
    stopSupervision
  } = useTenant();

  // Primary Tab State (12 Tools across 4 Civic Operation Groups)
  const [activeTab, setActiveTab] = useState<
    'tenants' | 'officials' | 'modules' | 'support' | 'templates' | 
    'tariffs' | 'gateway' | 'analytics' | 'broadcast' | 'telemetry' | 
    'audit' | 'security'
  >('tenants');

  // Modal States
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedTenantForDetail, setSelectedTenantForDetail] = useState<Tenant | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [kelurahanFilter, setKelurahanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'maintenance'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Audit Log Category Filter
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<string>('all');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');

  // Broadcast State
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

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<PlatformAuditEvent[]>(() => {
    try {
      const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse audit logs:', e);
    }
    return [
      {
        id: 'audit-init-1',
        timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        action: 'Inisialisasi Control Tower',
        actor: 'system@teraswarga.id',
        targetTenantId: 'all',
        targetTenantName: 'Platform Global',
        details: 'Sistem tata kelola multi-tenant dan engine isolasi diaktifkan',
        category: 'security'
      },
      {
        id: 'audit-init-2',
        timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        action: 'Verifikasi Wilayah Acuan',
        actor: 'root@teraswarga.id',
        targetTenantId: 'tondo-rw20-rt02',
        targetTenantName: 'RT 002 / RW 020 Huntap Tondo 2',
        details: 'Konfigurasi RT percontohan terverifikasi aman dan terlindungi',
        category: 'lifecycle'
      }
    ];
  });

  // Save broadcasts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(BROADCAST_STORAGE_KEY, JSON.stringify(broadcasts));
    } catch (e) {
      console.error('Failed to store broadcasts:', e);
    }
  }, [broadcasts]);

  // Save audit logs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(auditLogs));
    } catch (e) {
      console.error('Failed to store audit logs:', e);
    }
  }, [auditLogs]);

  // Helper to log audit events
  const logAuditEvent = (
    action: string, 
    category: PlatformAuditEvent['category'], 
    targetTenantId?: string, 
    details?: string
  ) => {
    const target = availableTenants.find(t => t.id === targetTenantId);
    const newEvent: PlatformAuditEvent = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      action,
      actor: auth.currentUser?.email || 'Super Admin Root',
      targetTenantId,
      targetTenantName: target?.name || (targetTenantId === 'all' ? 'Seluruh Tenant Platform' : targetTenantId),
      details: details || '',
      category
    };
    setAuditLogs(prev => [newEvent, ...prev.slice(0, 99)]);
  };

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

      const currentStatus = t.status || 'active';
      const matchStatus = statusFilter === 'all' || currentStatus === statusFilter;

      return matchSearch && matchKelurahan && matchStatus;
    });
  }, [availableTenants, searchQuery, kelurahanFilter, statusFilter]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchCategory = auditCategoryFilter === 'all' || log.category === auditCategoryFilter;
      const matchSearch = !auditSearchQuery || 
        log.action.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
        log.actor.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
        (log.targetTenantName && log.targetTenantName.toLowerCase().includes(auditSearchQuery.toLowerCase())) ||
        log.details.toLowerCase().includes(auditSearchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [auditLogs, auditCategoryFilter, auditSearchQuery]);

  // Global Telemetry Stats
  const platformStats = useMemo(() => {
    const totalTenants = availableTenants.length;
    let totalBlocks = 0;
    let totalEstimatedDoors = 0;
    let activeTenantsCount = 0;
    let suspendedCount = 0;
    let maintenanceCount = 0;

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

      if (t.status === 'suspended') {
        suspendedCount++;
      } else if (t.status === 'maintenance') {
        maintenanceCount++;
      } else {
        activeTenantsCount++;
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
      activeTenantsCount,
      suspendedCount,
      maintenanceCount,
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
      logAuditEvent('Keluar Sesi Super Admin', 'security', 'all', 'Akun Super Admin berhasil keluar');
      await signOut(auth);
      toast.success('Berhasil keluar dari sesi Super Admin');
      navigate('/');
    } catch (e) {
      toast.error('Gagal keluar sesi');
    }
  };

  // Helper to extract active modules
  const getActiveModulesList = (t: Tenant) => {
    const m = t.modules;
    const list: { key: keyof TenantModules; label: string; icon: any }[] = [];
    if (!m || m.waterMeter !== false) list.push({ key: 'waterMeter', label: 'Air PDAM', icon: Droplets });
    if (!m || m.assetRental !== false) list.push({ key: 'assetRental', label: 'Sewa Aset', icon: Package });
    if (!m || m.letters !== false) list.push({ key: 'letters', label: 'Surat', icon: FileText });
    if (!m || m.panicButton !== false) list.push({ key: 'panicButton', label: 'Panik', icon: AlertOctagon });
    if (!m || m.stbmSanitation !== false) list.push({ key: 'stbmSanitation', label: 'STBM', icon: Activity });
    if (!m || m.cctv !== false) list.push({ key: 'cctv', label: 'CCTV', icon: Camera });
    return list;
  };

  // Export tenants directory as CSV
  const handleExportCSV = () => {
    try {
      const headers = ['ID Tenant', 'Nama RT', 'RT', 'RW', 'Kelurahan', 'Kecamatan', 'Kota', 'Status', 'Alamat', 'Ketua RT', 'No Telp', 'Blok Terdaftar', 'Modul Aktif', 'Tarif Sampah', 'Kas RT', 'Air PDAM'];
      const rows = availableTenants.map(t => {
        const modules = getActiveModulesList(t).map(m => m.label).join('; ');
        return [
          `"${t.id}"`,
          `"${t.name}"`,
          `"${t.rt}"`,
          `"${t.rw}"`,
          `"${t.kelurahan}"`,
          `"${t.kecamatan}"`,
          `"${t.city}"`,
          `"${t.status || 'active'}"`,
          `"${(t.address || '').replace(/"/g, '""')}"`,
          `"${t.chairmanName || '-'}"`,
          `"${t.chairmanPhone || '-'}"`,
          `"${(t.blocks || []).join('; ')}"`,
          `"${modules}"`,
          t.fees?.sampahUmum || 20000,
          t.fees?.kasFee || 20000,
          t.fees?.airFee || 10000
        ];
      });

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `teras-warga-tenants-directory-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      logAuditEvent('Ekspor Direktori CSV', 'export', 'all', 'Mengunduh rekapitulasi data tenant ke format spreadsheet CSV');
      toast.success('Direktori tenant berhasil diekspor ke CSV!');
    } catch (e) {
      toast.error('Gagal mengekspor data');
    }
  };

  // Export Full Platform JSON Snapshot (Disaster Recovery)
  const handleExportPlatformSnapshot = () => {
    try {
      const snapshot = {
        manifest: {
          platform: 'Teras Warga Multi-Tenant Fleet Command',
          engineVersion: 'v2.4.0',
          exportedAt: new Date().toISOString(),
          exportedBy: auth.currentUser?.email || 'Super Admin Root',
          totalTenants: availableTenants.length,
        },
        tenants: availableTenants,
        broadcasts,
        auditLogs
      };

      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `teras-warga-fleet-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logAuditEvent('Ekspor Snapshot Platform JSON', 'export', 'all', 'Mencadangkan seluruh konfigurasi armada RT dan jejak audit');
      toast.success('Snapshot platform berhasil diunduh (JSON)!');
    } catch (e) {
      toast.error('Gagal membuat snapshot platform');
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

  // Trigger Supervision Mode
  const handleStartSupervision = (t: Tenant) => {
    startSupervision(t);
    logAuditEvent('Masuk Mode Supervisi', 'security', t.id, `Membuka sesi investigasi teknis read-only pada wilayah ${t.name}`);
    toast.success(`Memulai mode supervisi untuk ${t.name}`, {
      description: 'Anda masuk dalam mode read-only pengawasan teknis.'
    });
    navigate('/admin');
  };

  // Quick Toggle Module for a Tenant (Pillar 2: Feature Flags)
  const handleQuickToggleModule = async (tenantId: string, moduleKey: keyof TenantModules) => {
    const target = availableTenants.find(t => t.id === tenantId);
    if (!target) return;
    const currentVal = target.modules?.[moduleKey] ?? true;
    const nextVal = !currentVal;

    const updatedModules: TenantModules = {
      ...(target.modules || {}),
      [moduleKey]: nextVal
    };

    try {
      if (updateTenant) {
        await updateTenant(tenantId, { modules: updatedModules });
        logAuditEvent(
          `${nextVal ? 'Mengaktifkan' : 'Menonaktifkan'} Modul ${String(moduleKey)}`,
          'module',
          tenantId,
          `Modul ${String(moduleKey)} diubah menjadi ${nextVal ? 'Aktif' : 'Non-Aktif'}`
        );
        toast.success(`${target.name}: Modul ${String(moduleKey)} diubah (${nextVal ? 'Aktif' : 'Non-Aktif'})`);
      }
    } catch (err) {
      toast.error('Gagal memperbarui status modul');
    }
  };

  // Quick Change Tenant Lifecycle Status (Pillar 1: Lifecycle State Machine)
  const handleQuickChangeStatus = async (tenantId: string, newStatus: TenantStatus) => {
    const target = availableTenants.find(t => t.id === tenantId);
    if (!target) return;

    if (target.id === 'tondo-rw20-rt02' && newStatus === 'suspended') {
      toast.error('Wilayah Acuan RT 002 dilindungi dan tidak dapat ditangguhkan');
      return;
    }

    try {
      if (updateTenant) {
        await updateTenant(tenantId, { status: newStatus });
        logAuditEvent(
          `Ubah Status Tenant ke ${newStatus.toUpperCase()}`,
          'lifecycle',
          tenantId,
          `Status operasional wilayah diubah dari ${target.status || 'active'} ke ${newStatus}`
        );
        toast.success(`Status ${target.name} berhasil diubah ke ${newStatus.toUpperCase()}`);
      }
    } catch (err) {
      toast.error('Gagal memperbarui status tenant');
    }
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
    logAuditEvent(
      'Menerbitkan Siaran Platform',
      'broadcast',
      newBroadcastTarget,
      `Judul: "${newBc.title}" (Prioritas: ${newBc.priority.toUpperCase()})`
    );
    toast.success('Siaran sistem platform berhasil diterbitkan!');
  };

  const handleToggleBroadcast = (id: string) => {
    const target = broadcasts.find(b => b.id === id);
    if (!target) return;
    const nextActive = !target.isActive;
    setBroadcasts(prev => prev.map(b => b.id === id ? { ...b, isActive: nextActive } : b));
    logAuditEvent(
      `${nextActive ? 'Mengaktifkan' : 'Menonaktifkan'} Siaran`,
      'broadcast',
      target.targetTenantId,
      `Siaran "${target.title}" disetel ${nextActive ? 'Aktif' : 'Non-Aktif'}`
    );
  };

  const handleDeleteBroadcast = (id: string) => {
    const target = broadcasts.find(b => b.id === id);
    setBroadcasts(prev => prev.filter(b => b.id !== id));
    logAuditEvent('Menghapus Siaran', 'broadcast', target?.targetTenantId, `Siaran "${target?.title}" dihapus`);
    toast.success('Siaran telah dihapus');
  };

  // 1. NON-SUPERADMIN RESTRICTION SCREEN (CLEAN LIGHT)
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col items-center justify-center p-6 text-center font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-mono uppercase font-black mb-3">
            Otorisasi Terbatas
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
            Khusus Super Admin Platform
          </h2>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Portal kendali armada dan pendaftaran terpusat ini hanya dapat diakses oleh akun Super Admin platform ({SUPER_ADMIN_EMAILS.join(', ')}). 
            Akun pengurus RT reguler hanya memiliki wewenang pada dashboard wilayah masing-masing.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-600/20 cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>Kembali ke Beranda</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Navigation Tabs Configuration (12 Tools across 4 Civic Operation Groups)
  type SuperAdminTabId = 
    | 'tenants' | 'officials' | 'modules' | 'support' | 'templates' 
    | 'tariffs' | 'gateway' | 'analytics' | 'broadcast' | 'telemetry' 
    | 'audit' | 'security';

  interface NavTabItem {
    id: SuperAdminTabId;
    label: string;
    icon: React.ElementType;
    count?: number;
    badge?: string;
  }

  interface NavTabGroup {
    category: string;
    description: string;
    tabs: NavTabItem[];
  }

  const tabGroups: NavTabGroup[] = [
    {
      category: 'Armada & Pengurus',
      description: 'Tata kelola wilayah dan kontak aparatur RT',
      tabs: [
        { id: 'tenants', label: 'Direktori Armada RT', icon: Globe, count: availableTenants.length },
        { id: 'officials', label: 'Pengurus & Kontak WA', icon: Users },
        { id: 'modules', label: 'Matriks Modul & Sakelar', icon: Sliders, badge: 'Matrix' },
      ]
    },
    {
      category: 'Layanan & Birokrasi',
      description: 'Dukungan teknis dan standardisasi persuratan',
      tabs: [
        { id: 'support', label: 'Tiket Bantuan RT', icon: HelpCircle, badge: 'Helpdesk' },
        { id: 'templates', label: 'Template Surat Standar', icon: FileText },
        { id: 'broadcast', label: 'Siaran Platform', icon: Megaphone, count: broadcasts.filter(b => b.isActive).length },
      ]
    },
    {
      category: 'Finansial & Wawasan',
      description: 'Tolok ukur fiskal dan agregasi analitik',
      tabs: [
        { id: 'tariffs', label: 'Matriks Tarif & Kas', icon: BarChart3 },
        { id: 'gateway', label: 'Monitoring QRIS', icon: Wallet },
        { id: 'analytics', label: 'Civic Analytics', icon: TrendingUp },
      ]
    },
    {
      category: 'Sistem & Keandalan',
      description: 'Telemetri cloud, audit, dan snapshot pemulihan',
      tabs: [
        { id: 'telemetry', label: 'Telemetri & Cloud', icon: Activity },
        { id: 'audit', label: 'Jejak Audit Platform', icon: History, count: auditLogs.length },
        { id: 'security', label: 'Keamanan & Snapshot', icon: ShieldCheck }
      ]
    }
  ];

  const allTabs: NavTabItem[] = tabGroups.flatMap(g => g.tabs);

  const handleRestoreSuccess = (snapshot: any) => {
    try {
      if (Array.isArray(snapshot.tenants) && snapshot.tenants.length > 0) {
        snapshot.tenants.forEach((t: Tenant) => {
          if (updateTenant) updateTenant(t.id, t);
        });
      }
      if (Array.isArray(snapshot.broadcasts) && snapshot.broadcasts.length > 0) {
        setBroadcasts(snapshot.broadcasts);
      }
      if (Array.isArray(snapshot.auditTrail) && snapshot.auditTrail.length > 0) {
        setAuditLogs(snapshot.auditTrail);
      }
      logAuditEvent(
        'Pemulihan Disaster Recovery (Snapshot)',
        'export',
        'all',
        `Memulihkan konfigurasi armada dari berkas cadangan (${snapshot.totalTenants || snapshot.tenants?.length || 0} RT)`
      );
      toast.success('Snapshot armada sukses dipulihkan ke platform!');
    } catch (e: any) {
      toast.error('Gagal menerapkan snapshot: ' + e.message);
    }
  };

  // 2. SUPER ADMIN FLEET CONTROL DASHBOARD (CLEAN LIGHT THEME)
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Root Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Server size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Teras Warga Control Tower
              </h1>
              <span className="text-[10px] font-mono font-bold uppercase text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                SUPER ADMIN ROOT
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500">
              Pusat Tata Kelola, Pendaftaran Terpusat & Fleet Multi-Tenant Seluruh RT/RW
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Action: Add New Tenant */}
          <button
            onClick={() => setShowOnboardModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-600/30 cursor-pointer"
          >
            <Plus size={14} />
            <span>Daftarkan RT Baru</span>
          </button>

          {/* Snapshot JSON Backup */}
          <button
            onClick={handleExportPlatformSnapshot}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Cadangkan Snapshot Platform (JSON)"
          >
            <HardDrive size={13} className="text-indigo-600" />
            <span className="hidden sm:inline">Snapshot JSON</span>
          </button>

          {/* Restore JSON Backup */}
          <button
            onClick={() => setShowRestoreModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Pulihkan Snapshot Armada (Restore JSON)"
          >
            <UploadCloud size={13} className="text-rose-600" />
            <span className="hidden sm:inline">Pulihkan JSON</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Ekspor Direktori Tenant ke CSV"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>

          {/* Quick Switch to Supervision Mode */}
          <div className="hidden lg:flex items-center gap-1 bg-amber-50/80 border border-amber-200 px-2 py-1 rounded-xl text-xs">
            <Eye size={12} className="text-amber-700" />
            <span className="text-[10px] font-bold text-amber-800">Supervisi:</span>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  const target = availableTenants.find(t => t.id === e.target.value);
                  if (target) handleStartSupervision(target);
                }
              }}
              className="bg-transparent text-amber-900 font-bold text-xs focus:outline-none cursor-pointer max-w-[130px] truncate"
            >
              <option value="">Pilih RT...</option>
              {availableTenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Navigate to Public Home */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Buka Beranda Publik"
          >
            <span className="hidden sm:inline">Web Publik</span>
            <ExternalLink size={13} />
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 rounded-xl transition-colors cursor-pointer shadow-2xs"
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Total Armada RT</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <Globe size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              {platformStats.totalTenants} <span className="text-xs font-bold text-slate-500 font-sans">Tenant</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] font-medium text-slate-500">
              <span className="text-emerald-600 font-bold">{platformStats.activeTenantsCount} Aktif</span>
              {platformStats.maintenanceCount > 0 && (
                <span className="text-amber-600 font-bold">• {platformStats.maintenanceCount} Maint.</span>
              )}
              {platformStats.suspendedCount > 0 && (
                <span className="text-rose-600 font-bold">• {platformStats.suspendedCount} Susp.</span>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Total Blok Kavling</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Layers size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight font-mono">
              {platformStats.totalBlocks} <span className="text-xs font-bold text-slate-500 font-sans">Blok</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Tersebar di {kelurahanOptions.length || 1} Kelurahan Kota Palu
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Estimasi Kapasitas</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Home size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight font-mono">
              ~{platformStats.totalEstimatedDoors} <span className="text-xs font-bold text-slate-500 font-sans">Kavling</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Kapasitas pintu hunian warga aktif
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-blue-500"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Status DB Security</span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                <Database size={16} />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-sky-700 tracking-tight uppercase flex items-center gap-1.5">
              <span>TERISOLASI</span>
              <ShieldCheck size={18} className="text-sky-600" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Isolasi data antar-RT 100% aman
            </p>
          </div>
        </div>

        {/* Civic Command Sub-Navigation: 4 Operation Clusters (12 Tools) */}
        <div className="space-y-3 border-b border-slate-200 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 font-mono">
                Konsol Operasional Root Super Admin
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                12 Modul Kendali
              </span>
            </div>
            <div className="text-xs text-slate-500 font-mono hidden sm:block">
              Platform Engine: v2.4 Multi-Tenant Fleet Standard
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {tabGroups.map((group) => (
              <div 
                key={group.category}
                className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5"
              >
                <div className="px-2 py-0.5 flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                    {group.category}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {group.tabs.length} tools
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {group.tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/20'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                          <span className="truncate">{tab.label}</span>
                        </div>
                        {tab.count !== undefined && (
                          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                            isActive ? 'bg-indigo-700/80 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {tab.count}
                          </span>
                        )}
                        {tab.badge && (
                          <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-mono font-bold uppercase ${
                            isActive ? 'bg-white text-indigo-700' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TAB 1: DIREKTORI TENANT */}
        {activeTab === 'tenants' && (
          <div className="space-y-4">
            {/* Search, Filter & View Controls */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama RT, kelurahan, ketua RT, slug..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Filter Kelurahan */}
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                  <Filter size={13} className="text-slate-400" />
                  <span className="text-slate-500 text-[11px] font-bold">Kelurahan:</span>
                  <select
                    value={kelurahanFilter}
                    onChange={(e) => setKelurahanFilter(e.target.value)}
                    className="bg-transparent text-slate-800 focus:outline-none text-xs cursor-pointer font-medium"
                  >
                    <option value="all">Semua Kelurahan</option>
                    {kelurahanOptions.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                {/* Filter Status (Lifecycle) */}
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-500 text-[11px] font-bold">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-transparent text-slate-800 focus:outline-none text-xs cursor-pointer font-medium"
                  >
                    <option value="all">Semua Status</option>
                    <option value="active">✓ Aktif</option>
                    <option value="maintenance">⚠️ Pemeliharaan</option>
                    <option value="suspended">⛔ Ditangguhkan</option>
                  </select>
                </div>
              </div>

              {/* View Switcher & Counter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono">
                  Menampilkan <strong className="text-slate-800">{filteredTenants.length}</strong> RT
                </span>

                <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      viewMode === 'table' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Tampilan Tabel"
                  >
                    <List size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
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
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
                  <Search size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">Tidak ada RT yang cocok</h3>
                <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                  Coba ubah kata kunci pencarian atau reset filter kelurahan dan status untuk melihat daftar seluruh RT.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setKelurahanFilter('all'); setStatusFilter('all'); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Reset Filter
                </button>
              </div>
            )}

            {/* VIEW MODE: TABLE */}
            {viewMode === 'table' && filteredTenants.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-mono font-black border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Nama Wilayah / Tenant</th>
                        <th className="py-3.5 px-4">RW / Kelurahan</th>
                        <th className="py-3.5 px-4">Ketua RT / Kontak</th>
                        <th className="py-3.5 px-4">Modul Layanan</th>
                        <th className="py-3.5 px-4">Status Siklus Hidup</th>
                        <th className="py-3.5 px-4 text-right">Aksi Super Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredTenants.map((t) => {
                        const isMain = t.id === 'tondo-rw20-rt02';
                        const activeModules = getActiveModulesList(t);
                        const status = t.status || 'active';

                        return (
                          <tr key={t.id} className="hover:bg-indigo-50/20 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              <div className="flex items-center gap-2.5">
                                <div 
                                  className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow-xs"
                                  style={{ backgroundColor: t.themeColor || '#4f46e5' }}
                                >
                                  {t.rt}
                                </div>
                                <div>
                                  <p className="text-slate-900 font-bold leading-tight">{t.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{t.id}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-slate-600">
                              RW {t.rw} • Kel. {t.kelurahan}
                            </td>

                            <td className="py-3.5 px-4">
                              <p className="text-slate-800 font-bold leading-tight">{t.chairmanName || 'Belum ditunjuk'}</p>
                              {t.chairmanPhone ? (
                                <a 
                                  href={`https://wa.me/${t.chairmanPhone.replace(/\D/g, '')}`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 font-mono mt-0.5 font-bold"
                                >
                                  <Phone size={10} />
                                  <span>{t.chairmanPhone}</span>
                                </a>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-mono">-</span>
                              )}
                            </td>

                            {/* Active Modules Chips */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap items-center gap-1 max-w-xs">
                                <button
                                  onClick={() => setActiveTab('modules')}
                                  className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded font-bold cursor-pointer transition-colors"
                                  title="Buka Matriks Sakelar Modul"
                                >
                                  {activeModules.length}/6 Modul
                                </button>
                                {activeModules.slice(0, 3).map(m => (
                                  <span key={m.key} className="text-[10px] font-mono px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded">
                                    {m.label}
                                  </span>
                                ))}
                                {activeModules.length > 3 && (
                                  <span className="text-[10px] font-mono text-slate-400">
                                    +{activeModules.length - 3}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Lifecycle Status Dropdown Pill */}
                            <td className="py-3.5 px-4">
                              <select
                                value={status}
                                onChange={(e) => handleQuickChangeStatus(t.id, e.target.value as TenantStatus)}
                                className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none transition-all ${
                                  status === 'suspended'
                                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                                    : status === 'maintenance'
                                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                                      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                }`}
                              >
                                <option value="active">✓ AKTIF</option>
                                <option value="maintenance">⚠️ PEMELIHARAAN</option>
                                <option value="suspended">⛔ DITANGGUHKAN</option>
                              </select>
                            </td>

                            {/* Actions: Supervisi, Kelola, Links */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                {/* Button Supervisi */}
                                <button
                                  onClick={() => handleStartSupervision(t)}
                                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white border border-amber-200 hover:border-amber-600 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                  title="Inspeksi Dashboard RT ini dalam Mode Supervisi (Read-Only)"
                                >
                                  <Eye size={12} />
                                  <span>Supervisi</span>
                                </button>

                                {/* Button Kelola */}
                                <button
                                  onClick={() => setSelectedTenantForDetail(t)}
                                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 hover:border-indigo-600 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                                  title="Kelola Identitas, Pengurus, Tarif, & Modul RT"
                                >
                                  <Edit3 size={12} />
                                  <span>Kelola</span>
                                </button>

                                <button
                                  onClick={() => copyRegisterLink(t.slug || t.id)}
                                  className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
                                  title="Salin Link Registrasi Warga Baru"
                                >
                                  <UserPlus size={13} />
                                </button>

                                <button
                                  onClick={() => window.open(`#/?rt=${t.slug || t.id}`, '_blank')}
                                  className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
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
                  const activeModules = getActiveModulesList(t);
                  const status = t.status || 'active';

                  return (
                    <div 
                      key={t.id} 
                      className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Card Top */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white shrink-0 shadow-xs"
                              style={{ backgroundColor: t.themeColor || '#4f46e5' }}
                            >
                              {t.rt}
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-slate-900 leading-tight">{t.name}</h3>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">RW {t.rw} • Kel. {t.kelurahan}</p>
                            </div>
                          </div>
                          
                          <select
                            value={status}
                            onChange={(e) => handleQuickChangeStatus(t.id, e.target.value as TenantStatus)}
                            className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border cursor-pointer focus:outline-none ${
                              status === 'suspended'
                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                : status === 'maintenance'
                                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            }`}
                          >
                            <option value="active">✓ AKTIF</option>
                            <option value="maintenance">⚠️ MAINT</option>
                            <option value="suspended">⛔ SUSPEND</option>
                          </select>
                        </div>

                        {/* Ketua RT & Contact */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 mb-3 space-y-1">
                          <div className="text-[10px] font-mono font-black uppercase text-slate-400">Ketua RT</div>
                          <div className="text-xs font-bold text-slate-800">{t.chairmanName || 'Belum ditunjuk'}</div>
                          {t.chairmanPhone ? (
                            <a 
                              href={`https://wa.me/${t.chairmanPhone.replace(/\D/g, '')}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-[11px] font-mono text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                            >
                              <Phone size={10} />
                              <span>{t.chairmanPhone}</span>
                            </a>
                          ) : null}
                        </div>

                        {/* Modules Active Chips */}
                        <div className="mb-4">
                          <div className="text-[10px] font-mono font-black uppercase text-slate-400 mb-1.5 flex items-center justify-between">
                            <span>Modul Fitur Aktif</span>
                            <span className="text-indigo-600 font-bold">{activeModules.length}/6</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {activeModules.map(m => (
                              <span key={m.key} className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md">
                                {m.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleStartSupervision(t)}
                          className="px-3 py-2 bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white border border-amber-200 hover:border-amber-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Mode Supervisi Read-Only"
                        >
                          <Eye size={13} />
                          <span>Supervisi</span>
                        </button>

                        <button
                          onClick={() => setSelectedTenantForDetail(t)}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shadow-indigo-600/20"
                        >
                          <Edit3 size={13} />
                          <span>Detail & Kelola</span>
                        </button>

                        <button
                          onClick={() => copyRegisterLink(t.slug || t.id)}
                          className="p-2 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
                          title="Salin Link Pendaftaran Warga"
                        >
                          <UserPlus size={13} />
                        </button>

                        <button
                          onClick={() => window.open(`#/?rt=${t.slug || t.id}`, '_blank')}
                          className="p-2 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
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

        {/* TAB 2: MATRIKS MODUL & SAKELAR FITUR (FEATURE FLAGS MATRIX) */}
        {activeTab === 'modules' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Sliders size={16} className="text-indigo-600" />
                  <span>Matriks Feature Flags & Sakelar Modul per RT</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Super Admin dapat mengaktifkan atau mematikan modul layanan secara granular untuk tiap RT. Modul yang dinonaktifkan otomatis disembunyikan dari sidebar dashboard RT dan portal warga terkait.
                </p>
              </div>

              <div className="text-xs font-mono bg-indigo-50 border border-indigo-200 text-indigo-800 px-3 py-1.5 rounded-xl font-bold self-start md:self-auto">
                ⚡ Realtime Auto-Save Engine
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-mono font-black border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4 min-w-[200px]">Wilayah RT</th>
                      <th className="py-3.5 px-3 text-center">Meter Air PDAM</th>
                      <th className="py-3.5 px-3 text-center">Peminjaman Aset</th>
                      <th className="py-3.5 px-3 text-center">Surat Digital</th>
                      <th className="py-3.5 px-3 text-center">Tombol Panik</th>
                      <th className="py-3.5 px-3 text-center">Sanitasi STBM</th>
                      <th className="py-3.5 px-3 text-center">CCTV Pantau</th>
                      <th className="py-3.5 px-4 text-center">Total Aktif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {availableTenants.map((t) => {
                      const m = t.modules || {};
                      const water = m.waterMeter !== false;
                      const rental = m.assetRental !== false;
                      const letters = m.letters !== false;
                      const panic = m.panicButton !== false;
                      const stbm = m.stbmSanitation !== false;
                      const cctv = m.cctv !== false;

                      const totalActive = [water, rental, letters, panic, stbm, cctv].filter(Boolean).length;

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span 
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: t.themeColor || '#4f46e5' }}
                              ></span>
                              <div>
                                <p className="font-bold">{t.name}</p>
                                <span className="text-[10px] text-slate-400 font-mono">Kel. {t.kelurahan}</span>
                              </div>
                            </div>
                          </td>

                          {/* Water Meter */}
                          <td className="py-3.5 px-3 text-center">
                            <button
                              onClick={() => handleQuickToggleModule(t.id, 'waterMeter')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                                water 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {water ? '✓ Aktif' : '○ Non-Aktif'}
                            </button>
                          </td>

                          {/* Asset Rental */}
                          <td className="py-3.5 px-3 text-center">
                            <button
                              onClick={() => handleQuickToggleModule(t.id, 'assetRental')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                                rental 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {rental ? '✓ Aktif' : '○ Non-Aktif'}
                            </button>
                          </td>

                          {/* Letters */}
                          <td className="py-3.5 px-3 text-center">
                            <button
                              onClick={() => handleQuickToggleModule(t.id, 'letters')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                                letters 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {letters ? '✓ Aktif' : '○ Non-Aktif'}
                            </button>
                          </td>

                          {/* Panic Button */}
                          <td className="py-3.5 px-3 text-center">
                            <button
                              onClick={() => handleQuickToggleModule(t.id, 'panicButton')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                                panic 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {panic ? '✓ Aktif' : '○ Non-Aktif'}
                            </button>
                          </td>

                          {/* STBM Sanitation */}
                          <td className="py-3.5 px-3 text-center">
                            <button
                              onClick={() => handleQuickToggleModule(t.id, 'stbmSanitation')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                                stbm 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {stbm ? '✓ Aktif' : '○ Non-Aktif'}
                            </button>
                          </td>

                          {/* CCTV */}
                          <td className="py-3.5 px-3 text-center">
                            <button
                              onClick={() => handleQuickToggleModule(t.id, 'cctv')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                                cctv 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {cctv ? '✓ Aktif' : '○ Non-Aktif'}
                            </button>
                          </td>

                          {/* Summary */}
                          <td className="py-3.5 px-4 text-center font-mono font-bold">
                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px]">
                              {totalActive}/6 Modul
                            </span>
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

        {/* TAB 3: MATRIKS TARIF & FINANSIAL */}
        {activeTab === 'tariffs' && (
          <div className="space-y-6">
            {/* Tariff Benchmarks Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-mono">
                  <span>RATA-RATA IURAN SAMPAH</span>
                  <Wallet size={14} className="text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  Rp {platformStats.avgSampah.toLocaleString('id-ID')}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Tarif kategori Umum antar seluruh RT</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-mono">
                  <span>RATA-RATA KAS RT</span>
                  <BarChart3 size={14} className="text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-600 font-mono">
                  Rp {platformStats.avgKas.toLocaleString('id-ID')}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Alokasi operasional kas lingkungan</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-mono">
                  <span>RATA-RATA AIR / PDAM</span>
                  <Activity size={14} className="text-sky-600" />
                </div>
                <div className="text-2xl font-black text-sky-600 font-mono">
                  Rp {platformStats.avgAir.toLocaleString('id-ID')}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Standar retribusi air bersih swadaya</p>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Matriks Perbandingan Struktur Tarif Seluruh RT</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Data transparan untuk pengawasan disparitas iuran dan sinkronisasi kebijakan wilayah.
                  </p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
                >
                  <Download size={13} />
                  <span>Unduh Matriks CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-mono font-black border-b border-slate-200">
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
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {availableTenants.map((t) => {
                      const sampah = t.fees?.sampahUmum || 20000;
                      const pkh = t.fees?.sampahPkh || 10000;
                      const pns = t.fees?.sampahPns || 35000;
                      const kas = t.fees?.kasFee || 20000;
                      const air = t.fees?.airFee || 10000;
                      const totalStandard = sampah + kas;

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-sans font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span 
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: t.themeColor || '#4f46e5' }}
                              ></span>
                              <span>{t.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">Kel. {t.kelurahan}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            Rp {sampah.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 text-emerald-600 font-bold">
                            Rp {pkh.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 text-purple-600 font-bold">
                            Rp {pns.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 text-amber-600 font-bold">
                            Rp {kas.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 text-sky-600 font-bold">
                            Rp {air.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-indigo-700">
                            Rp {totalStandard.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-sans">
                            <button
                              onClick={() => setSelectedTenantForDetail(t)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
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

        {/* TAB 4: SIARAN SISTEM PLATFORM (BROADCAST) */}
        {activeTab === 'broadcast' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Broadcast Form */}
            <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
                  <Megaphone size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Buat Siaran Platform</h3>
                  <p className="text-[11px] text-slate-500">Pemberitahuan resmi ke seluruh dashboard RT</p>
                </div>
              </div>

              <form onSubmit={handleCreateBroadcast} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Judul Siaran</label>
                  <input
                    type="text"
                    value={newBroadcastTitle}
                    onChange={(e) => setNewBroadcastTitle(e.target.value)}
                    placeholder="Contoh: Jadwal Pemeliharaan Server..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Tingkat Prioritas</label>
                    <select
                      value={newBroadcastPriority}
                      onChange={(e) => setNewBroadcastPriority(e.target.value as any)}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 cursor-pointer font-medium"
                    >
                      <option value="info">Informasi (Biru)</option>
                      <option value="warning">Penting (Kuning)</option>
                      <option value="urgent">Darurat (Merah)</option>
                      <option value="maintenance">Pemeliharaan (Ungu)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Target Tenant</label>
                    <select
                      value={newBroadcastTarget}
                      onChange={(e) => setNewBroadcastTarget(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 cursor-pointer font-medium"
                    >
                      <option value="all">Semua RT (Global)</option>
                      {availableTenants.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Isi Pesan Siaran</label>
                  <textarea
                    rows={4}
                    value={newBroadcastMessage}
                    onChange={(e) => setNewBroadcastMessage(e.target.value)}
                    placeholder="Tuliskan pesan instruksi atau pengumuman platform..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none transition-all"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm shadow-indigo-600/30 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Radio size={14} />
                  <span>Terbitkan Siaran Sekarang</span>
                </button>
              </form>
            </div>

            {/* Broadcast List & Live Preview */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>Daftar Siaran Aktif & Riwayat</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-mono text-slate-600 font-bold">
                    {broadcasts.length}
                  </span>
                </h3>
              </div>

              {broadcasts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500 shadow-xs">
                  Belum ada siaran yang diterbitkan.
                </div>
              ) : (
                <div className="space-y-3">
                  {broadcasts.map((bc) => {
                    const isUrgent = bc.priority === 'urgent';
                    const isWarning = bc.priority === 'warning';
                    const isMaint = bc.priority === 'maintenance';

                    const borderClass = isUrgent 
                      ? 'border-rose-200 bg-rose-50/50' 
                      : isWarning 
                        ? 'border-amber-200 bg-amber-50/50'
                        : isMaint
                          ? 'border-purple-200 bg-purple-50/50'
                          : 'border-indigo-200 bg-indigo-50/50';

                    const badgeClass = isUrgent
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : isWarning
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : isMaint
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : 'bg-indigo-100 text-indigo-800 border-indigo-300';

                    return (
                      <div 
                        key={bc.id}
                        className={`rounded-2xl border p-4.5 transition-all shadow-2xs ${borderClass} ${!bc.isActive ? 'opacity-60 grayscale-[30%]' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border ${badgeClass}`}>
                              {bc.priority.toUpperCase()}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">{bc.title}</h4>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleToggleBroadcast(bc.id)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition-colors cursor-pointer border ${
                                bc.isActive 
                                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800' 
                                  : 'bg-slate-100 border-slate-200 text-slate-500'
                              }`}
                            >
                              {bc.isActive ? 'Aktif' : 'Non-Aktif'}
                            </button>

                            <button
                              onClick={() => handleDeleteBroadcast(bc.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Hapus Siaran"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed mb-3">
                          {bc.message}
                        </p>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-200/60">
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

        {/* TAB 5: JEJAK AUDIT PLATFORM (AUDIT TRAIL) */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative flex-1 min-w-[220px]">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                    placeholder="Cari aksi, aktor, atau rincian audit log..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                  {auditSearchQuery && (
                    <button
                      onClick={() => setAuditSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-500 text-[11px] font-bold">Kategori:</span>
                  <select
                    value={auditCategoryFilter}
                    onChange={(e) => setAuditCategoryFilter(e.target.value)}
                    className="bg-transparent text-slate-800 focus:outline-none text-xs cursor-pointer font-medium"
                  >
                    <option value="all">Semua Kategori</option>
                    <option value="lifecycle">Siklus Hidup (Lifecycle)</option>
                    <option value="module">Modul Fitur</option>
                    <option value="tariff">Tarif Iuran</option>
                    <option value="broadcast">Siaran Sistem</option>
                    <option value="security">Keamanan & Supervisi</option>
                    <option value="export">Ekspor Data</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono">
                  Total <strong className="text-slate-800">{filteredAuditLogs.length}</strong> Event
                </span>

                <button
                  onClick={() => {
                    if (window.confirm('Bersihkan jejak audit lokal?')) {
                      setAuditLogs([]);
                      localStorage.removeItem(AUDIT_STORAGE_KEY);
                      toast.success('Log audit telah dibersihkan');
                    }
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Bersihkan Log
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-mono font-black border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Waktu (WITA)</th>
                      <th className="py-3.5 px-4">Kategori</th>
                      <th className="py-3.5 px-4">Aksi Operasional</th>
                      <th className="py-3.5 px-4">Target Wilayah</th>
                      <th className="py-3.5 px-4">Aktor / Email</th>
                      <th className="py-3.5 px-4">Detail Perubahan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredAuditLogs.map((log) => {
                      const categoryColors = {
                        lifecycle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        module: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                        tariff: 'bg-amber-50 text-amber-700 border-amber-200',
                        broadcast: 'bg-purple-50 text-purple-700 border-purple-200',
                        security: 'bg-rose-50 text-rose-700 border-rose-200',
                        export: 'bg-sky-50 text-sky-700 border-sky-200',
                      };

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {log.timestamp}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border ${categoryColors[log.category] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                              {log.category.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {log.action}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {log.targetTenantName || '-'}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-indigo-600">
                            {log.actor}
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                            {log.details || '-'}
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

        {/* TAB 6: KEAMANAN & ROOT ENGINE */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
              <h3 className="text-sm font-black text-slate-900 mb-1 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>Daftar Akun Otorisasi Super Admin</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Daftar email yang telah disahkan memiliki kekebalan akses dan hak mutlak dalam fleet multi-tenant:
              </p>
              <div className="space-y-2">
                {SUPER_ADMIN_EMAILS.map((email) => {
                  const isCurrent = auth.currentUser?.email?.toLowerCase() === email.toLowerCase();
                  return (
                    <div key={email} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        <div>
                          <span className="text-xs font-mono font-bold text-slate-800">{email}</span>
                          <p className="text-[10px] text-slate-500 font-sans mt-0.5">Level Akses: PLATFORM_ROOT_OPERATOR</p>
                        </div>
                      </div>
                      {isCurrent ? (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-800 font-mono">
                          Sesi Anda
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 font-mono">
                          Terverifikasi
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
                <div className="flex items-start gap-2">
                  <Info size={15} className="text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-indigo-900 leading-relaxed">
                    Untuk menambahkan akun Super Admin baru, tambahkan email pada konstanta <code className="text-indigo-700 font-mono font-bold">SUPER_ADMIN_EMAILS</code> di konfigurasi sistem platform.
                  </p>
                </div>
              </div>

              {/* Disaster Recovery Snapshot Box */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-900 mb-1 flex items-center gap-1.5">
                  <HardDrive size={14} className="text-indigo-600" />
                  <span>Cadangan Snapshot Bencana (Disaster Recovery)</span>
                </h4>
                <p className="text-[11px] text-slate-500 mb-3">
                  Unduh seluruh konfigurasi tenant, modul, struktur tarif, dan log platform dalam format JSON:
                </p>
                <button
                  onClick={handleExportPlatformSnapshot}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download size={14} />
                  <span>Unduh Fleet Snapshot Lengkap (.JSON)</span>
                </button>
                <button
                  onClick={() => setShowRestoreModal(true)}
                  className="w-full mt-2 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UploadCloud size={14} className="text-rose-600" />
                  <span>Pulihkan dari Berkas JSON (Restore)</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 mb-1 flex items-center gap-2">
                  <Database size={16} className="text-indigo-600" />
                  <span>Audit Isolasi & Integritas Multi-Tenant</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Pemeriksaan berkala standar pengamanan arsitektur data Teras Warga:
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block font-sans">Isolasi Prefix Database</strong>
                      <span className="text-slate-600 text-[11px]">
                        Semua koleksi warga, transaksi kas, dan aduan disimpan dengan prefix tenant unik terisolasi.
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block font-sans">Pemisahan Dashboard Admin RT</strong>
                      <span className="text-slate-600 text-[11px]">
                        Admin RT 02 atau RT lainnya tidak memiliki navigasi maupun hak pendaftaran RT baru.
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block font-sans">Perlindungan Tenant Utama</strong>
                      <span className="text-slate-600 text-[11px]">
                        Tenant acuan (<code className="text-indigo-700 font-mono font-bold">tondo-rw20-rt02</code>) dilindungi dari operasi penghapusan atau mutasi ilegal.
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block font-sans">Mode Supervisi Read-Only</strong>
                      <span className="text-slate-600 text-[11px]">
                        Sesi inspeksi teknis Super Admin beroperasi dalam proteksi ketat tanpa hak mutasi keuangan RT.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Security Engine Status:</span>
                <span className="text-emerald-600 font-bold">100% HEALTHY & COMPLIANT</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: DIREKTORI PENGURUS & KONTAK WA */}
        {activeTab === 'officials' && (
          <OfficialsDirectoryTab 
            tenants={availableTenants} 
            onEditTenant={(tenant) => setSelectedTenantForDetail(tenant)} 
          />
        )}

        {/* TAB 8: TIKET BANTUAN & DUKUNGAN TEKNIS RT */}
        {activeTab === 'support' && (
          <HelpdeskSupportTab 
            tenants={availableTenants} 
            onLogAudit={logAuditEvent} 
          />
        )}

        {/* TAB 9: TEMPLATE PERSURATAN STANDAR */}
        {activeTab === 'templates' && (
          <GlobalTemplatesTab 
            onLogAudit={logAuditEvent} 
          />
        )}

        {/* TAB 10: MONITORING GATEWAY PEMBAYARAN & QRIS */}
        {activeTab === 'gateway' && (
          <PaymentGatewayTab 
            tenants={availableTenants} 
            onLogAudit={logAuditEvent} 
          />
        )}

        {/* TAB 11: AGREGASI DEMOGRAFI & CIVIC ANALYTICS */}
        {activeTab === 'analytics' && (
          <CivicAnalyticsTab 
            tenants={availableTenants} 
          />
        )}

        {/* TAB 12: TELEMETRI & KESEHATAN SISTEM CLOUD */}
        {activeTab === 'telemetry' && (
          <SystemTelemetryTab />
        )}
      </main>

      {/* Centralized Onboarding Registration Modal */}
      <TenantRegistrationModal
        isOpen={showOnboardModal}
        onClose={() => setShowOnboardModal(false)}
        onSuccess={(created) => {
          logAuditEvent('Pendaftaran RT Baru Berhasil', 'lifecycle', created.id, `Wilayah baru ${created.name} berhasil didaftarkan`);
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
          logAuditEvent('Pembaruan Profil & Konfigurasi Tenant', 'lifecycle', updated.id, `Profil dan pengaturan wilayah ${updated.name} diperbarui`);
        }}
        onDelete={(tenantId) => {
          logAuditEvent('Penghapusan Tenant', 'lifecycle', tenantId, `Wilayah ID ${tenantId} telah dihapus dari fleet platform`);
          setSelectedTenantForDetail(null);
        }}
      />

      {/* Two-Way Disaster Recovery Restore Modal */}
      <RestoreSnapshotModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onRestoreSuccess={handleRestoreSuccess}
      />
    </div>
  );
};
