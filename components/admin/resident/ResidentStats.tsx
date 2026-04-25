import React from 'react';
import { motion } from 'motion/react';
import { Users, Home, Shield, UserCheck, UserMinus, ShieldCheck } from 'lucide-react';

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
    <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-12 gap-6">
      <motion.div 
        variants={itemVariants}
        whileHover={{ scale: 1.01 }}
        className="md:col-span-2 xl:col-span-6 bg-slate-950 p-8 rounded-[3rem] shadow-2xl flex flex-col justify-between group transition-all relative overflow-hidden text-white"
      >
        {/* Layered Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/40 transition-colors duration-1000"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.05)_0%,transparent_50%)]"></div>
        
        <div className="relative z-10 flex justify-between items-start mb-12">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em]">Sistem Pendataan Aktif</span>
            </div>
            <p className="text-xs font-bold text-slate-400">Database Real-time RT 02</p>
          </div>
          <div className="p-4 bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-inner group-hover:rotate-12 transition-transform duration-500">
            <Users size={24} className="text-white" />
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-end gap-5">
            <h3 className="text-8xl font-black tracking-tighter leading-none bg-gradient-to-t from-slate-300 to-white bg-clip-text text-transparent">{totalResidents}</h3>
            <div className="mb-2">
              <span className="block text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Populasi</span>
              <span className="block text-white font-black text-xl uppercase tracking-tighter leading-none">Jiwa Terdaftar</span>
            </div>
          </div>
          
          <div className="mt-10 pt-8 border-t border-white/5 flex flex-wrap gap-8">
             <div className="flex items-center gap-3">
               <Shield size={16} className="text-indigo-400" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enkripsi Biometrik</span>
             </div>
             <div className="flex items-center gap-3">
               <UserCheck size={16} className="text-emerald-400" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit Trail Aktif</span>
             </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        whileHover={{ y: -5 }}
        className="md:col-span-1 xl:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all relative overflow-hidden"
      >
        <div className="relative z-10 flex justify-between items-start mb-10">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[2rem] border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
            <ShieldCheck size={22} />
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Verifikasi</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-5xl font-black text-slate-900 leading-none">{verifiedCount}</h3>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">Valid</span>
          </div>
        </div>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        whileHover={{ y: -5 }}
        className="md:col-span-1 xl:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:shadow-2xl hover:shadow-emerald-500/10 transition-all relative overflow-hidden"
      >
        <div className="relative z-10 flex justify-between items-start mb-10">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-[2rem] border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
            <Home size={22} />
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Hunian</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-5xl font-black text-slate-900 leading-none">{occupiedHouses}</h3>
            <span className="text-xs font-black text-slate-400">Unit</span>
          </div>
        </div>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        whileHover={{ y: -5 }}
        className="md:col-span-1 xl:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:shadow-2xl hover:shadow-rose-500/10 transition-all relative overflow-hidden"
      >
        <div className="relative z-10 flex justify-between items-start mb-10">
          <div className="p-4 bg-slate-100 text-slate-400 rounded-[2rem] border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
            <UserMinus size={22} />
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Kosong</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-5xl font-black text-slate-900 leading-none">{emptyHouses}</h3>
            <span className="text-xs font-black text-slate-400">Unit</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
