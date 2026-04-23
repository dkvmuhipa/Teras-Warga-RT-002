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
        {/* Search Bar - Ultra Premium */}
        <div className="relative flex-1 group">
          <div className="absolute inset-x-4 inset-y-0 bg-indigo-500/10 rounded-3xl blur-2xl group-focus-within:bg-indigo-500/20 transition-all duration-500"></div>
          <div className="relative flex items-center bg-white border border-slate-200 rounded-3xl shadow-sm hover:border-slate-300 focus-within:border-slate-900 focus-within:ring-0 transition-all overflow-hidden p-2">
            <div className="w-12 h-12 flex items-center justify-center text-slate-300 group-focus-within:text-slate-900 transition-colors">
              <Search size={20} strokeWidth={2.5} />
            </div>
            <input 
              type="text" 
              placeholder="Cari warga, blok, nomor, atau anggota keluarga..." 
              className="flex-1 bg-transparent px-2 py-4 text-sm font-black text-slate-900 placeholder:text-slate-300 placeholder:font-bold outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all rounded-2xl"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* View Selection - Premium Glassmorphism like buttons */}
        <div className="flex bg-white p-1.5 rounded-[2rem] border border-slate-200 self-center xl:self-auto overflow-x-auto no-scrollbar shadow-sm">
            {[
              { id: 'grid', icon: Users, label: 'Grid' },
              { id: 'table', icon: LayoutList, label: 'Tabel' },
              { id: 'map', icon: MapPin, label: 'Peta' },
              { id: 'analytics', icon: Activity, label: 'Analisa' },
              { id: 'registrations', 
                icon: UserPlus, 
                label: 'Regis', 
                badge: residentRegistrations.filter(r => r.approvalStatus === 'Pending').length 
              }
            ].map((mode) => (
              <button 
                key={mode.id}
                onClick={() => setViewMode(mode.id)} 
                className={`relative flex items-center gap-2 px-5 py-3 rounded-2xl transition-all whitespace-nowrap active:scale-95 ${
                  viewMode === mode.id 
                    ? 'bg-slate-900 text-white shadow-xl font-black ring-1 ring-slate-900' 
                    : 'text-slate-400 hover:text-slate-600 font-bold'
                }`}
              >
                <mode.icon size={18} />
                <span className="text-[10px] uppercase tracking-[0.15em] hidden sm:inline">{mode.label}</span>
                {mode.badge ? (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white border-2 border-white shadow-lg animate-bounce">
                    {mode.badge}
                  </span>
                ) : null}
              </button>
            ))}
        </div>
      </div>

      {/* Tertiary Filters Row */}
      <div className="flex flex-wrap items-end gap-6">
        <FilterGroup icon={<Calendar size={14} />} label="Periode Data">
          <select 
            className="bg-transparent w-full text-xs font-black outline-none text-slate-900 appearance-none pr-8 cursor-pointer" 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)}
          >
            {generateMonthOptions(12, 36).map((m: string) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </FilterGroup>

        <FilterGroup icon={<Filter size={14} />} label="Status Filter">
          <select 
            className="bg-transparent w-full text-xs font-black outline-none text-slate-900 appearance-none pr-8 cursor-pointer" 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value as any)}
          >
            <option value="all">Semua Warga</option>
            <option value="paid">Sudah Lunas</option>
            <option value="unpaid">Belum Lunas</option>
            <option value="occupied">Dihuni</option>
            <option value="empty">Kosong</option>
            <option value="business">Tempat Usaha</option>
            <option value="arrears">Ada Tunggakan</option>
          </select>
        </FilterGroup>

        <FilterGroup icon={<ArrowUpDown size={14} />} label="Urutan">
          <select 
            className="bg-transparent w-full text-xs font-black outline-none text-slate-900 appearance-none pr-8 cursor-pointer" 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value as any)}
          >
            <option value="block">Blok & Nomor</option>
            <option value="name">Nama Warga</option>
          </select>
        </FilterGroup>

        <div className="ml-auto hidden xl:block self-center">
           <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl">
             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></div>
             <span className="text-[10px] font-black uppercase tracking-widest">Smart Filter Aktif</span>
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

