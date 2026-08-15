import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, MapPin, Users, QrCode, Trash2, Edit2, CheckCircle, Clock, AlertTriangle, Share2, Sparkles, Printer } from 'lucide-react';
import { Activity, Attendance, House } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { 
  subscribeToActivities, 
  addActivityToDb, 
  updateActivityInDb, 
  deleteActivityFromDb,
  subscribeToAttendance,
  addAttendanceToDb,
  deleteAttendanceFromDb,
  addTransactionToDb,
  handleFirestoreError,
  OperationType
} from '../../services/databaseService';
import { generateEventAttendanceReportPDF } from '../../services/pdfService';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { useConfirm } from '../../context/ConfirmContext';

interface ActivityManagementProps {
  houses: House[];
}

export const ActivityManagement: React.FC<ActivityManagementProps> = ({ houses }) => {
  const confirm = useConfirm();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);

  // New states for manual event attendance logging
  const [attendanceTab, setAttendanceTab] = useState<'list' | 'manual'>('list');
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [customAttendeeNames, setCustomAttendeeNames] = useState<Record<string, string>>({});
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 16),
    location: '',
    type: 'Rapat' as Activity['type'],
    status: 'Upcoming' as Activity['status'],
    isMandatory: false,
    compensationAmount: 20000
  });

  useEffect(() => {
    const unsubscribe = subscribeToActivities(setActivities);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedActivity) {
      const unsubscribe = subscribeToAttendance(selectedActivity.id, setAttendance);
      return () => unsubscribe();
    }
  }, [selectedActivity]);

  useEffect(() => {
    if (!isAttendanceModalOpen) {
      setAttendanceTab('list');
      setManualSearchQuery('');
      setCustomAttendeeNames({});
    }
  }, [isAttendanceModalOpen]);

  const handleMarkAttendance = async (house: House, nameToUse?: string) => {
    if (!selectedActivity) return;
    
    const isDuplicate = attendance.some(a => a.houseId.toLowerCase() === house.id.toLowerCase());
    if (isDuplicate) {
      toast.warning(`Rumah ${house.id} sudah tercatat hadir!`);
      return;
    }

    const finalName = (nameToUse !== undefined ? nameToUse : (customAttendeeNames[house.id] !== undefined ? customAttendeeNames[house.id] : house.headOfFamily)).trim();
    if (!finalName) {
      toast.error("Nama warga tidak boleh kosong!");
      return;
    }

    try {
      await addAttendanceToDb({
        activityId: selectedActivity.id,
        residentName: finalName,
        houseId: house.id,
        timestamp: new Date().toISOString()
      });
      toast.success(`Kehadiran ${finalName} (${house.id}) berhasil dicatat`);
    } catch (e) {
      toast.error("Gagal mencatat kehadiran manual.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...form,
        qrCode: editingActivityId || `ACT-${Date.now()}`
      };

      if (editingActivityId) {
        await updateActivityInDb(editingActivityId, data);
      } else {
        await addActivityToDb(data);
      }
      setIsModalOpen(false);
      resetForm();
      toast.success(editingActivityId ? 'Kegiatan berhasil diperbarui!' : 'Kegiatan berhasil dibuat!');
    } catch (error) {
      handleFirestoreError(error, editingActivityId ? OperationType.UPDATE : OperationType.CREATE, "activities");
      toast.error('Gagal menyimpan kegiatan.');
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      date: new Date().toISOString().slice(0, 16),
      location: '',
      type: 'Rapat',
      status: 'Upcoming',
      isMandatory: false,
      compensationAmount: 20000
    });
    setEditingActivityId(null);
  };

  const openEdit = (activity: Activity) => {
    setEditingActivityId(activity.id);
    setForm({
      title: activity.title,
      description: activity.description,
      date: activity.date.slice(0, 16),
      location: activity.location,
      type: activity.type,
      status: activity.status,
      isMandatory: activity.isMandatory || false,
      compensationAmount: activity.compensationAmount || 20000
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Kegiatan',
      message: 'Apakah Anda yakin ingin menghapus kegiatan ini? Semua data presensi juga akan terhapus.',
      confirmLabel: 'Hapus',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await deleteActivityFromDb(id);
        toast.success('Kegiatan berhasil dihapus.');
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus kegiatan.');
      }
    }
  };

  const handleDeleteAttendance = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Presensi',
      message: 'Apakah Anda yakin ingin menghapus data presensi ini?',
      confirmLabel: 'Hapus',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await deleteAttendanceFromDb(id);
        toast.success('Data presensi berhasil dihapus.');
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus data presensi.');
      }
    }
  };

  const handleApplyCompensations = async () => {
    if (!selectedActivity || !selectedActivity.isMandatory || selectedActivity.compensationApplied) return;
    
    const isConfirmed = await confirm({
      title: 'Terapkan Kompensasi',
      message: `Terapkan iuran kompensasi sebesar Rp ${selectedActivity.compensationAmount?.toLocaleString()} bagi warga yang tidak hadir?`,
      confirmLabel: 'Terapkan',
      isDanger: false
    });

    if (isConfirmed) {
      try {
        const attendedHouseIds = new Set(attendance.map(a => a.houseId));
        const occupiedHouses = houses.filter(h => h.status === 'Occupied');
        const absentees = occupiedHouses.filter(h => !attendedHouseIds.has(h.id));

        if (absentees.length === 0) {
          toast.info('Semua warga hadir! Tidak ada kompensasi yang perlu diterapkan.');
          return;
        }

        for (const house of absentees) {
          await addTransactionToDb({
            description: `Kompensasi Absen: ${selectedActivity.title} (${house.id})`,
            amount: selectedActivity.compensationAmount || 20000,
            type: 'Income',
            category: 'Kompensasi Kegiatan',
            date: new Date().toISOString().split('T')[0]
          });
        }

        await updateActivityInDb(selectedActivity.id, { compensationApplied: true });
        toast.success(`Berhasil menerapkan kompensasi untuk ${absentees.length} warga.`);
        setSelectedActivity({ ...selectedActivity, compensationApplied: true });
      } catch (error) {
        console.error(error);
        toast.error('Gagal menerapkan kompensasi.');
      }
    }
  };

  const filteredActivities = activities.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalActivities = activities.length;
  const upcomingActivities = activities.filter(a => a.status === 'Upcoming').length;
  const ongoingActivities = activities.filter(a => a.status === 'Ongoing').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Presensi Kegiatan Digital</h2>
          <p className="text-slate-500 font-medium mt-1">Buat jadwal agenda rapat atau gotong royong warga, kelola QR kehadiran, dan pantau data presensi.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95">
          <Plus size={18} className="mr-2" /> Buat Kegiatan
        </Button>
      </div>

      {/* Activity Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-50 via-white to-indigo-50/30 p-6 rounded-[2rem] border border-indigo-100/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-indigo-500 font-extrabold uppercase tracking-widest">Total Agenda</p>
            <p className="text-3xl font-black text-indigo-950 leading-none">{totalActivities} <span className="text-xs font-bold text-indigo-500">Kegiatan</span></p>
            <p className="text-[11px] text-indigo-600 font-medium">Seluruh kegiatan yang tercatat secara digital</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-600">
            <Calendar size={24} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50/30 p-6 rounded-[2rem] border border-amber-100/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest font-black text-slate-600">Mendatang (Upcoming)</p>
            <p className="text-3xl font-black text-amber-950 leading-none">{upcomingActivities} <span className="text-xs font-bold text-amber-500">Agenda</span></p>
            <p className="text-[11px] text-amber-600 font-medium">Kegiatan terjadwal yang akan segera dilaksanakan</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-600 font-black text-slate-600">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 p-6 rounded-[2rem] border border-emerald-100/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-widest font-black text-slate-600">Sedang Berjalan (Ongoing)</p>
            <p className="text-3xl font-black text-emerald-950 leading-none">{ongoingActivities} <span className="text-xs font-bold text-emerald-500">Aktif</span></p>
            <p className="text-[11px] text-emerald-600 font-medium">Kegiatan sedang berlangsung hari ini</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-600 font-black text-slate-600">
            <Users size={24} />
          </div>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Cari kegiatan..." 
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredActivities.map((activity) => (
            <motion.div
              key={activity.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col"
            >
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    activity.status === 'Ongoing' ? 'bg-emerald-100 text-emerald-600' :
                    activity.status === 'Completed' ? 'bg-slate-100 text-slate-600' :
                    'bg-indigo-100 text-indigo-600'
                  }`}>
                    {activity.status}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(activity)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(activity.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{activity.title}</h3>
                {activity.isMandatory && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-100 flex items-center gap-1">
                      <AlertTriangle size={10} /> Wajib
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Kompensasi: Rp {activity.compensationAmount?.toLocaleString()}</span>
                  </div>
                )}
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{activity.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                    <Calendar size={14} className="text-indigo-500" />
                    {new Date(activity.date).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                    <MapPin size={14} className="text-indigo-500" />
                    {activity.location}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                    <Users size={14} className="text-indigo-500" />
                    {activity.type}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                <button 
                  onClick={() => { setSelectedActivity(activity); setIsAttendanceModalOpen(true); }}
                  className="flex-1 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all flex items-center justify-center gap-2"
                >
                  <Users size={14} /> Presensi
                </button>
                <button 
                  onClick={() => {
                    const text = `*UNDANGAN KEGIATAN TERAS RT 02*\n\n📌 *Agenda:* ${activity.title}\n📅 *Waktu:* ${new Date(activity.date).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}\n📍 *Lokasi:* ${activity.location}\n📂 *Jenis:* ${activity.type}${activity.isMandatory ? ' *(WAJIB HADIR)*' : ''}\n\n📝 *Deskripsi:*\n${activity.description}\n\n_Mohon kehadiran seluruh bapak/ibu warga RT 02 tepat waktu. Terima kasih!_`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="px-3 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl font-bold transition-all flex items-center justify-center"
                  title="Sebar Undangan via WhatsApp"
                >
                  <Share2 size={16} />
                </button>
                <button 
                  onClick={() => { setSelectedActivity(activity); }}
                  className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 transition-all flex items-center justify-center"
                  title="Tampilkan QR Code"
                >
                  <QrCode size={18} />
                </button>
              </div>

              {selectedActivity?.id === activity.id && !isAttendanceModalOpen && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center z-10">
                  <h4 className="font-black text-slate-800 mb-4">Scan QR untuk Presensi</h4>
                  <div className="p-4 bg-white rounded-3xl shadow-2xl border border-slate-100 mb-6">
                    <QRCodeSVG value={activity.id} size={200} />
                  </div>
                  <p className="text-xs font-bold text-slate-500 mb-6">Warga dapat melakukan scan melalui aplikasi Teras Warga</p>
                  <Button onClick={() => setSelectedActivity(null)} variant="outline" className="w-full">Tutup</Button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Create/Edit Modal (Max-W-5XL Split View Layout) */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingActivityId ? "Edit Agenda Kegiatan RT" : "Buat Agenda Kegiatan Baru"}
        maxWidth="max-w-5xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Input Side */}
          <form onSubmit={handleSave} className="lg:col-span-7 space-y-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Judul Kegiatan / Agenda</label>
              <input 
                type="text" 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                placeholder="Contoh: Rapat Kerja Musyawarah Warga RT 02"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Jenis Kegiatan</label>
                <select 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                  value={form.type}
                  onChange={e => setForm({...form, type: e.target.value as Activity['type']})}
                >
                  <option value="Rapat">Rapat Musyawarah</option>
                  <option value="Kerja Bakti">Kerja Bakti / Gotong Royong</option>
                  <option value="Arisan">Arisan / Silaturahmi</option>
                  <option value="Posyandu">Posyandu & Kesehatan</option>
                  <option value="Lainnya">Kegiatan Lainnya</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Status Agenda</label>
                <select 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                  value={form.status}
                  onChange={e => setForm({...form, status: e.target.value as Activity['status']})}
                >
                  <option value="Upcoming">Akan Datang (Upcoming)</option>
                  <option value="Ongoing">Sedang Berjalan (Ongoing)</option>
                  <option value="Completed">Selesai (Completed)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Tanggal & Waktu Acara</label>
                <input 
                  type="datetime-local" 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  value={form.date}
                  onChange={e => setForm({...form, date: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Lokasi Pelaksanaan</label>
                <input 
                  type="text" 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  value={form.location}
                  onChange={e => setForm({...form, location: e.target.value})}
                  placeholder="Contoh: Balai Pertemuan RT 02"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Deskripsi & Agenda Kegiatan</label>
                <button 
                  type="button" 
                  onClick={async () => {
                    if (!form.title) return toast.error('Isi judul agenda kegiatan terlebih dahulu');
                    const draft = `Undangan ${form.type}: ${form.title}.\n\nDimohon kehadiran seluruh bapak/ibu warga RT 02 pada waktu dan tempat yang tertera. Harap membawa perlengkapan pribadi yang dibutuhkan.\n\nDemikian pengumuman ini disampaikan, terima kasih atas perhatian dan partisipasinya.`;
                    setForm(prev => ({ ...prev, description: draft }));
                    toast.success('Deskripsi agenda kegiatan AI berhasil dibuat!');
                  }}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/70 text-[11px] font-black py-1.5 px-3 rounded-full transition-all shrink-0 active:scale-95"
                >
                  <Sparkles size={13} className="text-indigo-600 animate-pulse" />
                  <span>Bantu Tulis AI Agenda</span>
                </button>
              </div>
              <textarea 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all min-h-[100px] resize-none leading-relaxed" 
                rows={4}
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Tuliskan poin-poin agenda rapat atau instruksi kerja bakti..."
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">Agenda Wajib Kehadiran</p>
                    <p className="text-[10px] text-slate-500 font-medium">Aktifkan jika berlaku iuran kompensasi bagi warga yang absen</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  checked={form.isMandatory}
                  onChange={e => setForm({...form, isMandatory: e.target.checked})}
                />
              </div>

              {form.isMandatory && (
                <div className="pt-2 border-t border-slate-200/60">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Besar Iuran Kompensasi Absen (Rp)</label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={form.compensationAmount}
                    onChange={e => setForm({...form, compensationAmount: Number(e.target.value)})}
                  />
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex gap-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 rounded-2xl text-xs font-black uppercase">
                Batal
              </Button>
              <Button type="submit" className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase shadow-lg shadow-indigo-200">
                {editingActivityId ? "Simpan Perubahan Agenda" : "Terbitkan Agenda Digital"}
              </Button>
            </div>
          </form>

          {/* Live Mobile Digital Pass Mockup Side */}
          <div className="lg:col-span-5 hidden lg:flex flex-col bg-slate-900 rounded-[2.5rem] p-5 text-white border border-slate-800 shadow-xl justify-between min-h-[500px]">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-ping" />
                  <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest">LIVE EVENT PASS MOCKUP</span>
                </div>
                <Calendar size={15} className="text-indigo-400" />
              </div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-3">Tampilan Tiket Presensi Digital Warga:</p>
              
              <div className="bg-white text-slate-900 rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[8.5px] font-black uppercase tracking-widest rounded-md">
                    {form.type || 'Rapat'}
                  </span>
                  {form.isMandatory ? (
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 text-[8.5px] font-black uppercase tracking-widest rounded-md">
                      WAJIB HADIR
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-400">AGENDA RT 02</span>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="font-black text-sm text-slate-900 leading-snug">
                    {form.title || '[Judul Agenda Kegiatan RT]'}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
                    {form.description || '[Deskripsi dan arahan kegiatan akan tampil di sini...]'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-[10.5px] font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-indigo-600" />
                    <span>{form.date ? new Date(form.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '[Waktu Acara]'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-indigo-600" />
                    <span>{form.location || '[Lokasi Acara]'}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[9px] font-mono text-slate-400 border-t border-slate-100">
                  <span>SISTEM PRESENSI TERAS</span>
                  <span className="text-indigo-600 font-bold">SCAN QR CARD ✓</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[9.5px] text-slate-400 font-medium text-center leading-normal">
              Kegiatan otomatis tersinkronisasi di kalender aplikasi warga Teras RT 02.
            </div>
          </div>
        </div>
      </Modal>

      {/* Attendance Modal */}
      <Modal isOpen={isAttendanceModalOpen} onClose={() => setIsAttendanceModalOpen(false)} title={`Presensi: ${selectedActivity?.title}`}>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                <Users size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">Total Kehadiran Warga</p>
                <p className="text-xl font-black text-slate-800 leading-none">{attendance.length} Personil / Rumah</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                onClick={() => {
                  if (!selectedActivity) return;
                  const currentPdfConfig = (window as any).pdfConfig || { rtName: 'RT 02', kelurahan: 'TONDO', kecamatan: 'MANTIKULORE', rtChairman: 'Ketua RT' };
                  generateEventAttendanceReportPDF(selectedActivity, attendance, houses, currentPdfConfig);
                }}
                size="sm"
                variant="outline"
                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider py-2"
              >
                <Printer size={14} className="mr-1 text-indigo-600" /> Cetak PDF
              </Button>

              <Button
                onClick={() => {
                  if (!selectedActivity) return;
                  const text = `*REKAPITULASI PRESENSI KEGIATAN RT 02*\n\n📌 *Agenda:* ${selectedActivity.title}\n📅 *Waktu:* ${new Date(selectedActivity.date).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}\n📍 *Lokasi:* ${selectedActivity.location}\n👥 *Total Hadir:* ${attendance.length} Warga\n\n✅ *Daftar Hadir:*\n${attendance.map((a, i) => `${i+1}. ${a.residentName} (Blok ${a.houseId})`).join('\n') || '- Belum Ada -'}\n\n_Pusat Data Presensi Teras RT 02_`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider py-2"
              >
                <Share2 size={14} className="mr-1" /> Rekap WA
              </Button>

              {selectedActivity?.isMandatory && selectedActivity?.status === 'Completed' && !selectedActivity?.compensationApplied && (
                <Button onClick={handleApplyCompensations} size="sm" className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-wider py-2">
                  Terapkan Sanksi
                </Button>
              )}
            </div>
          </div>

          {/* Navigation Tabs for Attendance */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/40">
            <button
              onClick={() => setAttendanceTab('list')}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                attendanceTab === 'list'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Daftar Presensi ({attendance.length})
            </button>
            <button
              onClick={() => setAttendanceTab('manual')}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                attendanceTab === 'manual'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Catat Manual ({houses.filter(h => h.status === 'Occupied').length - attendance.length} Belum)
            </button>
          </div>

          {attendanceTab === 'list' ? (
            <div className="max-h-[350px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {attendance.length > 0 ? (
                attendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 font-black shadow-sm group-hover:text-indigo-600 transition-colors">
                        {record.residentName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 leading-none mb-1">{record.residentName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Blok {record.houseId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1 flex items-center gap-1">
                          <CheckCircle size={10} /> Hadir
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 leading-none flex items-center gap-1">
                          <Clock size={10} /> {new Date(record.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteAttendance(record.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                    <Users size={32} />
                  </div>
                  <p className="text-slate-400 font-bold">Belum ada warga yang hadir.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Cari warga atau nomor rumah..."
                  value={manualSearchQuery}
                  onChange={e => setManualSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {(() => {
                  const occupied = houses.filter(h => h.status === 'Occupied');
                  const filtered = occupied.filter(h => 
                    h.id.toLowerCase().includes(manualSearchQuery.toLowerCase()) ||
                    h.headOfFamily.toLowerCase().includes(manualSearchQuery.toLowerCase())
                  );

                  if (filtered.length === 0) {
                    return (
                      <p className="text-center text-slate-400 text-xs py-8 italic font-bold">Warga atau rumah tidak ditemukan.</p>
                    );
                  }

                  return filtered.map((house) => {
                    const existingRecord = attendance.find(a => a.houseId.toLowerCase() === house.id.toLowerCase());
                    const currentNameInput = customAttendeeNames[house.id] !== undefined ? customAttendeeNames[house.id] : house.headOfFamily;
                    
                    return (
                      <div key={house.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white transition-all gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-800 text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg border border-indigo-100/30">
                              {house.id}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Penghuni Tetap</span>
                          </div>
                          {!existingRecord ? (
                            <div className="mt-2 flex items-center gap-1.5 w-full">
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase whitespace-nowrap">Nama:</span>
                              <input
                                type="text"
                                value={currentNameInput}
                                onChange={e => setCustomAttendeeNames({ ...customAttendeeNames, [house.id]: e.target.value })}
                                className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white font-black text-slate-800 w-full outline-indigo-500"
                              />
                            </div>
                          ) : (
                            <p className="mt-1.5 text-xs text-slate-700 font-extrabold flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Peserta:</span>
                              {existingRecord.residentName}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-end">
                          {existingRecord ? (
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1">
                                <CheckCircle size={10} /> Hadir
                              </span>
                              <button 
                                onClick={() => handleDeleteAttendance(existingRecord.id)}
                                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Batalkan kehadiran"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ) : (
                            <Button 
                              onClick={() => handleMarkAttendance(house)}
                              size="sm"
                              className="bg-indigo-600 hover:bg-indigo-700 text-[10px] font-black uppercase tracking-widest px-4 py-2 shadow-sm rounded-xl"
                            >
                              + Hadir
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
