import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, Shield, DollarSign, AlertTriangle, 
  Calendar, CheckCircle2, Clock, MapPin, Activity, ArrowUpRight, 
  ArrowDownRight, Filter, Download, Baby, Heart, User, UserCheck, 
  Sparkles, FileText, ChevronRight, Info, GraduationCap, Briefcase,
  LayoutDashboard, Search, Phone, Share2, ClipboardList
} from 'lucide-react';
import { RondaCheckLog, Report, House, Official, CashFlow, LetterRequest, PdfConfig } from '../../types';
import { DemographicAnalytics } from './DemographicAnalytics';
import { motion, AnimatePresence } from 'motion/react';
import { useFinancial } from '../../context/FinancialContext';

interface AdminAnalyticsProps {
  rondaLogs: RondaCheckLog[];
  reports: Report[];
  houses: House[];
  officials: Official[];
  letters: LetterRequest[];
  pdfConfig: PdfConfig;
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ 
  rondaLogs = [], 
  reports = [], 
  houses = [], 
  officials = [], 
  letters = [], 
  pdfConfig 
}) => {
  const { cashFlow = [], getArrearsForHouse } = useFinancial();
  const [activeTab, setActiveTab] = useState<'overview' | 'demographics' | 'operational'>('overview');

  // Interactive time scale states
  const [financialTimeSpan, setFinancialTimeSpan] = useState<'3m' | '6m' | '12m'>('6m');
  const [securityTimeSpan, setSecurityTimeSpan] = useState<'7d' | '30d'>('7d');
  const [letterTimeSpan, setLetterTimeSpan] = useState<'3m' | '6m'>('6m');

  // Expanded sub-lists states for actionability
  const [showArrearsDetailInput, setShowArrearsDetailInput] = useState(false);
  const [showIncompleteDetail, setShowIncompleteDetail] = useState(false);
  const [showUnverifiedDetail, setShowUnverifiedDetail] = useState(false);
  const [arrearsSearchQuery, setArrearsSearchQuery] = useState('');

  // --- Security Analytics with interactive filter ---
  const securityStats = useMemo(() => {
    const totalLogs = rondaLogs.length;
    const incidents = reports.filter(r => r.type === 'Keamanan').length;
    const completionRate = totalLogs > 0 ? (rondaLogs.filter(l => l.status === 'Aman').length / totalLogs) * 100 : 0;
    
    const daysCount = securityTimeSpan === '7d' ? 7 : 30;
    const daysArray = [...Array(daysCount)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (daysCount - 1 - i));
      return d;
    });

    const patrolActivity = daysArray.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const label = securityTimeSpan === '7d' 
        ? date.toLocaleDateString('id-ID', { weekday: 'short' })
        : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      
      const dayLogs = rondaLogs.filter(l => l.timestamp && l.timestamp.startsWith(dateStr)).length;
      const dayIncidents = reports.filter(r => r.type === 'Keamanan' && r.date === dateStr).length;

      return {
        name: label,
        patrols: dayLogs,
        incidents: dayIncidents
      };
    });

    return { totalLogs, incidents, completionRate, patrolActivity };
  }, [rondaLogs, reports, securityTimeSpan]);

  // --- Financial Analytics with interactive filter ---
  const financialStats = useMemo(() => {
    const income = cashFlow.filter((t: CashFlow) => t.type === 'Income').reduce((acc: number, t: CashFlow) => acc + t.amount, 0);
    const expense = cashFlow.filter((t: CashFlow) => t.type === 'Expense').reduce((acc: number, t: CashFlow) => acc + t.amount, 0);
    const balance = income - expense;

    const monthsCount = financialTimeSpan === '3m' ? 3 : financialTimeSpan === '6m' ? 6 : 12;
    const monthsArray = [...Array(monthsCount)].map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (monthsCount - 1 - i));
      return d;
    });

    const trend = monthsArray.map(date => {
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthLabel = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });

      const monthIncome = cashFlow
        .filter(t => {
          if (!t.date) return false;
          const d = new Date(t.date);
          return d.getMonth() === month && d.getFullYear() === year && t.type === 'Income';
        })
        .reduce((acc, t) => acc + t.amount, 0);

      const monthExpense = cashFlow
        .filter(t => {
          if (!t.date) return false;
          const d = new Date(t.date);
          return d.getMonth() === month && d.getFullYear() === year && t.type === 'Expense';
        })
        .reduce((acc, t) => acc + t.amount, 0);

      return {
        name: monthLabel,
        income: monthIncome,
        expense: monthExpense
      };
    });

    const housesWithArrearsList = houses.filter(h => h.status === 'Occupied' && getArrearsForHouse(h).length > 0);
    const housesWithArrears = housesWithArrearsList.length;
    const occupiedHouses = houses.filter(h => h.status === 'Occupied').length;
    const collectionRate = occupiedHouses > 0 ? ((occupiedHouses - housesWithArrears) / occupiedHouses) * 100 : 0;

    return { income, expense, balance, trend, housesWithArrears, collectionRate };
  }, [cashFlow, houses, getArrearsForHouse, financialTimeSpan]);

  // --- Letter Analytics with interactive filter ---
  const letterStats = useMemo(() => {
    const totalLetters = letters.length;
    const pendingLetters = letters.filter(l => l.status === 'Menunggu').length;
    const approvedLetters = letters.filter(l => l.status === 'Disetujui').length;
    
    // Group by type
    const types: Record<string, number> = {};
    letters.forEach(l => {
      types[l.type] = (types[l.type] || 0) + 1;
    });
    const typeData = Object.entries(types).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const monthsCount = letterTimeSpan === '3m' ? 3 : 6;
    const monthsArray = [...Array(monthsCount)].map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (monthsCount - 1 - i));
      return d;
    });

    const trend = monthsArray.map(date => {
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthLabel = date.toLocaleDateString('id-ID', { month: 'short' });

      const count = letters.filter(l => {
        if (!l.date) return false;
        const d = new Date(l.date);
        return d.getMonth() === month && d.getFullYear() === year;
      }).length;

      return { name: monthLabel, count };
    });

    return { totalLetters, pendingLetters, approvedLetters, typeData, trend };
  }, [letters, letterTimeSpan]);

  // Real data parsing for active action lists
  const arrearsHouses = useMemo(() => {
    return houses
      .filter(h => h.status === 'Occupied' && getArrearsForHouse(h).length > 0)
      .map(h => {
        const arrearsList = getArrearsForHouse(h);
        return {
          id: h.id,
          number: h.number || 'N/A',
          block: h.block || 'N/A',
          familyHead: h.headOfFamily || 'Tanpa Nama',
          phone: h.phone || '',
          arrearsCount: arrearsList.length,
          arrearsDetails: arrearsList.join(', ')
        };
      })
      .sort((a, b) => b.arrearsCount - a.arrearsCount);
  }, [houses, getArrearsForHouse]);

  const filteredArrearsHouses = useMemo(() => {
    if (!arrearsSearchQuery.trim()) return arrearsHouses;
    return arrearsHouses.filter(h => 
      h.familyHead.toLowerCase().includes(arrearsSearchQuery.toLowerCase()) ||
      h.number.toLowerCase().includes(arrearsSearchQuery.toLowerCase()) ||
      h.block.toLowerCase().includes(arrearsSearchQuery.toLowerCase())
    );
  }, [arrearsHouses, arrearsSearchQuery]);

  const incompleteHouses = useMemo(() => {
    return houses
      .filter(h => h.status === 'Occupied' && (!h.phone || h.phone === '-' || h.phone.trim() === ''))
      .map(h => ({
        id: h.id,
        number: h.number || 'N/A',
        block: h.block || 'N/A',
        familyHead: h.headOfFamily || 'Tidak Tercatat',
        residentsCount: h.occupants || 1
      }));
  }, [houses]);

  const unverifiedHouses = useMemo(() => {
    return houses
      .filter(h => h.status === 'Occupied' && !h.isVerified)
      .map(h => ({
        id: h.id,
        number: h.number || 'N/A',
        block: h.block || 'N/A',
        familyHead: h.headOfFamily || 'Tidak Tercatat',
        residentsCount: h.occupants || 1
      }));
  }, [houses]);

  const listCardVariants = {
    hidden: { opacity: 0, height: 0, marginTop: 0 },
    visible: { opacity: 1, height: 'auto', marginTop: 16 }
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  const sendWhatsAppReminder = (familyHead: string, number: string, arrearsCount: number, phoneStr: string) => {
    const formattedPhone = phoneStr.replace(/\D/g, '');
    const phoneNo = formattedPhone.startsWith('0') 
      ? '62' + formattedPhone.slice(1) 
      : formattedPhone.startsWith('8') 
        ? '62' + formattedPhone 
        : formattedPhone;

    if (!phoneNo) {
      alert('Nomor telepon tidak valid atau kosong.');
      return;
    }

    const message = `Halo Bapak/Ibu ${familyHead} dari Rumah No. ${number}. Kami dari Pengurus RT 02 ingin menginformasikan perihal iuran bulanan yang saat ini mempunyai catatan tertunda sebanyak ${arrearsCount} bulan. Mohon berkenan meluangkan waktu untuk melakukan pembayaran melalui aplikasi atau menemui bendahara RT. Terima kasih atas pengertiannya yang baik.`;
    const url = `https://wa.me/${phoneNo}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Title Header with Modern Accent */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Dashboard Eksekutif</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1">Pusat Analitik RT 02</h2>
          <p className="text-slate-500 font-medium text-sm">Visualisasi cerdas, pengawasan real-time, dan hub tindakan administrasi warga.</p>
        </div>
        
        {/* Superior Level Master Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200 shrink-0 w-full md:w-auto overflow-x-auto">
          {[
            { id: 'overview', label: 'Ringkasan Eksekutif', icon: LayoutDashboard },
            { id: 'demographics', label: 'Kependudukan & Demografi', icon: Users },
            { id: 'operational', label: 'Efisiensi Operasional', icon: Activity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              id={`id_analytics` + tab.id}
              className={`
                px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shrink-0
                ${activeTab === tab.id 
                  ? 'bg-white text-indigo-600 shadow-md font-bold' 
                  : 'text-slate-500 hover:text-slate-800'}
              `}
            >
              <tab.icon size={15} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-10"
          >
            {/* Overview Metric Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  icon: DollarSign, 
                  label: 'Total Saldo Kas', 
                  value: `Rp ${financialStats.balance.toLocaleString('id-ID')}`, 
                  sub: 'Kas Sosial RT 02', 
                  growth: '+12% bulan ini', 
                  growthType: 'up',
                  color: 'indigo'
                },
                { 
                  icon: Shield, 
                  label: 'Kepatuhan Ronda', 
                  value: `${securityStats.completionRate.toFixed(1)}%`, 
                  sub: 'Tingkat Patroli Sukses', 
                  growth: 'Responsif & Aman', 
                  growthType: 'up',
                  color: 'emerald'
                },
                { 
                  icon: AlertTriangle, 
                  label: 'Laporan Insiden', 
                  value: `${securityStats.incidents} Kasus`, 
                  sub: 'Tertangani Cepat', 
                  growth: '-5% dari bulan lalu', 
                  growthType: 'down',
                  color: 'rose'
                },
                { 
                  icon: Users, 
                  label: 'Total Populasi', 
                  value: `${houses.filter(h => h.status === 'Occupied').reduce((acc, h) => acc + Math.max(h.occupants || 1, 1 + (h.familyMembers?.length || 0)), 0)} Jiwa`, 
                  sub: 'Aktif Terbaca di Peta', 
                  growth: 'Penduduk Terdaftar', 
                  growthType: 'neutral',
                  color: 'amber'
                }
              ].map((m, i) => (
                <motion.div 
                  key={m.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-transform"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-full translate-x-1/3 -translate-y-1/3 group-hover:scale-125 transition-transform duration-500"></div>
                  <div className="flex justify-between items-start mb-5 relative z-10">
                    <div className={`p-4 rounded-2xl bg-${m.color}-50 text-${m.color}-600`}>
                      <m.icon size={22} className="shrink-0" />
                    </div>
                    {m.growthType === 'up' ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-black bg-emerald-50 px-2 py-0.5 rounded-full">
                        <TrendingUp size={10} /> {m.growth}
                      </span>
                    ) : m.growthType === 'down' ? (
                      <span className="flex items-center gap-1 text-rose-600 text-[10px] font-black bg-rose-50 px-2 py-0.5 rounded-full">
                        <TrendingDown size={10} /> {m.growth}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50">
                        {m.growth}
                      </span>
                    )}
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{m.label}</p>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight mb-1">{m.value}</h3>
                    <p className="text-[10px] font-bold text-slate-400">{m.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Powerful Interactive Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Financial Trend with Dynamic Filter */}
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-black text-slate-900 tracking-tight text-lg flex items-center gap-2">
                      <DollarSign className="text-indigo-600" size={18} /> Tren Arus Kas Bulanan
                    </h3>
                    <p className="text-xs text-slate-400 font-bold">Perbandingan real-time Pemasukan vs Pengeluaran.</p>
                  </div>
                  
                  {/* Dynamic Time Span Selector */}
                  <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200">
                    {['3m', '6m', '12m'].map(span => (
                      <button
                        key={span}
                        onClick={() => setFinancialTimeSpan(span as any)}
                        className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wide transition-all ${financialTimeSpan === span ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                      >
                        {span === '3m' ? '3 Bulan' : span === '6m' ? '6 Bulan' : '1 Tahun'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={financialStats.trend}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.12}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '1.25rem', border: 'none', boxShadow: '0 15px 35px rgba(0,0,0,0.08)', padding: '12px' }}
                        labelStyle={{ color: '#1e293b', fontWeight: 'bold', marginBottom: '4px' }}
                      />
                      <Area type="monotone" name="Pemasukan" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                      <Area type="monotone" name="Pengeluaran" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Security Activity Chart with Filter */}
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-black text-slate-900 tracking-tight text-lg flex items-center gap-2">
                      <Shield className="text-indigo-600" size={18} /> Keaktifan Pengamanan Terpadu
                    </h3>
                    <p className="text-xs text-slate-400 font-bold">Keseimbangan pos jaga ronde malam dan sebaran insiden.</p>
                  </div>

                  <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200">
                    {['7d', '30d'].map(span => (
                      <button
                        key={span}
                        onClick={() => setSecurityTimeSpan(span as any)}
                        className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wide transition-all ${securityTimeSpan === span ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                      >
                        {span === '7d' ? '7 Hari' : '30 Hari'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={securityStats.patrolActivity}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                      <Tooltip 
                        cursor={{fill: '#f8fafc', radius: 4}}
                        contentStyle={{ borderRadius: '1.25rem', border: 'none', boxShadow: '0 15px 35px rgba(0,0,0,0.08)', padding: '12px' }}
                      />
                      <Bar name="Patroli Sukses" dataKey="patrols" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={securityTimeSpan === '7d' ? 24 : 8} />
                      <Bar name="Laporan Keamanan" dataKey="incidents" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={securityTimeSpan === '7d' ? 24 : 8} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'demographics' && (
          <motion.div
            key="demographics"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4"
          >
            {/* Embedded DemographicAnalytics but cleaner and with hidden duplicate elements */}
            <DemographicAnalytics 
              houses={houses} 
              cashFlow={cashFlow} 
              reports={reports} 
              pdfConfig={pdfConfig} 
              hideHeader={true} 
            />
          </motion.div>
        )}

        {activeTab === 'operational' && (
          <motion.div
            key="operational"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-10"
          >
            {/* Arrears and Billing Collections interactive block */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="font-black text-slate-900 tracking-tight text-lg">Kelancaran Tagihan Iuran</h3>
                  <p className="text-xs text-slate-400 font-bold">Kolektivitas keuangan dan akurasi setoran bulanan warga RT 02.</p>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div className="hidden sm:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Rasio Koleksi</p>
                    <span className="text-xs font-bold text-slate-500">Target 100% Tercapai</span>
                  </div>
                  <div className="px-5 py-3 bg-emerald-50 rounded-2xl flex flex-col justify-center border border-emerald-100">
                    <span className="text-3xl font-black text-emerald-600 leading-none mb-0.5">{financialStats.collectionRate.toFixed(0)}%</span>
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none">Lunas Terbayar</span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${financialStats.collectionRate}%` }}
                  className="h-full bg-emerald-500 rounded-full"
                  transition={{ duration: 0.8 }}
                />
              </div>

              {/* Toggle panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-[2rem] bg-emerald-50/50 border border-emerald-100 flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl text-emerald-600 shadow-sm"><CheckCircle2 size={20}/></div>
                    <div>
                      <h4 className="font-black text-emerald-800 text-xs uppercase tracking-widest">Sudah Lunas</h4>
                      <p className="text-2xl font-black text-emerald-950 mt-1">{houses.filter(h => h.status === 'Occupied').length - financialStats.housesWithArrears} <span className="text-xs font-bold text-slate-400 font-sans">Rumah</span></p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-[2rem] bg-rose-50/50 border border-rose-100 flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl text-rose-600 shadow-sm"><Clock size={20}/></div>
                    <div>
                      <h4 className="font-black text-rose-800 text-xs uppercase tracking-widest">Menunggak Iuran</h4>
                      <p className="text-2xl font-black text-rose-950 mt-1">{financialStats.housesWithArrears} <span className="text-xs font-bold text-slate-400 font-sans">Rumah</span></p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setShowArrearsDetailInput(!showArrearsDetailInput)}
                    className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-black rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <span>{showArrearsDetailInput ? 'Sembunyikan' : 'Kelola Daftar'}</span>
                    <ChevronRight size={14} className={`transform transition-transform ${showArrearsDetailInput ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              </div>

              {/* COLLAPSIBLE ACTIVE MANAGEMENT PANEL: Arrears List */}
              <AnimatePresence>
                {showArrearsDetailInput && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={listCardVariants}
                    className="border border-slate-200 rounded-[2.5rem] bg-slate-50 p-6 md:p-8 space-y-6 overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                          <ClipboardList size={16} className="text-rose-600" /> Daftar Pengingat Tunggakan Iuran
                        </h4>
                        <p className="text-xs font-medium text-slate-500">Kirim pengingat WhatsApp santun langsung kepada warga yang tertunda.</p>
                      </div>

                      <div className="relative w-full sm:w-64">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Cari kepala keluarga/no.rumah..."
                          value={arrearsSearchQuery}
                          onChange={(e) => setArrearsSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-white text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                        />
                      </div>
                    </div>

                    {filteredArrearsHouses.length > 0 ? (
                      <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-inner">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-100 text-slate-600 font-black uppercase tracking-wider text-[10px] border-b border-slate-200">
                              <th className="p-4">No. Rumah / Blok</th>
                              <th className="p-4">Kepala Keluarga</th>
                              <th className="p-4 text-center">Jumlah Bulan</th>
                              <th className="p-4">Rincian Bulan Unpaid</th>
                              <th className="p-4 text-right">Aksi Cepat</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredArrearsHouses.map(h => (
                              <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-bold text-slate-800">Rumah No. {h.number} (Blok {h.block})</td>
                                <td className="p-4 font-semibold text-slate-700">{h.familyHead}</td>
                                <td className="p-4 text-center"><span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-black text-[10px]">{h.arrearsCount} Bulan</span></td>
                                <td className="p-4 text-slate-500 italic max-w-xs truncate">{h.arrearsDetails}</td>
                                <td className="p-4 text-right">
                                  {h.phone && h.phone !== '-' ? (
                                    <button
                                      onClick={() => sendWhatsAppReminder(h.familyHead, h.number, h.arrearsCount, h.phone)}
                                      className="px-3.5 py-1.5 bg-indigo-50 hover:bg-emerald-50 hover:text-emerald-700 text-indigo-600 font-black text-[10px] rounded-lg transition-colors flex items-center justify-center gap-1.5 ml-auto"
                                    >
                                      <Phone size={11} /> 
                                      <span>Hubungi WA</span>
                                    </button>
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-400 block pr-2">No WA Tidak Ada</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl text-sm font-medium text-slate-400">
                        Tidak ada warga dengan tunggakan ditemukan yang cocok dengan kriteria pencarian.
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Public Service Letters trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-slate-900 tracking-tight text-lg">Keaktifan Surat Menyurat</h3>
                    <p className="text-xs text-slate-400 font-bold">Volume pengajuan surat pengantar pelayanan warga.</p>
                  </div>
                  <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200 shrink-0">
                    {['3m', '6m'].map(span => (
                      <button
                        key={span}
                        onClick={() => setLetterTimeSpan(span as any)}
                        className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wide transition-all ${letterTimeSpan === span ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                      >
                        {span === '3m' ? '3 Bulan' : '6 Bulan'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Total Terbit</p>
                    <p className="text-3xl font-black text-slate-900 leading-none">{letterStats.totalLetters}</p>
                  </div>
                  <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1.5">Masih Menunggu</p>
                    <p className="text-3xl font-black text-amber-600 leading-none">{letterStats.pendingLetters}</p>
                  </div>
                </div>

                <div className="h-48 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={letterStats.trend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                      <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                      <Line type="monotone" name="Jumlah Surat" dataKey="count" stroke="#6366f1" strokeWidth={3.5} dot={{ r: 5, fill: '#6366f1' }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                <div>
                  <h3 className="font-black text-slate-900 tracking-tight text-lg">Jenis Surat Terpopuler</h3>
                  <p className="text-xs text-slate-400 font-bold">Kategori birokrasi yang paling sering diajukan warga.</p>
                </div>
                
                <div className="space-y-4">
                  {letterStats.typeData.slice(0, 5).map((item, idx) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-700">{item.name}</span>
                        <span className="text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-lg text-[10px]">{item.value} Pengajuan</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${letterStats.totalLetters > 0 ? (item.value / letterStats.totalLetters) * 100 : 0}%` }}
                          className="h-full bg-indigo-500 rounded-full"
                          transition={{ duration: 0.8, delay: idx * 0.05 }}
                        />
                      </div>
                    </div>
                  ))}
                  {letterStats.typeData.length === 0 && (
                    <div className="p-10 text-center text-sm font-medium text-slate-400 italic">
                      Belum ada data surat pengajuan terdaftar.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quality Alerts Hub */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
              <div>
                <h3 className="font-black text-slate-900 tracking-tight text-lg">Kelengkapan & Validitas Database Warga</h3>
                <p className="text-xs text-slate-400 font-bold">Kecerdasan kualitas data untuk memastikan integritas file warga bersangkutan.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Incomplete Phone numbers alert card */}
                <div className="border border-slate-100 p-6 rounded-[2rem] bg-slate-50 relative group transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-115 transition-transform">
                      <AlertTriangle size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-800 text-sm">Data Kontak Belum Lengkap</h4>
                      <p className="text-xs text-slate-500 mt-1">{incompleteHouses.length} rumah belum memiliki nomor telepon kepala keluarga.</p>
                    </div>
                    <button 
                      onClick={() => setShowIncompleteDetail(!showIncompleteDetail)}
                      className="px-3.5 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 font-bold text-[10px] rounded-lg transition-colors shrink-0"
                    >
                      {showIncompleteDetail ? 'Tutup' : 'Lihat'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showIncompleteDetail && (
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={listCardVariants}
                        className="mt-4 border border-amber-100 bg-white p-4 rounded-xl max-h-48 overflow-y-auto space-y-2 shadow-inner"
                      >
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daftar Rumah Terdampak:</p>
                        {incompleteHouses.map(h => (
                          <div key={h.id} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-50 last:border-b-0">
                            <span className="font-bold text-slate-700">Rumah No. {h.number} (Blok {h.block})</span>
                            <span className="text-slate-400 italic">Kepala Keluarga: {h.familyHead}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Unverified houses alert card */}
                <div className="border border-slate-100 p-6 rounded-[2rem] bg-slate-50 relative group transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-115 transition-transform">
                      <UserCheck size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-800 text-sm">Butuh Verifikasi Fisik</h4>
                      <p className="text-xs text-slate-500 mt-1">{unverifiedHouses.length} rumah belum diverifikasi fisiknya oleh pengurus RT.</p>
                    </div>
                    <button 
                      onClick={() => setShowUnverifiedDetail(!showUnverifiedDetail)}
                      className="px-3.5 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 font-bold text-[10px] rounded-lg transition-colors shrink-0"
                    >
                      {showUnverifiedDetail ? 'Tutup' : 'Lihat'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showUnverifiedDetail && (
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={listCardVariants}
                        className="mt-4 border border-rose-100 bg-white p-4 rounded-xl max-h-48 overflow-y-auto space-y-2 shadow-inner"
                      >
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daftar Rumah Belum Verifikasi:</p>
                        {unverifiedHouses.map(h => (
                          <div key={h.id} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-50 last:border-b-0">
                            <span className="font-bold text-slate-700">Rumah No. {h.number} (Blok {h.block})</span>
                            <span className="text-slate-400 italic">Kepala Keluarga: {h.familyHead}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* High visual summary card with dark/slate cosmic style */}
            <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full translate-x-1/3 -translate-y-1/3"></div>
              
              <div className="space-y-2 relative z-10">
                <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <Sparkles size={20} className="text-indigo-400" /> Analisis Kecepatan Administrasi
                </h3>
                <p className="text-sm font-medium text-slate-300 max-w-2xl">
                  Bulan ini pelayanan surat-menyurat RT mencapai rasio penyelesaian secepat <strong>12 jam</strong> sejak pengajuan diajukan warga. Pos kamling aktif dengan status kelancaran aman. Tingkatkan partisipasi warga secara berkelanjutan.
                </p>
              </div>

              <div className="relative z-10 shrink-0 w-full md:w-auto p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Responsifitas Pelayanan</span>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Layanan Surat</span>
                    <span className="text-emerald-400 font-bold">Respon Cepat</span>
                  </div>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden w-full md:w-48">
                  <div className="h-full bg-emerald-500 w-[85%]"></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
