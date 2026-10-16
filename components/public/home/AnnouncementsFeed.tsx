import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, Share2, ArrowRight, Megaphone } from 'lucide-react';
import { Announcement } from '../../../types';
import { useTenant } from '../../../context/TenantContext';

interface AnnouncementsFeedProps {
  announcements: Announcement[];
}

export const AnnouncementsFeed: React.FC<AnnouncementsFeedProps> = ({ announcements }) => {
  const { currentTenant } = useTenant();
  const [filterType, setFilterType] = useState<'All' | 'General' | 'Urgent' | 'Event' | 'Lelayu'>('All');

  const filteredAnnouncements = announcements.filter(a => filterType === 'All' || a.type === filterType);

  return (
    <div className="space-y-6">
      {/* Editorial Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-100/90 shadow-sm">
        <div>
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-1">Update Terkini</p>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Warta <span className="italic font-serif text-indigo-600">Warga</span>
          </h2>
        </div>
        
        {/* Filter Tabs */}
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

      {/* Feed List */}
      <div className="space-y-4">
        {filteredAnnouncements.map((ann, idx) => {
          const isLelayu = ann.type === 'Lelayu';
          return (
            <motion.div 
              key={ann.id} 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
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
                    <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-400">
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

                  {/* Announcement Quick Action Footer */}
                  <div className="pt-2 flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const text = `📢 *WARTA RESMI ${currentTenant.name.toUpperCase()}*\n\n*${ann.title}*\n📅 Tanggal: ${new Date(ann.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n\n${ann.content}\n\n_Diterbitkan oleh Pengurus ${currentTenant.name}_\n🌐 Buka Portal Warga: ${window.location.origin}`;
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs ${
                        isLelayu 
                          ? 'bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 border border-rose-500/30' 
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80'
                      }`}
                    >
                      <Share2 size={12} />
                      <span>Bagikan ke WhatsApp RT</span>
                    </button>
                  </div>
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
    </div>
  );
};
