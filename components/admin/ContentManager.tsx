import React, { useState } from 'react';
import { Megaphone, Vote, ShoppingBag, Image, BookOpen, Calendar, HelpCircle } from 'lucide-react';
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

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Navigation Tabs */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 px-2 w-full lg:w-auto">
          <div className="p-2.5 md:p-3 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl">
            {activeTab === 'announcements' && <Megaphone size={20} className="md:w-6 md:h-6" />}
            {activeTab === 'news' && <BookOpen size={20} className="md:w-6 md:h-6" />}
            {activeTab === 'polls' && <Vote size={20} className="md:w-6 md:h-6" />}
            {activeTab === 'umkm' && <ShoppingBag size={20} className="md:w-6 md:h-6" />}
            {activeTab === 'gallery' && <Image size={20} className="md:w-6 md:h-6" />}
            {activeTab === 'events' && <Calendar size={20} className="md:w-6 md:h-6" />}
            {activeTab === 'faq' && <HelpCircle size={20} className="md:w-6 md:h-6" />}
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
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Manajemen Konten</p>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl sm:rounded-[1.5rem] border border-slate-200/50 shadow-inner w-full lg:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'announcements', icon: Megaphone, label: 'Pengumuman' },
            { id: 'news', icon: BookOpen, label: 'Berita' },
            { id: 'events', icon: Calendar, label: 'Acara' },
            { id: 'polls', icon: Vote, label: 'Voting' },
            { id: 'umkm', icon: ShoppingBag, label: 'UMKM' },
            { id: 'gallery', icon: Image, label: 'Galeri' },
            { id: 'faq', icon: HelpCircle, label: 'FAQ' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-2xl text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <tab.icon size={14} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
              <span className={activeTab === tab.id ? 'inline' : 'hidden sm:inline'}>{tab.label}</span>
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
