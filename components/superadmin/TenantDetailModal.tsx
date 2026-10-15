import React, { useState, useEffect } from 'react';
import { 
  X, Building2, MapPin, User, Phone, Shield, Trash2, 
  Edit3, Save, ExternalLink, Copy, Check, Layers, 
  DollarSign, Palette, AlertTriangle, ArrowRight, ShieldCheck,
  Calendar, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Tenant } from '../../types';
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
  const { updateTenant, deleteTenant } = useTenant();
  const [activeTab, setActiveTab] = useState<'info' | 'officials' | 'fees' | 'links'>('info');
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
  const registerUrl = `${window.location.origin}${window.location.pathname}#/register?rt=${tenant.slug || tenant.id}`;

  const handleCopy = (text: string, type: 'public' | 'register') => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    toast.success('Tautan disalin ke clipboard');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-lg shrink-0"
              style={{ backgroundColor: formData.themeColor || tenant.themeColor || '#4f46e5' }}
            >
              {tenant.rt}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white truncate tracking-tight">
                  {tenant.name}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-950 border border-indigo-500/30 text-indigo-300">
                  {tenant.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                RW {tenant.rw} • Kel. {tenant.kelurahan}, Kec. {tenant.kecamatan}, {tenant.city}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-800 bg-slate-900/40 flex gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'info'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 size={14} />
            <span>Identitas & Blok</span>
          </button>
          <button
            onClick={() => setActiveTab('officials')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'officials'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User size={14} />
            <span>Pengurus Inti</span>
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'fees'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign size={14} />
            <span>Struktur Tarif Iuran</span>
          </button>
          <button
            onClick={() => setActiveTab('links')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'links'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ExternalLink size={14} />
            <span>Tautan & Akses</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Nama Wilayah Resmi</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-sm font-bold text-white bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      {tenant.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Warna Tema Brand RT</label>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.themeColor || '#4f46e5'}
                        onChange={(e) => setFormData(prev => ({ ...prev, themeColor: e.target.value }))}
                        className="w-10 h-9 p-1 rounded-xl bg-slate-950 border border-slate-700 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.themeColor || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, themeColor: e.target.value }))}
                        className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: tenant.themeColor || '#4f46e5' }} />
                      <span className="text-xs font-mono text-slate-300">{tenant.themeColor || '#4f46e5'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Alamat Domisili / Sekretariat</label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={formData.address || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
                    {tenant.address}
                  </p>
                )}
              </div>

              {/* Block Coverage Overview */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-2 flex items-center justify-between">
                  <span>Blok Kavling Warga ({tenant.blocks?.length || 0} Blok)</span>
                  <span className="text-[10px] text-slate-500">Estimasi ~{(tenant.blocks?.length || 0) * 20} Kavling</span>
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  {tenant.blocks?.map(block => (
                    <span 
                      key={block}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-mono font-bold text-slate-200"
                    >
                      Blok {block}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'officials' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-indigo-400 uppercase tracking-wider">
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
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    ) : (
                      <p className="text-xs font-bold text-white">{tenant.chairmanName || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">No. WhatsApp</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.chairmanPhone || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, chairmanPhone: e.target.value }))}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-mono text-emerald-400">{tenant.chairmanPhone || '-'}</p>
                        {tenant.chairmanPhone && (
                          <a
                            href={`https://wa.me/${tenant.chairmanPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5"
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
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sekretaris RT</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.secretaryName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, secretaryName: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-200">{tenant.secretaryName || '-'}</p>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bendahara RT</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.treasurerName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, treasurerName: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-200">{tenant.treasurerName || '-'}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fees' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-3">
                  Tarif Retribusi Sampah TPS3R (Perda Kota Palu)
                </h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="block text-[10px] text-slate-400 font-bold mb-1">Umum</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.fees?.sampahUmum || 20000}
                        onChange={(e) => setFormData(prev => ({ ...prev, fees: { ...prev.fees, sampahUmum: Number(e.target.value) } }))}
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono text-center"
                      />
                    ) : (
                      <span className="text-xs font-mono font-bold text-white">
                        Rp {(tenant.fees?.sampahUmum || 20000).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="block text-[10px] text-slate-400 font-bold mb-1">Penerima PKH</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.fees?.sampahPkh || 10000}
                        onChange={(e) => setFormData(prev => ({ ...prev, fees: { ...prev.fees, sampahPkh: Number(e.target.value) } }))}
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono text-center"
                      />
                    ) : (
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        Rp {(tenant.fees?.sampahPkh || 10000).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="block text-[10px] text-slate-400 font-bold mb-1">ASN / PNS</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.fees?.sampahPns || 35000}
                        onChange={(e) => setFormData(prev => ({ ...prev, fees: { ...prev.fees, sampahPns: Number(e.target.value) } }))}
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono text-center"
                      />
                    ) : (
                      <span className="text-xs font-mono font-bold text-sky-400">
                        Rp {(tenant.fees?.sampahPns || 35000).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Iuran Kas RT</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.fees?.kasFee || 20000}
                      onChange={(e) => setFormData(prev => ({ ...prev, fees: { ...prev.fees, kasFee: Number(e.target.value) } }))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
                    />
                  ) : (
                    <p className="text-sm font-mono font-bold text-white">
                      Rp {(tenant.fees?.kasFee || 20000).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tarif Dasar Air PDAM</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.fees?.airFee || 10000}
                      onChange={(e) => setFormData(prev => ({ ...prev, fees: { ...prev.fees, airFee: Number(e.target.value) } }))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
                    />
                  ) : (
                    <p className="text-sm font-mono font-bold text-white">
                      Rp {(tenant.fees?.airFee || 10000).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'links' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 block">Tautan Portal Publik Warga</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicUrl}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono"
                  />
                  <button
                    onClick={() => handleCopy(publicUrl, 'public')}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLink === 'public' ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink === 'public' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                    title="Buka Halaman"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 block">Tautan Langsung Pendaftaran Warga Baru</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={registerUrl}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono"
                  />
                  <button
                    onClick={() => handleCopy(registerUrl, 'register')}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLink === 'register' ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink === 'register' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              {/* Danger Zone: Delete Tenant */}
              {tenant.id !== 'tondo-rw20-rt02' && (
                <div className="mt-6 pt-5 border-t border-rose-950/50 p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-black text-rose-300">Zona Hapus Tenant</h5>
                    <p className="text-[11px] text-rose-400/80">Hapus wilayah ini dari direktori platform secara permanen.</p>
                  </div>
                  <button
                    onClick={handleDelete}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
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
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Didaftarkan: {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString('id-ID') : 'Default'}
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save size={14} />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
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
