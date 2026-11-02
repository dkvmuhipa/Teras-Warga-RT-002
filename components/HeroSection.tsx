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
        <span className="text-xs font-medium text-slate-500">Stasiun Cuaca Lingkungan</span>
      </div>
      <p className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 flex items-baseline gap-2 font-mono tabular-nums">
        <span>{now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
        <span className="text-[11px] font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">WITA</span>
      </p>
      <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 pt-0.5">
        <Calendar size={13} className="text-slate-400" />
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
    if (code === undefined || code === 0) return <Sun size={24} className="text-amber-500" />;
    if (code >= 1 && code <= 3) return <Cloud size={24} className="text-slate-500" />;
    if (code === 45 || code === 48) return <CloudFog size={24} className="text-slate-500" />;
    if (code >= 51 && code <= 82) return <CloudRain size={24} className="text-sky-600" />;
    if (code >= 95) return <CloudLightning size={24} className="text-amber-500" />;
    return <Sun size={24} className="text-amber-500" />;
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
      className="relative w-full bg-white rounded-3xl overflow-hidden mb-6 md:mb-10 border border-slate-200/80 shadow-xs flex items-center"
    >
      <div className="relative w-full px-5 py-7 sm:px-8 md:px-10 lg:px-12 md:py-10 flex flex-col lg:flex-row items-center justify-between gap-8 z-10">
        <div className="text-center lg:text-left max-w-2xl z-10 w-full space-y-4 md:space-y-5">
          {/* Tenant & Location Chips */}
          <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full text-xs font-medium text-slate-700 border border-slate-200/80">
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white inline-block"></span>
              <span>{currentTenant.name} &bull; Kel. {currentTenant.kelurahan}</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-full text-xs font-medium text-slate-600">
              <MapPin size={12} className="text-slate-500" />
              <span>{currentTenant.city}</span>
            </span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900 leading-tight">
              Teras Warga <span className="text-slate-700 block font-normal">{currentTenant.name}</span>
            </h1>
            
            <p className="text-slate-600 text-xs sm:text-sm font-normal leading-relaxed max-w-lg">
              Harmoni warga dalam satu genggaman. Portal digital resmi Kelurahan {currentTenant.kelurahan}, Kecamatan {currentTenant.kecamatan}, {currentTenant.city} untuk mewujudkan lingkungan yang sinergis, aman, dan transparan.
            </p>
          </div>

          {/* 4 Quiet Civic Metric Chips */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-700">
              <Building2 size={13} className="text-slate-500" />
              <span>120+ Hunian Aktif</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-700">
              <Shield size={13} className="text-slate-500" />
              <span>Siskamling Terjadwal</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-700">
              <Droplet size={13} className="text-slate-500" />
              <span>Air PDAM Terkendali</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-700">
              <Wallet size={13} className="text-slate-500" />
              <span>Kas Transparan</span>
            </span>
          </div>

          {/* Omni Search Bar */}
          <form 
            onSubmit={handleOmniSearch}
            className="relative max-w-md w-full pt-1"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input 
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari layanan, nomor blok (C10), agenda..."
              className="w-full pl-10 pr-24 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:border-slate-400 outline-none transition-colors"
            />
            <button 
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Cari
            </button>
          </form>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-2.5 w-full pt-1">
            <button 
              onClick={onExplore}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors cursor-pointer"
            >
              <span>Mulai Jelajahi</span>
              <ArrowRight size={14} />
            </button>
            
            <button 
              onClick={handleSmartEnvClick}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <ShieldCheck size={15} className="text-emerald-600" />
              <span>Stasiun Lingkungan</span>
            </button>
          </div>
        </div>

        {/* Live Weather & Environmental Station Card */}
        <div className="w-full lg:w-auto z-10">
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 md:p-6 text-slate-900 w-full lg:min-w-[340px]">
            <div className="space-y-5">
              {/* Top Bar: Time & Weather Badge */}
              <div className="flex justify-between items-start gap-4">
                <LiveStationClock />

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button 
                    type="button"
                    onClick={() => setIsWeatherModalOpen(true)}
                    className="p-3 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-2xl border border-slate-800 shrink-0 cursor-pointer transition-colors"
                    title="Buka Stasiun Cuaca & ISPU Huntap"
                  >
                    {getWeatherIcon(weather?.weatherCode)}
                  </button>
                  {weather?.aqi !== undefined && (
                    <button 
                      type="button"
                      onClick={() => setIsWeatherModalOpen(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 rounded-lg border border-slate-200/80 shrink-0 cursor-pointer transition-colors"
                    >
                      <Activity size={12} className="text-slate-600" />
                      <span className="text-[11px] font-mono font-medium text-slate-700">ISPU {weather.aqi}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Environmental Alert Banner (if active) */}
              {weather?.alertMessage && (
                <button
                  type="button"
                  onClick={() => setIsWeatherModalOpen(true)}
                  className="w-full text-left p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 hover:bg-amber-100/60 transition-colors cursor-pointer"
                >
                  <AlertTriangle size={15} className="text-amber-700 shrink-0" />
                  <span className="text-xs font-medium text-amber-950 truncate flex-1">
                    {weather.alertMessage}
                  </span>
                  <span className="text-[10px] font-medium text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-200 shrink-0">
                    Detail
                  </span>
                </button>
              )}

              <div className="h-px bg-slate-200/60" />

              {/* 4 Weather Parameter Cards Grid */}
              <div 
                onClick={() => setIsWeatherModalOpen(true)}
                className="grid grid-cols-2 gap-2.5 cursor-pointer"
                title="Klik untuk melihat detail stasiun cuaca & kualitas udara lengkap"
              >
                <div className="flex items-center gap-2.5 p-3 bg-white border border-slate-200/80 rounded-xl hover:border-slate-300 transition-colors">
                  <div className="w-8 h-8 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center shrink-0">
                    <Thermometer size={16} strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-500">Suhu</p>
                    <p className="text-sm font-semibold font-mono tabular-nums text-slate-900">{weather ? `${weather.temp}°C` : '--'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2.5 p-3 bg-white border border-slate-200/80 rounded-xl hover:border-slate-300 transition-colors">
                  <div className="w-8 h-8 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center shrink-0">
                    <WindIcon size={16} strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-500">Angin</p>
                    <p className="text-sm font-semibold font-mono tabular-nums text-slate-900 truncate">{weather?.windSpeed ? `${weather.windSpeed} km/h` : '--'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 bg-white border border-slate-200/80 rounded-xl hover:border-slate-300 transition-colors">
                  <div className="w-8 h-8 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center shrink-0">
                    <Droplets size={16} strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-500">Kelembaban</p>
                    <p className="text-sm font-semibold font-mono tabular-nums text-slate-900">{weather?.humidity ? `${weather.humidity}%` : '--'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 bg-white border border-slate-200/80 rounded-xl hover:border-slate-300 transition-colors">
                  <div className="w-8 h-8 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center shrink-0">
                    <Cloud size={16} strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-500">Kondisi</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">{weather ? weather.condition : 'Cerah'}</p>
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
