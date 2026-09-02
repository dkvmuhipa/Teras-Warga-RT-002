import React, { useState, useEffect } from 'react';
import { 
  FileText, Calendar, MapPin, Plus, Download, Printer, Search, 
  Trash2, Edit2, CheckCircle, Clock, ShieldCheck, Sparkles, Filter, ChevronRight, User, Users,
  Share2, FileSpreadsheet, Image as ImageIcon, AlertCircle, Upload
} from 'lucide-react';
import { MonthlyActivityReport, MonthlyActivityItem, PdfConfig, House } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Card';
import { toast } from 'sonner';
import { 
  subscribeToMonthlyActivityReports, 
  addMonthlyActivityReportToDb, 
  updateMonthlyActivityReportInDb, 
  deleteMonthlyActivityReportFromDb 
} from '../../services/databaseService';
import { 
  generateDedicatedMonthlyActivityReportPDF, 
  generateIntegratedMonthlyReportPDF 
} from '../../services/pdfService';
import { sendWhatsAppMessage } from '../../services/whatsappService';
import { motion, AnimatePresence } from 'motion/react';
import { useConfirm } from '../../context/ConfirmContext';
import { getIndonesianMonthYear } from '../../src/utils/dateUtils';
import { CashFlow, PopulationReport } from '../../types';

interface MonthlyActivityReportManagerProps {
  houses?: House[];
  pdfConfig?: PdfConfig;
  cashFlow?: CashFlow[];
  populationReports?: PopulationReport[];
}

export const MonthlyActivityReportManager: React.FC<MonthlyActivityReportManagerProps> = ({ 
  houses = [], 
  pdfConfig,
  cashFlow = [],
  populationReports = []
}) => {
  const confirm = useConfirm();
  const [reports, setReports] = useState<MonthlyActivityReport[]>([]);
  const [activeReport, setActiveReport] = useState<MonthlyActivityReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Form State for Monthly Activity Report
  const [form, setForm] = useState<{
    month: string;
    year: number;
    title: string;
    executiveSummary: string;
    securitySummary: string;
    socialSummary: string;
    activities: MonthlyActivityItem[];
    preparedBy: string;
    approvedBy: string;
  }>({
    month: new Date().toISOString().slice(0, 7),
    year: new Date().getFullYear(),
    title: '',
    executiveSummary: 'Situasi ketertiban, pelayanan kependudukan, dan kebersihan lingkungan RT 02 selama periode ini berjalan kondusif, harmonis, dan lancar.',
    securitySummary: 'Kondisi keamanan lingkungan aman terkendali dengan siskamling aktif dan ronda rutin setiap malam.',
    socialSummary: 'Tingkat partisipasi warga dalam kegiatan gotong royong dan sosial kemasyarakatan sangat baik.',
    activities: [
      {
        id: 'act-1',
        title: 'Kerja Bakti Akbar Lingkungan',
        category: 'Kerja Bakti',
        date: `${new Date().toISOString().slice(0, 7)}-08`,
        startTime: '07:30',
        endTime: '11:00',
        location: 'Sepanjang Selokan Utama & Lapangan Fasum RT 02',
        picName: 'Seksi Kebersihan RT 02',
        attendanceCount: 40,
        description: 'Pembersihan saluran drainase dari sampah liar dan pemangkasan ranting pohon.'
      },
      {
        id: 'act-2',
        title: 'Rapat Pleno Pengurus & Evaluasi Iuran',
        category: 'Rapat Warga',
        date: `${new Date().toISOString().slice(0, 7)}-15`,
        startTime: '19:30',
        endTime: '22:00',
        location: 'Pos Ronda / Balai Warga RT 02',
        picName: 'Sekretaris & Bendahara RT',
        attendanceCount: 25,
        description: 'Evaluasi pemasukan kas iuran, bank sampah digital, dan rencana renovasi pos siskamling.'
      }
    ],
    preparedBy: 'Sekretaris RT 02',
    approvedBy: 'Ketua RT 02'
  });

  useEffect(() => {
    const unsub = subscribeToMonthlyActivityReports((data) => {
      setReports(data as MonthlyActivityReport[]);
      if (data.length > 0 && !activeReport) {
        setActiveReport(data[0] as MonthlyActivityReport);
      } else if (activeReport) {
        const found = data.find(r => r.id === activeReport.id);
        if (found) setActiveReport(found as MonthlyActivityReport);
      }
    });
    return () => unsub();
  }, [activeReport]);

  const handleOpenCreateModal = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    setForm({
      month: currentMonth,
      year: new Date().getFullYear(),
      title: `Laporan Kegiatan Lingkungan RT 02 - ${getIndonesianMonthYear(currentMonth)}`,
      executiveSummary: 'Situasi ketertiban, pelayanan kependudukan, dan kebersihan lingkungan RT 02 selama periode ini berjalan kondusif, harmonis, dan lancar.',
      securitySummary: 'Kondisi keamanan lingkungan aman terkendali dengan siskamling aktif dan ronda rutin setiap malam.',
      socialSummary: 'Tingkat partisipasi warga dalam kegiatan gotong royong dan sosial kemasyarakatan sangat baik.',
      activities: [
        {
          id: `act-${Date.now()}-1`,
          title: 'Kerja Bakti Lingkungan',
          category: 'Kerja Bakti',
          date: `${currentMonth}-08`,
          startTime: '07:30',
          endTime: '11:00',
          location: 'Pos Ronda / Lapangan Fasum RT 02',
          picName: 'Seksi Kebersihan',
          attendanceCount: 35,
          description: 'Pembersihan saluran selokan dan pemeliharaan fasum bersama warga.'
        }
      ],
      preparedBy: 'Sekretaris RT 02',
      approvedBy: pdfConfig?.rtChairman || 'Ketua RT 02'
    });
    setEditingReportId(null);
    setIsModalOpen(true);
  };

  const handleEditReport = (report: MonthlyActivityReport) => {
    setForm({
      month: report.month || new Date().toISOString().slice(0, 7),
      year: report.year || new Date().getFullYear(),
      title: report.title || `Laporan Kegiatan - ${getIndonesianMonthYear(report.month || '')}`,
      executiveSummary: report.executiveSummary || '',
      securitySummary: report.securitySummary || '',
      socialSummary: report.socialSummary || '',
      activities: report.activities || [],
      preparedBy: report.preparedBy || 'Sekretaris RT 02',
      approvedBy: report.approvedBy || pdfConfig?.rtChairman || 'Ketua RT 02'
    });
    setEditingReportId(report.id);
    setIsModalOpen(true);
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.month) {
      toast.error('Silakan pilih periode bulan laporan.');
      return;
    }

    try {
      const payload = {
        ...form,
        title: form.title || `Laporan Kegiatan RT 02 - ${getIndonesianMonthYear(form.month)}`
      };

      if (editingReportId) {
        await updateMonthlyActivityReportInDb(editingReportId, payload);
        toast.success('Laporan kegiatan bulanan berhasil diperbarui!');
      } else {
        await addMonthlyActivityReportToDb(payload);
        toast.success('Laporan kegiatan bulanan baru berhasil disimpan!');
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Gagal menyimpan laporan kegiatan.');
    }
  };

  const handleDeleteReport = async (id: string, month: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Laporan Kegiatan Bulanan',
      message: `Apakah Anda yakin ingin menghapus laporan kegiatan periode ${getIndonesianMonthYear(month)}? File PDF yang belum diunduh akan terhapus.`,
      confirmLabel: 'Hapus',
      isDanger: true
    });

    if (isConfirmed) {
      await deleteMonthlyActivityReportFromDb(id);
      setActiveReport(null);
      toast.success('Laporan kegiatan berhasil dihapus.');
    }
  };

  const handleAddActivityItem = () => {
    const newItem: MonthlyActivityItem = {
      id: `act-${Date.now()}`,
      title: '',
      category: 'Kerja Bakti',
      date: `${form.month}-10`,
      startTime: '08:00',
      endTime: '11:00',
      location: 'Lingkungan RT 02',
      picName: 'Pengurus RT',
      attendanceCount: 20,
      description: ''
    };
    setForm({
      ...form,
      activities: [...form.activities, newItem]
    });
  };

  const filteredReports = reports.filter(r => 
    (r.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.month || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = (report: MonthlyActivityReport) => {
    if (!report.activities || report.activities.length === 0) {
      toast.error('Belum ada agenda kegiatan untuk diekspor.');
      return;
    }

    const headers = ['No', 'Tanggal', 'Jam', 'Uraian Kegiatan', 'Lokasi Kegiatan', 'Koordinator / PIC', 'Kehadiran (Warga)', 'Biaya (Rp)', 'Keterangan'];
    const rows = report.activities.map((act, idx) => [
      idx + 1,
      `"${act.date || '-'}"`,
      `"${act.startTime ? (act.endTime ? `${act.startTime} - ${act.endTime}` : act.startTime) : '-'}"`,
      `"${(act.title || '').replace(/"/g, '""')}"`,
      `"${(act.location || '').replace(/"/g, '""')}"`,
      `"${(act.picName || '').replace(/"/g, '""')}"`,
      act.attendanceCount || 0,
      act.budgetSpent || 0,
      `"${(act.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Kegiatan_RT02_${report.month || 'Bulanan'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('File Rekap CSV / Excel berhasil diunduh!');
  };

  const handleBroadcastWhatsApp = (report: MonthlyActivityReport) => {
    const monthLabel = getIndonesianMonthYear(report.month || '');
    const actCount = report.activities?.length || 0;
    
    let msg = `📢 *RINGKASAN LAPORAN KEGIATAN BULANAN RT 02*\n`;
    msg += `🗓️ *Periode:* ${monthLabel}\n\n`;
    msg += `📝 *Situasi Lingkungan:*\n_${report.executiveSummary || 'Kondisi lingkungan berjalan tertib dan harmonis.'}_\n\n`;
    
    if (report.securitySummary) {
      msg += `🛡️ *Kamtibmas:* ${report.securitySummary}\n\n`;
    }

    msg += `📌 *Agenda Terlaksana (${actCount} Kegiatan):*\n`;
    (report.activities || []).forEach((act, idx) => {
      const timeStr = act.startTime ? ` (${act.startTime} WITA)` : '';
      msg += `${idx + 1}. *${act.title}* - ${act.date}${timeStr}\n   📍 Lokasi: ${act.location}\n`;
    });

    msg += `\nDokumen resmi lengkap dapat diakses melalui Aplikasi Teras Warga RT 02.\nTerima kasih atas partisipasi seluruh warga. 🙏`;

    const targetPhone = pdfConfig?.whatsappGroupId || '';
    sendWhatsAppMessage(targetPhone, msg);
    toast.success('Ringkasan laporan siap dibagikan ke WhatsApp!');
  };

  const isEndOfMonth = new Date().getDate() >= 25;
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const isCurrentMonthReportCreated = reports.some(r => r.month === currentMonthKey);

  return (
    <div className="space-y-6">
      {/* Header Banner - Apple Minimalist Style */}
      <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 md:p-8 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-mono font-black uppercase tracking-widest mb-2 inline-block">
            📑 DOKUMEN & ARSIP RESMI RT
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Laporan Kegiatan Bulanan RT</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Pusat pembuatan dan unduhan format PDF resmi laporan bulanan kegiatan, uraian program kerja, notulensi, dan lokasi acara RT 02.
          </p>
        </div>

        <Button onClick={handleOpenCreateModal} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 text-xs py-3.5 px-6 rounded-2xl font-black uppercase tracking-wider">
          <Plus size={16} className="mr-2" /> Buat Laporan Bulan Ini
        </Button>
      </div>

      {/* End of Month Reminder Banner */}
      {isEndOfMonth && !isCurrentMonthReportCreated && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300/80 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <AlertCircle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">Pengingat Laporan Akhir Bulan ({getIndonesianMonthYear(currentMonthKey)})</h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Sudah memasuki akhir bulan. Silakan susun dan terbitkan Laporan Pertanggungjawaban Bulanan Terpadu RT 02.
              </p>
            </div>
          </div>
          <Button onClick={handleOpenCreateModal} className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shrink-0">
            <Plus size={14} className="mr-1.5" /> Susun Sekarang
          </Button>
        </div>
      )}

      {reports.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: List of Monthly Reports */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-xs font-mono font-black text-slate-400 uppercase tracking-widest">
                DAFTAR PERIODE BULANAN
              </h4>
              <span className="text-[10px] font-mono font-bold text-slate-400">{reports.length} Periode</span>
            </div>

            <div className="relative mb-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari bulan / judul laporan..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
              {filteredReports.map((rep) => {
                const isSelected = activeReport?.id === rep.id;
                return (
                  <div
                    key={rep.id}
                    onClick={() => setActiveReport(rep)}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-slate-900 text-white border-slate-800 shadow-xl shadow-slate-900/20' 
                        : 'bg-white text-slate-800 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-mono font-black uppercase tracking-wider ${
                        isSelected ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {getIndonesianMonthYear(rep.month)}
                      </span>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                        {rep.activities?.length || 0} Agenda
                      </span>
                    </div>

                    <h3 className="font-black text-sm line-clamp-1 mb-1">{rep.title}</h3>
                    <p className={`text-xs line-clamp-2 ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                      {rep.executiveSummary || 'Laporan kinerja program kerja lingkungan RT 02.'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed View & PDF Download Trigger */}
          {activeReport && (
            <div className="lg:col-span-2 space-y-6">
              {/* Report Header Card */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl shadow-indigo-950/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 relative z-10">
                  <div>
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[9px] font-mono font-black uppercase tracking-widest">
                      PERIODE: {getIndonesianMonthYear(activeReport.month)}
                    </span>
                    <h2 className="text-2xl font-black mt-2 tracking-tight">{activeReport.title}</h2>
                    <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed max-w-xl">
                      {activeReport.executiveSummary}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Orientation Selector Toggle */}
                    <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10">
                      <button
                        type="button"
                        onClick={() => setPdfOrientation('portrait')}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          pdfOrientation === 'portrait' 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-300 hover:text-white'
                        }`}
                        title="Format Vertikal (Tegak / Portrait)"
                      >
                        Vertical
                      </button>
                      <button
                        type="button"
                        onClick={() => setPdfOrientation('landscape')}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          pdfOrientation === 'landscape' 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-300 hover:text-white'
                        }`}
                        title="Format Horizontal (Melebar / Landscape)"
                      >
                        Landscape
                      </button>
                    </div>

                    <button
                      onClick={() => generateIntegratedMonthlyReportPDF(activeReport, houses, cashFlow, populationReports, pdfConfig, pdfOrientation)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 cursor-pointer border border-indigo-400/30"
                      title={`Download Dokumen Lengkap Terpadu format ${pdfOrientation === 'portrait' ? 'Vertical' : 'Landscape'}`}
                    >
                      <Sparkles size={14} className="text-amber-300 animate-pulse" /> 
                      <span>Unduh Terpadu ({pdfOrientation === 'portrait' ? 'Vertical' : 'Landscape'})</span>
                    </button>
                    <button
                      onClick={() => generateDedicatedMonthlyActivityReportPDF(activeReport, pdfConfig, pdfOrientation)}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer border border-white/10"
                      title={`Download PDF Khusus Agenda format ${pdfOrientation === 'portrait' ? 'Vertical' : 'Landscape'}`}
                    >
                      <Download size={14} /> Khusus Agenda
                    </button>
                    <button
                      onClick={() => handleExportCSV(activeReport)}
                      className="flex items-center gap-1.5 px-3 py-2.5 bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer border border-emerald-500/30"
                      title="Ekspor Rekap Kegiatan ke Format Excel / CSV"
                    >
                      <FileSpreadsheet size={14} /> Excel / CSV
                    </button>
                    <button
                      onClick={() => handleBroadcastWhatsApp(activeReport)}
                      className="flex items-center gap-1.5 px-3 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer border border-emerald-500/30"
                      title="Kirim Ringkasan Laporan ke WhatsApp Group RT"
                    >
                      <Share2 size={14} /> WhatsApp
                    </button>
                    <button 
                      onClick={() => handleEditReport(activeReport)}
                      className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
                      title="Edit Laporan"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button 
                      onClick={() => handleDeleteReport(activeReport.id, activeReport.month)}
                      className="p-2.5 bg-white/10 hover:bg-rose-600 text-white rounded-xl transition-all cursor-pointer"
                      title="Hapus Laporan"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Kamtibmas & Gotong Royong Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono relative z-10 pt-4 border-t border-slate-800">
                  <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Kamtibmas & Keamanan</span>
                    <p className="font-sans text-xs text-slate-200 mt-1">{activeReport.securitySummary || 'Kondisi lingkungan aman dan kondusif.'}</p>
                  </div>
                  <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Pengesahan Dokumen</span>
                    <p className="font-sans text-xs text-slate-200 mt-1">Dibuat: <b>{activeReport.preparedBy}</b> | Disetujui: <b>{activeReport.approvedBy}</b></p>
                  </div>
                </div>
              </div>

              {/* Table of Activities & Locations */}
              <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 tracking-tight">Rincian Agenda & Lokasi Kegiatan</h4>
                    <p className="text-xs text-slate-500 font-medium">Uraian seluruh program kerja yang terlaksana pada periode ini</p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-mono text-xs font-bold">
                    {activeReport.activities?.length || 0} Agenda Terlaksana
                  </span>
                </div>

                <div className="space-y-3">
                  {activeReport.activities && activeReport.activities.length > 0 ? (
                    activeReport.activities.map((act, index) => (
                      <div key={act.id || index} className="p-4 rounded-2xl border border-slate-200/70 bg-slate-50/50 space-y-2 hover:border-indigo-200 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            <h5 className="font-black text-sm text-slate-900">{act.title}</h5>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-slate-500">
                            📅 {act.date} {act.startTime ? `• ⏰ ${act.startTime}${act.endTime ? ` - ${act.endTime}` : ''} WITA` : ''}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-1">
                          <div className="flex items-center gap-1.5 font-medium">
                            <MapPin size={14} className="text-rose-500 shrink-0" />
                            <span className="line-clamp-1"><b>Lokasi:</b> {act.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-medium">
                            <User size={14} className="text-indigo-500 shrink-0" />
                            <span className="line-clamp-1"><b>Koordinator:</b> {act.picName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className="text-slate-400">📷</span>
                            <span className="line-clamp-1 text-emerald-600 font-bold">
                              {act.photoUrls && act.photoUrls.length > 0 ? `${act.photoUrls.length} Foto Terlampir` : 'Dokumentasi Arsip'}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 font-medium bg-white p-3 rounded-xl border border-slate-200/60 leading-relaxed mt-2">
                          <b>Keterangan:</b> {act.description || '-'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic py-4 text-center">Tidak ada rincian agenda pada laporan ini.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-[2.5rem] border border-slate-200/80">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-3 border border-slate-100">
            <FileText size={32} />
          </div>
          <h4 className="text-base font-black text-slate-800 mb-1">Belum Ada Laporan Kegiatan Bulanan</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
            Buat laporan bulanan resmi yang merangkum seluruh kegiatan, uraian hasil, dan lokasi acara RT 02 yang dapat langsung didownload format PDF.
          </p>
          <Button onClick={handleOpenCreateModal} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 px-6 rounded-2xl">
            Buat Laporan Sekarang
          </Button>
        </div>
      )}

      {/* Modal Form: Create / Edit Monthly Activity Report */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingReportId ? "Edit Laporan Kegiatan Bulanan RT" : "Buat Laporan Kegiatan Bulanan RT"} maxWidth="max-w-3xl">
        <form onSubmit={handleSaveReport} className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
          {/* Month & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Periode Bulan Laporan</label>
              <input
                type="month"
                required
                value={form.month}
                onChange={e => {
                  const m = e.target.value;
                  setForm({
                    ...form,
                    month: m,
                    title: `Laporan Kegiatan Lingkungan RT 02 - ${getIndonesianMonthYear(m)}`
                  });
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Judul Dokumen Laporan</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                placeholder="Laporan Kegiatan Bulanan RT 02"
              />
            </div>
          </div>

          {/* Executive & Security Summaries */}
          <div>
            <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Ringkasan Situasi & Kinerja Pengurus RT</label>
            <textarea
              rows={2}
              value={form.executiveSummary}
              onChange={e => setForm({ ...form, executiveSummary: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 resize-none"
              placeholder="Situasi lingkungan, pelayanan kependudukan, dan kebersihan lingkungan selama periode ini..."
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Laporan Situasi Kamtibmas / Siskamling (Opsional)</label>
            <textarea
              rows={2}
              value={form.securitySummary}
              onChange={e => setForm({ ...form, securitySummary: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 resize-none"
              placeholder="Kondisi keamanan, patroli ronda malam, dan ketertiban lingkungan..."
            />
          </div>

          {/* Activities List Section */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Rincian Agenda, Uraian & Lokasi Kegiatan</h4>
                <p className="text-[10px] text-slate-500 font-medium">Tambahkan seluruh kegiatan yang terlaksana pada bulan ini</p>
              </div>
              <button
                type="button"
                onClick={handleAddActivityItem}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus size={14} /> Tambah Kegiatan
              </button>
            </div>

            {form.activities.map((act, index) => (
              <div key={act.id || index} className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-mono text-[9px] font-black rounded uppercase">
                    Kegiatan #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = form.activities.filter((_, i) => i !== index);
                      setForm({ ...form, activities: updated });
                    }}
                    className="text-rose-500 hover:text-rose-700 p-1 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Nama Kegiatan</label>
                    <input
                      type="text"
                      required
                      placeholder="mis: Kerja Bakti Akbar, Rapat Warga"
                      value={act.title}
                      onChange={e => {
                        const updated = [...form.activities];
                        updated[index].title = e.target.value;
                        setForm({ ...form, activities: updated });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Kategori</label>
                    <select
                      value={act.category}
                      onChange={e => {
                        const updated = [...form.activities];
                        updated[index].category = e.target.value as any;
                        setForm({ ...form, activities: updated });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                    >
                      <option value="Kerja Bakti">Kerja Bakti</option>
                      <option value="Rapat Warga">Rapat Warga</option>
                      <option value="Posyandu & Kesehatan">Posyandu & Kesehatan</option>
                      <option value="Keagamaan / Sosial">Keagamaan / Sosial</option>
                      <option value="Keamanan / Siskamling">Keamanan / Siskamling</option>
                      <option value="Pembangunan & Fasum">Pembangunan & Fasum</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Tanggal</label>
                    <input
                      type="date"
                      value={act.date}
                      onChange={e => {
                        const updated = [...form.activities];
                        updated[index].date = e.target.value;
                        setForm({ ...form, activities: updated });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Jam Pelaksanaan</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        value={act.startTime || ''}
                        onChange={e => {
                          const updated = [...form.activities];
                          updated[index].startTime = e.target.value;
                          setForm({ ...form, activities: updated });
                        }}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                      />
                      <span className="text-slate-400 text-xs font-bold">-</span>
                      <input
                        type="time"
                        value={act.endTime || ''}
                        onChange={e => {
                          const updated = [...form.activities];
                          updated[index].endTime = e.target.value;
                          setForm({ ...form, activities: updated });
                        }}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Lokasi Kegiatan</label>
                    <input
                      type="text"
                      required
                      placeholder="mis: Pos Ronda RT 02"
                      value={act.location}
                      onChange={e => {
                        const updated = [...form.activities];
                        updated[index].location = e.target.value;
                        setForm({ ...form, activities: updated });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Koordinator / Seksi PIC</label>
                  <input
                    type="text"
                    placeholder="mis: Seksi Kebersihan, Ketua RT, PKK"
                    value={act.picName}
                    onChange={e => {
                      const updated = [...form.activities];
                      updated[index].picName = e.target.value;
                      setForm({ ...form, activities: updated });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Keterangan</label>
                  <textarea
                    rows={2}
                    placeholder="Keterangan / Uraian hasil kegiatan, notulensi, dan catatan penting..."
                    value={act.description}
                    onChange={e => {
                      const updated = [...form.activities];
                      updated[index].description = e.target.value;
                      setForm({ ...form, activities: updated });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                {/* Upload Foto Dokumentasi Kegiatan (Maks 3 Foto) */}
                <div className="pt-1">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase">
                      Foto Dokumentasi Kegiatan (Opsional, Maks 3)
                    </label>
                    <span className="text-[9px] font-mono text-slate-400">
                      {act.photoUrls?.length || 0}/3 Foto
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    {(act.photoUrls || []).map((pUrl, pIdx) => (
                      <div key={pIdx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group/img">
                        <img src={pUrl} alt="Dokumentasi" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...form.activities];
                            const newPhotos = (updated[index].photoUrls || []).filter((_, i) => i !== pIdx);
                            updated[index].photoUrls = newPhotos;
                            setForm({ ...form, activities: updated });
                          }}
                          className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}

                    {(!act.photoUrls || act.photoUrls.length < 3) && (
                      <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                        <Upload size={14} className="text-slate-400 mb-0.5" />
                        <span className="text-[8px] font-bold text-slate-400">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const img = new Image();
                                img.onload = () => {
                                  const canvas = document.createElement('canvas');
                                  const MAX_DIM = 400;
                                  let w = img.width;
                                  let h = img.height;
                                  if (w > h) {
                                    if (w > MAX_DIM) { h = Math.round((h * MAX_DIM) / w); w = MAX_DIM; }
                                  } else {
                                    if (h > MAX_DIM) { w = Math.round((w * MAX_DIM) / h); h = MAX_DIM; }
                                  }
                                  canvas.width = w;
                                  canvas.height = h;
                                  const ctx = canvas.getContext('2d');
                                  if (ctx) {
                                    ctx.drawImage(img, 0, 0, w, h);
                                    const base64 = canvas.toDataURL('image/jpeg', 0.7);
                                    const updated = [...form.activities];
                                    const currentPhotos = updated[index].photoUrls || [];
                                    updated[index].photoUrls = [...currentPhotos, base64];
                                    setForm({ ...form, activities: updated });
                                  }
                                };
                                img.src = reader.result as string;
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Dibuat Oleh (Sekretaris)</label>
              <input
                type="text"
                value={form.preparedBy}
                onChange={e => setForm({ ...form, preparedBy: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Disetujui Oleh (Ketua RT)</label>
              <input
                type="text"
                value={form.approvedBy}
                onChange={e => setForm({ ...form, approvedBy: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
              />
            </div>
          </div>

          <Button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-indigo-600/20">
            {editingReportId ? "Simpan Perubahan Laporan" : "Terbitkan & Simpan Laporan"}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
