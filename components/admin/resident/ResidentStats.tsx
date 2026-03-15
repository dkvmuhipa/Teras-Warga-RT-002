import React from 'react';
import { motion } from 'motion/react';
import { Users, Home, Shield } from 'lucide-react';

interface ResidentStatsProps {
  totalResidents: number;
  occupiedHouses: number;
  emptyHouses: number;
  itemVariants: any;
}

export const ResidentStats: React.FC<ResidentStatsProps> = ({ 
  totalResidents, 
  occupiedHouses, 
  emptyHouses,
  itemVariants 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <motion.div 
        variants={itemVariants}
        className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-lg shadow-blue-600/20 flex items-center gap-3 md:gap-5 group hover:scale-[1.02] transition-transform relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="p-3 md:p-4 bg-white/20 text-white rounded-xl md:rounded-2xl backdrop-blur-sm border border-white/20">
          <Users size={20} className="md:w-6 md:h-6" />
        </div>
        <div className="relative z-10 text-white">
          <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-80">Total Warga</p>
          <h3 className="text-xl md:text-2xl font-black">{totalResidents} <span className="text-[10px] md:text-xs font-bold opacity-60">Jiwa</span></h3>
        </div>
      </motion.div>

      {[
        { icon: Home, label: 'Rumah Dihuni', value: occupiedHouses, unit: 'Unit', color: 'emerald' },
        { icon: Shield, label: 'Rumah Kosong', value: emptyHouses, unit: 'Unit', color: 'slate' }
      ].map((stat, i) => (
        <motion.div 
          key={i}
          variants={itemVariants}
          className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-3 md:gap-5 group hover:shadow-xl hover:shadow-slate-200/50 transition-all"
        >
          <div className={`p-3 md:p-4 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform`}>
            <stat.icon size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-xl md:text-2xl font-black text-slate-900">{stat.value} <span className="text-[10px] md:text-xs font-bold text-slate-400">{stat.unit}</span></h3>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
