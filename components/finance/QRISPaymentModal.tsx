import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, Download, CheckCircle2, Copy, ShieldCheck, 
  CreditCard, Smartphone, Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { RT_NAME } from '../../constants';

interface QRISPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  amount: number;
  description: string;
  houseId: string;
  residentName: string;
  paymentType: 'Kas RT' | 'Iuran Sampah' | 'Meter Air' | 'Kombinasi';
  onConfirmPaid?: (proofFile?: File) => void;
}

export const QRISPaymentModal: React.FC<QRISPaymentModalProps> = ({
  isOpen,
  onClose,
  title,
  amount,
  description,
  houseId,
  residentName,
  paymentType,
  onConfirmPaid,
}) => {
  const [copied, setCopied] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const invoiceNo = `INV-RT02-${Date.now().toString().slice(-6)}-${houseId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const qrisPayload = `00020101021226610014ID.LINKAJA.WWW011893600002011234567802150000000000000000303UMI51440014ID.CO.QRIS.WWW0215ID102002123456752045812530336054${amount.toString().padStart(2, '0')}.005802ID5918KAS RT 02 TONDO 26004PALU61059411862210117${invoiceNo}6304ABCD`;

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(amount.toString());
    setCopied(true);
    toast.success('Nominal berhasil disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('qris-svg-canvas');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
      }
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QRIS-${invoiceNo}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success('QRIS berhasil diunduh ke galeri!');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleConfirm = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (onConfirmPaid) {
        onConfirmPaid(proofFile || undefined);
      }
      toast.success('Konfirmasi pembayaran berhasil dikirim ke Bendahara RT!');
      onClose();
    }, 800);
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-y-auto bg-slate-900/40 backdrop-blur-xs font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-900/10 border border-slate-100 overflow-hidden flex flex-col my-8 select-none"
        >
          {/* Header Bar */}
          <div className="p-5 sm:p-6 bg-white border-b border-slate-100 text-slate-800 flex items-center justify-between relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#e8faf0] text-[#059669] rounded-2xl flex items-center justify-center border border-emerald-100/60 shadow-xs shrink-0">
                <CreditCard size={18} />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-slate-800">{title || 'Pembayaran QRIS Kas RT'}</h3>
                <p className="text-xs text-slate-400 font-bold tracking-wide">{RT_NAME} • Huntap Tondo 2</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100/80 hover:bg-slate-200/80 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh] custom-scrollbar">
            {/* Invoice & Resident Info Card */}
            <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Wajib Iuran</span>
                <span className="font-extrabold text-slate-800 block truncate max-w-[180px]">{residentName}</span>
                <span className="text-[10px] text-slate-500 font-bold block">Kavling {houseId}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">No. Invoice</span>
                <span className="font-mono font-bold text-[11px] text-indigo-600 block">{invoiceNo}</span>
                <span className="text-[9px] font-bold uppercase text-[#059669] bg-[#e8faf0] px-2.5 py-0.5 rounded-xl border border-emerald-100 block mt-0.5 shadow-2xs">
                  {paymentType}
                </span>
              </div>
            </div>

            {/* QRIS Official Card Layout */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 flex flex-col items-center text-center shadow-xs relative">
              <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-rose-600 text-base tracking-tighter italic">QRIS</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nasional</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                  <ShieldCheck size={14} className="text-[#059669]" />
                  <span>Kas Resmi RT 02</span>
                </div>
              </div>

              {/* QR Code Canvas */}
              <div className="p-3.5 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                <QRCodeSVG
                  id="qris-svg-canvas"
                  value={qrisPayload}
                  size={190}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <p className="text-xs font-black text-slate-900 uppercase tracking-wide mt-3">
                KAS TERAS WARGA RT 02
              </p>
              <p className="text-[10px] text-slate-400 font-semibold">
                NMID: ID1020021234567 • A01
              </p>

              {/* Amount Display */}
              <div className="w-full mt-4 p-3 bg-indigo-50/80 border border-indigo-100 rounded-2xl flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[9px] font-extrabold uppercase text-indigo-600 block">Total Pembayaran</span>
                  <span className="text-lg font-black text-indigo-950 font-mono">
                    Rp {amount.toLocaleString('id-ID')}
                  </span>
                </div>
                <button
                  onClick={handleCopyAmount}
                  className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-white px-2.5 py-1.5 rounded-xl border border-indigo-200 shadow-2xs hover:bg-indigo-50 transition-colors"
                >
                  {copied ? <CheckCircle2 size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copied ? 'Disalin' : 'Salin'}</span>
                </button>
              </div>

              {/* Download QR Button */}
              <button
                onClick={handleDownloadQR}
                className="w-full mt-2.5 py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Download size={13} />
                <span>Simpan Gambar QRIS</span>
              </button>
            </div>

            {/* How to Pay Guidance */}
            <div className="p-3.5 bg-sky-50/70 border border-sky-100 rounded-2xl text-[11px] text-sky-900 space-y-1.5 font-medium">
              <div className="flex items-center gap-1.5 font-black text-xs text-sky-950">
                <Smartphone size={14} className="text-sky-600" />
                <span>Cara Membayar:</span>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-600">
                Buka aplikasi e-Wallet atau M-Banking Anda (GoPay, OVO, DANA, BCA, Mandiri, BRI, dll.), lalu pilih menu <strong>Scan QRIS</strong> dan arahkan ke kode QR di atas.
              </p>
            </div>

            {/* Optional Proof of Transfer Upload */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center justify-between">
                <span>Upload Bukti Bayar (Opsional)</span>
                {proofFile && <span className="text-emerald-600 font-bold lowercase">1 file terpilih</span>}
              </label>
              <label className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl cursor-pointer bg-slate-50/50 hover:bg-slate-100/60 transition-all text-xs font-bold text-slate-600">
                <Upload size={14} className="text-indigo-600" />
                <span>{proofFile ? proofFile.name : 'Pilih Foto Bukti Transfer'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setProofFile(e.target.files[0]);
                      toast.success('Bukti bayar berhasil dilampirkan!');
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl font-bold text-xs transition-colors"
            >
              Tutup
            </button>
            <button
              disabled={isSubmitting}
              onClick={handleConfirm}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 size={15} />
              <span>{isSubmitting ? 'Memproses...' : 'Saya Sudah Bayar'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
