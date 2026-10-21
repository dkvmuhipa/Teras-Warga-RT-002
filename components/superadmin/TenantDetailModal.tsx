import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Building2, MapPin, User, Phone, Shield, Trash2, 
  Edit3, Save, ExternalLink, Copy, Check, Layers, 
  DollarSign, Palette, AlertTriangle, ArrowRight, ShieldCheck,
  Calendar, CheckCircle2, Sliders, Eye, ToggleLeft, ToggleRight,
  Droplets, Package, FileText, AlertOctagon, Activity, Camera,
  CheckSquare, Square, Download, Key, Mail
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';
import { 
  Tenant, TenantStatus, TenantModules, 
  House, CashFlow, Report, LetterRequest, HelpdeskTicket,
  Official
} from '../../types';
import { useTenant } from '../../context/TenantContext';
import { matchesTenant } from '../../services/tenantService';
import { CreateOfficialAccountModal, OfficialAccountTarget } from './CreateOfficialAccountModal';
import { toast } from 'sonner';

const isPlaceholderName = (name?: string) => {
  if (!name) return true;
  const lower = name.toLowerCase().trim();
  return (
    lower.includes('sekretaris rt') ||
    lower.includes('bendahara rt') ||
    lower.includes('ketua rt') ||
    lower.includes('belum ada') ||
    lower.includes('placeholder') ||
    lower.includes('dummy') ||
    lower === '-'
  );
};

interface TenantDetailModalProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  houses?: House[];
  cashFlows?: CashFlow[];
  reports?: Report[];
  letters?: LetterRequest[];
  tickets?: HelpdeskTicket[];
  officials?: Official[];
  onUpdate?: (updated: Tenant) => void;
  onDelete?: (tenantId: string) => void;
}

export const TenantDetailModal: React.FC<TenantDetailModalProps> = ({
  tenant,
  isOpen,
  onClose,
  houses = [],
  cashFlows = [],
  reports = [],
  letters = [],
  tickets = [],
  officials = [],
  onUpdate,
  onDelete
}) => {
  const { updateTenant, deleteTenant, startSupervision } = useTenant();
  const [activeTab, setActiveTab] = useState<'info' | 'officials' | 'fees' | 'modules' | 'links' | 'operations'>('operations');

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState<'public' | 'register' | 'admin' | null>(null);
  const [accountTarget, setAccountTarget] = useState<OfficialAccountTarget | null>(null);

  // Keyboard Accessibility: Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Live officials computation
  const tenantOfficials = useMemo(() => {
    if (!tenant || !officials) return [];
    return officials.filter(o => matchesTenant(o.tenantId, tenant.id));
  }, [officials, tenant]);

  const liveChairman = useMemo(() => {
    return tenantOfficials.find(o => (o.role || '').toLowerCase().includes('ketua'));
  }, [tenantOfficials]);

  const liveSecretary = useMemo(() => {
    return tenantOfficials.find(o => (o.role || '').toLowerCase().includes('sekretaris'));
  }, [tenantOfficials]);

  const liveTreasurer = useMemo(() => {
    return tenantOfficials.find(o => (o.role || '').toLowerCase().includes('bendahara'));
  }, [tenantOfficials]);

  const handleCreateChairmanAccount = () => {
    if (!tenant) return;
    setAccountTarget({
      id: liveChairman?.id || `${tenant.id}-chairman`,
      name: (!isPlaceholderName(tenant.chairmanName) ? tenant.chairmanName : liveChairman?.name) || tenant.chairmanName || 'Ketua RT',
      roleTitle: 'Ketua RT',
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantRt: tenant.rt,
      kelurahan: tenant.kelurahan,
      phone: tenant.chairmanPhone || liveChairman?.phone || '',
      email: liveChairman?.email || ''
    });
  };

  const handleCreateOfficialAccount = (off: Official) => {
    if (!tenant) return;
    setAccountTarget({
      id: off.id,
      name: off.name,
      roleTitle: off.role,
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantRt: tenant.rt,
      kelurahan: tenant.kelurahan,
      phone: off.phone || '',
      email: off.email || ''
    });
  };

  const tenantHouses = useMemo(() => {
    if (!tenant || !houses) return [];
    return houses.filter(h => matchesTenant(h.tenantId, tenant.id));
  }, [houses, tenant]);

  const tenantCash = useMemo(() => {
    if (!tenant || !cashFlows) return [];
    return cashFlows.filter(c => matchesTenant(c.tenantId, tenant.id));
  }, [cashFlows, tenant]);

  const tenantReports = useMemo(() => {
    if (!tenant || !reports) return [];
    return reports.filter(r => matchesTenant(r.tenantId, tenant.id));
  }, [reports, tenant]);

  const tenantLetters = useMemo(() => {
    if (!tenant || !letters) return [];
    return letters.filter(l => matchesTenant(l.tenantId, tenant.id));
  }, [letters, tenant]);

  const tenantTickets = useMemo(() => {
    if (!tenant || !tickets) return [];
    return tickets.filter(t => matchesTenant(t.tenantId, tenant.id));
  }, [tickets, tenant]);

  // Editable Form State
  const [formData, setFormData] = useState<Partial<Tenant>>({});

  useEffect(() => {
    if (tenant) {
      const effChairman = (!isPlaceholderName(tenant.chairmanName) ? tenant.chairmanName : liveChairman?.name) || tenant.chairmanName || '';
      const effPhone = tenant.chairmanPhone || liveChairman?.phone || '';
      const effSecretary = (!isPlaceholderName(tenant.secretaryName) ? tenant.secretaryName : liveSecretary?.name) || tenant.secretaryName || '';
      const effTreasurer = (!isPlaceholderName(tenant.treasurerName) ? tenant.treasurerName : liveTreasurer?.name) || tenant.treasurerName || '';

      setFormData({
        name: tenant.name,
        chairmanName: effChairman,
        chairmanPhone: effPhone,
        secretaryName: effSecretary,
        treasurerName: effTreasurer,
        address: tenant.address,
        themeColor: tenant.themeColor || '#4F46E5',
        status: tenant.status || 'active',
        modules: {
          waterMeter: tenant.modules?.waterMeter ?? true,
          assetRental: tenant.modules?.assetRental ?? true,
          letters: tenant.modules?.letters ?? true,
          panicButton: tenant.modules?.panicButton ?? true,
          stbmSanitation: tenant.modules?.stbmSanitation ?? true,
          cctv: tenant.modules?.cctv ?? true,
        },
        fees: {
          sampahUmum: tenant.fees?.sampahUmum || 20000,
          sampahPkh: tenant.fees?.sampahPkh || 10000,
          sampahPns: tenant.fees?.sampahPns || 35000,
          kasFee: tenant.fees?.kasFee || 20000,
          airFee: tenant.fees?.airFee || 10000,
        }
      });
      setIsEditing(false);
    }
  }, [tenant, liveChairman, liveSecretary, liveTreasurer]);

  const liveStats = useMemo(() => {
    const totalDoors = tenantHouses.length;
    const occupiedDoors = tenantHouses.filter(h => h.status === 'Occupied' || h.status === 'Business').length;
    const emptyDoors = tenantHouses.filter(h => h.status === 'Empty').length;
    const paidDoors = tenantHouses.filter(h => h.paymentStatus === 'Lunas').length;
    const complianceRate = totalDoors > 0 ? Math.round((paidDoors / totalDoors) * 100) : 0;
    const population = tenantHouses.reduce((sum, h) => {
      const occ = Number(h.occupants);
      return sum + (occ > 0 ? occ : (h.headOfFamily ? 1 : 0));
    }, 0);

    const income = tenantCash
      .filter(c => c.type === 'Income' || (c.type as any) === 'income')
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const expense = tenantCash
      .filter(c => c.type === 'Expense' || (c.type as any) === 'expense')
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const balance = income - expense;

    return {
      totalDoors,
      occupiedDoors,
      emptyDoors,
      paidDoors,
      complianceRate,
      population,
      income,
      expense,
      balance
    };
  }, [tenantHouses, tenantCash]);

  if (!isOpen || !tenant) return null;

  const publicUrl = `${window.location.origin}${window.location.pathname}#/?rt=${tenant.slug || tenant.id}`;
  const registerUrl = `${window.location.origin}${window.location.pathname}#/?rt=${tenant.slug || tenant.id}#register`;

  const handleCopy = (text: string, type: 'public' | 'register') => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    toast.success('Tautan berhasil disalin ke clipboard');
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (updateTenant) {
        await updateTenant(tenant.id, formData);
      }
      setIsEditing(false);
      if (onUpdate) {
        onUpdate({ ...tenant, ...formData } as Tenant);
      }
    } catch (err: any) {
      toast.error('Gagal menyimpan perubahan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleModuleToggle = (key: keyof TenantModules) => {
    if (!isEditing) return;
    setFormData(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [key]: !prev.modules?.[key]
      }
    }));
  };

  const handleStartSupervision = () => {
    startSupervision(tenant);
    onClose();
    // Navigate to admin dashboard in supervision mode
    window.location.hash = '#/admin';
  };

  const handleDelete = async () => {
    if (tenant.id === 'tondo-rw20-rt02') {
      toast.error('Wilayah Utama RT 002 dilindungi dan tidak dapat dihapus');
      return;
    }
    const confirmName = window.prompt(`Ketik "${tenant.name}" untuk mengonfirmasi penghapusan tenant ini secara permanen:`);
    if (confirmName === tenant.name) {
      try {
        if (deleteTenant) {
          await deleteTenant(tenant.id);
        }
        if (onDelete) onDelete(tenant.id);
        onClose();
      } catch (err) {
        toast.error('Gagal menghapus tenant');
      }
    } else if (confirmName !== null) {
      toast.error('Konfirmasi nama tidak cocok, penghapusan dibatalkan');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-xs shrink-0"
              style={{ backgroundColor: formData.themeColor || tenant.themeColor || '#4f46e5' }}
            >
              {tenant.rt}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 truncate tracking-tight">
                  {tenant.name}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold">
                  {tenant.id}
                </span>
                {formData.status === 'suspended' ? (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 font-bold uppercase">
                    Suspended
                  </span>
                ) : formData.status === 'maintenance' ? (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 font-bold uppercase">
                    Maintenance
                  </span>
                ) : (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold uppercase">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">
                RW {tenant.rw} • Kel. {tenant.kelurahan}, Kec. {tenant.kecamatan}, {tenant.city}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-white flex gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('operations')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'operations'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity size={14} />
            <span>Operasional Realtime</span>
            {tenantReports.filter(r => r.status === 'Baru' || r.status === 'Diproses').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'info'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 size={14} />
            <span>Identitas & Blok</span>
          </button>
          <button
            onClick={() => setActiveTab('officials')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'officials'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User size={14} />
            <span>Pengurus Inti</span>
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'fees'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign size={14} />
            <span>Struktur Tarif</span>
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'modules'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders size={14} />
            <span>Status & Modul</span>
          </button>
          <button
            onClick={() => setActiveTab('links')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'links'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ExternalLink size={14} />
            <span>Tautan & Akses</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 0: DATA OPERASIONAL REALTIME */}
          {activeTab === 'operations' && (
            <div className="space-y-6">
              {/* 4 Precision Metric Dials */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">Pintu Terdaftar</span>
                  <div className="text-lg font-black font-mono text-slate-900 mt-0.5">
                    {liveStats.totalDoors} <span className="text-xs font-sans font-normal text-slate-500">Pintu</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">
                    {liveStats.occupiedDoors} Berpenghuni • {liveStats.emptyDoors} Kosong
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">Populasi Warga</span>
                  <div className="text-lg font-black font-mono text-indigo-600 mt-0.5">
                    {liveStats.population} <span className="text-xs font-sans font-normal text-slate-500">Jiwa</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    Sensus Kepala & Anggota Keluarga
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">Kas Bersih Riil</span>
                  <div className="text-lg font-black font-mono text-emerald-600 mt-0.5">
                    Rp {liveStats.balance.toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    +Rp {liveStats.income.toLocaleString('id-ID')} / -Rp {liveStats.expense.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">Kepatuhan Iuran</span>
                  <div className="text-lg font-black font-mono text-sky-600 mt-0.5">
                    {liveStats.complianceRate}%
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {liveStats.paidDoors} dari {liveStats.totalDoors} Pintu Lunas
                  </span>
                </div>
              </div>

              {/* 2-Column Split: Aduan Warga & Pengajuan Surat */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Citizen Reports (Aduan Warga) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <AlertOctagon size={15} className="text-rose-600" />
                      <h4 className="text-xs font-black text-slate-900">Aduan Warga Realtime</h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                      {tenantReports.filter(r => r.status === 'Baru' || r.status === 'Diproses').length} Aktif
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {tenantReports.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">Belum ada aduan warga masuk di wilayah ini</p>
                    ) : (
                      tenantReports.slice(0, 5).map(rep => (
                        <div key={rep.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 truncate max-w-[150px]">{rep.reporterName || 'Warga'}</span>
                            <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${
                              rep.status === 'Baru' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                              rep.status === 'Diproses' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                              'bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}>
                              {rep.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{rep.description}</p>
                          <div className="text-[9px] text-slate-400 font-mono flex items-center justify-between pt-0.5">
                            <span>Kategori: {rep.type}</span>
                            <span>{rep.date || 'Hari ini'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Letter Requests (Surat Pengantar Warga) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <FileText size={15} className="text-indigo-600" />
                      <h4 className="text-xs font-black text-slate-900">Permohonan Surat Pengantar</h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                      {tenantLetters.filter(l => l.status === 'Menunggu' || (l.status as any) === 'Diproses').length} Menunggu
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {tenantLetters.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">Belum ada pengajuan surat di wilayah ini</p>
                    ) : (
                      tenantLetters.slice(0, 5).map(letReq => (
                        <div key={letReq.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 truncate max-w-[150px]">{letReq.applicantName}</span>
                            <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${
                              letReq.status === 'Menunggu' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                              letReq.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                              'bg-rose-100 text-rose-800 border-rose-200'
                            }`}>
                              {letReq.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-1 font-medium">{letReq.type}</p>
                          <div className="text-[9px] text-slate-400 font-mono flex items-center justify-between pt-0.5">
                            <span>Blok / Rumah: {letReq.houseId}</span>
                            <span>NIK: {letReq.nik ? `${letReq.nik.slice(0, 6)}...` : '-'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Helpdesk Tickets for this RT */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={15} className="text-slate-700" />
                    <h4 className="text-xs font-black text-slate-900">Tiket Dukungan Teknis Wilayah</h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    Total {tenantTickets.length} Tiket
                  </span>
                </div>

                {tenantTickets.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">Tidak ada kendala sistem atau tiket bantuan terbuka untuk wilayah ini</p>
                ) : (
                  <div className="space-y-2">
                    {tenantTickets.slice(0, 3).map(tk => (
                      <div key={tk.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">{tk.title}</div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{tk.description}</p>
                        </div>
                        <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${
                          tk.status === 'open' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          tk.status === 'in_progress' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                          'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {tk.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tenant Data Backup & Archival */}

              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                    <Download size={14} className="text-indigo-600" />
                    <span>Arsip Cadangan Data RT Mandiri (.JSON)</span>
                  </h4>
                  <p className="text-[11px] text-indigo-700/80 font-medium mt-0.5">
                    Unduh snapshot lengkap ({tenantHouses.length} rumah, {tenantCash.length} kas, {tenantOfficials.length} pengurus, {tenantReports.length} laporan) untuk arsip lokal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const backupData = {
                      manifest: {
                        tenantId: tenant.id,
                        tenantName: tenant.name,
                        exportedAt: new Date().toISOString(),
                        version: '2.4.0'
                      },
                      tenant,
                      houses: tenantHouses,
                      cashFlows: tenantCash,
                      officials: tenantOfficials,
                      reports: tenantReports,
                      letters: tenantLetters,
                      tickets: tenantTickets
                    };
                    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Backup_${tenant.id}_${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success(`Arsip cadangan untuk ${tenant.name} berhasil diunduh!`);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Download size={14} />
                  <span>Unduh Arsip JSON</span>
                </button>
              </div>
            </div>
          )}


          {/* TAB 1: IDENTITAS & BLOK */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Wilayah Resmi</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  ) : (
                    <p className="text-sm font-bold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      {tenant.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Warna Tema Brand RT</label>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.themeColor || '#4f46e5'}
                        onChange={(e) => setFormData(prev => ({ ...prev, themeColor: e.target.value }))}
                        className="w-10 h-9 p-1 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.themeColor || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, themeColor: e.target.value }))}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="w-4 h-4 rounded-full shadow-2xs" style={{ backgroundColor: tenant.themeColor || '#4f46e5' }} />
                      <span className="text-xs font-mono text-slate-700 font-bold">{tenant.themeColor || '#4f46e5'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Alamat Domisili / Sekretariat</label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={formData.address || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                ) : (
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                    {tenant.address}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-2 flex items-center justify-between">
                  <span>Blok Kavling Warga ({tenant.blocks?.length || 0} Blok)</span>
                  <span className="text-[10px] text-slate-500">Estimasi ~{(tenant.blocks?.length || 0) * 20} Kavling</span>
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {tenant.blocks?.map(block => (
                    <span 
                      key={block}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700 shadow-2xs"
                    >
                      Blok {block}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PENGURUS INTI */}
          {activeTab === 'officials' && (
            <div className="space-y-4">
              {/* Akun Login Admin RT Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-white to-slate-50 border border-indigo-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                    <Key size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                        Akun Login Admin RT
                      </h4>
                      {liveChairman?.email ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                          ✓ Akun Aktif
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                          Belum Ada Akun
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {liveChairman?.email ? (
                        <>Email login terdaftar: <span className="font-mono font-bold text-indigo-700">{liveChairman.email}</span></>
                      ) : (
                        <>Wilayah RT ini belum memiliki akun login mandiri untuk masuk ke portal admin.</>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateChairmanAccount}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0 active:scale-95"
                >
                  <Key size={14} />
                  <span>{liveChairman?.email ? 'Kelola / Reset Akun' : '🔑 Buat Akun Admin RT'}</span>
                </button>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-indigo-700 uppercase tracking-wider">
                    <User size={14} />
                    <span>Ketua RT</span>
                  </div>
                  {liveChairman && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live Database RT
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Nama Lengkap</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.chairmanName || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, chairmanName: e.target.value }))}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                      />
                    ) : (
                      <p className="text-xs font-bold text-slate-900">
                        {(!isPlaceholderName(tenant.chairmanName) ? tenant.chairmanName : liveChairman?.name) || tenant.chairmanName || '-'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">No. WhatsApp</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.chairmanPhone || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, chairmanPhone: e.target.value }))}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-mono text-emerald-600 font-bold">
                          {tenant.chairmanPhone || liveChairman?.phone || '-'}
                        </p>
                        {(tenant.chairmanPhone || liveChairman?.phone) && (
                          <a
                            href={`https://wa.me/${(tenant.chairmanPhone || liveChairman?.phone || '').replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-600 hover:underline flex items-center gap-0.5 font-bold"
                          >
                            <span>Chat WA</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sekretaris RT</span>
                    {liveSecretary && (
                      <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Live DB
                      </span>
                    )}
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.secretaryName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, secretaryName: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {(!isPlaceholderName(tenant.secretaryName) ? tenant.secretaryName : liveSecretary?.name) || tenant.secretaryName || '-'}
                      </p>
                      {liveSecretary?.phone && (
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">WA: {liveSecretary.phone}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bendahara RT</span>
                    {liveTreasurer && (
                      <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Live DB
                      </span>
                    )}
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.treasurerName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, treasurerName: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {(!isPlaceholderName(tenant.treasurerName) ? tenant.treasurerName : liveTreasurer?.name) || tenant.treasurerName || '-'}
                      </p>
                      {liveTreasurer?.phone && (
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">WA: {liveTreasurer.phone}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Live Officials Roster from Firestore */}
              {tenantOfficials.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                      Struktur Aparatur Terdaftar di RT ({tenantOfficials.length} Pengurus)
                    </h5>
                    <span className="text-[10px] font-mono text-indigo-600 font-bold">Sinkron Realtime</span>
                  </div>
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white overflow-hidden">
                    {tenantOfficials.map(off => (
                      <div key={off.id} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {off.photo ? (
                            <img src={off.photo} alt={off.name} className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                              {off.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{off.name}</div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                              <span className="font-semibold text-indigo-600">{off.role}</span>
                              {off.houseId && <span>• Blok {off.houseId}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {off.phone && (
                            <a
                              href={`https://wa.me/${off.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1 shrink-0"
                            >
                              <span>{off.phone}</span>
                              <ExternalLink size={9} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCreateOfficialAccount(off)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 shrink-0 cursor-pointer ${
                              off.email 
                                ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 font-black'
                            }`}
                            title={off.email ? `Akun: ${off.email}` : "Buat Akun Login"}
                          >
                            <Key size={10} />
                            <span>{off.email ? 'Kelola Akun' : 'Buat Akun'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STRUKTUR TARIF */}
          {activeTab === 'fees' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-black text-amber-700 uppercase tracking-wider mb-3">
                  Tarif Retribusi Sampah TPS3R (Perda Kota Palu)
                </h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="block text-[10px] text-slate-500 font-bold mb-1">Umum</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.fees?.sampahUmum || 20000}
                        onChange={(e) => setFormData(prev => ({ ...prev, fees: { ...prev.fees, sampahUmum: Number(e.target.value) } }))}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono text-center"
                      />
                    ) : (
                      <span className="text-xs font-mono font-bold text-slate-900">
                        Rp {(tenant.fees?.sampahUmum || 20000).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs">
                    <span className="block text-[10px] text-emerald-700 font-bold mb-1">Penerima PKH</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.fees?.sampahPkh || 10000}
                        onChange={(e) => setFormData(prev => ({ ...prev, fees: { ...prev.fees, sampahPkh: Number(e.target.value) } }))}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono text-center"
                      />
                    ) : (
                      <span className="text-xs font-mono font-bold text-emerald-600">
                        Rp {(tenant.fees?.sampahPkh || 10000).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-purple-200 shadow-2xs">
                    <span className="block text-[10px] text-purple-700 font-bold mb-1">ASN / PNS</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.fees?.sampahPns || 35000}
                        onChange={(e) => setFormData(prev => ({ ...prev, fees: { ...prev.fees, sampahPns: Number(e.target.value) } }))}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono text-center"
                      />
                    ) : (
                      <span className="text-xs font-mono font-bold text-purple-600">
                        Rp {(tenant.fees?.sampahPns || 35000).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Iuran Kas RT</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.fees?.kasFee || 20000}
                      onChange={(e) => setFormData(prev => ({ ...prev, fees: { ...prev.fees, kasFee: Number(e.target.value) } }))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
                    />
                  ) : (
                    <p className="text-sm font-mono font-bold text-slate-900">
                      Rp {(tenant.fees?.kasFee || 20000).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tarif Dasar Air PDAM</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.fees?.airFee || 10000}
                      onChange={(e) => setFormData(prev => ({ ...prev, fees: { ...prev.fees, airFee: Number(e.target.value) } }))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
                    />
                  ) : (
                    <p className="text-sm font-mono font-bold text-slate-900">
                      Rp {(tenant.fees?.airFee || 10000).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STATUS & MODUL LAYANAN (NEW) */}
          {activeTab === 'modules' && (
            <div className="space-y-6">
              {/* Status Operasional Selector */}
              <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                  Status Operasional Tenant
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Mengatur izin akses platform secara keseluruhan untuk warga dan pengurus RT ini:
                </p>

                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, status: 'active' }))}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        formData.status === 'active'
                          ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-xs font-bold text-emerald-800">✓ Aktif Normal</span>
                      <span className="text-[10px] text-slate-500">Layanan penuh aktif untuk warga & admin.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, status: 'maintenance' }))}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        formData.status === 'maintenance'
                          ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-xs font-bold text-amber-800">⚠️ Pemeliharaan</span>
                      <span className="text-[10px] text-slate-500">Layar info maintenance ditampilkan ke publik.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, status: 'suspended' }))}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        formData.status === 'suspended'
                          ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-xs font-bold text-rose-800">⛔ Ditangguhkan</span>
                      <span className="text-[10px] text-slate-500">Akses dibekukan sementara oleh platform.</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {tenant.status === 'suspended' ? (
                      <span className="px-3 py-1 bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold font-mono">
                        ⛔ LAYANAN DITANGGUHKAN (SUSPENDED)
                      </span>
                    ) : tenant.status === 'maintenance' ? (
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold font-mono">
                        ⚠️ DALAM PEMELIHARAAN (MAINTENANCE)
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold font-mono">
                        ✓ AKTIF BEROPERASI NORMAL
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Modular Feature Flags */}
              <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                    Sakelar Modul Layanan (Feature Flags)
                  </label>
                  {isEditing && (
                    <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-bold">
                      Klik untuk aktif/nonaktif
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Sesuaikan fitur yang aktif sesuai kebutuhan fasilitas fisik masing-masing RT:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Water Meter */}
                  <div 
                    onClick={() => handleModuleToggle('waterMeter')}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isEditing ? 'cursor-pointer hover:border-slate-300' : ''
                    } ${
                      formData.modules?.waterMeter 
                        ? 'bg-white border-slate-200' 
                        : 'bg-slate-100/70 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                        <Droplets size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Meteran Air PDAM/Swadaya</span>
                        <span className="text-[10px] text-slate-500">Pencatatan kubikasi & tagihan air</span>
                      </div>
                    </div>
                    {formData.modules?.waterMeter ? (
                      <span className="text-emerald-600 text-xs font-bold">Aktif</span>
                    ) : (
                      <span className="text-slate-400 text-xs font-bold">Nonaktif</span>
                    )}
                  </div>

                  {/* Asset Rental */}
                  <div 
                    onClick={() => handleModuleToggle('assetRental')}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isEditing ? 'cursor-pointer hover:border-slate-300' : ''
                    } ${
                      formData.modules?.assetRental 
                        ? 'bg-white border-slate-200' 
                        : 'bg-slate-100/70 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Package size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Sewa & Peminjaman Aset</span>
                        <span className="text-[10px] text-slate-500">Tenda, kursi, aula & inventaris</span>
                      </div>
                    </div>
                    {formData.modules?.assetRental ? (
                      <span className="text-emerald-600 text-xs font-bold">Aktif</span>
                    ) : (
                      <span className="text-slate-400 text-xs font-bold">Nonaktif</span>
                    )}
                  </div>

                  {/* Letters */}
                  <div 
                    onClick={() => handleModuleToggle('letters')}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isEditing ? 'cursor-pointer hover:border-slate-300' : ''
                    } ${
                      formData.modules?.letters 
                        ? 'bg-white border-slate-200' 
                        : 'bg-slate-100/70 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                        <FileText size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Surat Pengantar Digital</span>
                        <span className="text-[10px] text-slate-500">Permohonan & unduh PDF instan</span>
                      </div>
                    </div>
                    {formData.modules?.letters ? (
                      <span className="text-emerald-600 text-xs font-bold">Aktif</span>
                    ) : (
                      <span className="text-slate-400 text-xs font-bold">Nonaktif</span>
                    )}
                  </div>

                  {/* Panic Button */}
                  <div 
                    onClick={() => handleModuleToggle('panicButton')}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isEditing ? 'cursor-pointer hover:border-slate-300' : ''
                    } ${
                      formData.modules?.panicButton 
                        ? 'bg-white border-slate-200' 
                        : 'bg-slate-100/70 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                        <AlertOctagon size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Tombol Panik Warga</span>
                        <span className="text-[10px] text-slate-500">Sirine darurat & notifikasi cepat</span>
                      </div>
                    </div>
                    {formData.modules?.panicButton ? (
                      <span className="text-emerald-600 text-xs font-bold">Aktif</span>
                    ) : (
                      <span className="text-slate-400 text-xs font-bold">Nonaktif</span>
                    )}
                  </div>

                  {/* STBM */}
                  <div 
                    onClick={() => handleModuleToggle('stbmSanitation')}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isEditing ? 'cursor-pointer hover:border-slate-300' : ''
                    } ${
                      formData.modules?.stbmSanitation 
                        ? 'bg-white border-slate-200' 
                        : 'bg-slate-100/70 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Activity size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Sanitasi STBM</span>
                        <span className="text-[10px] text-slate-500">Pemantauan 5 pilar kesehatan</span>
                      </div>
                    </div>
                    {formData.modules?.stbmSanitation ? (
                      <span className="text-emerald-600 text-xs font-bold">Aktif</span>
                    ) : (
                      <span className="text-slate-400 text-xs font-bold">Nonaktif</span>
                    )}
                  </div>

                  {/* CCTV */}
                  <div 
                    onClick={() => handleModuleToggle('cctv')}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isEditing ? 'cursor-pointer hover:border-slate-300' : ''
                    } ${
                      formData.modules?.cctv 
                        ? 'bg-white border-slate-200' 
                        : 'bg-slate-100/70 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Camera size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Pantauan CCTV</span>
                        <span className="text-[10px] text-slate-500">Streaming kamera keamanan</span>
                      </div>
                    </div>
                    {formData.modules?.cctv ? (
                      <span className="text-emerald-600 text-xs font-bold">Aktif</span>
                    ) : (
                      <span className="text-slate-400 text-xs font-bold">Nonaktif</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mode Supervisi CTA Card */}
              <div className="p-4.5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
                    <Eye size={15} />
                    <span>Mode Supervisi Read-Only</span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Inspeksi langsung dashboard pengurus RT ini tanpa risiko mengubah atau merusak data warga.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStartSupervision}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Eye size={14} />
                  <span>Mulai Supervisi</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: TAUTAN & AKSES */}
          {activeTab === 'links' && (
            <div className="space-y-4">
              {/* Tautan & Akun Portal Admin RT */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 border border-indigo-200/90 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                    <Key size={14} className="text-indigo-600" />
                    <span>Tautan Portal Admin RT & Kredensial</span>
                  </span>
                  {liveChairman?.email ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full">
                      Akun: {liveChairman.email}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full">
                      Belum Ada Akun Admin
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/?rt=${tenant.slug || tenant.id}#/admin`}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-mono shadow-2xs"
                  />
                  <button
                    onClick={() => handleCopy(`${window.location.origin}/?rt=${tenant.slug || tenant.id}#/admin`, 'admin')}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/20"
                  >
                    {copiedLink === 'admin' ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink === 'admin' ? 'Tersalin' : 'Salin Link'}</span>
                  </button>
                  <button
                    onClick={handleCreateChairmanAccount}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-indigo-700 font-black border border-indigo-200 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Key size={13} />
                    <span>{liveChairman?.email ? 'Kelola Akun' : 'Buat Akun'}</span>
                  </button>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Tautan Portal Publik Warga</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicUrl}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-mono shadow-2xs"
                  />
                  <button
                    onClick={() => handleCopy(publicUrl, 'public')}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/20"
                  >
                    {copiedLink === 'public' ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink === 'public' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
                    title="Buka Halaman"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Tautan Langsung Pendaftaran Warga Baru</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={registerUrl}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-mono shadow-2xs"
                  />
                  <button
                    onClick={() => handleCopy(registerUrl, 'register')}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/20"
                  >
                    {copiedLink === 'register' ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink === 'register' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              {/* Danger Zone: Delete Tenant */}
              {tenant.id !== 'tondo-rw20-rt02' && (
                <div className="mt-6 pt-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-black text-rose-800">Zona Hapus Tenant</h5>
                    <p className="text-[11px] text-rose-600">Hapus wilayah ini dari direktori platform secara permanen.</p>
                  </div>
                  <button
                    onClick={handleDelete}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Trash2 size={14} />
                    <span>Hapus Tenant</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            Didaftarkan: {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString('id-ID') : 'Default Platform'}
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save size={14} />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              >
                Tutup
              </button>
            )}
          </div>
        </div>

        {/* Account Provisioning Modal for Super Admin */}
        <CreateOfficialAccountModal
          isOpen={!!accountTarget}
          target={accountTarget}
          onClose={() => setAccountTarget(null)}
        />
      </motion.div>
    </div>
  );
};
