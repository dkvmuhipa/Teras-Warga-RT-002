import React, { useState } from 'react';
import { Megaphone, Vote, ShoppingBag, Image, BookOpen, Calendar, HelpCircle, Sparkles, Layers, ArrowRight } from 'lucide-react';
import { Announcement, News, Poll, UMKM, GalleryItem, AppEvent, FAQItem, House, PdfConfig } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { AnnouncementManagement } from './AnnouncementManagement';
import { NewsManagement } from './NewsManagement';
import { PollManagement } from './PollManagement';
import { UmkmManagement } from './UmkmManagement';
import { GalleryManagement } from './GalleryManagement';
import { EventManager } from './EventManager';
import { FAQManagement } from './FAQManagement';

interface ContentManagerProps {
  announcements: Announcement[];
  news: News[];
  polls: Poll[];
  umkm: UMKM[];
  gallery: GalleryItem[];
  events: AppEvent[];
  faqItems: FAQItem[];
  houses: House[];
  pdfConfig: PdfConfig;
  initialTab?: 'announcements' | 'news' | 'polls' | 'umkm' | 'gallery' | 'events' | 'faq';
}

export const ContentManager: React.FC<ContentManagerProps> = ({ 
  announcements, news, polls, umkm, gallery, events, faqItems, houses, pdfConfig,
  initialTab = 'announcements'
}) => {
  const [activeTab, setActiveTab] = useState<'announcements' | 'news' | 'polls' | 'umkm' | 'gallery' | 'events' | 'faq'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const getStats = () => {
    return [
      { label: 'Pengumuman Resmi', count: announcements.length, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: Megaphone, desc: 'Informasi warga penting' },
      { label: 'Kanal Berita', count: news.length, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: BookOpen, desc: 'Artikel & liputan warga' },
      { label: 'Voting / Polls', count: polls.length, color: 'text-violet-600 bg-violet-50 border-violet-100', icon: Vote, desc: 'Aspirasi & mufakat' },
      { label: 'Mitra UMKM', count: umkm.length, color: 'text-amber-600 bg-amber-50 border-amber-100', icon: ShoppingBag, desc: 'Ekonomi kreatif lokal' },
    ];
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Futuristic Media Hub Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[2.5rem] p-6 md:p-8 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>LIVE MEDIA BROADCASTER</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              Pusat Informasi & Studio Penyiaran Digital <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-violet-300">RT 02</span>
            </h1>
            <p className="text-slate-400 text-xs md:text-sm max-w-2xl font-medium leading-relaxed">
              Portal berita resmi warga RT 02 untuk siaran pengumuman darurat, artikel berita lingkungan, polling musyawarah mufakat, katalog UMKM warga, dan galeri dokumentasi kegiatan.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl backdrop-blur-md shrink-0 shadow-lg">
            <div className="p-3 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Layers size={22} className="animate-pulse" />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Kapasitas Media</p>
              <p className="text-xs font-black text-slate-100">7 Saluran Penyiaran Aktif</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {getStats().map((stat, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md flex items-center justify-between gap-4 group transition-all"
          >
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl md:text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{stat.count}</p>
              <p className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider">{stat.desc}</p>
            </div>
            <div className={`p-3.5 rounded-2xl border shrink-0 ${stat.color} transition-all duration-350 shadow-sm`}>
              <stat.icon size={22} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Executive Media Category Selector */}
      <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl shadow-md shadow-indigo-100 shrink-0">
              {activeTab === 'announcements' && <Megaphone size={18} />}
              {activeTab === 'news' && <BookOpen size={18} />}
              {activeTab === 'polls' && <Vote size={18} />}
              {activeTab === 'umkm' && <ShoppingBag size={18} />}
              {activeTab === 'gallery' && <Image size={18} />}
              {activeTab === 'events' && <Calendar size={18} />}
              {activeTab === 'faq' && <HelpCircle size={18} />}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                {activeTab === 'announcements' && 'Pengumuman Resmi & Broadcast WA'}
                {activeTab === 'news' && 'Kanal Berita & Artikel Lingkungan'}
                {activeTab === 'polls' && 'Voting & Musyawarah Mufakat'}
                {activeTab === 'umkm' && 'Katalog Ekonomi UMKM Warga'}
                {activeTab === 'gallery' && 'Dokumentasi & Galeri Foto'}
                {activeTab === 'events' && 'Agenda & Kalender Kegiatan RT'}
                {activeTab === 'faq' && 'Pusat Bantuan & FAQ Warga'}
              </h2>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">Pilih Saluran Informasi Publik</p>
            </div>
          </div>

          <div className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-black text-indigo-700 uppercase tracking-wider shrink-0">
            {activeTab.toUpperCase()} ACTIVE
          </div>
        </div>

        {/* 7 Interactive Ultra-Modern Category Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {[
            { id: 'announcements', icon: Megaphone, label: 'Pengumuman', count: announcements.length, color: 'text-indigo-600' },
            { id: 'news', icon: BookOpen, label: 'Berita', count: news.length, color: 'text-emerald-600' },
            { id: 'events', icon: Calendar, label: 'Acara RT', count: events.length, color: 'text-orange-600' },
            { id: 'polls', icon: Vote, label: 'Voting', count: polls.length, color: 'text-violet-600' },
            { id: 'umkm', icon: ShoppingBag, label: 'UMKM', count: umkm.length, color: 'text-amber-600' },
            { id: 'gallery', icon: Image, label: 'Galeri', count: gallery.length, color: 'text-pink-600' },
            { id: 'faq', icon: HelpCircle, label: 'FAQ', count: faqItems.length, color: 'text-sky-600' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  p-3 rounded-2xl border transition-all text-left flex flex-col justify-between h-20 group relative overflow-hidden
                  ${isActive 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-950/20 scale-[1.02]' 
                    : 'bg-slate-50/70 border-slate-200/80 text-slate-700 hover:bg-white hover:border-indigo-300 hover:shadow-xs'}
                `}
              >
                <div className="flex items-center justify-between">
                  <tab.icon size={15} className={isActive ? 'text-indigo-400' : tab.color} />
                  <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                    isActive ? 'bg-indigo-500/30 text-indigo-300' : 'bg-slate-200/70 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </div>
                <span className={`text-[11px] font-black tracking-tight leading-none ${isActive ? 'text-white' : 'text-slate-800'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {activeTab === 'announcements' && <AnnouncementManagement announcements={announcements} houses={houses} pdfConfig={pdfConfig} />}
          {activeTab === 'news' && <NewsManagement news={news} />}
          {activeTab === 'polls' && <PollManagement polls={polls} />}
          {activeTab === 'umkm' && <UmkmManagement umkm={umkm} />}
          {activeTab === 'gallery' && <GalleryManagement gallery={gallery} />}
          {activeTab === 'events' && <EventManager events={events} />}
          {activeTab === 'faq' && <FAQManagement faqItems={faqItems} />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
