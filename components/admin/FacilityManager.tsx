import React, { useState, useEffect } from 'react';
import { Shield, Users, CheckCircle2, AlertTriangle, Calendar, UserCheck, Megaphone, Clock, MapPin, Activity, Search, Filter, Download, ChevronRight, Plus, Trash2, ArrowLeftRight, Check, X, Bell, RefreshCw, ShieldCheck, Eye, Navigation } from 'lucide-react';
import { RondaSchedule, RondaCheckLog, House, RondaSwapRequest, PatrolSession, Checkpoint, Report, Official, MapPoint, PanicAlert, RondaAttendance } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { HouseMap } from '../HouseMap';
import { 
  subscribeToCheckpoints, 
  updateRondaSchedule, 
  updateRondaScheduleFull, 
  updateRondaShifts, 
  updateRondaSwapRequestStatus, 
  updatePanicAlertStatus,
  addRondaAttendance,
  updateHouseData,
  addReportToDb
} from '../../services/databaseService';
import { CheckpointQRGenerator } from './CheckpointQRGenerator';
import { CheckpointManager } from './CheckpointManager';
import { MapPointManager } from './MapPointManager';
import { QrCode, Info, Share2 } from 'lucide-react';
import { sendWhatsAppMessage, formatRondaScheduleForWhatsApp } from '../../services/whatsappService';
import { toast } from 'sonner';
import { useConfirm } from '../../context/ConfirmContext';

interface FacilityManagerProps {
  ronda: RondaSchedule[];
  rondaLogs: RondaCheckLog[];
  rondaSwapRequests: RondaSwapRequest[];
  houses: House[];
  activePatrol: PatrolSession | null;
  reports: Report[];
  officials: Official[];
  mapPoints: MapPoint[];
  activePanicAlerts: PanicAlert[];
  rondaAttendance: RondaAttendance[];
}

export const FacilityManager: React.FC<FacilityManagerProps> = ({ ronda, rondaLogs, rondaSwapRequests, houses, activePatrol, reports, officials, mapPoints, activePanicAlerts, rondaAttendance }) => {
  const confirm = useConfirm();
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [isRondaModalOpen, setIsRondaModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportHouse, setSelectedReportHouse] = useState<House | null>(null);
  const [reportForm, setReportForm] = useState({
    type: 'Keamanan' as Report['type'],
    description: '',
    block: '',
    houseNumber: ''
  });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [presentMembers, setPresentMembers] = useState<string[]>([]);
  const [attendanceNotes, setAttendanceNotes] = useState('');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const availableBlocks = Array.from(new Set(houses.map(h => h.block))).sort();
  const [editingRonda, setEditingRonda] = useState<RondaSchedule | null>(null);
  const [rondaMembersInput, setRondaMembersInput] = useState('');
  const [logFilter, setLogFilter] = useState<'All' | 'Aman' | 'Insiden'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'schedule' | 'logs' | 'swaps' | 'checkpoints' | 'map' | 'info-points' | 'monitoring' | 'attendance' | 'leaderboard'>('monitoring');

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
    await updateRondaScheduleFull(editingRonda.id, {
      members,
      shifts
    });
    
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

  const handleUpdateSwapStatus = async (id: string, status: 'Disetujui' | 'Ditolak') => {
    await updateRondaSwapRequestStatus(id, status);
  };

  const handleAutoRotate = async () => {
    const isConfirmed = await confirm({
      title: 'Acak Jadwal Ronda',
      message: 'Sistem akan mengacak ulang seluruh jadwal ronda berdasarkan daftar kepala keluarga yang ada dengan prinsip keadilan (berdasarkan jumlah tugas) dan keragaman blok. Lanjutkan?',
      confirmLabel: 'Acak Ulang',
      isDanger: true
    });
    if (!isConfirmed) return;

    // Filter residents: Occupied, not exempt, has headOfFamily
    const eligibleHouses = houses
      .filter(h => h.status === 'Occupied' && !h.rondaExempt && h.headOfFamily && h.headOfFamily !== '-' && h.headOfFamily !== 'Kosong');

    if (eligibleHouses.length === 0) {
      toast.error("Tidak ada warga yang dapat ditugaskan.");
      return;
    }

    // Sort by fairness: lowest duty count first, then oldest last duty
    const sortedResidents = [...eligibleHouses].sort((a, b) => {
      const countA = a.rondaDutyCount || 0;
      const countB = b.rondaDutyCount || 0;
      if (countA !== countB) return countA - countB;
      
      const lastA = a.rondaLastDuty ? new Date(a.rondaLastDuty).getTime() : 0;
      const lastB = b.rondaLastDuty ? new Date(b.rondaLastDuty).getTime() : 0;
      return lastA - lastB;
    });

    // To ensure block diversity, we can group by block and then pick round-robin
    const blocks: Record<string, House[]> = {};
    sortedResidents.forEach(h => {
      if (!blocks[h.block]) blocks[h.block] = [];
      blocks[h.block].push(h);
    });

    const blockNames = Object.keys(blocks);
    const finalShuffled: string[] = [];
    let blockIndex = 0;
    let residentsAdded = 0;
    const totalToPick = sortedResidents.length;

    while (residentsAdded < totalToPick) {
      const currentBlock = blockNames[blockIndex % blockNames.length];
      const house = blocks[currentBlock].shift();
      if (house) {
        finalShuffled.push(house.headOfFamily);
        residentsAdded++;
      }
      blockIndex++;
    }
    
    // Distribute to 7 days
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const basePerDay = Math.floor(finalShuffled.length / 7);
    const extraDays = finalShuffled.length % 7;
    
    let currentIndex = 0;
    
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const schedule = ronda.find(r => r.day === day);
      if (!schedule || !schedule.id) continue;

      const membersCount = basePerDay + (i < extraDays ? 1 : 0);
      const dayMembers = finalShuffled.slice(currentIndex, currentIndex + membersCount);
      currentIndex += membersCount;
      
      const mid = Math.ceil(dayMembers.length / 2);
      const shift1 = dayMembers.slice(0, mid);
      const shift2 = dayMembers.slice(mid);
      
      await updateRondaScheduleFull(schedule.id, {
        members: dayMembers,
        shifts: [
          { id: '1', time: '22:00 - 01:00', members: shift1 },
          { id: '2', time: '01:00 - 04:00', members: shift2 }
        ]
      });
    }

    toast.success("Jadwal berhasil dirotasi secara adil!");
  };

  const handleShareToWhatsApp = () => {
    const message = formatRondaScheduleForWhatsApp(ronda);
    // Open WhatsApp with the message
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleDownloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Hari,Shift,Petugas\n";

    ronda.forEach(day => {
      if (day.shifts && day.shifts.length > 0) {
        day.shifts.forEach(shift => {
          csvContent += `${day.day},${shift.time},"${shift.members.join(', ')}"\n`;
        });
      } else {
        csvContent += `${day.day},-, "${day.members.join(', ')}"\n`;
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `jadwal_ronda_rt02_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Jadwal berhasil diunduh sebagai CSV");
  };

  const handleClearSchedule = async () => {
    const isConfirmed = await confirm({
      title: 'Kosongkan Jadwal',
      message: 'Sistem akan mengosongkan seluruh jadwal ronda. Lanjutkan?',
      confirmLabel: 'Kosongkan',
      isDanger: true
    });
    if (!isConfirmed) return;
    
    for (const schedule of ronda) {
      if (schedule.id) {
        await updateRondaScheduleFull(schedule.id, {
          members: [],
          shifts: [
            { id: '1', time: '22:00 - 01:00', members: [] },
            { id: '2', time: '01:00 - 04:00', members: [] }
          ]
        });
      }
    }
    alert("Jadwal berhasil dikosongkan!");
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

  const handleRespondPanic = async (id: string) => {
    const adminName = localStorage.getItem('admin_name') || 'Admin';
    await updatePanicAlertStatus(id, 'Responding', adminName);
  };

  const handleResolvePanic = async (id: string) => {
    await updatePanicAlertStatus(id, 'Resolved');
  };

  const handleReportHouse = (house: House) => {
    setSelectedReportHouse(house);
    setReportForm({
      type: 'Keamanan',
      description: `Laporan di Rumah ${house.block}-${house.number}: `,
      block: house.block,
      houseNumber: house.number
    });
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmittingReport(true);
    try {
      const adminName = localStorage.getItem('admin_name') || 'Admin';
      const targetHouse = selectedReportHouse || houses.find(h => h.block === reportForm.block && h.number === reportForm.houseNumber);
      
      await addReportToDb({
        type: reportForm.type,
        description: reportForm.description,
        reporterName: adminName,
        reporterHouseId: 'ADMIN',
        houseId: targetHouse?.id || '',
        date: new Date().toISOString(),
        status: 'Baru'
      });
      toast.success("Laporan berhasil dikirim!");
      setIsReportModalOpen(false);
      setSelectedReportHouse(null);
      setReportForm({ type: 'Keamanan', description: '', block: '', houseNumber: '' });
    } catch (error) {
      toast.error("Gagal mengirim laporan");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleSaveAttendance = async () => {
    const day = new Date(attendanceDate).toLocaleDateString('id-ID', { weekday: 'long' });
    const schedule = ronda.find(r => r.day === day);
    if (!schedule) {
      toast.error("Jadwal tidak ditemukan untuk hari ini.");
      return;
    }

    const allMembers = schedule.members || [];
    const absent = allMembers.filter(m => !presentMembers.includes(m));

    const adminName = localStorage.getItem('admin_name') || 'Admin';

    await addRondaAttendance({
      date: attendanceDate,
      day,
      presentMembers,
      absentMembers: absent,
      notes: attendanceNotes,
      recordedBy: adminName,
      timestamp: new Date().toISOString()
    });

    // Update Points and Duty Count for present members
    for (const memberName of presentMembers) {
      const house = houses.find(h => h.headOfFamily === memberName);
      if (house) {
        await updateHouseData(house.id, {
          rondaPoints: (house.rondaPoints || 0) + 10, // 10 points per duty
          rondaDutyCount: (house.rondaDutyCount || 0) + 1,
          rondaLastDuty: new Date().toISOString()
        });
      }
    }

    toast.success("Absensi berhasil disimpan dan poin telah ditambahkan!");
    setPresentMembers([]);
    setAttendanceNotes('');
  };

  const handleSendTomorrowReminder = async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const day = tomorrow.toLocaleDateString('id-ID', { weekday: 'long' });
    const schedule = ronda.find(r => r.day === day);
    
    if (!schedule) {
      toast.error("Jadwal besok tidak ditemukan.");
      return;
    }

    const message = `*PENGINGAT RONDA BESOK*\n\nHari: ${day}\nTanggal: ${tomorrow.toLocaleDateString('id-ID')}\n\nPetugas:\n${schedule.members.map((m, i) => `${i+1}. ${m}`).join('\n')}\n\nMohon kehadirannya tepat waktu. Terima kasih!`;
    
    sendWhatsAppMessage('', message); // Send to general or specific group if configured
    toast.success("Pesan pengingat telah disiapkan!");
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
          <p className="text-slate-500 text-sm md:text-base font-medium">Sistem Monitoring Siskamling Digital RT 02</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <Button onClick={() => setIsQRModalOpen(true)} variant="outline" className="flex-1 sm:flex-none border-slate-200 hover:bg-slate-50 text-xs py-2">
            <QrCode size={16} className="mr-1.5" /> <span className="hidden sm:inline">Cetak QR</span><span className="sm:hidden">QR</span>
          </Button>
          <Button onClick={handleSendTomorrowReminder} variant="outline" className="flex-1 sm:flex-none border-green-200 text-green-600 hover:bg-green-50 text-xs py-2">
            <Bell size={16} className="mr-1.5" /> <span className="hidden sm:inline">Ingatkan Besok</span><span className="sm:hidden">Ingat</span>
          </Button>
          <Button onClick={handleShareToWhatsApp} variant="outline" className="flex-1 sm:flex-none border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-xs py-2">
            <Share2 size={16} className="mr-1.5" /> <span className="hidden sm:inline">Bagikan WA</span><span className="sm:hidden">WA</span>
          </Button>
          <Button onClick={handleAutoRotate} variant="outline" className="flex-1 sm:flex-none border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-xs py-2">
            <RefreshCw size={16} className="mr-1.5" /> <span className="hidden sm:inline">Rotasi Otomatis</span><span className="sm:hidden">Rotasi</span>
          </Button>
          <Button onClick={handleClearSchedule} variant="outline" className="flex-1 sm:flex-none border-rose-200 text-rose-600 hover:bg-rose-50 text-xs py-2">
            <Trash2 size={16} className="mr-1.5" /> <span className="hidden sm:inline">Kosongkan</span><span className="sm:hidden">Kosong</span>
          </Button>
          <Button onClick={handleDownloadCSV} variant="outline" className="flex-1 sm:flex-none border-slate-200 text-slate-600 hover:bg-slate-50 text-xs py-2">
            <Download size={16} className="mr-1.5" /> <span className="hidden sm:inline">Unduh CSV</span><span className="sm:hidden">CSV</span>
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
          { id: 'monitoring', label: 'Monitoring', icon: Eye, count: activePanicAlerts.length },
          { id: 'swaps', label: 'Tukar', icon: ArrowLeftRight, count: rondaSwapRequests.filter(r => r.status === 'Menunggu').length },
          { id: 'attendance', label: 'Absensi', icon: UserCheck },
          { id: 'leaderboard', label: 'Peringkat', icon: ShieldCheck },
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
            key={stat.label}
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
        {activeTab === 'monitoring' && (
          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Live Map */}
              <div className="xl:col-span-3">
                <motion.div variants={itemVariants} className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-5 md:p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <div>
                      <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest text-xs md:text-sm">
                        <Navigation size={18} className="text-indigo-600 animate-pulse"/> Live Tracking
                      </h3>
                      <p className="text-[9px] md:text-[10px] text-slate-400 font-bold mt-1">Pantau posisi petugas dan alarm darurat secara real-time.</p>
                    </div>
                  </div>
                  <div className="p-2 md:p-4">
                    <HouseMap 
                      houses={houses} 
                      isAdmin={true} 
                      reports={reports} 
                      officials={officials} 
                      mapPoints={mapPoints}
                      activePatrol={activePatrol}
                      activePanicAlerts={activePanicAlerts}
                      onReportHouse={handleReportHouse}
                    />
                  </div>
                </motion.div>
              </div>

              {/* Panic Alerts List */}
              <div className="xl:col-span-1 space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest px-2">Alarm Darurat Aktif</h3>
                {activePanicAlerts.length > 0 ? (
                  activePanicAlerts.map((alert) => (
                    <motion.div 
                      key={alert.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-5 rounded-3xl border shadow-lg ${
                        alert.status === 'Active' ? 'bg-rose-50 border-rose-200 shadow-rose-100' : 'bg-amber-50 border-amber-200 shadow-amber-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-xl ${alert.status === 'Active' ? 'bg-rose-600 text-white animate-bounce' : 'bg-amber-500 text-white'}`}>
                          <AlertTriangle size={20} />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-sm">{alert.residentName}</h4>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Blok {alert.location}</p>
                        </div>
                      </div>

                      <div className="space-y-3 mb-5">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-slate-400">Status</span>
                          <span className={alert.status === 'Active' ? 'text-rose-600' : 'text-amber-600'}>{alert.status}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-slate-400">Waktu</span>
                          <span className="text-slate-700">{new Date(alert.timestamp).toLocaleTimeString('id-ID')}</span>
                        </div>
                        {alert.responderName && (
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-slate-400">Merespon</span>
                            <span className="text-slate-700">{alert.responderName}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {alert.status === 'Active' ? (
                          <Button 
                            onClick={() => handleRespondPanic(alert.id)}
                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-[10px] font-black uppercase py-2.5"
                          >
                            Respon
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => handleResolvePanic(alert.id)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-black uppercase py-2.5"
                          >
                            Selesai
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-8 text-center">
                    <ShieldCheck size={32} className="text-slate-200 mx-auto mb-3" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tidak ada alarm aktif</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
                  onReportHouse={handleReportHouse}
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
                                <span key={`${m}-${idx}`} className={`px-2 py-0.5 md:py-1 rounded-lg text-[8px] md:text-[10px] font-bold backdrop-blur-sm ${isToday ? 'bg-white/10' : 'bg-slate-50 text-slate-600'}`}>
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        )) : (
                          <div className="flex flex-wrap gap-1.5 md:gap-2">
                            {r.members.map((m, idx) => (
                              <span key={`${m}-${idx}`} className={`px-2 py-0.5 md:py-1 rounded-lg text-[8px] md:text-[10px] font-bold backdrop-blur-sm ${isToday ? 'bg-white/10' : 'bg-slate-50 text-slate-600'}`}>
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
                        <div key={`${m}-${i}`} className="flex items-center gap-2 md:gap-3 bg-white p-2.5 md:p-3 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm">
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
                      request.status === 'Menunggu' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      request.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
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

                  {request.status === 'Menunggu' && (
                    <div className="flex gap-2 md:gap-3">
                      <Button 
                        onClick={() => handleUpdateSwapStatus(request.id, 'Disetujui')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-9 md:h-10 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black"
                      >
                        <Check size={12} className="md:w-3.5 md:h-3.5 mr-1.5 md:mr-2" /> Setujui
                      </Button>
                      <Button 
                        onClick={() => handleUpdateSwapStatus(request.id, 'Ditolak')}
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

        {activeTab === 'attendance' && (
          <motion.div variants={itemVariants} className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-[1.5rem] md:rounded-[3rem] border border-slate-100 shadow-sm p-5 md:p-8">
              <div className="flex justify-between items-center mb-6 md:mb-8">
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-900">Pencatatan Absensi Ronda</h3>
                  <p className="text-[10px] md:text-xs font-medium text-slate-400 mt-1">Catat kehadiran warga yang bertugas malam ini</p>
                </div>
                <div className="p-2.5 md:p-3 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl">
                  <UserCheck size={20} className="md:w-6 md:h-6" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Pilih Tanggal</label>
                    <input 
                      type="date" 
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Catatan Tambahan</label>
                    <textarea 
                      value={attendanceNotes}
                      onChange={(e) => setAttendanceNotes(e.target.value)}
                      placeholder="Contoh: Warga A sakit, digantikan oleh Warga B"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all h-24 resize-none"
                    />
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Daftar Petugas (Centang yang Hadir)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(() => {
                      const day = new Date(attendanceDate).toLocaleDateString('id-ID', { weekday: 'long' });
                      const schedule = ronda.find(r => r.day === day);
                      if (!schedule) return <p className="text-slate-400 text-xs italic">Tidak ada jadwal untuk hari {day}</p>;
                      
                      const allMembers = schedule.members || [];
                      return allMembers.map((member, idx) => (
                        <div 
                          key={`${member}-${idx}`}
                          onClick={() => {
                            if (presentMembers.includes(member)) {
                              setPresentMembers(presentMembers.filter(m => m !== member));
                            } else {
                              setPresentMembers([...presentMembers, member]);
                            }
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl md:rounded-2xl border transition-all cursor-pointer ${
                            presentMembers.includes(member)
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-200'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            presentMembers.includes(member)
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'bg-white border-slate-200'
                          }`}>
                            {presentMembers.includes(member) && <Check size={12} strokeWidth={4} />}
                          </div>
                          <span className="text-xs md:text-sm font-black">{member}</span>
                        </div>
                      ));
                    })()}
                  </div>

                  <div className="mt-8 flex justify-end">
                    <Button 
                      onClick={handleSaveAttendance}
                      disabled={presentMembers.length === 0}
                      className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 px-8 py-3 rounded-2xl"
                    >
                      Simpan Absensi
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] md:rounded-[3rem] border border-slate-100 shadow-sm p-5 md:p-8">
              <h3 className="text-lg md:text-xl font-black text-slate-900 mb-6 md:mb-8">Riwayat Absensi</h3>
              <div className="space-y-4">
                {rondaAttendance.length > 0 ? rondaAttendance.map((record) => (
                  <div key={record.id} className="p-4 md:p-6 rounded-[1.5rem] md:rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all group">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex flex-col items-center justify-center shadow-sm">
                          <p className="text-[8px] font-black text-slate-400 uppercase">{record.day.substring(0, 3)}</p>
                          <p className="text-sm font-black text-indigo-600">{new Date(record.date).getDate()}</p>
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-sm md:text-base">{new Date(record.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</h4>
                          <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dicatat oleh: {record.recordedBy}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 w-full md:w-auto">
                        <div className="flex-1 md:flex-none text-center px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                          <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Hadir</p>
                          <p className="text-sm font-black text-emerald-700">{record.presentMembers.length}</p>
                        </div>
                        <div className="flex-1 md:flex-none text-center px-4 py-2 bg-rose-50 rounded-xl border border-rose-100">
                          <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest mb-0.5">Absen</p>
                          <p className="text-sm font-black text-rose-700">{record.absentMembers.length}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Daftar Hadir</p>
                        <div className="flex flex-wrap gap-1.5">
                          {record.presentMembers.map((m: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-white border border-slate-100 rounded-lg text-[10px] font-bold text-slate-600">{m}</span>
                          ))}
                        </div>
                      </div>
                      {record.notes && (
                        <div>
                          <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Catatan</p>
                          <p className="text-xs text-slate-500 italic">"{record.notes}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold">Belum ada data absensi</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <motion.div variants={itemVariants} className="lg:col-span-3 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-8">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Peringkat Keaktifan Ronda</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Warga paling berdedikasi menjaga keamanan lingkungan.</p>
                </div>
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <ShieldCheck size={28} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {houses
                  .filter(h => (h.rondaPoints || 0) > 0)
                  .sort((a, b) => (b.rondaPoints || 0) - (a.rondaPoints || 0))
                  .slice(0, 3)
                  .map((h, i) => (
                    <div key={h.id} className={`p-8 rounded-[2rem] border relative overflow-hidden ${i === 0 ? 'bg-indigo-600 text-white border-indigo-700 shadow-xl shadow-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="relative z-10">
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${i === 0 ? 'text-indigo-200' : 'text-slate-400'}`}>Juara {i + 1}</p>
                        <h4 className="text-xl font-black mb-1">{h.headOfFamily}</h4>
                        <p className={`text-xs font-bold ${i === 0 ? 'text-indigo-100' : 'text-slate-500'}`}>Blok {h.block}-{h.number}</p>
                        <div className="mt-6 flex items-end gap-2">
                          <span className="text-3xl font-black">{h.rondaPoints || 0}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${i === 0 ? 'text-indigo-200' : 'text-slate-400'}`}>Poin</span>
                        </div>
                      </div>
                      <div className={`absolute -right-4 -bottom-4 opacity-10 ${i === 0 ? 'text-white' : 'text-indigo-600'}`}>
                        <ShieldCheck size={120} />
                      </div>
                    </div>
                  ))}
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest px-2">Daftar Keaktifan Seluruh Warga</h4>
                <div className="bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Warga</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Blok</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tugas</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Poin</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Terakhir Ronda</th>
                      </tr>
                    </thead>
                    <tbody>
                      {houses
                        .filter(h => h.status === 'Occupied')
                        .sort((a, b) => (b.rondaPoints || 0) - (a.rondaPoints || 0))
                        .map((h) => (
                          <tr key={h.id} className="border-b border-slate-100 hover:bg-white transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black uppercase">
                                  {h.headOfFamily.charAt(0)}
                                </div>
                                <span className="text-xs font-bold text-slate-700">{h.headOfFamily}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-500">Blok {h.block}-{h.number}</td>
                            <td className="px-6 py-4 text-xs font-black text-slate-700 text-center">{h.rondaDutyCount || 0}x</td>
                            <td className="px-6 py-4 text-center">
                              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black">{h.rondaPoints || 0}</span>
                            </td>
                            <td className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {h.rondaLastDuty ? new Date(h.rondaLastDuty).toLocaleDateString('id-ID') : '-'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'checkpoints' && (
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <CheckpointManager houses={houses} />
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
                      <div key={`${m}-${mIdx}`} className="flex items-center gap-2 bg-white pl-3 pr-1 py-1 rounded-xl border border-slate-200 shadow-sm animate-slide-in-right">
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
                            key={r}
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

      <Modal 
        isOpen={isReportModalOpen} 
        onClose={() => {
          setIsReportModalOpen(false);
          setSelectedReportHouse(null);
        }} 
        title={selectedReportHouse ? `Lapor Masalah: Rumah ${selectedReportHouse.block}-${selectedReportHouse.number}` : "Laporan Insiden Keamanan"}
      >
        <form onSubmit={handleSubmitReport} className="space-y-6">
          {selectedReportHouse ? (
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 font-black shadow-sm">
                {selectedReportHouse.number}
              </div>
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Target Laporan</p>
                <p className="text-sm font-bold text-slate-700">Rumah {selectedReportHouse.block}-{selectedReportHouse.number} ({selectedReportHouse.headOfFamily})</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest">Blok Rumah</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={reportForm.block}
                  onChange={(e) => setReportForm(prev => ({ ...prev, block: e.target.value, houseNumber: '' }))}
                >
                  <option value="">Pilih Blok</option>
                  {availableBlocks.map(block => (
                    <option key={block} value={block}>{block}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest">Nomor Rumah</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-50"
                  value={reportForm.houseNumber}
                  disabled={!reportForm.block}
                  onChange={(e) => setReportForm(prev => ({ ...prev, houseNumber: e.target.value }))}
                >
                  <option value="">Pilih Nomor</option>
                  {houses
                    .filter(h => h.block === reportForm.block)
                    .sort((a, b) => parseInt(a.number) - parseInt(b.number))
                    .map(h => (
                      <option key={h.id} value={h.number}>{h.number}</option>
                    ))
                  }
                </select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest">Kategori Laporan</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['Keamanan', 'Kebersihan', 'Fasilitas', 'Sosial', 'Lainnya'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setReportForm(prev => ({ ...prev, type }))}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    reportForm.type === type 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-100' 
                    : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 w-1 bg-indigo-500 rounded-full"></div>
            <div className="pl-4">
              <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Detail Laporan</label>
              <textarea 
                value={reportForm.description}
                onChange={(e) => setReportForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all h-32"
                placeholder="Jelaskan situasi atau kejadian yang Anda temukan..."
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => {
                setIsReportModalOpen(false);
                setSelectedReportHouse(null);
              }} 
              className="flex-1 py-3"
            >
              Batal
            </Button>
            <Button 
              type="submit"
              disabled={isSubmittingReport}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200"
            >
              {isSubmittingReport ? 'Mengirim...' : 'Kirim Laporan'}
            </Button>
          </div>
        </form>
      </Modal>

      {isQRModalOpen && <CheckpointQRGenerator onClose={() => setIsQRModalOpen(false)} />}
    </motion.div>
  );
};
