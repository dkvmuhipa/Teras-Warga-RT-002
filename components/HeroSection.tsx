import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, CloudFog, Snowflake, ShieldCheck, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { RT_NAME } from '../constants';

export const HeroSection = () => {
    const [date, setDate] = useState(new Date());
    const [weather, setWeather] = useState<{ temp: number; condition: string; icon: React.ReactNode } | null>(null);

    useEffect(() => { 
        const timer = setInterval(() => setDate(new Date()), 60000); 
        
        // Fetch weather for Palu
        fetch('https://api.open-meteo.com/v1/forecast?latitude=-0.8917&longitude=119.8707&current=temperature_2m,weather_code')
            .then(res => res.json())
            .then(data => {
                const code = data.current.weather_code;
                let condition = 'Cerah';
                let icon = <Sun size={24} className="text-amber-300 animate-spin-slow" />;
                
                if (code === 0) { condition = 'Cerah'; icon = <Sun size={24} className="text-amber-300 animate-spin-slow" />; }
                else if (code <= 3) { condition = 'Berawan'; icon = <Cloud size={24} className="text-slate-200" />; }
                else if (code <= 48) { condition = 'Berkabut'; icon = <CloudFog size={24} className="text-slate-300" />; }
                else if (code <= 67) { condition = 'Hujan'; icon = <CloudRain size={24} className="text-blue-300" />; }
                else if (code <= 77) { condition = 'Bersalju'; icon = <Snowflake size={24} className="text-white" />; }
                else if (code <= 99) { condition = 'Badai'; icon = <CloudLightning size={24} className="text-yellow-300" />; }

                setWeather({
                    temp: Math.round(data.current.temperature_2m),
                    condition,
                    icon
                });
            })
            .catch(err => console.error("Error fetching weather:", err));

        return () => clearInterval(timer); 
    }, []);

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
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 md:p-10 text-white w-full md:min-w-[320px] shadow-2xl relative group/card overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-6xl font-black tracking-tighter mb-2 tabular-nums">
                      {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">
                      {date.toLocaleDateString('id-ID', { weekday: 'long' })}
                    </p>
                  </div>
                  <div className="p-4 bg-white/10 rounded-3xl border border-white/10">
                    {weather ? weather.icon : <Sun size={24} className="text-amber-300 animate-spin-slow" />}
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-white/20 to-transparent" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal</p>
                    <p className="text-sm font-bold text-white">{date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Cuaca</p>
                    <p className="text-sm font-bold text-white">
                      {weather ? `${weather.condition} ${weather.temp}°C` : 'Memuat...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
};
