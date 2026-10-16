import React, { useState } from 'react';
import { AlertTriangle, User, Home, Lock, Eye, EyeOff, Phone, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Report } from '../../../types';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { addReportToDb, validateResidentAccess, formatHouseId } from '../../../services/databaseService';
import { useTenant } from '../../../context/TenantContext';

interface QuickReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickReportModal: React.FC<QuickReportModalProps> = ({ isOpen, onClose }) => {
  const { currentTenant } = useTenant();
  const [reportForm, setReportForm] = useState({
    type: 'Keamanan' as Report['type'],
    description: '',
    reporterName: '',
    reporterHouseId: '',
    reporterPhone: '',
    pin: ''
  });
  const [showPin, setShowPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check rate limit / brute-force lockout
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingSec = Math.ceil((lockoutUntil - Date.now()) / 1000);
      toast.error(`Terlalu banyak percobaan PIN salah. Mohon tunggu ${remainingSec} detik lagi.`);
      return;
    }

    if (!reportForm.description.trim() || !reportForm.reporterName.trim() || !reportForm.reporterHouseId.trim() || !reportForm.pin.trim()) {
      toast.error("Mohon lengkapi semua bidang yang bertanda bintang (*)");
      return;
    }

    setIsSubmitting(true);
    try {
      const isValid = await validateResidentAccess(reportForm.reporterHouseId, reportForm.pin);
      if (!isValid) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);

        if (nextAttempts >= 3) {
          const lockoutTime = Date.now() + 30000; // 30 seconds lockout
          setLockoutUntil(lockoutTime);
          toast.error("Verifikasi Gagal 3x!", {
            description: "Akses dibekukan sementara selama 30 detik untuk keamanan warga."
          });
        } else {
          toast.error("Verifikasi Gagal!", {
            description: `Kode Akses Rumah (PIN) tidak valid. Sisa percobaan: ${3 - nextAttempts}`
          });
        }
        setIsSubmitting(false);
        return;
      }

      // Reset failed attempts on success
      setFailedAttempts(0);
      setLockoutUntil(null);

      const formattedHouseId = formatHouseId(reportForm.reporterHouseId);
      const { pin, ...reportData } = reportForm;

      await addReportToDb({
        ...reportData,
        tenantId: currentTenant.id,
        reporterHouseId: formattedHouseId,
        date: new Date().toISOString(),
        status: 'Baru'
      });

      toast.success("Laporan berhasil dikirim!", {
        description: `Terima kasih atas laporannya. Pengurus ${currentTenant.name} akan segera menindaklanjuti.`
      });

      onClose();
      setReportForm({
        type: 'Keamanan',
        description: '',
        reporterName: '',
        reporterHouseId: '',
        reporterPhone: '',
        pin: ''
      });
    } catch (error) {
      toast.error("Gagal mengirim laporan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Aspirasi & Pengaduan Warga" maxWidth="max-w-xl">
      <div className="p-6">
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-6 flex gap-3">
          <div className="p-2 bg-rose-100 text-rose-600 rounded-xl h-fit">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-rose-900 uppercase tracking-tight">Layanan Aspirasi &amp; Pengaduan</h4>
            <p className="text-xs text-rose-700 font-medium leading-relaxed">
              Gunakan formulir ini untuk melaporkan kendala keamanan, kebersihan, fasilitas, atau menyampaikan aspirasi untuk lingkungan {currentTenant.name}.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="report-category" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Kategori Laporan/Aspirasi
              </label>
              <select 
                id="report-category"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                value={reportForm.type}
                onChange={e => setReportForm({ ...reportForm, type: e.target.value as any })}
              >
                <option value="Keamanan">Keamanan</option>
                <option value="Kebersihan">Kebersihan</option>
                <option value="Fasilitas">Fasilitas</option>
                <option value="Sosial">Sosial</option>
                <option value="Aspirasi/Saran">Aspirasi/Saran</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="report-name" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Nama Pelapor <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  id="report-name"
                  type="text" 
                  placeholder="Nama Lengkap"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  value={reportForm.reporterName}
                  onChange={e => setReportForm({ ...reportForm, reporterName: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="report-house" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                No. Rumah Pelapor <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Home size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  id="report-house"
                  type="text" 
                  placeholder="Contoh: C10-08"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  value={reportForm.reporterHouseId}
                  onChange={e => setReportForm({ ...reportForm, reporterHouseId: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="report-pin" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                PIN Akses Rumah <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  id="report-pin"
                  type={showPin ? "text" : "password"} 
                  placeholder="••••••"
                  className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  value={reportForm.pin}
                  onChange={e => setReportForm({ ...reportForm, pin: e.target.value })}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="report-phone" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              No. WhatsApp Pelapor
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                id="report-phone"
                type="text" 
                placeholder="0812..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                value={reportForm.reporterPhone}
                onChange={e => setReportForm({ ...reportForm, reporterPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="report-desc" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Deskripsi Laporan / Aspirasi <span className="text-rose-500">*</span>
            </label>
            <textarea 
              id="report-desc"
              rows={4}
              placeholder="Jelaskan secara detail masalah atau saran Anda..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none"
              value={reportForm.description}
              onChange={e => setReportForm({ ...reportForm, description: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest cursor-pointer"
              onClick={onClose}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-[2] py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-100 cursor-pointer"
            >
              {isSubmitting ? 'Mengirim...' : (
                <span className="flex items-center gap-2">
                  <Send size={16} /> Kirim Laporan/Aspirasi
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
