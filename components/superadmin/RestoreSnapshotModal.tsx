import React, { useState, useRef } from 'react';
import { 
  X, UploadCloud, AlertTriangle, CheckCircle2, FileText, 
  HardDrive, ShieldAlert, ArrowRight, RefreshCw, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Tenant } from '../../types';

interface RestoreSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSuccess: (snapshot: {
    tenants?: Tenant[];
    broadcasts?: any[];
    auditTrail?: any[];
    exportDate?: string;
  }) => void;
}

export const RestoreSnapshotModal: React.FC<RestoreSnapshotModalProps> = ({
  isOpen,
  onClose,
  onRestoreSuccess
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedSnapshot, setParsedSnapshot] = useState<{
    platform?: string;
    exportDate?: string;
    totalTenants?: number;
    tenants?: Tenant[];
    broadcasts?: any[];
    auditTrail?: any[];
  } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setValidationError(null);
    setParsedSnapshot(null);
    setConfirmText('');

    if (!file.name.endsWith('.json')) {
      setValidationError('Berkas harus berekstensi .json');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const json = JSON.parse(text);

        // Validation schema check
        if (!json || typeof json !== 'object') {
          throw new Error('Format JSON tidak valid');
        }
        if (!Array.isArray(json.tenants) && !Array.isArray(json.data?.tenants)) {
          throw new Error('Berkas tidak memuat data armada tenant (tenants array hilang)');
        }

        const tenants = Array.isArray(json.tenants) ? json.tenants : json.data.tenants;
        const broadcasts = Array.isArray(json.broadcasts) ? json.broadcasts : [];
        const auditTrail = Array.isArray(json.auditTrail) ? json.auditTrail : [];

        setParsedSnapshot({
          platform: json.platform || 'Teras Warga Multi-Tenant Fleet',
          exportDate: json.exportDate || json.timestamp || new Date().toISOString(),
          totalTenants: tenants.length,
          tenants,
          broadcasts,
          auditTrail
        });
      } catch (err: any) {
        setValidationError(err.message || 'Gagal memproses berkas JSON');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteRestore = async () => {
    if (!parsedSnapshot || confirmText.trim().toUpperCase() !== 'RESTORE') {
      toast.error('Ketik "RESTORE" untuk konfirmasi pemulihan');
      return;
    }

    setIsRestoring(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      onRestoreSuccess(parsedSnapshot);
      toast.success('Snapshot armada berhasil dipulihkan!');
      handleClose();
    } catch (err: any) {
      toast.error('Gagal memulihkan snapshot: ' + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setParsedSnapshot(null);
    setValidationError(null);
    setConfirmText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-800"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
              <HardDrive size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Pulihkan Cadangan Armada (Restore Snapshot)
              </h2>
              <p className="text-xs text-slate-500">
                Impor dan sinkronisasi kembali konfigurasi armada dari berkas JSON
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Warning Banner */}
          <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Perhatian Pemulihan Data:</span> Mengunggah berkas snapshot akan memperbarui direktori tenant, sakelar modul, dan riwayat platform sesuai data yang ada dalam berkas cadangan.
            </div>
          </div>

          {/* File Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-600 bg-indigo-50/50'
                : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              accept=".json,application/json"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <UploadCloud size={24} />
            </div>
            <p className="text-xs font-bold text-slate-800 mb-1">
              {selectedFile ? selectedFile.name : 'Seret berkas .JSON ke sini atau Klik untuk Telusuri'}
            </p>
            <p className="text-[11px] text-slate-500">
              Format yang didukung: Ekspor JSON Disaster Recovery Teras Warga
            </p>
          </div>

          {/* Error Message */}
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <ShieldAlert size={16} />
              <span>{validationError}</span>
            </div>
          )}

          {/* Parsed Preview */}
          {parsedSnapshot && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Struktur Snapshot Terverifikasi
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold">
                  Valid
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Armada RT</span>
                  <span className="text-sm font-black text-slate-900 font-mono">
                    {parsedSnapshot.totalTenants} Wilayah
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Waktu Cadangan</span>
                  <span className="text-[11px] font-bold text-slate-800 truncate block">
                    {new Date(parsedSnapshot.exportDate || '').toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              </div>

              {/* Safety Confirmation Input */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Ketik frasa <span className="text-rose-600 font-mono font-black">RESTORE</span> untuk konfirmasi:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Ketik RESTORE"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3">
          <button
            onClick={handleClose}
            disabled={isRestoring}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleExecuteRestore}
            disabled={!parsedSnapshot || confirmText.trim().toUpperCase() !== 'RESTORE' || isRestoring}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              parsedSnapshot && confirmText.trim().toUpperCase() === 'RESTORE' && !isRestoring
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/30'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isRestoring ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Memulihkan Data...</span>
              </>
            ) : (
              <>
                <Database size={14} />
                <span>Eksekusi Pemulihan</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
