import React, { useState } from 'react';
import { 
  Users, DollarSign, AlertTriangle, TrendingUp, TrendingDown, 
  Activity, Calendar, ArrowRight, Plus, Download, FileText,
  Clock, CheckCircle2, MessageSquare, User, Megaphone, Sparkles, Trash2,
  Shield, Package, Bell, LayoutGrid, UserPlus, ShoppingCart, CheckSquare
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { House, CashFlow, Report, Announcement, PaymentStatus, GuestReport } from '../../types';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { generateDashboardSummary } from '../../services/geminiService';
import { safeJsonStringify } from '../../services/databaseService';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

import { CHECKPOINTS, RT_NAME } from '../../constants';

interface DashboardOverviewProps {
  houses: House[];
  cashFlow: CashFlow[];
  reports: Report[];
  announcements: Announcement[];
  guestReports: GuestReport[];
  iuranPayments: any[];
  onTabChange: (tab: string, subTab?: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ houses, cashFlow, reports, announcements, guestReports, iuranPayments, onTabChange }) => {
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleGenerateSummary = async () => {
    setIsAiLoading(true);
    const data = {
      totalResidents: houses.filter(h => h.status === 'Occupied').reduce((acc, h) => acc + Math.max(h.occupants || 1, 1 + (h.familyMembers?.length || 0)), 0),
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

  const handleExportData = () => {
    try {
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        residentCount: totalResidents,
        houseCount: occupiedHouses,
        financeBalance: balance,
        newReportsCount: newReports,
        activeGuestsCount: activeGuests,
        timestamp: Date.now()
      };
      
      const blob = new Blob([safeJsonStringify(exportPayload, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `teraswarga-ringkasan-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      toast.success('Ringkasan data berhasil diekspor!');
    } catch (e) {
      toast.error('Gagal mengekspor data ringkasan.');
    }
  };

  // Calculate Stats
  const totalResidents = houses.filter(h => h.status === 'Occupied').reduce((acc, h) => acc + Math.max(h.occupants || 1, 1 + (h.familyMembers?.length || 0)), 0);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6">
        <div>
          {(() => {
            const hr = new Date().getHours();
            let greet = 'Selamat Hari';
            if (hr >= 5 && hr < 11) greet = 'Selamat Pagi';
            else if (hr >= 11 && hr < 15) greet = 'Selamat Siang';
            else if (hr >= 15 && hr < 19) greet = 'Selamat Sore';
            else if (hr >= 19 || hr < 5) greet = 'Selamat Malam';
            
            return (
              <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{greet}, Admin! </span>
                <span className="inline-block animate-bounce-slow origin-bottom">👋</span>
              </h2>
            );
          })()}
          <p className="text-slate-500 font-semibold mt-1 text-xs md:text-sm">Berikut adalah ringkasan aktivitas {RT_NAME} hari ini.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <Button onClick={handleGenerateSummary} className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-[10px] md:text-xs lg:text-sm py-2 px-3 md:py-2.5 md:px-4 h-auto shadow-md">
            <Sparkles size={14} className="mr-1.5 md:mr-2" /> {isAiLoading ? 'Memproses...' : 'Ringkasan AI'}
          </Button>
          <button onClick={handleExportData} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2.5 bg-white border border-slate-200 rounded-xl md:rounded-2xl text-[10px] md:text-xs lg:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
            <Download size={14} />
            <span>Ekspor</span>
          </button>
          <button onClick={() => onTabChange('residents')} className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2.5 md:px-4 md:py-2.5 bg-indigo-600 text-white rounded-xl md:rounded-2xl text-[10px] md:text-xs lg:text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
            <Plus size={14} />
            <span>Tambah Data</span>
          </button>
        </div>
      </div>

      {aiSummary && (
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-5 md:p-8 rounded-2xl md:rounded-[2rem] shadow-xl border border-indigo-800/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <h4 className="font-bold text-sm md:text-base lg:text-lg mb-3 md:mb-4 text-indigo-300 flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400 animate-pulse" /> Ringkasan Kecerdasan AI:
          </h4>
          <div className="prose prose-invert max-w-none text-[10px] md:text-xs lg:text-sm leading-relaxed whitespace-pre-wrap opacity-95">
            {aiSummary}
          </div>
        </div>
      )}

      {/* Layanan Warga Terpadu Grid from User Image */}
      <motion.div 
        variants={itemVariants}
        className="bg-white/95 backdrop-blur-md border border-slate-100/80 rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-slate-200/30"
      >
        <div className="mb-8">
          <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight">
            Layanan <span className="bg-gradient-to-r from-emerald-500 to-blue-600 bg-clip-text text-transparent italic">Warga Terpadu</span>
          </h3>
          <p className="text-slate-400 font-medium text-xs md:text-sm mt-1 max-w-xl">
            Semua urusan warga dan administrasi kini serba praktis dalam satu ketukan.
          </p>
        </div>

        {/* Grid layout matching Gojek/Grab/Citizen apps exactly: 4 columns */}
        <div className="grid grid-cols-4 gap-y-8 gap-x-2 md:gap-x-8 max-w-4xl">
          {[
            { 
              label: 'Profil Warga', 
              icon: User, 
              color: 'bg-[#5856d6]', 
              shadow: 'shadow-[#5856d6]/30', 
              tab: 'residents' 
            },
            { 
              label: 'Buat Surat', 
              icon: FileText, 
              color: 'bg-[#00a2e0]', 
              shadow: 'shadow-[#00a2e0]/30', 
              tab: 'services' 
            },
            { 
              label: 'Lapor Tamu', 
              icon: Shield, 
              color: 'bg-[#ff6200]', 
              shadow: 'shadow-[#ff6200]/30', 
              tab: 'guests', 
              badge: 'PENTING',
              badgeColor: 'bg-[#ff3b30]'
            },
            { 
              label: 'Daftar Warga', 
              icon: UserPlus, 
              color: 'bg-[#af52de]', 
              shadow: 'shadow-[#af52de]/30', 
              tab: 'residents' 
            },
            { 
              label: 'Pasar Warga', 
              icon: ShoppingCart, 
              color: 'bg-[#00c781]', 
              shadow: 'shadow-[#00c781]/30', 
              tab: 'content', 
              subTab: 'umkm',
              badge: 'UMKM',
              badgeColor: 'bg-[#e13f70]'
            },
            { 
              label: 'Warta RT', 
              icon: Megaphone, 
              color: 'bg-[#00b2cc]', 
              shadow: 'shadow-[#00b2cc]/30', 
              tab: 'content',
              subTab: 'announcements'
            },
            { 
              label: 'E-Voting', 
              icon: CheckSquare, 
              color: 'bg-[#5c72e6]', 
              shadow: 'shadow-[#5c72e6]/30', 
              tab: 'content', 
              subTab: 'polls',
              badge: 'PEMILU',
              badgeColor: 'bg-[#d946ef]'
            },
            { 
              label: 'Lapor RT', 
              icon: AlertTriangle, 
              color: 'bg-[#ff3b30]', 
              shadow: 'shadow-[#ff3b30]/30', 
              tab: 'services' 
            }
          ].map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={idx}
                whileHover={{ y: -4, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTabChange(action.tab, action.subTab)}
                className="flex flex-col items-center justify-start text-center group cursor-pointer focus:outline-none relative self-start"
              >
                {/* Beautiful Badges directly layered on top of squircles */}
                {action.badge && (
                  <span className={`absolute -top-1 md:-top-1.5 right-[5%] sm:right-[15%] md:right-[20%] z-20 text-[6px] md:text-[8px] font-black uppercase tracking-widest ${action.badgeColor || 'bg-rose-600'} text-white px-1.5 md:px-2 py-[1px] md:py-0.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)] animate-pulse select-none scale-95`}>
                    {action.badge}
                  </span>
                )}

                {/* Highly Polished Squircles with match drop-shadow */}
                <div className={`
                  w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] md:rounded-[1.75rem]
                  ${action.color} text-white
                  flex items-center justify-center
                  shadow-lg ${action.shadow} group-hover:scale-105
                  transition-all duration-300 relative overflow-hidden
                `}>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <Icon size={24} className="group-hover:scale-110 transition-transform duration-300" strokeWidth={2.4} />
                </div>

                <span className="font-extrabold text-slate-700 text-[11px] md:text-sm tracking-tight leading-snug mt-2.5 group-hover:text-indigo-600 transition-colors line-clamp-2 max-w-[85px] md:max-w-none">
                  {action.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-6">
        {/* Warga Card */}
        <motion.div variants={itemVariants} className="bg-white p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all group relative overflow-hidden cursor-pointer" onClick={() => onTabChange('residents')}>
          <div className="absolute -right-4 -top-4 w-24 md:w-32 h-24 md:h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="p-3 md:p-3.5 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                <Users size={20} className="md:w-6 md:h-6" />
              </div>
              <span className="hidden xs:block text-[9px] md:text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Demografi</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1 md:gap-2">
                <h3 className="text-2xl md:text-4xl font-black text-slate-900">{totalResidents}</h3>
                <span className="text-[10px] md:text-xs font-extrabold text-slate-400 uppercase">Jiwa</span>
              </div>
              <div className="flex items-baseline gap-1 md:gap-2">
                <h3 className="text-lg md:text-xl font-extrabold text-indigo-600">{occupiedHouses}</h3>
                <span className="text-[10px] md:text-xs font-bold text-slate-400">KK Terdaftar</span>
              </div>
            </div>
            <div className="mt-3 md:mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500">
              <span className="text-emerald-600 font-extrabold flex items-center gap-1"><CheckCircle2 size={12} /> Terverifikasi</span>
              <ArrowRight size={14} className="text-slate-300 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all" />
            </div>
          </div>
        </motion.div>

        {/* Keuangan Card */}
        <motion.div variants={itemVariants} className="bg-white p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-200 transition-all group relative overflow-hidden cursor-pointer" onClick={() => onTabChange('finance')}>
          <div className="absolute -right-4 -top-4 w-24 md:w-32 h-24 md:h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="p-3 md:p-3.5 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                <DollarSign size={20} className="md:w-6 md:h-6" />
              </div>
              <span className="hidden xs:block text-[9px] md:text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Saldo Kas</span>
            </div>
            <div className="flex items-baseline gap-1 md:gap-2">
              <h3 className="text-2xl md:text-4xl font-black text-slate-900">Rp{(balance / 1000000).toFixed(1)}jt</h3>
            </div>
            <div className="mt-3 md:mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
              <span className="text-emerald-600 font-extrabold flex items-center gap-0.5"><TrendingUp size={12} /> +{(income / 1000000).toFixed(1)}jt</span>
              <span className="text-rose-500 font-bold flex items-center gap-0.5"><TrendingDown size={12} /> -{(expense / 1000000).toFixed(1)}jt</span>
            </div>
          </div>
        </motion.div>

        {/* Laporan Card */}
        <motion.div variants={itemVariants} className="bg-white p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-rose-500/10 hover:border-rose-200 transition-all group relative overflow-hidden cursor-pointer" onClick={() => onTabChange('services')}>
          <div className="absolute -right-4 -top-4 w-24 md:w-32 h-24 md:h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="p-3 md:p-3.5 bg-rose-50 text-rose-600 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                <AlertTriangle size={20} className="md:w-6 md:h-6" />
              </div>
              <span className="hidden xs:block text-[9px] md:text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Aduan Warga</span>
            </div>
            <div className="flex items-baseline gap-1 md:gap-2">
              <h3 className="text-2xl md:text-4xl font-black text-slate-900">{newReports}</h3>
              <span className="text-[10px] md:text-xs font-extrabold text-rose-600 uppercase">Perlu Tindakan</span>
            </div>
            <div className="mt-3 md:mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-rose-500">
              <span className="flex items-center gap-1"><Activity size={12} className="animate-pulse" /> Tindak Lanjut</span>
              <ArrowRight size={14} className="text-slate-300 group-hover:translate-x-1 group-hover:text-rose-600 transition-all" />
            </div>
          </div>
        </motion.div>

        {/* Tamu Card */}
        <motion.div variants={itemVariants} className="bg-white p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 hover:border-amber-200 transition-all group relative overflow-hidden cursor-pointer" onClick={() => onTabChange('guests')}>
          <div className="absolute -right-4 -top-4 w-24 md:w-32 h-24 md:h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="p-3 md:p-3.5 bg-amber-50 text-amber-600 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                <ShieldAlert size={20} className="md:w-6 md:h-6" />
              </div>
              <span className="hidden xs:block text-[9px] md:text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Log Tamu</span>
            </div>
            <div className="flex items-baseline gap-1 md:gap-2">
              <h3 className="text-2xl md:text-4xl font-black text-slate-900">{activeGuests}</h3>
              <span className="text-[10px] md:text-xs font-extrabold text-amber-600 uppercase">Tamu Aktif</span>
            </div>
            <div className="mt-3 md:mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-amber-600">
              <span className="flex items-center gap-1"><Clock size={12} /> Wajib 1x24 Jam</span>
              <ArrowRight size={14} className="text-slate-300 group-hover:translate-x-1 group-hover:text-amber-600 transition-all" />
            </div>
          </div>
        </motion.div>

        {/* Retribusi Sampah Card */}
        <motion.div variants={itemVariants} className="bg-white p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-sky-500/10 hover:border-sky-200 transition-all group relative overflow-hidden cursor-pointer" onClick={() => onTabChange('finance')}>
          <div className="absolute -right-4 -top-4 w-24 md:w-32 h-24 md:h-32 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="p-3 md:p-3.5 bg-sky-50 text-sky-600 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                <Trash2 size={20} className="md:w-6 md:h-6" />
              </div>
              <span className="hidden xs:block text-[9px] md:text-[10px] font-black text-sky-700 bg-sky-50 border border-sky-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Iuran Retribusi</span>
            </div>
            <div className="flex items-baseline gap-1 md:gap-2">
              <h3 className="text-2xl md:text-4xl font-black text-slate-900">{wastePaymentPercentage}%</h3>
              <span className="text-[10px] md:text-xs font-extrabold text-sky-600 uppercase">Tercapai</span>
            </div>
            <div className="mt-3 md:mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-sky-600">
              <span>{paidWasteCount} dari {totalOccupiedHouses} Rumah</span>
              <ArrowRight size={14} className="text-slate-300 group-hover:translate-x-1 group-hover:text-sky-600 transition-all" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Chart Section */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base md:text-xl font-black text-slate-900 tracking-tight">Arus Kas RT</h3>
                <p className="text-slate-400 text-xs font-semibold mt-0.5">Tren arus transaksi masuk & keluar minggu ini</p>
              </div>
              <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl uppercase tracking-wider">Aktual Data</span>
            </div>
            <div className="h-[200px] sm:h-[250px] md:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCashDoc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 700}} tickFormatter={(v) => `Rp${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.08)' }}
                    labelStyle={{ fontWeight: 800, color: '#0f172a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={3} fill="url(#colorCashDoc)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-200/80 shadow-sm">
              <h3 className="text-base md:text-xl font-black text-slate-900 tracking-tight mb-4">Demografi Terdata</h3>
              <div className="h-[180px] sm:h-[200px] md:h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demographicData}>
                    <defs>
                      <linearGradient id="colorDemographic" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#818cf8" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontWeight: 700}} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="value" fill="url(#colorDemographic)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-200/80 shadow-sm">
              <h3 className="text-base md:text-xl font-black text-slate-900 tracking-tight mb-4">Status Layanan Warga</h3>
              <div className="h-[180px] sm:h-[200px] md:h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportStatusData}>
                    <defs>
                      <linearGradient id="colorReportStatus" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e11d48" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#fb7185" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontWeight: 700}} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="value" fill="url(#colorReportStatus)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Side Panel: Quick Actions & Activity */}
        <div className="space-y-6 md:space-y-8">
          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base md:text-lg font-black text-slate-900">Aksi Pintar Admin</h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Pintasan</span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4 relative z-10">
              <button onClick={() => onTabChange('services')} className="flex flex-col items-center gap-2.5 p-4 bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-200 rounded-2xl transition-all group cursor-pointer text-center">
                <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                  <FileText size={20} />
                </div>
                <span className="text-[11px] font-black text-slate-700 group-hover:text-indigo-700">Buat Surat</span>
              </button>
              <button onClick={() => onTabChange('finance')} className="flex flex-col items-center gap-2.5 p-4 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-200 rounded-2xl transition-all group cursor-pointer text-center">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                  <DollarSign size={20} />
                </div>
                <span className="text-[11px] font-black text-slate-700 group-hover:text-emerald-700">Input Kas</span>
              </button>
              <button onClick={() => onTabChange('content')} className="flex flex-col items-center gap-2.5 p-4 bg-slate-50 hover:bg-amber-50/70 border border-slate-200/80 hover:border-amber-200 rounded-2xl transition-all group cursor-pointer text-center">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                  <Megaphone size={20} />
                </div>
                <span className="text-[11px] font-black text-slate-700 group-hover:text-amber-700">Broadcast Info</span>
              </button>
              <button onClick={() => onTabChange('residents')} className="flex flex-col items-center gap-2.5 p-4 bg-slate-50 hover:bg-rose-50/70 border border-slate-200/80 hover:border-rose-200 rounded-2xl transition-all group cursor-pointer text-center">
                <div className="p-3 bg-rose-100 text-rose-700 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                  <Users size={20} />
                </div>
                <span className="text-[11px] font-black text-slate-700 group-hover:text-rose-700">Warga Baru</span>
              </button>
            </div>
          </motion.div>

          {/* Recent Activity Feed */}
          <motion.div variants={itemVariants} className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-900 tracking-tight text-xs md:text-base">Aktivitas Terbaru</h3>
              <button className="text-[8px] md:text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Semua</button>
            </div>
            <div className="space-y-4 md:space-y-6">
              {recentActivity.map((activity, i) => (
                <div key={`${activity.type}-${activity.time.getTime()}-${i}`} className="flex gap-3 md:gap-4 group cursor-pointer">
                  <div className={`shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-${activity.color}-50 text-${activity.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <activity.icon size={14} className="md:w-[18px] md:h-[18px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[10px] md:text-sm font-bold text-slate-800 truncate">{activity.title}</p>
                      <span className="text-[7px] md:text-[9px] font-bold text-slate-400 uppercase">{formatTimeAgo(activity.time)}</span>
                    </div>
                    <p className="text-[9px] md:text-xs text-slate-500 line-clamp-1">{activity.desc}</p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-[9px] md:text-xs text-slate-400 text-center py-4">Belum ada aktivitas terbaru.</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
