import React from 'react';
import { motion } from 'motion/react';
import { 
  FileText, Baby, Users, Activity, Search, XCircle, 
  List, LayoutGrid, RefreshCw, FileUp, AlertCircle, 
  Edit2, Download, Trash2 
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '../../../context/ConfirmContext';
import { PopulationReport, PopulationChangeLog, PdfConfig } from '../../../types';
import { generatePopulationReportPDF, generateMutationReportPDF } from '../../../services/pdfService';
import { generatePopulationReportExcel } from '../../../services/excelService';

interface PopulationReportsTabProps {
  reports: PopulationReport[];
  populationLogs: PopulationChangeLog[];
  reportSearchTerm: string;
  setReportSearchTerm: (term: string) => void;
  reportYearFilter: string;
  setReportYearFilter: (year: string) => void;
  viewMode: 'table' | 'grid';
  setViewMode: (mode: 'table' | 'grid') => void;
  formatIndonesianMonthYear: (monthStr: string) => string;
  onEditReport: (report: PopulationReport) => void;
  onDeleteReport: (id: string) => void;
  onAutoGenerateAllYearReports: () => void;
  isGeneratingLogs: boolean;
  pdfConfig?: PdfConfig;
}

export const PopulationReportsTab: React.FC<PopulationReportsTabProps> = ({
  reports,
  populationLogs,
  reportSearchTerm,
  setReportSearchTerm,
  reportYearFilter,
  setReportYearFilter,
  viewMode,
  setViewMode,
  formatIndonesianMonthYear,
  onEditReport,
  onDeleteReport,
  onAutoGenerateAllYearReports,
  isGeneratingLogs,
  pdfConfig,
}) => {
  const confirm = useConfirm();

  const currentYearStr = new Date().getFullYear().toString();
  const thisYearReports = (reports || []).filter(
    r => r.year?.toString() === currentYearStr || r.month?.startsWith(currentYearStr)
  );
  const totalBirthsThisYear = thisYearReports.reduce((acc, r) => acc + (r.birthCount || 0), 0);
  const totalNewcomersThisYear = thisYearReports.reduce((acc, r) => acc + (r.newcomerCount || 0), 0);
  const avgPopulation = reports.length > 0 
    ? Math.round(reports.reduce((acc, r) => acc + (r.initialPopulation + r.birthCount + r.newcomerCount - r.movedOutCount - (r.deathCount || 0)), 0) / reports.length)
    : 0;

  // Filter & sort
  let processedReports = [...(reports || [])].sort((a, b) => (b.month || '').localeCompare(a.month || ''));
  if (reportYearFilter !== 'All') {
    processedReports = processedReports.filter(r => (r.year?.toString() === reportYearFilter) || (r.month && r.month.startsWith(reportYearFilter)));
  }
  if (reportSearchTerm.trim()) {
    const term = reportSearchTerm.toLowerCase();
    processedReports = processedReports.filter(r => {
      const indoMonth = formatIndonesianMonthYear(r.month).toLowerCase();
      return r.month.toLowerCase().includes(term) || indoMonth.includes(term) || (r.year && r.year.toString().includes(term));
    });
  }

  const monthCounts: Record<string, number> = {};
  processedReports.forEach(r => {
    monthCounts[r.month] = (monthCounts[r.month] || 0) + 1;
  });

  return (
    <motion.div
      key="reports"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Quick Stat Cards for Reports */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Arsip Laporan</p>
            <p className="text-xl font-black text-slate-800">{reports.length} <span className="text-xs font-semibold text-slate-400">Periode</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <Baby size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Lahir Thn {currentYearStr}</p>
            <p className="text-xl font-black text-emerald-600">+{totalBirthsThisYear} <span className="text-xs font-semibold text-emerald-400">Jiwa</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Masuk Thn {currentYearStr}</p>
            <p className="text-xl font-black text-blue-600">+{totalNewcomersThisYear} <span className="text-xs font-semibold text-blue-400">Jiwa</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rata-Rata Jiwa / Bulan</p>
            <p className="text-xl font-black text-slate-800">{avgPopulation} <span className="text-xs font-semibold text-slate-400">Warga</span></p>
          </div>
        </div>
      </div>

      {/* Reports Helper Banner */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent p-5 rounded-3xl border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
            <FileText size={14} className="text-indigo-600" /> Automasi & Arsip Laporan Bulanan
          </h4>
          <p className="text-slate-600 text-xs font-medium leading-relaxed max-w-2xl">
            Sistem mendukung generasi laporan otomatis berdasarkan seluruh kegiatan mutasi warga. Tekan <strong>Generate Log Otomatis</strong> untuk mengompilasi rekapitulasi periode terkini secara presisi!
          </p>
        </div>
      </div>

      {/* Filter Bar & Controls */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={reportSearchTerm}
              onChange={(e) => setReportSearchTerm(e.target.value)}
              placeholder="Cari bulan (mis: Juni, 2026, 06)..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
            {reportSearchTerm && (
              <button onClick={() => setReportSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <XCircle size={14} />
              </button>
            )}
          </div>

          {/* Filter Tahun */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tahun:</span>
            <select
              value={reportYearFilter}
              onChange={(e) => setReportYearFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="All">Semua Tahun</option>
              {Array.from(new Set((reports || []).map(r => r.year || (r.month ? parseInt(r.month.split('-')[0]) : null)).filter(Boolean)))
                .sort((a, b) => (b as number) - (a as number))
                .map(y => (
                  <option key={y} value={y?.toString()}>{y}</option>
                ))}
            </select>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
          <button 
            onClick={() => setViewMode('table')} 
            className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white shadow-xs text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            title="Tampilan Tabel"
          >
            <List size={16}/>
          </button>
          <button 
            onClick={() => setViewMode('grid')} 
            className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-xs text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            title="Tampilan Grid"
          >
            <LayoutGrid size={16}/>
          </button>
        </div>
      </div>

      {/* Table vs Grid Display */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/40">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Daftar Laporan Bulanan</h3>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
              Menampilkan {processedReports.length} dari {reports.length} Rekapitulasi Berkas Kependudukan
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onAutoGenerateAllYearReports}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              title="Hapus laporan lama & generate ulang laporan Januari-Agustus secara bersih & presisi"
            >
              <RefreshCw size={14} className={isGeneratingLogs ? "animate-spin" : ""} />
              Reset & Auto-Generate 2026
            </button>

            <button
              type="button"
              onClick={() => generatePopulationReportExcel(processedReports, populationLogs)}
              disabled={processedReports.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              title="Unduh Seluruh Rekapitulasi Laporan Bulanan ke dalam 1 File Excel (.xlsx)"
            >
              <FileUp size={15} />
              Export Semua Periode (.xlsx)
            </button>
          </div>
        </div>
        
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-5 text-left text-xs uppercase tracking-widest text-slate-400">Periode Bulan</th>
                  <th className="p-5 text-right text-xs uppercase tracking-widest text-slate-400">Warga Awal</th>
                  <th className="p-5 text-right text-xs uppercase tracking-widest text-slate-400">Kelahiran</th>
                  <th className="p-5 text-right text-xs uppercase tracking-widest text-slate-400">Kematian</th>
                  <th className="p-5 text-right text-xs uppercase tracking-widest text-slate-400">Masuk</th>
                  <th className="p-5 text-right text-xs uppercase tracking-widest text-slate-400">Keluar</th>
                  <th className="p-5 text-right text-xs uppercase tracking-widest text-slate-400">Warga Akhir</th>
                  <th className="p-5 text-center text-xs uppercase tracking-widest text-slate-400">Aksi & Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedReports && processedReports.length > 0 ? processedReports.map(r => {
                  const isDuplicate = monthCounts[r.month] > 1;
                  const finalPop = r.initialPopulation + r.birthCount + r.newcomerCount - r.movedOutCount - (r.deathCount || 0);

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xs border border-indigo-100/50 shadow-2xs">
                            {r.month.split('-')[1]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-black text-slate-800 text-sm">{formatIndonesianMonthYear(r.month)}</p>
                              {isDuplicate && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-bold text-[9px] uppercase tracking-wider inline-flex items-center gap-1" title="Terdapat lebih dari 1 arsip laporan untuk bulan ini">
                                  <AlertCircle size={10} /> Duplikat
                                </span>
                              )}
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Kode Periode: {r.month}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-right font-bold text-slate-600">{r.initialPopulation}</td>
                      <td className="p-5 text-right">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-black text-xs inline-block">+{r.birthCount}</span>
                      </td>
                      <td className="p-5 text-right">
                        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg font-black text-xs inline-block">-{r.deathCount || 0}</span>
                      </td>
                      <td className="p-5 text-right">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-black text-xs inline-block">+{r.newcomerCount}</span>
                      </td>
                      <td className="p-5 text-right">
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg font-black text-xs inline-block">-{r.movedOutCount}</span>
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-slate-900 text-base">{finalPop}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Total Jiwa</span>
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit Button */}
                          <button 
                            onClick={() => onEditReport(r)}
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-200/60 transition-all cursor-pointer"
                            title="Edit Laporan"
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* Download Excel */}
                          <button 
                            onClick={() => generatePopulationReportExcel(r, populationLogs)}
                            className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200/60 rounded-xl transition-all cursor-pointer"
                            title="Download File Excel (.xlsx) Rekapitulasi & Mutasi"
                          >
                            <FileUp size={15} className="text-emerald-600" />
                          </button>

                          {/* Download PDF Rekap Demografi */}
                          <button 
                            onClick={() => generatePopulationReportPDF(r, pdfConfig)}
                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/60 rounded-xl transition-all cursor-pointer"
                            title="Download PDF Rekapitulasi Demografi RT"
                          >
                            <Download size={15} className="text-rose-500" />
                          </button>

                          {/* Download PDF Laporan Mutasi Resmi Kelurahan */}
                          <button 
                            onClick={() => generateMutationReportPDF(r, populationLogs, pdfConfig)}
                            className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200/60 rounded-xl transition-all cursor-pointer"
                            title="Cetak Laporan Mutasi Bulanan Resmi PDF (Format Kelurahan & Kop Surat)"
                          >
                            <FileText size={15} className="text-emerald-600" />
                          </button>

                          {/* Delete Button */}
                          <button 
                            onClick={async () => {
                              const isConfirmed = await confirm({
                                title: 'Hapus Laporan',
                                message: `Apakah Anda yakin ingin menghapus laporan bulan ${formatIndonesianMonthYear(r.month)}? Log mutasi terkait akan kembali berstatus Belum Dilaporkan.`,
                                confirmLabel: 'Hapus Laporan',
                                isDanger: true
                              });
                              if (isConfirmed) {
                                onDeleteReport(r.id);
                                toast.success('Laporan berhasil dihapus.');
                              }
                            }} 
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 border border-transparent rounded-xl transition-all cursor-pointer"
                            title="Hapus Laporan"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={8} className="p-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-slate-50 rounded-full text-slate-300"><FileText size={40} /></div>
                        <div>
                          <p className="font-black text-slate-800">Tidak Ada Laporan Bulanan</p>
                          <p className="text-slate-400 text-xs font-semibold mt-1">
                            {reportSearchTerm || reportYearFilter !== 'All' 
                              ? 'Tidak ditemukan laporan yang sesuai dengan kata kunci atau filter tahun.'
                              : 'Gunakan tombol Generate atau Tambah di kanan atas untuk membuat laporan pertama.'}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 bg-slate-50/20">
            {processedReports && processedReports.length > 0 ? processedReports.map(r => {
              const isDuplicate = monthCounts[r.month] > 1;
              const finalPop = r.initialPopulation + r.birthCount + r.newcomerCount - r.movedOutCount - (r.deathCount || 0);

              return (
                <div key={r.id} className="p-5 bg-white rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all group relative">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-indigo-50 rounded-2xl shadow-2xs flex items-center justify-center font-black text-indigo-600 border border-indigo-100">
                        {r.month.split('-')[1]}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-black text-slate-800 text-sm">{formatIndonesianMonthYear(r.month)}</h4>
                          {isDuplicate && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-md font-bold text-[8px] uppercase tracking-wider" title="Duplikat">
                              Duplikat
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{r.month}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => onEditReport(r)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" title="Edit Laporan"><Edit2 size={14}/></button>
                      <button onClick={() => generatePopulationReportExcel(r, populationLogs)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer" title="Download Excel"><FileUp size={14} className="text-emerald-600" /></button>
                      <button onClick={() => generatePopulationReportPDF(r, pdfConfig)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Download Rekap PDF"><Download size={14} className="text-rose-500" /></button>
                      <button onClick={() => generateMutationReportPDF(r, populationLogs, pdfConfig)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer" title="Cetak PDF Mutasi Kelurahan"><FileText size={14} className="text-emerald-600" /></button>
                      <button 
                        onClick={async () => {
                          const isConfirmed = await confirm({
                            title: 'Hapus Laporan',
                            message: `Apakah Anda yakin ingin menghapus laporan bulan ${formatIndonesianMonthYear(r.month)}?`,
                            confirmLabel: 'Hapus',
                            isDanger: true
                          });
                          if (isConfirmed) {
                            onDeleteReport(r.id);
                            toast.success('Laporan berhasil dihapus.');
                          }
                        }} 
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Laporan"
                      >
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Awal Bulan</p>
                      <p className="font-black text-slate-800 text-sm">{r.initialPopulation}</p>
                    </div>
                    <div className="bg-indigo-50/40 p-3 rounded-2xl border border-indigo-100">
                      <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1">Akhir Bulan</p>
                      <p className="font-extrabold text-indigo-600 text-sm">{finalPop}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 grid grid-cols-4 text-center text-[10px] font-extrabold">
                    <div>
                      <span className="block text-emerald-600">Lahir</span>
                      <span className="block mt-0.5 font-sans">+{r.birthCount}</span>
                    </div>
                    <div>
                      <span className="block text-rose-600">Wafat</span>
                      <span className="block mt-0.5 font-sans">-{r.deathCount || 0}</span>
                    </div>
                    <div>
                      <span className="block text-blue-600">Masuk</span>
                      <span className="block mt-0.5 font-sans">+{r.newcomerCount}</span>
                    </div>
                    <div>
                      <span className="block text-amber-600">Keluar</span>
                      <span className="block mt-0.5 font-sans">-{r.movedOutCount}</span>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="col-span-full p-12 text-center">
                <p className="font-black text-slate-700">Tidak ada laporan ditemukan</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
