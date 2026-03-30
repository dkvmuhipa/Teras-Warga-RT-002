import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, Shield, DollarSign, AlertTriangle, 
  Calendar, CheckCircle2, Clock, MapPin, Activity, ArrowUpRight, 
  ArrowDownRight, Filter, Download, Baby, Heart, User, UserCheck, 
  Sparkles, FileText, ChevronRight, Info, GraduationCap, Briefcase,
  LayoutDashboard
} from 'lucide-react';
import { RondaCheckLog, Report, House, Official, CashFlow, LetterRequest } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { useFinancial } from '../../context/FinancialContext';

interface AdminAnalyticsProps {
  rondaLogs: RondaCheckLog[];
  reports: Report[];
  houses: House[];
  officials: Official[];
  letters: LetterRequest[];
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ rondaLogs, reports, houses, officials, letters }) => {
  const { cashFlow, getArrearsForHouse } = useFinancial();
  const [activeTab, setActiveTab] = useState<'overview' | 'demographics' | 'operational'>('overview');

  // Helper to calculate age
  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return 30;
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return 30;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // --- Security Analytics ---
  const securityStats = useMemo(() => {
    const totalLogs = rondaLogs.length;
    const incidents = reports.filter(r => r.type === 'Keamanan').length;
    const completionRate = totalLogs > 0 ? (rondaLogs.filter(l => l.status === 'Aman').length / totalLogs) * 100 : 0;
    
    // Group logs by day for the last 7 days (Real Data)
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const patrolActivity = last7Days.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
      
      const dayLogs = rondaLogs.filter(l => l.timestamp.startsWith(dateStr)).length;
      const dayIncidents = reports.filter(r => r.type === 'Keamanan' && r.date === dateStr).length;

      return {
        name: dayName,
        patrols: dayLogs,
        incidents: dayIncidents
      };
    });

    return { totalLogs, incidents, completionRate, patrolActivity };
  }, [rondaLogs, reports]);

  // --- Financial Analytics ---
  const financialStats = useMemo(() => {
    const income = cashFlow.filter((t: CashFlow) => t.type === 'Income').reduce((acc: number, t: CashFlow) => acc + t.amount, 0);
    const expense = cashFlow.filter((t: CashFlow) => t.type === 'Expense').reduce((acc: number, t: CashFlow) => acc + t.amount, 0);
    const balance = income - expense;

    // Monthly trend (Real Data)
    const last6Months = [...Array(6)].map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return d;
    });

    const trend = last6Months.map(date => {
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthLabel = date.toLocaleDateString('id-ID', { month: 'short' });

      const monthIncome = cashFlow
        .filter(t => {
          const d = new Date(t.date);
          return d.getMonth() === month && d.getFullYear() === year && t.type === 'Income';
        })
        .reduce((acc, t) => acc + t.amount, 0);

      const monthExpense = cashFlow
        .filter(t => {
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

    // Arrears
    const housesWithArrears = houses.filter(h => getArrearsForHouse(h).length > 0).length;
    const collectionRate = houses.length > 0 ? ((houses.length - housesWithArrears) / houses.length) * 100 : 0;

    return { income, expense, balance, trend, housesWithArrears, collectionRate };
  }, [cashFlow, houses, getArrearsForHouse]);

  // --- Letter Analytics ---
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

    // Monthly trend
    const last6Months = [...Array(6)].map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return d;
    });

    const trend = last6Months.map(date => {
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthLabel = date.toLocaleDateString('id-ID', { month: 'short' });

      const count = letters.filter(l => {
        const d = new Date(l.date);
        return d.getMonth() === month && d.getFullYear() === year;
      }).length;

      return { name: monthLabel, count };
    });

    return { totalLetters, pendingLetters, approvedLetters, typeData, trend };
  }, [letters]);

  // --- Resident Demographics (Unified) ---
  const demographicStats = useMemo(() => {
    const allResidents: any[] = [];
    const religions: Record<string, number> = {};
    const educations: Record<string, number> = {};
    const jobs: Record<string, number> = {};
    let totalVehicles = 0;
    let totalPregnant = 0;
    let totalBabies = 0;
    let totalToddlers = 0;
    let totalChildren = 0;
    let totalTeenagers = 0;
    let totalAdults = 0;
    let totalElderly = 0;
    let totalWidows = 0;
    let totalPKH = 0;
    let totalBLT = 0;
    let totalBansosLain = 0;

    houses.forEach(h => {
      if (h && h.status === 'Occupied') {
        totalVehicles += (h.vehicleCount || 0);
        totalPregnant += (h.pregnantCount || 0);
        totalBabies += (h.babyCount || 0);
        totalToddlers += (h.toddlerCount || 0);
        totalChildren += (h.childCount || 0);
        totalTeenagers += (h.teenagerCount || 0);
        totalAdults += (h.adultCount || 0);
        totalElderly += (h.elderlyCount || 0);
        totalWidows += (h.widowCount || 0);
        if (h.isPKH) totalPKH++;
        if (h.isBLT) totalBLT++;
        if (h.isBansosLain) totalBansosLain++;

        // Add Head of Family
        const hoF = {
          gender: h.gender || 'Laki-laki',
          age: calculateAge(h.birthDate),
          job: h.jobCategory || 'Lainnya',
          religion: h.religion || 'Lainnya',
          education: h.education || 'Lainnya'
        };
        allResidents.push(hoF);
        
        religions[hoF.religion] = (religions[hoF.religion] || 0) + 1;
        educations[hoF.education] = (educations[hoF.education] || 0) + 1;
        jobs[hoF.job] = (jobs[hoF.job] || 0) + 1;
        
        // Add Family Members
        if (h.familyMembers && Array.isArray(h.familyMembers)) {
          h.familyMembers.forEach((m: any) => {
            if (!m) return;
            const member = {
              gender: m.gender || 'Laki-laki',
              age: calculateAge(m.birthDate),
              job: m.job || 'Lainnya',
              religion: h.religion || 'Lainnya',
              education: m.education || 'Lainnya'
            };
            allResidents.push(member);
            religions[member.religion] = (religions[member.religion] || 0) + 1;
            educations[member.education] = (educations[member.education] || 0) + 1;
            jobs[member.job] = (jobs[member.job] || 0) + 1;
          });
        }
      }
    });

    const ageGroups = {
      bayi: allResidents.filter(r => r.age < 1).length,
      balita: allResidents.filter(r => r.age >= 1 && r.age <= 5).length,
      anak: allResidents.filter(r => r.age > 5 && r.age <= 12).length,
      remaja: allResidents.filter(r => r.age > 12 && r.age <= 18).length,
      dewasa: allResidents.filter(r => r.age > 18 && r.age <= 55).length,
      lansia: allResidents.filter(r => r.age > 55).length,
    };

    const ageDistribution = [
      { name: 'Bayi', value: ageGroups.bayi, color: '#fb7185' },
      { name: 'Balita', value: ageGroups.balita, color: '#fb923c' },
      { name: 'Anak', value: ageGroups.anak, color: '#3b82f6' },
      { name: 'Remaja', value: ageGroups.remaja, color: '#6366f1' },
      { name: 'Dewasa', value: ageGroups.dewasa, color: '#10b981' },
      { name: 'Lansia', value: ageGroups.lansia, color: '#f59e0b' },
    ].filter(d => d.value > 0);

    const genderDistribution = [
      { name: 'Laki-laki', value: allResidents.filter(r => r.gender === 'Laki-laki').length, color: '#3b82f6' },
      { name: 'Perempuan', value: allResidents.filter(r => r.gender === 'Perempuan').length, color: '#ec4899' },
    ];

    const religionData = Object.entries(religions).map(([name, value]) => ({ name, value }));
    const educationData = Object.entries(educations).map(([name, value]) => ({ name, value }));
    const occupationData = Object.entries(jobs).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

    return {
      totalOccupants: allResidents.length,
      ageGroups,
      ageDistribution,
      genderDistribution,
      religionData,
      educationData,
      occupationData,
      vulnerable: {
        pregnant: totalPregnant,
        babies: totalBabies,
        toddlers: totalToddlers,
        children: totalChildren,
        teenagers: totalTeenagers,
        adults: totalAdults,
        elderly: totalElderly,
        widows: totalWidows,
        pkh: totalPKH,
        blt: totalBLT,
        bansos: totalBansosLain
      }
    };
  }, [houses]);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pusat Analitik RT</h2>
          <p className="text-slate-500 font-medium text-sm">Pemantauan terpadu keamanan, keuangan, dan demografi warga.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {[
            { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
            { id: 'demographics', label: 'Demografi', icon: Users },
            { id: 'operational', label: 'Operasional', icon: Activity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2
                ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
              `}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div variants={cardVariants} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <DollarSign size={24} />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-black">
                    <TrendingUp size={14} /> +12%
                  </div>
                </div>
                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Saldo Kas</h3>
                <p className="text-2xl font-black text-slate-900">Rp {financialStats.balance.toLocaleString('id-ID')}</p>
              </motion.div>

              <motion.div variants={cardVariants} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <Shield size={24} />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-black">
                    <CheckCircle2 size={14} /> 100%
                  </div>
                </div>
                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Kepatuhan Ronda</h3>
                <p className="text-2xl font-black text-slate-900">{securityStats.completionRate.toFixed(1)}%</p>
              </motion.div>

              <motion.div variants={cardVariants} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="flex items-center gap-1 text-rose-600 text-xs font-black">
                    <TrendingDown size={14} /> -5%
                  </div>
                </div>
                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Laporan Insiden</h3>
                <p className="text-2xl font-black text-slate-900">{securityStats.incidents} <span className="text-sm font-bold text-slate-400">Bulan Ini</span></p>
              </motion.div>

              <motion.div variants={cardVariants} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                    <Users size={24} />
                  </div>
                  <div className="flex items-center gap-1 text-indigo-600 text-xs font-black">
                    <Activity size={14} /> Aktif
                  </div>
                </div>
                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Warga</h3>
                <p className="text-2xl font-black text-slate-900">{demographicStats.totalOccupants} <span className="text-sm font-bold text-slate-400">Jiwa</span></p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Financial Trend */}
              <motion.div variants={cardVariants} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Tren Keuangan</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">Perbandingan pemasukan dan pengeluaran 6 bulan terakhir.</p>
                  </div>
                  <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"><Download size={20}/></button>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={financialStats.trend}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                      <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Security Activity */}
              <motion.div variants={cardVariants} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Aktivitas Keamanan</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">Jumlah patroli dan insiden dalam 7 hari terakhir.</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Patroli</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Insiden</span>
                    </div>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={securityStats.patrolActivity}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="patrols" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="incidents" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {activeTab === 'demographics' && (
          <motion.div
            key="demographics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Age Distribution */}
              <motion.div variants={cardVariants} className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">Distribusi Usia</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={demographicStats.ageDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {demographicStats.ageDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {demographicStats.ageDistribution.map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-xs font-bold text-slate-600">{item.name}</span>
                        </div>
                        <span className="text-xs font-black text-slate-900">{item.value} Jiwa</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Gender Distribution */}
              <motion.div variants={cardVariants} className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-xl shadow-indigo-600/20">
                <h3 className="text-xl font-black tracking-tight mb-8">Keseimbangan Gender</h3>
                <div className="space-y-8">
                  {demographicStats.genderDistribution.map((item, i) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-bold">{item.name}</span>
                        <span className="text-2xl font-black">{item.value}</span>
                      </div>
                      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.value / demographicStats.totalOccupants) * 100}%` }}
                          className={`h-full rounded-full ${i === 0 ? 'bg-blue-400' : 'bg-pink-400'}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Occupation Bar Chart */}
              <motion.div variants={cardVariants} className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">Sebaran Pekerjaan (Top 6)</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={demographicStats.occupationData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} width={100} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={20}>
                        {demographicStats.occupationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Education */}
              <motion.div variants={cardVariants} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">Pendidikan</h3>
                <div className="space-y-4">
                  {demographicStats.educationData.slice(0, 5).map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">{item.name}</span>
                      <span className="text-xs font-black text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Vulnerable Groups Bento */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { label: 'Ibu Hamil', value: demographicStats.vulnerable.pregnant, icon: Heart, color: 'rose' },
                { label: 'Bayi', value: demographicStats.vulnerable.babies, icon: Baby, color: 'sky' },
                { label: 'Balita', value: demographicStats.vulnerable.toddlers, icon: Sparkles, color: 'emerald' },
                { label: 'Lansia', value: demographicStats.vulnerable.elderly, icon: User, color: 'amber' },
                { label: 'Penerima PKH', value: demographicStats.vulnerable.pkh, icon: FileText, color: 'indigo' },
                { label: 'Penerima BLT', value: demographicStats.vulnerable.blt, icon: DollarSign, color: 'emerald' }
              ].map((item) => (
                <div key={item.label} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                  <div className={`p-3 bg-${item.color}-50 text-${item.color}-600 rounded-2xl mb-2`}>
                    <item.icon size={18} />
                  </div>
                  <h4 className="text-xl font-black text-slate-900">{item.value}</h4>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'operational' && (
          <motion.div
            key="operational"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Collection Status (From AdminAnalytics) */}
            <motion.div variants={cardVariants} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Status Penagihan Iuran</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Persentase warga yang sudah melunasi iuran bulan ini.</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-600">{financialStats.collectionRate.toFixed(0)}%</span>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Tercapai</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${financialStats.collectionRate}%` }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-white rounded-xl text-emerald-600 shadow-sm"><CheckCircle2 size={18}/></div>
                      <h4 className="font-black text-emerald-800 text-xs uppercase tracking-widest">Sudah Lunas</h4>
                    </div>
                    <p className="text-xl font-black text-emerald-900">{houses.length - financialStats.housesWithArrears} <span className="text-[10px] font-bold text-emerald-600">Rumah</span></p>
                  </div>

                  <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-white rounded-xl text-rose-600 shadow-sm"><Clock size={18}/></div>
                      <h4 className="font-black text-rose-800 text-xs uppercase tracking-widest">Menunggak</h4>
                    </div>
                    <p className="text-xl font-black text-rose-900">{financialStats.housesWithArrears} <span className="text-[10px] font-bold text-rose-600">Rumah</span></p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quality Alerts (From DemographicAnalytics) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-6">Layanan Surat Menyurat</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-indigo-50 rounded-2xl">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Pengajuan</p>
                    <p className="text-2xl font-black text-indigo-600">{letterStats.totalLetters}</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl">
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Menunggu</p>
                    <p className="text-2xl font-black text-amber-600">{letterStats.pendingLetters}</p>
                  </div>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={letterStats.trend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                      <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                      <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-6">Jenis Surat Terpopuler</h3>
                <div className="space-y-4">
                  {letterStats.typeData.slice(0, 5).map((item, idx) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-600">{item.name}</span>
                        <span className="text-slate-900">{item.value}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${(item.value / letterStats.totalLetters) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quality Alerts (From DemographicAnalytics) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-sm">Data Tidak Lengkap</h4>
                  <p className="text-xs text-slate-500">{houses.filter(h => !h.phone || h.phone === '-').length} rumah belum memiliki nomor telepon valid.</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl">
                  <UserCheck size={24} />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-sm">Belum Verifikasi</h4>
                  <p className="text-xs text-slate-500">{houses.filter(h => !h.isVerified).length} rumah memerlukan verifikasi data fisik.</p>
                </div>
              </div>
            </div>

            {/* Operational Efficiency (From DemographicAnalytics) */}
            <div className="bg-slate-900 p-8 rounded-[3rem] text-white">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <Activity size={20} className="text-indigo-400" />
                </div>
                <h3 className="text-lg font-black tracking-tight">Efisiensi Operasional</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-300">Respon Laporan</span>
                    <span className="text-xs font-black text-emerald-400">Cepat</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[85%]"></div>
                  </div>
                </div>
                <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-300">Koleksi Iuran</span>
                    <span className="text-xs font-black text-amber-400">72%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[72%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
