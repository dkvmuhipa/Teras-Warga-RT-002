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
      {/* Information Center Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[2rem] p-6 md:p-8 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
              <Sparkles size={11} className="animate-pulse" /> Pusat Informasi & Media Digital
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              Portal Pengelolaan Media Hub <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-violet-300">Warga RT 02</span>
            </h1>
            <p className="text-slate-400 text-xs md:text-sm max-w-2xl font-medium">
              Satu portal terpadu untuk menyiarkan pengumuman, menerbitkan cerita berita, mengadakan voting mufakat warga, mendata produk UMKM lokal, dan mengelola galeri dokumentasi kegiatan.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-2 bg-slate-950/40 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
            <Layers className="text-indigo-400" size={24} />
            <div className="text-left">
              <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">Metrik Terdistribusi</p>
              <p className="text-xs font-bold text-slate-200">7 Kategori Berkas Publik</p>
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
            className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between gap-4 group transition-all"
          >
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{stat.count}</p>
              <p className="text-[9px] text-slate-500 font-medium">{stat.desc}</p>
            </div>
            <div className={`p-3 rounded-2xl border shrink-0 ${stat.color} transition-all duration-350`}>
              <stat.icon size={20} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-col xl:flex-row justify-between items-center gap-6 bg-white p-4 md:p-5 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 px-2 w-full xl:w-auto">
          <div className="p-2.5 md:p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            {activeTab === 'announcements' && <Megaphone size={20} className="md:w-5 md:h-5 text-indigo-600" />}
            {activeTab === 'news' && <BookOpen size={20} className="md:w-5 md:h-5 text-indigo-600" />}
            {activeTab === 'polls' && <Vote size={20} className="md:w-5 md:h-5 text-indigo-600" />}
            {activeTab === 'umkm' && <ShoppingBag size={20} className="md:w-5 md:h-5 text-indigo-600" />}
            {activeTab === 'gallery' && <Image size={20} className="md:w-5 md:h-5 text-indigo-600" />}
            {activeTab === 'events' && <Calendar size={20} className="md:w-5 md:h-5 text-indigo-600" />}
            {activeTab === 'faq' && <HelpCircle size={20} className="md:w-5 md:h-5 text-indigo-600" />}
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-slate-800 tracking-tight">
              {activeTab === 'announcements' && 'Konten Pengumuman'}
              {activeTab === 'news' && 'Konten Berita'}
              {activeTab === 'polls' && 'Konten Voting'}
              {activeTab === 'umkm' && 'Konten UMKM'}
              {activeTab === 'gallery' && 'Konten Galeri'}
              {activeTab === 'events' && 'Konten Acara'}
              {activeTab === 'faq' && 'Konten FAQ'}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Modul Media Aktif</p>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200/50 shadow-inner w-full xl:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'announcements', icon: Megaphone, label: 'Pengumuman', count: announcements.length },
            { id: 'news', icon: BookOpen, label: 'Berita', count: news.length },
            { id: 'events', icon: Calendar, label: 'Acara', count: events.length },
            { id: 'polls', icon: Vote, label: 'Voting', count: polls.length },
            { id: 'umkm', icon: ShoppingBag, label: 'UMKM', count: umkm.length },
            { id: 'gallery', icon: Image, label: 'Galeri', count: gallery.length },
            { id: 'faq', icon: HelpCircle, label: 'FAQ', count: faqItems.length }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 md:px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-white text-indigo-600 shadow-md border border-slate-100' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <tab.icon size={13} className="shrink-0" />
              <span>{tab.label}</span>
              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'bg-slate-200/60 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
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
