import React from 'react';
import { motion } from 'motion/react';
import { 
  User, ArrowRight, Baby, Activity, AlertCircle, FileText, 
  Search, Calendar, CheckCircle, RefreshCw, Trash2, Printer, 
  ChevronLeft, ChevronRight 
} from 'lucide-react';
import { PopulationChangeLog, House, PdfConfig } from '../../../types';
import { generateSingleMutationCertificatePDF } from '../../../services/pdfService';

interface PopulationLogsTabProps {
  populationLogs: PopulationChangeLog[];
  houses: House[];
  currentMonthLogStats: {
    newcomer: number;
    movedOut: number;
    birth: number;
    death: number;
    pendingVerification: number;
  };
  logViewMode: 'table' | 'timeline';
  setLogViewMode: (mode: 'table' | 'timeline') => void;
  logSearchTerm: string;
  setLogSearchTerm: (term: string) => void;
  logTypeFilter: 'All' | 'Newcomer' | 'MovedOut' | 'Birth' | 'Death';
  setLogTypeFilter: (type: 'All' | 'Newcomer' | 'MovedOut' | 'Birth' | 'Death') => void;
  verificationFilter: 'All' | 'Pending' | 'Approved' | 'Rejected';
  setVerificationFilter: (status: 'All' | 'Pending' | 'Approved' | 'Rejected') => void;
  startDateFilter: string;
  setStartDateFilter: (date: string) => void;
  endDateFilter: string;
  setEndDateFilter: (date: string) => void;
  itemsPerPage: number;
  setItemsPerPage: (items: number) => void;
  currentPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  logStatusFilter: 'All' | 'Unprocessed' | 'Processed';
  setLogStatusFilter: (status: 'All' | 'Unprocessed' | 'Processed') => void;
  selectedLogIds: string[];
  setSelectedLogIds: (ids: string[]) => void;
  onBulkVerifyStatus: (status: 'Approved' | 'Rejected') => void;
  onBulkMarkGenerated: (isGenerated: boolean) => void;
  onBulkDelete: () => void;
  onSelectLogForDetail: (log: PopulationChangeLog) => void;
  pdfConfig?: PdfConfig;
}

export const PopulationLogsTab: React.FC<PopulationLogsTabProps> = ({
  populationLogs,
  houses,
  currentMonthLogStats,
  logViewMode,
  setLogViewMode,
  logSearchTerm,
  setLogSearchTerm,
  logTypeFilter,
  setLogTypeFilter,
  verificationFilter,
  setVerificationFilter,
  startDateFilter,
  setStartDateFilter,
  endDateFilter,
  setEndDateFilter,
  itemsPerPage,
  setItemsPerPage,
  currentPage,
  setCurrentPage,
  logStatusFilter,
  setLogStatusFilter,
  selectedLogIds,
  setSelectedLogIds,
  onBulkVerifyStatus,
  onBulkMarkGenerated,
  onBulkDelete,
  onSelectLogForDetail,
  pdfConfig,
}) => {
  // Filter logic
  const filteredLogs = populationLogs.filter(l => {
    // Type filter
    if (logTypeFilter !== 'All' && l.type !== logTypeFilter) return false;

    // Status filter
    if (logStatusFilter === 'Unprocessed' && l.isGenerated) return false;
    if (logStatusFilter === 'Processed' && !l.isGenerated) return false;

    // Verification filter
    if (verificationFilter === 'Pending' && l.verificationStatus !== 'Pending') return false;
    if (verificationFilter === 'Approved' && l.verificationStatus && l.verificationStatus !== 'Approved') return false;
    if (verificationFilter === 'Rejected' && l.verificationStatus !== 'Rejected') return false;

    // Date range filter
    if (startDateFilter && (l.date || '') < startDateFilter) return false;
    if (endDateFilter && (l.date || '') > endDateFilter) return false;

    // Search filter
    if (logSearchTerm) {
      const term = logSearchTerm.toLowerCase();
      const matchName = (l.name || '').toLowerCase().includes(term);
      const matchDesc = (l.description || '').toLowerCase().includes(term);
      const targetHouse = houses.find(h => h.id === l.houseId);
      const matchHouse = targetHouse ? `blok ${targetHouse.block}-${targetHouse.number}`.toLowerCase().includes(term) : false;
      return matchName || matchDesc || matchHouse;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSelectAllOnPage = () => {
    const pageIds = paginatedLogs.map(l => l.id);
    const allSelected = pageIds.every(id => selectedLogIds.includes(id));
    if (allSelected) {
      setSelectedLogIds(selectedLogIds.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedLogIds(Array.from(new Set([...selectedLogIds, ...pageIds])));
    }
  };

  return (
    <motion.div
      key="logs"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Quick Stat Cards Header for Mutasi */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Warga Baru (Bulan Ini)</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">+{currentMonthLogStats.newcomer} <span className="text-xs font-semibold text-slate-400">Jiwa</span></p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><User size={18} /></div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Pindah Keluar (Bulan Ini)</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">-{currentMonthLogStats.movedOut} <span className="text-xs font-semibold text-slate-400">Jiwa</span></p>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><ArrowRight size={18} /></div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Kelahiran (Bulan Ini)</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">+{currentMonthLogStats.birth} <span className="text-xs font-semibold text-slate-400">Jiwa</span></p>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Baby size={18} /></div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider">Kematian (Bulan Ini)</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">-{currentMonthLogStats.death} <span className="text-xs font-semibold text-slate-400">Jiwa</span></p>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><Activity size={18} /></div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between col-span-2 lg:col-span-1">
          <div>
            <p className="text-[10px] font-black text-purple-600 uppercase tracking-wider">Menunggu Verifikasi</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{currentMonthLogStats.pendingVerification} <span className="text-xs font-semibold text-slate-400">Dokumen</span></p>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><AlertCircle size={18} /></div>
        </div>
      </div>

      {/* Mutation Log Toolbelt and List */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
        {/* Header & Main Search */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-slate-50/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Activity size={18} /></div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Log Mutasi Warga</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Peristiwa kependudukan real-time, pengolahan & audit trail</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 flex-wrap items-center">
            {/* View Mode Toggle: Table vs Timeline */}
            <div className="flex items-center bg-slate-200/60 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setLogViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  logViewMode === 'table' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText size={14} /> Tabel Data
              </button>
              <button
                onClick={() => setLogViewMode('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  logViewMode === 'timeline' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Activity size={14} /> Linimasa Visual
              </button>
            </div>

            <div className="relative group w-full sm:w-48">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Cari nama, rumah..."
                value={logSearchTerm}
                onChange={(e) => { setLogSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-sans"
              />
            </div>
            
            <select 
              value={logTypeFilter}
              onChange={(e) => { setLogTypeFilter(e.target.value as any); setCurrentPage(1); }}
              className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer font-sans"
            >
              <option value="All">Semua Mutasi</option>
              <option value="Newcomer">Warga Baru</option>
              <option value="MovedOut">Pindah Keluar</option>
              <option value="Birth">Kelahiran</option>
              <option value="Death">Kematian</option>
            </select>

            <select 
              value={verificationFilter}
              onChange={(e) => { setVerificationFilter(e.target.value as any); setCurrentPage(1); }}
              className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer font-sans"
            >
              <option value="All">Semua Verifikasi</option>
              <option value="Approved">Disetujui</option>
              <option value="Pending">Menunggu</option>
              <option value="Rejected">Ditolak</option>
            </select>
          </div>
        </div>

        {/* Extended Filters Bar: Date Range Picker */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar size={13} /> Periode Tanggal:
            </span>
            <input 
              type="date" 
              value={startDateFilter}
              onChange={e => { setStartDateFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
            />
            <span className="text-slate-400 font-bold">s/d</span>
            <input 
              type="date" 
              value={endDateFilter}
              onChange={e => { setEndDateFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
            />
            {(startDateFilter || endDateFilter) && (
              <button 
                onClick={() => { setStartDateFilter(''); setEndDateFilter(''); setCurrentPage(1); }}
                className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase hover:bg-slate-200 transition-all cursor-pointer"
              >
                Reset Tanggal
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold">Tampilkan:</span>
            <select 
              value={itemsPerPage}
              onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
            >
              <option value={10}>10 per hal</option>
              <option value={25}>25 per hal</option>
              <option value={50}>50 per hal</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs & Bulk Actions */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/20 flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
            {[
              { id: 'All', label: 'Semua Status', count: populationLogs.length },
              { id: 'Unprocessed', label: 'Belum Dilaporkan', count: populationLogs.filter(l => !l.isGenerated).length, color: 'text-amber-600 bg-amber-50 border-amber-100' },
              { id: 'Processed', label: 'Sudah Dilaporkan', count: populationLogs.filter(l => l.isGenerated).length, color: 'text-slate-500 bg-slate-150' }
            ].map(statusTab => {
              const isActive = logStatusFilter === statusTab.id;
              return (
                <button
                  key={statusTab.id}
                  type="button"
                  onClick={() => { setLogStatusFilter(statusTab.id as any); setCurrentPage(1); }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100/50' 
                      : 'text-slate-500 hover:text-slate-850'
                  }`}
                >
                  {statusTab.label}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : statusTab.color || 'bg-slate-200/70 text-slate-600'
                  }`}>
                    {statusTab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bulk Action Toolbar */}
          {selectedLogIds.length > 0 && (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 p-1.5 rounded-2xl animate-fade-in">
              <span className="text-[10px] font-black text-indigo-700 px-2 uppercase tracking-wider">
                {selectedLogIds.length} Terpilih
              </span>
              <button 
                onClick={() => onBulkVerifyStatus('Approved')}
                className="px-2.5 py-1 bg-emerald-600 text-white rounded-xl font-bold text-[10px] uppercase flex items-center gap-1 hover:bg-emerald-700 transition-all cursor-pointer"
                title="Setujui Verifikasi Massal"
              >
                <CheckCircle size={12} /> Setujui
              </button>
              <button 
                onClick={() => onBulkMarkGenerated(true)}
                className="px-2.5 py-1 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase flex items-center gap-1 hover:bg-indigo-700 transition-all cursor-pointer"
                title="Tandai Sudah Lapor"
              >
                <RefreshCw size={12} /> Tandai Lapor
              </button>
              <button 
                onClick={onBulkDelete}
                className="px-2.5 py-1 bg-rose-600 text-white rounded-xl font-bold text-[10px] uppercase flex items-center gap-1 hover:bg-rose-700 transition-all cursor-pointer"
                title="Hapus Terpilih"
              >
                <Trash2 size={12} /> Hapus
              </button>
              <button 
                onClick={() => setSelectedLogIds([])}
                className="px-2 py-1 text-slate-500 hover:text-slate-700 text-[10px] font-bold cursor-pointer"
              >
                Batal
              </button>
            </div>
          )}
        </div>

        {/* Timeline View vs Table View Content */}
        {logViewMode === 'timeline' ? (
          <div className="p-6 space-y-6">
            {paginatedLogs.length > 0 ? (
              <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200/80 space-y-6">
                {paginatedLogs.map((log) => {
                  const targetHouse = (houses || []).find(h => h.id === log.houseId);
                  const houseLabel = targetHouse ? `Blok ${targetHouse.block}-${targetHouse.number}` : log.houseId;

                  return (
                    <div key={log.id} className="relative group">
                      {/* Timeline Node Icon Indicator */}
                      <div className={`
                        absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white transition-transform group-hover:scale-110
                        ${log.type === 'Newcomer' ? 'bg-emerald-600' :
                          log.type === 'MovedOut' ? 'bg-amber-500' :
                          log.type === 'Birth' ? 'bg-indigo-600' : 'bg-rose-600'}
                      `}>
                        {log.type === 'Newcomer' ? <CheckCircle size={12} /> :
                         log.type === 'MovedOut' ? <ArrowRight size={12} /> :
                         log.type === 'Birth' ? <Baby size={12} /> : <Activity size={12} />}
                      </div>

                      {/* Timeline Card Content */}
                      <div 
                        onClick={() => onSelectLogForDetail(log)}
                        className="bg-white border border-slate-200/80 hover:border-indigo-300 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                              log.type === 'Newcomer' ? 'bg-emerald-50 text-emerald-700' :
                              log.type === 'MovedOut' ? 'bg-amber-50 text-amber-700' :
                              log.type === 'Birth' ? 'bg-indigo-50 text-indigo-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {log.type === 'Newcomer' ? 'Warga Baru' :
                               log.type === 'MovedOut' ? 'Pindah Keluar' :
                               log.type === 'Birth' ? 'Kelahiran' : 'Kematian'}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{log.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                            <Calendar size={13} />
                            <span>{log.date}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                            <span className="text-[9px] font-black uppercase text-slate-400 block">Kavling / Rumah</span>
                            <span className="font-bold text-slate-800 font-mono">{houseLabel}</span>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 col-span-2">
                            <span className="text-[9px] font-black uppercase text-slate-400 block">Keterangan Peristiwa</span>
                            <span className="font-medium text-slate-700 italic">{log.description || '-'}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-1">
                          <span className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                            <FileText size={12} /> Klik untuk rincian lengkap & aksi
                          </span>
                          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => generateSingleMutationCertificatePDF(log, pdfConfig)}
                              className="px-2.5 py-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all cursor-pointer"
                            >
                              Cetak PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 font-medium">
                Belum ada catatan linimasa mutasi untuk filter ini.
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-4 text-center w-10">
                    <button onClick={handleSelectAllOnPage} className="text-slate-400 hover:text-indigo-600 cursor-pointer">
                      {paginatedLogs.length > 0 && paginatedLogs.every(l => selectedLogIds.includes(l.id)) ? (
                        <CheckCircle size={16} className="text-indigo-600" />
                      ) : (
                        <div className="w-4 h-4 border border-slate-300 rounded" />
                      )}
                    </button>
                  </th>
                  <th className="p-4 text-left">Tanggal</th>
                  <th className="p-4 text-left">Jenis Mutasi</th>
                  <th className="p-4 text-left">Nama Warga</th>
                  <th className="p-4 text-left">Lokasi Kavling</th>
                  <th className="p-4 text-center">Status Domisili</th>
                  <th className="p-4 text-left">Rincian Peristiwa</th>
                  <th className="p-4 text-center">Status Verifikasi</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedLogs.length > 0 ? paginatedLogs.map((log) => {
                  const isSelected = selectedLogIds.includes(log.id);
                  return (
                    <tr key={log.id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                      <td className="p-4 text-center">
                        <button onClick={() => {
                          if (isSelected) setSelectedLogIds(selectedLogIds.filter(i => i !== log.id));
                          else setSelectedLogIds([...selectedLogIds, log.id]);
                        }} className="text-slate-400 hover:text-indigo-600 cursor-pointer">
                          {isSelected ? <CheckCircle size={16} className="text-indigo-600" /> : <div className="w-4 h-4 border border-slate-300 rounded" />}
                        </button>
                      </td>
                      <td className="p-4 font-mono text-xs font-bold text-slate-800 whitespace-nowrap">{log.date}</td>
                      <td className="p-4">
                        <span className={`
                          px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1
                          ${log.type === 'Newcomer' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 
                            log.type === 'MovedOut' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' : 
                            log.type === 'Birth' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/50' : 
                            'bg-rose-50 text-rose-700 border border-rose-200/50'}
                        `}>
                          {log.type === 'Newcomer' ? '✓ Warga Baru' : 
                           log.type === 'MovedOut' ? '⇄ Pindah Keluar' : 
                           log.type === 'Birth' ? '👶 Kelahiran' : '✝ Kematian'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><User size={14}/></div>
                          <div>
                            <p className="font-extrabold text-slate-800 cursor-pointer hover:text-indigo-600" onClick={() => onSelectLogForDetail(log)}>{log.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {(() => {
                          const targetHouse = (houses || []).find(h => h.id === log.houseId);
                          return (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-mono text-xs font-black w-fit border border-slate-200/50">
                              {targetHouse ? `Blok ${targetHouse.block}-${targetHouse.number}` : log.houseId}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-4 text-center">
                        {(() => {
                          const resType = log.details?.residenceType || 'Tetap';
                          const isMusiman = resType === 'Sewa' || resType === 'Rumah Keluarga';
                          return (
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-black uppercase tracking-wider ${
                              isMusiman 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200/80' 
                                : 'bg-indigo-100 text-indigo-800 border border-indigo-200/80'
                            }`}>
                              {isMusiman ? 'Musiman / Sewa' : 'Penduduk Tetap'}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="p-4 max-w-xs">
                        <p className="text-slate-600 text-xs font-medium italic line-clamp-1">{log.description || '-'}</p>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`
                          px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1
                          ${(!log.verificationStatus || log.verificationStatus === 'Approved') ? 'bg-emerald-100 text-emerald-800' :
                            log.verificationStatus === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}
                        `}>
                          {(!log.verificationStatus || log.verificationStatus === 'Approved') ? 'Disetujui' :
                           log.verificationStatus === 'Pending' ? 'Menunggu' : 'Ditolak'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => generateSingleMutationCertificatePDF(log, pdfConfig)}
                            className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/50 rounded-lg transition-all cursor-pointer"
                            title="Cetak Surat PDF"
                          >
                            <Printer size={14} />
                          </button>
                          <button 
                            onClick={() => onSelectLogForDetail(log)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title="Rincian Lengkap"
                          >
                            <FileText size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={9} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-5 bg-slate-50 rounded-full text-slate-300"><Clock size={40} /></div>
                        <div>
                          <p className="font-black text-slate-800 text-base">Tidak ada data mutasi</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredLogs.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p className="text-slate-500 font-semibold">
              Menampilkan <span className="font-bold text-slate-800">{((currentPage - 1) * itemsPerPage) + 1}</span> - <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> dari <span className="font-bold text-slate-800">{filteredLogs.length}</span> log mutasi
            </p>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              
              <span className="px-3 py-1 font-bold text-slate-700 bg-white border border-slate-200 rounded-xl">
                {currentPage} / {totalPages}
              </span>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
