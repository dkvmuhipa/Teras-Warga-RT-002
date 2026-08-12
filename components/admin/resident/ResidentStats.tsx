import React from 'react';
import { motion } from 'motion/react';
import { Users, Home, ShieldCheck, UserMinus, Activity, Sparkles } from 'lucide-react';

interface ResidentStatsProps {
  totalResidents: number;
  occupiedHouses: number;
  emptyHouses: number;
  verifiedCount: number;
  itemVariants: any;
}

export const ResidentStats: React.FC<ResidentStatsProps> = ({ 
  totalResidents, 
  occupiedHouses, 
  emptyHouses,
  verifiedCount,
  itemVariants 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-12 gap-5">
      {/* Executive Light Hero Card */}
      <motion.div 
        variants={itemVariants}
        whileHover={{ y: -3 }}
        className="md:col-span-2 xl:col-span-6 bg-gradient-to-br from-indigo-50/90 via-white to-slate-50/80 p-7 md:p-8 rounded-[2.5rem] border border-indigo-100/80 shadow-sm flex flex-col justify-between group transition-all relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/10 transition-colors duration-700"></div>
        
        <div className="relative z-10 flex justify-between items-start mb-6">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-[0.25em]">Smart Citizen Database</span>
            </div>
            <p className="text-xs font-semibold text-slate-400">Pusat Terpadu Kependudukan RT 02</p>
          </div>
          <div className="p-3 bg-white border border-indigo-100/80 rounded-2xl shadow-sm text-indigo-600 group-hover:scale-105 transition-transform">
            <Users size={20} />
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-end gap-3.5">
            <h3 className="text-5xl sm:text-6xl font-black tracking-tight text-slate-900 leading-none">{totalResidents}</h3>
            <div className="mb-0.5">
              <span className="block text-indigo-600 font-black text-[10px] uppercase tracking-widest mb-0.5">Populasi Resmi</span>
              <span className="block text-slate-800 font-black text-base uppercase tracking-tight leading-none">Jiwa Terdaftar</span>
            </div>
          </div>
          
          <div className="mt-6 pt-5 border-t border-slate-200/60 flex flex-wrap gap-6 text-[10px] font-bold text-slate-500">
             <div className="flex items-center gap-1.5">
               <ShieldCheck size={14} className="text-indigo-600" />
               <span>{verifiedCount} Jiwa Terverifikasi Admin</span>
             </div>
             <div className="flex items-center gap-1.5">
               <Activity size={14} className="text-emerald-600" />
               <span>Integrasi Real-time Warga</span>
             </div>
          </div>
        </div>
      </motion.div>

      {/* Verified Citizens Card */}
      <motion.div 
        variants={itemVariants}
        whileHover={{ y: -3 }}
        className="md:col-span-1 xl:col-span-2 bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-indigo-200 transition-all relative overflow-hidden"
      >
        <div className="relative z-10 flex justify-between items-start mb-6">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
            <ShieldCheck size={20} />
          </div>
          <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100/80 px-2.5 py-1 rounded-full uppercase tracking-wider">Valid</span>
        </div>
        <div className="relative z-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Verifikasi Admin</p>
          <h3 className="text-3xl font-black text-slate-900 leading-none">{verifiedCount} <span className="text-xs font-bold text-slate-400">Jiwa</span></h3>
        </div>
      </motion.div>

      {/* Occupied Houses Card */}
      <motion.div 
        variants={itemVariants}
        whileHover={{ y: -3 }}
        className="md:col-span-1 xl:col-span-2 bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-emerald-200 transition-all relative overflow-hidden"
      >
        <div className="relative z-10 flex justify-between items-start mb-6">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
            <Home size={20} />
          </div>
          <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100/80 px-2.5 py-1 rounded-full uppercase tracking-wider">Aktif</span>
        </div>
        <div className="relative z-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hunian Terisi</p>
          <h3 className="text-3xl font-black text-slate-900 leading-none">{occupiedHouses} <span className="text-xs font-bold text-slate-400">Unit</span></h3>
        </div>
      </motion.div>

      {/* Empty Houses Card */}
      <motion.div 
        variants={itemVariants}
        whileHover={{ y: -3 }}
        className="md:col-span-1 xl:col-span-2 bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-slate-300 transition-all relative overflow-hidden"
      >
        <div className="relative z-10 flex justify-between items-start mb-6">
          <div className="p-3 bg-slate-100 text-slate-500 rounded-2xl border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
            <UserMinus size={20} />
          </div>
          <span className="text-[9px] font-extrabold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full uppercase tracking-wider">Kosong</span>
        </div>
        <div className="relative z-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hunian Kosong</p>
          <h3 className="text-3xl font-black text-slate-900 leading-none">{emptyHouses} <span className="text-xs font-bold text-slate-400">Unit</span></h3>
        </div>
      </motion.div>
    </div>
  );
};
