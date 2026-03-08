import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, ShoppingCart, Vote, AlertTriangle, Megaphone, 
  Clock, Moon, Calendar, ChevronRight, ArrowRight 
} from 'lucide-react';
import { motion } from 'motion/react';
import { House, Announcement, Report, Official, RondaSchedule, GalleryItem } from '../../types';
import { HeroSection } from '../HeroSection';
import { HouseMap } from '../HouseMap';
import { Card } from '../ui/Card';

interface PublicHomeProps {
  houses: House[];
  announcements: Announcement[];
  ronda: RondaSchedule[];
  reports: Report[];
  officials: Official[];
  gallery: GalleryItem[];
}

export const PublicHome: React.FC<PublicHomeProps> = ({ 
  houses, announcements, ronda, reports, officials, gallery
}) => {
  const navigate = useNavigate();
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

  const quickActions = [
    { label: 'Buat Surat', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', link: '/services' },
    { label: 'Pasar Warga', icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', link: '/market' },
    { label: 'E-Voting', icon: Vote, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', link: '/voting' },
    { label: 'Dokumen', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', link: '/dokumen' },
    { label: 'Lapor Warga', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', link: '/services?tab=lapor' }
  ];

  const [filterType, setFilterType] = React.useState<'All' | 'General' | 'Urgent' | 'Event'>('All');

  const filteredAnnouncements = announcements.filter(a => filterType === 'All' || a.type === filterType);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-8 mb-24"
    >
      <HeroSection />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 -mt-4 relative z-10">
        {quickActions.map((action, idx) => (
          <motion.button
            key={idx}
            variants={itemVariants}
            onClick={() => navigate(action.link)}
            className={`
              flex flex-col items-center justify-center gap-3 p-6 
              bg-white rounded-[2rem] shadow-sm border ${action.border}
              hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 
              transition-all duration-300 group
            `}
          >
            <div className={`
              p-4 rounded-2xl ${action.bg} ${action.color} 
              group-hover:scale-110 transition-transform duration-300
            `}>
              <action.icon size={28} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-slate-700 text-sm group-hover:text-slate-900">
              {action.label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Map Section */}
      <motion.div variants={itemVariants} className="w-full bg-white p-2 rounded-[2.5rem] shadow-sm border border-slate-100">
        <HouseMap 
          houses={houses} 
          isAdmin={false} 
          reports={reports} 
          officials={officials} 
          onReportHouse={(house: House) => navigate(`/services?tab=lapor&houseId=${house.id}`)} 
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Announcements */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
                <Megaphone size={24} />
              </div>
              Info Terbaru
            </h2>
            
            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'All', label: 'Semua' },
                { id: 'Urgent', label: 'Penting' },
                { id: 'Event', label: 'Acara' },
                { id: 'General', label: 'Info' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterType === tab.id 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredAnnouncements.map((ann) => (
              <motion.div 
                key={ann.id} 
                whileHover={{ scale: 1.01 }}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`
                    px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border
                    ${ann.type === 'Urgent' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                      ann.type === 'Event' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                      'bg-slate-50 text-slate-600 border-slate-100'}
                  `}>
                    {ann.type}
                  </span>
                  <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                    <Clock size={14} /> 
                    {new Date(ann.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                  {ann.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-line">
                  {ann.content}
                </p>
              </motion.div>
            ))}
            {filteredAnnouncements.length === 0 && (
              <div className="text-center p-12 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-bold">Tidak ada pengumuman untuk kategori ini.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Sidebar Widgets */}
        <motion.div variants={itemVariants} className="space-y-8">
          {/* Ronda Widget */}
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
              <Moon size={140} />
            </div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/30 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="mb-6 pb-6 border-b border-white/10 flex justify-between items-end">
                <div>
                  <p className="text-4xl font-black text-emerald-400 leading-none mb-2">{today}</p>
                  <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
                    <Calendar size={14}/> {fullDate}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-xl border border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Shift Malam</span>
                </div>
              </div>

              <div className="space-y-4">
                {todayRonda && (todayRonda.shifts || todayRonda.members.length > 0) ? (
                  todayRonda.shifts ? (
                    todayRonda.shifts.map((shift, i) => (
                      <div key={shift.id} className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-1">
                            <Clock size={10} /> {shift.time}
                          </p>
                          <span className="text-[8px] font-black bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 uppercase">Shift {i+1}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {shift.members.map((member, j) => (
                            <span key={j} className="text-[11px] font-bold text-white/90 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                              {member}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    todayRonda.members.map((member, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs border border-emerald-500/30">
                          {i + 1}
                        </div>
                        <span className="font-bold text-sm tracking-wide">{member}</span>
                      </div>
                    ))
                  )
                ) : (
                  <div className="text-center py-6 border border-dashed border-slate-700 rounded-2xl text-slate-500 text-sm font-medium">
                    Jadwal belum diatur.
                  </div>
                )}
              </div>

              <button 
                onClick={() => navigate('/info')} 
                className="mt-8 w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
              >
                Lihat Jadwal Lengkap <ChevronRight size={14}/>
              </button>
            </div>
          </div>

          {/* Gallery Widget */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6 px-2">Galeri Kegiatan</h3>
            {gallery.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {gallery.slice(0, 4).map((item) => (
                  <div key={item.id} className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <span className="text-[10px] text-white font-bold line-clamp-2 leading-tight">
                        {item.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm font-medium border-2 border-dashed border-slate-100 rounded-2xl">
                Galeri masih kosong
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
