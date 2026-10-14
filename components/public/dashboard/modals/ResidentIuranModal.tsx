import React from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  Wallet, 
  Trash2, 
  Droplets, 
  Info, 
  Phone, 
  Receipt, 
  Printer, 
  Send 
} from 'lucide-react';
import { House, WaterMeterReading } from '../../../../types';
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';
import { WATER_PROVIDER_NAME } from '../../../../constants';

interface ResidentIuranModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAllPaid: boolean;
  currentMonth: string;
  currentHouse: House | undefined;
  totalRemainingFee: number;
  totalFee: number;
  currentHouseWasteTier: string;
  sampahFee: number;
  isPaidSampah: boolean;
  airFee: number;
  isPaidAir: boolean;
  currentWaterReading: WaterMeterReading | undefined;
  handleDownloadReceipt: () => void;
}

export const ResidentIuranModal: React.FC<ResidentIuranModalProps> = ({
  isOpen,
  onClose,
  isAllPaid,
  currentMonth,
  currentHouse,
  totalRemainingFee,
  totalFee,
  currentHouseWasteTier,
  sampahFee,
  isPaidSampah,
  airFee,
  isPaidAir,
  currentWaterReading,
  handleDownloadReceipt,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rincian & Status Tagihan Iuran Warga" maxWidth="max-w-xl">
      <div className="p-6 space-y-5">
        {/* Header Card Status Pelunasan */}
        {isAllPaid ? (
          <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-5 sm:p-6 rounded-3xl text-white shadow-xl shadow-emerald-500/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                  <CheckCircle2 size={13} className="text-emerald-200" />
                  <span>Status: Lunas Terbayar</span>
                </div>
                <p className="text-xs text-emerald-100 font-semibold">Periode {currentMonth} • Blok {currentHouse?.block}-{currentHouse?.number}</p>
                <h3 className="text-3xl font-black mt-1">Rp 0</h3>
                <p className="text-[11px] text-emerald-100/90 mt-1.5 font-medium leading-relaxed">
                  Semua kewajiban iuran lingkungan bulan ini telah terverifikasi lunas. Terima kasih atas partisipasi aktif Bapak/Ibu!
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-center justify-center p-3.5 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20">
                <ShieldCheck size={36} className="text-white" />
                <span className="text-[9px] font-black uppercase tracking-wider mt-1 text-emerald-100">Terverifikasi</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 rounded-3xl text-white shadow-xl shadow-indigo-500/10 relative overflow-hidden border border-indigo-900/50">
            <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                  <Clock size={13} />
                  <span>Menunggu Pembayaran</span>
                </div>
                <p className="text-xs text-indigo-200 font-semibold">Periode {currentMonth} • Blok {currentHouse?.block}-{currentHouse?.number}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl font-black tracking-tight">Rp {totalRemainingFee.toLocaleString('id-ID')}</h3>
                  {totalRemainingFee < totalFee && (
                    <span className="text-xs text-slate-400 line-through">Rp {totalFee.toLocaleString('id-ID')}</span>
                  )}
                </div>
                <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-bold">
                  <AlertCircle size={12} />
                  <span>Jatuh Tempo: Tgl 20 {currentMonth}</span>
                </div>
              </div>
              <div className="hidden sm:flex flex-col items-center justify-center p-3.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                <Wallet size={36} className="text-indigo-400" />
                <span className="text-[9px] font-black uppercase tracking-wider mt-1 text-slate-300">Tagihan Aktif</span>
              </div>
            </div>
          </div>
        )}

        {/* Rincian Komponen Iuran Sesuai Aturan Terbaru */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1">
            Rincian Item &amp; Regulasi Lingkungan
          </h4>

          {/* Komponen Retribusi Sampah TPS3R */}
          <div className="p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors rounded-2xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl mt-0.5">
                <Trash2 size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black text-slate-800">Retribusi Sampah TPS3R</span>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-bold">
                    Kategori: {currentHouseWasteTier}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Armada TPS3R Huntap Tondo 2 • Pengangkutan sampah terjadwal
                </p>
              </div>
            </div>
            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/50">
              <span className="text-sm font-black text-slate-900">Rp {sampahFee.toLocaleString('id-ID')}</span>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mt-1 ${
                isPaidSampah ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {isPaidSampah ? 'Lunas Terbayar' : 'Belum Bayar'}
              </span>
            </div>
          </div>

          {/* Komponen Air Bersih PDAM Kota Palu */}
          <div className="p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors rounded-2xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-sky-100 text-sky-700 rounded-xl mt-0.5">
                <Droplets size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black text-slate-800">Air Bersih ({WATER_PROVIDER_NAME})</span>
                  <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-md text-[10px] font-bold">
                    Sistem Meter Mandiri
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {airFee > 0 
                    ? 'Iuran pemeliharaan pipa / pengelolaan air lingkungan RT' 
                    : 'Resmi dikelola PDAM Kota Palu (Tarif Rp 35.000 / 10 m³). Pembayaran langsung via PDAM / loket mitra.'}
                </p>
                {currentWaterReading ? (
                  <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 bg-sky-50 border border-sky-100 rounded text-[10px] font-bold text-sky-800">
                    <CheckCircle2 size={11} className="text-sky-600" />
                    <span>Meteran Terlapor: {currentWaterReading.currentReading} m³ (Pakai: {currentWaterReading.usage} m³)</span>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">
                    💡 Catat meter air mandiri tiap akhir bulan via menu Catat Meter PDAM di dashboard.
                  </p>
                )}
              </div>
            </div>
            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/50">
              <span className="text-sm font-black text-slate-900">
                {airFee > 0 ? `Rp ${airFee.toLocaleString('id-ID')}` : 'Mandiri'}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mt-1 ${
                airFee === 0 
                  ? 'bg-sky-100 text-sky-700' 
                  : isPaidAir 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-amber-100 text-amber-700'
              }`}>
                {airFee === 0 ? 'Loket PDAM' : isPaidAir ? 'Lunas Terbayar' : 'Belum Bayar'}
              </span>
            </div>
          </div>
        </div>

        {/* Tata Cara Pembayaran Kas RT 002 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet size={14} className="text-slate-500" /> Tata Cara &amp; Metode Pembayaran
            </h4>
            <span className="text-[10px] font-black px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full uppercase tracking-wider">
              Pembayaran Tunai (Cash)
            </span>
          </div>

          {/* Opsi Tunai ke Bendahara */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-3.5">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-600/20 shrink-0 mt-0.5">
              <Wallet size={20} />
            </div>
            <div className="space-y-1">
              <h5 className="text-xs font-black text-emerald-950 uppercase tracking-wide flex items-center gap-2">
                <span>Pembayaran Tunai ke Bendahara RT 002</span>
              </h5>
              <p className="text-xs text-emerald-900/90 leading-relaxed font-medium">
                Iuran bulanan diserahkan langsung secara tunai kepada <strong>Bendahara RT 002</strong> atau <strong>Ketua RT</strong> di Sekretariat / Pos Ronda RT 002 Huntap Tondo 2.
              </p>
            </div>
          </div>

          {/* Pemberitahuan Rekening Bank */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-slate-200/70 text-slate-600 rounded-xl shrink-0 mt-0.5">
              <Info size={16} />
            </div>
            <div className="space-y-0.5 text-xs text-slate-600">
              <p className="font-bold text-slate-800">Informasi Rekening Bank Kas RT</p>
              <p className="text-[11.5px] leading-relaxed">
                Saat ini rekening kas resmi RT 002 belum tersedia / belum dibuka. Seluruh transaksi iuran lingkungan dikelola secara tunai dan dibukukan langsung ke sistem pencatatan kas RT 002.
              </p>
            </div>
          </div>

          {/* Petunjuk Koordinasi */}
          <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/70 text-xs text-amber-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-black text-[11px] text-amber-950 uppercase tracking-wide">
              <Phone size={13} className="text-amber-700" />
              <span>Koordinasi Penyerahan &amp; Konfirmasi Pembayaran</span>
            </div>
            <p className="text-[11.5px] text-amber-900/90 space-y-1 font-medium leading-relaxed">
              Untuk janjian penyerahan iuran atau konfirmasi setelah pembayaran tunai dilakukan, silakan hubungi <strong>Bendahara RT 002</strong> via WhatsApp agar status di dashboard segera diperbarui menjadi Lunas.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Button onClick={onClose} variant="outline" className="sm:w-24 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider">
            Tutup
          </Button>
          {isAllPaid && (
            <Button
              type="button"
              onClick={handleDownloadReceipt}
              className="py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Receipt size={15} />
              <span>Kwitansi PDF</span>
            </Button>
          )}
          <Button
            type="button"
            onClick={() => window.print()}
            variant="outline"
            className="sm:w-32 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider border-slate-200 hover:bg-slate-100 flex items-center justify-center gap-2"
          >
            <Printer size={15} />
            <span>Cetak Bukti</span>
          </Button>
          <Button 
            onClick={() => {
              const message = `Halo Pengurus / Bendahara RT 002 Huntap Tondo 2,

Saya ingin konfirmasi / koordinasi pembayaran iuran lingkungan:
• Periode: ${currentMonth}
• Hunian: Blok ${currentHouse?.block}-${currentHouse?.number}
• Nama Warga: ${currentHouse?.residentName || 'Warga'}
• Retribusi Sampah TPS3R (${currentHouseWasteTier}): Rp ${sampahFee.toLocaleString('id-ID')}
${airFee > 0 ? `• Iuran Air: Rp ${airFee.toLocaleString('id-ID')}\n` : ''}• Metode Pembayaran: Tunai (Cash)
• Nominal: Rp ${(totalRemainingFee > 0 ? totalRemainingFee : totalFee).toLocaleString('id-ID')}
• Status: ${isAllPaid ? 'Sudah Lunas Terbayar' : 'Ingin Menyerahkan Iuran / Konfirmasi'}

Mohon informasi waktu penyerahan atau bantuan verifikasi pencatatan status iuran. Terima kasih!`;
              window.open(`https://wa.me/6285961194621?text=${encodeURIComponent(message)}`, '_blank');
            }}
            className={`flex-1 py-3.5 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 ${
              isAllPaid 
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
            }`}
          >
            <Send size={15} />
            <span>{isAllPaid ? 'Hubungi Bendahara RT (WA)' : 'Konfirmasi / Janjian Bayar (WA)'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
