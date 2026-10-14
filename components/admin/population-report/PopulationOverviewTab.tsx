import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, Heart, Baby, TrendingUp, TrendingDown, 
  Activity, ArrowRight, Clock, BarChart3, Accessibility, User 
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { PopulationReport } from '../../../types';
import { PopulationLiveStats } from './types';

interface PopulationOverviewTabProps {
  liveStats: PopulationLiveStats;
  latestReport?: PopulationReport;
  chartData: Array<{ name: string; total: number; mutasi: number }>;
}

export const PopulationOverviewTab: React.FC<PopulationOverviewTabProps> = ({
  liveStats,
  latestReport,
  chartData,
}) => {
  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Quick Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={20} /></div>
            <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Terdaftar</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">{liveStats.totalSoul} <span className="text-xs font-bold text-slate-400">Jiwa</span></h3>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
            <TrendingUp size={12} /> <span>Data Warga Real-time</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Heart size={20} /></div>
            <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Rentan</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">{liveStats.vulnerableTotal} <span className="text-xs font-bold text-slate-400">Jiwa</span></h3>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-500">
            <Activity size={12} /> <span>Prioritas Bantuan & Layanan</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Baby size={20} /></div>
            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Kelahiran</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">+{latestReport?.birthCount || 0} <span className="text-xs font-bold text-slate-400">Bulan Ini</span></h3>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
            <TrendingUp size={12} /> <span>Pertumbuhan Alami Positif</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><ArrowRight size={20} /></div>
            <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Mutasi Keluar</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">-{latestReport?.movedOutCount || 0} <span className="text-xs font-bold text-slate-400">Jiwa</span></h3>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-amber-600">
            <TrendingDown size={12} /> <span>Pindah Domisili Keluar</span>
          </div>
        </div>
      </div>

      {/* Status Kepenghunian (Penduduk Tetap vs Musiman/Sewa) */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-[9px] font-mono font-black uppercase tracking-wider">
              KLASIFIKASI DOMISILI WARGA
            </span>
            <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1">
              Perbandingan Penduduk Tetap vs Penduduk Musiman / Sewa
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Rasio kependudukan berdasarkan status kepemilikan dan hak tinggal di lingkungan RT 02
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold text-slate-600">
            <span className="px-3 py-1.5 bg-slate-100 rounded-xl" title="Total seluruh kepala keluarga berpenghuni aktif">
              Total KK: <b>{liveStats.housesTetap + liveStats.housesMusiman} Rumah</b>
            </span>
            <span className="px-3 py-1.5 bg-pink-50 text-pink-700 border border-pink-200 rounded-xl" title="Jumlah KK dengan Kepala Keluarga Perempuan (PEKKA)">
              KK Perempuan (PEKKA): <b>{liveStats.housesFemaleHoF} KK</b>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card Penduduk Tetap */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50/60 to-blue-50/40 border border-indigo-100/80 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-mono font-black uppercase tracking-wider shadow-sm">
                    WARGA TETAP (KTP/KK RT 02)
                  </span>
                  <h4 className="text-3xl font-black text-indigo-950 mt-3">
                    {liveStats.totalTetap} <span className="text-sm font-bold text-indigo-600">Jiwa</span>
                  </h4>
                  <p className="text-xs text-indigo-800/80 font-medium mt-1">
                    Tersebar di <b>{liveStats.housesTetap} Rumah / KK</b> (Milik Sendiri)
                  </p>
                </div>
                <div className="p-3 bg-white text-indigo-600 rounded-2xl shadow-sm">
                  <Users size={24} />
                </div>
              </div>

              {/* Gender Breakdown Pill */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="px-3 py-2 bg-white/80 border border-indigo-100/80 rounded-xl">
                  <span className="text-[9px] font-mono font-bold text-indigo-500 uppercase block">Laki-laki</span>
                  <p className="text-sm font-black text-indigo-950">{liveStats.tetapMale} <span className="text-[10px] text-slate-400 font-normal">Jiwa</span></p>
                </div>
                <div className="px-3 py-2 bg-white/80 border border-indigo-100/80 rounded-xl">
                  <span className="text-[9px] font-mono font-bold text-rose-500 uppercase block">Perempuan</span>
                  <p className="text-sm font-black text-indigo-950">{liveStats.tetapFemale} <span className="text-[10px] text-slate-400 font-normal">Jiwa</span></p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-indigo-100/60">
              <div className="flex justify-between text-[11px] font-bold text-indigo-900 mb-1">
                <span>Porsi Populasi Tetap</span>
                <span>{liveStats.totalSoul > 0 ? ((liveStats.totalTetap / liveStats.totalSoul) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="w-full bg-indigo-100/70 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${liveStats.totalSoul > 0 ? (liveStats.totalTetap / liveStats.totalSoul) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card Penduduk Musiman / Sewa */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-50/60 to-orange-50/40 border border-amber-100/80 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-1 bg-amber-500 text-slate-950 rounded-lg text-[9px] font-mono font-black uppercase tracking-wider shadow-sm">
                    PENDUDUK PENDATANG / TIDAK TETAP (SEWA / KOST)
                  </span>
                  <h4 className="text-3xl font-black text-amber-950 mt-3">
                    {liveStats.totalMusiman} <span className="text-sm font-bold text-amber-600">Jiwa</span>
                  </h4>
                  <p className="text-xs text-amber-800/80 font-medium mt-1">
                    Tersebar di <b>{liveStats.housesMusiman} Rumah / KK</b> (Kontrakan / Kost / Kerabat)
                  </p>
                </div>
                <div className="p-3 bg-white text-amber-600 rounded-2xl shadow-sm">
                  <Clock size={24} />
                </div>
              </div>

              {/* Gender Breakdown Pill */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="px-3 py-2 bg-white/80 border border-amber-100/80 rounded-xl">
                  <span className="text-[9px] font-mono font-bold text-indigo-500 uppercase block">Laki-laki</span>
                  <p className="text-sm font-black text-amber-950">{liveStats.musimanMale} <span className="text-[10px] text-slate-400 font-normal">Jiwa</span></p>
                </div>
                <div className="px-3 py-2 bg-white/80 border border-amber-100/80 rounded-xl">
                  <span className="text-[9px] font-mono font-bold text-rose-500 uppercase block">Perempuan</span>
                  <p className="text-sm font-black text-amber-950">{liveStats.musimanFemale} <span className="text-[10px] text-slate-400 font-normal">Jiwa</span></p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-amber-100/60">
              <div className="flex justify-between text-[11px] font-bold text-amber-900 mb-1">
                <span>Porsi Populasi Musiman</span>
                <span>{liveStats.totalSoul > 0 ? ((liveStats.totalMusiman / liveStats.totalSoul) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="w-full bg-amber-100/70 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${liveStats.totalSoul > 0 ? (liveStats.totalMusiman / liveStats.totalSoul) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Area Chart Section */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Tren Pertumbuhan Penduduk</h3>
            <p className="text-[11px] text-slate-500 font-semibold">Visualisasi pergeseran total jiwa dalam 6 periode terakhir</p>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100"><BarChart3 size={18} className="text-slate-400" /></div>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 'bold'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 'bold'}} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgb(0 0 0 / 0.06)' }}
                itemStyle={{ fontWeight: 'bold', fontSize: 12 }}
                labelStyle={{ fontWeight: 'bold', color: '#6366f1', marginBottom: 4 }}
              />
              <Area type="monotone" dataKey="total" name="Total Penduduk" stroke="#6366f1" strokeWidth={3.5} fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Demographic Metrics Section */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Accessibility size={18} className="text-indigo-600" /> Distribusi Kelompok Usia & Demografi Terdaftar
          </h3>
          <p className="text-xs text-slate-500 font-semibold">Segmentasi data real-time penghuni aktif wilayah RT 02</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Age demographics */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Segmentasi Usia & Pendidikan Warga</h4>
            {[
              { label: 'Bayi & Balita (0-5 tahun)', count: liveStats.totalBaby + liveStats.totalToddler, colorClass: 'bg-emerald-500', dotClass: 'bg-emerald-500' },
              { label: 'Anak-anak (6-12 tahun)', count: liveStats.totalChild, colorClass: 'bg-blue-500', dotClass: 'bg-blue-500' },
              { label: 'Remaja (13-18 tahun)', count: liveStats.totalTeenager, colorClass: 'bg-indigo-500', dotClass: 'bg-indigo-500' },
              { label: 'Dewasa (19-59 tahun)', count: liveStats.totalAdult, colorClass: 'bg-slate-600', dotClass: 'bg-slate-600' },
              { label: 'Lansia (60+ tahun)', count: liveStats.totalElderly, colorClass: 'bg-amber-500', dotClass: 'bg-amber-500' }
            ].map((item, idx) => {
              const pct = liveStats.totalSoul > 0 ? (item.count / liveStats.totalSoul) * 100 : 0;
              return (
                <div key={idx} className="space-y-1.5 p-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.dotClass}`} />
                      {item.label}
                    </span>
                    <span className="text-slate-500 font-black">{item.count} <span className="text-[10px] text-slate-400 font-bold">Jiwa ({pct.toFixed(1)}%)</span></span>
                  </div>
                  <div className="w-full bg-slate-50 h-2.5 rounded-full overflow-hidden border border-slate-150">
                    <div 
                      className={`${item.colorClass} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Key Vulnerabilities & Special Status */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Status Proteksi Sosial & Jaring Pengaman</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Penyandang Disabilitas', count: liveStats.totalDisability, icon: Accessibility, textClass: 'text-rose-600', bgClass: 'bg-rose-50 border-rose-100', badge: 'Disabilitas' },
                { label: 'Ibu Hamil', count: liveStats.totalPregnant, icon: Heart, textClass: 'text-emerald-600', bgClass: 'bg-emerald-50 border-emerald-100', badge: 'Kesehatan Ibu' },
                { label: 'Anak Yatim / Piatu', count: liveStats.totalOrphan, icon: User, textClass: 'text-indigo-600', bgClass: 'bg-indigo-50 border-indigo-100', badge: 'Yatim/Piatu' },
                { label: 'Status Janda / Duda', count: liveStats.totalWidow, icon: Users, textClass: 'text-amber-600', bgClass: 'bg-amber-50 border-amber-100', badge: 'Layanan Sosial' }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className={`flex flex-col justify-between p-4 rounded-2xl border ${item.bgClass} transition-all hover:scale-[1.02]`}>
                    <div className="flex items-center justify-between">
                      <div className={`p-2 bg-white rounded-xl ${item.textClass} shadow-xs`}>
                        <Icon size={16} />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">{item.badge}</span>
                    </div>
                    <div className="mt-4">
                      <h5 className="text-[11px] font-bold text-slate-500 leading-snug">{item.label}</h5>
                      <p className={`text-2xl font-black ${item.textClass} mt-1`}>
                        {item.count} <span className="text-xs font-bold text-slate-400 ml-0.5">Jiwa</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
