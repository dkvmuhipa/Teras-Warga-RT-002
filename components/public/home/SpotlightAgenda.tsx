import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Calendar, MapPin, Share2, ChevronRight } from 'lucide-react';
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
    <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 md:p-9 text-white border border-slate-800 shadow-sm relative overflow-hidden">
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-md text-xs font-medium flex items-center gap-1.5">
              <Calendar size={12} className="text-slate-400" /> Agenda Terdekat
            </span>
            <span className="px-2.5 py-0.5 bg-slate-800 text-amber-300 border border-slate-700 rounded-md text-xs font-mono font-medium flex items-center gap-1.5">
              <Clock size={12} /> {countdownLabel}
            </span>
            <span className="text-xs font-medium text-slate-400">
              {eventDateFormatted}
            </span>
          </div>

          <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
            {event.title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
            {event.content}
          </p>

          <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
            <MapPin size={13} className="text-rose-400 shrink-0" />
            <span>Titik Kumpul: Wilayah {currentTenant.name}, Kel. {currentTenant.kelurahan}, {currentTenant.city}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 w-full sm:w-auto">
          <button
            onClick={handleShareAgendaWA}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Share2 size={14} />
            <span>Bagikan ke WhatsApp RT</span>
          </button>
          <button
            onClick={() => navigate('/info')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
          >
            <span>Lihat Semua Agenda</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
