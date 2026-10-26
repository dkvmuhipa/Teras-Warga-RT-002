import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Calendar, ChevronRight, ArrowRight, ShieldCheck, 
  BookOpen, Scale, Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  House, Announcement, Report, Official, RondaSchedule, 
  GalleryItem, PatrolSession, LetterRequest, MapPoint, 
  CommunitySkill, UtilityOutage 
} from '../../types';
import { HeroSection } from '../HeroSection';
import { DigitalSummary } from './DigitalSummary';
import { ServiceStats } from '../ServiceStats';
import { HouseMap } from '../HouseMap';
import { SmartImage } from '../SmartImage';
import { useFinancial } from '../../context/FinancialContext';
import { useTenant } from '../../context/TenantContext';
import { subscribeToCollection } from '../../services/databaseService';
import { UtilityOutageTrackerModal } from './UtilityOutageTrackerModal';

// Modular Home Subcomponents
import { QuickActionsGrid } from './home/QuickActionsGrid';
import { HouseBillChecker } from './home/HouseBillChecker';
import { WasteCleanlinessWidget } from './home/WasteCleanlinessWidget';
import { SpotlightAgenda } from './home/SpotlightAgenda';
import { AnnouncementsFeed } from './home/AnnouncementsFeed';
import { NightPatrolWidget } from './home/NightPatrolWidget';
import { QuickReportModal } from './home/QuickReportModal';
import { CleanlinessLeaderboardModal } from './home/CleanlinessLeaderboardModal';
import { CommunitySkillsModal } from './home/CommunitySkillsModal';

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
  const contentRef = useRef<HTMLDivElement>(null);
  const { currentTenant } = useTenant();
  const { summaries, settings: financialSettings } = useFinancial();
  
  // Realtime Subscriptions for Community & Facilities
  const [communitySkills, setCommunitySkills] = useState<CommunitySkill[]>([]);
  const [utilityOutages, setUtilityOutages] = useState<UtilityOutage[]>([]);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [isOutageModalOpen, setIsOutageModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCleanlinessLeaderboardOpen, setIsCleanlinessLeaderboardOpen] = useState(false);

  useEffect(() => {
    const unsubSkills = subscribeToCollection('communitySkills', (data) => setCommunitySkills(data as CommunitySkill[]));
    const unsubOutages = subscribeToCollection('utilityOutages', (data) => setUtilityOutages(data as UtilityOutage[]));
    return () => {
      unsubSkills();
      unsubOutages();
    };
  }, []);

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
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  const handleExplore = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-screen-2xl mx-auto px-3.5 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8 space-y-8 sm:space-y-10 md:space-y-12 mb-24 relative"
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] right-[5%] w-[30%] h-[30%] bg-indigo-200/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-[40%] left-[-10%] w-[40%] h-[40%] bg-emerald-200/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[25%] h-[25%] bg-amber-200/10 blur-[80px] rounded-full" />
      </div>

      {/* Hero Section */}
      <HeroSection onExplore={handleExplore} />

      {/* Live Active Utility Outage Alert Banner */}
      {utilityOutages.some(o => o.status === 'Ongoing') && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white rounded-3xl p-4 md:p-5 shadow-lg shadow-orange-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/20"
        >
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shrink-0 animate-pulse">
              <Zap size={22} className="text-amber-200" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-black/30 rounded-md text-[9px] font-black uppercase tracking-wider text-amber-200">
                  Siaga Utilitas Aktif
                </span>
                <span className="text-[10px] font-bold text-amber-100">
                  {utilityOutages.find(o => o.status === 'Ongoing')?.type} • Waktu: {utilityOutages.find(o => o.status === 'Ongoing')?.startTime} - {utilityOutages.find(o => o.status === 'Ongoing')?.endTime}
                </span>
              </div>
              <h4 className="font-black text-sm md:text-base leading-snug">
                {utilityOutages.find(o => o.status === 'Ongoing')?.title}
              </h4>
              <p className="text-xs text-amber-100/90 font-medium line-clamp-1">
                Wilayah Terdampak: {utilityOutages.find(o => o.status === 'Ongoing')?.affectedBlocks?.join(', ') || `Semua Blok ${currentTenant.name}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <button
              onClick={() => setIsOutageModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-amber-50 text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Detail &amp; Lapor Cepat</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Modern Live Info Marquee Banner */}
      <motion.div 
        variants={itemVariants} 
        className="bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-slate-200/80 shadow-xs text-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 overflow-hidden"
      >
        <div className="flex items-center gap-2.5 shrink-0 px-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Sparkles size={11} className="text-emerald-600" /> LIVE UPDATE {currentTenant.rt ? `RT ${currentTenant.rt}` : 'WARGA'}
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
      <div ref={contentRef} className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-center sm:text-left border-b border-slate-200/60 pb-5">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-1 block">
            {currentTenant.name}
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">
            {getGreeting()}, <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 bg-clip-text text-transparent">Warga!</span> 👋
          </h2>
          <p className="text-slate-500 font-medium text-xs sm:text-sm mt-1">
            Selamat datang di pusat layanan mandiri dan transparansi digital lingkungan {currentTenant.name}.
          </p>
        </div>
        <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-[11px] font-bold text-slate-600 shrink-0 shadow-2xs">
          <Calendar size={13} className="text-indigo-600" />
          <span>{today}, {fullDate}</span>
        </div>
      </div>

      {/* 1. Quick Actions - Layanan Warga Terpadu Grid */}
      <motion.div variants={itemVariants}>
        <QuickActionsGrid 
          onOpenReport={() => setIsReportModalOpen(true)}
          onOpenSkills={() => setIsSkillsModalOpen(true)}
          onOpenOutage={() => setIsOutageModalOpen(true)}
        />
      </motion.div>

      {/* 2. Digital Summary (Kegiatan & Posyandu) */}
      <DigitalSummary />

      {/* 3. Peraturan RT - RT2LAW & Buku Saku Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RT2LAW Card */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onClick={() => navigate('/rules')}
          className="lg:col-span-2 cursor-pointer bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-5 sm:p-8 md:p-10 text-white border border-slate-800 shadow-xs relative overflow-hidden group flex flex-col justify-between min-h-[260px] sm:min-h-[300px]"
        >
          <div className="relative z-10 space-y-5">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Scale size={24} strokeWidth={2.4} />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block leading-none mb-1">
                    Landasan Hukum {currentTenant.rt ? `RT ${currentTenant.rt}` : 'Warga'}
                  </span>
                  <span className="text-xs font-bold text-slate-300">Resmi Disahkan Warga &amp; Pengurus</span>
                </div>
              </div>

              <span className="px-3.5 py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <Sparkles size={12} className="text-amber-400 animate-spin-slow" /> 13 BAB RESMI
              </span>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">REGULASI TERTIB LINGKUNGAN</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                RT2<span className="text-amber-400 font-serif italic">LAW</span>
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed max-w-xl">
                Konstitusi &amp; Tata Tertib Lingkungan Terpadu 13 BAB yang mengatur norma sosial, ketertiban ronda, hingga sanksi keberadaban demi keharmonisan bersama.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-5 border-t border-white/10 flex items-center justify-between">
            <span className="text-slate-400 tracking-wider uppercase font-extrabold text-[10px] flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-amber-400" /> KELURAHAN {currentTenant.kelurahan?.toUpperCase()} &bull; {currentTenant.city?.toUpperCase()}
            </span>
            <span className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-2xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs group-hover:scale-105 transition-all">
              <span>Buka Regulasi</span>
              <ChevronRight size={15} strokeWidth={2.5} />
            </span>
          </div>
        </motion.div>

        {/* Companion Card: Buku Saku Warga Baru */}
        <div 
          onClick={() => navigate('/welcome')}
          className="lg:col-span-1 cursor-pointer bg-white rounded-3xl p-5 sm:p-8 border border-slate-100 shadow-xs hover:shadow-md transition-all relative overflow-hidden group flex flex-col justify-between min-h-[260px] sm:min-h-[300px]"
        >
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-50 text-[#4f46e5] rounded-2xl flex items-center justify-center border border-indigo-100/70 shadow-2xs group-hover:scale-105 transition-transform">
                <BookOpen size={22} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#4f46e5] block">Selamat Datang</span>
                <span className="text-xs font-bold text-slate-400">Panduan &amp; Adaptasi</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                Buku Saku <span className="text-[#4f46e5] font-serif italic">Warga Baru</span>
              </h3>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                Panduan praktis warga baru &amp; penghuni kontrak: 4 langkah adaptasi awal, jadwal sampah, tata tertib, dan direktori kontak darurat lingkungan.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400 tracking-wider uppercase font-extrabold text-[9px]">SISTEM TERAS RT</span>
              <span className="flex items-center gap-1 text-slate-900 font-extrabold group-hover:text-indigo-600 transition-colors">
                <span>Buka Buku Saku</span>
                <ChevronRight size={15} className="transform group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 4. Jadwal Sampah & Papan Kebersihan Blok */}
      <motion.div variants={itemVariants}>
        <WasteCleanlinessWidget 
          financialSettings={financialSettings}
          onOpenLeaderboard={() => setIsCleanlinessLeaderboardOpen(true)}
        />
      </motion.div>

      {/* 5. Transparansi Layanan & Kinerja Pengurus */}
      <ServiceStats houses={houses} reports={reports} letters={letters} />

      {/* 6. Tagihan & Kas Warga */}
      <motion.div variants={itemVariants}>
        <HouseBillChecker 
          houses={houses} 
          summaries={summaries} 
          financialSettings={financialSettings} 
        />
      </motion.div>

      {/* 7. Interactive Map Section */}
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

      {/* 8. Spotlight Agenda Terdekat */}
      <motion.div variants={itemVariants}>
        <SpotlightAgenda announcements={announcements} />
      </motion.div>

      {/* 9. Warta Warga & Night Patrol Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <AnnouncementsFeed announcements={announcements} />
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6">
          <NightPatrolWidget ronda={ronda} activePatrol={activePatrol} />
        </motion.div>
      </div>

      {/* 10. Gallery Warga */}
      <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-md p-4 sm:p-6 md:p-8 rounded-3xl md:rounded-[3rem] border border-white/50 shadow-2xl shadow-indigo-500/5 group">
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

      {/* Modals */}
      <QuickReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      <CleanlinessLeaderboardModal 
        isOpen={isCleanlinessLeaderboardOpen}
        onClose={() => setIsCleanlinessLeaderboardOpen(false)}
        financialSettings={financialSettings}
      />

      <CommunitySkillsModal 
        isOpen={isSkillsModalOpen}
        onClose={() => setIsSkillsModalOpen(false)}
        skills={communitySkills}
      />

      <UtilityOutageTrackerModal
        isOpen={isOutageModalOpen}
        onClose={() => setIsOutageModalOpen(false)}
        outages={utilityOutages}
      />
    </motion.div>
  );
};
