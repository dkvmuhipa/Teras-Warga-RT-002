import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sun, Cloud, CloudRain, CloudLightning, CloudFog, ShieldCheck, 
  Users, Droplets, Thermometer, Wind as WindIcon, Activity, 
  ArrowRight, Building2, Shield, Search, Wallet, Droplet, 
  AlertTriangle, MapPin, Calendar 
} from 'lucide-react';
import { motion } from 'motion/react';
import { RT_NAME } from '../constants';
import { toast } from 'sonner';
import { useWeather } from '../hooks/useWeather';
import { WeatherDetailModal } from './public/WeatherDetailModal';
import { useTenant } from '../context/TenantContext';

interface HeroSectionProps {
  onExplore?: () => void;
}

const LiveStationClock = React.memo(() => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white inline-block shrink-0" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Live Station</span>
      </div>
      <p className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 flex items-baseline gap-2 font-mono tabular-nums">
        <span>{now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
        <span className="text-[11px] font-mono font-bold text-[#ea580c] uppercase tracking-wider bg-[#fff4eb] px-2.5 py-0.5 rounded-full border border-amber-200/80 shadow-2xs">WITA</span>
      </p>
      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 pt-0.5">
        <Calendar size={13} className="text-amber-500" />
        <span>{now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </p>
    </div>
  );
});

export const HeroSection = ({ onExplore }: HeroSectionProps) => {
  const { currentTenant } = useTenant();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const { weather, loading, refresh } = useWeather();

  const getWeatherIcon = (code: number | undefined) => {
    if (code === undefined || code === 0) return <Sun size={26} className="text-amber-400" />;
    if (code >= 1 && code <= 3) return <Cloud size={26} className="text-slate-400" />;
    if (code === 45 || code === 48) return <CloudFog size={26} className="text-slate-400" />;
    if (code >= 51 && code <= 82) return <CloudRain size={26} className="text-sky-400" />;
    if (code >= 95) return <CloudLightning size={26} className="text-amber-400" />;
    return <Sun size={26} className="text-amber-400" />;
  };

  const handleSmartEnvClick = () => {
    setIsWeatherModalOpen(true);
  };

  const handleOmniSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      toast.info("Ketik kata kunci pencarian", {
        description: "Contoh: nomor blok (B-12), surat, ronda, atau aturan RT"
      });
      return;
    }
    navigate(`/info?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  return (
    <div 
      id="hero-container"
      className="relative w-full bg-white rounded-3xl md:rounded-[2.8rem] overflow-hidden mb-6 md:mb-10 shadow-xl shadow-slate-200/40 border border-slate-200/80 flex items-center"
    >
      {/* Warm Ambient Subtle Glow */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-to-br from-amber-100/50 via-orange-100/25 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-gradient-to-tr from-emerald-100/40 via-teal-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full px-5 py-7 sm:px-8 md:px-12 lg:px-14 md:py-11 flex flex-col lg:flex-row items-center justify-between gap-8 z-10">
        <div className="text-center lg:text-left max-w-2xl xl:max-w-3xl z-10 w-full space-y-4 md:space-y-6">
          {/* Tenant & Location Chips */}
          <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-bold border border-emerald-200 text-emerald-800 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200 inline-block"></span>
              <span>{currentTenant.name} &bull; Kel. {currentTenant.kelurahan}</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50/90 border border-amber-200/80 rounded-full text-xs font-semibold text-amber-800 shadow-2xs">
              <MapPin size={12} className="text-amber-600" />
              <span>{currentTenant.city}</span>
            </span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              TERAS WARGA <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700">
                {currentTenant.name}
              </span>
            </h1>
            
            <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed max-w-lg">
              Harmoni warga dalam satu genggaman. Portal digital resmi Kelurahan {currentTenant.kelurahan}, Kecamatan {currentTenant.kecamatan}, {currentTenant.city} untuk mewujudkan lingkungan yang sinergis, aman, dan transparan.
            </p>
          </div>

          {/* 4 Smart Pulse Pills with Pastel Palette */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#fff4eb] border border-amber-200/80 rounded-full text-xs font-bold text-[#ea580c] shadow-2xs transition-colors">
              <Building2 size={13} className="text-[#ea580c]" />
              <span>120+ Hunian Aktif</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#e8faf0] border border-emerald-200/80 rounded-full text-xs font-bold text-[#059669] shadow-2xs transition-colors">
              <Shield size={13} className="text-[#059669]" />
              <span>Siskamling 24 Jam</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#edf7ff] border border-sky-200/80 rounded-full text-xs font-bold text-[#0284c7] shadow-2xs transition-colors">
              <Droplet size={13} className="text-[#0284c7]" />
              <span>Air PDAM Rp35rb/10m³</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#f0f2fe] border border-indigo-200/80 rounded-full text-xs font-bold text-[#4f46e5] shadow-2xs transition-colors">
              <Wallet size={13} className="text-[#4f46e5]" />
              <span>Kas Terbuka &amp; Akuntabel</span>
            </span>
          </div>

          {/* Omni Search Bar */}
          <form 
            onSubmit={handleOmniSearch}
            className="relative max-w-md w-full pt-1"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari nomor blok rumah (C10), layanan, agenda, info..."
              className="w-full pl-11 pr-24 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-2xs"
            />
            <button 
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-[#6366f1] via-[#5452f6] to-[#7c3aed] hover:opacity-95 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Cari
            </button>
          </form>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 w-full pt-1">
            <button 
              onClick={onExplore}
              className="flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold bg-gradient-to-r from-[#6366f1] via-[#5452f6] to-[#7c3aed] hover:opacity-95 text-white rounded-2xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <span>Mulai Jelajahi</span>
              <ArrowRight size={14} />
            </button>
            
            <button 
              onClick={handleSmartEnvClick}
              className="flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl shadow-2xs transition-colors cursor-pointer"
            >
              <ShieldCheck size={16} className="text-[#059669]" />
              <span>Smart Env Tondo</span>
            </button>
          </div>
        </div>

        {/* Live Weather & Environmental Station Card */}
        <div className="w-full lg:w-auto z-10">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl md:rounded-[2.5rem] p-6 md:p-7 text-slate-900 border border-slate-100 shadow-md w-full lg:min-w-[350px]">
            <div className="space-y-5">
              {/* Top Bar: Time & Weather Badge */}
              <div className="flex justify-between items-start gap-4">
                <LiveStationClock />

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button 
                    type="button"
                    onClick={() => setIsWeatherModalOpen(true)}
                    className="p-3.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-2xl shadow-md border border-slate-800 shrink-0 cursor-pointer transition-colors"
                    title="Buka Stasiun Cuaca & ISPU Huntap"
                  >
                    {getWeatherIcon(weather?.weatherCode)}
                  </button>
                  {weather?.aqi !== undefined && (
                    <button 
                      type="button"
                      onClick={() => setIsWeatherModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-[#fff4eb] hover:bg-[#ffedd5] rounded-full border border-amber-200/80 shrink-0 cursor-pointer transition-colors"
                    >
                      <Activity size={12} className="text-[#ea580c]" />
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#ea580c]">ISPU {weather.aqi}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Environmental Alert Banner (if active) */}
              {weather?.alertMessage && (
                <button
                  type="button"
                  onClick={() => setIsWeatherModalOpen(true)}
                  className="w-full text-left p-2.5 bg-[#fff4eb] border border-amber-200/80 rounded-xl flex items-center gap-2 hover:border-amber-400 transition-colors cursor-pointer shadow-2xs"
                >
                  <AlertTriangle size={15} className="text-[#ea580c] shrink-0" />
                  <span className="text-xs font-bold text-amber-950 truncate flex-1">
                    {weather.alertMessage}
                  </span>
                  <span className="text-[10px] font-bold text-[#ea580c] bg-white px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                    Detail
                  </span>
                </button>
              )}

              <div className="h-px bg-slate-100" />

              {/* 4 Weather Parameter Cards Grid with Pastel System */}
              <div 
                onClick={() => setIsWeatherModalOpen(true)}
                className="grid grid-cols-2 gap-2.5 cursor-pointer"
                title="Klik untuk melihat detail stasiun cuaca & kualitas udara lengkap"
              >
                <div className="flex items-center gap-2.5 p-3 bg-[#fff1f2] border border-rose-100/90 rounded-2xl hover:shadow-xs transition-all">
                  <div className="w-9 h-9 bg-white text-[#e11d48] rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                    <Thermometer size={16} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-[#e11d48] uppercase tracking-wider">Suhu</p>
                    <p className="text-sm font-extrabold font-mono tabular-nums text-slate-900">{weather ? `${weather.temp}°C` : '--'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2.5 p-3 bg-[#e8faf0] border border-emerald-100/90 rounded-2xl hover:shadow-xs transition-all">
                  <div className="w-9 h-9 bg-white text-[#059669] rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                    <WindIcon size={16} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-[#059669] uppercase tracking-wider">Angin</p>
                    <p className="text-sm font-extrabold font-mono tabular-nums text-slate-900 truncate">{weather?.windSpeed ? `${weather.windSpeed} km/h` : '--'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 bg-[#edf7ff] border border-sky-100/90 rounded-2xl hover:shadow-xs transition-all">
                  <div className="w-9 h-9 bg-white text-[#0284c7] rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                    <Droplets size={16} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-[#0284c7] uppercase tracking-wider">Kelembaban</p>
                    <p className="text-sm font-extrabold font-mono tabular-nums text-slate-900">{weather ? `${weather.humidity}%` : '--'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 bg-[#f0f2fe] border border-indigo-100/90 rounded-2xl hover:shadow-xs transition-all">
                  <div className="w-9 h-9 bg-white text-[#4f46e5] rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                    <Cloud size={16} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-[#4f46e5] uppercase tracking-wider">Kondisi</p>
                    <p className="text-sm font-extrabold text-slate-900 truncate">{weather ? weather.condition : 'Cerah'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weather Detail Modal */}
      <WeatherDetailModal 
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        weather={weather}
        loading={loading}
        onRefresh={refresh}
      />
    </div>
  );
};
