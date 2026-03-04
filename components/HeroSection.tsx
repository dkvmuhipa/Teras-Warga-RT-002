import React, { useState, useEffect } from 'react';
import { Sun } from 'lucide-react';
import { RT_NAME } from '../constants';

export const HeroSection = () => {
    const [date, setDate] = useState(new Date());
    useEffect(() => { const timer = setInterval(() => setDate(new Date()), 60000); return () => clearInterval(timer); }, []);
    return (
      <div className="relative bg-gradient-to-r from-cyan-600 to-blue-700 rounded-3xl overflow-hidden mb-6 md:mb-8 shadow-xl shadow-blue-200 group animate-fade-in">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558036117-15db5275d42b?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay group-hover:scale-105 transition-transform duration-[20s]"></div>
        <div className="relative px-6 py-8 md:px-12 md:py-16 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          <div className="text-center md:text-left text-white max-w-2xl">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] md:text-xs font-bold mb-3 tracking-wide uppercase border border-white/30 text-blue-50 shadow-lg">Sistem Informasi Digital</span>
            <h1 className="text-3xl md:text-5xl font-black mb-3 leading-tight drop-shadow-sm">TERAS {RT_NAME}</h1>
             <div className="text-lg md:text-2xl font-bold text-cyan-200 mb-4 tracking-wide font-sans drop-shadow-md">Teknologi • Ekraf • Rukun • Aman • Sinergi</div>
            <p className="text-blue-50 text-sm md:text-lg font-light leading-relaxed max-w-lg hidden md:block border-l-2 border-cyan-400 pl-4">Platform terpadu untuk mewujudkan tetangga rukun, administrasi transparan, dan lingkungan harmonis melalui semangat gotong royong digital.</p>
          </div>
          <div className="w-full md:w-auto">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 md:p-6 text-white w-full md:min-w-[240px] shadow-lg flex flex-row md:flex-col items-center md:items-stretch justify-between gap-4">
                 <div className="flex-1 md:flex-none">
                    <p className="text-3xl md:text-4xl font-black tracking-tighter">{date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text--[10px] md:text-xs font-medium text-blue-100 uppercase tracking-widest">{date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                 </div>
                 <div className="w-px h-10 md:h-px md:w-full bg-white/20"></div>
                 <div className="flex flex-col md:flex-row justify-between items-end md:items-center text-right md:text-left">
                    <Sun size={24} className="text-amber-300 animate-spin-slow mb-1 md:mb-0 md:mr-2" />
                    <span className="text-xs font-medium">Cerah 28°C</span>
                 </div>
              </div>
          </div>
        </div>
      </div>
    );
};
