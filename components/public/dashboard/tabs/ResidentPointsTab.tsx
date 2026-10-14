import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Award, 
  Trophy 
} from 'lucide-react';
import { House } from '../../../../types';
import { CitizenTier } from '../types';

interface ResidentPointsTabProps {
  citizenTier: CitizenTier;
  currentHouse: House | undefined;
  currentPoints: number;
  currentRank: number;
  isAllPaid: boolean;
  currentMonth: string;
  allHousePoints: { house: House; points: number }[];
  selectedHouseId: string;
}

export const ResidentPointsTab: React.FC<ResidentPointsTabProps> = ({
  citizenTier,
  currentHouse,
  currentPoints,
  currentRank,
  isAllPaid,
  currentMonth,
  allHousePoints,
  selectedHouseId,
}) => {
  return (
    <motion.div 
      key="points"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 text-left"
    >
      {/* Header Citizen Score */}
      <div className={`p-8 md:p-10 rounded-[2.5rem] bg-gradient-to-br ${citizenTier.color} shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}>
        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-widest">
            <Sparkles size={14} /> {citizenTier.badge}
          </div>
          <h3 className="text-3xl md:text-4xl font-black tracking-tight">{citizenTier.name}</h3>
          <p className="text-xs md:text-sm font-semibold opacity-90 max-w-lg">
            Apresiasi keaktifan dan ketertiban administrasi untuk Rumah Blok {currentHouse?.block}-{currentHouse?.number} ({currentHouse?.headOfFamily}).
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-center shrink-0 w-full md:w-auto relative z-10">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Total Skor Keaktifan</p>
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-4xl md:text-5xl font-black tracking-tight">{currentPoints}</span>
            <span className="text-sm font-bold opacity-80">Poin</span>
          </div>
          <div className="mt-2 text-[10px] font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full inline-block">
            Peringkat ke-#{currentRank} di RT 02
          </div>
        </div>
      </div>

      {/* Rincian Poin & Cara Mendapatkan Poin */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 md:p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Award size={20} className="text-amber-500" />
            <h4 className="text-base font-black text-slate-800">Rincian Perolehan Poin Rumah Anda</h4>
          </div>
          
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">✓</span>
                <div>
                  <p className="font-black text-slate-800">Registrasi KK Aktif</p>
                  <p className="text-[10px] text-slate-400">Data terdaftar di sistem RT</p>
                </div>
              </div>
              <span className="font-black text-emerald-600">+50 Poin</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-xl ${isAllPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} flex items-center justify-center font-black`}>
                  {isAllPaid ? '✓' : '•'}
                </span>
                <div>
                  <p className="font-black text-slate-800">Disiplin Iuran ({currentMonth})</p>
                  <p className="text-[10px] text-slate-400">{isAllPaid ? 'Lunas sebelum tgl 20' : 'Belum lunas'}</p>
                </div>
              </div>
              <span className={`font-black ${isAllPaid ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isAllPaid ? '+50 Poin' : '+0 Poin'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">✓</span>
                <div>
                  <p className="font-black text-slate-800">Jumlah Penghuni ({currentHouse?.occupants || 1} Jiwa)</p>
                  <p className="text-[10px] text-slate-400">10 poin per jiwa terdata</p>
                </div>
              </div>
              <span className="font-black text-emerald-600">+{(currentHouse?.occupants || 1) * 10} Poin</span>
            </div>

            {currentHouse?.rondaPoints ? (
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-black">✓</span>
                  <div>
                    <p className="font-black text-slate-800">Kehadiran Siskamling / Ronda</p>
                    <p className="text-[10px] text-slate-400">Presensi pos jaga malam</p>
                  </div>
                </div>
                <span className="font-black text-emerald-600">+{currentHouse.rondaPoints} Poin</span>
              </div>
            ) : null}

            {currentHouse?.isVerified ? (
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">✓</span>
                  <div>
                    <p className="font-black text-slate-800">Verifikasi NIK Lengkap</p>
                    <p className="text-[10px] text-slate-400">Data kependudukan tervalidasi</p>
                  </div>
                </div>
                <span className="font-black text-emerald-600">+30 Poin</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Leaderboard Peringkat Warga Teladan RT */}
        <div className="p-6 md:p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy size={20} className="text-amber-500" />
              <h4 className="text-base font-black text-slate-800">Top 10 Warga Teladan RT 02</h4>
            </div>
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl">Live Peringkat</span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar text-xs">
            {allHousePoints.slice(0, 10).map((item, idx) => {
              const isMe = item.house.id === selectedHouseId;
              const rank = idx + 1;
              const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

              return (
                <div 
                  key={item.house.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                    isMe 
                      ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm' 
                      : 'bg-slate-50/70 border-slate-100 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-white border border-slate-200/80 font-black text-xs flex items-center justify-center shadow-2xs">
                      {medal}
                    </span>
                    <div>
                      <p className="font-black text-slate-800">
                        {item.house.headOfFamily} {isMe && <span className="text-[9px] font-black text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-md ml-1">Rumah Anda</span>}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400">Blok {item.house.block}-{item.house.number}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-slate-900 bg-white border border-slate-200/70 px-2.5 py-1 rounded-xl shadow-2xs">
                      {item.points} Pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
