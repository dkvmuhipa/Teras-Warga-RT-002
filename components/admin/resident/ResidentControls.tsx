import React, { useState } from 'react';
import { Search, Calendar, Users, LayoutList, MapPin, UserPlus, Activity, Filter, ArrowUpDown, X, ChevronDown, FileClock, FileEdit, ShieldAlert, Briefcase, Home, SlidersHorizontal, Check } from 'lucide-react';
import { generateMonthOptions } from '../../../src/utils/dateUtils';
import { ResidentRegistration } from '../../../types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

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
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Calculate active filter count (excluding defaults)
  const activeFiltersCount = [
    filterStatus !== 'all',
    filterResidenceType !== 'all',
    filterBlock !== 'all',
    sortBy !== 'block'
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setFilterStatus('all');
    setFilterResidenceType('all');
    setFilterBlock('all');
    setSortBy('block');
    toast.success('Filter berhasil disetel ulang');
  };

  const navModes = [
    { id: 'grid', icon: Users, label: 'Grid' },
    { id: 'table', icon: LayoutList, label: 'Tabel' },
    { id: 'map', icon: MapPin, label: 'Peta' },
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
  ];

  return (
    <div className="space-y-4">
      {/* 1. Main Compact Multi-bar System (Optimized for Mobile) */}
      <div className="flex flex-col gap-3.5 bg-white p-3.5 md:p-5 rounded-[2rem] border border-slate-100 shadow-[0_10px_30px_rgba(241,245,249,0.5)]">
        
        {/* Search Input Row with Filter Toggle */}
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 group">
            <div className="relative flex items-center bg-slate-50/80 border border-slate-200/80 rounded-2xl focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all duration-300 overflow-hidden px-3.5 py-1">
              <div className="w-8 h-8 flex items-center justify-center text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <Search size={16} strokeWidth={2} />
              </div>
              <input 
                type="text" 
                placeholder="Cari nama warga, nomor rumah, blok, atau no HP..." 
                className="flex-1 bg-transparent px-2.5 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-lg"
                >
                  <X size={13} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Selector Toggle for Mobile Filters */}
          <button
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className={`lg:hidden flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border transition-all active:scale-95 shrink-0 ${
              showFiltersMobile || activeFiltersCount > 0
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 font-bold hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal size={14} className={showFiltersMobile ? 'text-indigo-600 animate-pulse' : 'text-slate-500'} />
            <span className="text-xs font-bold hidden sm:inline">Filter</span>
            {activeFiltersCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-black text-white shadow-sm leading-none">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* View Mode Switching - Responsive Mobile/Desktop Unified Segment */}
        <div className="pt-1 border-t border-slate-100/80">
          <div className="flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 overflow-x-auto no-scrollbar scroll-smooth snap-x max-w-full">
            {navModes.map((mode) => {
              const Icon = mode.icon;
              const isActive = viewMode === mode.id;
              
              return (
                <button 
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)} 
                  className={`snap-center flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 whitespace-nowrap active:scale-95 shrink-0 select-none ${
                    isActive 
                      ? 'bg-white text-indigo-600 font-extrabold text-xs shadow-sm ring-1 ring-slate-200/50' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-bold text-xs'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-indigo-600 stroke-[2.5px]' : 'text-slate-400 stroke-[2px]'} />
                  <span className="text-[11px] font-bold">{mode.label}</span>
                  {mode.badge ? (
                    <span className={`flex h-4 min-w-4 items-center justify-center rounded-full text-[9px] font-black px-1 ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-rose-500 text-white'
                    }`}>
                      {mode.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Responsive Filters Block */}
      <AnimatePresence initial={false}>
        {(showFiltersMobile || !showFiltersMobile) && (
          <div className={`${showFiltersMobile ? 'block' : 'hidden lg:block'}`}>
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-white border border-slate-100/80 p-4 md:p-5 rounded-[2rem] shadow-[0_4px_24px_rgba(148,163,184,0.04)] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-indigo-650" />
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Prameter Filter Lanjutan</h4>
                </div>
                {activeFiltersCount > 0 && (
                  <button 
                    onClick={handleResetFilters}
                    className="text-[10px] font-black text-rose-500 hover:text-rose-700 bg-rose-50 border border-rose-100/50 px-2.5 py-1 rounded-xl uppercase tracking-wider transition-colors"
                  >
                    Setel Ulang Filter ({activeFiltersCount})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* Month/Period Data */}
                <FilterGroup icon={<Calendar size={13} className="text-indigo-500 stroke-[2.5px]" />} label="Periode Data">
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

                {/* Filter Status */}
                <FilterGroup icon={<Filter size={13} className="text-emerald-500 stroke-[2.5px]" />} label="Status Filter">
                  <select 
                    className="bg-transparent w-full text-xs font-bold outline-none text-slate-800 appearance-none pr-6 cursor-pointer focus:ring-0" 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value as any)}
                  >
                    <option value="all">🛡️ Semua Kategori</option>
                    <option value="paid">✅ Lunas Iuran</option>
                    <option value="unpaid">❌ Belum Lunas</option>
                    <option value="occupied">🏠 Rumah Terisi</option>
                    <option value="empty">📭 Rumah Kosong</option>
                    <option value="business">🏢 Tempat Usaha</option>
                    <option value="visiting">🧹 Mengunjungi</option>
                    <option value="verified">🛡️ Terverifikasi</option>
                    <option value="unverified">❓ Belum Verifikasi</option>
                    <option value="arrears">⚠️ Ada Tunggakan</option>
                    <option value="pbb_taken">📄 PBB Diambil</option>
                    <option value="pbb_not_taken">📄 PBB Belum Diambil</option>
                    <option value="bansos">🎁 Penerima Bansos (PKH/BLT)</option>
                    <option value="disability">♿ Kelompok Rentan (Disabilitas/Yatim)</option>
                  </select>
                </FilterGroup>

                {/* Residence status */}
                <FilterGroup icon={<Home size={13} className="text-rose-500 stroke-[2.5px]" />} label="Status Kepenghunian">
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

                {/* Block and Map Pin filter */}
                <FilterGroup icon={<MapPin size={13} className="text-blue-500 stroke-[2.5px]" />} label="Filter Blok">
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

                {/* Sorting options */}
                <FilterGroup icon={<ArrowUpDown size={13} className="text-amber-500 stroke-[2.5px]" />} label="Urutan Daftar">
                  <select 
                    className="bg-transparent w-full text-xs font-bold outline-none text-slate-800 appearance-none pr-6 cursor-pointer focus:ring-0" 
                    value={sortBy} 
                    onChange={e => setSortBy(e.target.value as any)}
                  >
                    <option value="block">Blok & Nomor</option>
                    <option value="name">Alfabetis (A-Z)</option>
                  </select>
                </FilterGroup>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Dynamic Interactive Info / Badge Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between px-4 py-3 bg-slate-50/70 border border-slate-100 rounded-2xl text-[10px] font-black text-slate-550 uppercase tracking-widest shadow-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <span>
            Filter Aktif: <span className="text-indigo-600 bg-white border border-slate-100 px-2 py-0.5 rounded-lg shadow-xs overflow-hidden max-w-[150px] inline-block truncate align-bottom font-black">{filterStatus === 'all' ? 'semua warga' : filterStatus}</span>
          </span>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/55">
          <div className="flex -space-x-1 overflow-hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[7px] font-black text-indigo-600 shadow-xs uppercase">RT</div>
            ))}
          </div>
          <span className="text-right">
            terverifikasi: <span className="text-slate-800 font-extrabold">142 Keluarga</span>
          </span>
        </div>
      </div>
    </div>
  );
};

// Compact polished filter grouping element
const FilterGroup = ({ icon, label, children }: { icon: React.ReactNode, label: string, children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5 group w-full">
    <div className="flex items-center gap-1.5 px-1">
       <span className="text-slate-400 group-hover:text-indigo-500 transition-colors duration-250">{icon}</span>
       <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider group-hover:text-slate-700 transition-colors duration-250">{label}</span>
    </div>
    <div className="relative bg-slate-50/75 border border-slate-100/80 rounded-2xl px-3 py-2.5 hover:border-indigo-400/80 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100/50 transition-all duration-350 flex items-center justify-between">
      {children}
      <ChevronDown size={13} className="text-slate-400 group-hover:text-slate-650 pointer-events-none absolute right-3 transition-colors duration-200" strokeWidth={2.5} />
    </div>
  </div>
);
