import React, { useState, useEffect } from 'react';
import { 
  X, Building2, MapPin, User, Phone, Shield, Trash2, 
  Edit3, Save, ExternalLink, Copy, Check, Layers, 
  DollarSign, Palette, AlertTriangle, ArrowRight, ShieldCheck,
  Calendar, CheckCircle2, Sliders, Eye, ToggleLeft, ToggleRight,
  Droplets, Package, FileText, AlertOctagon, Activity, Camera,
  CheckSquare, Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Tenant, TenantStatus, TenantModules } from '../../types';
import { useTenant } from '../../context/TenantContext';
import { toast } from 'sonner';

interface TenantDetailModalProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updated: Tenant) => void;
  onDelete?: (tenantId: string) => void;
}

export const TenantDetailModal: React.FC<TenantDetailModalProps> = ({
  tenant,
  isOpen,
  onClose,
  onUpdate,
  onDelete
}) => {
  const { updateTenant, deleteTenant, startSupervision } = useTenant();
  const [activeTab, setActiveTab] = useState<'info' | 'officials' | 'fees' | 'modules' | 'links'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState<'public' | 'register' | null>(null);

  // Editable Form State
  const [formData, setFormData] = useState<Partial<Tenant>>({});

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name,
        chairmanName: tenant.chairmanName,
        chairmanPhone: tenant.chairmanPhone,
        secretaryName: tenant.secretaryName,
        treasurerName: tenant.treasurerName,
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
  }, [tenant]);

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
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-indigo-700 uppercase tracking-wider">
                  <User size={14} />
                  <span>Ketua RT</span>
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
                      <p className="text-xs font-bold text-slate-900">{tenant.chairmanName || '-'}</p>
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
                        <p className="text-xs font-mono text-emerald-600 font-bold">{tenant.chairmanPhone || '-'}</p>
                        {tenant.chairmanPhone && (
                          <a
                            href={`https://wa.me/${tenant.chairmanPhone.replace(/[^0-9]/g, '')}`}
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
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sekretaris RT</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.secretaryName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, secretaryName: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-800">{tenant.secretaryName || '-'}</p>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bendahara RT</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.treasurerName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, treasurerName: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-800">{tenant.treasurerName || '-'}</p>
                  )}
                </div>
              </div>
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
      </motion.div>
    </div>
  );
};
