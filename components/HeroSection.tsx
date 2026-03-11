import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, CloudFog, Snowflake, ShieldCheck, Users, Wind, Droplets, Thermometer, Wind as WindIcon, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { RT_NAME } from '../constants';

import { useWeather } from '../hooks/useWeather';

export const HeroSection = () => {
    const [date, setDate] = useState(new Date());
    const { weather } = useWeather();

    useEffect(() => { 
        const timer = setInterval(() => setDate(new Date()), 60000); 
        return () => clearInterval(timer);
    }, []);

    const getWeatherIcon = (code: number | undefined) => {
        if (code === undefined) return <Sun size={24} className="text-amber-300 animate-spin-slow" />;
        if (code === 0) return <Sun size={24} className="text-amber-300 animate-spin-slow" />;
        if (code >= 1 && code <= 3) return <Cloud size={24} className="text-slate-200" />;
        if (code === 45 || code === 48) return <CloudFog size={24} className="text-slate-300" />;
        if (code >= 51 && code <= 55) return <CloudRain size={24} className="text-blue-200" />;
        if (code >= 61 && code <= 65) return <CloudRain size={24} className="text-blue-400" />;
        if (code >= 80 && code <= 82) return <CloudRain size={24} className="text-blue-600" />;
        if (code >= 95) return <CloudLightning size={24} className="text-yellow-400" />;
        return <Sun size={24} className="text-amber-300 animate-spin-slow" />;
    };

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative bg-slate-900 rounded-[3rem] overflow-hidden mb-12 shadow-2xl shadow-indigo-500/10 group min-h-[400px] flex items-center"
      >
        {/* Immersive Background */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558036117-15db5275d42b?auto=format&fit=crop&q=80')] opacity-20 bg-cover bg-center mix-blend-overlay group-hover:scale-110 transition-transform duration-[30s] ease-linear"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/40 via-slate-900/80 to-slate-950"></div>
        
        {/* Animated Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-cyan-500/20 blur-[100px] rounded-full" />

        <div className="relative w-full px-8 py-12 md:px-16 md:py-20 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="text-center md:text-left text-white max-w-3xl">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 border border-white/10 text-indigo-200"
            >
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-ping" />
              Smart Neighborhood Platform
            </motion.div>
            
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-5xl md:text-8xl font-black mb-6 leading-[0.85] tracking-tighter"
            >
              TERAS <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-[length:200%_auto] animate-gradient-x">
                {RT_NAME}
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-slate-300 text-lg md:text-xl font-medium leading-relaxed max-w-xl mb-8 font-serif italic opacity-80"
            >
              "Teknologi, Ekraf, Rukun, Aman, Sinergi — Mewujudkan harmoni tetangga dalam satu genggaman digital."
            </motion.p>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap justify-center md:justify-start gap-4"
            >
              <div className="flex items-center gap-3 px-6 py-3 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/10">
                <ShieldCheck size={18} className="text-indigo-600" />
                Lingkungan Aman
              </div>
              <div className="flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10">
                <Users size={18} className="text-cyan-400" />
                Warga Rukun
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7, type: "spring" }}
            className="w-full md:w-auto"
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 md:p-10 text-white w-full md:min-w-[380px] shadow-2xl relative group/card overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-6xl font-black tracking-tighter mb-2 tabular-nums">
                      {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">
                      {date.toLocaleDateString('id-ID', { weekday: 'long' })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="p-4 bg-white/10 rounded-3xl border border-white/10 shadow-lg">
                      {getWeatherIcon(weather?.weatherCode)}
                    </div>
                    {weather?.aqi !== undefined && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                        <Activity size={12} className={weather.aqiColor} />
                        <span className="text-[9px] font-black uppercase tracking-wider">AQI {weather.aqi} • <span className={weather.aqiColor}>{weather.aqiLabel}</span></span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-white/20 via-white/10 to-transparent" />

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-xl">
                        <Thermometer size={14} className="text-indigo-300" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Suhu</p>
                        <p className="text-sm font-bold text-white">{weather ? `${weather.temp}°C` : '--'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-xl">
                        <Droplets size={14} className="text-cyan-300" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kelembaban</p>
                        <p className="text-sm font-bold text-white">{weather?.humidity ? `${weather.humidity}%` : '--'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-xl">
                        <WindIcon size={14} className="text-emerald-300" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Angin</p>
                        <p className="text-sm font-bold text-white">{weather?.windSpeed ? `${weather.windSpeed} km/h` : '--'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-xl">
                        <Cloud size={14} className="text-slate-300" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kondisi</p>
                        <p className="text-sm font-bold text-white truncate max-w-[80px]">{weather ? weather.condition : '--'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center">
                    {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
};
