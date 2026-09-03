import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  FileText, ShoppingCart, Vote, AlertTriangle, Megaphone, 
  Clock, Moon, Calendar, ChevronRight, ArrowRight, ShieldCheck, UserPlus, ShieldAlert, CheckCircle2, User,
  Camera, Send, Home, Phone, Info, Lock, Eye, EyeOff, Droplets, Shield, CheckSquare, Scale, HelpCircle,
  BookOpen, PhoneCall, Sparkles, TrendingUp, DollarSign, Trash2, Recycle, Trophy, Award
} from 'lucide-react';
import { motion } from 'motion/react';
import { House, Announcement, Report, Official, RondaSchedule, GalleryItem, PatrolSession, LetterRequest, MapPoint } from '../../types';
import { HeroSection } from '../HeroSection';
import { DigitalSummary } from './DigitalSummary';
import { ServiceStats } from '../ServiceStats';
import { HouseMap } from '../HouseMap';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useFinancial } from '../../context/FinancialContext';
import { addReportToDb, validateResidentAccess, formatHouseId } from '../../services/databaseService';
import { SmartImage } from '../SmartImage';

interface PublicHomeProps {
  houses: House[];
  announcements: Announcement[];
  ronda: RondaSchedule[];
  reports: Report[];
  letters: LetterRequest[];
  officials: Official[];
  gallery: GalleryItem[];
  activePatrol: PatrolSession | null;
  mapPoints: MapPoint[];
}

export const PublicHome: React.FC<PublicHomeProps> = ({ 
  houses, announcements, ronda, reports, letters, officials, gallery, activePatrol, mapPoints
}) => {
  const navigate = useNavigate();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const { summaries, settings: financialSettings } = useFinancial();
  const [statusSearchId, setStatusSearchId] = React.useState('');
  
  const [isReportModalOpen, setIsReportModalOpen] = React.useState(false);
  const [isCleanlinessLeaderboardOpen, setIsCleanlinessLeaderboardOpen] = React.useState(false);
  const [reportForm, setReportForm] = React.useState({
    type: 'Keamanan' as Report['type'],
    description: '',
    reporterName: '',
    reporterHouseId: '',
    reporterPhone: '',
    pin: ''
  });
  const [showPin, setShowPin] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.description || !reportForm.reporterName || !reportForm.reporterHouseId || !reportForm.pin) {
      toast.error("Mohon lengkapi data laporan dan verifikasi");
      return;
    }

    setIsSubmitting(true);
    try {
      // Validate PIN
      const isValid = await validateResidentAccess(reportForm.reporterHouseId, reportForm.pin);
      if (!isValid) {
        toast.error("Verifikasi Gagal!", {
          description: "Kode Akses Rumah (PIN) tidak valid."
        });
        setIsSubmitting(false);
        return;
      }

      const formattedHouseId = formatHouseId(reportForm.reporterHouseId);
      const { pin, ...reportData } = reportForm;

      await addReportToDb({
        ...reportData,
        reporterHouseId: formattedHouseId,
        date: new Date().toISOString(),
        status: 'Baru'
      });
      toast.success("Laporan berhasil dikirim!", {
        description: "Terima kasih atas laporannya. Pengurus RT akan segera menindaklanjuti."
      });
      setIsReportModalOpen(false);
      setReportForm({
        type: 'Keamanan',
        description: '',
        reporterName: '',
        reporterHouseId: '',
        reporterPhone: '',
        pin: ''
      });
    } catch (error) {
      toast.error("Gagal mengirim laporan");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCheckStatus = (e: React.FormEvent) => {
    e.preventDefault();
    const house = houses.find(h => h.id.toLowerCase() === statusSearchId.toLowerCase());
    if (house) {
      navigate(`/info?search=${statusSearchId}`);
    } else {
      toast.error("No. Rumah tidak ditemukan", {
        description: "Pastikan format benar (Contoh: A1-01)"
      });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 19) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const dateObj = new Date();
  const today = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
  const fullDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const todayRonda = ronda.find((r) => r.day === today);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const quickActions = React.useMemo(() => [
    { 
      label: 'Profil Warga', 
      icon: User, 
      color: 'bg-[#5856d6]', 
      shadow: 'shadow-[#5856d6]/30', 
      link: '/resident' 
    },
    { 
      label: 'Buat Surat', 
      icon: FileText, 
      color: 'bg-[#00a2e0]', 
      shadow: 'shadow-[#00a2e0]/30', 
      link: '/services' 
    },
    { 
      label: 'Lapor Tamu', 
      icon: Shield, 
      color: 'bg-[#ff6200]', 
      shadow: 'shadow-[#ff6200]/30', 
      link: '/services?tab=tamu',
      badge: 'PENTING',
      badgeColor: 'bg-[#ff3b30]'
    },
    { 
      label: 'Daftar Warga', 
      icon: UserPlus, 
      color: 'bg-[#af52de]', 
      shadow: 'shadow-[#af52de]/30', 
      link: '/register' 
    },
    { 
      label: 'Pasar Warga', 
      icon: ShoppingCart, 
      color: 'bg-[#00c781]', 
      shadow: 'shadow-[#00c781]/30', 
      link: '/market',
      badge: 'UMKM',
      badgeColor: 'bg-[#e13f70]'
    },
    { 
      label: 'Warta RT', 
      icon: Megaphone, 
      color: 'bg-[#00b2cc]', 
      shadow: 'shadow-[#00b2cc]/30', 
      link: '/info' 
    },
    { 
      label: 'Peraturan RT', 
      icon: BookOpen, 
      color: 'bg-[#10b981]', 
      shadow: 'shadow-[#10b981]/30', 
      link: '/rules',
      badge: '13 BAB',
      badgeColor: 'bg-[#059669]'
    },
    { 
      label: 'E-Voting', 
      icon: CheckSquare, 
      color: 'bg-[#5c72e6]', 
      shadow: 'shadow-[#5c72e6]/30', 
      link: '/voting',
      badge: 'PEMILU',
      badgeColor: 'bg-[#d946ef]'
    },
    { 
      label: 'Lapor RT', 
      icon: AlertTriangle, 
      color: 'bg-[#ff3b30]', 
      shadow: 'shadow-[#ff3b30]/30', 
      action: () => setIsReportModalOpen(true) 
    },
    { 
      label: 'Kontak Darurat', 
      icon: PhoneCall, 
      color: 'bg-[#dc2626]', 
      shadow: 'shadow-[#dc2626]/30', 
      action: () => {
        toast.info("Kontak Darurat RT 02 Huntap Tondo 2", {
          description: "Ketua RT: +62 859-6119-4621 | Satpam Pos: +62 812-4455-8800 | Pemadam: 113 | Ambulans: 118"
        });
      },
      badge: '24 JAM',
      badgeColor: 'bg-[#991b1b]'
    }
  ], []);

  const [filterType, setFilterType] = React.useState<'All' | 'General' | 'Urgent' | 'Event' | 'Lelayu'>('All');

  const filteredAnnouncements = announcements.filter(a => filterType === 'All' || a.type === filterType);

  const handleExplore = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-12 mb-24 relative"
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] right-[5%] w-[30%] h-[30%] bg-indigo-200/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-[40%] left-[-10%] w-[40%] h-[40%] bg-emerald-200/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[25%] h-[25%] bg-amber-200/10 blur-[80px] rounded-full" />
      </div>

      <HeroSection onExplore={handleExplore} />

      {/* Modern Live Info Marquee Banner */}
      <motion.div 
        variants={itemVariants} 
        className="bg-white/90 backdrop-blur-md rounded-3xl p-4 border border-slate-200/80 shadow-xs text-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 overflow-hidden"
      >
        <div className="flex items-center gap-2.5 shrink-0 px-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Sparkles size={11} className="text-emerald-600" /> LIVE UPDATE RT 02
          </span>
        </div>

        <div className="flex-1 w-full overflow-hidden text-center md:text-left">
          <p className="text-xs font-semibold text-slate-600 truncate">
            🌙 <span className="font-bold text-slate-900">Ronda Malam Ini ({today}):</span> {todayRonda && todayRonda.members.length > 0 ? todayRonda.members.slice(0, 3).join(', ') : 'Satgas Siskamling Standby'} &nbsp;&bull;&nbsp; 
            💰 <span className="font-bold text-emerald-700">Iuran Terkumpul:</span> Rp {(summaries.totalCollected || 0).toLocaleString('id-ID')} &nbsp;&bull;&nbsp;
            📜 <span className="font-bold text-amber-700">Regulasi RT:</span> 13 BAB Peraturan Lingkungan Resmi Disahkan
          </p>
        </div>

        <button 
          onClick={() => navigate('/info')}
          className="shrink-0 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
        >
          <span>Pusat Info</span>
          <ChevronRight size={12} />
        </button>
      </motion.div>

      {/* Personalized Greeting */}
      <div ref={contentRef} className="text-center md:text-left">
        <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">
          {getGreeting()}, Warga! 👋
        </h2>
        <p className="text-slate-500 font-medium mt-2">Selamat datang kembali di sistem informasi digital RT 02.</p>
      </div>

      {/* Quick Actions - Layanan Warga Terpadu Grid from User Image */}
      <motion.div 
        variants={itemVariants}
        className="bg-white/95 backdrop-blur-md border border-slate-100/80 rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-slate-200/30 relative z-10"
      >
        <div className="mb-8">
          <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight">
            Layanan <span className="bg-gradient-to-r from-emerald-500 to-blue-600 bg-clip-text text-transparent italic">Warga Terpadu</span>
          </h3>
          <p className="text-slate-400 font-medium text-xs md:text-sm mt-1 max-w-xl">
            Semua urusan warga dan administrasi kini serba praktis dalam satu ketukan.
          </p>
        </div>

        {/* Grid layout matching Gojek/Grab/Citizen apps exactly: 4 columns on mobile, 8 columns on desktop */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-y-8 gap-x-2 md:gap-x-8 w-full max-w-5xl">
          {quickActions.map((action, idx) => (
            <motion.button
              key={idx}
              whileHover={{ y: -4, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.action || (() => navigate(action.link!))}
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
                <action.icon size={24} className="group-hover:scale-110 transition-transform duration-300" strokeWidth={2.4} />
              </div>

              {/* Service Label */}
              <span className="font-extrabold text-slate-700 text-[11px] md:text-sm tracking-tight leading-snug mt-2.5 group-hover:text-indigo-600 transition-colors line-clamp-2 max-w-[85px] md:max-w-none">
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <DigitalSummary />

      {/* Peraturan RT 02 - RT2LAW & Buku Saku Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RT2LAW Card - Supreme Point of Interest (POI) */}
        <motion.div 
          whileHover={{ y: -6, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onClick={() => navigate('/rules')}
          className="lg:col-span-2 cursor-pointer bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-[3rem] p-8 md:p-12 text-white border border-amber-500/40 shadow-[0_30px_90px_-20px_rgba(217,119,6,0.25)] hover:shadow-[0_40px_110px_-15px_rgba(217,119,6,0.35)] transition-all duration-700 relative overflow-hidden group flex flex-col justify-between min-h-[360px]"
        >
          {/* Subtle Golden Pinstripe Luxury Grid Overlay */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(217,119,6,0.03)_0px,rgba(217,119,6,0.03)_1px,transparent_1px,transparent_16px)] pointer-events-none" />
          
          {/* Radiant Ambient Gold & Emerald Light Orbs */}
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-amber-500/20 rounded-full blur-[100px] pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
          
          <div className="relative z-10 space-y-6">
            {/* Top Badge & Header */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3.5 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 rounded-2xl shadow-lg shadow-amber-500/20 group-hover:rotate-6 transition-transform">
                  <Scale size={26} strokeWidth={2.4} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 block leading-none mb-1">Landasan Hukum RT 02</span>
                  <span className="text-xs font-bold text-slate-300">Resmi Disahkan Wartha &amp; Pengurus</span>
                </div>
              </div>

              <span className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                <Sparkles size={12} className="text-amber-400 animate-spin-slow" /> 13 BAB RESMI
              </span>
            </div>

            {/* Middle Landmark Title */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">POINT OF INTEREST REGULASI</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                RT2<span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent font-serif italic">LAW</span>
              </h2>
              <p className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed max-w-xl">
                Konstitusi &amp; Tata Tertib Lingkungan Terpadu 13 BAB yang mengatur norma sosial, ketertiban ronda, hingga sanksi keberadaban demi keharmonisan bersama.
              </p>
            </div>
          </div>

          {/* Separator and Footer */}
          <div className="relative z-10 pt-5 mt-6 border-t border-white/10 flex items-center justify-between">
            <span className="text-slate-400 tracking-[0.2em] uppercase font-black text-[10px] flex items-center gap-2">
              <ShieldCheck size={14} className="text-amber-400" /> KELURAHAN TONDO &bull; PALU
            </span>
            <span className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-all">
              <span>Buka Regulasi Lengkap</span>
              <ChevronRight size={16} strokeWidth={3} />
            </span>
          </div>
        </motion.div>

        {/* Companion Card: Buku Saku RT 02 */}
        <div 
          onClick={() => navigate('/faq')}
          className="lg:col-span-1 cursor-pointer bg-white rounded-[2.5rem] p-8 border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-500 relative overflow-hidden group flex flex-col justify-between min-h-[320px]"
        >
          {/* Subtle Ambient Light Glow */}
          <div className="absolute top-0 right-0 w-60 h-60 bg-indigo-50/70 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
          
          <div className="relative z-10 space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100/80">
                <HelpCircle size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700 block">Pusat Bantuan Warga</span>
                <span className="text-xs font-bold text-slate-400">FAQ &amp; Informasi</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h3 className="text-2xl font-black text-slate-900 leading-tight">Buku Saku <span className="text-indigo-600 font-serif italic">Digital</span></h3>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                Panduan administratif kilat, tata cara pengajuan surat, lapor tamu 24 jam, dan penanganan darurat.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-6 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400 tracking-widest uppercase font-black text-[9px]">SISTEM TERAS RT</span>
              <span className="flex items-center gap-1.5 text-slate-900 font-black group-hover:text-indigo-600 transition-colors">
                <span>Buka FAQ</span>
                <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Widget Inovatif: Jadwal Sampah & Papan Kebersihan Blok */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Widget 1: Jadwal & Count Down Pengangkutan Sampah */}
        <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 p-8 rounded-[3rem] text-white border border-emerald-500/20 shadow-xl relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <Trash2 size={150} />
          </div>

          <div className="relative z-10 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                <Recycle size={14} className="animate-spin" />
                <span className="text-[9px] font-black uppercase tracking-widest">Smart Waste RT 02</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Pengangkutan Rutin</span>
            </div>

            <div>
              <h3 className="text-2xl font-black tracking-tight text-white mb-1">Jadwal Sampah & Daur Ulang</h3>
              <p className="text-xs text-slate-300 font-medium">Keluarkan tempat sampah Anda sebelum armada kebersihan tiba.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Sampah Organik/Dapur</p>
                <p className="text-sm font-black text-white">Senin, Rabu, Sabtu</p>
                <p className="text-[9px] font-bold text-slate-400">Jam 07:00 WITA</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Anorganik / Botol Plastik</p>
                <p className="text-sm font-black text-white">Selasa & Jumat</p>
                <p className="text-[9px] font-bold text-slate-400">Jam 15:30 WITA</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Armada Aktif Pagi Ini
            </span>
            <span className="text-[10px] text-slate-400 font-bold">Bank Sampah Huntap</span>
          </div>
        </div>

        {/* Widget 2: Indikator Kebersihan & Blok Terbersih */}
        <div className="bg-gradient-to-br from-amber-500/10 via-white to-slate-50 p-8 rounded-[3rem] border border-amber-200/60 shadow-xl relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none text-amber-600">
            <Trophy size={150} />
          </div>

          <div className="relative z-10 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                <Award size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">Penghargaan Lingkungan</span>
              </div>
              <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 uppercase">
                {financialSettings?.cleanestMonth || 'Periode Berjalan'}
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-black tracking-tight text-slate-900 mb-1">Blok Terbersih Bulan Ini</h3>
              <p className="text-xs text-slate-500 font-medium">Berdasarkan penilaian kebersihan got, kerapihan pekarangan & keasrian tanaman.</p>
            </div>

            {financialSettings?.cleanestBlock ? (
              <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl text-white shadow-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
                    <Trophy size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-100">Juara 1 Kebersihan</p>
                    <p className="text-xl font-black text-white">
                      {financialSettings.cleanestBlock}
                    </p>
                  </div>
                </div>
                {financialSettings.cleanestScore ? (
                  <span className="text-[10px] font-black bg-white text-amber-700 px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-sm">
                    Nilai {financialSettings.cleanestScore}/100
                  </span>
                ) : null}
              </div>
            ) : (
              <div className="p-5 bg-amber-500/10 border-2 border-dashed border-amber-300 rounded-2xl text-center space-y-1">
                <div className="inline-flex p-2.5 bg-amber-500/20 text-amber-700 rounded-xl mb-1">
                  <Award size={20} />
                </div>
                <p className="text-xs font-black text-amber-900 uppercase tracking-wider">Penilaian Sedang Berlangsung</p>
                <p className="text-[11px] font-bold text-amber-700/80">Pengurus RT sedang melakukan evaluasi kebersihan lingkungan blok bulan ini.</p>
              </div>
            )}
          </div>

          <div className="relative z-10 pt-4 mt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Gotong Royong Berikutnya: Minggu Pagi</span>
            <span className="text-[10px] font-black text-indigo-600 cursor-pointer hover:underline" onClick={() => setIsCleanlinessLeaderboardOpen(true)}>Lihat Peringkat Blok</span>
          </div>
        </div>
      </motion.div>

      <ServiceStats houses={houses} reports={reports} letters={letters} />

      {/* Resident Dues Widget - NEW Bento Card */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-8 rounded-[3rem] text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <Droplets size={140} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Keuangan Warga</p>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[9px] font-black uppercase tracking-wider">Transparan</span>
            </div>
            <h3 className="text-2xl font-black mb-4 tracking-tight">Iuran & Kas RT</h3>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                    <Droplets size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-200">Tarif Air</span>
                </div>
                <span className="text-xs font-black text-white">Rp {financialSettings.airFee.toLocaleString('id-ID')}</span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                    <ShoppingCart size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-200">Tarif Sampah</span>
                </div>
                <span className="text-xs font-black text-white">Rp {financialSettings.sampahFee.toLocaleString('id-ID')}</span>
              </div>
              
              {/* Info Transparansi Tambahan */}
              <div className="pt-3 mt-3 border-t border-white/10 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dana Air Terkumpul</span>
                  <span className="font-black text-blue-400">Rp {summaries.air.totalCollected.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dana Sampah Terkumpul</span>
                  <span className="font-black text-emerald-400">Rp {summaries.sampah.totalCollected.toLocaleString('id-ID')}</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total Iuran Terkumpul</span>
                  <span className="text-base font-black text-emerald-300">Rp {summaries.totalCollected.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => navigate('/services?tab=iuran')}
              variant="secondary" 
              className="w-full py-4 rounded-2xl text-[10px] font-black tracking-widest uppercase shadow-lg cursor-pointer hover:bg-white transition-all"
            >
              Bayar Iuran Sekarang
            </Button>
          </div>
        </div>

        <div className="md:col-span-2 bg-white/80 backdrop-blur-md p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-indigo-500/5 flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-1">Status Pembayaran</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Cek Tagihan Rumah</h3>
            </div>
            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
              <CheckCircle2 size={24} />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 w-full">
              <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
                Masukkan nomor rumah Anda untuk melihat rincian tagihan iuran air dan sampah yang belum terbayar.
              </p>
              <form onSubmit={handleCheckStatus} className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="No. Rumah (A1-01)" 
                  className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  value={statusSearchId}
                  onChange={e => setStatusSearchId(e.target.value)}
                />
                <Button type="submit" className="px-8 rounded-2xl">
                  Cek
                </Button>
              </form>
            </div>
            <div className="hidden md:block w-px h-32 bg-slate-100 mx-4" />
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="p-6 bg-slate-50 rounded-[2rem] text-center border border-slate-100 group-hover:bg-indigo-50 transition-colors flex flex-col justify-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Rumah</p>
                <p className="text-2xl font-black text-slate-800">{houses.length}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                  {houses.filter(h => h.status === 'Occupied').length} Rumah Terisi
                </p>
              </div>
              <div className="p-6 bg-slate-50 rounded-[2rem] text-center border border-slate-100 group-hover:bg-emerald-50 transition-colors">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Lunas Iuran</p>
                <div className="flex flex-col items-center">
                  <p className="text-2xl font-black text-emerald-600">
                    {summaries.fullyPaidHousesCount}
                  </p>
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">Lunas Keduanya</p>
                </div>
                
                <div className="mt-3 pt-3 border-t border-slate-200/50 grid grid-cols-2 gap-1">
                  <div className="text-center">
                    <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Air</p>
                    <p className="text-[10px] font-black text-blue-600">
                      {houses.filter(h => h.status === 'Occupied').length - summaries.air.unpaidCount}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Sampah</p>
                    <p className="text-[10px] font-black text-emerald-600">
                      {houses.filter(h => h.status === 'Occupied').length - summaries.sampah.unpaidCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Report Modal */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Aspirasi & Pengaduan Warga" maxWidth="max-w-xl">
        <div className="p-6">
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-6 flex gap-3">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl h-fit">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-rose-900 uppercase tracking-tight">Layanan Aspirasi & Pengaduan</h4>
              <p className="text-xs text-rose-700 font-medium leading-relaxed">
                Gunakan formulir ini untuk melaporkan masalah keamanan, kebersihan, fasilitas, atau memberikan saran/aspirasi untuk lingkungan RT 02.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitReport} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Laporan/Aspirasi</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  value={reportForm.type}
                  onChange={e => setReportForm({...reportForm, type: e.target.value as any})}
                >
                  <option value="Keamanan">Keamanan</option>
                  <option value="Kebersihan">Kebersihan</option>
                  <option value="Fasilitas">Fasilitas</option>
                  <option value="Sosial">Sosial</option>
                  <option value="Aspirasi/Saran">Aspirasi/Saran</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Pelapor</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Nama Lengkap"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={reportForm.reporterName}
                    onChange={e => setReportForm({...reportForm, reporterName: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">No. Rumah Pelapor <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Home size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Contoh: A1-05"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={reportForm.reporterHouseId}
                    onChange={e => setReportForm({...reportForm, reporterHouseId: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PIN Akses Rumah <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type={showPin ? "text" : "password"} 
                    placeholder="••••••"
                    className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={reportForm.pin}
                    onChange={e => setReportForm({...reportForm, pin: e.target.value})}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">No. WhatsApp</label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="0812..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  value={reportForm.reporterPhone}
                  onChange={e => setReportForm({...reportForm, reporterPhone: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi Laporan / Aspirasi</label>
              <textarea 
                rows={4}
                placeholder="Jelaskan secara detail masalah atau saran Anda..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none"
                value={reportForm.description}
                onChange={e => setReportForm({...reportForm, description: e.target.value})}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest"
                onClick={() => setIsReportModalOpen(false)}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-[2] py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-100"
              >
                {isSubmitting ? 'Mengirim...' : (
                  <span className="flex items-center gap-2">
                    <Send size={16} /> Kirim Laporan/Aspirasi
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Map Section - Immersive */}
      <motion.div 
        variants={itemVariants} 
        className="w-full bg-white/60 backdrop-blur-md p-3 rounded-[3rem] shadow-2xl shadow-indigo-500/5 border border-white/50 relative group"
      >
        <HouseMap 
          houses={houses} 
          isAdmin={false} 
          reports={reports} 
          officials={officials} 
          mapPoints={mapPoints}
          onReportHouse={(house: House) => navigate(`/services?tab=lapor&houseId=${house.id}`)} 
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Announcements - Editorial Style (Left Column - 2 Cols Wide) */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-100/90 shadow-sm">
            <div>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-1">Update Terkini</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                Warta <span className="italic font-serif text-indigo-600">Warga</span>
              </h2>
            </div>
            
            {/* Filter Tabs - Modern */}
            <div className="flex bg-slate-100/80 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200/80 shrink-0 overflow-x-auto no-scrollbar">
              {[
                { id: 'All', label: 'Semua' },
                { id: 'Lelayu', label: 'Lelayu / Duka' },
                { id: 'Urgent', label: 'Penting' },
                { id: 'Event', label: 'Acara' },
                { id: 'General', label: 'Info' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    filterType === tab.id 
                      ? 'bg-white text-indigo-600 shadow-sm font-black' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredAnnouncements.map((ann, idx) => {
              const isLelayu = ann.type === 'Lelayu';
              return (
                <motion.div 
                  key={ann.id} 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -3 }}
                  className={`backdrop-blur-md p-7 rounded-[2.5rem] border shadow-md hover:shadow-xl transition-all duration-300 group relative overflow-hidden ${
                    isLelayu 
                      ? 'bg-slate-900 text-white border-slate-800 shadow-slate-900/20' 
                      : 'bg-white/95 border-slate-100/90 shadow-indigo-500/5'
                  }`}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 pointer-events-none ${
                    isLelayu ? 'bg-rose-500/10' : 'bg-indigo-50/50'
                  }`} />
                  
                  <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className={`
                          px-3.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border
                          ${isLelayu ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                            ann.type === 'Urgent' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                            ann.type === 'Event' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                            'bg-indigo-50 text-indigo-600 border-indigo-100'}
                        `}>
                          {isLelayu ? '🖤 Berita Lelayu' : ann.type}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                          isLelayu ? 'text-slate-400' : 'text-slate-400'
                        }`}>
                          <Clock size={12} strokeWidth={2.5} className="text-slate-400" /> 
                          {new Date(ann.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>

                      <h3 className={`text-xl md:text-2xl font-black leading-snug transition-colors ${
                        isLelayu ? 'text-white group-hover:text-rose-300' : 'text-slate-900 group-hover:text-indigo-600'
                      }`}>
                        {ann.title}
                      </h3>

                      {isLelayu && (
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 text-xs">
                          {ann.deceasedName && (
                            <p className="font-bold text-slate-200">
                              Almarhum/Almarhumah: <span className="text-white font-extrabold">{ann.deceasedName}</span> {ann.deceasedAge ? `(${ann.deceasedAge} Thn)` : ''}
                            </p>
                          )}
                          {ann.deceasedHouseId && (
                            <p className="text-slate-300">
                              Rumah Duka: <span className="text-white font-bold">{ann.deceasedHouseId}</span>
                            </p>
                          )}
                          {ann.funeralTime && (
                            <p className="text-slate-300">
                              Waktu Pemakaman: <span className="text-white font-bold">{ann.funeralTime}</span> {ann.funeralLocation ? `di ${ann.funeralLocation}` : ''}
                            </p>
                          )}
                          {ann.tazkiahSchedule && (
                            <p className="text-slate-300">
                              Jadwal Takziah: <span className="text-white font-bold">{ann.tazkiahSchedule}</span>
                            </p>
                          )}
                          {ann.bankAccount && (
                            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                              <span className="text-[10px] uppercase font-black tracking-wider text-rose-300">Rekening Belasungkawa:</span>
                              <span className="text-xs font-mono font-bold text-white bg-black/40 px-2 py-0.5 rounded">{ann.bankAccount}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <p className={`text-xs md:text-sm leading-relaxed whitespace-pre-line line-clamp-3 group-hover:line-clamp-none transition-all duration-500 font-medium ${
                        isLelayu ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        {ann.content}
                      </p>
                    </div>
                    <div className="shrink-0 self-end md:self-start">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm border ${
                        isLelayu 
                          ? 'bg-white/10 text-white border-white/10 group-hover:bg-rose-500 group-hover:text-white' 
                          : 'bg-slate-50 text-slate-400 border-slate-100 group-hover:bg-indigo-600 group-hover:text-white'
                      }`}>
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {filteredAnnouncements.length === 0 && (
              <div className="text-center p-16 bg-white/60 backdrop-blur-sm rounded-[2.5rem] border-2 border-dashed border-slate-200">
                <Megaphone size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-400 font-black uppercase tracking-wider text-xs">Belum ada warta terbaru</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Sidebar Widgets - Stacked (Right Column - 1 Col Wide) */}
        <motion.div variants={itemVariants} className="space-y-6">

          {/* Ronda Widget - Refined Compact Height */}
          <div className="bg-slate-950 text-white p-7 md:p-8 rounded-[2.5rem] shadow-xl shadow-slate-950/20 relative overflow-hidden group border border-white/10">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity duration-700 rotate-12 pointer-events-none">
              <Moon size={140} />
            </div>
            
            <div className="relative z-10 space-y-6">
              {activePatrol && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl backdrop-blur-md"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Live Patrol</span>
                    </div>
                    <span className="text-[9px] font-black text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      {new Date(activePatrol.startTime).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <p className="font-black text-white text-sm leading-tight">{activePatrol.officerName}</p>
                      <p className="text-[9px] text-emerald-400/60 font-black uppercase tracking-widest mt-0.5">Petugas Aktif</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="pb-5 border-b border-white/10 flex justify-between items-end">
                <div>
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.25em] mb-1">Jadwal Siskamling</p>
                  <p className="text-3xl font-black text-white leading-none tracking-tight">{today}</p>
                  <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5 mt-1.5">
                    <Calendar size={13} className="text-indigo-400" /> {fullDate}
                  </p>
                </div>
                <div className="bg-indigo-600/20 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-indigo-500/30">
                  <span className="text-[9px] font-black uppercase tracking-wider text-indigo-300">Shift Malam</span>
                </div>
              </div>

              <div className="space-y-3">
                {todayRonda && (todayRonda.shifts || todayRonda.members.length > 0) ? (
                  todayRonda.shifts ? (
                    todayRonda.shifts.map((shift, i) => (
                      <div key={shift.id} className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock size={11} strokeWidth={2.5} /> {shift.time}
                          </p>
                          <span className="text-[8px] font-black bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 uppercase">Shift {i+1}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {shift.members.map((member, j) => (
                            <span key={j} className="text-[10px] font-bold text-white/80 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                              {member}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    todayRonda.members.map((member, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xs border border-indigo-500/30">
                          {i + 1}
                        </div>
                        <span className="font-bold text-sm tracking-tight text-white/90">{member}</span>
                      </div>
                    ))
                  )
                ) : (
                  <div className="text-center py-6 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs font-bold uppercase tracking-wider">
                    Jadwal belum diatur
                  </div>
                )}
              </div>

              <Button 
                onClick={() => navigate('/info')} 
                variant="secondary"
                className="w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-2"
              >
                Selengkapnya <ChevronRight size={14} strokeWidth={3}/>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Gallery Widget - Creative Style */}
      <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-md p-8 rounded-[3rem] border border-white/50 shadow-2xl shadow-indigo-500/5 group">
        <div className="flex items-center justify-between mb-8 px-2">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Galeri <span className="text-indigo-600 italic font-serif">Warga</span></h3>
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
            <ArrowRight size={18} />
          </div>
        </div>
        {gallery.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gallery.slice(0, 4).map((item, i) => (
              <motion.div 
                key={item.id} 
                whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? 2 : -2 }}
                className="relative aspect-[4/5] rounded-[2rem] overflow-hidden group/img cursor-pointer shadow-md"
              >
                <SmartImage 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover animate-none" 
                  width={400}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-all duration-500 flex items-end p-5 pointer-events-none">
                  <p className="text-[10px] text-white font-black uppercase tracking-widest leading-tight">
                    {item.title}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-300 text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-[2.5rem]">
            Galeri masih kosong
          </div>
        )}
      </motion.div>

      {/* Modal Papan Peringkat Kebersihan Seluruh Blok */}
      <Modal
        isOpen={isCleanlinessLeaderboardOpen}
        onClose={() => setIsCleanlinessLeaderboardOpen(false)}
        title="Papan Peringkat Kebersihan Lingkungan Blok RT 02"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6 p-2">
          <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500 text-white rounded-xl shadow-md">
                <Trophy size={24} />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm">Evaluasi Kebersihan Kawasan</h4>
                <p className="text-xs text-slate-500 font-medium">Periode Evaluasi: <span className="font-black text-amber-700">{financialSettings?.cleanestMonth || 'Agustus 2026'}</span></p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-200">Official Board</span>
          </div>

          {financialSettings?.cleanestBlock && financialSettings?.cleanestRankings ? (
            <div className="space-y-3">
              {financialSettings.cleanestRankings.map((item: any, idx: number) => {
                const rankNum = item.rank || idx + 1;
                const badge = rankNum === 1 ? '🥇 Juara 1 (Emas)' : rankNum === 2 ? '🥈 Juara 2 (Perak)' : rankNum === 3 ? '🥉 Juara 3 (Perunggu)' : `Peringkat ${rankNum}`;
                const badgeBg = rankNum === 1 ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : rankNum === 2 ? 'bg-slate-300 text-slate-800' : rankNum === 3 ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-700';
                const border = rankNum === 1 ? 'border-amber-400/80 bg-amber-50/40 shadow-xs' : rankNum === 2 ? 'border-slate-200 bg-slate-50/60' : rankNum === 3 ? 'border-amber-900/10 bg-amber-900/5' : 'border-slate-200 bg-white';

                return (
                  <div key={rankNum} className={`p-4 rounded-2xl border ${border} flex items-center justify-between transition-all hover:scale-[1.01]`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${badgeBg} flex items-center justify-center font-black text-sm shrink-0`}>
                        {rankNum}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-black text-slate-900 text-sm">{item.block}</h5>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">{badge}</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 mt-0.5">{item.status || 'Evaluasi Lingkungan Baik'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl block">
                        {item.score}/100
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">Score Nilai</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-slate-50 border-2 border-dashed border-amber-300 rounded-3xl text-center space-y-3">
              <div className="inline-flex p-4 bg-amber-500/20 text-amber-700 rounded-2xl">
                <Award size={36} />
              </div>
              <h4 className="text-base font-black text-slate-800 uppercase tracking-wider">Penilaian Kebersihan Sedang Berlangsung</h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                Pengurus RT 02 dan Tim Penilai Gotong Royong sedang melakukan evaluasi berkala kebersihan drainase, kerapian pekarangan, serta keasrian tanaman di setiap blok.
              </p>
              <div className="inline-block px-4 py-1.5 bg-amber-100 border border-amber-200 rounded-full text-[10px] font-black text-amber-800 uppercase tracking-widest">
                Pengumuman Peringkat Segera Dipublikasikan
              </div>
            </div>
          )}

          <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-xs font-medium text-slate-600 leading-relaxed">
            💡 <strong className="text-indigo-900">Kriteria Penilaian Kebersihan RT 02:</strong> Kebersihan got/drainase (35%), kerapian pekarangan & sampah (35%), keasrian tanaman (30%). Evaluasi dilakukan pengurus setiap akhir bulan.
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};
