import React, { useState } from 'react';
import { 
  Zap, Droplets, Wifi, Clock, AlertTriangle, CheckCircle2, 
  MapPin, Share2, Info, PhoneCall, Send, ShieldAlert,
  Flame, Radio, RefreshCw, MessageCircle, HelpCircle, Check
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { UtilityOutage } from '../../types';
import { addToCollection } from '../../services/databaseService';
import { toast } from 'sonner';

interface UtilityOutageTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  outages: UtilityOutage[];
}

export const UtilityOutageTrackerModal: React.FC<UtilityOutageTrackerModalProps> = ({
  isOpen,
  onClose,
  outages
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'crowdsource' | 'emergency'>('schedule');
  const [filterType, setFilterType] = useState<'ALL' | 'PLN' | 'PDAM' | 'Internet'>('ALL');
  const [onlyOngoing, setOnlyOngoing] = useState(false);

  // Crowdsourced Report Form State
  const [reportForm, setReportForm] = useState({
    category: 'Listrik Padam' as 'Listrik Padam' | 'Air Mati Total' | 'Tekanan Air Lemah' | 'Kabel / Tiang Bahaya',
    block: 'Blok A',
    houseNumber: '',
    reporterName: '',
    reporterPhone: '',
    notes: '',
    isNeighborsAffected: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<any | null>(null);

  if (!isOpen) return null;

  // Filter outages
  const filteredOutages = outages.filter(item => {
    const matchesType = filterType === 'ALL' || item.type === filterType;
    const matchesOngoing = !onlyOngoing || item.status === 'Ongoing';
    return matchesType && matchesOngoing;
  });

  const ongoingCount = outages.filter(o => o.status === 'Ongoing').length;
  const scheduledCount = outages.filter(o => o.status === 'Scheduled').length;

  const handleShareOutage = (outage: UtilityOutage) => {
    const statusText = 
      outage.status === 'Ongoing' ? '⚠️ SEDANG BERLANGSUNG' :
      outage.status === 'Scheduled' ? '🗓️ JADWAL PEMELIHARAAN' : '✅ SELESAI / NORMAL';

    const message = 
`🔌 *INFORMASI UTILITAS RT 002 / RW 020 HUNTAP TONDO 2*
*Pemberitahuan Pemadaman / Pemeliharaan Fasilitas*

📌 *Status*: ${statusText}
🛠️ *Jenis Layanan*: ${outage.type} (${outage.title})
📍 *Wilayah Terdampak*: ${outage.affectedBlocks?.join(', ') || 'Semua Blok'}
⏰ *Waktu*: ${outage.startTime} s.d ${outage.endTime}
ℹ️ *Keterangan*: ${outage.description}
${outage.emergencyNotes ? `🚨 *Catatan Khusus*: ${outage.emergencyNotes}\n` : ''}
📞 *Kontak Resmi*: ${outage.contactCenter || 'PLN 123 / PDAM Palu'}
📲 _Cek informasi lengkap di Portal Warga:_ https://teraswarga02.web.app`;

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleQuickReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.reporterName.trim() || !reportForm.houseNumber.trim()) {
      toast.error("Mohon isi Nama Pelapor dan Nomor Rumah!");
      return;
    }

    setIsSubmitting(true);
    try {
      const fullLocation = `${reportForm.block} No. ${reportForm.houseNumber.trim()}`;
      const reportPayload = {
        type: 'Infrastruktur' as const,
        description: `[GANGGUAN UTILITAS: ${reportForm.category.toUpperCase()}] di ${fullLocation}. Tetangga terdampak: ${reportForm.isNeighborsAffected ? 'Ya' : 'Belum pasti'}. Keterangan: ${reportForm.notes || 'Tidak ada catatan tambahan'}.`,
        reporterName: reportForm.reporterName.trim(),
        reporterHouseId: fullLocation,
        reporterPhone: reportForm.reporterPhone.trim(),
        date: new Date().toISOString(),
        status: 'Baru' as const,
        source: 'Public_Crowdsource_Utility'
      };

      await addToCollection('reports', reportPayload);
      setSubmittedReport({
        ...reportPayload,
        category: reportForm.category,
        fullLocation
      });

      toast.success("Laporan Gangguan Berhasil Terkirim!", {
        description: "Pengurus RT & Petugas telah menerima notifikasi gangguan utilitas Anda."
      });
    } catch (err: any) {
      console.error("Error submitting utility report:", err);
      toast.error("Gagal mengirim laporan. Silakan coba lagi atau hubungi WhatsApp RT.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReportToWa = () => {
    if (!submittedReport) return;
    const waText = 
`🚨 *LAPOR GANGGUAN UTILITAS WARGA RT 002 TONDO*
Halo Pengurus RT / Petugas Jaga, saya warga ingin menginfokan:

• *Nama Pelapor*: ${submittedReport.reporterName}
• *Lokasi Rumah*: ${submittedReport.fullLocation}
• *Jenis Gangguan*: ${submittedReport.category}
• *Keterangan*: ${submittedReport.description}
• *Waktu*: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WITA

Mohon dapat dibantu koordinasi dengan pihak terkait. Terima kasih.`;

    const encoded = encodeURIComponent(waText);
    // Open WA directly to RT phone or general share
    window.open(`https://api.whatsapp.com/send?phone=6285961194621&text=${encoded}`, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pusat Informasi & Pantau Utilitas Huntap"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5 p-1 text-left">
        {/* Top Live Status Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${ongoingCount > 0 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-emerald-100 text-emerald-600'}`}>
              <Zap size={18} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Jaringan Listrik</p>
              <p className="text-xs font-black text-slate-800">
                {ongoingCount > 0 ? `${ongoingCount} Pemadaman Aktif` : 'Beroperasi Normal'}
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
              <Droplets size={18} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Air Bersih & Pompa</p>
              <p className="text-xs font-black text-slate-800">Aliran Standar RT</p>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Agenda Terjadwal</p>
              <p className="text-xs font-black text-slate-800">{scheduledCount} Jadwal Kedepan</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
              activeTab === 'schedule'
                ? 'border-amber-600 text-amber-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap size={15} />
            <span>Jadwal & Status Resmi</span>
            {ongoingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('crowdsource')}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
              activeTab === 'crowdsource'
                ? 'border-amber-600 text-amber-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle size={15} />
            <span>Lapor Gangguan Warga</span>
            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black rounded-md">Cepat</span>
          </button>

          <button
            onClick={() => setActiveTab('emergency')}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
              activeTab === 'emergency'
                ? 'border-amber-600 text-amber-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PhoneCall size={15} />
            <span>Kontak Posko & PLN</span>
          </button>
        </div>

        {/* TAB 1: SCHEDULE & STATUS */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap gap-1.5">
                {(['ALL', 'PLN', 'PDAM', 'Internet'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      filterType === type 
                        ? 'bg-slate-900 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type === 'ALL' ? 'Semua' : type}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={onlyOngoing}
                  onChange={(e) => setOnlyOngoing(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                />
                <span>Hanya yang Sedang Berlangsung</span>
              </label>
            </div>

            {/* Outage Items List */}
            <div className="space-y-3.5 max-h-[55vh] overflow-y-auto pr-1">
              {filteredOutages.length > 0 ? (
                filteredOutages.map((outage) => (
                  <div 
                    key={outage.id}
                    className={`p-4 sm:p-5 rounded-2xl border-2 transition-all ${
                      outage.status === 'Ongoing' 
                        ? 'bg-amber-50/50 border-amber-400 shadow-sm' 
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Header Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                          outage.type === 'PLN' ? 'bg-amber-100 text-amber-800' :
                          outage.type === 'PDAM' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {outage.type === 'PLN' ? <Zap size={12} /> : outage.type === 'PDAM' ? <Droplets size={12} /> : <Wifi size={12} />}
                          {outage.type}
                        </span>

                        {outage.impactSeverity && (
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                            outage.impactSeverity === 'Kritis' ? 'bg-rose-100 text-rose-700' :
                            outage.impactSeverity === 'Sedang' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            Dampak {outage.impactSeverity}
                          </span>
                        )}
                      </div>

                      <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
                        outage.status === 'Ongoing' ? 'bg-rose-100 text-rose-700 animate-pulse font-black' :
                        outage.status === 'Scheduled' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {outage.status === 'Ongoing' ? '⚠️ Sedang Berlangsung' : outage.status === 'Scheduled' ? '🗓️ Terjadwal' : '✅ Selesai / Normal'}
                      </span>
                    </div>

                    <h4 className="font-black text-slate-900 text-sm sm:text-base leading-snug">
                      {outage.title}
                    </h4>

                    {outage.feederName && (
                      <p className="text-[11px] font-bold text-amber-800 mt-1 flex items-center gap-1.5">
                        <Radio size={12} className="text-amber-600" />
                        Jalur / Feeder: {outage.feederName}
                      </p>
                    )}

                    <p className="text-xs text-slate-600 font-medium mt-1.5 leading-relaxed">
                      {outage.description}
                    </p>

                    {/* Metadata Card */}
                    <div className="mt-3 p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1.5 text-xs">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Wilayah Terdampak:</span>
                        <div className="flex flex-wrap gap-1">
                          {outage.affectedBlocks && outage.affectedBlocks.length > 0 ? (
                            outage.affectedBlocks.map(b => (
                              <span key={b} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-bold text-slate-700 text-[10px]">
                                {b}
                              </span>
                            ))
                          ) : (
                            <span className="font-bold text-slate-700">Semua Blok Huntap</span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Estimasi Waktu:</span>
                        <span className="font-black text-slate-800">{outage.startTime} s.d {outage.endTime}</span>
                      </div>
                    </div>

                    {/* Emergency Notes */}
                    {outage.emergencyNotes && (
                      <div className="mt-2.5 p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs font-bold text-amber-950 flex items-start gap-2">
                        <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
                        <span>{outage.emergencyNotes}</span>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium">
                        Info: {outage.contactCenter || 'PLN 123 / PDAM'}
                      </span>

                      <button
                        onClick={() => handleShareOutage(outage)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                      >
                        <Share2 size={12} />
                        <span>Bagikan ke Grup WhatsApp RT</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center bg-emerald-50/60 rounded-3xl border border-emerald-200/80 p-6">
                  <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
                  <h4 className="font-black text-slate-900 text-base">Jaringan Listrik &amp; Air Beroperasi Normal</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                    Tidak ada jadwal pemeliharaan ataupun kendala teknis pada gardu trafo PLN dan pompa booster air RT 002 saat ini.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CROWDSOURCED REPORTING */}
        {activeTab === 'crowdsource' && (
          <div className="space-y-4">
            {submittedReport ? (
              <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-3xl text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                  <Check size={24} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">Laporan Gangguan Berhasil Diterima</h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
                    Terima kasih, Bapak/Ibu <strong>{submittedReport.reporterName}</strong>. Laporan gangguan <strong>{submittedReport.category}</strong> di <strong>{submittedReport.fullLocation}</strong> telah masuk ke dasbor pengurus RT.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-emerald-200 rounded-2xl text-left text-xs space-y-1">
                  <p className="font-bold text-slate-700">💡 Panduan Cepat:</p>
                  <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                    <li>Jika listrik padam: Cabut steker kulkas, TV, & AC untuk menghindari lonjakan voltase saat listrik kembali hidup.</li>
                    <li>Jika air mati: Pastikan kran kamar mandi tertutup agar air tidak meluap saat tekanan pipa dibuka kembali.</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleSendReportToWa}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <MessageCircle size={14} />
                    <span>Kirim Pesan Langsung ke Pengurus RT</span>
                  </button>

                  <button
                    onClick={() => setSubmittedReport(null)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Kirim Laporan Lain
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleQuickReportSubmit} className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="font-medium leading-relaxed">
                    Formulir cepat bagi warga untuk melaporkan pemadaman mendadak. Informasi warga membantu pengurus mendeteksi apakah gangguan terjadi secara menyeluruh atau hanya di blok tertentu.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Jenis Gangguan Utilitas *</label>
                    <select
                      value={reportForm.category}
                      onChange={(e: any) => setReportForm({ ...reportForm, category: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Listrik Padam">⚡ Listrik Padam Total</option>
                      <option value="Air Mati Total">💧 Aliran Air Bersih Mati</option>
                      <option value="Tekanan Air Lemah">🚰 Tekanan Air Keruh / Sangat Lemah</option>
                      <option value="Kabel / Tiang Bahaya">⚠️ Tiang / Kabel Kendor Berbahaya</option>
                    </select>
                  </div>

                  {/* Block Selection */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Pilih Blok Hunian *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={reportForm.block}
                        onChange={(e) => setReportForm({ ...reportForm, block: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="Blok A">Blok A</option>
                        <option value="Blok B">Blok B</option>
                        <option value="Blok C">Blok C</option>
                        <option value="Blok D">Blok D</option>
                        <option value="Blok E">Blok E</option>
                        <option value="Blok F">Blok F</option>
                        <option value="Jalur Utama">Jalur Utama RT</option>
                      </select>

                      <input
                        type="text"
                        placeholder="No. Rumah (misal: 14)"
                        value={reportForm.houseNumber}
                        onChange={(e) => setReportForm({ ...reportForm, houseNumber: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Reporter Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Nama Pelapor *</label>
                    <input
                      type="text"
                      placeholder="Nama lengkap atau panggilan warga"
                      value={reportForm.reporterName}
                      onChange={(e) => setReportForm({ ...reportForm, reporterName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  {/* Reporter Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Nomor WhatsApp (Opsional)</label>
                    <input
                      type="tel"
                      placeholder="08xxxxxxxxxx"
                      value={reportForm.reporterPhone}
                      onChange={(e) => setReportForm({ ...reportForm, reporterPhone: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Keterangan Tambahan / Gejala</label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Lampu tiba-tiba mati setelah ada petir, sekring rumah posisi ON tapi tidak ada arus."
                    value={reportForm.notes}
                    onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>

                {/* Checkbox: Neighbors affected */}
                <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportForm.isNeighborsAffected}
                    onChange={(e) => setReportForm({ ...reportForm, isNeighborsAffected: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    Tetangga sebelah / satu deretan lorong juga mengalami hal yang sama
                  </span>
                </label>

                {/* Submit button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    <span>{isSubmitting ? 'Mengirim Laporan...' : 'Kirim Laporan Gangguan'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: EMERGENCY CONTACTS */}
        {activeTab === 'emergency' && (
          <div className="space-y-3.5">
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500 text-white rounded-xl">
                  <Zap size={20} />
                </div>
                <div>
                  <h5 className="font-black text-slate-900 text-sm">PLN Call Center Palu</h5>
                  <p className="text-[11px] text-slate-500 font-medium">Layanan pengaduan kelistrikan 24 jam &amp; info gardu</p>
                </div>
              </div>
              <a
                href="tel:123"
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Telepon 123
              </a>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500 text-white rounded-xl">
                  <Droplets size={20} />
                </div>
                <div>
                  <h5 className="font-black text-slate-900 text-sm">PDAM Kota Palu</h5>
                  <p className="text-[11px] text-slate-500 font-medium">Layanan informasi pipa transmisi &amp; tangki darurat</p>
                </div>
              </div>
              <a
                href="tel:0451421234"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                (0451) 421234
              </a>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500 text-white rounded-xl">
                  <PhoneCall size={20} />
                </div>
                <div>
                  <h5 className="font-black text-slate-900 text-sm">Petugas Pompa &amp; Air RT 02</h5>
                  <p className="text-[11px] text-slate-500 font-medium">Piket teknisi kran &amp; tandon fasum Huntap Tondo 2</p>
                </div>
              </div>
              <a
                href="https://api.whatsapp.com/send?phone=6285961194621&text=Halo%20Pak%20Pengurus%2C%20mau%20konfirmasi%20kondisi%20air%20RT%2002"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                WhatsApp RT
              </a>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-800 text-white rounded-xl">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h5 className="font-black text-slate-900 text-sm">Satpam Pos Jaga 24 Jam</h5>
                  <p className="text-[11px] text-slate-500 font-medium">Bantuan darurat keamanan &amp; pengecekan lapangan</p>
                </div>
              </div>
              <a
                href="tel:081244558800"
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Hubungi Pos
              </a>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
