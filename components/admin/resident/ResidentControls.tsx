import React from 'react';
import { Search, Calendar, Users, LayoutList, MapPin, DollarSign, UserPlus, Activity, Filter, ArrowUpDown, X, ChevronDown } from 'lucide-react';
import { generateMonthOptions } from '../../../src/utils/dateUtils';
import { ResidentRegistration } from '../../../types';

interface ResidentControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
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
  filterStatus,
  setFilterStatus,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  residentRegistrations
}) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col xl:flex-row gap-6 items-stretch xl:items-center">
        {/* Search Bar - Professional & Clean */}
        <div className="relative flex-1 group">
          <div className="absolute inset-x-4 inset-y-0 bg-indigo-500/5 rounded-[2rem] blur-xl group-focus-within:bg-indigo-500/10 transition-all duration-500"></div>
          <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-600/5 transition-all overflow-hidden px-2 py-1">
            <div className="w-12 h-12 flex items-center justify-center text-slate-400 group-focus-within:text-indigo-600 transition-colors">
              <Search size={22} strokeWidth={2} />
            </div>
            <input 
              type="text" 
              placeholder="Cari warga, nomor blok, atau kategori..." 
              className="flex-1 bg-transparent px-3 py-4 text-sm font-bold text-slate-800 placeholder:text-slate-300 placeholder:font-medium outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all rounded-xl"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* View Selection - Elegant Integrated Design */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl self-center xl:self-auto overflow-x-auto no-scrollbar shadow-inner border border-slate-200/50">
            {[
              { id: 'grid', icon: Users, label: 'Grid' },
              { id: 'table', icon: LayoutList, label: 'Tabel' },
              { id: 'map', icon: MapPin, label: 'Peta' },
              { id: 'analytics', icon: Activity, label: 'Intel' },
              { id: 'registrations', 
                icon: UserPlus, 
                label: 'Antrean', 
                badge: residentRegistrations.filter(r => r.approvalStatus === 'Pending').length 
              }
            ].map((mode) => (
              <button 
                key={mode.id}
                onClick={() => setViewMode(mode.id)} 
                className={`relative flex items-center gap-2.5 px-6 py-3 rounded-xl transition-all whitespace-nowrap active:scale-95 ${
                  viewMode === mode.id 
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60 font-black' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 font-bold'
                }`}
              >
                <mode.icon size={16} className={viewMode === mode.id ? 'text-indigo-600' : 'text-slate-400'} />
                <span className="text-[10px] uppercase tracking-[0.1em] hidden sm:inline">{mode.label}</span>
                {mode.badge ? (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white border-2 border-white shadow-lg">
                    {mode.badge}
                  </span>
                ) : null}
              </button>
            ))}
        </div>
      </div>

      {/* Advanced Filters Row */}
      <div className="flex flex-wrap items-end gap-5">
        <FilterGroup icon={<Calendar size={14} className="text-indigo-500" />} label="Periode Data">
          <select 
            className="bg-transparent w-full text-xs font-black outline-none text-slate-800 appearance-none pr-8 cursor-pointer focus:ring-0" 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)}
          >
            {generateMonthOptions(12, 60).map((m: string) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </FilterGroup>

        <FilterGroup icon={<Filter size={14} className="text-emerald-500" />} label="Status Filter">
          <select 
            className="bg-transparent w-full text-xs font-black outline-none text-slate-800 appearance-none pr-8 cursor-pointer focus:ring-0" 
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

        <FilterGroup icon={<ArrowUpDown size={14} className="text-amber-500" />} label="Urutan Daftar">
          <select 
            className="bg-transparent w-full text-xs font-black outline-none text-slate-800 appearance-none pr-8 cursor-pointer focus:ring-0" 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value as any)}
          >
            <option value="block">Blok & Nomor</option>
            <option value="name">Alfabetis (A-Z)</option>
          </select>
        </FilterGroup>

        <div className="ml-auto flex items-center gap-3 self-center">
           <div className="hidden lg:flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
             <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`w-6 h-6 rounded-full border-2 border-white bg-slate-${i*100 + 100} flex items-center justify-center text-[8px] font-black`}>W</div>
                ))}
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"><span className="text-slate-900">142</span> Warga Terdaftar</p>
           </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for uniform filter styling
const FilterGroup = ({ icon, label, children }: { icon: React.ReactNode, label: string, children: React.ReactNode }) => (
  <div className="flex flex-col gap-2 min-w-[180px] group">
    <div className="flex items-center gap-2 px-1">
       <span className="text-slate-300 group-hover:text-slate-900 transition-colors">{icon}</span>
       <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-600 transition-colors">{label}</p>
    </div>
    <div className="relative bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm hover:border-slate-900 focus-within:border-slate-900 transition-all flex items-center justify-between">
      {children}
      <ChevronDown size={14} className="text-slate-300 group-hover:text-slate-900 transition-colors pointer-events-none absolute right-4" />
    </div>
  </div>
);

