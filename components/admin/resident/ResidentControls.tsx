import React from 'react';
import { Search, Calendar, Users, LayoutList, MapPin, DollarSign, UserPlus, Activity } from 'lucide-react';
import { ResidentRegistration } from '../../../types';

interface ResidentControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  getIndonesianMonthYear: (date: Date) => string;
  filterStatus: string;
  setFilterStatus: (status: any) => void;
  sortBy: 'name' | 'block';
  setSortBy: (sort: 'name' | 'block') => void;
  viewMode: string;
  setViewMode: (mode: any) => void;
  residentRegistrations: ResidentRegistration[];
}

export const ResidentControls: React.FC<ResidentControlsProps> = ({
  searchTerm,
  setSearchTerm,
  selectedMonth,
  setSelectedMonth,
  getIndonesianMonthYear,
  filterStatus,
  setFilterStatus,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  residentRegistrations
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-3 bg-white p-3 md:p-4 rounded-2xl border border-slate-100 shadow-sm">
      <div className="relative flex-1 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
        <input 
          type="text" 
          placeholder="Cari nama, pemilik, blok, nomor, atau telepon..." 
          className="w-full pl-10 pr-4 py-2 md:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-2 sm:flex flex-wrap gap-2">
        <div className="flex items-center gap-2 px-3 bg-slate-50 border border-slate-200 rounded-xl">
          <Calendar size={14} className="text-slate-400" />
          <select 
            className="bg-transparent py-2 md:py-2.5 text-[9px] sm:text-[10px] md:text-xs font-bold outline-none w-full" 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)}
          >
            {Array.from({ length: new Date().getMonth() + 1 }).map((_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              const monthsId = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
              const m = `${monthsId[d.getMonth()]} ${d.getFullYear()}`;
              return <option key={m} value={m}>{m}</option>;
            })}
          </select>
        </div>
        
        <select className="flex-1 p-2 md:p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[9px] sm:text-[10px] md:text-xs font-bold outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
            <option value="all">Semua Status</option>
            <option value="paid">Lunas</option>
            <option value="unpaid">Belum Lunas</option>
            <option value="occupied">Dihuni</option>
            <option value="empty">Kosong</option>
            <option value="business">Usaha</option>
            <option value="arrears">Ada Tunggakan</option>
        </select>

        <select className="flex-1 p-2 md:p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[9px] sm:text-[10px] md:text-xs font-bold outline-none sm:w-40" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
            <option value="block">Urutkan Blok</option>
            <option value="name">Urutkan Nama</option>
        </select>

        <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 col-span-2 sm:col-span-1 justify-center overflow-x-auto no-scrollbar">
            <button onClick={() => setViewMode('grid')} className={`flex-1 sm:flex-none p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><Users size={16} className="md:w-[18px] md:h-[18px]"/></button>
            <button onClick={() => setViewMode('table')} className={`flex-1 sm:flex-none p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Tabel"><LayoutList size={16} className="md:w-[18px] md:h-[18px]"/></button>
            <button onClick={() => setViewMode('map')} className={`flex-1 sm:flex-none p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Peta"><MapPin size={16} className="md:w-[18px] md:h-[18px]"/></button>
            <button onClick={() => setViewMode('analytics')} className={`flex-1 sm:flex-none p-2 rounded-lg transition-all ${viewMode === 'analytics' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Analitik"><Activity size={16} className="md:w-[18px] md:h-[18px]"/></button>
            <button onClick={() => setViewMode('iuran')} className={`flex-1 sm:flex-none p-2 rounded-lg transition-all ${viewMode === 'iuran' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Laporan Iuran"><DollarSign size={16} className="md:w-[18px] md:h-[18px]"/></button>
            <div className="relative flex-1 sm:flex-none">
              <button onClick={() => setViewMode('registrations')} className={`w-full p-2 rounded-lg transition-all ${viewMode === 'registrations' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Pendaftaran Baru">
                <UserPlus size={16} className="mx-auto md:w-[18px] md:h-[18px]"/>
                {residentRegistrations.filter(r => r.approvalStatus === 'Pending').length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 md:w-4 md:h-4 bg-rose-500 text-white text-[7px] md:text-[8px] font-black rounded-full flex items-center justify-center border border-white">
                    {residentRegistrations.filter(r => r.approvalStatus === 'Pending').length}
                  </span>
                )}
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};
