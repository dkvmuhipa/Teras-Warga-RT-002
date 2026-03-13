import React, { useState, useEffect } from 'react';
import { Shield, Users, CheckCircle2, AlertTriangle, Calendar, UserCheck, Megaphone, Clock, MapPin, Activity, Search, Filter, Download, ChevronRight, Plus, Trash2, ArrowLeftRight, Check, X, Bell, RefreshCw, ShieldCheck } from 'lucide-react';
import { RondaSchedule, RondaCheckLog, House, RondaSwapRequest, PatrolSession, Checkpoint, Report, Official, MapPoint } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { HouseMap } from '../HouseMap';
import { subscribeToCheckpoints, updateRondaSchedule, updateRondaShifts, updateRondaSwapRequestStatus } from '../../services/databaseService';
import { CheckpointQRGenerator } from './CheckpointQRGenerator';
import { CheckpointManager } from './CheckpointManager';
import { MapPointManager } from './MapPointManager';
import { QrCode, Info } from 'lucide-react';

interface FacilityManagerProps {
  ronda: RondaSchedule[];
  rondaLogs: RondaCheckLog[];
  rondaSwapRequests: RondaSwapRequest[];
  houses: House[];
  activePatrol: PatrolSession | null;
  reports: Report[];
  officials: Official[];
  mapPoints: MapPoint[];
}

export const FacilityManager: React.FC<FacilityManagerProps> = ({ ronda, rondaLogs, rondaSwapRequests, houses, activePatrol, reports, officials, mapPoints }) => {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [isRondaModalOpen, setIsRondaModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [editingRonda, setEditingRonda] = useState<RondaSchedule | null>(null);
  const [rondaMembersInput, setRondaMembersInput] = useState('');
  const [logFilter, setLogFilter] = useState<'All' | 'Aman' | 'Insiden'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'schedule' | 'logs' | 'swaps' | 'checkpoints' | 'map' | 'info-points'>('schedule');

  // Shift Management State
  const [shifts, setShifts] = useState<{ id: string; time: string; members: string[] }[]>([]);
  const [residentSearch, setResidentSearch] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToCheckpoints((data) => {
        setCheckpoints(data);
    });
    return () => unsubscribe();
  }, []);

  const handleEditRonda = (schedule: RondaSchedule) => {
    setEditingRonda(schedule);
    setRondaMembersInput(schedule.members.join(', '));
    setShifts(schedule.shifts || [
      { id: '1', time: '22:00 - 01:00', members: [] },
      { id: '2', time: '01:00 - 04:00', members: [] }
    ]);
    setIsRondaModalOpen(true);
  };

  const handleSaveRonda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRonda || !editingRonda.id) return;
    
    // Save legacy members for backward compatibility
    const members = shifts.flatMap(s => s.members);
    await updateRondaSchedule(editingRonda.id, members);
    await updateRondaShifts(editingRonda.id, shifts);
    
    setIsRondaModalOpen(false);
  };

  const handleAddMemberToShift = (shiftId: string, memberName: string) => {
    setShifts(prev => prev.map(s => 
      s.id === shiftId 
        ? { ...s, members: Array.from(new Set([...s.members, memberName])) } 
        : s
    ));
    setResidentSearch('');
  };

  const handleRemoveMemberFromShift = (shiftId: string, memberName: string) => {
    setShifts(prev => prev.map(s => 
      s.id === shiftId 
        ? { ...s, members: s.members.filter(m => m !== memberName) } 
        : s
    ));
  };

  const handleUpdateSwapStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    await updateRondaSwapRequestStatus(id, status);
  };

  const handleAutoRotate = () => {
    // Simple rotation logic: shift everyone one day forward
    // In a real app, this would be more complex
    alert("Fitur Rotasi Otomatis sedang diproses. Sistem akan mengacak jadwal berdasarkan ketersediaan warga.");
  };

  const residents = houses
    .filter(h => h.status === 'Occupied')
    .map(h => h.headOfFamily)
    .filter(name => name !== '-');

  const filteredResidents = residents.filter(r => 
    r.toLowerCase().includes(residentSearch.toLowerCase())
  );

  const filteredLogs = rondaLogs.filter(log => {
    const matchesFilter = logFilter === 'All' || (logFilter === 'Aman' ? log.status === 'Aman' : log.status !== 'Aman');
    const matchesSearch = log.officerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (log.note || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const isPatrolActive = !!activePatrol;
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12"
    >
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="w-full lg:w-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
              <Shield size={20} />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Pusat Komando Keamanan</h2>
          </div>
          <p className="text-slate-500 text-sm md:text-base font-medium">Sistem Monitoring Siskamling Digital RT 002</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <Button onClick={() => setIsQRModalOpen(true)} variant="outline" className="flex-1 sm:flex-none border-slate-200 hover:bg-slate-50 text-xs py-2">
            <QrCode size={16} className="mr-1.5" /> <span className="hidden sm:inline">Cetak QR</span><span className="sm:hidden">QR</span>
          </Button>
          <Button onClick={handleAutoRotate} variant="outline" className="flex-1 sm:flex-none border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-xs py-2">
            <RefreshCw size={16} className="mr-1.5" /> <span className="hidden sm:inline">Rotasi Otomatis</span><span className="sm:hidden">Rotasi</span>
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none border-slate-200 hover:bg-slate-50 text-xs py-2">
            <Download size={16} className="mr-1.5" /> <span className="hidden sm:inline">Export</span><span className="sm:hidden">Export</span>
          </Button>
          <Button onClick={() => setIsReportModalOpen(true)} className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 text-xs py-2">
            <AlertTriangle size={16} className="mr-1.5" /> <span className="hidden sm:inline">Laporkan Insiden</span><span className="sm:hidden">Lapor</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full lg:w-fit overflow-x-auto no-scrollbar">
        {[
          { id: 'schedule', label: 'Jadwal', icon: Calendar },
          { id: 'logs', label: 'Log', icon: Activity },
          { id: 'swaps', label: 'Tukar', icon: ArrowLeftRight, count: rondaSwapRequests.filter(r => r.status === 'Pending').length },
          { id: 'checkpoints', label: 'Titik', icon: MapPin },
          { id: 'info-points', label: 'Info', icon: Info },
          { id: 'map', label: 'Peta', icon: ShieldCheck }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-white text-indigo-600 shadow-lg shadow-indigo-100' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={14} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
            <span className={activeTab === tab.id ? 'inline' : 'hidden sm:inline'}>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-rose-500 text-white w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[8px] md:text-[10px] animate-pulse">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Live Status Banner */}
      <AnimatePresence>
        {activePatrol && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-indigo-600 text-white p-4 sm:p-5 rounded-[1.5rem] sm:rounded-3xl flex flex-col sm:flex-row items-center justify-between shadow-xl shadow-indigo-100 border border-indigo-500 gap-4">
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="relative">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-400 rounded-full animate-ping absolute inset-0"></div>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-400 rounded-full relative"></div>
                </div>
                <div>
                  <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest opacity-80">Status Saat Ini</p>
                  <p className="font-black text-sm sm:text-lg">Patroli Sedang Berlangsung</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 sm:flex items-center gap-3 sm:gap-6 w-full sm:w-auto">
                <div className="text-center sm:text-right">
                  <p className="text-[8px] sm:text-[10px] font-bold uppercase opacity-70">Petugas</p>
                  <p className="font-bold text-[10px] sm:text-sm truncate max-w-[60px] sm:max-w-none">{activePatrol.officerName}</p>
                </div>
                <div className="w-px h-8 bg-white/20 hidden sm:block"></div>
                <div className="text-center sm:text-right">
                  <p className="text-[8px] sm:text-[10px] font-bold uppercase opacity-70">Mulai</p>
                  <p className="font-bold text-[10px] sm:text-sm">{new Date(activePatrol.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                </div>
                <div className="w-px h-8 bg-white/20 hidden sm:block"></div>
                <div className="text-center sm:text-right">
                  <p className="text-[8px] sm:text-[10px] font-bold uppercase opacity-70">Progress</p>
                  <p className="font-bold text-[10px] sm:text-sm">{activePatrol.visitedCheckpoints.length}/{checkpoints.length}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {[
          { label: 'Status Patroli', value: isPatrolActive ? 'Aktif' : 'Standby', icon: Activity, color: 'indigo', sub: 'Kondisi Lingkungan' },
          { label: 'Laporan Aman', value: rondaLogs.filter(l => l.status === 'Aman').length, icon: CheckCircle2, color: 'emerald', sub: '24 Jam Terakhir' },
          { label: 'Insiden', value: rondaLogs.filter(l => l.status !== 'Aman').length, icon: AlertTriangle, color: 'rose', sub: 'Perlu Tindakan' },
          { label: 'Total Aktivitas', value: rondaLogs.length, icon: Calendar, color: 'blue', sub: 'Log Terintegrasi' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            variants={itemVariants}
            className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className={`p-2.5 sm:p-4 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl sm:rounded-2xl w-fit mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon size={18} className="sm:w-6 sm:h-6" />
            </div>
            <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">{stat.label}</p>
            <h3 className="text-base sm:text-2xl font-black text-slate-900">{stat.value}</h3>
            <p className="text-[8px] sm:text-[10px] font-medium text-slate-400 mt-0.5 sm:mt-1 hidden sm:block">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {activeTab === 'map' && (
          <div className="lg:col-span-3">
            <motion.div variants={itemVariants} className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 md:p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest text-xs md:text-sm"><ShieldCheck size={18} className="text-indigo-600"/> Visualisasi Keamanan</h3>
                  <p className="text-[9px] md:text-[10px] text-slate-400 font-bold mt-1">Pantau sebaran titik patroli dan kondisi rumah warga.</p>
                </div>
              </div>
              <div className="p-2 md:p-4">
                <HouseMap 
                  houses={houses} 
                  isAdmin={true} 
                  reports={reports} 
                  officials={officials} 
                  mapPoints={mapPoints}
                />
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <>
            {/* Weekly Schedule */}
            <motion.div variants={itemVariants} className="lg:col-span-1 space-y-4 md:space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-lg md:text-xl font-black text-slate-900">Jadwal Mingguan</h3>
                <Button variant="ghost" size="sm" className="text-indigo-600 font-bold hover:bg-indigo-50 text-[10px] md:text-xs">Lihat Kalender</Button>
              </div>
              <div className="space-y-3">
                {ronda.map((r) => {
                  const isToday = r.day === today;
                  return (
                    <div 
                      key={r.id || r.day} 
                      onClick={() => handleEditRonda(r)}
                      className={`p-4 rounded-[1.5rem] md:rounded-3xl border transition-all cursor-pointer group ${
                        isToday 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-100' 
                        : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-xs md:text-sm font-black shadow-sm ${
                            isToday ? 'bg-white/20 text-white' : 'bg-slate-50 text-indigo-600'
                          }`}>
                            {r.day.substring(0, 3)}
                          </div>
                          <div>
                            <h4 className="font-black text-sm md:text-base">{r.day}</h4>
                            <p className={`text-[8px] md:text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-indigo-200' : 'text-slate-400'}`}>
                              {r.shifts ? r.shifts.reduce((acc, s) => acc + s.members.length, 0) : r.members.length} Personil
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={16} className={isToday ? 'text-white/50' : 'text-slate-300'} />
                      </div>
                      <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/10 space-y-2 md:space-y-3">
                        {r.shifts ? r.shifts.map((s) => (
                          <div key={s.id} className="space-y-1">
                            <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${isToday ? 'text-indigo-200' : 'text-slate-400'}`}>{s.time}</p>
                            <div className="flex flex-wrap gap-1.5 md:gap-2">
                              {s.members.map((m, idx) => (
                                <span key={idx} className={`px-2 py-0.5 md:py-1 rounded-lg text-[8px] md:text-[10px] font-bold backdrop-blur-sm ${isToday ? 'bg-white/10' : 'bg-slate-50 text-slate-600'}`}>
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        )) : (
                          <div className="flex flex-wrap gap-1.5 md:gap-2">
                            {r.members.map((m, idx) => (
                              <span key={idx} className={`px-2 py-0.5 md:py-1 rounded-lg text-[8px] md:text-[10px] font-bold backdrop-blur-sm ${isToday ? 'bg-white/10' : 'bg-slate-50 text-slate-600'}`}>
                                {m}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Shift Overview Card */}
            <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-[1.5rem] md:rounded-[3rem] border border-slate-100 shadow-sm p-5 md:p-8">
              <div className="flex justify-between items-center mb-6 md:mb-8">
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-900">Detail Shift Hari Ini</h3>
                  <p className="text-[10px] md:text-xs font-medium text-slate-400 mt-1">Pembagian tugas siskamling malam ini</p>
                </div>
                <div className="p-2.5 md:p-3 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl">
                  <Clock size={20} className="md:w-6 md:h-6" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {(ronda.find(r => r.day === today)?.shifts || [
                  { id: '1', time: '22:00 - 01:00', members: ronda.find(r => r.day === today)?.members || [] },
                  { id: '2', time: '01:00 - 04:00', members: [] }
                ]).map((shift, idx) => (
                  <div key={shift.id} className="bg-slate-50 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                      <span className="px-2.5 py-0.5 bg-white rounded-full text-[8px] md:text-[10px] font-black text-indigo-600 border border-slate-100 uppercase tracking-widest">Shift {idx + 1}</span>
                      <span className="text-[10px] md:text-xs font-bold text-slate-400">{shift.time}</span>
                    </div>
                    <div className="space-y-2 md:space-y-3">
                      {shift.members.length > 0 ? shift.members.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 md:gap-3 bg-white p-2.5 md:p-3 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] md:text-xs font-black">{m.charAt(0)}</div>
                          <span className="text-xs md:text-sm font-bold text-slate-700">{m}</span>
                          <div className="ml-auto w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500"></div>
                        </div>
                      )) : (
                        <p className="text-[10px] md:text-xs text-slate-400 italic text-center py-4">Belum ada personil</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {activeTab === 'logs' && (
          <motion.div variants={itemVariants} className="lg:col-span-3 bg-white rounded-[1.5rem] md:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 md:p-8 border-b border-slate-50">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-6 md:mb-8">
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-900">Log Aktivitas Digital</h3>
                  <p className="text-[10px] md:text-xs font-medium text-slate-400 mt-1">Monitoring riwayat keamanan secara real-time</p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl md:rounded-2xl border border-slate-100 w-full md:w-auto overflow-x-auto no-scrollbar">
                  {(['All', 'Aman', 'Insiden'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setLogFilter(f)}
                      className={`flex-1 md:flex-none px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        logFilter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 md:w-[18px] md:h-[18px]" size={16} />
                <input 
                  type="text"
                  placeholder="Cari petugas, lokasi, atau catatan..."
                  className="w-full pl-11 md:pl-12 pr-4 py-2.5 md:py-3 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl text-xs md:text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[500px] md:max-h-[600px] p-5 md:p-8 space-y-4 md:space-y-6 custom-scrollbar">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, idx) => (
                  <div key={log.id} className="relative pl-6 md:pl-8 group">
                    {/* Timeline Line */}
                    {idx !== filteredLogs.length - 1 && (
                      <div className="absolute left-[9px] md:left-[11px] top-6 md:top-8 bottom-[-16px] md:bottom-[-24px] w-0.5 bg-slate-100 group-hover:bg-indigo-100 transition-colors"></div>
                    )}
                    {/* Timeline Dot */}
                    <div className={`absolute left-0 top-1 w-5 h-5 md:w-6 md:h-6 rounded-full border-[3px] md:border-4 border-white shadow-sm z-10 transition-transform group-hover:scale-125 ${
                      log.status === 'Aman' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}></div>

                    <div className="bg-slate-50/50 border border-slate-100 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 md:gap-4 mb-3 md:mb-4">
                        <div className="flex items-center gap-2.5 md:gap-3">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[10px] md:text-xs font-black text-indigo-600">
                            {log.officerName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-sm md:text-base">{log.officerName}</h4>
                            <div className="flex items-center gap-2 md:gap-3 text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                              <span className="flex items-center gap-1"><Clock size={10} className="md:w-3 md:h-3" /> {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                              <span className="flex items-center gap-1"><MapPin size={10} className="md:w-3 md:h-3" /> Pos Utama</span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 md:py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border ${
                          log.status === 'Aman' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      
                      <p className="text-xs md:text-sm text-slate-600 leading-relaxed italic mb-3 md:mb-4">"{log.note || 'Kondisi terpantau aman terkendali.'}"</p>
                      
                      {log.photoUrl && (
                        <div className="relative w-full h-32 md:h-48 rounded-xl md:rounded-2xl overflow-hidden border border-slate-200 group/img">
                          <img src={log.photoUrl} alt="Bukti Patroli" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <Button size="sm" variant="secondary" className="bg-white/90 backdrop-blur-sm text-[10px] h-8">Lihat Detail</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-2xl md:rounded-3xl flex items-center justify-center text-slate-200 mb-4">
                    <Search size={32} className="md:w-10 md:h-10" />
                  </div>
                  <h4 className="text-base md:text-lg font-bold text-slate-800">Tidak Ada Data</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">Coba ubah filter atau kata kunci pencarian Anda.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'swaps' && (
          <motion.div variants={itemVariants} className="lg:col-span-3 bg-white rounded-[1.5rem] md:rounded-[3rem] border border-slate-100 shadow-sm p-5 md:p-8">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <div>
                <h3 className="text-lg md:text-xl font-black text-slate-900">Permintaan Tukar Jadwal</h3>
                <p className="text-[10px] md:text-xs font-medium text-slate-400 mt-1">Kelola permohonan pergantian jadwal antar warga</p>
              </div>
              <div className="p-2.5 md:p-3 bg-amber-50 text-amber-600 rounded-xl md:rounded-2xl">
                <ArrowLeftRight size={20} className="md:w-6 md:h-6" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {rondaSwapRequests.length > 0 ? rondaSwapRequests.map((request) => (
                <div key={request.id} className="bg-slate-50 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 border border-slate-100 relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-4 md:mb-6">
                    <div className="flex items-center gap-2.5 md:gap-3">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-xs md:text-sm font-black text-indigo-600 shadow-sm">
                        {request.requesterName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm md:text-base">{request.requesterName}</h4>
                        <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rumah {request.requesterHouseId}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 md:py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border ${
                      request.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      request.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {request.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 md:p-4 bg-white rounded-xl md:rounded-2xl border border-slate-100 mb-4 md:mb-6">
                    <div className="text-center flex-1">
                      <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Dari</p>
                      <p className="text-xs md:text-sm font-black text-slate-700">{request.fromDay}</p>
                    </div>
                    <div className="px-3 md:px-4 text-indigo-400">
                      <ArrowLeftRight size={14} className="md:w-4 md:h-4" />
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ke</p>
                      <p className="text-xs md:text-sm font-black text-slate-700">{request.toDay}</p>
                    </div>
                  </div>

                  {request.reason && (
                    <p className="text-[10px] md:text-xs text-slate-500 italic mb-4 md:mb-6">"{request.reason}"</p>
                  )}

                  {request.status === 'Pending' && (
                    <div className="flex gap-2 md:gap-3">
                      <Button 
                        onClick={() => handleUpdateSwapStatus(request.id, 'Approved')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-9 md:h-10 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black"
                      >
                        <Check size={12} className="md:w-3.5 md:h-3.5 mr-1.5 md:mr-2" /> Setujui
                      </Button>
                      <Button 
                        onClick={() => handleUpdateSwapStatus(request.id, 'Rejected')}
                        variant="outline" 
                        className="flex-1 border-rose-100 text-rose-600 hover:bg-rose-50 h-9 md:h-10 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black"
                      >
                        <X size={12} className="md:w-3.5 md:h-3.5 mr-1.5 md:mr-2" /> Tolak
                      </Button>
                    </div>
                  )}
                </div>
              )) : (
                <div className="col-span-full py-12 md:py-20 text-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-2xl md:rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-4">
                    <Bell size={32} className="md:w-10 md:h-10" />
                  </div>
                  <h4 className="text-base md:text-lg font-bold text-slate-800">Tidak Ada Permintaan</h4>
                  <p className="text-xs text-slate-400 mt-1">Belum ada warga yang mengajukan tukar jadwal.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'checkpoints' && (
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <CheckpointManager />
          </motion.div>
        )}

        {activeTab === 'info-points' && (
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <MapPointManager mapPoints={mapPoints} houses={houses} />
          </motion.div>
        )}
      </div>

      <Modal isOpen={isRondaModalOpen} onClose={() => setIsRondaModalOpen(false)} title={`Pengaturan Jadwal: ${editingRonda?.day}`}>
        <form onSubmit={handleSaveRonda} className="space-y-8 max-w-2xl mx-auto">
          <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex items-center gap-6">
            <div className="p-4 bg-white rounded-2xl text-indigo-600 shadow-xl shadow-indigo-100"><Users size={28} /></div>
            <div>
              <p className="text-sm font-black text-indigo-900 uppercase tracking-widest">Konfigurasi Shift & Petugas</p>
              <p className="text-xs text-indigo-600 font-medium mt-1">Pilih warga dari daftar untuk ditugaskan pada shift malam ini.</p>
            </div>
          </div>

          <div className="space-y-6">
            {shifts.map((shift, sIdx) => (
              <div key={shift.id} className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 relative group">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-indigo-600 shadow-sm">{sIdx + 1}</span>
                    <h4 className="font-black text-slate-900 uppercase tracking-widest text-sm">Shift {sIdx + 1}</h4>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                    <Clock size={14} className="text-indigo-500" />
                    <input 
                      type="text" 
                      className="bg-transparent border-none outline-none text-xs font-black text-slate-700 w-24 text-center"
                      value={shift.time}
                      onChange={(e) => setShifts(prev => prev.map(s => s.id === shift.id ? { ...s, time: e.target.value } : s))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {shift.members.map((m, mIdx) => (
                      <div key={mIdx} className="flex items-center gap-2 bg-white pl-3 pr-1 py-1 rounded-xl border border-slate-200 shadow-sm animate-slide-in-right">
                        <span className="text-xs font-bold text-slate-700">{m}</span>
                        <button 
                          type="button"
                          onClick={() => handleRemoveMemberFromShift(shift.id, m)}
                          className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {shift.members.length === 0 && (
                      <p className="text-xs text-slate-400 italic py-2">Belum ada warga terpilih</p>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text"
                      placeholder="Cari nama warga..."
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      onChange={(e) => setResidentSearch(e.target.value)}
                      onFocus={() => setResidentSearch('')}
                    />
                    {residentSearch && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto custom-scrollbar p-2">
                        {filteredResidents.length > 0 ? filteredResidents.map((r, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleAddMemberToShift(shift.id, r)}
                            className="w-full text-left px-4 py-3 hover:bg-indigo-50 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between group"
                          >
                            {r}
                            <Plus size={14} className="opacity-0 group-hover:opacity-100 text-indigo-600" />
                          </button>
                        )) : (
                          <p className="text-xs text-slate-400 italic p-4 text-center">Warga tidak ditemukan</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => setIsRondaModalOpen(false)} className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Batal</Button>
            <Button type="submit" className="flex-1 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 font-black uppercase tracking-widest text-xs">Simpan Jadwal</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Laporan Insiden Keamanan">
        <div className="space-y-6">
          <div className="p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-rose-100/0 to-rose-100/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <button className="w-20 h-20 bg-rose-600 text-white rounded-full flex items-center justify-center mx-auto hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 hover:scale-110 active:scale-95">
                <Megaphone size={32} />
              </button>
              <h4 className="text-lg font-black text-rose-900 mt-6">Tekan & Bicara</h4>
              <p className="text-xs text-rose-600 font-medium mt-1">AI akan otomatis mentranskripsi laporan Anda.</p>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 w-1 bg-indigo-500 rounded-full"></div>
            <div className="pl-4">
              <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Detail Laporan Manual</label>
              <textarea 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all h-32"
                placeholder="Jelaskan situasi atau kejadian yang Anda temukan..."
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsReportModalOpen(false)} className="flex-1 py-3">Batal</Button>
            <Button className="flex-1 py-3 bg-rose-600 hover:bg-rose-700">Kirim Laporan Darurat</Button>
          </div>
        </div>
      </Modal>

      {isQRModalOpen && <CheckpointQRGenerator onClose={() => setIsQRModalOpen(false)} />}
    </motion.div>
  );
};
