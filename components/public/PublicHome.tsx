import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, ShoppingCart, Vote, AlertTriangle, Megaphone, 
  Clock, Moon, Calendar, ChevronRight, ArrowRight, ShieldCheck, UserPlus, ShieldAlert
} from 'lucide-react';
import { motion } from 'motion/react';
import { House, Announcement, Report, Official, RondaSchedule, GalleryItem, PatrolSession } from '../../types';
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
  activePatrol: PatrolSession | null;
}

export const PublicHome: React.FC<PublicHomeProps> = ({ 
  houses, announcements, ronda, reports, officials, gallery, activePatrol
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
    { label: 'Lapor Tamu', icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', link: '/services?tab=tamu' },
    { label: 'Warga Baru', icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', link: '/register' },
    { label: 'Pasar Warga', icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', link: '/market' },
    { label: 'E-Voting', icon: Vote, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', link: '/voting' },
    { label: 'Lapor Warga', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', link: '/services?tab=lapor' }
  ];

  const [filterType, setFilterType] = React.useState<'All' | 'General' | 'Urgent' | 'Event'>('All');

  const filteredAnnouncements = announcements.filter(a => filterType === 'All' || a.type === filterType);

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

      <HeroSection />

      {/* Quick Actions - Bento Style */}
      <div className="flex md:grid md:grid-cols-6 gap-4 -mt-8 relative z-10 overflow-x-auto no-scrollbar pb-4 md:pb-0 px-2 md:px-0">
        {quickActions.map((action, idx) => (
          <motion.button
            key={idx}
            variants={itemVariants}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(action.link)}
            className={`
              flex flex-col items-center justify-center gap-3 p-5 min-w-[140px] md:min-w-0
              bg-white/80 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-200/40 border ${action.border}
              transition-all duration-500 group relative overflow-hidden flex-shrink-0 md:flex-shrink
            `}
          >
            <div className={`absolute inset-0 ${action.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className={`
              relative z-10 p-3 rounded-2xl ${action.bg} ${action.color} 
              group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm
            `}>
              <action.icon size={24} strokeWidth={2.5} />
            </div>
            <span className="relative z-10 font-black text-slate-700 text-xs uppercase tracking-widest group-hover:text-slate-900 transition-colors">
              {action.label}
            </span>
          </motion.button>
        ))}
      </div>

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
          onReportHouse={(house: House) => navigate(`/services?tab=lapor&houseId=${house.id}`)} 
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Announcements - Editorial Style */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-slate-200 pb-6">
            <div>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2">Update Terkini</p>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                Warta <span className="italic font-serif text-indigo-600">Warga</span>
              </h2>
            </div>
            
            {/* Filter Tabs - Modern */}
            <div className="flex bg-slate-100/80 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200">
              {[
                { id: 'All', label: 'Semua' },
                { id: 'Urgent', label: 'Penting' },
                { id: 'Event', label: 'Acara' },
                { id: 'General', label: 'Info' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id as any)}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    filterType === tab.id 
                      ? 'bg-white text-indigo-600 shadow-md' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredAnnouncements.map((ann, idx) => (
              <motion.div 
                key={ann.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ x: 10 }}
                className="bg-white/80 backdrop-blur-sm p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <span className={`
                        px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border
                        ${ann.type === 'Urgent' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                          ann.type === 'Event' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                          'bg-indigo-50 text-indigo-600 border-indigo-100'}
                      `}>
                        {ann.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12} strokeWidth={3} /> 
                        {new Date(ann.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-4 group-hover:text-indigo-600 transition-colors leading-tight">
                      {ann.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-line line-clamp-3 group-hover:line-clamp-none transition-all duration-500">
                      {ann.content}
                    </p>
                  </div>
                  <div className="md:pt-1">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {filteredAnnouncements.length === 0 && (
              <div className="text-center p-20 bg-white/40 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-slate-200">
                <Megaphone size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Belum ada kabar terbaru</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Sidebar Widgets - Specialist Tool Style */}
        <motion.div variants={itemVariants} className="space-y-10">
          {/* Ronda Widget - Hardware Style */}
          <div className="bg-slate-950 text-white p-10 rounded-[3rem] shadow-2xl shadow-slate-900/40 relative overflow-hidden group border border-white/5">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity duration-700 rotate-12">
              <Moon size={180} />
            </div>
            
            <div className="relative z-10">
              {activePatrol && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl backdrop-blur-md"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Live Patrol</span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                      {new Date(activePatrol.startTime).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-inner">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <p className="font-black text-white text-lg leading-tight tracking-tight">{activePatrol.officerName}</p>
                      <p className="text-[10px] text-emerald-400/60 font-black uppercase tracking-widest mt-1">Petugas Aktif</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="mb-8 pb-8 border-b border-white/10 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Jadwal Ronda</p>
                  <p className="text-5xl font-black text-white leading-none tracking-tighter mb-3">{today}</p>
                  <p className="text-xs text-slate-500 font-bold flex items-center gap-2">
                    <Calendar size={14} className="text-indigo-500" /> {fullDate}
                  </p>
                </div>
                <div className="bg-indigo-600/20 backdrop-blur-md px-5 py-2 rounded-2xl border border-indigo-500/30">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Shift Malam</span>
                </div>
              </div>

              <div className="space-y-4">
                {todayRonda && (todayRonda.shifts || todayRonda.members.length > 0) ? (
                  todayRonda.shifts ? (
                    todayRonda.shifts.map((shift, i) => (
                      <div key={shift.id} className="space-y-3 p-5 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-500 group/shift">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Clock size={12} strokeWidth={3} /> {shift.time}
                          </p>
                          <span className="text-[9px] font-black bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30 uppercase tracking-widest">Shift {i+1}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {shift.members.map((member, j) => (
                            <span key={j} className="text-[11px] font-black text-white/80 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 group-hover/shift:border-indigo-500/30 transition-colors">
                              {member}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    todayRonda.members.map((member, i) => (
                      <div key={i} className="flex items-center gap-5 p-4 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-500">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-sm border border-indigo-500/30 shadow-inner">
                          {i + 1}
                        </div>
                        <span className="font-black text-base tracking-tight text-white/90">{member}</span>
                      </div>
                    ))
                  )
                ) : (
                  <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-[2.5rem] text-slate-600 text-xs font-black uppercase tracking-widest">
                    Jadwal belum diatur
                  </div>
                )}
              </div>

              <button 
                onClick={() => navigate('/info')} 
                className="mt-10 w-full py-5 bg-white text-slate-950 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-indigo-50 transition-all duration-500 flex items-center justify-center gap-3 shadow-xl shadow-white/5"
              >
                Selengkapnya <ChevronRight size={16} strokeWidth={3}/>
              </button>
            </div>
          </div>

          {/* Gallery Widget - Creative Style */}
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-[3rem] border border-white/50 shadow-2xl shadow-indigo-500/5 group">
            <div className="flex items-center justify-between mb-8 px-2">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Galeri <span className="text-indigo-600 italic font-serif">Warga</span></h3>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                <ArrowRight size={18} />
              </div>
            </div>
            {gallery.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {gallery.slice(0, 4).map((item, i) => (
                  <motion.div 
                    key={item.id} 
                    whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? 2 : -2 }}
                    className="relative aspect-[4/5] rounded-[2rem] overflow-hidden group/img cursor-pointer shadow-md"
                  >
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-1000" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-all duration-500 flex items-end p-5">
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
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
