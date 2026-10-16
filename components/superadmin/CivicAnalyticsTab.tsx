import React, { useMemo } from 'react';
import { 
  BarChart3, TrendingUp, Users, Award, ShieldCheck, 
  CheckCircle2, AlertCircle, Home, PieChart, Sparkles,
  ArrowUpRight, ArrowDownRight, Layers
} from 'lucide-react';
import { Tenant } from '../../types';

interface CivicAnalyticsTabProps {
  tenants: Tenant[];
}

export const CivicAnalyticsTab: React.FC<CivicAnalyticsTabProps> = ({
  tenants
}) => {
  // Aggregate calculations
  const totalDoors = useMemo(() => {
    return tenants.reduce((acc, t) => {
      const units = t.blockConfig?.reduce((bAcc, b) => bAcc + (b.end - b.start + 1), 0) || 40;
      return acc + units;
    }, 0);
  }, [tenants]);

  const estimatedPopulation = Math.round(totalDoors * 3.8); // avg 3.8 persons per household

  // Mocked realistic performance index per tenant
  const tenantPerformance = useMemo(() => {
    return tenants.map((t, idx) => {
      const doors = t.blockConfig?.reduce((bAcc, b) => bAcc + (b.end - b.start + 1), 0) || 40;
      // Derive stable metrics based on tenant id
      const compliance = Math.min(98, 88 + ((t.id.length * 7 + idx * 3) % 11));
      const digitalAdoption = Math.min(95, 75 + ((t.id.length * 5 + idx * 4) % 21));
      const civicScore = Math.min(96, 82 + ((t.id.length * 3 + idx * 2) % 15));

      return {
        id: t.id,
        name: t.name,
        kelurahan: t.kelurahan,
        doors,
        compliance,
        digitalAdoption,
        civicScore,
        themeColor: t.themeColor || '#4F46E5',
        rank: 0
      };
    }).sort((a, b) => b.civicScore - a.civicScore)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [tenants]);

  // Overall platform metrics
  const avgCompliance = tenantPerformance.length > 0 
    ? Math.round(tenantPerformance.reduce((acc, t) => acc + t.compliance, 0) / tenantPerformance.length)
    : 92;

  const avgDigitalAdoption = tenantPerformance.length > 0
    ? Math.round(tenantPerformance.reduce((acc, t) => acc + t.digitalAdoption, 0) / tenantPerformance.length)
    : 81;

  const avgCivicScore = tenantPerformance.length > 0
    ? (tenantPerformance.reduce((acc, t) => acc + t.civicScore, 0) / tenantPerformance.length).toFixed(1)
    : '88.5';

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Estimasi Warga (Jiwa)
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 tracking-tight font-mono">
            ~{estimatedPopulation.toLocaleString('id-ID')} <span className="text-xs font-bold text-slate-500 font-sans">Jiwa</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Berdasarkan {totalDoors} unit hunian aktif
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Rata-rata Kepatuhan Iuran
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight font-mono">
            {avgCompliance}%
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1">
            <ArrowUpRight size={13} className="text-emerald-600" />
            <span className="text-emerald-700 font-bold">+2.4%</span> dari bulan lalu
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Adopsi Digital & QRIS
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <PieChart size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-700 tracking-tight font-mono">
            {avgDigitalAdoption}%
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Warga bertransaksi kas secara cashless
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Indeks Civic Score Rata-rata
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Award size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight font-mono">
            {avgCivicScore} <span className="text-xs font-bold text-slate-500 font-sans">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Kategori: Wilayah Sangat Aktif & Tertib
          </p>
        </div>
      </div>

      {/* Social Demographic Breakdown & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Socio-economic Category Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers size={16} className="text-indigo-600" />
            <span>Distribusi Golongan Warga</span>
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Estimasi pembagian kategori tarif iuran warga se-platform:
          </p>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">Warga Reguler (Umum)</span>
                <span className="text-slate-900 font-mono">68%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: '68%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">PNS / Profesi / Komersial</span>
                <span className="text-slate-900 font-mono">22%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '22%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">Penerima Bansos / PKH (Subsidi)</span>
                <span className="text-slate-900 font-mono">10%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-[11px] text-slate-600 leading-relaxed">
            💡 <strong>Rekomendasi Kebijakan:</strong> Tarif subsidi PKH rata-rata berada pada Rp 10.000/bulan, menjaga keterjangkauan layanan sampah & air bagi keluarga prasejahtera.
          </div>
        </div>

        {/* Civic Excellence Leaderboard */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Award size={16} className="text-amber-500" />
              <span>Peringkat Kinerja Wilayah (Civic Leaderboard)</span>
            </h3>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              Update Real-Time
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Perbandingan tingkat kepatuhan iuran, adopsi digital, dan skor tata kelola:
          </p>

          <div className="space-y-3">
            {tenantPerformance.map((item) => (
              <div 
                key={item.id}
                className="p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-200/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
                    item.rank === 1
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : item.rank === 2
                      ? 'bg-slate-200 text-slate-800'
                      : item.rank === 3
                      ? 'bg-amber-700/10 text-amber-900'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    #{item.rank}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-xs truncate">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Kel. {item.kelurahan} • ~{item.doors} Kavling
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 font-bold block">Kepatuhan</span>
                    <span className="font-bold text-emerald-700">{item.compliance}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 font-bold block">Cashless</span>
                    <span className="font-bold text-sky-700">{item.digitalAdoption}%</span>
                  </div>
                  <div className="text-right pl-2 border-l border-slate-200">
                    <span className="text-[9px] text-slate-400 font-bold block">Civic Score</span>
                    <span className="font-black text-indigo-700 text-sm">{item.civicScore}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
