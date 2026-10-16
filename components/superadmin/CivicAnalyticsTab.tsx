import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Users, Award, ShieldCheck, 
  CheckCircle2, AlertCircle, Home, PieChart, Sparkles,
  ArrowUpRight, ArrowDownRight, Layers, Wallet, CheckSquare,
  Bot, Copy, Check, Download, RefreshCw, X, ShieldAlert,
  Radio, AlertTriangle
} from 'lucide-react';
import { Tenant, FleetAggregates } from '../../types';
import { toast } from 'sonner';

interface CivicAnalyticsTabProps {
  tenants: Tenant[];
  fleetAggregates?: FleetAggregates;
}


export const CivicAnalyticsTab: React.FC<CivicAnalyticsTabProps> = ({
  tenants,
  fleetAggregates
}) => {
  // Real registered doors across Firestore
  const totalDoors = useMemo(() => {
    if (fleetAggregates && fleetAggregates.totalRegisteredDoors > 0) {
      return fleetAggregates.totalRegisteredDoors;
    }
    return tenants.reduce((acc, t) => {
      const units = t.blockConfig?.reduce((bAcc, b) => bAcc + (b.end - b.start + 1), 0) || 40;
      return acc + units;
    }, 0);
  }, [tenants, fleetAggregates]);

  const totalOccupied = fleetAggregates?.totalOccupiedDoors ?? Math.round(totalDoors * 0.85);
  const totalEmpty = fleetAggregates?.totalEmptyDoors ?? Math.max(0, totalDoors - totalOccupied);

  // Real or estimated population
  const totalPopulation = useMemo(() => {
    if (fleetAggregates && fleetAggregates.totalPopulation > 0) {
      return fleetAggregates.totalPopulation;
    }
    return Math.round(totalDoors * 3.8); // fallback estimate
  }, [fleetAggregates, totalDoors]);

  // Real performance index per tenant computed from Firestore documents
  const tenantPerformance = useMemo(() => {
    return tenants.map((t, idx) => {
      const metric = fleetAggregates?.tenantMetrics?.[t.id];
      const defaultDoors = t.blockConfig?.reduce((bAcc, b) => bAcc + (b.end - b.start + 1), 0) || 40;
      const doors = metric && metric.realDoors > 0 ? metric.realDoors : defaultDoors;
      const occupiedDoors = metric?.occupiedDoors ?? Math.round(doors * 0.85);
      const emptyDoors = metric?.emptyDoors ?? Math.max(0, doors - occupiedDoors);
      const residents = metric && metric.realResidents > 0 ? metric.realResidents : Math.round(doors * 3.8);

      // Real compliance directly from Firestore live metrics
      const compliance = metric?.complianceRate ?? 0;
      const digitalAdoption = t.paymentGateway?.digitalRate ?? (t.id === 'tondo-rw20-rt02' ? 88 : 0);
      
      // Civic score derived from live data: compliance (70%) + healthy balance (20%) + aparatur aktif (10%)
      const liveBalance = metric?.liveBalance ?? 0;
      const balanceBonus = liveBalance > 500000 ? 20 : liveBalance > 0 ? 15 : 5;
      const officialBonus = (metric?.officialsCount ?? 3) >= 4 ? 10 : 5;
      const civicScore = Math.min(100, Math.round(compliance * 0.7 + balanceBonus + officialBonus));

      return {
        id: t.id,
        name: t.name,
        kelurahan: t.kelurahan,
        doors,
        occupiedDoors,
        emptyDoors,
        residents,
        compliance,
        digitalAdoption,
        liveBalance,
        civicScore,
        themeColor: t.themeColor || '#4F46E5',
        rank: 0
      };
    }).sort((a, b) => b.civicScore - a.civicScore)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [tenants, fleetAggregates]);

  // Overall platform metrics
  const avgCompliance = fleetAggregates && fleetAggregates.averageCompliance > 0
    ? fleetAggregates.averageCompliance
    : tenantPerformance.length > 0 
    ? Math.round(tenantPerformance.reduce((acc, t) => acc + t.compliance, 0) / tenantPerformance.length)
    : 92;

  const avgDigitalAdoption = tenantPerformance.length > 0
    ? Math.round(tenantPerformance.reduce((acc, t) => acc + t.digitalAdoption, 0) / tenantPerformance.length)
    : 81;

  const avgCivicScore = tenantPerformance.length > 0
    ? (tenantPerformance.reduce((acc, t) => acc + t.civicScore, 0) / tenantPerformance.length).toFixed(1)
    : '88.5';

  const totalFleetTreasury = fleetAggregates?.totalFleetBalance ?? 0;

  // AI Fleet Copilot States
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [copiedAi, setCopiedAi] = useState(false);

  // Close AI modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAiModal) {
        setShowAiModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAiModal]);

  const handleGenerateFleetAi = async () => {
    setIsGeneratingAi(true);
    try {
      const payload = {
        data: {
          totalTenants: tenants.length,
          totalDoors,
          totalPopulation,
          totalFleetBalance: totalFleetTreasury,
          averageCompliance: avgCompliance,
          activeReportsCount: fleetAggregates?.totalPendingReports ?? fleetAggregates?.totalReports ?? 0,
          tenantSummaries: tenantPerformance
            .map(t => `${t.name} (Kel. ${t.kelurahan}): Skor ${t.civicScore}, Kas Rp ${t.liveBalance.toLocaleString('id-ID')}, Kepatuhan ${t.compliance}%`)
            .join('\n')
        }
      };

      const res = await fetch('/api/gemini/fleet-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json && json.text) {
        setAiReport(json.text);
        setShowAiModal(true);
        toast.success("Laporan Eksekutif AI Fleet berhasil dihasilkan!");
      } else {
        throw new Error("Gagal menerima respons AI");
      }
    } catch (err: any) {
      toast.error(`Gagal menghasilkan analisis AI: ${err.message || 'Koneksi terputus'}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCopyAi = () => {
    if (!aiReport) return;
    navigator.clipboard.writeText(aiReport);
    setCopiedAi(true);
    toast.success("Ringkasan eksekutif disalin ke clipboard!");
    setTimeout(() => setCopiedAi(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!aiReport) return;
    const blob = new Blob([aiReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Eksekutif_Armada_RT_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Executive Fleet Copilot Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-3xl text-white shadow-lg border border-indigo-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-400/30">
              <Bot size={18} />
            </div>
            <span className="text-xs font-mono font-bold tracking-widest text-indigo-300 uppercase">
              FastAPI AI Intelligence Engine
            </span>
          </div>
          <h2 className="text-lg font-black tracking-tight text-white">
            Civic Command Executive Copilot
          </h2>
          <p className="text-xs text-slate-300 max-w-xl font-medium">
            Analisis terpadu performa seluruh armada RT secara otomatis menggunakan kecerdasan buatan Gemini untuk rekomendasi kebijakan pimpinan wilayah.
          </p>
        </div>

        <button
          onClick={handleGenerateFleetAi}
          disabled={isGeneratingAi}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
        >
          {isGeneratingAi ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              <span>Memproses Data Armada...</span>
            </>
          ) : (
            <>
              <Sparkles size={15} className="text-amber-300" />
              <span>Hasilkan Laporan Eksekutif AI</span>
            </>
          )}
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Population */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Total Populasi Warga
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 tracking-tight font-mono">
            {totalPopulation.toLocaleString('id-ID')} <span className="text-xs font-bold text-slate-500 font-sans">Jiwa</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {totalOccupied} terisi • {totalEmpty} kosong ({totalDoors} total pintu)
          </p>
        </div>

        {/* Real Fee Compliance */}
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
            <span className="text-emerald-700 font-bold">Sinkron Live</span> dari database kartu iuran
          </p>
        </div>

        {/* Net Fleet Cashflow Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Total Saldo Kas Riil RT
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <Wallet size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-700 tracking-tight font-mono">
            Rp {Math.max(0, totalFleetTreasury).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Net buku kas (Pemasukan - Pengeluaran)
          </p>
        </div>

        {/* Civic Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Indeks Tata Kelola (Civic Score)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Award size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight font-mono">
            {avgCivicScore} <span className="text-xs font-bold text-slate-500 font-sans">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Kategori: Wilayah Tertib & Digital
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
            💡 <strong>Keadilan Sosial:</strong> Warga terdaftar PKH secara otomatis mendapatkan penyesuaian tarif retribusi sampah lebih rendah sesuai keputusan musyawarah warga.
          </div>
        </div>

        {/* Civic Excellence Leaderboard */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Award size={16} className="text-amber-500" />
              <span>Papan Peringkat Kinerja Wilayah (Civic Leaderboard)</span>
            </h3>
            <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              ● Live Firestore Sync
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Perbandingan tingkat kepatuhan iuran, hunian aktif, dan posisi kas resmi:
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
                      Kel. {item.kelurahan} • {item.occupiedDoors} terisi / {item.doors} pintu ({item.residents} jiwa)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 font-bold block">Kepatuhan</span>
                    <span className="font-bold text-emerald-700">{item.compliance}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 font-bold block">Saldo Kas</span>
                    <span className="font-bold text-sky-700">Rp {item.liveBalance.toLocaleString('id-ID')}</span>
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

      {/* AI Executive Report Modal */}
      {showAiModal && aiReport && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowAiModal(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div 
            role="dialog"
            aria-modal="true"
            aria-label="Laporan Eksekutif Civic Copilot"
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden focus:outline-none"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">Laporan Eksekutif Civic Copilot</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Dianalisis dari seluruh RT aktif di wilayah</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAiModal(false)}
                aria-label="Tutup laporan AI"
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50/50">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs font-sans text-[13px] leading-relaxed">
                {aiReport}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 font-mono">
                Model: Google Gemini 2.5 Flash via FastAPI
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyAi}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  {copiedAi ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copiedAi ? 'Tersalin' : 'Salin Teks'}</span>
                </button>
                <button
                  onClick={handleDownloadTxt}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Download size={14} />
                  <span>Unduh Dokumen (.txt)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

