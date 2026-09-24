import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Cloud, CloudRain, CloudLightning, CloudFog, ShieldCheck, Users, Droplets, Thermometer, Wind as WindIcon, Activity, ArrowRight, Sparkles, Building2, Lock, Shield, Search, Wallet, Droplet, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { RT_NAME } from '../constants';
import { toast } from 'sonner';
import { useWeather } from '../hooks/useWeather';
import { WeatherDetailModal } from './public/WeatherDetailModal';

interface HeroSectionProps {
    onExplore?: () => void;
}

export const HeroSection = ({ onExplore }: HeroSectionProps) => {
    const navigate = useNavigate();
    const [date, setDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
    const { weather, loading, refresh } = useWeather();

    useEffect(() => { 
        const timer = setInterval(() => setDate(new Date()), 1000); 
        return () => clearInterval(timer);
    }, []);

    const getWeatherIcon = (code: number | undefined) => {
        if (code === undefined) return <Sun size={28} className="text-amber-400 animate-spin-slow" />;
        if (code === 0) return <Sun size={28} className="text-amber-400 animate-spin-slow" />;
        if (code >= 1 && code <= 3) return <Cloud size={28} className="text-slate-400" />;
        if (code === 45 || code === 48) return <CloudFog size={28} className="text-slate-500" />;
        if (code >= 51 && code <= 55) return <CloudRain size={28} className="text-blue-400" />;
        if (code >= 61 && code <= 65) return <CloudRain size={28} className="text-blue-500" />;
        if (code >= 80 && code <= 82) return <CloudRain size={28} className="text-blue-600" />;
        if (code >= 95) return <CloudLightning size={28} className="text-amber-500" />;
        return <Sun size={28} className="text-amber-400 animate-spin-slow" />;
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
      <motion.div 
        id="hero-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative bg-white rounded-3xl md:rounded-[2.8rem] overflow-hidden mb-6 md:mb-12 shadow-xl shadow-slate-200/40 border border-slate-200/80 group min-h-0 md:min-h-[380px] flex items-center"
      >
        {/* Ambient Subtle Glow */}
        <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-gradient-to-br from-amber-100/60 via-orange-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-gradient-to-tr from-emerald-100/50 via-teal-100/25 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative w-full px-6 py-8 md:px-14 md:py-12 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-10 z-10">
          <div className="text-center lg:text-left max-w-2xl z-10 w-full space-y-4 md:space-y-5">
            {/* Wilayah Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.22em] border border-emerald-200/80 text-emerald-800 shadow-2xs"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>RT 002 / RW 020 • Kelurahan Tondo</span>
            </motion.div>
            
            <div className="space-y-2 md:space-y-3">
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-3xl md:text-5xl lg:text-6xl font-sans font-black leading-tight tracking-tight text-slate-900"
              >
                TERAS WARGA <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 font-serif italic font-bold">
                  RT 002 / RW 020
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed max-w-lg"
              >
                Harmoni warga dalam satu genggaman. Portal digital resmi Kelurahan Tondo, Kecamatan Mantikulore, Kota Palu untuk mewujudkan lingkungan yang sinergis, aman, dan transparan.
              </motion.p>
            </div>

            {/* 4 Smart Pulse Pills with Pastel System */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1"
            >
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#fff4eb] border border-amber-100/80 rounded-full text-[10px] md:text-[11px] font-extrabold text-[#ea580c] shadow-2xs">
                <Building2 size={13} className="text-[#ea580c]" />
                <span>120+ Hunian Aktif</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#e8faf0] border border-emerald-100/80 rounded-full text-[10px] md:text-[11px] font-extrabold text-[#059669] shadow-2xs">
                <Shield size={13} className="text-[#059669]" />
                <span>Siskamling 24 Jam</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#edf7ff] border border-sky-100/80 rounded-full text-[10px] md:text-[11px] font-extrabold text-[#0284c7] shadow-2xs">
                <Droplet size={13} className="text-[#0284c7]" />
                <span>Air PDAM Rp35rb/10m³</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#f0f2fe] border border-indigo-100/80 rounded-full text-[10px] md:text-[11px] font-extrabold text-[#4f46e5] shadow-2xs">
                <Wallet size={13} className="text-[#4f46e5]" />
                <span>Kas Terbuka &amp; Akuntabel</span>
              </span>
            </motion.div>

            {/* Omni Search Bar Warga */}
            <motion.form 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onSubmit={handleOmniSearch}
              className="relative max-w-md w-full pt-1"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari nomor blok rumah, layanan, agenda, info..."
                className="w-full pl-11 pr-24 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-xs"
              />
              <button 
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-[#6366f1] via-[#5452f6] to-[#7c3aed] text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95 hover:opacity-95"
              >
                Cari
              </button>
            </motion.form>

            {/* Action Buttons */}
            <motion.div 
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="flex flex-row flex-wrap items-center justify-center lg:justify-start gap-3 w-full pt-1"
            >
              <button 
                onClick={onExplore}
                className="flex items-center gap-2 px-6 py-3.5 text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-[#6366f1] via-[#5452f6] to-[#7c3aed] hover:opacity-95 text-white rounded-2xl shadow-md shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <span>Mulai Jelajahi</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={handleSmartEnvClick}
                className="flex items-center gap-2 px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 rounded-2xl shadow-2xs transition-all cursor-pointer"
              >
                <ShieldCheck size={16} className="text-[#059669] animate-pulse" />
                <span>Smart Env Tondo</span>
              </button>
            </motion.div>
          </div>

          <motion.div 
            initial={{ scale: 0.95, opacity: 0, x: 20 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="w-full lg:w-auto z-10"
          >
            <div className="bg-white/95 backdrop-blur-2xl rounded-3xl md:rounded-[2.8rem] p-6 md:p-8 text-slate-900 border border-slate-100 shadow-sm w-full lg:min-w-[360px] relative group/widget overflow-hidden transition-all duration-700">
              {/* Subtle ambient light glow orbs */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-200/30 rounded-full blur-3xl pointer-events-none group-hover/widget:scale-125 transition-transform duration-1000" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-200/25 rounded-full blur-3xl pointer-events-none group-hover/widget:scale-125 transition-transform duration-1000" />

              <div className="relative z-10 space-y-6">
                {/* Top Bar: Time & Weather Badge */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Live Station</span>
                    </div>
                    <p className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 flex items-baseline gap-2 font-sans">
                      <span>{date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-[10px] font-extrabold text-[#ea580c] uppercase tracking-widest bg-[#fff4eb] px-2.5 py-1 rounded-full border border-amber-100/80 shadow-2xs">WITA</span>
                    </p>
                    <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-[0.18em] flex items-center gap-1.5 pt-0.5">
                      <Sparkles size={13} className="text-amber-500 animate-spin-slow" />
                      {date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2.5 shrink-0">
                    <motion.button 
                      type="button"
                      onClick={() => setIsWeatherModalOpen(true)}
                      whileHover={{ scale: 1.1, rotate: 6 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className="p-4 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-3xl shadow-lg border border-slate-800 shrink-0 cursor-pointer transition-colors"
                      title="Buka Stasiun Cuaca & ISPU Huntap"
                    >
                      {getWeatherIcon(weather?.weatherCode)}
                    </motion.button>
                    {weather?.aqi !== undefined && (
                      <button 
                        type="button"
                        onClick={() => setIsWeatherModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-[#fff4eb] hover:bg-[#ffedd5] rounded-full border border-amber-100/80 shrink-0 shadow-2xs cursor-pointer transition-colors"
                      >
                        <Activity size={12} className="text-[#ea580c]" />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#ea580c]">ISPU {weather.aqi}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Extreme Weather / Environmental Alert Banner */}
                {weather?.alertMessage && (
                  <button
                    type="button"
                    onClick={() => setIsWeatherModalOpen(true)}
                    className="w-full text-left p-3 bg-[#fff4eb] border border-amber-200/80 rounded-2xl flex items-center gap-2 hover:border-amber-400 transition-all cursor-pointer group/alert shadow-2xs"
                  >
                    <AlertTriangle size={15} className="text-[#ea580c] shrink-0 animate-bounce" />
                    <span className="text-[10.5px] font-bold text-amber-950 truncate flex-1">
                      {weather.alertMessage}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#ea580c] bg-white px-2 py-0.5 rounded-full border border-amber-200/80 shrink-0 shadow-2xs">
                      Detail
                    </span>
                  </button>
                )}

                <div className="h-px bg-slate-100" />

                {/* 4 Weather Parameter Cards Grid with Pastel System */}
                <div 
                  onClick={() => setIsWeatherModalOpen(true)}
                  className="grid grid-cols-2 gap-3 cursor-pointer group/grid"
                  title="Klik untuk melihat detail stasiun cuaca & kualitas udara lengkap"
                >
                  <div className="flex items-center gap-3 p-3.5 bg-[#fff1f2] border border-rose-100/80 rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                    <div className="w-10 h-10 bg-white text-[#e11d48] rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                      <Thermometer size={17} className="stroke-[2.5]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-extrabold text-[#e11d48] uppercase tracking-widest">Suhu Udara</p>
                      <p className="text-sm font-extrabold text-slate-900 mt-0.5">{weather ? `${weather.temp}°C` : '--'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3.5 bg-[#e8faf0] border border-emerald-100/80 rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                    <div className="w-10 h-10 bg-white text-[#059669] rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                      <WindIcon size={17} className="stroke-[2.5]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-extrabold text-[#059669] uppercase tracking-widest">Laju Angin</p>
                      <p className="text-sm font-extrabold text-slate-900 mt-0.5 truncate">{weather?.windSpeed ? `${weather.windSpeed} km/h` : '--'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 bg-[#edf7ff] border border-sky-100/80 rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                    <div className="w-10 h-10 bg-white text-[#0284c7] rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                      <Droplets size={17} className="stroke-[2.5]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-extrabold text-[#0284c7] uppercase tracking-widest">Kelembaban</p>
                      <p className="text-sm font-extrabold text-slate-900 mt-0.5">{weather?.humidity ? `${weather.humidity}%` : '--'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 bg-[#f0f2fe] border border-indigo-100/80 rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                    <div className="w-10 h-10 bg-white text-[#4f46e5] rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                      <Cloud size={17} className="stroke-[2.5]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-extrabold text-[#4f46e5] uppercase tracking-widest">Kondisi</p>
                      <p className="text-sm font-extrabold text-slate-900 mt-0.5 truncate">{weather ? weather.condition : 'Cerah'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Modal Stasiun Cuaca & Kualitas Udara Huntap */}
        <WeatherDetailModal 
          isOpen={isWeatherModalOpen}
          onClose={() => setIsWeatherModalOpen(false)}
          weather={weather}
          loading={loading}
          onRefresh={refresh}
        />
      </motion.div>
    );
};
