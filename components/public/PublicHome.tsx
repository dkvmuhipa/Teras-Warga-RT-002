import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, ChevronRight, ArrowRight, ShieldCheck, 
  BookOpen, Scale, Zap, MapPin, Home
} from 'lucide-react';
import { 
  House, Announcement, Report, Official, RondaSchedule, 
  GalleryItem, PatrolSession, LetterRequest, MapPoint, 
  CommunitySkill, UtilityOutage 
} from '../../types';
import { HeroSection } from '../HeroSection';
import { DigitalSummary } from './DigitalSummary';
import { ServiceStats } from '../ServiceStats';
import { SmartImage } from '../SmartImage';
import { useFinancial } from '../../context/FinancialContext';
import { useTenant } from '../../context/TenantContext';
import { subscribeToCollection } from '../../services/databaseService';
import { UtilityOutageTrackerModal } from './UtilityOutageTrackerModal';

// Modular Home Subcomponents
import { QuickActionsGrid } from './home/QuickActionsGrid';
import { HouseBillChecker } from './home/HouseBillChecker';
import { WasteCleanlinessWidget } from './home/WasteCleanlinessWidget';
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
  houses, announcements, ronda, reports, letters, gallery, activePatrol
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

  const handleExplore = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const activeOutage = utilityOutages.find(o => o.status === 'Ongoing');
  const occupiedCount = houses.filter(h => h.status === 'Occupied').length;

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8 space-y-8 sm:space-y-10 mb-20 relative">
      {/* Hero Section */}
      <HeroSection onExplore={handleExplore} />

      {/* Live Active Utility Outage Alert Banner */}
      {activeOutage && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white rounded-3xl p-4 md:p-5 shadow-lg shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/20">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shrink-0">
              <Zap size={22} className="text-amber-200" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-black/30 rounded-md text-[10px] font-bold uppercase tracking-wider text-amber-200">
                  Siaga Utilitas Aktif
                </span>
                <span className="text-xs font-semibold text-amber-100">
                  {activeOutage.type} &bull; Waktu: {activeOutage.startTime} - {activeOutage.endTime}
                </span>
              </div>
              <h4 className="font-bold text-sm md:text-base leading-snug">
                {activeOutage.title}
              </h4>
              <p className="text-xs text-amber-100/90 font-medium line-clamp-1">
                Wilayah Terdampak: {activeOutage.affectedBlocks?.join(', ') || `Semua Blok ${currentTenant.name}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <button
              onClick={() => setIsOutageModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-amber-50 text-slate-900 rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Detail &amp; Lapor Cepat</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Live Info Marquee Banner */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-slate-200/80 shadow-xs text-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 shrink-0 px-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 inline-block"></span>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full flex items-center gap-1">
            Informasi Terkini {currentTenant.rt ? `RT ${currentTenant.rt}` : 'Warga'}
          </span>
        </div>

        <div className="flex-1 w-full overflow-hidden text-center md:text-left">
          <p className="text-xs text-slate-600 truncate font-medium">
            <span className="font-bold text-slate-900">Ronda malam ini ({today}):</span> {todayRonda && todayRonda.members.length > 0 ? todayRonda.members.slice(0, 3).join(', ') : 'Satgas Siskamling Standby'} &nbsp;&bull;&nbsp; 
            <span className="font-bold text-emerald-700">Iuran terkumpul:</span> Rp {(summaries.totalCollected || 0).toLocaleString('id-ID')} &nbsp;&bull;&nbsp;
            <span className="font-bold text-amber-700">Regulasi RT:</span> 13 BAB Peraturan Lingkungan Resmi Disahkan
          </p>
        </div>

        <button 
          onClick={() => navigate('/info')}
          className="shrink-0 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
        >
          <span>Pusat Info</span>
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Layanan Warga Mandiri Header */}
      <div ref={contentRef} className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-center sm:text-left border-b border-slate-200/60 pb-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-0.5 block">
            {currentTenant.name} &bull; Akses Cepat
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Layanan Warga <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Mandiri</span>
          </h2>
        </div>
      </div>

      {/* 1. Quick Actions - Layanan Warga Terpadu Grid (12 Inti) */}
      <QuickActionsGrid 
        onOpenReport={() => setIsReportModalOpen(true)}
        onOpenSkills={() => setIsSkillsModalOpen(true)}
        onOpenOutage={() => setIsOutageModalOpen(true)}
      />

      {/* 2. Digital Summary (Kegiatan & Posyandu) */}
      <DigitalSummary />

      {/* 3. Peraturan RT - RT2LAW & Buku Saku Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RT2LAW Card */}
        <div 
          onClick={() => navigate('/rules')}
          className="lg:col-span-2 cursor-pointer bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 md:p-10 text-white border border-slate-800 shadow-xs relative overflow-hidden group flex flex-col justify-between min-h-[260px] sm:min-h-[290px] hover:border-indigo-500/40 transition-colors"
        >
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center shadow-xs">
                  <Scale size={24} strokeWidth={2.4} />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block leading-tight">
                    Landasan Hukum {currentTenant.rt ? `RT ${currentTenant.rt}` : 'Warga'}
                  </span>
                  <span className="text-xs font-semibold text-slate-300">Resmi Disahkan Warga &amp; Pengurus</span>
                </div>
              </div>

              <span className="px-3.5 py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-full text-xs font-bold flex items-center gap-1.5">
                13 BAB Resmi
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                RT2<span className="text-amber-400">LAW</span>
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed max-w-xl">
                Konstitusi &amp; Tata Tertib Lingkungan Terpadu 13 BAB yang mengatur norma sosial, ketertiban ronda, hingga sanksi keberadaban demi keharmonisan bersama.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-slate-400 font-bold text-xs flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-amber-400" /> Kelurahan {currentTenant.kelurahan} &bull; {currentTenant.city}
            </span>
            <span className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors">
              <span>Buka Regulasi</span>
              <ChevronRight size={15} strokeWidth={2.5} />
            </span>
          </div>
        </div>

        {/* Companion Card: Buku Saku Warga Baru */}
        <div 
          onClick={() => navigate('/welcome')}
          className="lg:col-span-1 cursor-pointer bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs hover:shadow-md transition-colors relative overflow-hidden group flex flex-col justify-between min-h-[260px] sm:min-h-[290px]"
        >
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-50 text-[#4f46e5] rounded-2xl flex items-center justify-center border border-indigo-100/70 shadow-2xs">
                <BookOpen size={22} />
              </div>
              <div>
                <span className="text-xs font-bold text-[#4f46e5] block">Selamat Datang</span>
                <span className="text-xs font-semibold text-slate-400">Panduan &amp; Adaptasi</span>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                Buku Saku <span className="text-[#4f46e5]">Warga Baru</span>
              </h3>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                Panduan praktis warga baru &amp; penghuni kontrak: 4 langkah adaptasi awal, jadwal sampah, tata tertib, dan direktori kontak darurat lingkungan.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400 font-semibold">Sistem Teras RT</span>
              <span className="flex items-center gap-1 text-slate-900 font-bold group-hover:text-indigo-600 transition-colors">
                <span>Buka Buku Saku</span>
                <ChevronRight size={15} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Jadwal Sampah & Papan Kebersihan Blok */}
      <div>
        <WasteCleanlinessWidget 
          financialSettings={financialSettings}
          onOpenLeaderboard={() => setIsCleanlinessLeaderboardOpen(true)}
        />
      </div>

      {/* 5. Transparansi Layanan & Kinerja Pengurus */}
      <ServiceStats houses={houses} reports={reports} letters={letters} />

      {/* 6. Tagihan & Kas Warga */}
      <div>
        <HouseBillChecker 
          houses={houses} 
          summaries={summaries} 
          financialSettings={financialSettings} 
        />
      </div>

      {/* 7. Compact Peta Wilayah & Mitigasi Gateway (Replaces Heavy Full Map Render on Home) */}
      <div 
        onClick={() => navigate('/peta')}
        className="w-full cursor-pointer bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xs hover:border-indigo-500/40 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group"
      >
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0">
            <MapPin size={26} />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                Digital Twin RT 02
              </span>
              <span className="text-xs font-mono tabular-nums text-slate-400">
                <Home size={12} className="inline mr-1 text-emerald-400" />
                {occupiedCount} / {houses.length} Unit Dihuni (Blok C5–C12)
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Peta Interaktif Wilayah &amp; Mitigasi Kawasan
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl">
              Telusuri denah kavling rumah Blok C5–C12, titik pos siskamling, hidran darurat, jalur evakuasi bencana, serta pantauan gempa BMKG secara langsung.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="w-full md:w-auto shrink-0 px-5 py-3 bg-indigo-600 group-hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <span>Buka Peta Kawasan</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {/* 8. Warta Warga & Night Patrol Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          <AnnouncementsFeed announcements={announcements} />
        </div>

        <div className="space-y-6">
          <NightPatrolWidget ronda={ronda} activePatrol={activePatrol} />
        </div>
      </div>

      {/* 9. Gallery Warga */}
      <div className="bg-white/90 backdrop-blur-md p-5 sm:p-7 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-6 px-1">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Galeri <span className="text-indigo-600">Warga</span></h3>
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <ArrowRight size={15} />
          </div>
        </div>
        {gallery.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gallery.slice(0, 4).map((item) => (
              <div 
                key={item.id} 
                className="relative aspect-[4/5] rounded-2xl overflow-hidden group/img cursor-pointer border border-slate-200/80 shadow-2xs"
              >
                <SmartImage 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover" 
                  width={400}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-end p-4 pointer-events-none">
                  <p className="text-xs text-white font-bold leading-tight">
                    {item.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 text-xs font-semibold border-2 border-dashed border-slate-100 rounded-2xl">
            Galeri masih kosong
          </div>
        )}
      </div>

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
    </div>
  );
};
