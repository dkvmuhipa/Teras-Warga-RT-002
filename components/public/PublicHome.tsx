import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, ChevronRight, ArrowRight, ShieldCheck, 
  BookOpen, Scale, Zap, Radio
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

  const dateObj = new Date();
  const today = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
  const fullDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const todayRonda = ronda.find((r) => r.day === today);

  const handleExplore = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const activeOutage = utilityOutages.find(o => o.status === 'Ongoing');

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8 space-y-8 sm:space-y-10 mb-20 relative">
      {/* Hero Section */}
      <HeroSection onExplore={handleExplore} />

      {/* Live Active Utility Outage Alert Banner */}
      {activeOutage && (
        <div className="bg-amber-50 border border-amber-200 text-amber-950 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0">
              <Zap size={20} />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-200/80 rounded text-[10px] font-semibold text-amber-900 uppercase">
                  Siaga Utilitas
                </span>
                <span className="text-xs text-amber-800 font-medium">
                  {activeOutage.type} &bull; Waktu: {activeOutage.startTime} - {activeOutage.endTime}
                </span>
              </div>
              <h4 className="font-semibold text-sm md:text-base text-amber-950">
                {activeOutage.title}
              </h4>
              <p className="text-xs text-amber-800/90 font-normal line-clamp-1">
                Wilayah Terdampak: {activeOutage.affectedBlocks?.join(', ') || `Semua Blok ${currentTenant.name}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <button
              onClick={() => setIsOutageModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Detail &amp; Lapor Cepat</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Live Info Marquee Banner */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 sm:p-4 text-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 shrink-0 px-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white inline-block"></span>
          <span className="text-xs font-medium text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
            Informasi Terkini {currentTenant.rt ? `RT ${currentTenant.rt}` : 'Warga'}
          </span>
        </div>

        <div className="flex-1 w-full overflow-hidden text-center md:text-left">
          <p className="text-xs text-slate-600 truncate font-normal">
            <span className="font-medium text-slate-900">Ronda malam ini ({today}):</span> {todayRonda && todayRonda.members.length > 0 ? todayRonda.members.slice(0, 3).join(', ') : 'Satgas Siskamling Standby'} &nbsp;&bull;&nbsp; 
            <span className="font-medium text-slate-900">Iuran terkumpul:</span> Rp {(summaries.totalCollected || 0).toLocaleString('id-ID')} &nbsp;&bull;&nbsp;
            <span className="font-medium text-slate-900">Regulasi RT:</span> 13 BAB Peraturan Lingkungan Resmi Disahkan
          </p>
        </div>

        <button 
          onClick={() => navigate('/info')}
          className="shrink-0 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
        >
          <span>Pusat Informasi</span>
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Contextual Section Header */}
      <div ref={contentRef} className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-center sm:text-left border-b border-slate-200/80 pb-4">
        <div>
          <span className="text-xs font-medium text-slate-500 mb-0.5 block">
            {currentTenant.name} &bull; RW 020
          </span>
          <h2 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight">
            Pusat Informasi &amp; Transparansi Lingkungan
          </h2>
          <p className="text-slate-500 font-normal text-xs sm:text-sm mt-0.5">
            Layanan mandiri, jadwal kegiatan, dan transparansi administrasi warga {currentTenant.name}.
          </p>
        </div>
        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-600 shrink-0">
          <Calendar size={13} className="text-slate-500" />
          <span>{today}, {fullDate}</span>
        </div>
      </div>

      {/* 1. Quick Actions - Layanan Warga Terpadu Grid */}
      <QuickActionsGrid 
        onOpenReport={() => setIsReportModalOpen(true)}
        onOpenSkills={() => setIsSkillsModalOpen(true)}
        onOpenOutage={() => setIsOutageModalOpen(true)}
      />

      {/* 2. Digital Summary (Kegiatan & Posyandu) */}
      <DigitalSummary />

      {/* 3. Peraturan RT - RT2LAW & Buku Saku Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* RT2LAW Card */}
        <div 
          onClick={() => navigate('/rules')}
          className="lg:col-span-2 cursor-pointer bg-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xs flex flex-col justify-between min-h-[250px] sm:min-h-[270px] hover:border-slate-700 transition-colors"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-400 text-slate-950 rounded-xl flex items-center justify-center shrink-0">
                  <Scale size={20} strokeWidth={2} />
                </div>
                <div>
                  <span className="text-xs font-medium text-amber-400 block leading-tight">
                    Landasan Hukum {currentTenant.rt ? `RT ${currentTenant.rt}` : 'Warga'}
                  </span>
                  <span className="text-xs text-slate-300">Resmi Disahkan Warga &amp; Pengurus</span>
                </div>
              </div>

              <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-amber-300 rounded-lg text-xs font-medium flex items-center gap-1.5">
                13 BAB Resmi
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <h3 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                RT2LAW
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm font-normal leading-relaxed max-w-xl">
                Konstitusi dan tata tertib lingkungan 13 BAB yang mengatur norma sosial, ketertiban ronda, hingga sanksi keberadaban demi keharmonisan bersama.
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-slate-400" /> Kelurahan {currentTenant.kelurahan} &bull; {currentTenant.city}
            </span>
            <span className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors">
              <span>Buka Regulasi</span>
              <ChevronRight size={14} />
            </span>
          </div>
        </div>

        {/* Companion Card: Buku Saku Warga Baru */}
        <div 
          onClick={() => navigate('/welcome')}
          className="lg:col-span-1 cursor-pointer bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between min-h-[250px] sm:min-h-[270px]"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center shrink-0 border border-slate-200/80">
                <BookOpen size={18} />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 block">Panduan Adaptasi</span>
                <span className="text-xs font-semibold text-slate-800">Warga Baru &amp; Kontrak</span>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <h3 className="text-xl font-semibold text-slate-900 leading-tight">
                Buku Saku Warga Baru
              </h3>
              <p className="text-xs font-normal text-slate-500 leading-relaxed">
                Panduan praktis warga baru &amp; penghuni kontrak: 4 langkah adaptasi awal, jadwal sampah, tata tertib, dan direktori kontak lingkungan.
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Panduan Resmi</span>
              <span className="flex items-center gap-1 text-slate-900 font-medium hover:text-slate-700 transition-colors">
                <span>Buka Buku Saku</span>
                <ChevronRight size={14} />
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

      {/* 7. Interactive Map Section */}
      <div className="w-full bg-slate-50 border border-slate-200/80 p-3.5 rounded-3xl shadow-xs">
        <HouseMap 
          houses={houses} 
          isAdmin={false} 
          reports={reports} 
          officials={officials} 
          mapPoints={mapPoints}
          onReportHouse={(house: House) => navigate(`/services?tab=lapor&houseId=${house.id}`)} 
        />
      </div>

      {/* 8. Spotlight Agenda Terdekat */}
      <div>
        <SpotlightAgenda announcements={announcements} />
      </div>

      {/* 9. Warta Warga & Night Patrol Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <AnnouncementsFeed announcements={announcements} />
        </div>

        <div className="space-y-6">
          <NightPatrolWidget ronda={ronda} activePatrol={activePatrol} />
        </div>
      </div>

      {/* 10. Gallery Warga */}
      <div className="bg-white p-5 sm:p-7 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-6 px-1">
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Dokumentasi &amp; Galeri Lingkungan</h3>
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <ArrowRight size={15} />
          </div>
        </div>
        {gallery.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {gallery.slice(0, 4).map((item) => (
              <div 
                key={item.id} 
                className="relative aspect-[4/5] rounded-2xl overflow-hidden group/img cursor-pointer border border-slate-200/80 bg-slate-100"
              >
                <SmartImage 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover" 
                  width={400}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-end p-4 pointer-events-none">
                  <p className="text-xs text-white font-medium leading-tight">
                    {item.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 text-xs font-normal border border-dashed border-slate-200 rounded-2xl">
            Galeri kegiatan lingkungan belum memiliki dokumentasi
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
