import React from 'react';
import { motion } from 'motion/react';
import { Users, Home, ShieldCheck, UserMinus } from 'lucide-react';

interface ResidentStatsProps {
  totalResidents: number;
  occupiedHouses: number;
  emptyHouses: number;
  verifiedCount: number;
  itemVariants: any;
  ktpLocalCount?: number;
  ktpExternalCount?: number;
  onFilterKtp?: (filterType: string) => void;
}

export const ResidentStats: React.FC<ResidentStatsProps> = ({ 
  totalResidents, 
  occupiedHouses, 
  emptyHouses,
  verifiedCount,
  itemVariants,
  ktpLocalCount = 0,
  ktpExternalCount = 0,
  onFilterKtp
}) => {
  const localPct = Math.round((ktpLocalCount / (occupiedHouses || 1)) * 100);
  const externalPct = Math.round((ktpExternalCount / (occupiedHouses || 1)) * 100);

  return (
    <motion.div 
      variants={itemVariants}
      className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-3 sm:p-4"
    >
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-2.5 sm:gap-3 items-center">
        {/* Populasi */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-indigo-50/50 border border-indigo-100/70">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Users size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider truncate">Total Warga</p>
            <p className="text-lg font-extrabold text-slate-900 font-mono tabular-nums leading-tight">
              {totalResidents} <span className="text-[11px] font-semibold text-slate-500 font-sans">Jiwa</span>
            </p>
          </div>
        </div>

        {/* Terverifikasi */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/60">
          <div className="w-9 h-9 rounded-xl bg-white text-indigo-600 border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldCheck size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">Terverifikasi</p>
            <p className="text-lg font-extrabold text-slate-900 font-mono tabular-nums leading-tight">
              {verifiedCount} <span className="text-[11px] font-semibold text-slate-400 font-sans">Jiwa</span>
            </p>
          </div>
        </div>

        {/* Hunian Terisi */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-100/70">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Home size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider truncate">Hunian Terisi</p>
            <p className="text-lg font-extrabold text-slate-900 font-mono tabular-nums leading-tight">
              {occupiedHouses} <span className="text-[11px] font-semibold text-slate-500 font-sans">Unit</span>
            </p>
          </div>
        </div>

        {/* Hunian Kosong */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/60">
          <div className="w-9 h-9 rounded-xl bg-white text-slate-500 border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
            <UserMinus size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">Kosong</p>
            <p className="text-lg font-extrabold text-slate-900 font-mono tabular-nums leading-tight">
              {emptyHouses} <span className="text-[11px] font-semibold text-slate-400 font-sans">Unit</span>
            </p>
          </div>
        </div>

        {/* KTP Setempat (Quick Filter) */}
        <button
          type="button"
          onClick={() => onFilterKtp?.('ktp_local')}
          className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/70 text-left transition-colors cursor-pointer active:scale-[0.99]"
          title="Klik untuk filter warga KTP Setempat RT 02"
        >
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider truncate flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              KTP Lokal
            </p>
            <p className="text-base font-extrabold text-emerald-950 font-mono tabular-nums leading-tight mt-0.5">
              {ktpLocalCount} <span className="text-[10px] font-bold text-emerald-700">({localPct}%)</span>
            </p>
          </div>
        </button>

        {/* KTP Luar Wilayah (Quick Filter) */}
        <button
          type="button"
          onClick={() => onFilterKtp?.('ktp_external')}
          className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/70 text-left transition-colors cursor-pointer active:scale-[0.99]"
          title="Klik untuk filter warga KTP Luar Wilayah"
        >
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider truncate flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              KTP Luar
            </p>
            <p className="text-base font-extrabold text-amber-950 font-mono tabular-nums leading-tight mt-0.5">
              {ktpExternalCount} <span className="text-[10px] font-bold text-amber-700">({externalPct}%)</span>
            </p>
          </div>
        </button>
      </div>
    </motion.div>
  );
};
