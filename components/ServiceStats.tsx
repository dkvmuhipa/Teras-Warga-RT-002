import React from 'react';
import { motion } from 'motion/react';
import { 
  FileCheck, 
  CheckCircle2, 
  Users, 
  Home, 
  ShieldCheck, 
  TrendingUp,
  Clock,
  Activity
} from 'lucide-react';
import { House, Report, LetterRequest } from '../types';

interface ServiceStatsProps {
  houses: House[];
  reports: Report[];
  letters: LetterRequest[];
}

export const ServiceStats: React.FC<ServiceStatsProps> = ({ houses, reports, letters }) => {
  const totalResidents = houses.filter(h => h.status === 'Occupied').reduce((acc, h) => acc + Math.max(h.occupants || 1, 1 + (h.familyMembers?.length || 0)), 0);
  const occupiedHouses = houses.filter(h => h.status === 'Occupied').length;
  const resolvedReports = reports.filter(r => r.status === 'Selesai').length;
  const processedLetters = letters.filter(l => l.status !== 'Ditolak' && l.status !== 'Rejected').length;
  
  const stats = [
    { 
      label: 'Surat Diproses', 
      value: processedLetters, 
      icon: FileCheck, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      description: 'Surat pengantar & administrasi'
    },
    { 
      label: 'Laporan Selesai', 
      value: resolvedReports, 
      icon: CheckCircle2, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      description: 'Aduan warga yang ditangani'
    },
    { 
      label: 'Total Warga', 
      value: totalResidents, 
      icon: Users, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50',
      description: 'Jiwa terdaftar di RT 02'
    },
    { 
      label: 'Rumah Terisi', 
      value: occupiedHouses, 
      icon: Home, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      description: 'Kavling yang sudah dihuni'
    }
  ];

  const [lastUpdate, setLastUpdate] = React.useState(new Date());

  React.useEffect(() => {
    setLastUpdate(new Date());
  }, [houses, reports, letters]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2">Transparansi Layanan</p>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
            Kinerja <span className="italic font-serif text-indigo-600">Pengurus</span>
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-2 max-w-xl">
            Data real-time efektivitas layanan administrasi dan penanganan laporan warga di lingkungan RT 02.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
            <Activity size={14} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Sistem Aktif</span>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Update: {lastUpdate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white/95 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-100/90 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between"
          >
            {/* Top Accent Gradient Circle */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} opacity-40 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-700 blur-xl pointer-events-none`} />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:rotate-6 group-hover:scale-110 transition-all duration-300 shadow-md shadow-slate-100 border border-white/60`}>
                  <stat.icon size={26} strokeWidth={2.4} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 rounded-full border border-slate-100 transition-colors">
                  Live Stat
                </span>
              </div>

              <h3 className="text-5xl font-black text-slate-900 mb-2 tracking-tighter tabular-nums group-hover:text-indigo-600 transition-colors">
                {stat.value}
              </h3>
              <p className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                {stat.label}
              </p>
              <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                {stat.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
};
