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
        className="relative bg-slate-950 rounded-3xl md:rounded-[3.5rem] overflow-hidden mb-6 md:mb-12 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.3)] group min-h-0 md:min-h-[320px] flex items-center border border-white/10"
      >
        {/* Colorful Mesh Gradient Background */}
        <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[#020617]" />
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    x: [0, 50, 0],
                    y: [0, -30, 0]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-indigo-600/30 blur-[140px] rounded-full" 
            />
            <motion.div 
                animate={{ 
                    scale: [1.2, 1, 1.2],
                    x: [0, -40, 0],
                    y: [0, 40, 0]
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-emerald-500/20 blur-[130px] rounded-full" 
            />
            <motion.div 
                animate={{ 
                    scale: [1, 1.3, 1],
                    x: [0, 30, 0],
                    y: [0, 60, 0]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-violet-600/20 blur-[120px] rounded-full" 
            />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05] mix-blend-overlay"></div>
        </div>
        
        {/* Interactive Mouse Glow */}
        <motion.div 
            className="absolute pointer-events-none w-[800px] h-[800px] bg-blue-500/10 blur-[150px] rounded-full z-0"
            animate={{
                x: mousePos.x - 400,
                y: mousePos.y - 400,
            }}
            transition={{ type: "spring", damping: 40, stiffness: 120 }}
        />

        <div className="relative w-full px-5 py-6 md:px-16 md:py-12 flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8">
          <div className="text-center lg:text-left max-w-2xl z-10 w-full">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-3 py-1 md:px-5 md:py-2 bg-white/5 backdrop-blur-2xl rounded-full text-[8.5px] md:text-[10px] font-bold uppercase tracking-[0.25em] md:tracking-[0.3em] mb-2.5 md:mb-4 border border-white/10 text-blue-400 shadow-2xl"
            >
              <div className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
              </div>
              Sistem Informasi Digital
            </motion.div>
            
            <motion.h1 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-3xl md:text-6xl lg:text-7xl font-black mb-2 leading-none tracking-tighter text-white"
            >
              TERAS <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400 drop-shadow-[0_8px_8px_rgba(0,0,0,0.3)]">
                {RT_NAME}
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-slate-400 text-xs md:text-lg font-light leading-relaxed max-w-lg mb-4 md:mb-6"
            >
              Harmoni lingkungan dalam genggaman. Platform digital modern untuk mewujudkan <span className="text-white font-medium">RT 02 yang Sinergis, Aman, dan Transparan.</span>
            </motion.p>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-row flex-wrap items-center justify-center lg:justify-start gap-2.5 md:gap-4 w-full"
            >
              <Button 
                variant="primary" 
                onClick={onExplore}
                className="gap-2 px-4 py-2.5 text-[10px] sm:px-6 sm:py-3.5 sm:text-[11px] md:px-8 md:py-4 md:text-xs min-h-0"
              >
                Mulai Jelajahi
                <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
              </Button>
              <Button 
                variant="glass" 
                className="cursor-default gap-2 px-4 py-2.5 text-[10px] sm:px-6 sm:py-3.5 sm:text-[11px] md:px-8 md:py-4 md:text-xs min-h-0"
              >
                <ShieldCheck size={16} className="text-emerald-400" />
                Smart Env
              </Button>
            </motion.div>
          </div>

          <motion.div 
            initial={{ scale: 0.9, opacity: 0, x: 30 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="w-full lg:w-auto z-10"
          >
            <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 text-white w-full lg:min-w-[340px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] relative group/widget overflow-hidden hover:border-white/20 transition-all duration-700">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover/widget:opacity-100 transition-opacity duration-1000" />
              
              <div className="relative z-10 space-y-4 md:space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-3xl md:text-5xl font-black tracking-tighter mb-1 tabular-nums text-white drop-shadow-2xl">
                      {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[10px] md:text-xs font-bold text-blue-400 uppercase tracking-[0.2em] flex items-center gap-1.5 md:gap-2">
                      <Sparkles size={12} />
                      {date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 md:gap-3">
                    <motion.div 
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        className="p-2.5 md:p-4 bg-white/5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl"
                    >
                      {getWeatherIcon(weather?.weatherCode)}
                    </motion.div>
                    {weather?.aqi !== undefined && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                        <Activity size={12} className={weather.aqiColor} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/80">AQI {weather.aqi}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-white/20 via-white/5 to-transparent" />

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center gap-3 group/item">
                      <div className="p-2 md:p-2.5 bg-rose-500/20 rounded-xl text-rose-400 group-hover/item:scale-110 group-hover/item:bg-rose-500/30 transition-all duration-300">
                        <Thermometer size={14} className="md:w-[18px] md:h-[18px]" />
                      </div>
                      <div>
                        <p className="text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-[0.25em]">Suhu</p>
                        <p className="text-sm md:text-lg font-bold text-white leading-none mt-0.5 md:mt-1">{weather ? `${weather.temp}°C` : '--'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 group/item">
                      <div className="p-2 md:p-2.5 bg-blue-500/20 rounded-xl text-blue-400 group-hover/item:scale-110 group-hover/item:bg-blue-500/30 transition-all duration-300">
                        <Droplets size={14} className="md:w-[18px] md:h-[18px]" />
                      </div>
                      <div>
                        <p className="text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-[0.25em]">Lembab</p>
                        <p className="text-sm md:text-lg font-bold text-white leading-none mt-0.5 md:mt-1">{weather?.humidity ? `${weather.humidity}%` : '--'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center gap-3 group/item">
                      <div className="p-2 md:p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400 group-hover/item:scale-110 group-hover/item:bg-emerald-500/30 transition-all duration-300">
                        <WindIcon size={14} className="md:w-[18px] md:h-[18px]" />
                      </div>
                      <div>
                        <p className="text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-[0.25em]">Angin</p>
                        <p className="text-sm md:text-lg font-bold text-white leading-none mt-0.5 md:mt-1">{weather?.windSpeed ? `${weather.windSpeed} km/h` : '--'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 group/item">
                      <div className="p-2 md:p-2.5 bg-slate-500/20 rounded-xl text-slate-400 group-hover/item:scale-110 group-hover/item:bg-slate-500/30 transition-all duration-300">
                        <Cloud size={14} className="md:w-[18px] md:h-[18px]" />
                      </div>
                      <div>
                        <p className="text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-[0.25em]">Kondisi</p>
                        <p className="text-sm md:text-lg font-bold text-white leading-none mt-0.5 md:mt-1 truncate max-w-[100px]">{weather ? weather.condition : '--'}</p>
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
