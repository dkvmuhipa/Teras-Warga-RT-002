import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Edit2, CalendarDays, Clock, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';
import { AppEvent } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { addEventToDb, deleteEventFromDb, updateEventInDb } from '../../services/databaseService';
import { toast } from 'sonner';

interface EventManagerProps {
  events: AppEvent[];
}

export const EventManager: React.FC<EventManagerProps> = ({ events }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');

  const openModal = (event?: AppEvent) => {
    if (event) {
      setEditingId(event.id);
      setTitle(event.title);
      setDescription(event.description);
      setDate(event.date);
      setTime(event.time || '');
      setLocation(event.location || '');
    } else {
      setEditingId(null);
      setTitle('');
      setDescription('');
      setDate('');
      setTime('');
      setLocation('');
    }
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !date) {
      toast.error('Harap lengkapi judul, deskripsi, dan tanggal acara.');
      return;
    }

    try {
      if (editingId) {
        await updateEventInDb(editingId, { title, description, date, time: time || undefined, location: location || undefined });
        toast.success('Acara berhasil diperbarui', { icon: '✅' });
      } else {
        await addEventToDb({
          title,
          description,
          date,
          time: time || undefined,
          location: location || undefined,
          createdAt: new Date().toISOString()
        });
        toast.success('Acara baru berhasil ditambahkan !', { icon: '🎉' });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error('Gagal menyimpan acara');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus acara ini?")) {
      try {
        await deleteEventFromDb(id);
        toast.success('Acara berhasil dihapus');
      } catch (err) {
        toast.error('Gagal menghapus acara');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900">Manajemen Acara</h2>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20"
        >
          <Plus size={18} /> Tambah Acara
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(event => (
          <div key={event.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Calendar size={20} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => openModal(event)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(event.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16} /></button>
              </div>
            </div>
            <h3 className="font-bold text-lg text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{event.title}</h3>
            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">{event.description}</p>
            
            <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <CalendarDays size={14} className="text-indigo-500" />
                {new Date(event.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              {event.time && (
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Clock size={14} className="text-amber-500" />
                  {event.time}
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <MapPin size={14} className="text-emerald-500" />
                  {event.location}
                </div>
              )}
            </div>
          </div>
        ))}
        {events.length === 0 && (
           <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50">
             <Calendar size={48} className="mb-4 text-slate-300" />
             <p className="text-sm font-bold">Belum ada acara yang dijadwalkan.</p>
           </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Acara" : "Buat Acara Baru"}>
        <form onSubmit={handleSaveEvent} className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Nama / Judul Acara</label>
            <input 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" 
              value={title} 
              onChange={e=>setTitle(e.target.value)} 
              placeholder="Contoh: Rapat Warga RT 02..." 
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Deskripsi Acara</label>
            <textarea 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all min-h-[100px] resize-none" 
              rows={3} 
              value={description} 
              onChange={e=>setDescription(e.target.value)} 
              placeholder="Ceritakan tujuan kegiatan, susunan acara, dresscode dll..." 
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Tanggal Pelaksanaan</label>
              <div className="relative group/date">
                <input 
                  type="date" 
                  className="w-full pl-12 pr-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer" 
                  value={date} 
                  onChange={e=>setDate(e.target.value)} 
                  required
                />
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within/date:text-indigo-500 transition-colors">
                  <CalendarDays size={18} />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Waktu (Opsional)</label>
              <div className="relative group/time">
                <input 
                  type="time" 
                  className="w-full pl-12 pr-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer" 
                  value={time} 
                  onChange={e=>setTime(e.target.value)} 
                />
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within/time:text-indigo-500 transition-colors">
                  <Clock size={18} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Lokasi Acara (Opsional)</label>
            <div className="relative group/location">
              <input 
                className="w-full pl-12 pr-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" 
                value={location} 
                onChange={e=>setLocation(e.target.value)} 
                placeholder="Contoh: Balai Warga RT 02..." 
              />
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within/location:text-indigo-500 transition-colors">
                <MapPin size={18} />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Button type="submit" className="w-full py-4 text-sm font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-500/20 flex justify-center items-center gap-2 group/submit">
              {editingId ? (
                <>Simpan Perubahan <CheckCircle2 size={18} className="group-hover/submit:scale-110 transition-transform" /></>
              ) : (
                <>Terbitkan Acara <Sparkles size={18} className="group-hover/submit:scale-110 transition-transform" /></>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
