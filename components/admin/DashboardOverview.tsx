import React, { useState, useEffect } from 'react';
import { 
  Users, DollarSign, AlertTriangle, TrendingUp, TrendingDown, 
  Activity, Calendar, ArrowRight, Plus, Download, FileText,
  Clock, CheckCircle2, MessageSquare, User, Megaphone, Sparkles, Trash2,
  Shield, Package, Bell, LayoutGrid, UserPlus, ShoppingCart, CheckSquare,
  ShieldCheck, Sun, Wind, Droplets, Compass, Waves, Recycle, Share2, Check,
  CreditCard, ChevronDown, ChevronUp
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { House, CashFlow, Report, Announcement, PaymentStatus, GuestReport, STBMRecord } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { generateDashboardSummary } from '../../services/geminiService';
import { safeJsonStringify, subscribeToSTBMRecords } from '../../services/databaseService';
import { useWeather } from '../../hooks/useWeather';
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
  const [showAllServices, setShowAllServices] = useState(false);
  const [stbmRecords, setStbmRecords] = useState<STBMRecord[]>([]);
  const { weather } = useWeather();

  useEffect(() => {
    const unsub = subscribeToSTBMRecords(setStbmRecords);
    return () => unsub();
  }, []);

  const stbmIssuesCount = stbmRecords.filter(r => r.needsFollowUp || r.isBABS || !r.hasHealthyLatrine).length;

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
      widowCount: houses.reduce((acc, h) => acc + (h.widowCount || 0), 0),
      stbmStatus: `100% ODF (${stbmRecords.length || houses.length} KK Terdata, ${stbmIssuesCount} butuh tindak lanjut)`,
      weatherStatus: weather ? `${weather.condition}, ${weather.temp}°C, ISPU ${weather.aqi} (${weather.aqiLabel})` : 'Normal'
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
      {/* Executive Modern Command Center Hero Banner matching reference design */}
      <motion.div 
        variants={itemVariants} 
        className="relative overflow-hidden bg-white rounded-3xl md:rounded-[2.5rem] p-5 sm:p-7 md:p-8 shadow-sm border border-slate-100"
      >
        {/* Soft Organic Curved Violet Wave on Right Side */}
        <div className="absolute right-0 top-0 bottom-0 w-2/5 sm:w-1/2 pointer-events-none overflow-hidden select-none">
          <svg className="absolute right-0 top-0 h-full w-full" viewBox="0 0 300 400" preserveAspectRatio="none" fill="none">
            <path d="M120,0 C180,80 200,160 130,260 C80,340 160,380 300,400 L300,0 Z" fill="#6366f1" fillOpacity="0.14" />
            <path d="M180,0 C230,70 240,150 180,240 C130,330 200,370 300,400 L300,0 Z" fill="#818cf8" fillOpacity="0.1" />
          </svg>
        </div>
        
        <div className="relative z-10 flex flex-col justify-between">
          <div className="space-y-3 max-w-2xl">
            {/* Top Stacked Badges */}
            <div className="flex flex-col items-start gap-1.5">
              <span className="bg-[#4f46e5] text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-xs">
                Pusat Kendali Eksekutif
              </span>
              <span className="bg-[#dcfce7] text-[#15803d] text-[10px] font-extrabold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Operasional 100% Aktif
              </span>
            </div>

            {/* Personalized Time-Aware Greeting with Waving Hand */}
            {(() => {
              const hr = new Date().getHours();
              let greet = 'Selamat Hari';
              if (hr >= 5 && hr < 11) greet = 'Selamat Pagi';
              else if (hr >= 11 && hr < 15) greet = 'Selamat Siang';
              else if (hr >= 15 && hr < 19) greet = 'Selamat Sore';
              else if (hr >= 19 || hr < 5) greet = 'Selamat Malam';
              
              return (
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
                      <span className="block text-slate-900">{greet},</span>
                      <span className="block text-[#4f46e5]">Pengurus {RT_NAME}!</span>
                    </h2>
                  </div>
                  
                  {/* Waving Hand Graphic with Vibration Waves matching reference */}
                  <div className="relative shrink-0 select-none pointer-events-none mt-1 mr-1 sm:mr-3">
                    <svg className="absolute -left-3 top-2 w-4 h-7 text-[#4f46e5]" viewBox="0 0 16 28" fill="none">
                      <path d="M12 4 C6 9 6 19 12 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M7 8 C3 11 3 17 7 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className="text-5xl sm:text-6xl inline-block transform rotate-[-6deg] filter drop-shadow-xs">
                      👋
                    </span>
                    <svg className="absolute -right-2 top-0 w-4 h-7 text-[#4f46e5]" viewBox="0 0 16 28" fill="none">
                      <path d="M4 4 C10 9 10 19 4 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              );
            })()}

            <p className="text-slate-500 font-medium text-xs sm:text-sm leading-relaxed max-w-xl">
              Pusat orkestrasi administrasi kependudukan, tata kelola kas terdesentralisasi, evaluasi sanitasi 5 pilar STBM, serta pengawasan keamanan lingkungan warga.
            </p>

            {/* Action CTA Buttons */}
            <div className="pt-2 space-y-2.5">
              <button 
                onClick={handleGenerateSummary} 
                disabled={isAiLoading}
                className="w-full py-3.5 px-5 bg-gradient-to-r from-[#6366f1] via-[#5452f6] to-[#7c3aed] hover:from-[#4f46e5] hover:to-[#6d28d9] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md shadow-indigo-500/25 relative flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
              >
                <Sparkles size={16} className="text-white shrink-0 animate-spin-slow" /> 
                <span className="tracking-normal font-bold">
                  {isAiLoading ? 'Menganalisis Data...' : 'Ringkasan AI Eksekutif'}
                </span>
                <ArrowRight size={15} className="absolute right-4 sm:right-5 text-white shrink-0" />
              </button>
              
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <button 
                  onClick={handleExportData} 
                  className="flex items-center justify-center gap-2 py-3 px-3 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-bold text-slate-800 transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
                >
                  <Download size={14} className="text-slate-600" />
                  <span>Ekspor Ringkasan</span>
                </button>
                
                <button 
                  onClick={() => onTabChange('residents')} 
                  className="flex items-center justify-center gap-2 py-3 px-3 bg-[#dcfce7] hover:bg-[#cbfada] border border-emerald-200/80 text-[#15803d] rounded-2xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
                >
                  <Plus size={15} className="text-[#15803d] stroke-[2.5px]" />
                  <span>Tambah Warga</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Titanium AI Strategic Advisor Card */}
      {aiSummary && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-2xl shadow-indigo-950/40 border border-indigo-500/30 relative overflow-hidden font-sans"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex items-center justify-between gap-4 mb-4 border-b border-indigo-900/60 pb-3">
            <h4 className="font-black text-sm md:text-base lg:text-lg text-indigo-200 flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-amber-300">
                <Sparkles size={18} className="animate-pulse" />
              </div>
              <span>Intelligence Advisor (Gemini AI RT02)</span>
            </h4>
            <button
              onClick={() => {
                navigator.clipboard.writeText(aiSummary);
                toast.success('Ringkasan AI berhasil disalin ke clipboard!');
              }}
              className="text-[11px] font-bold text-indigo-300 hover:text-white bg-indigo-900/50 hover:bg-indigo-800/80 border border-indigo-500/30 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Share2 size={13} />
              <span>Salin Ringkasan</span>
            </button>
          </div>
          <div className="prose prose-invert max-w-none text-xs md:text-sm leading-relaxed whitespace-pre-wrap opacity-90 text-indigo-100/90 font-medium">
            {aiSummary}
          </div>
        </motion.div>
      )}

      {/* Layanan Warga Terpadu Modern Pastel Section matching reference */}
      <motion.div variants={itemVariants} className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Layanan <span className="text-[#4f46e5]">Warga Terpadu</span>
          </h3>
          
          <button
            onClick={() => setShowAllServices(!showAllServices)}
            className="flex items-center gap-1 text-xs font-bold text-[#4f46e5] hover:text-indigo-700 transition-colors cursor-pointer"
          >
            <span>Lihat Semua</span>
            <ArrowRight size={13} className={`transition-transform duration-200 ${showAllServices ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {/* 4 Primary Pastel Feature Cards in a 4-Column Grid matching reference */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3.5">
          {/* Card 1: Data Warga (Lavender) */}
          <motion.div
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onTabChange('residents')}
            className="bg-[#f0f2fe] hover:bg-[#e4e7fd] border border-indigo-100/70 rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center gap-2 transition-all shadow-2xs cursor-pointer group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white flex items-center justify-center text-[#4f46e5] shadow-2xs group-hover:scale-105 transition-transform shrink-0">
              <Users size={19} className="stroke-[2.2px]" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-700 leading-tight">
              Data<br />Warga
            </span>
          </motion.div>

          {/* Card 2: Kas & Iuran (Mint) */}
          <motion.div
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onTabChange('finance')}
            className="bg-[#e8faf0] hover:bg-[#d5f6e3] border border-emerald-100/70 rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center gap-2 transition-all shadow-2xs cursor-pointer group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white flex items-center justify-center text-[#059669] shadow-2xs group-hover:scale-105 transition-transform shrink-0">
              <CreditCard size={19} className="stroke-[2.2px]" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-700 leading-tight">
              Kas &<br />Iuran
            </span>
          </motion.div>

          {/* Card 3: Surat Pengantar (Peach) */}
          <motion.div
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onTabChange('services')}
            className="bg-[#fff4eb] hover:bg-[#ffe6d4] border border-amber-100/70 rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center gap-2 transition-all shadow-2xs cursor-pointer group relative"
          >
            {letters.filter(l => l.status === 'Pending' || l.status === 'Baru').length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white flex items-center justify-center text-[#ea580c] shadow-2xs group-hover:scale-105 transition-transform shrink-0">
              <FileText size={19} className="stroke-[2.2px]" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-700 leading-tight">
              Surat<br />Pengantar
            </span>
          </motion.div>

          {/* Card 4: Keamanan Lingkungan (Sky Blue) */}
          <motion.div
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onTabChange('reports-warga')}
            className="bg-[#edf7ff] hover:bg-[#dbeffe] border border-sky-100/70 rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center gap-2 transition-all shadow-2xs cursor-pointer group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white flex items-center justify-center text-[#0284c7] shadow-2xs group-hover:scale-105 transition-transform shrink-0">
              <Shield size={19} className="stroke-[2.2px]" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-700 leading-tight">
              Keamanan<br />Lingkungan
            </span>
          </motion.div>
        </div>

        {/* Expandable Secondary Services Accordion */}
        <AnimatePresence>
          {showAllServices && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden pt-4 mt-2 bg-white rounded-2xl p-4 border border-slate-100 shadow-xs"
            >
              <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3">
                Modul Operasional Tambahan
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {[
                  { label: '5 Pilar STBM', icon: CheckSquare, tab: 'stbm', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', badge: stbmIssuesCount > 0 ? `${stbmIssuesCount} TL` : 'ODF' },
                  { label: 'Pasar UMKM', icon: ShoppingCart, tab: 'content', subTab: 'umkm', color: 'bg-lime-50 text-lime-700 border-lime-100', badge: 'UMKM' },
                  { label: 'Warta RT', icon: Megaphone, tab: 'content', subTab: 'announcements', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                  { label: 'Lapor RT', icon: AlertTriangle, tab: 'reports-warga', color: 'bg-rose-50 text-rose-700 border-rose-100', badge: newReports > 0 ? `${newReports} Baru` : undefined },
                  { label: 'Agenda Warga', icon: Calendar, tab: 'activities', color: 'bg-amber-50 text-amber-700 border-amber-100' },
                  { label: 'Aset & Logistik', icon: Package, tab: 'assets', color: 'bg-purple-50 text-purple-700 border-purple-100' },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ y: -2, scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => onTabChange(item.tab, item.subTab)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${item.color} hover:shadow-xs relative cursor-pointer`}
                    >
                      {item.badge && (
                        <span className="absolute -top-1.5 -right-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full bg-slate-900 text-white shadow-2xs">
                          {item.badge}
                        </span>
                      )}
                      <Icon size={19} className="stroke-[2.2px] mb-1.5" />
                      <span className="text-[11px] font-extrabold leading-tight">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Executive Environmental & 5-Pilar STBM Health Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Card 1: 5 Pilar STBM & Sanitasi Huntap Tondo 2 */}
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 rounded-2xl md:rounded-[2.25rem] p-5 md:p-6 text-white shadow-xl shadow-emerald-950/20 border border-emerald-500/30 relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm md:text-base font-black tracking-tight text-white">5 Pilar STBM & ODF</h3>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      Kemenkes RI
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs font-semibold">Sanitasi Total Berbasis Masyarakat Huntap Tondo 2</p>
                </div>
              </div>
              <button 
                onClick={() => onTabChange('stbm')}
                className="text-[11px] font-black text-emerald-300 hover:text-white bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-500/40 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shrink-0"
              >
                Detail <ArrowRight size={13} />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 md:gap-3 py-1">
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                <span className="text-[9px] md:text-[10px] uppercase font-bold text-slate-400 block">Status BABS</span>
                <span className="text-sm md:text-lg font-black text-emerald-400 mt-0.5 block">100% ODF</span>
                <span className="text-[8px] text-slate-400 font-semibold">Bebas Buang Air Besar</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                <span className="text-[9px] md:text-[10px] uppercase font-bold text-slate-400 block">Kavling Terdata</span>
                <span className="text-sm md:text-lg font-black text-cyan-300 mt-0.5 block">{stbmRecords.length || houses.length} KK</span>
                <span className="text-[8px] text-slate-400 font-semibold">129 Huntap PUPR</span>
              </div>
              <div className={`border rounded-xl p-2.5 text-center ${stbmIssuesCount > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                <span className="text-[9px] md:text-[10px] uppercase font-bold text-slate-400 block">Tindak Lanjut</span>
                <span className={`text-sm md:text-lg font-black mt-0.5 block ${stbmIssuesCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {stbmIssuesCount > 0 ? `${stbmIssuesCount} Butuh TL` : '0 Nihil (Prima)'}
                </span>
                <span className="text-[8px] text-slate-400 font-semibold">{stbmIssuesCount > 0 ? 'Perlu Intervensi' : 'Semua Berjalan Normal'}</span>
              </div>
            </div>

            {/* Pillar Snapshot Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px] font-bold text-slate-200">
              <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/20 px-2 py-1 rounded-lg">
                <Check size={12} className="text-emerald-400 shrink-0" />
                <span className="truncate">P1: Biotank PUPR Standar</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/20 px-2 py-1 rounded-lg">
                <Check size={12} className="text-emerald-400 shrink-0" />
                <span className="truncate">P2: Sarana CTPS Air Mengalir</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/20 px-2 py-1 rounded-lg">
                <Check size={12} className="text-emerald-400 shrink-0" />
                <span className="truncate">P3: PAMM-RT Masak & Higienis</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/20 px-2 py-1 rounded-lg">
                <Check size={12} className="text-emerald-400 shrink-0" />
                <span className="truncate">P4: Pilah Sampah & TPS3R</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/20 px-2 py-1 rounded-lg">
                <Check size={12} className="text-emerald-400 shrink-0" />
                <span className="truncate">P5: Saluran SPALDT Tertutup</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/20 px-2 py-1 rounded-lg">
                <Sparkles size={12} className="text-emerald-400 shrink-0" />
                <span className="truncate">Kader Posyandu Aktif</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Stasiun Cuaca & Kualitas Udara Real-time Huntap Tondo 2 */}
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 rounded-2xl md:rounded-[2.25rem] p-5 md:p-6 text-white shadow-xl shadow-sky-950/20 border border-sky-500/30 relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
                  <Sun size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm md:text-base font-black tracking-tight text-white">Stasiun Cuaca Huntap Tondo 2</h3>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Sensor
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs font-semibold">Koordinat: Huntap Tondo 2 (-0.8917, 119.8707)</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block">Standar RI</span>
                <span className="text-xs font-black text-sky-300 uppercase">ISPU KLHK</span>
              </div>
            </div>

            {/* Weather Metrics Bar */}
            <div className="grid grid-cols-4 gap-2 py-1">
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                <span className="text-[9px] uppercase font-bold text-slate-400 block flex items-center justify-center gap-1">
                  <Sun size={10} className="text-amber-400" /> Suhu
                </span>
                <span className="text-base md:text-xl font-black text-white mt-0.5 block">
                  {weather ? `${weather.temp}°C` : '31°C'}
                </span>
                <span className="text-[8px] text-slate-400 font-semibold truncate block">
                  {weather?.condition || 'Cerah Berawan'}
                </span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                <span className="text-[9px] uppercase font-bold text-slate-400 block flex items-center justify-center gap-1">
                  <Droplets size={10} className="text-sky-400" /> Kelembapan
                </span>
                <span className="text-base md:text-xl font-black text-sky-300 mt-0.5 block">
                  {weather ? `${weather.humidity}%` : '74%'}
                </span>
                <span className="text-[8px] text-slate-400 font-semibold truncate block">Relatif (RH)</span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                <span className="text-[9px] uppercase font-bold text-slate-400 block flex items-center justify-center gap-1">
                  <Wind size={10} className="text-teal-400" /> Angin
                </span>
                <span className="text-base md:text-xl font-black text-teal-300 mt-0.5 block">
                  {weather ? `${weather.windSpeed} km/h` : '12 km/h'}
                </span>
                <span className="text-[8px] text-slate-400 font-semibold truncate block">Lembah Palu</span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                <span className="text-[9px] uppercase font-bold text-slate-400 block flex items-center justify-center gap-1">
                  <Activity size={10} className="text-emerald-400" /> ISPU Udara
                </span>
                <span className="text-base md:text-xl font-black text-emerald-400 mt-0.5 block">
                  {weather ? weather.aqi : 28}
                </span>
                <span className="text-[8px] font-black uppercase text-emerald-300 truncate block">
                  {weather?.aqiLabel || 'Baik (Sehat)'}
                </span>
              </div>
            </div>

            {/* Health / Environmental Advisory Note */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Compass size={14} className="text-sky-400 shrink-0" />
                <span className="text-[11px] font-medium leading-relaxed">
                  {weather?.alertMessage || 'Kualitas udara ISPU dalam kondisi Sehat dan kondusif untuk kegiatan warga di luar ruangan.'}
                </span>
              </div>
              <span className="text-[9px] text-slate-400 font-bold shrink-0 ml-2">
                PM2.5: {weather?.pm2_5 ? `${weather.pm2_5} µg/m³` : 'Normal'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-6">
        {/* Warga Card */}
        <motion.div variants={itemVariants} className="bg-white p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-200/80 shadow-2xs hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 transition-all group relative overflow-hidden cursor-pointer" onClick={() => onTabChange('residents')}>
          <div className="absolute -right-4 -top-4 w-24 md:w-32 h-24 md:h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="p-3 md:p-3.5 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform shadow-2xs">
                <Users size={20} className="md:w-6 md:h-6" />
              </div>
              <span className="hidden xs:block text-[9px] md:text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Demografi</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1 md:gap-2">
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight font-mono">{totalResidents}</h3>
                <span className="text-[10px] md:text-xs font-extrabold text-slate-400 uppercase">Jiwa</span>
              </div>
              <div className="flex items-baseline gap-1 md:gap-2">
                <h3 className="text-base md:text-lg font-black text-indigo-600 font-mono">{occupiedHouses}</h3>
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
        <motion.div variants={itemVariants} className="bg-white p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-200/80 shadow-2xs hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-300 transition-all group relative overflow-hidden cursor-pointer" onClick={() => onTabChange('finance')}>
          <div className="absolute -right-4 -top-4 w-24 md:w-32 h-24 md:h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="p-3 md:p-3.5 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform shadow-2xs">
                <DollarSign size={20} className="md:w-6 md:h-6" />
              </div>
              <span className="hidden xs:block text-[9px] md:text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Saldo Kas</span>
            </div>
            <div className="flex items-baseline gap-1 md:gap-2">
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight font-mono">Rp{(balance / 1000000).toFixed(1)}jt</h3>
            </div>
            <div className="mt-3 md:mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
              <span className="text-emerald-600 font-extrabold flex items-center gap-0.5"><TrendingUp size={12} /> +{(income / 1000000).toFixed(1)}jt</span>
              <span className="text-rose-500 font-bold flex items-center gap-0.5"><TrendingDown size={12} /> -{(expense / 1000000).toFixed(1)}jt</span>
            </div>
          </div>
        </motion.div>

        {/* Laporan Card */}
        <motion.div variants={itemVariants} className="bg-white p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-200/80 shadow-2xs hover:shadow-xl hover:shadow-rose-500/10 hover:border-rose-300 transition-all group relative overflow-hidden cursor-pointer" onClick={() => onTabChange('services')}>
          <div className="absolute -right-4 -top-4 w-24 md:w-32 h-24 md:h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="p-3 md:p-3.5 bg-rose-50 text-rose-600 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform shadow-2xs">
                <AlertTriangle size={20} className="md:w-6 md:h-6" />
              </div>
              <span className="hidden xs:block text-[9px] md:text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Aduan Warga</span>
            </div>
            <div className="flex items-baseline gap-1 md:gap-2">
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight font-mono">{newReports}</h3>
              <span className="text-[10px] md:text-xs font-extrabold text-rose-600 uppercase">Perlu Tindakan</span>
            </div>
            <div className="mt-3 md:mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-rose-500">
              <span className="flex items-center gap-1"><Activity size={12} className="animate-pulse" /> Tindak Lanjut</span>
              <ArrowRight size={14} className="text-slate-300 group-hover:translate-x-1 group-hover:text-rose-600 transition-all" />
            </div>
          </div>
        </motion.div>

        {/* Tamu Card */}
        <motion.div variants={itemVariants} className="bg-white p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-200/80 shadow-2xs hover:shadow-xl hover:shadow-amber-500/10 hover:border-amber-300 transition-all group relative overflow-hidden cursor-pointer" onClick={() => onTabChange('guests')}>
          <div className="absolute -right-4 -top-4 w-24 md:w-32 h-24 md:h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="p-3 md:p-3.5 bg-amber-50 text-amber-600 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform shadow-2xs">
                <ShieldAlert size={20} className="md:w-6 md:h-6" />
              </div>
              <span className="hidden xs:block text-[9px] md:text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Log Tamu</span>
            </div>
            <div className="flex items-baseline gap-1 md:gap-2">
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight font-mono">{activeGuests}</h3>
              <span className="text-[10px] md:text-xs font-extrabold text-amber-600 uppercase">Tamu Aktif</span>
            </div>
            <div className="mt-3 md:mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-amber-600">
              <span className="flex items-center gap-1"><Clock size={12} /> Wajib 1x24 Jam</span>
              <ArrowRight size={14} className="text-slate-300 group-hover:translate-x-1 group-hover:text-amber-600 transition-all" />
            </div>
          </div>
        </motion.div>

        {/* Retribusi Sampah Card */}
        <motion.div variants={itemVariants} className="bg-white p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-200/80 shadow-2xs hover:shadow-xl hover:shadow-sky-500/10 hover:border-sky-300 transition-all group relative overflow-hidden cursor-pointer" onClick={() => onTabChange('finance')}>
          <div className="absolute -right-4 -top-4 w-24 md:w-32 h-24 md:h-32 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="p-3 md:p-3.5 bg-sky-50 text-sky-600 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform shadow-2xs">
                <Trash2 size={20} className="md:w-6 md:h-6" />
              </div>
              <span className="hidden xs:block text-[9px] md:text-[10px] font-black text-sky-700 bg-sky-50 border border-sky-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Iuran Retribusi</span>
            </div>
            <div className="flex items-baseline gap-1 md:gap-2">
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight font-mono">{wastePaymentPercentage}%</h3>
              <span className="text-[10px] md:text-xs font-extrabold text-sky-600 uppercase">Tercapai</span>
            </div>
            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-2">
              <div 
                className="bg-gradient-to-r from-sky-500 to-indigo-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(wastePaymentPercentage, 100)}%` }} 
              />
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
          <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-200/80 shadow-2xs">
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
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 700}} tickFormatter={(v) => `Rp${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '1.25rem', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      backdropFilter: 'blur(16px)', 
                      color: '#fff', 
                      boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.4)' 
                    }}
                    itemStyle={{ color: '#a5b4fc', fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ fontWeight: 900, color: '#e2e8f0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fill="url(#colorCashDoc)" />
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
