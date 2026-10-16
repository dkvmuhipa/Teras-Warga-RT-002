import React, { useState, useMemo } from 'react';
import { 
  Wallet, QrCode, CreditCard, CheckCircle2, AlertCircle, 
  Building2, ArrowRight, ShieldCheck, DollarSign, RefreshCw, 
  ExternalLink, Eye, Check, X, Edit3, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Tenant, TenantPaymentGatewayConfig } from '../../types';
import { toast } from 'sonner';

interface PaymentGatewayTabProps {
  tenants: Tenant[];
  onLogAudit: (action: string, category: any, targetTenantId?: string, details?: string) => void;
  onUpdateTenant?: (tenantId: string, updates: Partial<Tenant>) => Promise<void>;
}

interface TenantGatewayRecord {
  tenantId: string;
  tenantName: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  qrisStatus: 'active' | 'pending' | 'manual_cash';
  merchantNmid?: string;
  digitalRate: number; // %
}

export const PaymentGatewayTab: React.FC<PaymentGatewayTabProps> = ({
  tenants,
  onLogAudit,
  onUpdateTenant
}) => {
  // Derive records directly from live tenants in Firestore
  const records: TenantGatewayRecord[] = useMemo(() => {
    return tenants.map((t, idx) => {
      const gw = t.paymentGateway;
      const isPilot = t.id === 'tondo-rw20-rt02';
      const isSecond = idx === 1;

      return {
        tenantId: t.id,
        tenantName: t.name,
        bankName: gw?.bankName || (isPilot ? 'Bank BPD Sulteng' : isSecond ? 'Bank BRI' : 'Bank Mandiri'),
        accountNumber: gw?.accountNumber || (isPilot ? '01-02-004589-1' : isSecond ? '4512-01-008921-50-4' : '158-00-0987654-2'),
        accountHolder: gw?.accountHolder || `KAS ${t.name.toUpperCase()}`,
        qrisStatus: gw?.qrisStatus || (isPilot ? 'active' : isSecond ? 'pending' : 'active'),
        merchantNmid: gw?.merchantNmid || (isPilot ? 'ID1020260981244' : isSecond ? undefined : 'ID1020261189432'),
        digitalRate: gw?.digitalRate ?? (isPilot ? 88 : isSecond ? 45 : 72)
      };
    });
  }, [tenants]);

  // Modal edit state
  const [editingRecord, setEditingRecord] = useState<TenantGatewayRecord | null>(null);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    merchantNmid: '',
    qrisStatus: 'active' as 'active' | 'pending' | 'manual_cash'
  });

  const handleOpenEdit = (rec: TenantGatewayRecord) => {
    setEditingRecord(rec);
    setBankForm({
      bankName: rec.bankName,
      accountNumber: rec.accountNumber,
      accountHolder: rec.accountHolder,
      merchantNmid: rec.merchantNmid || '',
      qrisStatus: rec.qrisStatus
    });
  };

  const handleSaveBankForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const updatedGw: TenantPaymentGatewayConfig = {
      bankName: bankForm.bankName.trim() || 'Bank Kas RT',
      accountNumber: bankForm.accountNumber.trim() || '-',
      accountHolder: bankForm.accountHolder.trim() || `KAS ${editingRecord.tenantName}`,
      qrisStatus: bankForm.qrisStatus,
      merchantNmid: bankForm.merchantNmid.trim() || undefined,
      digitalRate: editingRecord.digitalRate
    };

    if (onUpdateTenant) {
      try {
        await onUpdateTenant(editingRecord.tenantId, { paymentGateway: updatedGw });
        toast.success(`Konfigurasi rekening kas ${editingRecord.tenantName} berhasil disimpan ke Cloud!`);
      } catch (err) {
        toast.error('Gagal memperbarui rekening kas di Cloud');
      }
    }

    onLogAudit(
      'Perbarui Rekening Kas & QRIS',
      'tariff',
      editingRecord.tenantId,
      `Rekening ${bankForm.bankName} (${bankForm.accountNumber}) diperbarui`
    );

    setEditingRecord(null);
  };

  const handleToggleStatus = async (tenantId: string) => {
    const current = records.find(r => r.tenantId === tenantId);
    if (!current) return;
    const nextStatus = current.qrisStatus === 'active' ? 'manual_cash' : 'active';
    const updatedGw: TenantPaymentGatewayConfig = {
      bankName: current.bankName,
      accountNumber: current.accountNumber,
      accountHolder: current.accountHolder,
      qrisStatus: nextStatus,
      merchantNmid: nextStatus === 'active' ? (current.merchantNmid || 'ID102026' + Math.floor(1000000 + Math.random() * 9000000)) : undefined,
      digitalRate: current.digitalRate
    };

    if (onUpdateTenant) {
      try {
        await onUpdateTenant(tenantId, { paymentGateway: updatedGw });
        toast.success(`Integrasi QRIS ${nextStatus === 'active' ? 'diaktifkan' : 'dinonaktifkan'} di Firestore`);
      } catch (e) {
        toast.error('Gagal memperbarui status gateway');
      }
    }

    onLogAudit(
      'Ubah Status Gateway QRIS',
      'tariff',
      tenantId,
      `Status QRIS diubah menjadi ${nextStatus.toUpperCase()}`
    );
  };

  // Metrics
  const activeQrisCount = records.filter(r => r.qrisStatus === 'active').length;
  const pendingCount = records.filter(r => r.qrisStatus === 'pending').length;
  const avgDigitalRate = records.length > 0 
    ? Math.round(records.reduce((acc, r) => acc + r.digitalRate, 0) / records.length) 
    : 70;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Adopsi QRIS Terintegrasi
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <QrCode size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight font-mono">
            {activeQrisCount} <span className="text-xs font-bold text-slate-500 font-sans">/ {records.length} RT</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Standar QRIS Nasional (NMID Bank Indonesia)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Menunggu Verifikasi Bank
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight font-mono">
            {pendingCount} <span className="text-xs font-bold text-slate-500 font-sans">Wilayah</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Dalam proses validasi rekening penampung
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Volume Transaksi Digital
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <Wallet size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-700 tracking-tight font-mono">
            {avgDigitalRate}% <span className="text-xs font-bold text-slate-500 font-sans">Cashless</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Meminimalkan risiko selisih kas fisik bendahara
          </p>
        </div>
      </div>

      {/* Table of Gateways */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono">
              Matriks Pengaturan QRIS & Rekening Kas RT
            </h3>
            <p className="text-[11px] text-slate-500">
              Pantauan rekening penampung kas resmi dan status sertifikasi QRIS swakelola langsung terhubung ke Firestore
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-black uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Wilayah Armada RT</th>
                <th className="py-3.5 px-4">Rekening Penampung Kas</th>
                <th className="py-3.5 px-4">Status QRIS Statis</th>
                <th className="py-3.5 px-4">NMID Merchant</th>
                <th className="py-3.5 px-4 text-center">Tingkat Digital</th>
                <th className="py-3.5 px-4 text-right">Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => (
                <tr key={r.tenantId} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-black text-slate-900">{r.tenantName}</div>
                    <span className="text-[10px] font-mono text-slate-500">ID: {r.tenantId}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800">{r.bankName}</div>
                    <div className="font-mono text-[11px] text-slate-600">{r.accountNumber}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[180px]">a.n. {r.accountHolder}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    {r.qrisStatus === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        <span>QRIS Aktif</span>
                      </span>
                    ) : r.qrisStatus === 'pending' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-mono font-bold">
                        <AlertCircle size={12} className="text-amber-600" />
                        <span>Verifikasi</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-mono font-bold">
                        <span>Kas Tunai</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-700">
                    {r.merchantNmid || <span className="text-slate-400 italic">Belum terdaftar</span>}
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-indigo-700">
                      {r.digitalRate}%
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(r)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Edit Rekening Kas"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleToggleStatus(r.tenantId)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
                      >
                        {r.qrisStatus === 'active' ? 'Nonaktifkan' : 'Aktifkan QRIS'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Bank Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Konfigurasi Kas & QRIS: {editingRecord.tenantName}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">ID: {editingRecord.tenantId}</p>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveBankForm} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Bank / Lembaga</label>
                <input
                  type="text"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  placeholder="e.g. Bank BPD Sulteng / BRI / Mandiri"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Rekening</label>
                <input
                  type="text"
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  placeholder="e.g. 01-02-004589-1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Atas Nama Rekening</label>
                <input
                  type="text"
                  value={bankForm.accountHolder}
                  onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
                  placeholder="e.g. KAS RT 002 HUNTAP TONDO 2"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NMID Merchant QRIS (Opsional)</label>
                <input
                  type="text"
                  value={bankForm.merchantNmid}
                  onChange={(e) => setBankForm({ ...bankForm, merchantNmid: e.target.value })}
                  placeholder="e.g. ID1020260981244"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status Integrasi</label>
                <select
                  value={bankForm.qrisStatus}
                  onChange={(e) => setBankForm({ ...bankForm, qrisStatus: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">QRIS Aktif (Digital Cashless)</option>
                  <option value="pending">Menunggu Verifikasi Bank</option>
                  <option value="manual_cash">Kas Tunai Manual</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Save size={13} />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
