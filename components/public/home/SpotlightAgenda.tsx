import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Clock, Calendar, MapPin, Share2, ChevronRight } from 'lucide-react';
import { Announcement } from '../../../types';
import { useTenant } from '../../../context/TenantContext';

interface SpotlightAgendaProps {
  announcements: Announcement[];
}

export const SpotlightAgenda: React.FC<SpotlightAgendaProps> = ({ announcements }) => {
  const navigate = useNavigate();
  const { currentTenant } = useTenant();

  const { event, eventDateFormatted, countdownLabel } = useMemo(() => {
    const found = announcements.find(a => a.type === 'Event');
    const ev = found || {
      id: 'agenda-gotong-royong',
      title: `Gotong Royong & Pembersihan Saluran Lingkungan ${currentTenant.name}`,
      content: `Kegiatan kerja bakti berkala warga ${currentTenant.name} untuk menjaga kelancaran saluran drainase, pembersihan rumput liar, dan penataan pekarangan lingkungan.`,
      date: new Date(Date.now() + 86400000 * 3).toISOString(),
      type: 'Event' as const
    };

    const eventDate = new Date(ev.date);
    const formatted = eventDate.toLocaleDateString('id-ID', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    const diffDays = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const label = diffDays > 1 ? `${diffDays} Hari Lagi` : diffDays === 1 ? 'Besok Pagi' : diffDays === 0 ? 'Hari Ini' : 'Terlaksana';

    return { event: ev, eventDateFormatted: formatted, countdownLabel: label };
  }, [announcements, currentTenant]);

  const handleShareAgendaWA = () => {
    const text = `📅 *AGENDA KEGIATAN ${currentTenant.name.toUpperCase()}*\n\n*${event.title}*\n🗓️ Tanggal: ${eventDateFormatted}\n📍 Lokasi: Lingkungan ${currentTenant.name}\n\n${event.content}\n\n_Mari berpartisipasi dan menjaga kerukunan warga bersama!_\n🌐 Info Lengkap: ${window.location.origin}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 rounded-3xl md:rounded-[2.8rem] p-5 sm:p-7 md:p-10 text-white border border-indigo-500/30 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
      
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={11} className="text-amber-400 animate-spin-slow" /> AGENDA TERDEKAT WARGA
            </span>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <Clock size={11} /> {countdownLabel}
            </span>
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <Calendar size={12} className="text-indigo-400" /> {eventDateFormatted}
            </span>
          </div>

          <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {event.title}
          </h3>

          <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
            {event.content}
          </p>

          <div className="flex items-center gap-2 pt-1 text-[11px] font-bold text-slate-400">
            <MapPin size={13} className="text-rose-400 shrink-0" />
            <span>Titik Kumpul: Wilayah {currentTenant.name}, Kel. {currentTenant.kelurahan}, {currentTenant.city}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto">
          <button
            onClick={handleShareAgendaWA}
            className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
          >
            <Share2 size={15} />
            <span>Bagikan ke WhatsApp RT</span>
          </button>
          <button
            onClick={() => navigate('/info')}
            className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border border-white/10 cursor-pointer"
          >
            <span>Lihat Semua Agenda</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
