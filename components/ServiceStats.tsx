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
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} opacity-20 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700`} />
            
            <div className="relative z-10">
              <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform shadow-sm`}>
                <stat.icon size={28} />
              </div>
              <h3 className="text-4xl font-black text-slate-900 mb-1 tracking-tighter tabular-nums">
                {stat.value}
              </h3>
              <p className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2">
                {stat.label}
              </p>
              <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                {stat.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
};
