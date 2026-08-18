import React from 'react';
import { Phone, ShieldAlert, Sparkles, PhoneCall } from 'lucide-react';
import { EMERGENCY_CONTACTS } from '../../constants/emergencyContacts';
import { motion } from 'motion/react';

export const EmergencyContacts: React.FC = () => {
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-gradient-to-br from-rose-950 via-slate-900 to-rose-900 rounded-[3rem] p-8 md:p-10 text-white border border-rose-500/40 shadow-[0_30px_90px_-20px_rgba(225,29,72,0.3)] hover:shadow-[0_40px_110px_-15px_rgba(225,29,72,0.45)] transition-all duration-700 h-full flex flex-col justify-between relative overflow-hidden group"
    >
      {/* Subtle Crimson Pinstripe Luxury Grid Overlay */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(244,63,94,0.04)_0px,rgba(244,63,94,0.04)_1px,transparent_1px,transparent_16px)] pointer-events-none" />

      {/* Radiant Ambient Rose & Crimson Light Orbs */}
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-rose-500/25 rounded-full blur-[100px] pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-red-600/20 rounded-full blur-[100px] pointer-events-none group-hover:scale-125 transition-transform duration-1000" />

      <div className="relative z-10 space-y-6">
        {/* Top Header & POI Badge */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-2xl shadow-lg shadow-rose-600/30 group-hover:rotate-6 transition-transform">
              <ShieldAlert size={28} strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-rose-300">POINT OF INTEREST UTAMA</span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight mt-0.5">Kontak Siaga Bencana &amp; Darurat</h3>
            </div>
          </div>

          <span className="px-3.5 py-1.5 bg-rose-500/20 border border-rose-400/40 text-rose-200 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm shrink-0">
            <Sparkles size={12} className="text-rose-400 animate-pulse" /> SIAGA 24 JAM
          </span>
        </div>

        {/* Call Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {EMERGENCY_CONTACTS.map((contact, index) => (
            <a
              key={index}
              href={`tel:${contact.phone}`}
              className="flex items-center justify-between p-3.5 bg-white/10 hover:bg-white/20 border border-white/15 hover:border-rose-400/60 rounded-2xl backdrop-blur-md transition-all duration-300 group/call gap-2.5 shadow-xs hover:-translate-y-0.5"
            >
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-white text-xs leading-tight group-hover/call:text-rose-300 transition-colors truncate">{contact.name}</p>
                <p className="text-[10px] font-mono font-bold text-rose-200/80 mt-0.5">{contact.phone}</p>
              </div>
              <div className="bg-gradient-to-r from-rose-500 to-red-600 p-2 rounded-xl text-white shadow-md shadow-rose-600/30 shrink-0 group-hover/call:scale-110 transition-transform">
                <PhoneCall size={14} />
              </div>
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
