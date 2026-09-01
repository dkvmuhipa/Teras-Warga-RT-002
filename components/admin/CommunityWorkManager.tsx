import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, Clock, MapPin, Wrench, CheckCircle, Plus, Search, Trash2, 
  CheckSquare, AlertCircle, Coffee, Check, X, ArrowRight, Shield, Download, Sparkles 
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
  const totalWarga = activeWork?.attendances?.length || 0;
  const tasksDoneCount = activeWork?.tasks?.filter(t => t.isDone).length || 0;

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

                  <div className="flex items-center gap-2">
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
                  <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
                    <h4 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">
                      PRESENSI PER KELUARGA / RUMAH
                    </h4>
                    <span className="text-xs font-mono font-black text-emerald-600">
                      Tingkat Partisipasi: {totalWarga > 0 ? Math.round((hadirCount / totalWarga) * 100) : 0}%
                    </span>
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
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Buat Agenda Kerja Bakti RT 02">
        <form onSubmit={handleCreateWork} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Judul Kegiatan Kerja Bakti</label>
            <input 
              type="text"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              placeholder="Kerja Bakti Akbar Bersih Lingkungan RT 02"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Tanggal Pelaksanaan</label>
              <input 
                type="date"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                value={form.date}
                onChange={e => setForm({...form, date: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Jam Mulai - Selesai</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
                  value={form.startTime}
                  onChange={e => setForm({...form, startTime: e.target.value})}
                  placeholder="07:30"
                />
                <input 
                  type="text"
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
                  value={form.endTime}
                  onChange={e => setForm({...form, endTime: e.target.value})}
                  placeholder="11:00"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Titik Kumpul / Lokasi</label>
            <input 
              type="text"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
              value={form.assemblyPoint}
              onChange={e => setForm({...form, assemblyPoint: e.target.value})}
              placeholder="Pos Ronda RT 02 / Lapangan Fasum"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Alat yang Perlu Dibawa (Pisahkan koma)</label>
            <input 
              type="text"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
              value={form.toolsNeeded}
              onChange={e => setForm({...form, toolsNeeded: e.target.value})}
              placeholder="Cangkul, Sabit, Sapu Lidi, Karung Sampah"
            />
          </div>

          <Button type="submit" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 mt-2">
            Terbitkan Jadwal Kerja Bakti
          </Button>
        </form>
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
