import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, Clock, MapPin, Wrench, CheckCircle, Plus, Search, Trash2, 
  CheckSquare, AlertCircle, Coffee, Check, X, ArrowRight, Shield, Download, Sparkles,
  CheckCircle2, Info, Tag, FileText, Printer, Share2, Copy, MessageCircle
} from 'lucide-react';
import { House, CommunityWork, CommunityWorkTask, CommunityWorkAttendance } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Card';
import { toast } from 'sonner';
import { 
  subscribeToCommunityWorks, 
  addCommunityWorkToDb, 
  updateCommunityWorkInDb, 
  deleteCommunityWorkFromDb 
} from '../../services/databaseService';
import { motion, AnimatePresence } from 'motion/react';
import { useConfirm } from '../../context/ConfirmContext';

interface CommunityWorkManagerProps {
  houses: House[];
}

export const CommunityWorkManager: React.FC<CommunityWorkManagerProps> = ({ houses }) => {
  const confirm = useConfirm();
  const [works, setWorks] = useState<CommunityWork[]>([]);
  const [activeWork, setActiveWork] = useState<CommunityWork | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'agenda' | 'tasks' | 'attendance'>('agenda');

  // Form State for Agenda
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '07:30',
    endTime: '11:00',
    assemblyPoint: 'Pos Ronda RT 02 / Lapangan Fasum',
    toolsNeeded: 'Cangkul, Sabit, Sapu Lidi, Karung Sampah',
    snackPIC: 'Ibu-ibu PKK RT 02',
    status: 'Direncanakan' as const
  });

  // Form State for Task
  const [taskForm, setTaskForm] = useState({
    title: '',
    zone: 'Blok A & B',
    picName: ''
  });

  useEffect(() => {
    const unsub = subscribeToCommunityWorks((data) => {
      setWorks(data as CommunityWork[]);
      if (data.length > 0 && !activeWork) {
        setActiveWork(data[0] as CommunityWork);
      } else if (activeWork) {
        const updated = data.find(w => w.id === activeWork.id);
        if (updated) setActiveWork(updated as CommunityWork);
      }
    });
    return () => unsub();
  }, [activeWork]);

  const handleCreateWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date) {
      toast.error('Silakan lengkapi judul & tanggal kerja bakti.');
      return;
    }

    try {
      const defaultAttendances: CommunityWorkAttendance[] = houses
        .filter(h => h.status === 'Occupied')
        .map(h => ({
          houseId: h.id,
          headOfFamily: h.headOfFamily,
          attendedBy: '',
          status: 'Alpha',
          notes: ''
        }));

      const toolsArray = form.toolsNeeded.split(',').map(t => t.trim()).filter(Boolean);

      await addCommunityWorkToDb({
        ...form,
        toolsNeeded: toolsArray,
        tasks: [
          { id: 't1', title: 'Pembersihan Saluran Air & Drainase', zone: 'Selokan Utama', picName: 'Koordinator Kebersihan', isDone: false },
          { id: 't2', title: 'Pemangkasan Pohon Rindang & Ranting Liar', zone: 'Jalan Lingkungan', picName: 'Tim Lapangan', isDone: false }
        ],
        attendances: defaultAttendances
      });

      setIsAddModalOpen(false);
      setForm({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '07:30',
        endTime: '11:00',
        assemblyPoint: 'Pos Ronda RT 02 / Lapangan Fasum',
        toolsNeeded: 'Cangkul, Sabit, Sapu Lidi, Karung Sampah',
        snackPIC: 'Ibu-ibu PKK RT 02',
        status: 'Direncanakan'
      });
      toast.success('Agenda Kerja Bakti RT 02 berhasil diterbitkan!');
    } catch (error) {
      toast.error('Gagal membuat agenda kerja bakti.');
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWork || !taskForm.title) return;

    const newTask: CommunityWorkTask = {
      id: `task-${Date.now()}`,
      title: taskForm.title,
      zone: taskForm.zone,
      picName: taskForm.picName || 'Warga RT 02',
      isDone: false
    };

    const updatedTasks = [...(activeWork.tasks || []), newTask];
    await updateCommunityWorkInDb(activeWork.id, { tasks: updatedTasks });
    setIsTaskModalOpen(false);
    setTaskForm({ title: '', zone: 'Blok A & B', picName: '' });
    toast.success('Zona tugas kerja bakti ditambahkan.');
  };

  const handleToggleTask = async (taskId: string) => {
    if (!activeWork) return;
    const updatedTasks = activeWork.tasks.map(t => 
      t.id === taskId ? { ...t, isDone: !t.isDone } : t
    );
    await updateCommunityWorkInDb(activeWork.id, { tasks: updatedTasks });
  };

  const handleUpdateAttendance = async (houseId: string, status: CommunityWorkAttendance['status'], attendedBy: string = '') => {
    if (!activeWork) return;
    const updatedAttendances = activeWork.attendances.map(a => {
      if (a.houseId === houseId) {
        return {
          ...a,
          status,
          attendedBy: attendedBy || a.attendedBy || a.headOfFamily,
          checkInTime: status === 'Hadir' ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : undefined
        };
      }
      return a;
    });
    await updateCommunityWorkInDb(activeWork.id, { attendances: updatedAttendances });
    toast.success('Presensi kehadiran warga diperbarui.');
  };

  const handleDeleteWork = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Agenda Kerja Bakti',
      message: 'Apakah Anda yakin ingin menghapus agenda kerja bakti dan seluruh data presensi terkait?',
      confirmLabel: 'Hapus',
      isDanger: true
    });

    if (isConfirmed) {
      await deleteCommunityWorkFromDb(id);
      setActiveWork(null);
      toast.success('Agenda berhasil dihapus.');
    }
  };

  const getHouseLabel = (id: string) => {
    const house = houses.find(h => h.id === id);
    return house ? `${house.block}-${house.number}` : id;
  };

  const hadirCount = activeWork?.attendances?.filter(a => a.status === 'Hadir').length || 0;
  const izinCount = activeWork?.attendances?.filter(a => a.status === 'Izin / Diwakilkan' || a.status === 'Kompensasi').length || 0;
  const alphaCount = activeWork?.attendances?.filter(a => a.status === 'Alpha').length || 0;
  const totalWarga = activeWork?.attendances?.length || 0;
  const tasksDoneCount = activeWork?.tasks?.filter(t => t.isDone).length || 0;

  const copyBroadcastInvitation = () => {
    if (!activeWork) return;
    const formattedDate = new Date(activeWork.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const text = `📢 *UNDANGAN GOTONG ROYONG / KERJA BAKTI RT 002*\n\nKepada Yth.\nBapak/Ibu/Sdr. Seluruh Warga RT 002 / RW 020\nDi Tempat\n\nDalam rangka menjaga kebersihan, kesehatan, dan kenyamanan lingkungan kita bersama, Pengurus RT mengundang seluruh warga untuk berpartisipasi dalam agenda Kerja Bakti:\n\n📌 *Agenda:* ${activeWork.title}\n📅 *Hari / Tanggal:* ${formattedDate}\n⏰ *Waktu:* Pkl ${activeWork.startTime} - ${activeWork.endTime} WITA\n📍 *Titik Kumpul:* ${activeWork.assemblyPoint}\n\n🛠️ *Peralatan yang Disarankan:* ${activeWork.toolsNeeded?.join(', ') || 'Cangkul, Sapu Lidi, Sabit, Karung Sampah'}\n☕ *Konsumsi / Snack:* Dikoordinir oleh ${activeWork.snackPIC || 'Ibu-ibu PKK RT 02'}\n\n${activeWork.description ? `📝 *Catatan:* ${activeWork.description}\n\n` : ''}Mari kita luangkan waktu demi lingkungan RT yang bersih, asri, dan terhindar dari penyakit. Kehadiran Bapak/Ibu sangat berarti bagi rukun tetangga kita. 🙏\n\n_Pengurus RT 002 / RW 020 - Kelurahan Tondo_`;
    navigator.clipboard.writeText(text);
    toast.success('Format Undangan WhatsApp berhasil disalin ke clipboard!');
  };

  const shareToWhatsAppGroup = () => {
    if (!activeWork) return;
    const formattedDate = new Date(activeWork.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const text = `📢 *UNDANGAN GOTONG ROYONG / KERJA BAKTI RT 002*\n\nKepada Yth. Seluruh Warga RT 002\n\n📌 *Agenda:* ${activeWork.title}\n📅 *Tanggal:* ${formattedDate}\n⏰ *Waktu:* Pkl ${activeWork.startTime} - ${activeWork.endTime} WITA\n📍 *Titik Kumpul:* ${activeWork.assemblyPoint}\n🛠️ *Peralatan:* ${activeWork.toolsNeeded?.join(', ') || 'Cangkul, Sapu, Sabit'}\n\nMohon kehadiran dan partisipasi aktif seluruh warga. Terima kasih! 🙏`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyAttendanceRecap = () => {
    if (!activeWork) return;
    const formattedDate = new Date(activeWork.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const header = `📋 *REKAPITULASI PRESENSI KERJA BAKTI RT 002*\n📌 *Kegiatan:* ${activeWork.title}\n📅 *Tanggal:* ${formattedDate}\n👥 *Partisipasi:* ${hadirCount} Hadir | ${izinCount} Izin | ${alphaCount} Absen (Total: ${totalWarga} Rumah)\n\n`;
    const list = (activeWork.attendances || []).map((a, idx) => {
      const houseLabel = getHouseLabel(a.houseId);
      const mark = a.status === 'Hadir' ? '✅ Hadir' : a.status === 'Izin / Diwakilkan' ? '⚠️ Izin' : '❌ Absen';
      return `${idx + 1}. Blok ${houseLabel} - ${a.headOfFamily}: ${mark}`;
    }).join('\n');
    const fullText = header + list + `\n\n_Dicatat melalui Aplikasi Teras Warga RT 002_`;
    navigator.clipboard.writeText(fullText);
    toast.success('Rekap Presensi berhasil disalin!');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Apple Minimalist */}
      <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 md:p-8 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-mono font-black uppercase tracking-widest mb-2 inline-block">
            🤝 KEGIATAN & GOTONG ROYONG WARGA
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Agenda Kerja Bakti RT 02</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Manajemen agenda gotong royong, pembagian zona kerja per blok, serta checklist presensi warga.
          </p>
        </div>

        <Button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 text-xs py-3.5 px-6 rounded-2xl font-black uppercase tracking-wider">
          <Plus size={16} className="mr-2" /> Buat Agenda Kerja Bakti
        </Button>
      </div>

      {works.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Agenda List & Selector */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-black text-slate-400 uppercase tracking-widest px-2">DAFTAR AGENDA KERJA BAKTI</h4>
            {works.map((work) => {
              const isSelected = activeWork?.id === work.id;
              return (
                <div
                  key={work.id}
                  onClick={() => setActiveWork(work)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-slate-900 text-white border-slate-800 shadow-xl shadow-slate-900/20' 
                      : 'bg-white text-slate-800 border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-mono font-black uppercase tracking-wider ${
                      isSelected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {work.status}
                    </span>
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                      {new Date(work.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <h3 className="font-black text-sm line-clamp-1 mb-1">{work.title}</h3>
                  <p className={`text-xs line-clamp-2 ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>{work.description || 'Pembersihan lingkungan bersama warga RT 02.'}</p>
                </div>
              );
            })}
          </div>

          {/* Right Column: Detailed Active Agenda View */}
          {activeWork && (
            <div className="lg:col-span-2 space-y-6">
              {/* Active Agenda Banner */}
              <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl shadow-emerald-900/15 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 relative z-10">
                  <div>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-mono font-black uppercase tracking-widest text-emerald-100">
                      AGENDA AKTIF
                    </span>
                    <h2 className="text-2xl font-black mt-2 tracking-tight">{activeWork.title}</h2>
                    <p className="text-xs text-white/80 font-medium mt-1">{activeWork.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={copyBroadcastInvitation}
                      className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                      title="Salin Teks Undangan Kerja Bakti ke WhatsApp"
                    >
                      <Copy size={14} /> Salin Undangan
                    </button>
                    <button
                      type="button"
                      onClick={shareToWhatsAppGroup}
                      className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                      title="Buka WhatsApp untuk Broadcast"
                    >
                      <MessageCircle size={14} /> Kirim ke WA
                    </button>
                    <button 
                      onClick={() => handleDeleteWork(activeWork.id)}
                      className="p-2.5 bg-white/15 hover:bg-rose-600 text-white rounded-2xl transition-all"
                      title="Hapus Agenda"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Info Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono relative z-10 pt-4 border-t border-white/20">
                  <div>
                    <span className="text-emerald-200 block text-[9px] uppercase tracking-wider font-bold">Waktu Pelaksanaan</span>
                    <p className="font-black text-white">{activeWork.startTime} - {activeWork.endTime} WIB</p>
                  </div>
                  <div>
                    <span className="text-emerald-200 block text-[9px] uppercase tracking-wider font-bold">Titik Kumpul</span>
                    <p className="font-bold text-white line-clamp-1">{activeWork.assemblyPoint}</p>
                  </div>
                  <div>
                    <span className="text-emerald-200 block text-[9px] uppercase tracking-wider font-bold">Kehadiran Warga</span>
                    <p className="font-black text-white">{hadirCount} / {totalWarga} Hadir</p>
                  </div>
                  <div>
                    <span className="text-emerald-200 block text-[9px] uppercase tracking-wider font-bold">Zona Selesai</span>
                    <p className="font-black text-white">{tasksDoneCount} / {activeWork.tasks?.length || 0} Zona</p>
                  </div>
                </div>
              </div>

              {/* Tab Navigation Segmented */}
              <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 w-fit">
                {[
                  { id: 'tasks', label: `Pembagian Zona (${activeWork.tasks?.length || 0})`, icon: Wrench },
                  { id: 'attendance', label: `Presensi Warga (${hadirCount}/${totalWarga})`, icon: Users },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      activeTab === tab.id 
                        ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <tab.icon size={15} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content: Tasks / Zone Assignment */}
              {activeTab === 'tasks' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <h4 className="text-xs font-mono font-black text-slate-400 uppercase tracking-widest">ZONA PENUGASAN KERJA BAKTI</h4>
                    <button
                      onClick={() => setIsTaskModalOpen(true)}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <Plus size={14} /> Tambah Zona
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeWork.tasks?.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleToggleTask(task.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                          task.isDone 
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' 
                            : 'bg-white border-slate-200/80 hover:border-emerald-300'
                        }`}
                      >
                        <div className={`p-2 rounded-xl border mt-0.5 ${
                          task.isDone ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}>
                          <Check size={14} className={task.isDone ? 'opacity-100' : 'opacity-0'} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-mono font-bold uppercase tracking-wider block w-fit mb-1">
                            {task.zone}
                          </span>
                          <h5 className={`text-xs font-black ${task.isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {task.title}
                          </h5>
                          <p className="text-[10px] text-slate-400 mt-1 font-medium">Koordinator: {task.picName}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tools Reminder */}
                  <div className="p-4 bg-amber-50/70 border border-amber-200/70 rounded-2xl flex items-start gap-3">
                    <Wrench className="text-amber-600 mt-0.5 shrink-0" size={18} />
                    <div className="text-xs text-amber-900 font-medium">
                      <p className="font-bold">Peralatan yang Disarankan Dibawa Warga:</p>
                      <p className="text-amber-800/90 mt-0.5">{activeWork.toolsNeeded?.join(', ') || 'Cangkul, Sapu Lidi, Sabit'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Attendance Checklist */}
              {activeTab === 'attendance' && (
                <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <h4 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">
                        PRESENSI PER KELUARGA / RUMAH
                      </h4>
                      <span className="text-xs font-mono font-black text-emerald-600">
                        Tingkat Partisipasi: {totalWarga > 0 ? Math.round((hadirCount / totalWarga) * 100) : 0}% ({hadirCount} Hadir, {izinCount} Izin, {alphaCount} Absen)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={copyAttendanceRecap}
                      className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                      title="Salin Rincian Presensi ke Clipboard"
                    >
                      <Copy size={13} /> Salin Rekap Presensi
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                    {activeWork.attendances?.map((att) => (
                      <div key={att.houseId} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-mono font-bold">
                              Blok {getHouseLabel(att.houseId)}
                            </span>
                            <h5 className="text-xs font-black text-slate-900">{att.headOfFamily}</h5>
                          </div>
                          {att.checkInTime && (
                            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">✓ Hadir pkl {att.checkInTime}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateAttendance(att.houseId, 'Hadir')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              att.status === 'Hadir' 
                                ? 'bg-emerald-600 text-white shadow-md' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Hadir
                          </button>
                          <button
                            onClick={() => handleUpdateAttendance(att.houseId, 'Izin / Diwakilkan')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              att.status === 'Izin / Diwakilkan' 
                                ? 'bg-amber-500 text-white shadow-md' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Izin
                          </button>
                          <button
                            onClick={() => handleUpdateAttendance(att.houseId, 'Alpha')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              att.status === 'Alpha' 
                                ? 'bg-slate-800 text-white' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Absen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-[2.5rem] border border-slate-200/80">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-3 border border-slate-100">
            <Users size={32} />
          </div>
          <h4 className="text-base font-black text-slate-800 mb-1">Belum Ada Agenda Kerja Bakti</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
            Buat jadwal kerja bakti baru untuk mengkoordinir gotong royong dan kebersihan lingkungan RT 02.
          </p>
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-6 rounded-2xl">
            Buat Agenda Sekarang
          </Button>
        </div>
      )}

      {/* Modal Add Agenda Kerja Bakti */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Buat Agenda Kerja Bakti RT 02 / RW 020"
        maxWidth="max-w-4xl"
      >
        {(() => {
          const occupiedHousesCount = houses.filter(h => h.status === 'Occupied').length;

          // Preset Templates
          const templates = [
            {
              label: 'Pembersihan Selokan & Drainase',
              icon: '🧹',
              title: 'Kerja Bakti Pembersihan Saluran Air & Drainase RT 02',
              tools: 'Cangkul, Sekop, Karung Sampah, Sarung Tangan, Sapu Lidi',
              desc: 'Pembersihan endapan sedimentasi lumpur, sampah saluran air, dan gulma sepanjang selokan utama Blok A–G demi mengantisipasi genangan air hujan dan jentik nyamuk.',
              assembly: 'Pos Ronda RT 02 / Lapangan Fasum'
            },
            {
              label: 'Babat Semak & Jalan Lingkungan',
              icon: '🌿',
              title: 'Gotong Royong Perapian Rumput & Jalan Lingkungan RT 02',
              tools: 'Sabit, Mesin Rumput, Sapu Lidi, Karung Sampah, Gunting Dahan',
              desc: 'Perapian semak belukar liar, pemotongan ranting pohon yang menutupi penerangan jalan umum, dan pembersihan jalan poros blok RT 02.',
              assembly: 'Gerbang Utama Huntap Tondo 2'
            },
            {
              label: 'Perawatan & Pengecatan Fasum',
              icon: '🎨',
              title: 'Kerja Bakti Perawatan & Pengecatan Fasilitas Umum RT 02',
              tools: 'Kuas Cat, Rol Cat, Ember, Kape/Scraper, Kain Lap, Sapu Lidi',
              desc: 'Pengecatan ulang pos ronda, pembenahan area bermain anak lapangan fasum, dan perapian perlengkapan umum RT 02.',
              assembly: 'Pos Ronda RT 02 / Lapangan Fasum'
            },
            {
              label: 'Kerja Bakti Akbar Lingkungan',
              icon: '🇮🇩',
              title: 'Kerja Bakti Akbar Bersih Lingkungan RT 02 / RW 020',
              tools: 'Cangkul, Sabit, Sapu Lidi, Karung Sampah, Sarung Tangan, Gerobak Sorong',
              desc: 'Aksi gotong royong massal serentak seluruh warga RT 02 RW 020 membersihkan fasilitas umum, selokan, dan jalan blok demi mewujudkan lingkungan asri, bersih, dan guyub rukun.',
              assembly: 'Pos Ronda RT 02 / Lapangan Fasum'
            }
          ];

          const quickTools = [
            'Cangkul', 'Sabit', 'Sapu Lidi', 'Karung Sampah',
            'Sarung Tangan', 'Gerobak Sorong', 'Kuas Cat', 'Sekop', 'Ember'
          ];

          const toggleTool = (tool: string) => {
            const currentList = form.toolsNeeded
              ? form.toolsNeeded.split(',').map(t => t.trim()).filter(Boolean)
              : [];
            if (currentList.includes(tool)) {
              setForm({ ...form, toolsNeeded: currentList.filter(t => t !== tool).join(', ') });
            } else {
              setForm({ ...form, toolsNeeded: [...currentList, tool].join(', ') });
            }
          };

          const quickLocations = [
            'Pos Ronda RT 02 / Lapangan Fasum',
            'Gerbang Utama Huntap Tondo 2',
            'Sepanjang Jalan Blok A–G'
          ];

          const quickTimes = [
            { label: 'Pagi 07:00 - 10:00', start: '07:00', end: '10:00' },
            { label: 'Pagi 07:30 - 11:00 (Standar)', start: '07:30', end: '11:00' },
            { label: 'Sore 15:30 - 17:30', start: '15:30', end: '17:30' }
          ];

          return (
            <form onSubmit={handleCreateWork} className="space-y-5 text-left">
              {/* Top Hero Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-4.5 text-white shadow-lg shadow-emerald-600/15">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-inner shrink-0 mt-0.5">
                      <Users className="w-7 h-7 text-emerald-100" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Gotong Royong</span>
                        <span className="bg-white/20 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded">RT 002 / RW 020</span>
                        <span className="bg-black/20 text-emerald-100 text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/10">
                          {occupiedHousesCount} KK Terdaftar
                        </span>
                      </div>
                      <h4 className="text-xl font-black tracking-tight text-white mt-0.5">
                        Publikasi Agenda Kerja Bakti Warga
                      </h4>
                      <p className="text-xs text-emerald-100 mt-0.5">
                        Jadwal otomatis disiarkan ke Dasbor Portal Warga & Lembar Presensi Kehadiran
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="inline-flex items-center gap-1.5 bg-white text-emerald-900 text-xs font-black px-3 py-1.5 rounded-xl shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Kelurahan Tondo
                    </span>
                  </div>
                </div>
              </div>

              {/* Template Cepat */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    Pilih Template Kegiatan (Klik untuk Isi Cepat):
                  </span>
                  <span className="text-[10px] text-slate-400">Autofill praktis</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {templates.map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setForm({
                          ...form,
                          title: tpl.title,
                          toolsNeeded: tpl.tools,
                          description: tpl.desc,
                          assemblyPoint: tpl.assembly
                        });
                        toast.info(`Template '${tpl.label}' berhasil diterapkan!`);
                      }}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-left hover:border-emerald-500 hover:shadow-sm transition-all group"
                    >
                      <span className="text-lg block mb-1">{tpl.icon}</span>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block group-hover:text-emerald-600">
                        {tpl.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2-Column Responsive Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column: Form Controls (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Judul Kegiatan */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Judul Kegiatan Kerja Bakti <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="text"
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={form.title}
                        onChange={e => setForm({...form, title: e.target.value})}
                        placeholder="Contoh: Kerja Bakti Akbar Bersih Lingkungan RT 02"
                      />
                    </div>
                  </div>

                  {/* Deskripsi & Sasaran */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Deskripsi & Sasaran Kegiatan (Opsional)
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={form.description}
                      onChange={e => setForm({...form, description: e.target.value})}
                      placeholder="Jelaskan fokus pembersihan, target gorong-gorong, serta imbauan untuk seluruh kepala keluarga RT 02..."
                    />
                  </div>

                  {/* Tanggal & Waktu */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                        Tanggal Pelaksanaan <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="date"
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={form.date}
                        onChange={e => setForm({...form, date: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                        Jam Pelaksanaan (Mulai - Selesai)
                      </label>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="text"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-white focus:bg-white outline-none text-center"
                          value={form.startTime}
                          onChange={e => setForm({...form, startTime: e.target.value})}
                          placeholder="07:30"
                        />
                        <span className="text-xs font-bold text-slate-400">-</span>
                        <input 
                          type="text"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-white focus:bg-white outline-none text-center"
                          value={form.endTime}
                          onChange={e => setForm({...form, endTime: e.target.value})}
                          placeholder="11:00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preset Jam Cepat */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-slate-400 text-[10px]">Waktu:</span>
                    {quickTimes.map((qt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setForm({ ...form, startTime: qt.start, endTime: qt.end })}
                        className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono transition-all ${
                          form.startTime === qt.start && form.endTime === qt.end
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {qt.label}
                      </button>
                    ))}
                  </div>

                  {/* Titik Kumpul */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      Titik Kumpul / Lokasi Kegiatan
                    </label>
                    <input 
                      type="text"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={form.assemblyPoint}
                      onChange={e => setForm({...form, assemblyPoint: e.target.value})}
                      placeholder="Pos Ronda RT 02 / Lapangan Fasum"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {quickLocations.map((loc, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setForm({ ...form, assemblyPoint: loc })}
                          className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-400 transition-colors"
                        >
                          + {loc}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Peralatan yang Perlu Dibawa */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                      Alat yang Perlu Dibawa Warga
                    </label>
                    <input 
                      type="text"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={form.toolsNeeded}
                      onChange={e => setForm({...form, toolsNeeded: e.target.value})}
                      placeholder="Cangkul, Sabit, Sapu Lidi, Karung Sampah"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {quickTools.map((tool, idx) => {
                        const active = form.toolsNeeded.toLowerCase().includes(tool.toLowerCase());
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleTool(tool)}
                            className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium transition-all ${
                              active
                                ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400'
                            }`}
                          >
                            {active ? '✓ ' : '+ '} {tool}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Seksi Konsumsi */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Coffee className="w-3.5 h-3.5 text-amber-600" />
                      Seksi Konsumsi & Logistik (Opsional)
                    </label>
                    <input 
                      type="text"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={form.snackPIC}
                      onChange={e => setForm({...form, snackPIC: e.target.value})}
                      placeholder="Contoh: Ibu-ibu PKK RT 02 / Disediakan Kopi & Snack Pengurus RT"
                    />
                  </div>
                </div>

                {/* Right Column: Live Announcement Preview (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Live Announcement Card Preview */}
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md bg-white dark:bg-slate-900">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-3.5 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-200" />
                        <span className="text-xs font-black uppercase tracking-wider">Pratinjau Pengumuman Warga</span>
                      </div>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                        RT 02 / RW 020
                      </span>
                    </div>

                    <div className="p-4 space-y-3.5">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">
                          Agenda Resmi Mendatang
                        </span>
                        <h5 className="text-base font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                          {form.title || 'Judul Kegiatan Kerja Bakti...'}
                        </h5>
                      </div>

                      {form.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          {form.description}
                        </p>
                      )}

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            <strong>{new Date(form.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Pukul <strong>{form.startTime} - {form.endTime} WITA</strong></span>
                        </div>

                        <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                          <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <span>Kumpul: <strong>{form.assemblyPoint || '-'}</strong></span>
                        </div>
                      </div>

                      {/* Alat */}
                      {form.toolsNeeded && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                            Perlengkapan yang Dibawa:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {form.toolsNeeded.split(',').map((t, idx) => (
                              <span key={idx} className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                {t.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Konsumsi */}
                      {form.snackPIC && (
                        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                          <Coffee className="w-4 h-4 shrink-0 text-amber-600" />
                          <span>Konsumsi: <strong>{form.snackPIC}</strong></span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Sasaran Partisipasi:</span>
                        <strong className="text-slate-700 dark:text-slate-200">{occupiedHousesCount} Rumah Tangga RT 02</strong>
                      </div>
                    </div>
                  </div>

                  {/* Informasi Presensi Otomatis */}
                  <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      Presensi Kehadiran Otomatis
                    </div>
                    <p className="text-[11px] text-blue-700/90 dark:text-blue-400">
                      Sistem akan membuat lembar daftar hadir otomatis untuk seluruh {occupiedHousesCount} KK berpenghuni. Petugas tinggal mencatat status (Hadir, Diwakilkan, Kompensasi, Alpha) saat pelaksanaan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                  Agenda: <strong>{form.title || 'Agenda Baru'}</strong> • Tanggal <strong>{form.date}</strong>
                </div>

                <div className="flex items-center gap-2.5 ml-auto">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddModalOpen(false)}
                    className="rounded-xl px-4 py-2.5 text-xs font-bold"
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-emerald-600/25 flex items-center gap-2 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    Terbitkan Jadwal Kerja Bakti
                  </Button>
                </div>
              </div>
            </form>
          );
        })()}
      </Modal>

      {/* Modal Add Task Zone */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Tambah Pembagian Zona Tugas">
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Nama Tugas / Pekerjaan</label>
            <input 
              type="text"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
              value={taskForm.title}
              onChange={e => setTaskForm({...taskForm, title: e.target.value})}
              placeholder="Pembersihan Selokan & Rumput Liar"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Wilayah / Zona</label>
              <input 
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
                value={taskForm.zone}
                onChange={e => setTaskForm({...taskForm, zone: e.target.value})}
                placeholder="Blok C & D"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Koordinator Lapangan</label>
              <input 
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
                value={taskForm.picName}
                onChange={e => setTaskForm({...taskForm, picName: e.target.value})}
                placeholder="Ketua Seksi Kebersihan"
              />
            </div>
          </div>

          <Button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl">
            Simpan Zona Tugas
          </Button>
        </form>
      </Modal>
    </div>
  );
};
