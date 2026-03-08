import React, { useState } from 'react';
import { Bell, Shield, DollarSign, Megaphone, Calendar, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/Button';
import { AppNotification } from '../../types';

interface NotificationCombinedProps {
  notifications: AppNotification[];
}

export const NotificationCombined: React.FC<NotificationCombinedProps> = ({ notifications }) => {
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'settings'>('list');
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Notifikasi</h2>
          <p className="text-slate-500 font-medium mt-1">Kelola notifikasi dan preferensi Anda.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button onClick={() => setActiveSubTab('list')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Daftar</button>
          <button onClick={() => setActiveSubTab('settings')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'settings' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Pengaturan</button>
        </div>
      </div>

      {activeSubTab === 'list' ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {notifications.length > 0 ? (
              notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((n) => (
                <div key={n.id} className="p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                  <div className={`p-3 rounded-2xl ${n.type === 'Alert' ? 'bg-rose-50 text-rose-600' : n.type === 'Success' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    {n.type === 'Alert' ? <AlertCircle size={20} /> : n.type === 'Success' ? <CheckCircle size={20} /> : <Info size={20} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-800">{n.title}</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(n.date).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-slate-400 italic">Belum ada notifikasi.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {options.map(opt => (
            <div key={opt.key} className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl text-indigo-600">
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
          <Button>Simpan Pengaturan</Button>
        </div>
      )}
    </motion.div>
  );
};
