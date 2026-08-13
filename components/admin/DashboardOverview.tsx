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
  residentRegistrations?: any[];
  letters?: any[];
  updateRequests?: any[];
  onTabChange: (tab: string, subTab?: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ 
  houses, cashFlow, reports, announcements, guestReports, iuranPayments, 
  residentRegistrations = [], letters = [], updateRequests = [],
  onTabChange 
}) => {
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

  // 360-Degree Real-Time Executive Live Timeline Aggregator
  const recentActivity = [
    ...reports.map(r => ({
      type: 'report',
      category: 'aduan',
      title: `Aduan Warga: ${r.type}`,
      desc: r.description || `Laporan status: ${r.status}`,
      time: new Date(r.date),
      icon: MessageSquare,
      color: r.status === 'Baru' ? 'rose' : r.status === 'Diproses' ? 'amber' : 'emerald'
    })),
    ...cashFlow.map(c => ({
      type: 'cash',
      category: 'keuangan',
      title: c.type === 'Income' ? 'Kas Masuk' : 'Kas Keluar',
      desc: `${c.description} (Rp${c.amount.toLocaleString('id-ID')})`,
      time: new Date(c.date),
      icon: c.type === 'Income' ? TrendingUp : TrendingDown,
      color: c.type === 'Income' ? 'emerald' : 'rose'
    })),
    ...announcements.map(a => ({
      type: 'announcement',
      category: 'info',
      title: 'Warta Pengumuman RT',
      desc: a.title,
      time: new Date(a.date),
      icon: Megaphone,
      color: 'amber'
    })),
    ...residentRegistrations.map(reg => ({
      type: 'registration',
      category: 'warga',
      title: 'Registrasi Warga Baru',
      desc: `${reg.fullName || 'Calon Warga'} - No. Rumah ${reg.houseNumber || '-'}`,
      time: new Date(reg.createdAt || Date.now()),
      icon: UserPlus,
      color: 'indigo'
    })),
    ...letters.map(l => ({
      type: 'letter',
      category: 'surat',
      title: `Pengajuan Surat: ${l.letterType || 'Pengantar'}`,
      desc: `Pemohon: ${l.residentName || 'Warga'} (${l.status})`,
      time: new Date(l.date || Date.now()),
      icon: FileText,
      color: 'violet'
    })),
    ...guestReports.map(g => ({
      type: 'guest',
      category: 'tamu',
      title: 'Laporan Tamu Menginap',
      desc: `Tamu: ${g.guestName || 'Tamu'} di Rumah ${g.hostHouseNumber || '-'}`,
      time: new Date(g.createdAt || Date.now()),
      icon: ShieldAlert,
      color: 'amber'
    }))
  ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 4);

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
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Executive Hero Banner */}
      <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-[2.5rem] p-6 md:p-10 text-white shadow-xl border border-indigo-700/30">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md">
                Pusat Kendali Executive
              </span>
              <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Sistem Aktif
              </span>
            </div>

            {(() => {
              const hr = new Date().getHours();
              let greet = 'Selamat Hari';
              if (hr >= 5 && hr < 11) greet = 'Selamat Pagi';
              else if (hr >= 11 && hr < 15) greet = 'Selamat Siang';
              else if (hr >= 15 && hr < 19) greet = 'Selamat Sore';
              else if (hr >= 19 || hr < 5) greet = 'Selamat Malam';
              
              return (
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                  <span>{greet}, Pengurus {RT_NAME}!</span>
                  <span className="inline-block animate-bounce-slow origin-bottom">👋</span>
                </h2>
              );
            })()}

            <p className="text-indigo-200/90 font-medium text-xs md:text-sm leading-relaxed">
              Semua sistem administrasi warga, keuangan kas, hingga pemantauan keamanan berjalan dengan optimal secara terpadu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button 
              onClick={handleGenerateSummary} 
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs py-3 px-5 rounded-2xl shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all flex items-center gap-2"
            >
              <Sparkles size={16} className="text-amber-300 animate-spin-slow" /> 
              <span>{isAiLoading ? 'Memproses AI...' : 'Ringkasan AI'}</span>
            </Button>
            
            <button 
              onClick={handleExportData} 
              className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 rounded-2xl text-xs font-bold text-white transition-all shadow-sm"
            >
              <Download size={15} />
              <span>Ekspor JSON</span>
            </button>
            
            <button 
              onClick={() => onTabChange('residents')} 
              className="flex items-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl text-xs font-black transition-all shadow-lg shadow-emerald-500/30 border border-emerald-400/30"
            >
              <Plus size={15} />
              <span>Tambah Warga</span>
            </button>
          </div>
        </div>
      </motion.div>

      {aiSummary && (
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-xl border border-indigo-800/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <h4 className="font-bold text-sm md:text-base lg:text-lg mb-3 md:mb-4 text-indigo-300 flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400 animate-pulse" /> Ringkasan Kecerdasan AI:
          </h4>
          <div className="prose prose-invert max-w-none text-[10px] md:text-xs lg:text-sm leading-relaxed whitespace-pre-wrap opacity-95">
            {aiSummary}
          </div>
        </div>
      )}

      {/* Layanan Warga Terpadu Grid */}
      <motion.div 
        variants={itemVariants}
        className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 md:p-10 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Layanan <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent italic">Warga Terpadu</span>
            </h3>
            <p className="text-slate-500 font-medium text-xs md:text-sm mt-1 max-w-xl">
              Pusat kendali akses langsung untuk semua modul operasional administrasi RT.
            </p>
          </div>
          <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full uppercase tracking-wider self-start sm:self-auto">
            ⚡ Akses Cepat Admin
          </span>
        </div>

        {/* Grid layout matching Gojek/Grab/Citizen apps exactly: 4 columns */}
        <div className="grid grid-cols-4 gap-y-8 gap-x-2 md:gap-x-8 max-w-4xl">
          {[
            { 
              label: 'Profil Warga', 
              icon: User, 
              color: 'bg-[#5856d6]', 
              shadow: 'shadow-[#5856d6]/30', 
              tab: 'residents',
              count: totalResidents
            },
            { 
              label: 'Buat Surat', 
              icon: FileText, 
              color: 'bg-[#00a2e0]', 
              shadow: 'shadow-[#00a2e0]/30', 
              tab: 'services',
              badge: letters.filter(l => l.status === 'Pending' || l.status === 'Baru').length > 0 ? `${letters.filter(l => l.status === 'Pending' || l.status === 'Baru').length} PENDING` : undefined,
              badgeColor: 'bg-[#00a2e0]'
            },
            { 
              label: 'Lapor Tamu', 
              icon: Shield, 
              color: 'bg-[#ff6200]', 
              shadow: 'shadow-[#ff6200]/30', 
              tab: 'guests', 
              badge: activeGuests > 0 ? `${activeGuests} AKTIF` : undefined,
              badgeColor: 'bg-[#ff6200]'
            },
            { 
              label: 'Daftar Warga', 
              icon: UserPlus, 
              color: 'bg-[#af52de]', 
              shadow: 'shadow-[#af52de]/30', 
              tab: 'residents',
              badge: residentRegistrations.filter(r => r.approvalStatus === 'Pending').length > 0 ? `${residentRegistrations.filter(r => r.approvalStatus === 'Pending').length} BARU` : undefined,
              badgeColor: 'bg-[#af52de]'
            },
            { 
              label: 'Pasar Warga', 
              icon: ShoppingCart, 
              color: 'bg-[#00c781]', 
              shadow: 'shadow-[#00c781]/30', 
              tab: 'content', 
              subTab: 'umkm',
              badge: 'UMKM',
              badgeColor: 'bg-[#00c781]'
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
              badgeColor: 'bg-[#5c72e6]'
            },
            { 
              label: 'Lapor RT', 
              icon: AlertTriangle, 
              color: 'bg-[#ff3b30]', 
              shadow: 'shadow-[#ff3b30]/30', 
              tab: 'services',
              badge: newReports > 0 ? `${newReports} ADUAN` : undefined,
              badgeColor: 'bg-[#ff3b30]'
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
                  <span className={`absolute -top-1 md:-top-1.5 right-[5%] sm:right-[10%] z-20 text-[7px] md:text-[8px] font-black uppercase tracking-widest ${action.badgeColor || 'bg-rose-600'} text-white px-2 py-0.5 rounded-full shadow-md animate-pulse select-none scale-95 border border-white/20`}>
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

                <span className="font-extrabold text-slate-800 text-[11px] md:text-sm tracking-tight leading-snug mt-2.5 group-hover:text-indigo-600 transition-colors line-clamp-2 max-w-[85px] md:max-w-none">
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
            {/* 1. Demografi Terdata -> Peta Kelompok Rentan & Sasaran Posyandu */}
            <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base md:text-lg font-black text-slate-900 tracking-tight">Kesehatan & Demografi</h3>
                    <p className="text-slate-400 text-xs font-semibold mt-0.5">Kelompok warga prioritas posyandu</p>
                  </div>
                  <button 
                    onClick={() => onTabChange('health')}
                    className="text-[10px] font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2.5 py-1 rounded-xl uppercase tracking-wider transition-colors"
                  >
                    Detail
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 my-4">
                  <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-2xl text-center">
                    <p className="text-[10px] font-extrabold text-indigo-600 uppercase">Ibu Hamil</p>
                    <p className="text-xl md:text-2xl font-black text-indigo-900 mt-0.5">
                      {houses.reduce((acc, h) => acc + (h.pregnantCount || 0), 0)}
                    </p>
                  </div>
                  <div className="bg-purple-50/70 border border-purple-100 p-3 rounded-2xl text-center">
                    <p className="text-[10px] font-extrabold text-purple-600 uppercase">Balita</p>
                    <p className="text-xl md:text-2xl font-black text-purple-900 mt-0.5">
                      {houses.reduce((acc, h) => acc + (h.babyCount || 0) + (h.toddlerCount || 0), 0)}
                    </p>
                  </div>
                  <div className="bg-teal-50/70 border border-teal-100 p-3 rounded-2xl text-center">
                    <p className="text-[10px] font-extrabold text-teal-600 uppercase">Lansia</p>
                    <p className="text-xl md:text-2xl font-black text-teal-900 mt-0.5">
                      {houses.reduce((acc, h) => acc + (h.elderlyCount || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-[140px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demographicData}>
                    <defs>
                      <linearGradient id="colorDemographic" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#818cf8" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontWeight: 700}} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="value" fill="url(#colorDemographic)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Status Layanan Warga -> KPI Resolution Rate */}
            <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base md:text-lg font-black text-slate-900 tracking-tight">Tingkat Penanganan Aduan</h3>
                    <p className="text-slate-400 text-xs font-semibold mt-0.5">KPI kecepatan respons keluhan warga</p>
                  </div>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-xl uppercase tracking-wider">
                    {reports.length > 0 ? `${Math.round((reports.filter(r => r.status === 'Selesai').length / reports.length) * 100)}% Selesai` : '100% Selesai'}
                  </span>
                </div>

                <div className="space-y-3 my-4">
                  <div className="flex items-center justify-between p-2.5 bg-rose-50/60 border border-rose-100 rounded-xl text-xs font-extrabold">
                    <span className="text-rose-900 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span> Laporan Baru</span>
                    <span className="text-rose-700 bg-white px-2.5 py-1 rounded-lg shadow-sm border border-rose-100">{reports.filter(r => r.status === 'Baru').length} Laporan</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-amber-50/60 border border-amber-100 rounded-xl text-xs font-extrabold">
                    <span className="text-amber-900 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Dalam Penanganan</span>
                    <span className="text-amber-700 bg-white px-2.5 py-1 rounded-lg shadow-sm border border-amber-100">{reports.filter(r => r.status === 'Diproses').length} Laporan</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs font-extrabold">
                    <span className="text-emerald-900 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Tuntas Terselesaikan</span>
                    <span className="text-emerald-700 bg-white px-2.5 py-1 rounded-lg shadow-sm border border-emerald-100">{reports.filter(r => r.status === 'Selesai').length} Laporan</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-extrabold text-slate-500">
                <span>Total Laporan Masuk: <strong className="text-slate-800">{reports.length}</strong></span>
                <button onClick={() => onTabChange('services')} className="text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 font-black">
                  Tindak Lanjut <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Side Panel: Pending Approvals Hub & Executive Live Timeline */}
        <div className="space-y-6 md:space-y-8">
          {/* Pending Approvals Hub */}
          <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base md:text-lg font-black text-slate-900">Persetujuan Tertunda</h3>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Tindak lanjut registrasi & pengaduan</p>
              </div>
              <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl uppercase tracking-wider">
                {residentRegistrations.filter(r => r.approvalStatus === 'Pending').length + 
                 letters.filter(l => l.status === 'Pending' || l.status === 'Baru').length + 
                 guestReports.filter(g => g.status === 'Active' || (g.status as any) === 'Pending').length} Butuh Aksi
              </span>
            </div>

            <div className="space-y-3 relative z-10">
              {/* Item 1: Registrasi Warga Baru */}
              {(() => {
                const pendingReg = residentRegistrations.filter(r => r.approvalStatus === 'Pending').length;
                return (
                  <div 
                    onClick={() => onTabChange('residents')}
                    className="p-4 bg-slate-50 hover:bg-indigo-50/80 border border-slate-200/80 hover:border-indigo-200 rounded-2xl transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                        <UserPlus size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 group-hover:text-indigo-700">Registrasi Warga Baru</h4>
                        <p className="text-[10px] font-semibold text-slate-400">Verifikasi berkas calon warga</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${pendingReg > 0 ? 'bg-indigo-600 text-white border-indigo-600 animate-pulse' : 'bg-slate-200/70 text-slate-500 border-slate-300'}`}>
                      {pendingReg}
                    </span>
                  </div>
                );
              })()}

              {/* Item 2: Pengajuan Surat Pengantar */}
              {(() => {
                const pendingLetters = letters.filter(l => l.status === 'Pending' || l.status === 'Baru').length;
                return (
                  <div 
                    onClick={() => onTabChange('services')}
                    className="p-4 bg-slate-50 hover:bg-violet-50/80 border border-slate-200/80 hover:border-violet-200 rounded-2xl transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 bg-violet-100 text-violet-700 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                        <FileText size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 group-hover:text-violet-700">Pengajuan Surat Pengantar</h4>
                        <p className="text-[10px] font-semibold text-slate-400">Tanda tangan & nomor surat RT</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${pendingLetters > 0 ? 'bg-violet-600 text-white border-violet-600 animate-pulse' : 'bg-slate-200/70 text-slate-500 border-slate-300'}`}>
                      {pendingLetters}
                    </span>
                  </div>
                );
              })()}

              {/* Item 3: Wajib Lapor Tamu 24 Jam */}
              {(() => {
                const pendingGuests = guestReports.filter(g => g.status === 'Active' || (g.status as any) === 'Pending').length;
                return (
                  <div 
                    onClick={() => onTabChange('guests')}
                    className="p-4 bg-slate-50 hover:bg-amber-50/80 border border-slate-200/80 hover:border-amber-200 rounded-2xl transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                        <ShieldAlert size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 group-hover:text-amber-700">Laporan Tamu Menginap</h4>
                        <p className="text-[10px] font-semibold text-slate-400">Verifikasi identitas tamu warga</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${pendingGuests > 0 ? 'bg-amber-600 text-white border-amber-600 animate-pulse' : 'bg-slate-200/70 text-slate-500 border-slate-300'}`}>
                      {pendingGuests}
                    </span>
                  </div>
                );
              })()}
            </div>
          </motion.div>

          {/* 3. Recent Activity Feed -> Executive Live Timeline Hub */}
          <motion.div variants={itemVariants} className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-black text-slate-900 tracking-tight text-sm md:text-base">Live Activity Timeline</h3>
                <p className="text-slate-400 text-[11px] font-semibold mt-0.5">Jejak aktivitas transaksi & sistem</p>
              </div>
              <button 
                onClick={() => onTabChange('audit')} 
                className="text-[10px] font-black text-indigo-600 uppercase tracking-wider hover:underline"
              >
                Lihat Log
              </button>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity, i) => {
                const IconComponent = activity.icon;
                return (
                  <div key={`${activity.type}-${activity.time.getTime()}-${i}`} className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 rounded-2xl transition-all group cursor-pointer">
                    <div className={`p-2.5 rounded-xl text-white shrink-0 shadow-sm ${
                      activity.color === 'emerald' ? 'bg-emerald-500' :
                      activity.color === 'rose' ? 'bg-rose-500' :
                      activity.color === 'violet' ? 'bg-violet-500' :
                      activity.color === 'amber' ? 'bg-amber-500' : 'bg-indigo-500'
                    }`}>
                      <IconComponent size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-xs font-black text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{activity.title}</p>
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-tight ml-2 shrink-0">{formatTimeAgo(activity.time)}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-500 truncate">{activity.desc}</p>
                    </div>
                  </div>
                );
              })}
              {recentActivity.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4 font-semibold">Belum ada jejak aktivitas terbaru.</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
