import React, { useState } from 'react';
import { 
  Users, DollarSign, AlertTriangle, TrendingUp, TrendingDown, 
  Activity, Calendar, ArrowRight, Plus, Download, FileText,
  Clock, CheckCircle2, MessageSquare, User, Megaphone, Sparkles, Trash2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { House, CashFlow, Report, Announcement, PaymentStatus, GuestReport } from '../../types';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { generateDashboardSummary } from '../../services/geminiService';
import { Button } from '../ui/Button';

import { CHECKPOINTS, RT_NAME } from '../../constants';

interface DashboardOverviewProps {
  houses: House[];
  cashFlow: CashFlow[];
  reports: Report[];
  announcements: Announcement[];
  guestReports: GuestReport[];
  iuranPayments: any[];
  onTabChange: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ houses, cashFlow, reports, announcements, guestReports, iuranPayments, onTabChange }) => {
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleGenerateSummary = async () => {
    setIsAiLoading(true);
    const data = {
      totalResidents: houses.filter(h => h.status === 'Occupied').reduce((acc, h) => acc + (h.occupants || 0), 0),
      cashBalance: cashFlow.filter(c => c.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0) - cashFlow.filter(c => c.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0),
      reportsCount: reports.filter(r => r.status === 'Baru').length,
      unpaidCount: houses.filter(h => h.paymentStatusAir === PaymentStatus.UNPAID || h.paymentStatusSampah === PaymentStatus.UNPAID).length,
      babyCount: houses.reduce((acc, h) => acc + (h.babyCount || 0), 0),
      toddlerCount: houses.reduce((acc, h) => acc + (h.toddlerCount || 0), 0),
      pregnantCount: houses.reduce((acc, h) => acc + (h.pregnantCount || 0), 0),
      elderlyCount: houses.reduce((acc, h) => acc + (h.elderlyCount || 0), 0),
      widowCount: houses.reduce((acc, h) => acc + (h.widowCount || 0), 0)
    };
    const summary = await generateDashboardSummary(data);
    setAiSummary(summary);
    setIsAiLoading(false);
  };
  // Calculate Stats
  const totalResidents = houses.filter(h => h.status === 'Occupied').reduce((acc, h) => acc + (h.occupants || 0), 0);
  const occupiedHouses = houses.filter(h => h.status === 'Occupied').length;
  
  const income = cashFlow.filter(c => c.type === 'Income').reduce((acc, c) => acc + c.amount, 0);
  const expense = cashFlow.filter(c => c.type === 'Expense').reduce((acc, c) => acc + c.amount, 0);
  const balance = income - expense;

  const newReports = reports.filter(r => r.status === 'Baru').length;
  const activeGuests = guestReports.filter(g => g.status === 'Active').length;
  
  // Waste Retribution Stats (Palu City Context)
  const currentMonth = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  const paidWasteCount = iuranPayments.filter(p => p.month === currentMonth && (p.type === 'Sampah' || p.type === 'Both')).length;
  const totalOccupiedHouses = houses.filter(h => h.status === 'Occupied').length;
  const wastePaymentPercentage = totalOccupiedHouses > 0 ? Math.round((paidWasteCount / totalOccupiedHouses) * 100) : 0;

  // Chart Data Preparation
  const chartData = cashFlow.slice(-7).map(c => ({
    name: new Date(c.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    amount: c.amount,
    type: c.type
  }));

  // Demographic Chart Data
  const demographicData = [
    { name: 'Ibu Hamil', value: houses.reduce((acc, h) => acc + (h.pregnantCount || 0), 0) },
    { name: 'Bayi', value: houses.reduce((acc, h) => acc + (h.babyCount || 0), 0) },
    { name: 'Balita', value: houses.reduce((acc, h) => acc + (h.toddlerCount || 0), 0) },
    { name: 'Remaja', value: houses.reduce((acc, h) => acc + (h.teenagerCount || 0), 0) },
    { name: 'Lansia', value: houses.reduce((acc, h) => acc + (h.elderlyCount || 0), 0) },
    { name: 'Janda', value: houses.reduce((acc, h) => acc + (h.widowCount || 0), 0) },
  ];

  // Report Status Chart Data
  const reportStatusData = [
    { name: 'Baru', value: reports.filter(r => r.status === 'Baru').length },
    { name: 'Diproses', value: reports.filter(r => r.status === 'Diproses').length },
    { name: 'Selesai', value: reports.filter(r => r.status === 'Selesai').length },
  ];

  // Recent Activity Logic
  const recentActivity = [
    ...reports.map(r => ({
      type: 'report',
      title: 'Laporan Baru',
      desc: r.type,
      time: new Date(r.date),
      icon: MessageSquare,
      color: 'blue'
    })),
    ...cashFlow.map(c => ({
      type: 'cash',
      title: c.type === 'Income' ? 'Pemasukan' : 'Pengeluaran',
      desc: c.description,
      time: new Date(c.date),
      icon: c.type === 'Income' ? TrendingUp : TrendingDown,
      color: c.type === 'Income' ? 'emerald' : 'rose'
    })),
    ...announcements.map(a => ({
      type: 'announcement',
      title: 'Pengumuman',
      desc: a.title,
      time: new Date(a.date),
      icon: Megaphone,
      color: 'amber'
    }))
  ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
    return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Halo, Admin! 👋</h2>
          <p className="text-slate-500 font-medium mt-1">Berikut adalah ringkasan aktivitas {RT_NAME} hari ini.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleGenerateSummary} className="bg-indigo-600 hover:bg-indigo-700">
            <Sparkles size={18} className="mr-2" /> {isAiLoading ? 'Memproses...' : 'Ringkasan AI'}
          </Button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
            <Download size={18} />
            Ekspor Laporan
          </button>
          <button onClick={() => onTabChange('residents')} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
            <Plus size={18} />
            Tambah Data
          </button>
        </div>
      </div>

      {aiSummary && (
        <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl">
          <h4 className="font-bold text-lg mb-4 text-indigo-300">Ringkasan AI:</h4>
          <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
            {aiSummary}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Warga Card */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all group relative overflow-hidden cursor-pointer" onClick={() => onTabChange('residents')}>
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Populasi</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black text-slate-900">{totalResidents}</h3>
              <span className="text-sm font-bold text-slate-400">Jiwa</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px]">
                    <User size={10} />
                  </div>
                ))}
              </div>
              <span>Tersebar di {occupiedHouses} Rumah</span>
            </div>
          </div>
        </motion.div>

        {/* Keuangan Card */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all group relative overflow-hidden cursor-pointer" onClick={() => onTabChange('finance')}>
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                <DollarSign size={24} />
              </div>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Saldo Kas</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black text-slate-900">Rp{(balance / 1000000).toFixed(1)}jt</h3>
            </div>
            <div className="mt-4 flex gap-2">
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                <TrendingUp size={10} /> +{(income / 1000000).toFixed(1)}jt
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                <TrendingDown size={10} /> -{(expense / 1000000).toFixed(1)}jt
              </div>
            </div>
          </div>
        </motion.div>

        {/* Laporan Card */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-rose-500/5 transition-all group relative overflow-hidden cursor-pointer" onClick={() => onTabChange('services')}>
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform">
                <AlertTriangle size={24} />
              </div>
              <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Laporan</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black text-slate-900">{newReports}</h3>
              <span className="text-sm font-bold text-slate-400">Baru</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-rose-500">
              <Activity size={14} className="animate-pulse" />
              <span>Memerlukan tindak lanjut</span>
            </div>
          </div>
        </motion.div>

        {/* Tamu Card */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 transition-all group relative overflow-hidden cursor-pointer" onClick={() => onTabChange('guests')}>
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                <ShieldAlert size={24} />
              </div>
              <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Tamu</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black text-slate-900">{activeGuests}</h3>
              <span className="text-sm font-bold text-slate-400">Aktif</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-amber-500">
              <Clock size={14} />
              <span>Menginap 1x24 Jam</span>
            </div>
          </div>
        </motion.div>

        {/* Retribusi Sampah Card (Palu City Special) */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden cursor-pointer" onClick={() => onTabChange('finance')}>
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Trash2 size={24} />
              </div>
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Retribusi Sampah</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black text-slate-900">{wastePaymentPercentage}%</h3>
              <span className="text-sm font-bold text-slate-400">Lunas</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-500">
              <CheckCircle2 size={14} />
              <span>{paidWasteCount} dari {totalOccupiedHouses} Rumah ({currentMonth})</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">Arus Kas Mingguan</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} tickFormatter={(v) => `Rp${v/1000}k`} />
                  <Tooltip />
                  <Area type="monotone" dataKey="amount" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">Demografi Warga</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demographicData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">Status Laporan</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportStatusData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Side Panel: Quick Actions & Activity */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <h3 className="text-lg font-black mb-6 relative z-10">Aksi Cepat</h3>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <button onClick={() => onTabChange('services')} className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg group-hover:scale-110 transition-transform">
                  <FileText size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Buat Surat</span>
              </button>
              <button onClick={() => onTabChange('finance')} className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg group-hover:scale-110 transition-transform">
                  <DollarSign size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Input Kas</span>
              </button>
              <button onClick={() => onTabChange('content')} className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg group-hover:scale-110 transition-transform">
                  <Megaphone size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Siaran</span>
              </button>
              <button onClick={() => onTabChange('residents')} className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
                <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg group-hover:scale-110 transition-transform">
                  <Users size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Warga Baru</span>
              </button>
            </div>
          </motion.div>

          {/* Recent Activity Feed */}
          <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-900 tracking-tight">Aktivitas Terbaru</h3>
              <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Lihat Semua</button>
            </div>
            <div className="space-y-6">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex gap-4 group cursor-pointer">
                  <div className={`shrink-0 w-10 h-10 rounded-xl bg-${activity.color}-50 text-${activity.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <activity.icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-bold text-slate-800 truncate">{activity.title}</p>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{formatTimeAgo(activity.time)}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{activity.desc}</p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Belum ada aktivitas terbaru.</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
