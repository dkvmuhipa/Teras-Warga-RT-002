import React from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { 
  Droplets, 
  Sparkles, 
  CheckCircle2, 
  Check, 
  Download, 
  Clock, 
  CreditCard, 
  Users, 
  Store, 
  AlertTriangle, 
  Info, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Home, 
  Shield, 
  Calendar, 
  Briefcase, 
  GraduationCap, 
  Heart, 
  Globe, 
  Activity, 
  DollarSign, 
  MapPin, 
  User, 
  History, 
  Printer, 
  FileText 
} from 'lucide-react';
import { House, LetterRequest, Report, GuestReport, UpdateRequest, WaterMeterReading, WaterUtilitySettings } from '../../../../types';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { NotificationToggle } from '../../../PushNotificationManager';
import { generateSuratPengantar } from '../../../../services/pdfService';
import { DashboardActiveTab, CitizenTier } from '../types';

interface ResidentEidTabProps {
  currentHouse: House | undefined;
  selectedHouseId: string;
  currentWaterReading: WaterMeterReading | undefined;
  waterUtilityConfig: WaterUtilitySettings;
  currentMonth: string;
  letters: LetterRequest[];
  reports: Report[];
  guestReports: GuestReport[];
  updateRequests: UpdateRequest[];
  pdfConfig: any;
  isAllPaid: boolean;
  isMandatory: boolean;
  totalRemainingFee: number;
  currentHouseWasteTier: string;
  sampahFee: number;
  airFee: number;
  pendingLettersCount: number;
  activeReportsCount: number;
  maleCount: number;
  femaleCount: number;
  currentPoints: number;
  citizenTier: CitizenTier;
  showPin: boolean;
  setShowPin: React.Dispatch<React.SetStateAction<boolean>>;
  showFullNiks: Record<string, boolean>;
  toggleNikVisibility: (id: string) => void;
  formatSensitiveNik: (nik: string, isVisible: boolean) => string;
  handleCopyToClipboard: (text: string, type: 'pin' | 'houseId') => void;
  setIsWaterModalOpen: (open: boolean) => void;
  setIsIuranModalOpen: (open: boolean) => void;
  setIsUpdateModalOpen: (open: boolean) => void;
  setActiveTab: (tab: DashboardActiveTab) => void;
}

export const ResidentEidTab: React.FC<ResidentEidTabProps> = ({
  currentHouse,
  selectedHouseId,
  currentWaterReading,
  waterUtilityConfig,
  currentMonth,
  letters,
  reports,
  guestReports,
  updateRequests,
  pdfConfig,
  isAllPaid,
  isMandatory,
  totalRemainingFee,
  currentHouseWasteTier,
  sampahFee,
  airFee,
  pendingLettersCount,
  activeReportsCount,
  maleCount,
  femaleCount,
  currentPoints,
  citizenTier,
  showPin,
  setShowPin,
  showFullNiks,
  toggleNikVisibility,
  formatSensitiveNik,
  handleCopyToClipboard,
  setIsWaterModalOpen,
  setIsIuranModalOpen,
  setIsUpdateModalOpen,
  setActiveTab
}) => {
  return (
    <motion.div 
      key="eid"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* 1. Water Meter Action Reminder Banner */}
      {!currentWaterReading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-white/10"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white shrink-0 border border-white/20 shadow-inner">
              <Droplets size={24} className="text-sky-200 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[9px] font-black uppercase tracking-wider mb-1">
                <Sparkles size={11} className="text-amber-300" />
                <span>Pengingat Pencatatan Mandiri</span>
              </div>
              <h5 className="text-sm sm:text-base font-black text-white tracking-tight">
                Meteran Air PDAM Periode {currentMonth} Belum Dilaporkan
              </h5>
              <p className="text-xs text-sky-100/90 mt-0.5 font-medium leading-relaxed">
                Stand meteran air bulan ini belum dicatat. Mohon laporkan angka &amp; foto fisik meteran sebelum tanggal <strong>{waterUtilityConfig.readingDueDate || 20} {currentMonth}</strong>.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => setIsWaterModalOpen(true)}
            className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-sky-50 text-blue-900 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-black/10 shrink-0 transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Catat Meter Sekarang</span>
            <span>→</span>
          </Button>
        </motion.div>
      )}

      {/* 2. Approved Letter Notification Banner */}
      {(() => {
        const approvedLetter = letters.find(l => l.status === 'Disetujui' || l.status === 'Approved');
        if (approvedLetter) {
          return (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl shadow-emerald-600/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-white/10"
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white shrink-0 border border-white/20 shadow-inner">
                  <CheckCircle2 size={24} className="text-emerald-200" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[9px] font-black uppercase tracking-wider mb-1">
                    <Check size={11} className="text-emerald-200 stroke-[3]" />
                    <span>Surat Pengantar Siap Diunduh</span>
                  </div>
                  <h5 className="text-sm sm:text-base font-black text-white tracking-tight">
                    {approvedLetter.type} Telah Disetujui Ketua RT
                  </h5>
                  <p className="text-xs text-emerald-100/90 mt-0.5 font-medium leading-relaxed">
                    No. Registrasi: <strong className="font-mono bg-black/20 px-1.5 py-0.5 rounded">{approvedLetter.letterNumber || '-'}</strong> • Dilengkapi sandi QR autentikasi resmi RT 002.
                  </p>
                </div>
              </div>
              <div className="flex w-full sm:w-auto items-center gap-2">
                <Button
                  type="button"
                  onClick={async () => {
                    try {
                      await generateSuratPengantar(approvedLetter, pdfConfig, false);
                      toast.success('Surat Pengantar resmi berhasil diunduh!');
                    } catch (err) {
                      console.error(err);
                      toast.error('Gagal mengunduh berkas PDF Surat Pengantar.');
                    }
                  }}
                  className="flex-1 sm:flex-initial px-5 py-3 bg-white hover:bg-emerald-50 text-emerald-950 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-black/10 shrink-0 transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download size={15} />
                  <span>Unduh PDF</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveTab('letters')}
                  variant="outline"
                  className="px-3.5 py-3 bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                  title="Lihat Rincian Timeline"
                >
                  <Clock size={15} />
                </Button>
              </div>
            </motion.div>
          );
        }
        return null;
      })()}

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        {/* Card 1: Iuran */}
        <motion.div 
          whileHover={{ y: -3 }}
          onClick={() => setIsIuranModalOpen(true)}
          className={`p-6 rounded-[2rem] border cursor-pointer transition-all ${
            isAllPaid 
              ? 'bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white border-emerald-200/80 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100/30' 
              : (isMandatory ? 'bg-gradient-to-br from-rose-50/70 via-red-50/40 to-white border-rose-200/80 hover:border-rose-300 hover:shadow-lg hover:shadow-rose-100/30' : 'bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-white border-amber-200/80 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100/30')
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${
              isAllPaid ? 'bg-emerald-500/10 text-emerald-600' : (isMandatory ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600')
            }`}>
              <CreditCard size={20} />
            </div>
            <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
              isAllPaid 
                ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30' 
                : (isMandatory ? 'bg-rose-500/20 text-rose-700 border-rose-500/30' : 'bg-amber-500/20 text-amber-700 border-amber-500/30')
            }`}>
              {isAllPaid ? '✓ Lunas' : (isMandatory ? '⚠ Lewat Tempo' : 'Tagihan Baru')}
            </span>
          </div>
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Iuran Kas RT ({currentMonth})</h4>
          <p className="text-xl font-black text-slate-800">
            {isAllPaid ? 'Lunas Terbayar' : `Rp ${totalRemainingFee.toLocaleString('id-ID')}`}
          </p>
          <p className="text-[11px] text-slate-500 font-semibold mt-1 truncate">
            Sampah ({currentHouseWasteTier}): Rp {sampahFee.toLocaleString('id-ID')} {airFee > 0 ? `• Air Rp ${airFee.toLocaleString('id-ID')}` : '• Air PDAM Palu'}
          </p>
          <p className="text-[10px] text-indigo-600 font-bold mt-2 flex items-center gap-1">
            Rincian &amp; Konfirmasi Bayar →
          </p>
        </motion.div>

        {/* Card 2: Meter Air Mandiri */}
        <motion.div 
          whileHover={{ y: -3 }}
          onClick={() => setActiveTab('water')}
          className="p-6 rounded-[2rem] bg-gradient-to-br from-cyan-50/70 via-blue-50/40 to-white border border-cyan-200/80 hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-100/30 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-cyan-500/10 text-cyan-600 rounded-2xl">
              <Droplets size={20} />
            </div>
            <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
              currentHouse?.pdamStatus === 'Hilang'
                ? 'bg-purple-50 text-purple-700 border-purple-300 ring-2 ring-purple-500/10 animate-pulse'
                : (currentHouse?.pdamStatus || 'Terpasang') === 'Belum Terpasang'
                ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/10 animate-pulse'
                : currentWaterReading 
                  ? (currentWaterReading.status === 'Terverifikasi' 
                      ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-700 border-amber-500/30')
                  : 'bg-rose-500/20 text-rose-700 border-rose-500/30'
            }`}>
              {currentHouse?.pdamStatus === 'Hilang'
                ? '🚨 Meteran Hilang'
                : (currentHouse?.pdamStatus || 'Terpasang') === 'Belum Terpasang'
                ? 'Belum Ada Meteran'
                : currentWaterReading ? (currentWaterReading.status === 'Terverifikasi' ? '✓ Sah' : 'Menunggu') : 'Belum Catat'}
            </span>
          </div>
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Meter Air Mandiri</h4>
          <p className="text-xl font-black text-slate-800">
            {currentHouse?.pdamStatus === 'Hilang'
              ? 'Penggantian Unit'
              : (currentHouse?.pdamStatus || 'Terpasang') === 'Belum Terpasang'
              ? 'Menunggu PDAM'
              : currentWaterReading ? `${currentWaterReading.usage} m³ • Rp ${currentWaterReading.totalAmount.toLocaleString('id-ID')}` : 'Catat Pemakaian'}
          </p>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            {currentWaterReading ? `Angka: ${currentWaterReading.currentReading} m³ (${waterUtilityConfig.providerName || 'PDAM'})` : `Batas input: Tgl ${waterUtilityConfig.readingDueDate || 20} ${currentMonth}`}
          </p>
          <p className="text-[10px] text-cyan-700 font-bold mt-2 flex items-center gap-1">
            Buka Portal Meter Air →
          </p>
        </motion.div>

        {/* Card 3: Pengajuan Aktif */}
        <motion.div 
          whileHover={{ y: -3 }}
          onClick={() => {
            if (pendingLettersCount > 0) setActiveTab('letters');
            else setActiveTab('reports');
          }}
          className="p-6 rounded-[2rem] bg-gradient-to-br from-indigo-50/40 via-violet-50/20 to-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/20 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <FileText size={20} />
            </div>
            {pendingLettersCount + activeReportsCount > 0 ? (
              <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-200">
                {pendingLettersCount + activeReportsCount} Berkas Aktif
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-200">
                Semua Beres
              </span>
            )}
          </div>
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Administrasi &amp; Aduan</h4>
          <p className="text-xl font-black text-slate-800">
            {pendingLettersCount} Surat • {activeReportsCount} Aduan
          </p>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            Total {letters.length} Pengantar diajukan • {reports.length} Laporan
          </p>
          <p className="text-[10px] text-indigo-600 font-bold mt-2 flex items-center gap-1">
            Lacak Perkembangan Berkas →
          </p>
        </motion.div>

        {/* Card 4: Profil Demografi */}
        <motion.div 
          whileHover={{ y: -3 }}
          onClick={() => setActiveTab('update')}
          className="p-6 rounded-[2rem] bg-gradient-to-br from-emerald-50/40 via-teal-50/20 to-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100/20 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Users size={20} />
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-200/60">
              {currentHouse?.isVerified ? '✓ Valid' : 'Cek KK'}
            </span>
          </div>
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Anggota KK &amp; Armada</h4>
          <p className="text-xl font-black text-slate-800">
            {currentHouse?.occupants || 0} Jiwa ({maleCount} L / {femaleCount} P)
          </p>
          <p className="text-[11px] text-slate-500 font-semibold mt-1 truncate">
            {(currentHouse?.twoWheelCount || 0) + (currentHouse?.fourWheelCount || 0) > 0 
              ? `${currentHouse?.twoWheelCount || 0} Motor • ${currentHouse?.fourWheelCount || 0} Mobil` 
              : `${currentHouse?.vehicleCount || 0} Kendaraan terdaftar`}
          </p>
          <p className="text-[10px] text-emerald-700 font-bold mt-2 flex items-center gap-1">
            Pembaruan Data Mandiri →
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* E-ID Smart Card */}
        <div className="lg:col-span-2">
          <motion.div 
            whileHover={{ y: -4, scale: 1.005 }}
            className="relative group overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white border border-indigo-400/40 hover:border-indigo-300 shadow-[0_25px_60px_rgba(79,70,229,0.3)] rounded-[2.5rem] p-0 min-h-[380px] transition-all id-card-printable"
          >
            {/* Holographic Sheen Animated Light Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
            
            <div className="relative h-full flex flex-col p-8 md:p-12 justify-between">
              {/* Card Top Row: EMV Chip & Hologram Seal */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-wider mb-2.5 backdrop-blur-md border border-white/20 text-cyan-200">
                    <ShieldCheck size={12} className="text-emerald-400" />
                    <span>E-ID RESMI • HUNTAP TONDO 2</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black tracking-tight uppercase whitespace-nowrap">Kartu Warga Digital</h3>
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] text-indigo-300/80">Rukun Tetangga 002 / RW 020 • Tondo</p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Gold EMV Chip Simulation */}
                  <div className="w-12 h-9 rounded-md bg-gradient-to-tr from-amber-300 via-yellow-200 to-amber-400 border border-amber-300/80 shadow-md relative overflow-hidden flex items-center justify-center shrink-0">
                    <div className="w-full h-[1px] bg-amber-700/40 absolute top-1/2 -translate-y-1/2" />
                    <div className="h-full w-[1px] bg-amber-700/40 absolute left-1/3" />
                    <div className="h-full w-[1px] bg-amber-700/40 absolute right-1/3" />
                    <div className="w-4 h-3 rounded-xs border border-amber-700/50 bg-amber-300/40 z-10" />
                  </div>

                  <div className="w-12 h-12 md:w-14 md:h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shrink-0 shadow-lg">
                    <Home size={28} className="text-white/90" />
                  </div>
                </div>
              </div>

              {/* Card Middle: Citizen Details */}
              <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-8 mt-auto">
                <div className="space-y-4 text-left w-full md:w-auto">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300/80 mb-0.5">Kepala Keluarga / Penghuni Utama</p>
                    <p className="text-2xl md:text-3.5xl font-black tracking-tight text-white">{currentHouse?.headOfFamily}</p>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                      NIK: {formatSensitiveNik(currentHouse?.nik || '', !!showFullNiks['nik'])}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 md:gap-8">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300/80 mb-1">ID Hunian</p>
                      <span 
                        onClick={() => currentHouse?.id && handleCopyToClipboard(currentHouse.id, 'houseId')}
                        className="text-lg md:text-xl font-black hover:text-indigo-200 hover:underline cursor-pointer flex items-center gap-1.5 text-amber-300"
                        title="Klik untuk salin ID Rumah"
                      >
                        Blok {currentHouse?.block}-{currentHouse?.number}
                      </span>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300/80 mb-1">Status Iuran ({currentMonth})</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        isAllPaid 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                        : (isMandatory ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')
                      }`}>
                        {isAllPaid ? '✓ Lunas' : (isMandatory ? '⚠ Wajib Bayar' : 'Tagihan Baru')}
                      </span>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300/80 mb-1">Poin Keaktifan</p>
                      <span 
                        onClick={() => setActiveTab('points')}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-white/15 text-amber-300 border-white/20 cursor-pointer hover:bg-white/25 transition-all"
                      >
                        <Sparkles size={11} /> {currentPoints} Pts ({citizenTier.badge})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Barcode & Security Stamp */}
                <div className="bg-white p-3.5 rounded-2xl shadow-2xl self-start md:self-auto flex-shrink-0 animate-fade-in text-center">
                  <QRCodeSVG 
                    value={`RESIDENT:${selectedHouseId}`} 
                    size={105} 
                    level="H"
                    includeMargin={false}
                  />
                  <div style={{ display: 'none' }}>
                    <QRCodeCanvas 
                      id="resident-qrcode-canvas"
                      value={`RESIDENT:${selectedHouseId}`} 
                      size={256}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-[8px] font-black tracking-widest uppercase text-slate-500 mt-2">Scan QR Warga</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* E-ID Card Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Button
              onClick={() => {
                window.print();
              }}
              className="py-3 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Printer size={15} /> Cetak Kartu Warga Fisik
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                try {
                  const canvas = document.createElement('canvas');
                  canvas.width = 1012;
                  canvas.height = 638;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) throw new Error('Canvas context not available');

                  ctx.beginPath();
                  if (ctx.roundRect) ctx.roundRect(0, 0, 1012, 638, 48);
                  else ctx.rect(0, 0, 1012, 638);
                  ctx.clip();

                  const gradient = ctx.createLinearGradient(0, 0, 1012, 638);
                  gradient.addColorStop(0, '#1e1b4b');
                  gradient.addColorStop(0.5, '#312e81');
                  gradient.addColorStop(1, '#0f172a');
                  ctx.fillStyle = gradient;
                  ctx.fillRect(0, 0, 1012, 638);

                  ctx.fillStyle = '#ffffff';
                  ctx.font = '900 36px system-ui, -apple-system, sans-serif';
                  ctx.textAlign = 'left';
                  ctx.fillText('KARTU WARGA DIGITAL', 80, 150);

                  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
                  ctx.fillText('RUKUN TETANGGA 002 / RW 020 • TONDO', 80, 185);

                  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                  ctx.font = '900 12px system-ui, -apple-system, sans-serif';
                  ctx.fillText('NAMA KEPALA KELUARGA / PENGHUNI', 80, 290);

                  ctx.fillStyle = '#ffffff';
                  ctx.font = '900 38px system-ui, -apple-system, sans-serif';
                  ctx.fillText((currentHouse?.headOfFamily || 'Warga RT 02').toUpperCase(), 80, 345);

                  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                  ctx.font = '900 12px system-ui, -apple-system, sans-serif';
                  ctx.fillText('NOMOR HUNIAN AKTIF', 80, 435);

                  ctx.fillStyle = '#ffffff';
                  ctx.font = '900 28px system-ui, -apple-system, sans-serif';
                  ctx.fillText(`BLOK ${currentHouse?.block}-${currentHouse?.number}`, 80, 480);

                  const qrCanvas = document.getElementById('resident-qrcode-canvas') as HTMLCanvasElement;
                  if (qrCanvas) {
                    ctx.fillStyle = '#ffffff';
                    if (ctx.roundRect) ctx.roundRect(660, 140, 272, 318, 32);
                    else ctx.rect(660, 140, 272, 318);
                    ctx.fill();
                    ctx.drawImage(qrCanvas, 696, 172, 200, 200);
                  }

                  const dataUrl = canvas.toDataURL('image/png');
                  const link = document.createElement('a');
                  link.download = `E-ID_RT02_Blok_${currentHouse?.block || 'RT'}_${currentHouse?.number || '02'}.png`;
                  link.href = dataUrl;
                  link.click();
                  toast.success('Kartu E-ID Berhasil Diunduh!');
                } catch (e) {
                  toast.error('Gagal mengunduh kartu E-ID');
                }
              }}
              className="py-3 px-5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              <Download size={15} /> Unduh Gambar PNG
            </Button>
          </div>
        </div>

        {/* Quick Info Sidebar */}
        <div className="space-y-6 text-left">
          {/* Iuran Warning */}
          {!isAllPaid && (
            <div className={`p-6 rounded-[2rem] border-2 ${isMandatory ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'}`}>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className={`p-3.5 rounded-2xl shadow-sm shrink-0 ${isMandatory ? 'bg-white text-rose-600' : 'bg-white text-amber-600'}`}>
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1">
                  <h4 className={`text-sm font-black uppercase tracking-widest mb-1 ${isMandatory ? 'text-rose-900' : 'text-amber-900'}`}>
                    {isMandatory ? 'Layanan Ditangguhkan' : 'Tagihan Iuran Tersedia'}
                  </h4>
                  <p className={`text-xs font-semibold leading-relaxed mb-4 ${isMandatory ? 'text-rose-700' : 'text-amber-700'}`}>
                    {isMandatory 
                      ? `Layanan administrasi ditangguhkan sementara karena iuran bulan ${currentMonth} belum diselesaikan (melewati jatuh tempo tgl 20).` 
                      : `Tagihan pembayaran iuran bulan ${currentMonth} telah dirilis. Harap koordinasi sebelum jatuh tempo.`}
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={() => setIsIuranModalOpen(true)}
                      className={`h-11 px-6 text-[10px] font-black uppercase tracking-widest w-full shadow-md cursor-pointer ${isMandatory ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-55'}`}
                    >
                      Lihat Rincian
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => window.open(`https://wa.me/${(currentHouse?.phone || '6285961194621').toString().replace(/^0/, '62').replace(/\D/g, '')}`, '_blank')}
                      className="h-11 px-6 text-[10px] font-black uppercase tracking-widest w-full bg-white border-slate-200 cursor-pointer"
                    >
                      Hubungi Pengurus RT
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Card className="bg-white border-slate-100 shadow-sm">
            <h4 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
              <Info size={16} className="text-indigo-600" /> Informasi Hunian & Kunci
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Jumlah Penghuni</span>
                <span className="text-xs font-black text-slate-800">{currentHouse?.occupants || 0} Jiwa</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status Tinggal</span>
                <span className="text-xs font-black text-slate-800">{currentHouse?.residenceType || 'Tetap'}</span>
              </div>
              {currentHouse?.phone && (
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">No. Telepon WA</span>
                  <span className="text-xs font-black text-slate-800">{currentHouse.phone}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">PIN Akses Rumah</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 select-all relative group">
                    {showPin ? currentHouse?.accessCode : '••••••'}
                  </span>
                  <button 
                    onClick={() => setShowPin(!showPin)} 
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                    title="Tampilkan PIN"
                  >
                    {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button 
                    onClick={() => currentHouse?.accessCode && handleCopyToClipboard(currentHouse.accessCode, 'pin')} 
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                    title="Salin PIN"
                  >
                    <CreditCard size={14} />
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Resident Business Survey & Status Card */}
          {(currentHouse?.hasBusiness || currentHouse?.businessName) ? (
            <Card className="bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-white border-amber-200 shadow-xs p-5 text-left rounded-3xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-2xl">
                    <Store size={18} />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-700">Usaha Warga Terdata</span>
                    <h4 className="font-black text-slate-800 text-sm leading-tight">{currentHouse.businessName || 'UMKM Warga'}</h4>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                  {currentHouse.businessCategory || 'UMKM'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-white/80 p-3 rounded-2xl border border-amber-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Lokasi Usaha</span>
                  <span className="font-bold text-slate-700">{currentHouse.businessLocation || 'Di Rumah'}</span>
                </div>
                {currentHouse.businessPhone && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">WhatsApp</span>
                    <span className="font-bold text-slate-700">{currentHouse.businessPhone}</span>
                  </div>
                )}
                {currentHouse.businessDescription && (
                  <p className="text-[11px] text-slate-600 font-medium italic pt-2 mt-1 border-t border-amber-50 line-clamp-2">
                    "{currentHouse.businessDescription}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setActiveTab('update');
                    setIsUpdateModalOpen(true);
                  }}
                  variant="outline"
                  className="flex-1 h-9 text-[10px] font-black uppercase tracking-wider border-amber-300 text-amber-800 hover:bg-amber-100 rounded-xl cursor-pointer"
                >
                  Perbarui Data Usaha
                </Button>
                <a
                  href="/#/umkm"
                  className="px-3.5 h-9 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center transition-colors shadow-xs"
                >
                  Katalog
                </a>
              </div>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-amber-50/50 via-white to-white border-amber-200/60 shadow-xs p-4 text-left rounded-3xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl shrink-0">
                  <Store size={18} />
                </div>
                <div className="flex-1">
                  <h5 className="text-xs font-black text-slate-800">Punya Usaha atau Jasa?</h5>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    Daftarkan usaha Anda dalam pendataan warga untuk promosi gratis di lingkungan RT 02.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setActiveTab('update');
                  setIsUpdateModalOpen(true);
                }}
                className="w-full mt-3 h-8.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-none cursor-pointer"
              >
                + Daftarkan Usaha Saya
              </Button>
            </Card>
          )}

          <Card className="bg-indigo-50 border-indigo-100 shadow-sm p-5 text-left">
            <h4 className="font-black text-indigo-900 text-sm mb-2 flex items-center gap-1.5">
              <QrCode size={16} /> Manfaat E-ID Aktif
            </h4>
            <p className="text-[11px] text-indigo-700 font-medium leading-relaxed mb-4">
              Gunakan Barcode di samping saat verifikasi kehadiran rapat RT, pengambilan kupon bantuan, kerja bakti, maupun saat pembayaran retribusi iuran tunai.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  try {
                    const canvas = document.createElement('canvas');
                    canvas.width = 1012;
                    canvas.height = 638;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) throw new Error('Canvas context not available');

                    ctx.beginPath();
                    if (ctx.roundRect) ctx.roundRect(0, 0, 1012, 638, 48);
                    else ctx.rect(0, 0, 1012, 638);
                    ctx.clip();

                    const gradient = ctx.createLinearGradient(0, 0, 1012, 638);
                    gradient.addColorStop(0, '#4f46e5');
                    gradient.addColorStop(0.5, '#312e81');
                    gradient.addColorStop(1, '#0f172a');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, 1012, 638);

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
                    ctx.beginPath();
                    ctx.arc(1012, 0, 380, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
                    ctx.beginPath();
                    ctx.arc(0, 638, 300, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#ffffff';
                    ctx.font = '900 36px system-ui, -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText('KARTU WARGA DIGITAL', 80, 150);

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
                    ctx.fillText('RUKUN TETANGGA 02 / RW 05', 80, 185);

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                    ctx.beginPath();
                    if (ctx.roundRect) ctx.roundRect(80, 70, 140, 34, 17);
                    else ctx.rect(80, 70, 140, 34);
                    ctx.fill();

                    ctx.fillStyle = '#10b981';
                    ctx.beginPath();
                    ctx.arc(102, 87, 5, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#ffffff';
                    ctx.font = '900 11px system-ui, -apple-system, sans-serif';
                    ctx.fillText('E-ID AKTIF', 115, 91);

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.font = '900 12px system-ui, -apple-system, sans-serif';
                    ctx.fillText('NAMA KEPALA KELUARGA / PENGHUNI', 80, 290);

                    ctx.fillStyle = '#ffffff';
                    ctx.font = '900 38px system-ui, -apple-system, sans-serif';
                    ctx.fillText((currentHouse?.headOfFamily || 'Anggota RT 02').toUpperCase(), 80, 345);

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.font = '900 12px system-ui, -apple-system, sans-serif';
                    ctx.fillText('NOMOR HUNIAN AKTIF', 80, 435);

                    ctx.fillStyle = '#ffffff';
                    ctx.font = '900 28px system-ui, -apple-system, sans-serif';
                    ctx.fillText(`BLOK ${currentHouse?.block}-${currentHouse?.number}`, 80, 480);

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.font = '900 12px system-ui, -apple-system, sans-serif';
                    ctx.fillText('REKENING IURAN RT', 380, 435);

                    ctx.fillStyle = isAllPaid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)';
                    ctx.beginPath();
                    if (ctx.roundRect) ctx.roundRect(380, 452, 175, 36, 10);
                    else ctx.rect(380, 452, 175, 36);
                    ctx.fill();

                    ctx.fillStyle = isAllPaid ? '#34d399' : '#fbbf24';
                    ctx.font = '900 12px system-ui, -apple-system, sans-serif';
                    ctx.fillText(isAllPaid ? '✔ LUNAS AKTIF' : '⚠ TAGIHAN BARU', 396, 474);

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                    ctx.font = '800 11px system-ui, -apple-system, sans-serif';
                    ctx.fillText('TERAS WARGA RT02 • DIKELOLA SECARA MANDIRI & TRANSPARAN', 80, 565);

                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    if (ctx.roundRect) ctx.roundRect(660, 140, 272, 318, 32);
                    else ctx.rect(660, 140, 272, 318);
                    ctx.fill();

                    const qrCanvas = document.getElementById('resident-qrcode-canvas') as HTMLCanvasElement;
                    if (qrCanvas) {
                      ctx.drawImage(qrCanvas, 696, 172, 200, 200);
                    }

                    ctx.fillStyle = '#475569';
                    ctx.font = '900 12px system-ui, -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('PINDAI VERIFIKASI', 796, 405);
                    ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
                    ctx.fillStyle = '#94a3b8';
                    ctx.fillText('PEMERINTAH KOTA KELURAHAN', 796, 423);

                    const dataUrl = canvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.download = `E-ID_RT02_Blok_${currentHouse?.block || 'RT'}_${currentHouse?.number || '02'}.png`;
                    link.href = dataUrl;
                    link.click();
                    
                    toast.success('Kartu E-ID Berhasil Diunduh!', {
                      description: 'Kartu E-ID Warga Digital Anda telah disimpan ke galeri perangkat Anda.'
                    });
                  } catch (err) {
                    console.error('Error generating card image:', err);
                    toast.error('Gagal Mengunduh Kartu', {
                      description: 'Terjadi kegagalan render identitas digital lokal.'
                    });
                  }
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-[10px] font-black uppercase tracking-widest h-11 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download size={14} /> Unduh & Simpan Kartu E-ID
              </Button>
              <div className="pt-2 border-t border-indigo-200/50 text-left">
                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Notifikasi Pemberitahuan</p>
                <NotificationToggle userId={selectedHouseId} />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* C. DETAIL PROFIL KEPALA KELUARGA (Full Profile of Head of Family) */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-6 md:p-8 text-left mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-50">
          <div>
            <h3 className="text-lg font-black text-slate-800">Detail Profil Kepala Keluarga</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Rincian data identitas kependudukan, status sosial, dan fasilitas hunian Anda.</p>
          </div>
          <button 
            onClick={() => setActiveTab('update')}
            className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
          >
            Ajukan Perubahan Data →
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Shield size={11} className="text-slate-450"/> NIK Kepala Keluarga</p>
            <div className="flex items-center gap-2">
              <p className="text-xs font-mono font-black text-slate-800">
                {formatSensitiveNik(currentHouse?.nik || '', !!showFullNiks['nik'])}
              </p>
              {currentHouse?.nik && (
                <button 
                  onClick={() => toggleNikVisibility('nik')}
                  className="p-0.5 hover:bg-slate-200/50 rounded text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center justify-center cursor-pointer"
                  title={showFullNiks['nik'] ? "Sembunyikan NIK" : "Tampilkan NIK"}
                >
                  {showFullNiks['nik'] ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Users size={11} className="text-slate-450"/> Nomor Kartu Keluarga</p>
            <div className="flex items-center gap-2">
              <p className="text-xs font-mono font-black text-slate-800">
                {formatSensitiveNik(currentHouse?.kkNumber || '', !!showFullNiks['kkNumber'])}
              </p>
              {currentHouse?.kkNumber && (
                <button 
                  onClick={() => toggleNikVisibility('kkNumber')}
                  className="p-0.5 hover:bg-slate-200/50 rounded text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center justify-center cursor-pointer"
                  title={showFullNiks['kkNumber'] ? "Sembunyikan No. KK" : "Tampilkan No. KK"}
                >
                  {showFullNiks['kkNumber'] ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><User size={11} className="text-slate-450"/> Jenis Kelamin</p>
            <p className="text-xs font-black text-slate-800">{currentHouse?.gender || '-'}</p>
          </div>

          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar size={11} className="text-slate-450"/> Kelahiran</p>
            <p className="text-xs font-black text-slate-800 truncate">
              {currentHouse?.birthPlace || '-'}{currentHouse?.birthDate ? `, ${currentHouse?.birthDate}` : ''}
            </p>
          </div>

          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Briefcase size={11} className="text-slate-450"/> Pekerjaan</p>
            <p className="text-xs font-black text-slate-800 truncate">{currentHouse?.job || currentHouse?.jobCategory || '-'}</p>
          </div>

          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><GraduationCap size={11} className="text-slate-450"/> Pendidikan</p>
            <p className="text-xs font-black text-slate-800 truncate">{currentHouse?.education || '-'}</p>
          </div>

          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Heart size={11} className="text-slate-450"/> Golongan Darah</p>
            <p className="text-xs font-black text-slate-800">{currentHouse?.bloodType || '-'}</p>
          </div>

          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Globe size={11} className="text-slate-450"/> Kewarganegaraan</p>
            <p className="text-xs font-black text-slate-800">{currentHouse?.nationality || 'WNI'}</p>
          </div>

          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Activity size={11} className="text-slate-450"/> Status BPJS</p>
            <p className="text-xs font-black text-slate-800">{currentHouse?.bpjsStatus || 'Tidak Ada'}</p>
          </div>

          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><ShieldCheck size={11} className="text-slate-450"/> Status Vaksinasi</p>
            <p className="text-xs font-black text-slate-800">{currentHouse?.vaccinationStatus || 'Tidak Ada Data'}</p>
          </div>

          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><DollarSign size={11} className="text-slate-450"/> Status Ekonomi</p>
            <p className="text-xs font-black text-slate-800">{currentHouse?.economicStatus || 'Sejahtera'}</p>
          </div>

          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Shield size={11} className="text-slate-450"/> Kewajiban Ronda</p>
            <p className="text-xs font-black text-slate-800">
              {currentHouse?.rondaExempt ? 'Bebas Tugas Siskamling' : 'Wajib Ronda Aktif'}
            </p>
          </div>

          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><CreditCard size={11} className="text-slate-450"/> Kesesuaian KTP</p>
            <p className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${(currentHouse?.ktpStatus === 'Sesuai Domisili' || (!currentHouse?.ktpStatus && currentHouse?.addressKtp && (currentHouse.addressKtp.toLowerCase().includes('tondo') || currentHouse.addressKtp.toLowerCase().includes('pue lombe')))) ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{currentHouse?.ktpStatus || (currentHouse?.addressKtp && (currentHouse.addressKtp.toLowerCase().includes('tondo') || currentHouse.addressKtp.toLowerCase().includes('pue lombe')) ? 'Sesuai Domisili' : (currentHouse?.addressKtp ? 'Luar Wilayah (Belum Mutasi)' : 'Belum Dicatat'))}</span>
            </p>
          </div>

          {currentHouse?.addressKtp && (
            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85 col-span-2 md:col-span-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><MapPin size={11} className="text-slate-450"/> Alamat Sesuai KTP</p>
              <p className="text-xs font-bold text-slate-700 leading-relaxed">{currentHouse.addressKtp}</p>
            </div>
          )}
        </div>
      </div>

      {/* A. DAFTAR ANGGOTA KELUARGA (Family Members Section) */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-6 md:p-8 text-left mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-50">
          <div>
            <h3 className="text-lg font-black text-slate-800">Anggota Keluarga Terdaftar</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Daftar resmi penghuni rumah yang tercatat pada database kependudukan RT 002.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-black">
              {currentHouse?.occupants || currentHouse?.familyMembers?.length || 1} Jiwa Terdaftar
            </span>
            <button 
              onClick={() => setActiveTab('update')}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              Edit KK Mandiri →
            </button>
          </div>
        </div>

        {/* Demographic Summary Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Jiwa</span>
            <span className="text-lg font-black text-slate-800 mt-0.5 block">{currentHouse?.occupants || 0} Orang</span>
          </div>
          <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 text-center">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Laki-Laki</span>
            <span className="text-lg font-black text-blue-900 mt-0.5 block">{maleCount} Jiwa</span>
          </div>
          <div className="p-3 bg-pink-50/50 rounded-2xl border border-pink-100 text-center">
            <span className="text-[10px] font-bold text-pink-700 uppercase tracking-wider block">Perempuan</span>
            <span className="text-lg font-black text-pink-900 mt-0.5 block">{femaleCount} Jiwa</span>
          </div>
          <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-center">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Verifikasi RT</span>
            <span className="text-lg font-black text-emerald-900 mt-0.5 block">
              {currentHouse?.isVerified ? 'Tervalidasi' : 'Belum'}
            </span>
          </div>
        </div>

        {currentHouse?.familyMembers && currentHouse.familyMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentHouse.familyMembers.map((member: any, index: number) => {
              const isMale = member.gender === 'Laki-laki';
              return (
                <div key={index} className="p-4 bg-slate-50/60 hover:bg-slate-50 rounded-2xl border border-slate-100/90 flex items-start gap-3.5 transition-all shadow-xs">
                  <div className={`p-3 rounded-2xl shrink-0 ${isMale ? 'bg-blue-100/70 text-blue-700' : 'bg-pink-100/70 text-pink-700'}`}>
                    <User size={20} />
                  </div>
                  <div className="flex-1 space-y-1.5 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-extrabold text-slate-800 text-sm truncate">{member.name || '-' }</h4>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                        member.relation === 'Kepala Keluarga' 
                          ? 'bg-indigo-100 text-indigo-800' 
                          : member.relation === 'Istri' 
                            ? 'bg-pink-100 text-pink-800' 
                            : member.relation === 'Anak' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-slate-200/80 text-slate-700'
                      }`}>
                        {member.relation || 'Anggota'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                      <span>NIK:</span>
                      <span className="font-mono text-slate-600 font-bold">
                        {formatSensitiveNik(member.nik, !!showFullNiks[`member-${index}`])}
                      </span>
                      {member.nik && (
                        <button 
                          onClick={() => toggleNikVisibility(`member-${index}`)}
                          className="p-0.5 hover:bg-slate-200/60 rounded text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center justify-center cursor-pointer"
                          title={showFullNiks[`member-${index}`] ? "Sembunyikan NIK" : "Tampilkan NIK"}
                        >
                          {showFullNiks[`member-${index}`] ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] text-slate-500 font-medium">
                      {member.birthDate && (
                        <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-100">
                          <Calendar size={10} className="text-slate-400" />
                          {member.birthDate}
                        </span>
                      )}
                      {member.job && (
                        <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-100 truncate max-w-[130px]">
                          <Briefcase size={10} className="text-slate-400" />
                          {member.job}
                        </span>
                      )}
                      {member.bpjsStatus && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                          member.bpjsStatus.toLowerCase().includes('aktif') 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          <Activity size={10} />
                          {member.bpjsStatus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-150 p-6 flex flex-col items-center justify-center">
            <p className="text-slate-400 text-xs font-medium">Belum ada anggota keluarga sekunder yang didaftarkan secara detail.</p>
            <Button 
              variant="outline" 
              onClick={() => setActiveTab('update')} 
              className="mt-3 text-[10px] font-black uppercase tracking-widest cursor-pointer scale-90 border-slate-200"
            >
              Lengkapi Anggota KK Sekarang
            </Button>
          </div>
        )}
      </div>

      {/* B. AKTIVITAS & LOG LAINNYA TERBARU TIMELINE (Recent activity list widget) */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-6 md:p-8 text-left mt-8">
        <div className="mb-6 pb-4 border-b border-slate-50">
          <h3 className="text-lg font-black text-slate-800">Timeline Pelacakan & Aktivitas</h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Pantau update terbaru dari segala aduan, surat, dan permohonan yang diajukan oleh hunian Anda.</p>
        </div>

        {(() => {
          const combinedActivities: any[] = [];
          
          letters.forEach(item => {
            combinedActivities.push({
              id: item.id,
              title: `Permohonan: ${item.type}`,
              createdAt: item.date || (item as any).createdAt || '',
              status: item.status,
              tag: 'letters',
              color: 'text-indigo-600 bg-indigo-50',
              desc: item.purposeDetail || 'Pengurusan surat pengantar rujukan.'
            });
          });

          reports.forEach(item => {
            combinedActivities.push({
              id: item.id,
              title: `Aduan Warga: ${item.type}`,
              createdAt: item.date || (item as any).createdAt || '',
              status: item.status,
              tag: 'reports',
              color: 'text-rose-600 bg-rose-50',
              desc: item.description || 'Laporan kejadian / aduan kerusakan.'
            });
          });

          guestReports.forEach(item => {
            combinedActivities.push({
              id: item.id,
              title: `Tamu Bermalam: ${item.guestName}`,
              createdAt: item.createdAt || '',
              status: item.status === 'Active' ? 'Active' : 'Checkout',
              tag: 'guests',
              color: 'text-amber-600 bg-amber-50',
              desc: `Tamu hubungan ${item.relationship} menginap selama ${item.stayDuration}.`
            });
          });

          updateRequests.forEach(item => {
            combinedActivities.push({
              id: item.id,
              title: `Update KK Mandiri`,
              createdAt: item.createdAt || '',
              status: item.status || 'Menunggu',
              tag: 'update',
              color: 'text-emerald-600 bg-emerald-50',
              desc: item.reason || 'Permohonan pembaruan data kependudukan.'
            });
          });

          const sortedHistoryList = combinedActivities.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          }).slice(0, 4);

          if (sortedHistoryList.length === 0) {
            return (
              <div className="py-12 text-center bg-slate-50/50 rounded-2xl flex flex-col items-center justify-center">
                <History className="text-slate-350 mb-2" size={32} />
                <p className="text-slate-400 text-xs font-semibold">Belum ada catatan permohonan administrasi atau laporan.</p>
              </div>
            );
          }

          return (
            <div className="relative border-l-2 border-slate-100 pl-6 ml-4 space-y-8 py-2 text-left">
              {sortedHistoryList.map((act) => {
                const dateText = act.createdAt ? new Date(act.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Menunggu antrean';

                const isDone = ['disetujui', 'approved', 'selesai', 'issued', 'tuntas', 'completed', 'active', 'aktif'].includes(String(act.status).toLowerCase());
                const isRejected = ['ditolak', 'rejected', 'batal'].includes(String(act.status).toLowerCase());
                
                let badgeStyle = "bg-amber-50 text-amber-700 border-amber-100";
                if (isDone) badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-100";
                if (isRejected) badgeStyle = "bg-rose-50 text-rose-700 border-rose-100";

                return (
                  <div key={act.id} className="relative group text-left">
                    <span className="absolute -left-[35px] top-1.5 focus:outline-none w-4.5 h-4.5 rounded-full border-4 border-white bg-indigo-500 shadow-sm shrink-0" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800 hover:text-indigo-600 transition-colors">{act.title}</span>
                        <span className="text-[10px] font-bold text-slate-400 truncate max-w-[80px] font-mono">#{act.id.slice(0,6)}...</span>
                      </div>
                      
                      <div className="flex items-center gap-2 self-start md:self-auto">
                        <span className="text-[9px] font-mono text-slate-400 font-bold">{dateText}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${badgeStyle}`}>
                          {act.status === 'Active' ? 'Aktif' : act.status}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{act.desc}</p>
                    
                    <button
                      onClick={() => setActiveTab(act.tag as any)}
                      className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 mt-2 hover:underline tracking-wider uppercase block cursor-pointer"
                    >
                      Lihat di Tab {act.tag.toUpperCase()} →
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </motion.div>
  );
};
