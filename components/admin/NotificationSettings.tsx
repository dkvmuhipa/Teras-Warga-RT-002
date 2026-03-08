import React, { useState } from 'react';
import { Bell, Shield, DollarSign, Megaphone, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/Button';

export const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    announcements: true,
    finance: true,
    events: false,
    security: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const options = [
    { key: 'announcements', icon: Megaphone, label: 'Pengumuman RT', desc: 'Notifikasi untuk pengumuman baru.' },
    { key: 'finance', icon: DollarSign, label: 'Keuangan & Iuran', desc: 'Notifikasi untuk pembayaran iuran.' },
    { key: 'events', icon: Calendar, label: 'Acara Warga', desc: 'Notifikasi untuk acara RT.' },
    { key: 'security', icon: Shield, label: 'Keamanan & Ronda', desc: 'Notifikasi untuk laporan ronda.' },
  ] as const;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pengaturan Notifikasi</h2>
        <p className="text-slate-500 font-medium mt-1">Atur preferensi notifikasi secara granular.</p>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        {options.map(opt => (
          <div key={opt.key} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white rounded-2xl text-indigo-600 shadow-sm">
                <opt.icon size={24} />
              </div>
              <div>
                <h4 className="font-black text-slate-800">{opt.label}</h4>
                <p className="text-xs text-slate-500 font-medium">{opt.desc}</p>
              </div>
            </div>
            <button 
              onClick={() => toggleSetting(opt.key)}
              className={`w-14 h-8 rounded-full transition-colors relative ${settings[opt.key] ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${settings[opt.key] ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        ))}
      </div>
      
      <Button>Simpan Pengaturan</Button>
    </motion.div>
  );
};
