import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, MapPin, Users, QrCode, Trash2, Edit2, CheckCircle, Clock } from 'lucide-react';
import { Activity, Attendance, House } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { 
  subscribeToActivities, 
  addActivityToDb, 
  updateActivityInDb, 
  deleteActivityFromDb,
  subscribeToAttendance,
  deleteAttendanceFromDb
} from '../../services/databaseService';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';

interface ActivityManagementProps {
  houses: House[];
}

export const ActivityManagement: React.FC<ActivityManagementProps> = ({ houses }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 16),
    location: '',
    type: 'Rapat' as Activity['type'],
    status: 'Upcoming' as Activity['status']
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
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan kegiatan.');
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      date: new Date().toISOString().slice(0, 16),
      location: '',
      type: 'Rapat',
      status: 'Upcoming'
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
      status: activity.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus kegiatan ini? Semua data presensi juga akan terhapus.')) {
      await deleteActivityFromDb(id);
    }
  };

  const handleDeleteAttendance = async (id: string) => {
    if (window.confirm('Hapus data presensi ini?')) {
      await deleteAttendanceFromDb(id);
    }
  };

  const filteredActivities = activities.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Presensi Kegiatan Digital</h2>
          <p className="text-slate-500 text-sm font-medium">Kelola kegiatan warga dan pantau kehadiran secara real-time.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
          <Plus size={18} className="mr-2" /> Buat Kegiatan
        </Button>
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
                  onClick={() => { setSelectedActivity(activity); }}
                  className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 transition-all flex items-center justify-center"
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

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingActivityId ? "Edit Kegiatan" : "Buat Kegiatan Baru"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Judul Kegiatan</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              placeholder="Contoh: Rapat Bulanan RT"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Deskripsi</label>
            <textarea 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all min-h-[100px]"
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Detail kegiatan..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Tanggal & Waktu</label>
              <input 
                type="datetime-local" 
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                value={form.date}
                onChange={e => setForm({...form, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Lokasi</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                value={form.location}
                onChange={e => setForm({...form, location: e.target.value})}
                placeholder="Contoh: Balai RT"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Jenis</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value as Activity['type']})}
              >
                <option value="Rapat">Rapat</option>
                <option value="Kerja Bakti">Kerja Bakti</option>
                <option value="Arisan">Arisan</option>
                <option value="Posyandu">Posyandu</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Status</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                value={form.status}
                onChange={e => setForm({...form, status: e.target.value as Activity['status']})}
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
          <Button type="submit" className="w-full py-4 shadow-xl shadow-indigo-200 mt-4">
            {editingActivityId ? 'Simpan Perubahan' : 'Buat Kegiatan'}
          </Button>
        </form>
      </Modal>

      {/* Attendance Modal */}
      <Modal isOpen={isAttendanceModalOpen} onClose={() => setIsAttendanceModalOpen(false)} title={`Presensi: ${selectedActivity?.title}`}>
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                <Users size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">Total Kehadiran</p>
                <p className="text-xl font-black text-slate-800 leading-none">{attendance.length} Warga</p>
              </div>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
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
        </div>
      </Modal>
    </div>
  );
};
