import React, { useState } from 'react';
import { Bell, Shield, DollarSign, Megaphone, Calendar, Info, AlertCircle, CheckCircle, Trash2, Search, CheckCheck, FileText, ArrowRight, Sparkles, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/Button';
import { AppNotification, House, Bill, PdfConfig } from '../../types';
import { WhatsAppBroadcastManager } from './WhatsAppBroadcastManager';
import { useConfirm } from '../../context/ConfirmContext';
import { toast } from 'sonner';

interface NotificationCombinedProps {
  notifications: AppNotification[];
  onDeleteNotification?: (id: string) => void;
  onClearAllNotifications?: () => void;
  houses: House[];
  bills: Bill[];
  pdfConfig: PdfConfig;
}

export const NotificationCombined: React.FC<NotificationCombinedProps> = ({ 
  notifications = [], 
  onDeleteNotification,
  onClearAllNotifications,
  houses = [],
  bills = [],
  pdfConfig
}) => {
  const confirm = useConfirm();
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'broadcast' | 'settings'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'Surat' | 'Keuangan' | 'Keamanan' | 'System'>('all');

  const [settings, setSettings] = useState({
    announcements: true,
    finance: true,
    events: false,
    security: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Pengaturan notifikasi berhasil diperbarui');
  };

  const options = [
    { key: 'announcements', icon: Megaphone, label: 'Pengumuman & Siaran RT', desc: 'Terima pemberitahuan saat ada pengumuman warga baru.' },
    { key: 'finance', icon: DollarSign, label: 'Keuangan & Pembayaran Iuran', desc: 'Terima pemberitahuan verifikasi transaksi iuran warga.' },
    { key: 'events', icon: Calendar, label: 'Agenda & Presensi Kegiatan', desc: 'Terima pemberitahuan pendaftaran dan presensi kegiatan.' },
    { key: 'security', icon: Shield, label: 'Keamanan & Tanggap Darurat', desc: 'Terima pemberitahuan sinyal darurat Panic Alert & ronda.' },
  ] as const;

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'Surat') return matchesSearch && (n.title.toLowerCase().includes('surat') || n.message.toLowerCase().includes('surat'));
    if (selectedFilter === 'Keuangan') return matchesSearch && (n.title.toLowerCase().includes('iuran') || n.title.toLowerCase().includes('bayar') || n.message.toLowerCase().includes('bayar'));
    if (selectedFilter === 'Keamanan') return matchesSearch && (n.title.toLowerCase().includes('ronda') || n.title.toLowerCase().includes('panic') || n.title.toLowerCase().includes('darurat'));
    return matchesSearch;
  });

  const handleClearAll = async () => {
    const isConfirmed = await confirm({
      title: 'Hapus Semua Notifikasi',
      message: 'Apakah Anda yakin ingin menghapus seluruh log riwayat notifikasi ini?',
      confirmLabel: 'Hapus Semua',
      isDanger: true
    });
    if (isConfirmed && onClearAllNotifications) {
      onClearAllNotifications();
      toast.success('Semua notifikasi berhasil dibersihkan');
    }
  };

  const getNotificationBadge = (n: AppNotification) => {
    if (n.type === 'Alert' || n.title.toLowerCase().includes('surat')) {
      return { label: 'Surat / Permohonan', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: FileText };
    }
    if (n.type === 'Success' || n.title.toLowerCase().includes('iuran')) {
      return { label: 'Keuangan', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: DollarSign };
    }
    return { label: 'Informasi', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Info };
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-indigo-600 rounded-full"></div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Pusat Komunikasi & Siaran</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">Notifikasi & Siaran Digital</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Pantau pemberitahuan sistem dan kelola siaran pengumuman WhatsApp warga secara terpadu.</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 w-full sm:w-auto overflow-x-auto no-scrollbar shadow-inner">
          <button 
            onClick={() => setActiveSubTab('list')} 
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
              activeSubTab === 'list' ? 'bg-white shadow-xs text-indigo-700 font-black' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell size={14} /> Log Notifikasi ({notifications.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('broadcast')} 
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
              activeSubTab === 'broadcast' ? 'bg-white shadow-xs text-indigo-700 font-black' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Megaphone size={14} className="text-emerald-600" /> Siaran WA 💬
          </button>
          <button 
            onClick={() => setActiveSubTab('settings')} 
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
              activeSubTab === 'settings' ? 'bg-white shadow-xs text-indigo-700 font-black' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield size={14} /> Pengaturan
          </button>
        </div>
      </div>

      {activeSubTab === 'list' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Notifikasi</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{notifications.length} <span className="text-xs font-bold text-slate-400">Pesan</span></span>
                <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">Log Riwayat Sistem</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <Bell size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Permohonan Surat</span>
                <span className="text-2xl font-black text-sky-600 mt-1 block">
                  {notifications.filter(n => n.title.toLowerCase().includes('surat') || n.message.toLowerCase().includes('surat')).length} <span className="text-xs font-bold text-sky-400">Masuk</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">Perlu Diproses Admin</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                <FileText size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Status Jaringan</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">ONLINE ✓</span>
                <span className="text-[10px] font-bold text-emerald-500 mt-0.5 block">Teras Real-Time Active</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCheck size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative group w-full sm:w-auto flex-1">
                <input 
                  type="text" 
                  placeholder="Cari permohonan surat, nama warga, atau isi notifikasi..." 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              </div>

              {notifications.length > 0 && onClearAllNotifications && (
                <Button 
                  onClick={handleClearAll}
                  variant="outline"
                  className="w-full sm:w-auto border-rose-200 text-rose-600 hover:bg-rose-50 rounded-2xl text-xs font-black uppercase tracking-wider py-3"
                >
                  <Trash2 size={15} className="mr-1.5" /> Hapus Semua
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {[
                { id: 'all', label: 'Semua Notifikasi' },
                { id: 'Surat', label: 'Permohonan Surat' },
                { id: 'Keuangan', label: 'Iuran & Kas' },
                { id: 'Keamanan', label: 'Siskamling' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                    selectedFilter === f.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((n) => {
                      const badge = getNotificationBadge(n);
                      const IconComp = badge.icon;

                      return (
                        <motion.div 
                          key={n.id} 
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="p-6 flex items-start gap-4 hover:bg-slate-50/80 transition-all group"
                        >
                          <div className={`p-3.5 rounded-2xl border ${badge.color} shrink-0 mt-1`}>
                            <IconComp size={20} />
                          </div>
                          
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-2.5 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-widest border ${badge.color}`}>
                                    {badge.label}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-slate-400">
                                    {new Date(n.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {new Date(n.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <h4 className="font-black text-slate-900 text-base leading-snug">{n.title}</h4>
                                <p className="text-sm font-medium text-slate-600 leading-relaxed mt-1">{n.message}</p>
                              </div>

                              {onDeleteNotification && (
                                <button 
                                  onClick={() => onDeleteNotification(n.id)}
                                  className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                  title="Hapus Notifikasi"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                ) : (
                  <div className="py-16 text-center text-slate-400 italic bg-slate-50/50">
                    <Bell size={40} className="text-slate-300 mx-auto mb-3" />
                    <p className="font-bold text-base text-slate-600">Belum Ada Notifikasi Masuk</p>
                    <p className="text-xs text-slate-400 mt-1">Pemberitahuan permohonan surat dan transaksi warga akan muncul di sini secara otomatis.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'broadcast' ? (
        <WhatsAppBroadcastManager houses={houses} bills={bills} pdfConfig={pdfConfig} />
      ) : (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xs mb-4">
            <h3 className="text-lg font-black text-slate-900">Pengaturan Kategori Notifikasi Sistem</h3>
            <p className="text-xs text-slate-500 font-medium">Aktifkan atau nonaktifkan notifikasi otomatis untuk tiap aktivitas pengurus RT.</p>
          </div>

          <div className="space-y-4">
            {options.map(opt => (
              <div key={opt.key} className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-slate-100 shadow-xs hover:border-indigo-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shrink-0">
                    <opt.icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-base">{opt.label}</h4>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{opt.desc}</p>
                  </div>
                </div>

                <button
                  onClick={() => toggleSetting(opt.key)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-1 ${settings[opt.key] ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings[opt.key] ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>
          <Button>Simpan Pengaturan</Button>
        </div>
      )}
    </motion.div>
  );
};
