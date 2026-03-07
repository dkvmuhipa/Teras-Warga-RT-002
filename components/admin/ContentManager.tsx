import React, { useState } from 'react';
import { Megaphone, Vote, ShoppingBag, Image } from 'lucide-react';
import { Announcement, Poll, UMKM, GalleryItem } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { AnnouncementManagement } from './AnnouncementManagement';
import { PollManagement } from './PollManagement';
import { UmkmManagement } from './UmkmManagement';
import { GalleryManagement } from './GalleryManagement';

interface ContentManagerProps {
  announcements: Announcement[];
  polls: Poll[];
  umkm: UMKM[];
  gallery: GalleryItem[];
}

export const ContentManager: React.FC<ContentManagerProps> = ({ announcements, polls, umkm, gallery }) => {
  const [activeTab, setActiveTab] = useState<'announcements' | 'polls' | 'umkm' | 'gallery'>('announcements');

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
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 px-2">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            {activeTab === 'announcements' && <Megaphone size={24} />}
            {activeTab === 'polls' && <Vote size={24} />}
            {activeTab === 'umkm' && <ShoppingBag size={24} />}
            {activeTab === 'gallery' && <Image size={24} />}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">
              {activeTab === 'announcements' && 'Konten Pengumuman'}
              {activeTab === 'polls' && 'Konten Voting'}
              {activeTab === 'umkm' && 'Konten UMKM'}
              {activeTab === 'gallery' && 'Konten Galeri'}
            </h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Manajemen Konten</p>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200/50 shadow-inner w-full md:w-auto overflow-x-auto">
          {[
            { id: 'announcements', icon: Megaphone, label: 'Pengumuman' },
            { id: 'polls', icon: Vote, label: 'Voting' },
            { id: 'umkm', icon: ShoppingBag, label: 'UMKM' },
            { id: 'gallery', icon: Image, label: 'Galeri' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
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
          {activeTab === 'announcements' && <AnnouncementManagement announcements={announcements} />}
          {activeTab === 'polls' && <PollManagement polls={polls} />}
          {activeTab === 'umkm' && <UmkmManagement umkm={umkm} />}
          {activeTab === 'gallery' && <GalleryManagement gallery={gallery} />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
