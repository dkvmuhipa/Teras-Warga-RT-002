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
  updateRondaAttendance,
  updateHouseData,
  addReportToDb,
  startPatrolSession,
  finishPatrolSession,
  updatePatrolLocation,
  visitCheckpoint
} from '../../services/databaseService';
import { CheckpointQRGenerator } from './CheckpointQRGenerator';
import { CheckpointManager } from './CheckpointManager';
import { MapPointManager } from './MapPointManager';
import { QrCode, Info, Share2, Printer, Wand2, ChevronDown } from 'lucide-react';
import { sendWhatsAppMessage, formatRondaScheduleForWhatsApp } from '../../services/whatsappService';
import { generateRondaSchedulePDF } from '../../services/pdfService';
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
  const [activeTab, setActiveTab] = useState<'schedule' | 'logs' | 'checkpoints' | 'monitoring' | 'attendance'>('monitoring');
  const [scheduleSubTab, setScheduleSubTab] = useState<'calendar' | 'swaps' | 'leaderboard'>('calendar');
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState('');
  const [selectedScheduleDay, setSelectedScheduleDay] = useState<string>('');

  // Shift Management State
  const [shifts, setShifts] = useState<{ id: string; time: string; members: string[] }[]>([]);
  const [residentSearch, setResidentSearch] = useState('');
  const [selectedTargetShiftId, setSelectedTargetShiftId] = useState<string>('1');

  // Futuristic UI States
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [simCheckOfficerName, setSimCheckOfficerName] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStartSimPatrol = async (officerName: string) => {
    if (!officerName.trim()) {
      toast.error("Format input salah: Isi Nama Petugas Patroli!");
      return;
    }

    if (activePatrol && activePatrol.status === 'Ongoing') {
      const patrolAgeMinutes = (Date.now() - new Date(activePatrol.startTime).getTime()) / (1000 * 60);
      if (patrolAgeMinutes < 240) { // 4 hours timeout guard
        toast.error(`Sesi patroli masih aktif oleh ${activePatrol.officerName}! Selesaikan sesi yang ada terlebih dahulu.`);
        return;
      } else {
        // Auto-finish expired patrol session
        await finishPatrolSession(activePatrol.id);
        toast.info(`Sesi patroli sebelumnya (>${Math.round(patrolAgeMinutes / 60)} jam) otomatis ditutup oleh sistem.`);
      }
    }

    try {
      await startPatrolSession(officerName);
      toast.success(`Sesi Patroli Siskamling oleh ${officerName} berhasil diaktifkan!`);
    } catch (err) {
      toast.error("Gagal menjadwalkan patroli simulasi.");
    }
  };

  const handleSimVisitCheckpoint = async (checkpoint: Checkpoint) => {
    if (!activePatrol) return;
    try {
      await visitCheckpoint(activePatrol.id, checkpoint.id);
      await updatePatrolLocation(activePatrol.id, checkpoint.x || 0, checkpoint.y || 0);
      toast.success(`Check-In Siskamling berhasil di ${checkpoint.name}!`, {
        description: `Koordinat: ${checkpoint.x || 0}%, ${checkpoint.y || 0}% telah disimpan.`
      });
    } catch (err) {
      toast.error("Gagal check-in checkpoint.");
    }
  };

  const handleFinishSimPatrol = async () => {
    if (!activePatrol) return;
    try {
      await finishPatrolSession(activePatrol.id);
      toast.success("Patroli siskamling telah diselesaikan. Log patroli tersimpan secara permanen.");
    } catch (err) {
      toast.error("Gagal menyelesaikan patroli.");
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToCheckpoints((data) => {
        setCheckpoints(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const existing = rondaAttendance?.find(a => a.date === attendanceDate);
    if (existing) {
      setPresentMembers(existing.presentMembers || []);
      setAttendanceNotes(existing.notes || '');
    } else {
      setPresentMembers([]);
      setAttendanceNotes('');
    }
  }, [attendanceDate, rondaAttendance]);

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
    toast.success("Jadwal berhasil dikosongkan!");
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
    toast.success("Status Darurat diperbarui: Sedang Direspon.");
  };

  const handleResolvePanic = async (id: string) => {
    const alertToResolve = activePanicAlerts.find(a => a.id === id);
    await updatePanicAlertStatus(id, 'Resolved');

    if (alertToResolve) {
      try {
        const adminName = localStorage.getItem('admin_name') || 'Admin';
        const targetHouse = houses.find(h => h.block === alertToResolve.location.split('-')[0] && h.number === alertToResolve.location.split('-')[1]) || houses.find(h => h.headOfFamily === alertToResolve.residentName);
        
        await addReportToDb({
          type: 'Keamanan',
          description: `[TANGGAP DARURAT PANIC ALERT] Sinyal bahaya dari ${alertToResolve.residentName} (Blok ${alertToResolve.location}) telah ditangani dan diselesaikan oleh ${alertToResolve.responderName || adminName}.`,
          reporterName: alertToResolve.residentName || 'Warga RT 02',
          reporterHouseId: targetHouse?.id || 'PANIC_ALERT',
          houseId: targetHouse?.id || '',
          date: new Date().toISOString(),
          status: 'Selesai'
        });
        toast.success("Alarm Darurat diselesaikan & otomatis dicatat ke Laporan Kejadian RT!");
      } catch (err) {
        console.error("Gagal mencatat laporan panic alert:", err);
      }
    } else {
      toast.success("Alarm Darurat diselesaikan.");
    }
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
    const [yr, mo, dy] = attendanceDate.split('-').map(Number);
    const localDate = new Date(yr, mo - 1, dy);
    const day = localDate.toLocaleDateString('id-ID', { weekday: 'long' });
    
    const schedule = ronda.find(r => r.day === day);
    if (!schedule) {
      toast.error(`Jadwal tidak ditemukan untuk hari ${day}.`);
      return;
    }

    const allMembers = schedule.members || [];
    const absent = allMembers.filter(m => !presentMembers.includes(m));
    const adminName = localStorage.getItem('admin_name') || 'Admin';

    const existingRecord = rondaAttendance.find(a => a.date === attendanceDate);

    if (existingRecord) {
      // Update existing record
      await updateRondaAttendance(existingRecord.id, {
        presentMembers,
        absentMembers: absent,
        notes: attendanceNotes,
        recordedBy: adminName,
        timestamp: new Date().toISOString()
      });

      // Calculate newly present members (add points)
      const oldPresent = existingRecord.presentMembers || [];
      const newlyPresent = presentMembers.filter(m => !oldPresent.includes(m));
      for (const memberName of newlyPresent) {
        const house = houses.find(h => h.headOfFamily === memberName);
        if (house) {
          await updateHouseData(house.id, {
            rondaPoints: (house.rondaPoints || 0) + 10,
            rondaDutyCount: (house.rondaDutyCount || 0) + 1,
            rondaLastDuty: new Date().toISOString()
          });
        }
      }

      // Calculate newly absent members (subtract points/duty)
      const newlyAbsent = oldPresent.filter(m => !presentMembers.includes(m));
      for (const memberName of newlyAbsent) {
        const house = houses.find(h => h.headOfFamily === memberName);
        if (house) {
          await updateHouseData(house.id, {
            rondaPoints: Math.max(0, (house.rondaPoints || 0) - 10),
            rondaDutyCount: Math.max(0, (house.rondaDutyCount || 0) - 1)
          });
        }
      }

      toast.success("Absensi berhasil diperbarui!");
    } else {
      // Create new record
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
    }
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
      {/* Futuristic Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="w-full lg:w-auto">
          <div className="flex items-center gap-3.5 mb-1.5">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Pusat Komando Keamanan</h2>
              <p className="text-xs md:text-sm font-medium text-slate-500">Sistem Monitoring Siskamling Digital RT 02 & Tanggap Darurat</p>
            </div>
          </div>
        </div>

        {/* Action Header Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          
          {/* Dropdown Menu Aksi & Alat */}
          <div className="relative">
            <button
              onClick={() => setShowActionMenu(!showActionMenu)}
              className="flex items-center gap-2 px-5 py-3 bg-white text-slate-700 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm"
            >
              <Wand2 size={16} className="text-indigo-600" />
              <span>Aksi & Alat</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${showActionMenu ? 'rotate-180' : ''}`} />
            </button>

            {showActionMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-100 shadow-2xl z-50 p-2 space-y-1">
                <button
                  onClick={() => { setIsQRModalOpen(true); setShowActionMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors"
                >
                  <QrCode size={16} className="text-indigo-500" /> Cetak QR Code Pos
                </button>
                <button
                  onClick={() => {
                    const currentPdfConfig = (window as any).pdfConfig || { rtName: 'RT 02', kelurahan: 'TONDO', kecamatan: 'MANTIKULORE', rtChairman: 'Ketua RT' };
                    generateRondaSchedulePDF(ronda, currentPdfConfig);
                    setShowActionMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors"
                >
                  <Printer size={16} className="text-indigo-500" /> Cetak Poster PDF (A4)
                </button>
                <button
                  onClick={() => { handleSendTomorrowReminder(); setShowActionMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-colors"
                >
                  <Bell size={16} className="text-emerald-500" /> Ingatkan Besok (WA)
                </button>
                <button
                  onClick={() => { handleShareToWhatsApp(); setShowActionMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-colors"
                >
                  <Share2 size={16} className="text-emerald-500" /> Bagikan Jadwal WA
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  onClick={() => { handleAutoRotate(); setShowActionMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors"
                >
                  <RefreshCw size={16} className="text-indigo-500" /> Acak Otomatis Jadwal
                </button>
                <button
                  onClick={() => { handleDownloadCSV(); setShowActionMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <Download size={16} className="text-slate-500" /> Unduh CSV Jadwal
                </button>
                <button
                  onClick={() => { handleClearSchedule(); setShowActionMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <Trash2 size={16} /> Kosongkan Jadwal
                </button>
              </div>
            )}
          </div>

          {/* Emergency Lapor Insiden Button */}
          <Button 
            onClick={() => setIsReportModalOpen(true)} 
            className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white shadow-lg shadow-rose-200 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider"
          >
            <AlertTriangle size={16} className="mr-2 animate-bounce" /> Laporkan Insiden
          </Button>
        </div>
      </div>

      {/* Cyberpunk Futuristic Console Status Header */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full animate-ping absolute inset-0"></span>
              <span className="w-3.5 h-3.5 bg-emerald-400 rounded-full relative block shadow-lg shadow-emerald-500/50"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
                  MAIN CONSOLE ONLINE
                </span>
                <span className="text-[10px] font-mono text-slate-400">RT 02 DIGITAL NETWORK</span>
              </div>
              <h3 className="text-lg font-black text-slate-100 tracking-tight mt-1">Terminal Pengawasan & Komando Siskamling</h3>
            </div>
          </div>

          {/* Live Clock Digital */}
          <div className="flex items-center gap-4 self-end md:self-auto bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700/60 backdrop-blur-sm">
            <Clock size={16} className="text-indigo-400" />
            <div className="text-right">
              <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Waktu Lokal (WITA)</p>
              <p className="text-sm font-mono font-black text-indigo-300">
                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WITA
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 w-full overflow-x-auto no-scrollbar shadow-inner">
        {[
          { id: 'monitoring', label: 'Pusat Kontrol Siskamling', icon: Eye, count: activePanicAlerts.length },
          { id: 'schedule', label: 'Jadwal & Keaktifan', icon: Calendar, count: rondaSwapRequests.filter(r => r.status === 'Menunggu').length },
          { id: 'logs', label: 'Log Patroli', icon: Activity },
          { id: 'attendance', label: 'Absensi Ronda', icon: UserCheck },
          { id: 'checkpoints', label: 'Kelola Pos', icon: MapPin }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <tab.icon size={15} />
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black animate-pulse">
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
            {/* Live Telemetry Overview Header Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[2rem] border border-slate-800 shadow-2xl gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 rounded-2xl shrink-0 shadow-lg shadow-indigo-500/20">
                  <Eye size={24} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <h3 className="font-black text-xs md:text-sm uppercase tracking-widest text-slate-100">
                      Pusat Kontrol Siskamling & Telemetri Real-Time (Main Console)
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-1">
                    Terminal pemantauan sensor pos ronda, gps patroli, dan sinyal tanggap darurat warga RT 02.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Button 
                  onClick={() => {
                    toast.success("Konektivitas Siskamling & Pos QR diperbarui!", {
                      description: "Seluruh sensor dan terminal darurat terhubung 100%."
                    });
                  }}
                  variant="outline" 
                  className="border-slate-700 hover:bg-slate-800/80 text-slate-200 text-[10px] font-black uppercase py-2.5 px-4 rounded-xl tracking-wider h-auto bg-slate-800/50 backdrop-blur-sm"
                >
                  <RefreshCw size={14} className="mr-1.5 text-indigo-400" /> Segarkan Jaringan
                </Button>
                {activePanicAlerts.length > 0 && (
                  <div className="px-4 py-2.5 bg-rose-600/30 border border-rose-500/40 text-rose-200 font-black text-[10px] rounded-xl flex items-center gap-2 animate-pulse uppercase tracking-wider">
                    <AlertTriangle size={14} className="text-rose-400 animate-bounce" /> {activePanicAlerts.length} Panggilan Darurat
                  </div>
                )}
              </div>
            </div>

            {/* Tactical Live KPI Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {/* Stat 1: Emergency Status */}
              <div className={`p-5 rounded-3xl border transition-all ${
                activePanicAlerts.length > 0
                  ? 'bg-gradient-to-br from-rose-500 to-rose-700 text-white border-rose-600 shadow-lg shadow-rose-200'
                  : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <div className="flex justify-between items-start">
                  <span className={`p-2 rounded-xl text-[9px] font-bold leading-none uppercase ${
                    activePanicAlerts.length > 0 ? 'bg-white/10 text-white' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    Status Lingkungan
                  </span>
                  <div className={`w-2 h-2 rounded-full ${activePanicAlerts.length > 0 ? 'bg-white animate-ping' : 'bg-emerald-500'}`} />
                </div>
                <div className="mt-4">
                  <h4 className={`text-sm md:text-lg font-black ${activePanicAlerts.length > 0 ? 'text-white' : 'text-slate-800'}`}>
                    {activePanicAlerts.length > 0 ? 'ZONA DARURAT' : 'KONDISI AMAN'}
                  </h4>
                  <p className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${activePanicAlerts.length > 0 ? 'text-rose-100' : 'text-slate-400'}`}>
                    {activePanicAlerts.length > 0 ? `${activePanicAlerts.length} alarm aktif` : 'RT 02 Kondusif'}
                  </p>
                </div>
              </div>

              {/* Stat 2: Active Patrol Officer */}
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
                <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                  Petugas Aktif
                </span>
                <div className="mt-4">
                  <h4 className="text-xs md:text-sm font-black text-slate-800 truncate">
                    {activePatrol ? activePatrol.officerName : 'Standby / Menunggu'}
                  </h4>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                    {activePatrol ? 'Sedang Patroli' : 'Tiada Sesi Aktif'}
                  </p>
                </div>
              </div>

              {/* Stat 3: Checkpoint Progress Bar */}
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                      Pencapaian Pos
                    </span>
                    <span className="text-[10px] font-black text-slate-600">
                      {activePatrol ? `${activePatrol.visitedCheckpoints.length}/${checkpoints.length}` : `0/${checkpoints.length || 5}`}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
                      style={{ 
                        width: checkpoints.length > 0 && activePatrol
                          ? `${(activePatrol.visitedCheckpoints.length / checkpoints.length) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                </div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                  {activePatrol ? 'Persentase Scan Pos' : 'Patroli Offline'}
                </p>
              </div>

              {/* Stat 4: Reports Count Current Month */}
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                  Total Laporan
                </span>
                <div className="mt-4">
                  <h4 className="text-sm md:text-lg font-black text-slate-800">
                    {reports.length} Laporan
                  </h4>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                    Insiden & Kamtibmas
                  </p>
                </div>
              </div>
            </div>

            {/* Workspace Areas */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Live Map wrapper */}
              <div className="xl:col-span-3 space-y-6">
                <motion.div variants={itemVariants} className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-5 md:p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <div>
                      <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest text-xs md:text-sm">
                        <Navigation size={18} className="text-indigo-600 animate-pulse"/> Tracking Real-Time Map
                      </h3>
                      <p className="text-[9px] md:text-[10px] text-slate-400 font-bold mt-1">Pantau posisi petugas ronda malam dan lokasi rumah warga secara instan.</p>
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

                {/* Live Activity Feed Log */}
                <div className="bg-white rounded-[2rem] border border-slate-100 p-5 md:p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-indigo-50/50 pb-3">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Aktivitas Siskamling Terbaru</h4>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">Aliran logs siskamling lingkungan saat ini</p>
                    </div>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[220px] overflow-y-auto no-scrollbar">
                    {rondaLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 hover:shadow-sm transition-all text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold ${
                            log.status === 'Aman' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {log.status === 'Aman' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-black text-slate-800 truncate">
                              {log.officerName} melakukan scan di <span className="text-indigo-600 font-extrabold">{log.location}</span>
                            </p>
                            <p className="text-[9.5px] font-bold text-slate-450 mt-0.5">
                              {log.note || 'Kondisi Aman Terkendali.'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-3">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                            log.status === 'Aman' ? 'bg-emerald-100 text-emerald-700 font-extrabold' : 'bg-rose-100 text-rose-700 font-extrabold'
                          }`}>
                            {log.status}
                          </span>
                          <span className="block text-[9px] font-semibold text-slate-400 mt-1">
                            {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                    {rondaLogs.length === 0 && (
                      <p className="text-[10px] text-slate-400 italic text-center py-4 font-bold">Belum ada aktivitas scan pos ronda terdaftar.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Side controls column */}
              <div className="xl:col-span-1 space-y-6">
                {/* Panic Alerts Stack */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    Alarm Darurat Aktif
                  </h3>
                  {activePanicAlerts.length > 0 ? (
                    activePanicAlerts.map((alert) => (
                      <motion.div 
                        key={alert.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-4 rounded-3xl border shadow-lg relative overflow-hidden transition-all ${
                          alert.status === 'Active' ? 'bg-rose-50 border-rose-200 shadow-rose-100' : 'bg-amber-50 border-amber-200 shadow-amber-100'
                        }`}
                      >
                        <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full blur-xl opacity-20 bg-rose-600" />
                        
                        <div className="flex items-center gap-3 mb-3 relative z-10">
                          <div className={`p-2 rounded-xl ${alert.status === 'Active' ? 'bg-rose-600 text-white animate-bounce' : 'bg-amber-500 text-white'}`}>
                            <AlertTriangle size={18} />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-xs">{alert.residentName}</h4>
                            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Blok {alert.location}</p>
                          </div>
                        </div>

                        <div className="space-y-1.5 mb-3 text-[10px] bg-white/60 p-3 rounded-xl border border-slate-100/40 font-bold uppercase tracking-widest relative z-10">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Status</span>
                            <span className={alert.status === 'Active' ? 'text-rose-600 font-extrabold' : 'text-amber-600 font-extrabold'}>{alert.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Waktu</span>
                            <span className="text-slate-700 font-extrabold">{new Date(alert.timestamp).toLocaleTimeString('id-ID')}</span>
                          </div>
                          {alert.responderName && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Merespon</span>
                              <span className="text-slate-700 font-extrabold">{alert.responderName}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 relative z-10">
                          {alert.status === 'Active' ? (
                            <Button 
                              onClick={() => handleRespondPanic(alert.id)}
                              className="flex-1 bg-rose-600 hover:bg-rose-700 hover:scale-[1.02] active:scale-95 text-[10px] font-black uppercase py-2.5 rounded-xl transition-all shadow-md shadow-rose-200"
                            >
                              🚨 Respon
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => handleResolvePanic(alert.id)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 text-[10px] font-black uppercase py-2.5 rounded-xl transition-all shadow-md shadow-emerald-250"
                            >
                              ✅ Selesai
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[2rem] p-5 text-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                        <ShieldCheck size={20} />
                      </div>
                      <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Seluruh Zona Kondusif</p>
                      <p className="text-[9px] font-bold text-slate-450 mt-1 uppercase">Sistem Sensor Siskamling Aktif</p>
                    </div>
                  )}
                </div>

                {/* Siskamling Patrol Simulator Widget */}
                <div className="bg-slate-900 text-white rounded-[2rem] p-5 shadow-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                        <Activity size={14} className="animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest leading-none">Walkie-Talkie</h3>
                        <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Radio & GPS Simulator</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-950/50 rounded-full text-[8px] font-black text-indigo-400 uppercase tracking-widest border border-indigo-900/40">SIMULATOR</span>
                  </div>

                  {!activePatrol ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Pilih Petugas Ronda</label>
                        <select 
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                          value={simCheckOfficerName}
                          onChange={(e) => setSimCheckOfficerName(e.target.value)}
                        >
                          <option value="">-- Pilih Anggota Terjadwal --</option>
                          {(() => {
                            const todayDay = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
                            const sched = ronda.find(r => r.day === todayDay);
                            return (sched?.members || []).map(m => (
                              <option key={m} value={m}>{m} (Jadwal Hari Ini)</option>
                            ));
                          })()}
                          <option value="Admin Keamanan">Admin Keamanan (Saya)</option>
                          <option value="Bpk. RT">Bapak RT (Siaga)</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-center py-2 bg-slate-950/40 rounded-xl border border-slate-800">
                        <div className="flex items-end gap-1 px-4 h-6">
                          <div className="w-1 bg-indigo-500 animate-[bounce_1.2s_infinite]" style={{ height: '40%' }}></div>
                          <div className="w-1 bg-indigo-500 animate-[bounce_1s_infinite_0.2s]" style={{ height: '80%' }}></div>
                          <div className="w-1 bg-indigo-500 animate-[bounce_1.4s_infinite_0.4s]" style={{ height: '50%' }}></div>
                          <div className="w-1 bg-indigo-500 animate-[bounce_0.8s_infinite_0.1s]" style={{ height: '90%' }}></div>
                          <div className="w-1 bg-indigo-400 animate-[bounce_1.1s_infinite_0.3s]" style={{ height: '30%' }}></div>
                        </div>
                      </div>

                      <Button 
                        onClick={() => handleStartSimPatrol(simCheckOfficerName || 'Petugas Ronda')}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white transition-all shadow-md shadow-indigo-950/30"
                      >
                        Mulai Patroli Mandiri
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-wider text-slate-500">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                            TX ACTIVE
                          </span>
                          <span className="text-indigo-400">STABLE SIGNAL</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-600/10 text-indigo-400 flex items-center justify-center text-xs font-black">
                            {activePatrol.officerName.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-black truncate">{activePatrol.officerName}</h4>
                            <p className="text-[8px] text-indigo-400 font-bold tracking-wide uppercase">Dinas Ronda Malam</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-[10px] font-black text-slate-400">
                        <p className="text-[8px] tracking-widest uppercase mb-1">Checklist Pos Patroli</p>
                        <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                          {checkpoints.map((cp, idx) => {
                            const isVisited = activePatrol.visitedCheckpoints.includes(cp.id);
                            return (
                              <div 
                                key={cp.id} 
                                className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                                  isVisited 
                                    ? 'bg-indigo-600/10 border-indigo-600/30 text-indigo-300' 
                                    : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold shrink-0 ${isVisited ? 'bg-indigo-600 text-white' : 'bg-slate-750 text-slate-400'}`}>
                                    {idx + 1}
                                  </span>
                                  <span className="truncate text-[10px] font-medium">{cp.name}</span>
                                </div>

                                {isVisited ? (
                                  <span className="text-[8px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-0.5 shrink-0">
                                    <Check size={10} /> TERVERIFIKASI
                                  </span>
                                ) : (
                                  <button 
                                    onClick={() => handleSimVisitCheckpoint(cp)}
                                    type="button"
                                    className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[8px] font-black uppercase tracking-wider transition-all scale-95 hover:scale-100 shrink-0"
                                  >
                                    Scan
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <Button 
                        onClick={handleFinishSimPatrol}
                        className="w-full bg-rose-600 hover:bg-rose-700 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white transition-all shadow-md shadow-rose-950/20"
                      >
                        Selesaikan Siskamling
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="lg:col-span-3 space-y-6 md:space-y-8">
            {/* Professional metric overview cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {/* Metric 1 */}
              <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-[2rem] p-5 md:p-6 border border-indigo-700/40 shadow-xl relative overflow-hidden group">
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start">
                    <span className="p-3 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-indigo-300 shadow-md">
                      <Calendar size={20} className="animate-pulse" />
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/80">
                      LIVE
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-[10px] uppercase font-mono tracking-widest text-indigo-300">Total Matriks Hari</p>
                    <h4 className="text-xl md:text-2xl font-black mt-1 text-slate-100">7 Hari Aktif</h4>
                  </div>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="bg-white rounded-[2rem] p-5 md:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start">
                    <span className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                      <ArrowLeftRight size={20} />
                    </span>
                    {rondaSwapRequests.filter(r => r.status === 'Menunggu').length > 0 && (
                      <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[9px] font-black animate-pulse">
                        PERLU RESPON
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400">Tukar Jadwal</p>
                    <h4 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
                      {rondaSwapRequests.filter(r => r.status === 'Menunggu').length} Menunggu
                    </h4>
                  </div>
                </div>
              </div>

              {/* Metric 3 */}
              <div className="bg-white rounded-[2rem] p-5 md:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start">
                    <span className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                      <Users size={20} />
                    </span>
                    <span className="text-[9px] font-mono text-emerald-600 font-extrabold uppercase">SIAGA HARI INI</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400">Ronda Malam Ini</p>
                    <h4 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
                      {ronda.find(r => r.day === today)?.shifts?.reduce((acc, s) => acc + s.members.length, 0) || ronda.find(r => r.day === today)?.members?.length || 0} Personil
                    </h4>
                  </div>
                </div>
              </div>

              {/* Metric 4 */}
              <div className="bg-white rounded-[2rem] p-5 md:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start">
                    <span className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                      <ShieldCheck size={20} />
                    </span>
                    <span className="text-[9px] font-black text-indigo-600 uppercase">POIN TERTINGGI</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400">Juara Keaktifan</p>
                    <h4 className="text-base md:text-lg font-black text-indigo-700 mt-1 truncate">
                      {(() => {
                        const occupied = houses.filter(h => h.status === 'Occupied');
                        if (occupied.length === 0) return "-";
                        const best = [...occupied].sort((a, b) => (b.rondaPoints || 0) - (a.rondaPoints || 0))[0];
                        return best ? `${best.headOfFamily} (${best.rondaPoints || 0} Pts)` : "-";
                      })()}
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom styled dashboard level sub-tab controller */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-slate-100/80 p-2 rounded-2xl md:rounded-3xl border border-slate-200">
              <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
                <button
                  onClick={() => { setScheduleSubTab('calendar'); setScheduleSearchQuery(''); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    scheduleSubTab === 'calendar'
                      ? 'bg-white text-indigo-700 shadow-md shadow-indigo-100'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                  }`}
                >
                  <Calendar size={15} />
                  <span>Jadwal Shift</span>
                </button>
                <button
                  onClick={() => { setScheduleSubTab('swaps'); setScheduleSearchQuery(''); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative ${
                    scheduleSubTab === 'swaps'
                      ? 'bg-white text-indigo-700 shadow-md shadow-indigo-100'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                  }`}
                >
                  <ArrowLeftRight size={15} />
                  <span>Tukar Jadwal</span>
                  {rondaSwapRequests.filter(r => r.status === 'Menunggu').length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">
                      {rondaSwapRequests.filter(r => r.status === 'Menunggu').length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { setScheduleSubTab('leaderboard'); setScheduleSearchQuery(''); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    scheduleSubTab === 'leaderboard'
                      ? 'bg-white text-indigo-700 shadow-md shadow-indigo-100'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                  }`}
                >
                  <ShieldCheck size={15} />
                  <span>Peringkat & Keaktifan</span>
                </button>
              </div>

              {/* Sub-tab quick actions/filters */}
              {scheduleSubTab === 'leaderboard' && (
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Cari kepala keluarga..."
                    value={scheduleSearchQuery}
                    onChange={(e) => setScheduleSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white/10 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              )}
              {scheduleSubTab === 'swaps' && (
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Cari pemohon..."
                    value={scheduleSearchQuery}
                    onChange={(e) => setScheduleSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white/10 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              )}
              {scheduleSubTab === 'calendar' && (
                <div className="flex gap-2 w-full md:w-auto">
                  <Button onClick={handleAutoRotate} variant="outline" className="flex-1 md:flex-none border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-[10px] md:text-xs py-1.5 h-auto font-black shadow-sm uppercase tracking-wider">
                    <RefreshCw size={12} className="mr-1" /> Acak Ronda
                  </Button>
                  <Button onClick={handleSendTomorrowReminder} variant="outline" className="flex-1 md:flex-none border-green-200 text-green-600 hover:bg-green-50 text-[10px] md:text-xs py-1.5 h-auto font-black shadow-sm uppercase tracking-wider">
                    <Bell size={12} className="mr-1" /> Notif Besok
                  </Button>
                </div>
              )}
            </div>

            {/* TAB CONTENT 1: CALENDAR VIEW */}
            {scheduleSubTab === 'calendar' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Day selector list */}
                <div className="lg:col-span-1 space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Pilih Hari Patroli</p>
                    <span className="text-[10px] font-bold text-slate-500">{ronda.length} Hari Terjadwal</span>
                  </div>
                  <div className="space-y-2.5">
                    {ronda.map((r) => {
                      const isToday = r.day === today;
                      const isSelected = r.day === (selectedScheduleDay || today);
                      const totalMembers = r.shifts ? r.shifts.reduce((acc, s) => acc + s.members.length, 0) : r.members.length;
                      return (
                        <div
                          key={r.id || r.day}
                          onClick={() => setSelectedScheduleDay(r.day)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex items-center justify-between group ${
                            isSelected
                              ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10'
                              : isToday
                                ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900 hover:bg-indigo-50'
                                : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 relative z-10">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                              isSelected
                                ? 'bg-white/10 text-white'
                                : isToday
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-700'
                            }`}>
                              {r.day.substring(0, 3)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-bold text-xs md:text-sm">{r.day}</h4>
                                {isToday && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                )}
                              </div>
                              <p className={`text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                                {totalMembers} Personil Ditugaskan
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 relative z-10">
                            {isToday && !isSelected && (
                              <span className="px-1.5 py-0.5 bg-indigo-100 border border-indigo-200 rounded text-[8px] font-black text-indigo-700 uppercase tracking-wider">
                                Hari Ini
                              </span>
                            )}
                            <ChevronRight size={14} className={isSelected ? 'text-white' : 'text-slate-300'} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Day shifts detail panel */}
                <div className="lg:col-span-2">
                  {(() => {
                    const selectedDayData = ronda.find(r => r.day === (selectedScheduleDay || today)) || ronda[0];
                    if (!selectedDayData) return null;
                    const shiftsData = selectedDayData.shifts || [
                      { id: '1', time: '22:00 - 01:00', members: selectedDayData.members || [] },
                      { id: '2', time: '01:00 - 04:00', members: [] }
                    ];

                    return (
                      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                              <h3 className="text-base md:text-lg font-black text-slate-900">Pembagian Shift: {selectedDayData.day}</h3>
                            </div>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Siskamling & Patroli Pos Ronda Malam</p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 items-center">
                            {shiftsData.some(s => s.members.length > 0) && (
                              <Button
                                variant="outline"
                                onClick={async () => {
                                  const isConfirmed = await confirm({
                                    title: `Kosongkan Seluruh Shift ${selectedDayData.day}`,
                                    message: `Apakah Anda yakin ingin mengosongkan seluruh personil ronda pada hari ${selectedDayData.day}?`,
                                    confirmLabel: 'Ya, Kosongkan Semua',
                                    isDanger: true
                                  });
                                  if (!isConfirmed || !selectedDayData.id) return;
                                  const clearedShifts = shiftsData.map(s => ({ ...s, members: [] }));
                                  await updateRondaScheduleFull(selectedDayData.id, {
                                    members: [],
                                    shifts: clearedShifts
                                  });
                                  toast.success(`Seluruh shift hari ${selectedDayData.day} berhasil dikosongkan.`);
                                }}
                                className="border-rose-200 text-rose-600 hover:bg-rose-50 text-[10px] md:text-xs font-black uppercase tracking-wider px-3.5 py-2.5 rounded-xl transition-all shadow-sm"
                              >
                                🗑️ Kosongkan Semua
                              </Button>
                            )}

                            <Button
                              onClick={() => handleEditRonda(selectedDayData)}
                              className="bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 text-white text-[10px] md:text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100"
                            >
                              📝 Susun Shift Petugas
                            </Button>
                          </div>
                        </div>

                        {/* Shift cards display */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {shiftsData.map((shift, shiftIdx) => {
                            const isShiftNow = (selectedDayData.day === today);

                            return (
                              <div key={shift.id} className="bg-slate-900 text-white rounded-[2rem] p-6 border border-slate-800 shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
                                
                                <div className="flex justify-between items-center mb-5 relative z-10">
                                  <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-300 shadow-sm">
                                      Shift {shiftIdx + 1}
                                    </span>
                                    {isShiftNow && (
                                      <span className="flex items-center gap-1 text-[8px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                                        DIJADWALKAN HARI INI
                                      </span>
                                    )}
                                  </div>

                                  <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300 bg-slate-950/80 px-3 py-1 rounded-xl border border-slate-800">
                                    <Clock size={12} className="text-indigo-400" /> {shift.time}
                                  </span>
                                </div>

                                <div className="space-y-2.5 min-h-[140px] max-h-[240px] overflow-y-auto no-scrollbar relative z-10 pr-1">
                                  {shift.members.length > 0 ? (
                                    shift.members.map((member, memIdx) => {
                                      const residentHouse = houses.find(h => h.headOfFamily?.toLowerCase() === member.toLowerCase());
                                      return (
                                        <div key={`${member}-${memIdx}`} className="flex items-center justify-between bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-950 transition-all group/item">
                                          <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-md">
                                              {member.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                              <p className="text-xs font-black text-slate-100 truncate">{member}</p>
                                              <p className="text-[9px] font-mono text-indigo-300 uppercase tracking-widest mt-0.5">
                                                {residentHouse ? `Blok ${residentHouse.block}-${residentHouse.number}` : 'Warga RT 02'}
                                              </p>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2">
                                            <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md uppercase hidden sm:inline-block">
                                              SIAGA
                                            </span>

                                            {/* Direct Quick Remove Button */}
                                            <button
                                              type="button"
                                              onClick={async (e) => {
                                                e.stopPropagation();
                                                if (!selectedDayData.id) return;
                                                const updatedShifts = shiftsData.map(s => 
                                                  s.id === shift.id 
                                                    ? { ...s, members: s.members.filter(m => m !== member) } 
                                                    : s
                                                );
                                                const updatedMembers = updatedShifts.flatMap(s => s.members);
                                                await updateRondaScheduleFull(selectedDayData.id, {
                                                  members: updatedMembers,
                                                  shifts: updatedShifts
                                                });
                                                toast.success(`${member} dihapus dari Shift ${shiftIdx + 1}`);
                                              }}
                                              className="p-1.5 bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800/80 rounded-xl text-[9px] font-black transition-all"
                                              title={`Hapus ${member} dari Shift ${shiftIdx + 1}`}
                                            >
                                              <X size={13} />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center h-full">
                                      <div className="w-10 h-10 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-500 mb-2">
                                        <Users size={18} />
                                      </div>
                                      <p className="text-xs text-slate-400 font-bold">Belum ada personil shift ini</p>
                                      <p className="text-[9px] text-slate-500 mt-1 max-w-[170px]">Klik Susun Shift Petugas di atas untuk mengisi personil</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Block Diversity and statistics info box */}
                        <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 flex items-start gap-3.5">
                          <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                          <div className="text-xs text-indigo-800 leading-relaxed font-semibold">
                            <span className="font-extrabold uppercase tracking-widest text-[10px] text-indigo-700 block mb-0.5">Bantuan Keragaman Blok</span>
                            Sistem menyarankan pembagian petugas berasal dari blok rumah yang tersebar secara variatif demi memaksimalkan visual jangkauan siskamling yang adil dan efisien.
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: SWAPS / TUKAR JADWAL */}
            {scheduleSubTab === 'swaps' && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-base md:text-lg font-black text-slate-900">Pergantian & Tukar Jadwal</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Persetujuan & riwayat tukar tugas ronda antar warga</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(() => {
                    const filteredSwaps = rondaSwapRequests.filter(req => {
                      if (!scheduleSearchQuery) return true;
                      return req.requesterName.toLowerCase().includes(scheduleSearchQuery.toLowerCase());
                    });

                    if (filteredSwaps.length === 0) {
                      return (
                        <div className="col-span-full py-16 text-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                            <ArrowLeftRight size={28} />
                          </div>
                          <h4 className="font-bold text-slate-700 text-sm">Tidak Ada Permintaan</h4>
                          <p className="text-xs text-slate-400 mt-1">Belum ada warga mengajukan permohonan tukar jadwal.</p>
                        </div>
                      );
                    }

                    return filteredSwaps.map((request) => (
                      <div key={request.id} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between hover:bg-white hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100/50 transition-all group">
                        <div>
                          {/* Top row */}
                          <div className="flex justify-between items-start gap-4 mb-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-black text-indigo-600">
                                {request.requesterName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-black text-slate-800 text-xs md:text-sm truncate">{request.requesterName}</h4>
                                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">Rumah {request.requesterHouseId}</p>
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border leading-none shrink-0 ${
                              request.status === 'Menunggu' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              request.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>
                              {request.status}
                            </span>
                          </div>

                          {/* Swap details card */}
                          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 mb-4 shadow-sm">
                            <div className="text-center flex-1 min-w-0">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Semula</span>
                              <span className="text-[11px] font-bold text-slate-700 truncate block">{request.fromDay}</span>
                            </div>
                            <div className="px-2 text-indigo-400 shrink-0">
                              <ArrowLeftRight size={12} />
                            </div>
                            <div className="text-center flex-1 min-w-0">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Menjadi</span>
                              <span className="text-[11px] font-bold text-slate-700 truncate block">{request.toDay}</span>
                            </div>
                          </div>

                          {request.reason && (
                            <div className="bg-slate-100/60 rounded-xl p-3 border border-slate-200/40 text-[11px] text-slate-500 italic mb-4 leading-relaxed font-medium">
                              "{request.reason}"
                            </div>
                          )}
                        </div>

                        {/* Action buttons if Menunggu */}
                        {request.status === 'Menunggu' && (
                          <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                            <Button
                              onClick={() => handleUpdateSwapStatus(request.id, 'Disetujui')}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 hover:scale-102 active:scale-98 h-8 rounded-lg text-[9px] font-black uppercase tracking-wider"
                            >
                              <Check size={11} className="mr-1" /> Setujui
                            </Button>
                            <Button
                              onClick={() => handleUpdateSwapStatus(request.id, 'Ditolak')}
                              variant="outline"
                              className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 hover:scale-102 active:scale-98 h-8 rounded-lg text-[9px] font-black uppercase tracking-wider"
                            >
                              <X size={11} className="mr-1" /> Tolak
                            </Button>
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: LEADERBOARD & KEAKTIFAN */}
            {scheduleSubTab === 'leaderboard' && (
              <div className="space-y-6 md:space-y-8">
                {/* Visual Top Podium Row (Podium Keaktifan) */}
                <div className="bg-slate-900 rounded-[2.5rem] p-6 md:p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-6 mb-8 relative z-10">
                    <div>
                      <h3 className="text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
                        🏆 Podium Warga Teladan RT 02
                      </h3>
                      <p className="text-slate-300 text-[11px] font-bold uppercase tracking-widest mt-1">Apresiasi keaktifan tugas ronda siskamling lingkungan</p>
                    </div>
                    <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-wider border border-white/10">
                      Update Otomatis
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
                    {houses
                      .filter(h => (h.rondaPoints || 0) > 0)
                      .sort((a, b) => (b.rondaPoints || 0) - (a.rondaPoints || 0))
                      .slice(0, 3)
                      .map((h, i) => {
                        const podiumStyles = [
                          {
                            bg: 'bg-gradient-to-tr from-yellow-600/20 to-yellow-600/40 border-yellow-500/50',
                            badge: 'border-yellow-500/30 text-yellow-300 bg-yellow-500/10',
                            medalColor: 'text-yellow-400',
                            placeLabel: '🥇 Juara 1 Utuh',
                            glow: 'shadow-lg shadow-yellow-600/10'
                          },
                          {
                            bg: 'bg-white/5 border-white/10 hover:bg-white/10',
                            badge: 'border-slate-400/30 text-slate-300 bg-white/10',
                            medalColor: 'text-slate-300',
                            placeLabel: '🥈 Juara 2 Sejati',
                            glow: ''
                          },
                          {
                            bg: 'bg-white/5 border-white/10 hover:bg-white/10',
                            badge: 'border-amber-600/30 text-amber-300 bg-amber-600/10',
                            medalColor: 'text-amber-500',
                            placeLabel: '🥉 Juara 3 Siaga',
                            glow: ''
                          }
                        ];

                        const style = podiumStyles[i] || podiumStyles[1];

                        return (
                          <div
                            key={h.id}
                            className={`p-6 rounded-2xl border ${style.bg} ${style.glow} duration-300 relative overflow-hidden group flex flex-col justify-between`}
                          >
                            <div>
                              <div className="flex justify-between items-start mb-4">
                                <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-black tracking-wider uppercase ${style.badge}`}>
                                  {style.placeLabel}
                                </span>
                                <ShieldCheck size={28} className={style.medalColor} />
                              </div>

                              <h4 className="text-base md:text-lg font-black truncate">{h.headOfFamily}</h4>
                              <p className="text-xs text-slate-300 mt-1 font-semibold">Blok {h.block}-{h.number}</p>
                            </div>

                            <div className="mt-6 flex justify-between items-end border-t border-white/10 pt-4">
                              <div>
                                <span className="text-3xl font-black">{h.rondaPoints || 0}</span>
                                <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider ml-1">Poin</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] font-extrabold text-slate-300 block uppercase">Terakhir Ronda</span>
                                <span className="text-[10px] font-bold text-slate-100 block mt-0.5">
                                  {h.rondaLastDuty ? new Date(h.rondaLastDuty).toLocaleDateString('id-ID') : 'Belum Pernah'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    {houses.filter(h => (h.rondaPoints || 0) > 0).length === 0 && (
                      <div className="col-span-full py-8 text-center text-slate-400 font-bold text-xs italic">
                        Belum ada akumulasi poin ronda warga bulan ini.
                      </div>
                    )}
                  </div>
                </div>

                {/* List of all houses active records */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-black text-slate-900 uppercase tracking-widest leading-none">Keaktifan Semua Warga</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Laporan keaktifan, total siskamling, dan poin warga aktif</p>
                    </div>

                    {/* Simple search and count */}
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono shrink-0">
                      Total: {houses.filter(h => h.status === 'Occupied').length} Rumah Terkualifikasi
                    </p>
                  </div>

                  {/* Responsive Table for Warga records */}
                  <div className="bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden">
                    <div className="overflow-x-auto no-scrollbar">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-100/40">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Warga Terdaftar</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nomor Rumah</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Tugas Dilaksanakan</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Point Dedikasi</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status Keaktifan</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Terakhir Ronda</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const filteredResidents = houses
                              .filter(h => h.status === 'Occupied')
                              .filter(h => {
                                if (!scheduleSearchQuery) return true;
                                return (h.headOfFamily || '').toLowerCase().includes(scheduleSearchQuery.toLowerCase()) ||
                                  h.block.toLowerCase().includes(scheduleSearchQuery.toLowerCase());
                              })
                              .sort((a, b) => (b.rondaPoints || 0) - (a.rondaPoints || 0));

                            if (filteredResidents.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-slate-400 font-bold italic">
                                    Warga tidak ditemukan pencarian "{scheduleSearchQuery}"
                                  </td>
                                </tr>
                              );
                            }

                            return filteredResidents.map((h) => {
                              const pts = h.rondaPoints || 0;
                              let statusLabel = "Pasif / Dispensasi";
                              let statusColor = "bg-slate-100 text-slate-600 border-slate-200/50";
                              if (h.rondaExempt) {
                                statusLabel = "Dispensasi RT";
                                statusColor = "bg-amber-50 text-amber-600 border-amber-200/60";
                              } else if (pts >= 15) {
                                statusLabel = "Sangat Aktif";
                                statusColor = "bg-emerald-50 text-emerald-600 border-emerald-200/60";
                              } else if (pts > 0) {
                                statusLabel = "Aktif Ronda";
                                statusColor = "bg-indigo-50 text-indigo-600 border-indigo-200/60";
                              }

                              return (
                                <tr key={h.id} className="border-b border-slate-100 hover:bg-white transition-all group">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black shrink-0">
                                        {h.headOfFamily?.charAt(0) || 'W'}
                                      </div>
                                      <span className="text-xs font-bold text-slate-700">{h.headOfFamily || 'Resident'}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-xs font-bold text-slate-500">Blok {h.block}-{h.number}</td>
                                  <td className="px-6 py-4 text-xs font-black text-slate-700 text-center">{h.rondaDutyCount || 0} Sesi</td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg text-[10px] font-black">
                                      {pts} Poin
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className={`px-2.5 py-0.5 border rounded text-[9px] font-black uppercase tracking-wider ${statusColor}`}>
                                      {statusLabel}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                    {h.rondaLastDuty ? new Date(h.rondaLastDuty).toLocaleDateString('id-ID') : '-'}
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <motion.div variants={itemVariants} className="lg:col-span-3 bg-slate-900 text-white rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="p-6 md:p-8 border-b border-slate-800/80 relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    PATROL AUDIT STREAM
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight">Log Patroli & Audit Keamanan Siskamling</h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">Rekam jejak digital sesi ronda, pemantauan pos checkpoint, dan insiden darurat warga RT 02</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-full md:w-auto">
                  {(['All', 'Aman', 'Insiden'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setLogFilter(f)}
                      className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-mono font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                        logFilter === f 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Cari nama petugas, lokasi pos, atau kata kunci catatan..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[550px] p-6 md:p-8 space-y-5 custom-scrollbar relative z-10">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, idx) => (
                  <div key={log.id} className="relative pl-7 md:pl-9 group">
                    {/* Timeline Line */}
                    {idx !== filteredLogs.length - 1 && (
                      <div className="absolute left-[10px] md:left-[13px] top-8 bottom-[-24px] w-0.5 bg-slate-800 group-hover:bg-indigo-500/40 transition-colors"></div>
                    )}
                    {/* Timeline Dot */}
                    <div className={`absolute left-0 top-2.5 w-5 h-5 md:w-6 md:h-6 rounded-full border-4 border-slate-900 shadow-md z-10 transition-transform group-hover:scale-125 ${
                      log.status === 'Aman' ? 'bg-emerald-400 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'
                    }`}></div>

                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-3xl p-5 md:p-6 hover:bg-slate-950 hover:border-slate-700 transition-all shadow-lg">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-md">
                            {log.officerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-100 text-sm md:text-base tracking-tight">{log.officerName}</h4>
                            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-1">
                              <span className="flex items-center gap-1.5">
                                <Clock size={11} className="text-indigo-400" />
                                {new Date(log.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WITA
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className={`px-3 py-1 rounded-xl text-[9px] font-mono font-black uppercase tracking-widest border ${
                          log.status === 'Aman' 
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80' 
                            : 'bg-rose-950/80 text-rose-300 border-rose-800/80 animate-pulse'
                        }`}>
                          {log.status === 'Aman' ? '✓ STATUS AMAN' : '⚠️ INSIDEN CATATAN'}
                        </span>
                      </div>
                      
                      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800/80 mb-4">
                        <p className="text-xs text-slate-300 leading-relaxed font-sans italic">
                          "{log.note || 'Petugas telah melakukan ronda rutin. Situasi pos dan blok perumahan RT 02 dalam kondisi aman terkendali.'}"
                        </p>
                      </div>

                      {log.photoUrl && (
                        <div className="relative w-full h-40 md:h-52 rounded-2xl overflow-hidden border border-slate-800 group/img">
                          <img src={log.photoUrl} alt="Bukti Patroli" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <Button size="sm" variant="secondary" className="bg-white text-slate-900 font-bold text-xs">Lihat Bukti Foto Patroli</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-slate-800/60 rounded-3xl flex items-center justify-center text-slate-500 mb-4 border border-slate-700/50">
                    <Search size={32} />
                  </div>
                  <h4 className="text-base font-bold text-slate-200">Belum Ada Rekaman Log</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">Semua aktivitas siskamling dan scan pos checkpoint akan tercatat secara otomatis di sini.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'attendance' && (
          <motion.div variants={itemVariants} className="lg:col-span-3 space-y-6">
            <div className="bg-slate-900 text-white rounded-[2.5rem] border border-slate-800 shadow-2xl p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-slate-800 pb-6 relative z-10">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    PRESENSI SIAGA SISKAMLING
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight">Portal Absensi & Verifikasi Kehadiran Ronda</h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">Catat kehadiran petugas ronda malam ini untuk menguji skor keaktifan warga secara transparan</p>
                </div>
                <div className="p-3.5 bg-indigo-600/30 text-indigo-400 rounded-2xl border border-indigo-500/30 shrink-0">
                  <UserCheck size={24} className="animate-pulse" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 relative z-10">
                {/* Inputs Left Side */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Pilih Tanggal Dinas</label>
                    <input 
                      type="date" 
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Catatan & Berita Acara</label>
                    <textarea 
                      value={attendanceNotes}
                      onChange={(e) => setAttendanceNotes(e.target.value)}
                      placeholder="Contoh: Petugas A sakit, digantikan oleh Petugas B (Rumah Blok A-12)..."
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3.5 text-xs font-medium text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all h-28 resize-none"
                    />
                  </div>

                  {/* Quick Attendance Ratio Summary Card */}
                  <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest">Ringkasan Presensi Hari Ini</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Tingkat Kehadiran:</span>
                      <span className="text-sm font-mono font-black text-emerald-400">
                        {(() => {
                          const [yr, mo, dy] = attendanceDate.split('-').map(Number);
                          const localDate = new Date(yr, mo - 1, dy);
                          const day = localDate.toLocaleDateString('id-ID', { weekday: 'long' });
                          const schedule = ronda.find(r => r.day === day);
                          const total = schedule?.members?.length || 0;
                          if (total === 0) return '0%';
                          return `${Math.round((presentMembers.length / total) * 100)}% (${presentMembers.length}/${total})`;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Checklist Members Right Side */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">
                      Daftar Petugas Terjadwal (Centang yang Hadir)
                    </label>
                    
                    {(() => {
                      const [yr, mo, dy] = attendanceDate.split('-').map(Number);
                      const localDate = new Date(yr, mo - 1, dy);
                      const day = localDate.toLocaleDateString('id-ID', { weekday: 'long' });
                      const schedule = ronda.find(r => r.day === day);
                      const allMembers = schedule?.members || [];

                      if (allMembers.length === 0) return null;

                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (presentMembers.length === allMembers.length) {
                              setPresentMembers([]);
                            } else {
                              setPresentMembers(allMembers);
                            }
                          }}
                          className="text-[10px] font-mono font-black text-indigo-300 hover:text-white bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/80 px-3 py-1 rounded-xl transition-all uppercase tracking-wider"
                        >
                          {presentMembers.length === allMembers.length ? "Batal Centang" : "✓ Centang Semua Hadir"}
                        </button>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[160px]">
                    {(() => {
                      const [yr, mo, dy] = attendanceDate.split('-').map(Number);
                      const localDate = new Date(yr, mo - 1, dy);
                      const day = localDate.toLocaleDateString('id-ID', { weekday: 'long' });
                      
                      const schedule = ronda.find(r => r.day === day);
                      if (!schedule || !schedule.members || schedule.members.length === 0) {
                        return (
                          <div className="col-span-full flex flex-col items-center justify-center p-8 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800 text-center">
                            <p className="text-slate-400 text-xs font-bold">Tidak ada petugas terjadwal untuk hari {day}</p>
                            <p className="text-slate-500 text-[10px] mt-1">Susun shift petugas terlebih dahulu pada menu Jadwal Shift</p>
                          </div>
                        );
                      }
                      
                      const allMembers = schedule.members || [];
                      return allMembers.map((member, idx) => {
                        const resHouse = houses.find(h => h.headOfFamily?.toLowerCase() === member.toLowerCase());
                        const isPresent = presentMembers.includes(member);

                        return (
                          <div 
                            key={`${member}-${idx}`}
                            onClick={() => {
                              if (isPresent) {
                                setPresentMembers(presentMembers.filter(m => m !== member));
                              } else {
                                setPresentMembers([...presentMembers, member]);
                              }
                            }}
                            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                              isPresent
                                ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200 shadow-md shadow-emerald-950/30'
                                : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:bg-slate-950'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                                isPresent
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black'
                                  : 'bg-slate-900 border-slate-700 text-transparent'
                              }`}>
                                <Check size={14} strokeWidth={4} />
                              </div>
                              <div className="min-w-0">
                                <p className={`text-xs font-black truncate ${isPresent ? 'text-slate-100' : 'text-slate-300'}`}>{member}</p>
                                <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
                                  {resHouse ? `Blok ${resHouse.block}-${resHouse.number}` : 'Rumah Warga'}
                                </p>
                              </div>
                            </div>

                            <span className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded-md border ${
                              isPresent 
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                                : 'bg-slate-900 text-slate-500 border-slate-800'
                            }`}>
                              {isPresent ? 'HADIR (+10 PTS)' : 'ABSEN'}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button 
                      onClick={handleSaveAttendance}
                      className="bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-950/50 px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs text-white"
                    >
                      {rondaAttendance.some(a => a.date === attendanceDate) ? "Perbarui Absensi (+10 Poin)" : "Simpan Absensi (+10 Poin)"}
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



        {activeTab === 'checkpoints' && (
          <div className="lg:col-span-3 space-y-8">
            <motion.div variants={itemVariants}>
              <CheckpointManager houses={houses} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <MapPointManager mapPoints={mapPoints} houses={houses} />
            </motion.div>
          </div>
        )}
      </div>

      <Modal isOpen={isRondaModalOpen} onClose={() => setIsRondaModalOpen(false)} title={`Pengaturan Shift & Jadwal Ronda: ${editingRonda?.day}`}>
        <form onSubmit={handleSaveRonda} className="space-y-6 max-w-3xl mx-auto">
          {/* Header Info */}
          <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[2rem] border border-slate-800 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600/30 text-indigo-400 rounded-2xl border border-indigo-500/30">
                <Users size={24} className="animate-pulse" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/80">
                  HARI: {editingRonda?.day?.toUpperCase()}
                </span>
                <h3 className="text-base font-black text-slate-100 tracking-tight mt-1">Konfigurasi Pembagian Shift Siskamling</h3>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-[9px] font-mono text-slate-400 uppercase">Total Petugas</p>
              <p className="text-base font-mono font-black text-indigo-300">
                {shifts.reduce((acc, s) => acc + s.members.length, 0)} Warga
              </p>
            </div>
          </div>

          {/* Quick Add Resident Chips Selector */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                <UserCheck size={14} className="text-indigo-600" /> Pilih Kepala Keluarga & Target Shift:
              </span>
              
              {/* Target Shift Selector Buttons */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                {shifts.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedTargetShiftId(s.id)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      (selectedTargetShiftId || shifts[0]?.id) === s.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    Shift {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text"
                placeholder="Ketik nama warga untuk memfilter..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                value={residentSearch}
                onChange={(e) => setResidentSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto no-scrollbar pt-1">
              {filteredResidents.slice(0, 20).map((residentName) => {
                const assignedShift = shifts.find(s => s.members.includes(residentName));
                const isAssigned = !!assignedShift;
                const house = houses.find(h => h.headOfFamily?.toLowerCase() === residentName.toLowerCase());
                const targetShift = selectedTargetShiftId || shifts[0]?.id || '1';
                const targetShiftIndex = shifts.findIndex(s => s.id === targetShift) + 1;

                return (
                  <button
                    key={residentName}
                    type="button"
                    onClick={() => {
                      if (isAssigned && assignedShift) {
                        handleRemoveMemberFromShift(assignedShift.id, residentName);
                      } else {
                        handleAddMemberToShift(targetShift, residentName);
                      }
                    }}
                    title={isAssigned ? `Klik untuk menghapus dari Shift ${shifts.findIndex(s => s.id === assignedShift.id) + 1}` : `Klik untuk menambahkan ke Shift ${targetShiftIndex}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isAssigned 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 shadow-sm active:scale-95' 
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50/50 shadow-sm active:scale-95'
                    }`}
                  >
                    {isAssigned ? (
                      <X size={12} className="text-rose-500" />
                    ) : (
                      <Plus size={12} className="text-indigo-500" />
                    )}
                    <span>{residentName}</span>
                    {house && <span className="text-[9px] font-normal opacity-70">({house.block}-{house.number})</span>}
                    {isAssigned ? (
                      <span className="text-[8px] font-black uppercase text-rose-600 bg-white/80 px-1.5 py-0.5 rounded-full ml-1">
                        S{shifts.findIndex(s => s.id === assignedShift.id) + 1} (Hapus)
                      </span>
                    ) : (
                      <span className="text-[8px] font-black uppercase text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full ml-1">
                        +S{targetShiftIndex}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shift Cards Grid */}
          <div className="space-y-4">
            {shifts.map((shift, sIdx) => (
              <div key={shift.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-md shadow-indigo-100">
                      S{sIdx + 1}
                    </span>
                    <div>
                      <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">Shift {sIdx + 1}</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{shift.members.length} Personil Bertugas</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                      <Clock size={13} className="text-indigo-600" />
                      <input 
                        type="text" 
                        className="bg-transparent border-none outline-none text-xs font-black text-slate-800 w-28 text-center"
                        value={shift.time}
                        onChange={(e) => setShifts(prev => prev.map(s => s.id === shift.id ? { ...s, time: e.target.value } : s))}
                      />
                    </div>

                    {shift.members.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShifts(prev => prev.map(s => s.id === shift.id ? { ...s, members: [] } : s))}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                        title="Kosongkan seluruh personil di shift ini"
                      >
                        <X size={12} /> Kosongkan Shift
                      </button>
                    )}
                  </div>
                </div>

                {/* Assigned Member Badges */}
                <div className="flex flex-wrap gap-2 min-h-[50px] p-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  {shift.members.map((m, mIdx) => {
                    const resHouse = houses.find(h => h.headOfFamily?.toLowerCase() === m.toLowerCase());
                    return (
                      <div key={`${m}-${mIdx}`} className="flex items-center gap-2 bg-white pl-3 pr-1.5 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs font-bold text-slate-800 group">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>{m}</span>
                        {resHouse && <span className="text-[9px] text-slate-400 font-medium">({resHouse.block}-{resHouse.number})</span>}
                        <button 
                          type="button"
                          onClick={() => handleRemoveMemberFromShift(shift.id, m)}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors ml-1"
                          title="Hapus dari shift"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                  {shift.members.length === 0 && (
                    <div className="w-full flex items-center justify-center py-3 text-slate-400 text-xs italic font-bold">
                      Klik nama warga di atas untuk menambahkan ke Shift ini
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsRondaModalOpen(false)} className="flex-1 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs">
              Batal
            </Button>
            <Button type="submit" className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 font-black uppercase tracking-widest text-xs">
              Simpan Perubahan Shift
            </Button>
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
