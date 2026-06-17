import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, CloudFog, ShieldCheck, Users, Droplets, Thermometer, Wind as WindIcon, Activity, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { RT_NAME } from '../constants';
import { Button } from './ui/Button';

import { useWeather } from '../hooks/useWeather';

interface HeroSectionProps {
    onExplore?: () => void;
}

export const HeroSection = ({ onExplore }: HeroSectionProps) => {
    const [date, setDate] = useState(new Date());
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const { weather } = useWeather();

    useEffect(() => { 
        const timer = setInterval(() => setDate(new Date()), 60000); 
        const handleMouseMove = (e: MouseEvent) => {
            const rect = document.getElementById('hero-container')?.getBoundingClientRect();
            if (rect) {
                setMousePos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                });
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            clearInterval(timer);
            window.removeEventListener('mousemove', handleMouseMove);
        };
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

    return (
      <motion.div 
        id="hero-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-[#022c22]/20 rounded-3xl md:rounded-[3rem] overflow-hidden mb-6 md:mb-12 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.4)] group min-h-0 md:min-h-[320px] flex items-center border border-white/5"
      >
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Quiet, Premium glow fields (no harsh neon colors) */}
        <div className="absolute inset-0 overflow-hidden">
            <motion.div 
                animate={{ 
                    scale: [1, 1.15, 1],
                    x: [0, 40, 0],
                    y: [0, -20, 0]
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="absolute -top-[20%] -left-[10%] w-[65%] h-[65%] bg-amber-500/10 blur-[130px] rounded-full" 
            />
            <motion.div 
                animate={{ 
                    scale: [1.15, 1, 1.15],
                    x: [0, -30, 0],
                    y: [0, 30, 0]
                }}
                transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-[20%] -right-[10%] w-[55%] h-[55%] bg-emerald-500/10 blur-[120px] rounded-full" 
            />
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    x: [0, 20, 0],
                    y: [0, 40, 0]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute top-[20%] right-[10%] w-[35%] h-[35%] bg-indigo-500/10 blur-[110px] rounded-full" 
            />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay"></div>
        </div>
        
        {/* Interactive Mouse Glow */}
        <motion.div 
            className="absolute pointer-events-none w-[600px] h-[600px] bg-amber-500/5 blur-[120px] rounded-full z-0"
            animate={{
                x: mousePos.x - 300,
                y: mousePos.y - 300,
            }}
            transition={{ type: "spring", damping: 45, stiffness: 100 }}
        />

        <div className="relative w-full px-6 py-8 md:px-16 md:py-14 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-10">
          <div className="text-center lg:text-left max-w-2xl z-10 w-full space-y-4 md:space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 backdrop-blur-2xl rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] border border-amber-500/20 text-[#dfb975] shadow-sm"
            >
              <div className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
              </div>
              Sistem Informasi Digital
            </motion.div>
            
            <div className="space-y-2 md:space-y-3">
              <motion.h1 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl md:text-6xl lg:text-7xl font-sans font-black leading-none tracking-tight text-white"
              >
                TERAS <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-[#dfb975] to-emerald-300 drop-shadow-[0_4px_12px_rgba(223,185,117,0.15)] font-serif italic font-bold">
                  {RT_NAME}
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-slate-300 text-xs md:text-base font-medium leading-relaxed max-w-lg"
              >
                Harmoni warga dalam satu genggaman. Platform digital modern untuk mewujudkan <span className="text-white hover:text-[#dfb975] font-black cursor-default transition-colors">RT 02 yang Sinergis, Aman, dan Transparan.</span>
              </motion.p>
            </div>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-row flex-wrap items-center justify-center lg:justify-start gap-3 md:gap-4 w-full"
            >
              <button 
                onClick={onExplore}
                className="flex items-center gap-2 px-6 py-3.5 md:px-8 md:py-4 text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#dfb975] via-[#e2c184] to-[#c69a52] text-slate-950 rounded-2xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-95 transition-all cursor-pointer font-sans"
              >
                <span>Mulai Jelajahi</span>
                <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
              </button>
              
              <button 
                disabled
                className="flex items-center gap-2 px-6 py-3.5 md:px-8 md:py-4 text-xs font-black uppercase tracking-wider bg-white/5 border border-white/10 text-slate-350 rounded-2xl cursor-default transition-all font-sans"
              >
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>Smart Env</span>
              </button>
            </motion.div>
          </div>

          <motion.div 
            initial={{ scale: 0.95, opacity: 0, x: 20 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="w-full lg:w-auto z-10"
          >
            <div className="bg-slate-900/40 backdrop-blur-3xl border border-slate-800/80 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 text-white w-full lg:min-w-[340px] shadow-[0_45px_100px_-25px_rgba(0,0,0,0.6)] relative group/widget overflow-hidden hover:border-[#dfb975]/20 transition-all duration-700">
              {/* Subtle shining top line */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#dfb975]/40 via-[#dfb975]/10 to-transparent pointer-events-none" />
              
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover/widget:opacity-100 transition-opacity duration-1000" />
              
              <div className="relative z-10 space-y-4 md:space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <p className="text-4xl md:text-5xl font-serif font-black tracking-tight flex items-baseline gap-1 text-white">
                      <span>{date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-[10px] text-[#dfb975] font-mono font-black uppercase tracking-widest bg-[#dfb975]/10 px-2 py-0.5 rounded-md border border-[#dfb975]/20 ml-1">WITA</span>
                    </p>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-1.5">
                      <Sparkles size={11} className="text-[#dfb975]" />
                      {date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <motion.div 
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-lg backdrop-blur-xl shrink-0"
                    >
                      {getWeatherIcon(weather?.weatherCode)}
                    </motion.div>
                    {weather?.aqi !== undefined && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md shrink-0">
                        <Activity size={10} className={weather.aqiColor} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/80">AQI {weather.aqi}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 p-2 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300">
                      <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400 shrink-0">
                        <Thermometer size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Suhu</p>
                        <p className="text-xs md:text-sm font-black text-white mt-0.5">{weather ? `${weather.temp}°C` : '--'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2.5 p-2 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300">
                      <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 shrink-0">
                        <Droplets size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Lembab</p>
                        <p className="text-xs md:text-sm font-black text-white mt-0.5">{weather?.humidity ? `${weather.humidity}%` : '--'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 p-2 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300">
                      <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 shrink-0">
                        <WindIcon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Angin</p>
                        <p className="text-xs md:text-sm font-black text-white mt-0.5 truncate">{weather?.windSpeed ? `${weather.windSpeed} km/h` : '--'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2.5 p-2 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300">
                      <div className="p-2 bg-sky-500/20 rounded-lg text-sky-450 shrink-0">
                        <Cloud size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Kondisi</p>
                        <p className="text-xs md:text-sm font-black text-white mt-0.5 truncate">{weather ? weather.condition : '--'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
};
