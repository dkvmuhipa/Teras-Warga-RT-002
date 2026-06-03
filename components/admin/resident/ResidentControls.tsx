import React from 'react';
import { Search, Calendar, Users, LayoutList, MapPin, DollarSign, UserPlus, Activity, Filter, ArrowUpDown, X, ChevronDown, FileClock, FileEdit, ShieldAlert, Briefcase, Home } from 'lucide-react';
import { generateMonthOptions } from '../../../src/utils/dateUtils';
import { ResidentRegistration } from '../../../types';

interface ResidentControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  filterStatus: string;
  setFilterStatus: (status: any) => void;
  filterResidenceType: string;
  setFilterResidenceType: (type: string) => void;
  filterBlock: string;
  setFilterBlock: (block: string) => void;
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
  filterStatus,
  setFilterStatus,
  filterResidenceType,
  setFilterResidenceType,
  filterBlock,
  setFilterBlock,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  residentRegistrations
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center">
        {/* Search Bar - Professional & Clean */}
        <div className="relative flex-1 group">
          <div className="relative flex items-center bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-150 transition-all overflow-hidden px-2 py-0.5">
            <div className="w-10 h-10 flex items-center justify-center text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <Search size={18} strokeWidth={2} />
            </div>
            <input 
              type="text" 
              placeholder="Cari warga, nomor blok, status..." 
              className="flex-1 bg-transparent px-2.5 py-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all rounded-lg"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* View Selection - Elegant Integrated Design */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full xl:w-auto overflow-x-auto no-scrollbar border border-slate-200/60 shadow-xs">
            {[
              { id: 'grid', icon: Users, label: 'Grid' },
              { id: 'table', icon: LayoutList, label: 'Tabel' },
              { id: 'map', icon: MapPin, label: 'Peta' },
              { id: 'analytics', icon: Activity, label: 'Intel' },
              { id: 'mutations', icon: FileClock, label: 'Mutasi' },
              { id: 'requests', icon: FileEdit, label: 'Update' },
              { id: 'health', icon: Activity, label: 'Posyandu' },
              { id: 'guests', icon: ShieldAlert, label: 'Tamu' },
              { id: 'officials', icon: Briefcase, label: 'Pengurus' },
              { id: 'registrations', 
                icon: UserPlus, 
                label: 'Antrean', 
                badge: residentRegistrations.filter(r => r.approvalStatus === 'Pending').length 
              }
            ].map((mode) => (
              <button 
                key={mode.id}
                onClick={() => setViewMode(mode.id)} 
                className={`relative flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap active:scale-97 ${
                  viewMode === mode.id 
                    ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/50 font-bold text-xs' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/40 font-semibold text-xs'
                }`}
              >
                <mode.icon size={13} className={viewMode === mode.id ? 'text-indigo-600' : 'text-slate-400'} />
                <span className="text-[10px] uppercase tracking-wide hidden md:inline">{mode.label}</span>
                {mode.badge ? (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white border border-white shadow-xs">
                    {mode.badge}
                  </span>
                ) : null}
              </button>
            ))}
        </div>
      </div>

      {/* Advanced Filters Row */}
      <div className="flex flex-wrap items-end gap-3 pt-1">
        <FilterGroup icon={<Calendar size={13} className="text-indigo-500" />} label="Periode Data">
          <select 
            className="bg-transparent w-full text-xs font-bold outline-none text-slate-800 appearance-none pr-6 cursor-pointer focus:ring-0" 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)}
          >
            {generateMonthOptions(12, 60).map((m: string) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </FilterGroup>

        <FilterGroup icon={<Filter size={13} className="text-emerald-500" />} label="Status Filter">
          <select 
            className="bg-transparent w-full text-xs font-bold outline-none text-slate-800 appearance-none pr-6 cursor-pointer focus:ring-0" 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value as any)}
          >
            <option value="all">Semua Warga</option>
            <option value="paid">✅ Lunas Iuran</option>
            <option value="unpaid">❌ Belum Lunas</option>
            <option value="occupied">🏠 Rumah Terisi</option>
            <option value="empty">📭 Rumah Kosong</option>
            <option value="business">🏢 Tempat Usaha</option>
            <option value="verified">🛡️ Terverifikasi</option>
            <option value="unverified">❓ Belum Verifikasi</option>
            <option value="arrears">⚠️ Ada Tunggakan</option>
            <option value="pbb_taken">📄 PBB Diambil</option>
            <option value="pbb_not_taken">📄 PBB Belum Diambil</option>
          </select>
        </FilterGroup>

        <FilterGroup icon={<Home size={13} className="text-rose-500" />} label="Status Kepemilikan">
          <select 
            className="bg-transparent w-full text-xs font-bold outline-none text-slate-800 appearance-none pr-6 cursor-pointer focus:ring-0" 
            value={filterResidenceType} 
            onChange={e => setFilterResidenceType(e.target.value)}
          >
            <option value="all">Semua Status</option>
            <option value="Tetap">Tetap</option>
            <option value="Sewa">Sewa</option>
            <option value="Rumah Keluarga">Rumah Keluarga</option>
          </select>
        </FilterGroup>

        <FilterGroup icon={<MapPin size={13} className="text-blue-500" />} label="Filter Blok">
          <select 
            className="bg-transparent w-full text-xs font-bold outline-none text-slate-800 appearance-none pr-6 cursor-pointer focus:ring-0" 
            value={filterBlock} 
            onChange={e => setFilterBlock(e.target.value)}
          >
            <option value="all">Semua Blok</option>
            <option value="C5">Blok C5</option>
            <option value="C7">Blok C7</option>
            <option value="C8">Blok C8</option>
            <option value="C9">Blok C9</option>
            <option value="C10">Blok C10</option>
            <option value="C11">Blok C11</option>
            <option value="C12">Blok C12</option>
          </select>
        </FilterGroup>

        <FilterGroup icon={<ArrowUpDown size={13} className="text-amber-500" />} label="Urutan Daftar">
          <select 
            className="bg-transparent w-full text-xs font-bold outline-none text-slate-800 appearance-none pr-6 cursor-pointer focus:ring-0" 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value as any)}
          >
            <option value="block">Blok & Nomor</option>
            <option value="name">Alfabetis (A-Z)</option>
          </select>
        </FilterGroup>

        <div className="ml-auto flex items-center gap-2 self-center pt-2">
           <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs">
             <div className="flex -space-x-1.5">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`w-5 h-5 rounded-full border border-white bg-slate-${i*100 + 100} flex items-center justify-center text-[7px] font-bold`}>W</div>
                ))}
             </div>
             <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider"><span className="text-slate-850 font-bold">142</span> Keluarga</p>
           </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for uniform filter styling
const FilterGroup = ({ icon, label, children }: { icon: React.ReactNode, label: string, children: React.ReactNode }) => (
  <div className="flex flex-col gap-1 min-w-[170px] group">
    <div className="flex items-center gap-1.5 px-0.5">
       <span className="text-slate-300 group-hover:text-slate-750 transition-colors">{icon}</span>
       <p className="text-[9px] font-bold text-slate-405 uppercase tracking-wide group-hover:text-slate-600 transition-colors">{label}</p>
    </div>
    <div className="relative bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs hover:border-indigo-400 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-100 transition-all flex items-center justify-between">
      {children}
      <ChevronDown size={13} className="text-slate-400 group-hover:text-slate-700 pointer-events-none absolute right-3" />
    </div>
  </div>
);

