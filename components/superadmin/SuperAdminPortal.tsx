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
  UploadCloud, Clock, Zap, Wifi
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { 
  Tenant, Role, TenantStatus, TenantModules, 
  House, CashFlow, Official, HelpdeskTicket, FleetAggregates,
  Report, LetterRequest, SystemBroadcast, PlatformAuditEvent, PanicAlert 
} from '../../types';
import { 
  subscribeToAllHouses, 
  subscribeToAllCashFlow, 
  subscribeToAllOfficials, 
  subscribeToSupportTickets,
  subscribeToAllReports,
  subscribeToAllLetters,
  subscribeToSystemBroadcasts,
  createSystemBroadcast,
  updateSystemBroadcast,
  deleteSystemBroadcast,
  subscribeToSystemAuditLogs,
  logPlatformAuditEvent,
  clearSystemAuditLogs,
  calculateFleetAggregates,
  subscribeToFleetPanicAlerts
} from '../../services/databaseService';

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

  // Modal & Drawer States
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showTriageDrawer, setShowTriageDrawer] = useState(false);
  const [selectedTenantForDetail, setSelectedTenantForDetail] = useState<Tenant | null>(null);

  // Live Telemetry Clock (WITA)
  const [liveTime, setLiveTime] = useState<string>(() => new Date().toLocaleTimeString('id-ID', { hour12: false }));
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString('id-ID', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Real-time Fleet Data Subscriptions across Cloud Firestore Collections ---
  const [allHouses, setAllHouses] = useState<House[]>([]);
  const [allCashFlow, setAllCashFlow] = useState<CashFlow[]>([]);
  const [allOfficials, setAllOfficials] = useState<Official[]>([]);
  const [allTickets, setAllTickets] = useState<HelpdeskTicket[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [allLetters, setAllLetters] = useState<LetterRequest[]>([]);
  const [broadcasts, setBroadcasts] = useState<SystemBroadcast[]>([]);
  const [auditLogs, setAuditLogs] = useState<PlatformAuditEvent[]>([]);
  const [fleetPanicAlerts, setFleetPanicAlerts] = useState<PanicAlert[]>([]);

  useEffect(() => {
    const unsubHouses = subscribeToAllHouses(setAllHouses);
    const unsubCash = subscribeToAllCashFlow(setAllCashFlow);
    const unsubOfficials = subscribeToAllOfficials(setAllOfficials);
    const unsubTickets = subscribeToSupportTickets(setAllTickets);
    const unsubReports = subscribeToAllReports(setAllReports);
    const unsubLetters = subscribeToAllLetters(setAllLetters);
    const unsubBroadcasts = subscribeToSystemBroadcasts(setBroadcasts);
    const unsubAudit = subscribeToSystemAuditLogs(setAuditLogs);
    const unsubPanic = subscribeToFleetPanicAlerts(setFleetPanicAlerts);

    return () => {
      unsubHouses();
      unsubCash();
      unsubOfficials();
      unsubTickets();
      unsubReports();
      unsubLetters();
      unsubBroadcasts();
      unsubAudit();
      unsubPanic();
    };
  }, []);


  // Compute Live Fleet Aggregates
  const fleetAggregates: FleetAggregates = useMemo(() => {
    return calculateFleetAggregates(
      availableTenants, 
      allHouses, 
      allCashFlow, 
      allTickets, 
      allOfficials,
      allReports,
      allLetters
    );
  }, [availableTenants, allHouses, allCashFlow, allTickets, allOfficials, allReports, allLetters]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [kelurahanFilter, setKelurahanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'maintenance'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Audit Log Category Filter
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<string>('all');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');

  // Broadcast Form State
  const [newBroadcastTitle, setNewBroadcastTitle] = useState('');
  const [newBroadcastMessage, setNewBroadcastMessage] = useState('');
  const [newBroadcastPriority, setNewBroadcastPriority] = useState<'info' | 'warning' | 'urgent' | 'maintenance'>('info');
  const [newBroadcastTarget, setNewBroadcastTarget] = useState<string>('all');

  // Dynamic Platform Admins State
  const [platformAdmins, setPlatformAdmins] = useState<Array<{
    email: string;
    role: 'super_admin' | 'kelurahan_officer' | 'support_agent';
    name: string;
    addedAt: string;
  }>>([
    { email: 'lurah.tondo@palukota.go.id', role: 'kelurahan_officer', name: 'Bpk. Lurah Tondo', addedAt: '12 Okt 2026' },
    { email: 'sekretaris.kelurahan@palukota.go.id', role: 'kelurahan_officer', name: 'Sekretariat Kelurahan Tondo', addedAt: '14 Okt 2026' },
    { email: 'helpdesk.huntap@palukota.go.id', role: 'support_agent', name: 'Tim Helpdesk Huntap', addedAt: '15 Okt 2026' }
  ]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'super_admin' | 'kelurahan_officer' | 'support_agent'>('kelurahan_officer');
  const [newAdminName, setNewAdminName] = useState('');
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);

  // Close AddAdminModal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAddAdminModal) {
        setShowAddAdminModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddAdminModal]);

  const handleAddPlatformAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    const cleanEmail = newAdminEmail.trim().toLowerCase();
    if (platformAdmins.some(a => a.email.toLowerCase() === cleanEmail)) {
      toast.error('Email ini sudah terdaftar sebagai pengurus platform!');
      return;
    }
    const newEntry = {
      email: cleanEmail,
      role: newAdminRole,
      name: newAdminName.trim() || 'Aparatur Wilayah',
      addedAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    };
    setPlatformAdmins(prev => [...prev, newEntry]);
    logAuditEvent('Tambah Administrator Wilayah', 'security', 'all', `Menambahkan ${cleanEmail} sebagai ${newAdminRole}`);
    setNewAdminEmail('');
    setNewAdminName('');
    setShowAddAdminModal(false);
    toast.success(`Akun ${cleanEmail} berhasil ditambahkan dengan hak akses ${newAdminRole}!`);
  };

  const handleRemovePlatformAdmin = (email: string) => {
    setPlatformAdmins(prev => prev.filter(a => a.email !== email));
    logAuditEvent('Cabut Akses Administrator', 'security', 'all', `Mencabut akses ${email}`);
    toast.info(`Akses untuk ${email} telah dicabut.`);
  };


  // Helper to log audit events into Firestore Realtime Database
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
    logPlatformAuditEvent(newEvent);
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
    let fallbackEstimatedDoors = 0;
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
          fallbackEstimatedDoors += Math.max(1, (bc.end - bc.start + 1));
        });
      } else {
        fallbackEstimatedDoors += (t.blocks ? t.blocks.length * 20 : 0);
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

    const realDoors = fleetAggregates.totalRegisteredDoors > 0 
      ? fleetAggregates.totalRegisteredDoors 
      : fallbackEstimatedDoors;

    return {
      totalTenants,
      activeTenantsCount,
      suspendedCount,
      maintenanceCount,
      totalBlocks,
      totalEstimatedDoors: realDoors,
      totalOccupiedDoors: fleetAggregates.totalOccupiedDoors,
      totalEmptyDoors: fleetAggregates.totalEmptyDoors,
      totalPopulation: fleetAggregates.totalPopulation,
      totalFleetTreasury: fleetAggregates.totalFleetBalance,
      averageCompliance: fleetAggregates.averageCompliance,
      avgSampah,
      avgKas,
      avgAir,
      totalEstimatedMonthlyCashflow: fleetAggregates.totalFleetIncome > 0 ? fleetAggregates.totalFleetIncome : realDoors * (avgSampah + avgKas),
      activeScope: currentTenant.name
    };
  }, [availableTenants, currentTenant, fleetAggregates]);

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

  // Add Broadcast directly to Firestore Realtime Collection
  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBroadcastTitle.trim() || !newBroadcastMessage.trim()) {
      toast.error('Mohon isi judul dan pesan siaran');
      return;
    }

    const newBc: Omit<SystemBroadcast, 'id'> = {
      title: newBroadcastTitle.trim(),
      message: newBroadcastMessage.trim(),
      priority: newBroadcastPriority,
      targetTenantId: newBroadcastTarget,
      createdAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      isActive: true
    };

    try {
      await createSystemBroadcast(newBc);
      setNewBroadcastTitle('');
      setNewBroadcastMessage('');
      logAuditEvent(
        'Menerbitkan Siaran Platform',
        'broadcast',
        newBroadcastTarget,
        `Judul: "${newBc.title}" (Prioritas: ${newBc.priority.toUpperCase()})`
      );
      toast.success('Siaran sistem platform berhasil diterbitkan ke Firestore!');
    } catch (error) {
      toast.error('Gagal menerbitkan siaran platform');
    }
  };

  const handleToggleBroadcast = async (id: string) => {
    const target = broadcasts.find(b => b.id === id);
    if (!target) return;
    const nextActive = !target.isActive;
    try {
      await updateSystemBroadcast(id, { isActive: nextActive });
      logAuditEvent(
        `${nextActive ? 'Mengaktifkan' : 'Menonaktifkan'} Siaran`,
        'broadcast',
        target.targetTenantId,
        `Siaran "${target.title}" disetel ${nextActive ? 'Aktif' : 'Non-Aktif'}`
      );
      toast.success(`Siaran berhasil ${nextActive ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (e) {
      toast.error('Gagal mengubah status siaran');
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    const target = broadcasts.find(b => b.id === id);
    try {
      await deleteSystemBroadcast(id);
      logAuditEvent('Menghapus Siaran', 'broadcast', target?.targetTenantId, `Siaran "${target?.title}" dihapus`);
      toast.success('Siaran telah dihapus dari basis data Firestore');
    } catch (e) {
      toast.error('Gagal menghapus siaran');
    }
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

  type ClusterId = 'armada' | 'layanan' | 'finansial' | 'sistem';

  interface NavTabGroup {
    id: ClusterId;
    category: string;
    icon: React.ElementType;
    description: string;
    tabs: NavTabItem[];
  }

  const tabGroups: NavTabGroup[] = [
    {
      id: 'armada',
      category: 'Armada & Pengurus',
      icon: Globe,
      description: 'Tata kelola wilayah dan kontak aparatur RT',
      tabs: [
        { id: 'tenants', label: 'Direktori Armada RT', icon: Globe, count: availableTenants.length },
        { id: 'officials', label: 'Pengurus & Kontak WA', icon: Users },
        { id: 'modules', label: 'Matriks Modul & Sakelar', icon: Sliders, badge: 'Matrix' },
      ]
    },
    {
      id: 'layanan',
      category: 'Layanan & Birokrasi',
      icon: FileText,
      description: 'Dukungan teknis dan standardisasi persuratan',
      tabs: [
        { id: 'support', label: 'Tiket Bantuan RT', icon: HelpCircle, badge: 'Helpdesk' },
        { id: 'templates', label: 'Template Surat Standar', icon: FileText },
        { id: 'broadcast', label: 'Siaran Platform', icon: Megaphone, count: broadcasts.filter(b => b.isActive).length },
      ]
    },
    {
      id: 'finansial',
      category: 'Finansial & Wawasan',
      icon: Wallet,
      description: 'Tolok ukur fiskal dan agregasi analitik',
      tabs: [
        { id: 'tariffs', label: 'Matriks Tarif & Kas', icon: BarChart3 },
        { id: 'gateway', label: 'Monitoring QRIS', icon: Wallet },
        { id: 'analytics', label: 'Civic Analytics', icon: TrendingUp },
      ]
    },
    {
      id: 'sistem',
      category: 'Sistem & Keandalan',
      icon: ShieldCheck,
      description: 'Telemetri cloud, audit, dan snapshot pemulihan',
      tabs: [
        { id: 'telemetry', label: 'Telemetri & Cloud', icon: Activity },
        { id: 'audit', label: 'Jejak Audit Platform', icon: History, count: auditLogs.length },
        { id: 'security', label: 'Keamanan & Snapshot', icon: ShieldCheck }
      ]
    }
  ];

  const allTabs: NavTabItem[] = tabGroups.flatMap(g => g.tabs);

  // Active Cluster derived from activeTab
  const activeClusterId = useMemo<ClusterId>(() => {
    const found = tabGroups.find(g => g.tabs.some(t => t.id === activeTab));
    return found ? found.id : 'armada';
  }, [activeTab]);

  const currentCluster = useMemo(() => {
    return tabGroups.find(g => g.id === activeClusterId) || tabGroups[0];
  }, [activeClusterId]);

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
        {/* =========================================================================
            1. INTERACTIVE FLEET PULSE RADAR & TOPOLOGY STRIP (CIVIC FLIGHT DECK)
        ========================================================================= */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
          {/* Header Strip with Live Node Topology */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/80 shadow-2xs">
                <Radio size={16} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-mono">
                    Radar Armada Kota Palu (Live Fleet Topology)
                  </h3>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    ALL NODES ONLINE
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Status latensi dan sinkronisasi real-time basis data per wilayah
                </p>
              </div>
            </div>

            {/* Live Clock & Regional Info */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 shadow-2xs">
                <Clock size={13} className="text-indigo-600" />
                <span className="font-bold text-slate-900">{liveTime} WITA</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 shadow-2xs">
                <Globe size={13} className="text-slate-400" />
                <span>Kota Palu (94119)</span>
              </div>
            </div>
          </div>

          {/* Interactive RT Nodes Ribbon */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {availableTenants.map((t) => {
              const isSupervised = currentTenant?.id === t.id;
              const metric = fleetAggregates.tenantMetrics[t.id];
              const doorCount = metric?.realDoors || (t.blockConfig?.reduce((acc, b) => acc + (b.end - b.start + 1), 0) || 40);
              const compliance = metric?.complianceRate ?? 0;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTenantForDetail(t)}
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-2xl border transition-all cursor-pointer shrink-0 hover:scale-[1.02] shadow-2xs ${
                    isSupervised
                      ? 'bg-indigo-50/90 border-indigo-300 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                  title="Klik untuk membuka detail wilayah"
                >
                  <div 
                    className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse" 
                    style={{ backgroundColor: t.themeColor || '#10b981' }}
                  />
                  <div className="text-left">
                    <div className="font-black text-xs truncate max-w-[170px]">{t.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                      <span>{doorCount} Pintu</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold">{metric ? `${compliance}% Lunas` : '~38ms'}</span>
                    </div>
                  </div>
                  {isSupervised && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-200 text-indigo-800 font-black uppercase">
                      Supervisi
                    </span>
                  )}
                </div>
              );
            })}

            {/* Quick Add Node Pill */}
            <button
              onClick={() => setShowOnboardModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-dashed border-slate-300 hover:border-indigo-400 bg-white hover:bg-indigo-50/40 text-slate-600 hover:text-indigo-700 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
            >
              <Plus size={13} />
              <span>Daftarkan RT Baru</span>
            </button>
          </div>

          {/* 4 Precision Telemetry Micro-Dials */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:shadow-xs transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-slate-500 mb-1">
                <span>Total Armada RT</span>
                <Globe size={13} className="text-indigo-600" />
              </div>
              <div className="text-xl font-black font-mono text-slate-900">
                {platformStats.totalTenants} <span className="text-xs font-sans font-bold text-slate-500">Tenant</span>
              </div>
              <div className="text-[10px] text-emerald-700 font-mono font-bold mt-0.5">
                {platformStats.activeTenantsCount} Beroperasi Penuh
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:shadow-xs transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-slate-500 mb-1">
                <span>Pintu & Hunian Riil</span>
                <Home size={13} className="text-emerald-600" />
              </div>
              <div className="text-xl font-black font-mono text-emerald-600">
                {platformStats.totalEstimatedDoors} <span className="text-xs font-sans font-bold text-slate-500">Pintu</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {platformStats.totalOccupiedDoors} Terisi • {platformStats.totalEmptyDoors} Kosong
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:shadow-xs transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-slate-500 mb-1">
                <span>Total Saldo Kas Armada</span>
                <Wallet size={13} className="text-amber-600" />
              </div>
              <div className="text-xl font-black font-mono text-amber-600">
                Rp {Math.max(0, platformStats.totalFleetTreasury).toLocaleString('id-ID')}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Live Net Kas Semua RT
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:shadow-xs transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-slate-500 mb-1">
                <span>Rata Kepatuhan Iuran</span>
                <ShieldCheck size={13} className="text-sky-600" />
              </div>
              <div className="text-xl font-black font-mono text-sky-700 flex items-center gap-1.5">
                <span>{platformStats.averageCompliance}%</span>
              </div>
              <div className="text-[10px] text-emerald-700 font-mono font-bold mt-0.5">
                Sinkron Live Kartu Warga
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. PRECISION CIVIC COMMAND DOCK (DUAL-TIER SEGMENTED CONTROL)
        ========================================================================= */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-3 border border-slate-200/90 shadow-xs space-y-3">
          {/* TIER 1: OPERATIONAL CLUSTERS SELECTOR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80">
              {tabGroups.map((group) => {
                const GroupIcon = group.icon;
                const isClusterActive = group.id === activeClusterId;
                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      if (!isClusterActive) {
                        setActiveTab(group.tabs[0].id);
                      }
                    }}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      isClusterActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <GroupIcon size={14} className={isClusterActive ? 'text-indigo-400' : 'text-slate-400'} />
                    <span>{group.category}</span>
                  </button>
                );
              })}
            </div>

            {/* Platform Health Beacon & Quick Triage Trigger */}
            <div className="flex items-center gap-3 text-xs font-mono self-end sm:self-center">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Wifi size={13} className="text-emerald-500" />
                <span className="hidden md:inline">Cluster:</span>
                <strong className="text-slate-900 font-sans">{currentCluster.category}</strong>
              </div>
              <span className="text-slate-300">|</span>
              <button
                onClick={() => setShowTriageDrawer(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl font-bold transition-all cursor-pointer text-xs shadow-2xs"
              >
                <Zap size={13} className="text-amber-500" />
                <span>Quick Triage</span>
                {allTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono text-[9px] font-bold animate-pulse">
                    {allTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* TIER 2: ACTIVE TOOLS PILLS IN SELECTED CLUSTER */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {currentCluster.tabs.map((tab, idx) => {
                const TabIcon = tab.icon;
                const isTabActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                      isTabActive
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80 hover:text-slate-900'
                    }`}
                  >
                    <TabIcon size={14} className={isTabActive ? 'text-white' : 'text-indigo-600'} />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                        isTabActive ? 'bg-indigo-700/80 text-white' : 'bg-slate-200/80 text-slate-700'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                    {tab.badge && (
                      <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-mono uppercase font-black ${
                        isTabActive ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                    <span className={`text-[9px] font-mono ${isTabActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                      [{idx + 1}]
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-500 font-medium italic hidden lg:block">
              {currentCluster.description}
            </p>
          </div>
        </div>

        {/* CROSS-RT EMERGENCY CRISIS ALERT BANNER */}
        {fleetPanicAlerts.length > 0 && (
          <div className="bg-rose-600 border-2 border-rose-400 rounded-3xl p-5 text-white shadow-xl animate-pulse space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white text-rose-600 flex items-center justify-center font-black shadow-md">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
                    <span>PERINGATAN DARURAT KRISIS ({fleetPanicAlerts.length} ALARM AKTIF)</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-mono uppercase">
                      Live Fleet SOS
                    </span>
                  </h2>
                  <p className="text-xs text-rose-100 font-medium">
                    Warga telah menekan tombol darurat (Panic Button). Pengurus RT & Tim Keamanan sedang merespons di lokasi.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono bg-rose-700/80 px-3 py-1.5 rounded-xl border border-rose-500 hidden sm:inline-block">
                WITA {liveTime}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              {fleetPanicAlerts.map(alert => (
                <div key={alert.id} className="bg-rose-950/60 backdrop-blur-xs p-3.5 rounded-2xl border border-rose-400/40 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-black text-xs text-white truncate flex items-center gap-1.5">
                      <span>{alert.residentName}</span>
                      <span className="text-[10px] text-rose-200 font-mono">({alert.location})</span>
                    </div>
                    <div className="text-[10px] text-rose-300 font-mono">
                      Status: {alert.status} • {new Date(alert.timestamp).toLocaleTimeString('id-ID')}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (alert.tenantId) {
                        switchTenant(alert.tenantId);
                        toast.info(`Beralih ke RT ${alert.tenantId} untuk memantau situasi`);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 font-bold text-[11px] shrink-0 transition-all shadow-xs cursor-pointer"
                  >
                    Supervisi RT
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
                  onClick={async () => {
                    if (window.confirm('Bersihkan jejak audit platform di Cloud Firestore?')) {
                      await clearSystemAuditLogs();
                      toast.success('Log audit platform telah dibersihkan dari Firestore');
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
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <span>Akun Otorisasi Root Super Admin</span>
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                    Hardcoded Guard
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Akun pemilik platform dengan kekebalan akses mutlak:
                </p>
                <div className="space-y-2">
                  {SUPER_ADMIN_EMAILS.map((email) => {
                    const isCurrent = auth.currentUser?.email?.toLowerCase() === email.toLowerCase();
                    return (
                      <div key={email} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                          <div>
                            <span className="text-xs font-mono font-bold text-slate-800">{email}</span>
                            <p className="text-[10px] text-slate-500 font-sans">Level Akses: PLATFORM_ROOT_OPERATOR</p>
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
              </div>

              {/* DYNAMIC PLATFORM ADMINS & KELURAHAN STAFF */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <UserPlus size={16} className="text-indigo-600" />
                      <span>Administrator Wilayah & Staf Kelurahan (Dynamic RBAC)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kelola hak akses berjenjang untuk Lurah, Staf Kelurahan, atau Tim Helpdesk tanpa ubah kode program:
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddAdminModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Tambah Admin</span>
                  </button>
                </div>

                <div className="space-y-2 mt-3">
                  {platformAdmins.map((adm) => {
                    const roleBadges = {
                      super_admin: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                      kelurahan_officer: 'bg-indigo-100 text-indigo-800 border-indigo-300',
                      support_agent: 'bg-sky-100 text-sky-800 border-sky-300',
                    };
                    const roleLabels = {
                      super_admin: 'Super Admin',
                      kelurahan_officer: 'Staf Kelurahan (Auditor)',
                      support_agent: 'Agen Helpdesk',
                    };

                    return (
                      <div key={adm.email} className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 truncate">{adm.name}</span>
                            <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.2 rounded border ${roleBadges[adm.role]}`}>
                              {roleLabels[adm.role]}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                            {adm.email} • Ditambahkan {adm.addedAt}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemovePlatformAdmin(adm.email)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Cabut Akses Admin"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
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
            officials={allOfficials}
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
            onUpdateTenant={updateTenant}
          />
        )}

        {/* TAB 11: AGREGASI DEMOGRAFI & CIVIC ANALYTICS */}
        {activeTab === 'analytics' && (
          <CivicAnalyticsTab 
            tenants={availableTenants} 
            fleetAggregates={fleetAggregates}
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
        houses={allHouses}
        cashFlows={allCashFlow}
        reports={allReports}
        letters={allLetters}
        tickets={allTickets}
        officials={allOfficials}
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

      {/* =========================================================================
          3. FLOATING QUICK TRIAGE TRIGGER PILL
      ========================================================================= */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowTriageDrawer(true)}
        className="fixed bottom-6 right-6 z-40 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-bold transition-all cursor-pointer border border-slate-700/60"
        title="Buka Konsol Triage Cepat Platform"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Zap size={14} className="text-amber-400" />
        <span>Konsol Triage Cepat</span>
      </motion.button>

      {/* =========================================================================
          4. SLIDE-OVER QUICK TRIAGE DRAWER
      ========================================================================= */}
      <AnimatePresence>
        {showTriageDrawer && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTriageDrawer(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            />

            <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between"
              >
                {/* Drawer Header */}
                <div className="p-6 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                      <Zap size={16} className="text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">
                        Konsol Triage Cepat
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Inspeksi cepat latensi, tiket & log platform
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTriageDrawer(false)}
                    className="p-2 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Drawer Body */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                  {/* Database Ping Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Database size={13} className="text-indigo-600" />
                        Latensi Cloud Firestore
                      </span>
                      <span className="font-mono text-emerald-600 font-black">~38 ms (Optimal)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Koneksi terenkripsi SSL aktif ke region Jakarta (<code className="font-mono text-slate-700">asia-southeast2</code>).
                    </p>
                  </div>

                  {/* Live Support Tickets Requiring Attention */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                        <MessageSquare size={13} className="text-indigo-600" />
                        <span>Tiket Butuh Respon ({allTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length})</span>
                      </h4>
                      <button
                        onClick={() => {
                          setActiveTab('support');
                          setShowTriageDrawer(false);
                        }}
                        className="text-[11px] text-indigo-600 font-bold hover:underline"
                      >
                        Buka Semua Tiket →
                      </button>
                    </div>
                    {allTickets.filter(t => t.status === 'open' || t.status === 'in_progress').slice(0, 3).map(ticket => (
                      <div 
                        key={ticket.id} 
                        onClick={() => {
                          setActiveTab('support');
                          setShowTriageDrawer(false);
                        }}
                        className="p-3 bg-amber-50/70 hover:bg-amber-100/60 border border-amber-200/80 rounded-xl text-xs space-y-1 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 truncate max-w-[180px]">{ticket.title}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold uppercase">
                            {ticket.status === 'open' ? 'Baru' : 'Diproses'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-1">{ticket.description}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                          <span className="font-bold text-slate-700">{ticket.tenantName}</span>
                          <span className="font-mono text-slate-400">{ticket.senderName}</span>
                        </div>
                      </div>
                    ))}
                    {allTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length === 0 && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] text-slate-400 italic">
                        Tidak ada tiket bantuan yang menunggu respon.
                      </div>
                    )}
                  </div>

                  {/* Realtime Citizen Reports (Aduan Warga Seluruh RT) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                        <AlertOctagon size={13} className="text-rose-600" />
                        <span>Aduan Warga Realtime ({fleetAggregates.totalPendingReports} Butuh Respon)</span>
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        Total {fleetAggregates.totalReports}
                      </span>
                    </div>
                    {allReports.filter(r => r.status === 'Baru' || r.status === 'Diproses').slice(0, 2).map(rep => (
                      <div key={rep.id} className="p-3 bg-rose-50/60 border border-rose-200/70 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 truncate max-w-[170px]">{rep.reporterName || 'Warga'}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-200 text-rose-900 font-bold uppercase">
                            {rep.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-1">{rep.description}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>Wilayah: {rep.tenantId || 'Umum'}</span>
                          <span>{rep.date || 'Hari ini'}</span>
                        </div>
                      </div>
                    ))}
                    {allReports.filter(r => r.status === 'Baru' || r.status === 'Diproses').length === 0 && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] text-slate-400 italic">
                        Seluruh aduan warga di semua RT telah tertangani.
                      </div>
                    )}
                  </div>

                  {/* Realtime Letter Requests (Surat Pengantar Warga Seluruh RT) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                        <FileText size={13} className="text-indigo-600" />
                        <span>Pengajuan Surat Warga ({fleetAggregates.totalPendingLetters} Verifikasi)</span>
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        Total {fleetAggregates.totalLetters}
                      </span>
                    </div>
                    {allLetters.filter(l => l.status === 'Menunggu' || (l.status as any) === 'Diproses').slice(0, 2).map(letReq => (
                      <div key={letReq.id} className="p-3 bg-indigo-50/60 border border-indigo-200/70 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 truncate max-w-[170px]">{letReq.applicantName}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold uppercase">
                            {letReq.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-1">{letReq.type}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>Wilayah: {letReq.tenantId || 'Umum'}</span>
                          <span>Rumah: {letReq.houseId}</span>
                        </div>
                      </div>
                    ))}
                    {allLetters.filter(l => l.status === 'Menunggu' || (l.status as any) === 'Diproses').length === 0 && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] text-slate-400 italic">
                        Tidak ada surat pengantar yang menunggu verifikasi RT.
                      </div>
                    )}
                  </div>

                  {/* Recent Platform Broadcasts */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono">
                        Siaran Sistem Aktif
                      </h4>
                      <button
                        onClick={() => {
                          setActiveTab('broadcast');
                          setShowTriageDrawer(false);
                        }}
                        className="text-[11px] text-indigo-600 font-bold hover:underline"
                      >
                        Buka Siaran →
                      </button>
                    </div>
                    {broadcasts.slice(0, 2).map(b => (
                      <div key={b.id} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs truncate">{b.title}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold uppercase">
                            {b.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2">{b.message}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recent Audit Events */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono">
                        Jejak Audit Terkini
                      </h4>
                      <button
                        onClick={() => {
                          setActiveTab('audit');
                          setShowTriageDrawer(false);
                        }}
                        className="text-[11px] text-indigo-600 font-bold hover:underline"
                      >
                        Lihat Semua Log →
                      </button>
                    </div>
                    <div className="space-y-2">
                      {auditLogs.slice(0, 3).map(log => (
                        <div key={log.id} className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{log.action}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{log.details}</p>
                          <div className="text-[10px] text-indigo-600 font-mono">Aktor: {log.actor}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Emergency Actions */}
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-2.5">
                    <span className="text-xs font-black text-amber-900 block flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-amber-700" />
                      Tindakan Darurat Sistem
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleExportPlatformSnapshot}
                        className="p-2 bg-white hover:bg-slate-50 border border-amber-200 text-slate-800 rounded-xl text-xs font-bold transition-all text-center cursor-pointer shadow-2xs"
                      >
                        Snapshot JSON
                      </button>
                      <button
                        onClick={() => {
                          setShowRestoreModal(true);
                          setShowTriageDrawer(false);
                        }}
                        className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all text-center cursor-pointer shadow-2xs"
                      >
                        Pulihkan Data
                      </button>
                    </div>
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs font-mono text-slate-500">
                  <span>Engine: v2.4 Multi-Tenant</span>
                  <span className="text-emerald-600 font-bold">100% HEALTHY</span>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD PLATFORM ADMIN MODAL */}
      {showAddAdminModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddAdminModal(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div 
            role="dialog"
            aria-modal="true"
            aria-label="Tambah Admin Wilayah"
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden focus:outline-none"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">Tambah Admin Wilayah</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Otorisasi aparatur & staf kelurahan</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddAdminModal(false)}
                aria-label="Tutup form tambah admin"
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddPlatformAdmin} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Aparatur / Petugas</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Bpk. Lurah Tondo"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Google / Akun Resmi</label>
                <input
                  type="email"
                  required
                  placeholder="aparatur@palukota.go.id"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Level Akses & Peran</label>
                <select
                  value={newAdminRole}
                  onChange={(e: any) => setNewAdminRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                >
                  <option value="kelurahan_officer">Staf Kelurahan (Auditor & Monitoring)</option>
                  <option value="super_admin">Super Admin (Akses Penuh Seluruh Fleet)</option>
                  <option value="support_agent">Agen Helpdesk (Tiket & Layanan Surat)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  {newAdminRole === 'kelurahan_officer' && 'Dapat melihat analitik seluruh RT, supervisi wilayah, dan log audit.'}
                  {newAdminRole === 'super_admin' && 'Memiliki hak mutlak mengedit tenant, tarif, modul, dan sistem.'}
                  {newAdminRole === 'support_agent' && 'Hanya dapat menangani keluhan helpdesk dan format surat warga.'}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan Hak Akses
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

