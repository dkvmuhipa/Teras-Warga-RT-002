import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Edit2, CalendarDays, Clock, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';
import { AppEvent } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { addEventToDb, deleteEventFromDb, updateEventInDb } from '../../services/databaseService';
import { generateAnnouncementDraft } from '../../services/geminiService';
import { toast } from 'sonner';

interface EventManagerProps {
  events: AppEvent[];
}

export const EventManager: React.FC<EventManagerProps> = ({ events }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Enhanced Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('08:00');
  const [location, setLocation] = useState('Gedung Serbaguna RT 02');
  const [organizer, setOrganizer] = useState('Panitia RT 02 Palu');
  const [category, setCategory] = useState<'Gotong Royong' | 'Rapat RT' | 'Keagamaan' | 'Olahraga' | 'Sosial/Budaya'>('Gotong Royong');
  const [quota, setQuota] = useState<string>('50');
  const [dresscode, setDresscode] = useState('Bebas Rapi / Pakaian Kerja');
  const [isBroadcast, setIsBroadcast] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const openModal = (event?: AppEvent) => {
    if (event) {
      setEditingId(event.id);
      setTitle(event.title);
      setDescription(event.description);
      setDate(event.date);
      setTime(event.time || '08:00');
      setLocation(event.location || 'Gedung Serbaguna RT 02');
      setOrganizer(event.organizer || 'Panitia RT 02 Palu');
      setCategory(event.category || 'Gotong Royong');
      setQuota(event.quota ? event.quota.toString() : '50');
      setDresscode(event.dresscode || 'Bebas Rapi / Pakaian Kerja');
      setIsBroadcast(event.isBroadcast ?? true);
    } else {
      setEditingId(null);
      setTitle('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime('08:00');
      setLocation('Gedung Serbaguna RT 02');
      setOrganizer('Panitia RT 02 Palu');
      setCategory('Gotong Royong');
      setQuota('50');
      setDresscode('Bebas Rapi / Pakaian Kerja');
      setIsBroadcast(true);
    }
    setIsModalOpen(true);
  };

  const handleGenerateWithAi = async () => {
    if (!title) return toast.error('Masukkan nama/judul acara terlebih dahulu');
    setIsAiLoading(true);
    try {
      const prompt = `Acara: ${title}, Kategori: ${category}, Waktu: ${date} ${time}, Lokasi: ${location}`;
      const draft = await generateAnnouncementDraft(prompt, 'Acara');
      setDescription(draft);
      toast.success('Draft susunan acara berhasil di-generate AI!');
    } catch (error) {
      toast.error('Gagal menyusun draft acara AI.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !date) {
      toast.error('Harap lengkapi judul, deskripsi, dan tanggal acara.');
      return;
    }

    try {
      const eventPayload = {
        title,
        description,
        date,
        time: time || undefined,
        location: location || undefined,
        organizer: organizer || 'Panitia RT 02 Palu',
        category,
        quota: quota ? parseInt(quota) : undefined,
        dresscode: dresscode || undefined,
        isBroadcast
      };

      if (editingId) {
        await updateEventInDb(editingId, eventPayload);
        toast.success('Agenda acara RT berhasil diperbarui', { icon: '✅' });
      } else {
        await addEventToDb({
          ...eventPayload,
          attendees: [],
          createdAt: new Date().toISOString()
        });
        toast.success('Acara baru berhasil diterbitkan!', { icon: '🎉' });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error('Gagal menyimpan acara');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus acara ini secara permanen?")) {
      try {
        await deleteEventFromDb(id);
        toast.success('Acara berhasil dihapus');
      } catch (err) {
        toast.error('Gagal menghapus acara');
      }
    }
  };

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'Gotong Royong': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rapat RT': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Keagamaan': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Olahraga': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header with Executive Badge */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-orange-500 rounded-full"></div>
            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Agenda & Kalender Kegiatan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">Agenda Acara RT 02</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Pengelolaan rapat warga, gotong royong, kegiatan sosial, dan presensi partisipasi.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            onClick={() => openModal()} 
            className="w-full md:w-auto px-6 py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Buat Acara Baru
          </Button>
        </div>
      </div>

      {/* Event Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(event => (
          <div key={event.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xs hover:shadow-xl hover:shadow-orange-100/30 transition-all group relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getCategoryBadge(event.category)}`}>
                  {event.category || 'Acara RT'}
                </span>

                <div className="flex items-center gap-1.5">
                  <button onClick={() => openModal(event)} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all" title="Edit Acara"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(event.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Hapus Acara"><Trash2 size={16} /></button>
                </div>
              </div>

              <h3 className="font-black text-xl text-slate-900 leading-snug mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">{event.title}</h3>
              <p className="text-xs text-slate-500 font-medium line-clamp-3 leading-relaxed mb-4">{event.description}</p>
            </div>
            
            <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 text-xs font-bold text-slate-600">
              <div className="flex items-center gap-2">
                <CalendarDays size={14} className="text-orange-500 shrink-0" />
                <span>{new Date(event.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              
              {event.time && (
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-amber-500 shrink-0" />
                  <span>Pukul {event.time} WITA</span>
                </div>
              )}
              
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-emerald-500 shrink-0" />
                  <span className="line-clamp-1">{event.location}</span>
                </div>
              )}

              {event.dresscode && (
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                  <span>👔 Pakaian: {event.dresscode}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
            <Calendar size={48} className="mb-4 text-slate-300" />
            <p className="text-base font-bold text-slate-600">Belum ada acara yang dijadwalkan.</p>
            <p className="text-xs text-slate-400 mt-1">Klik "Buat Acara Baru" untuk mempublikasikan agenda rapat atau kegiatan warga.</p>
          </div>
        )}
      </div>

      {/* Enhanced Event Modal (Max-W-5XL Split View Layout) */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Edit Agenda Acara RT" : "Buat Agenda Acara Baru"}
        maxWidth="max-w-5xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Side */}
          <form onSubmit={handleSaveEvent} className="lg:col-span-7 space-y-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Nama / Judul Acara RT</label>
              <input 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all" 
                value={title} 
                onChange={e=>setTitle(e.target.value)} 
                placeholder="Contoh: Rapat Koordinasi Ronda & Gotong Royong..." 
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Kategori Kegiatan</label>
                <select 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all cursor-pointer" 
                  value={category} 
                  onChange={e=>setCategory(e.target.value as any)}
                >
                  <option value="Gotong Royong">🧹 Gotong Royong / Kerja Bakti</option>
                  <option value="Rapat RT">🗣️ Rapat Warga / Musyawarah</option>
                  <option value="Keagamaan">🕌 Pengajian / Keagamaan</option>
                  <option value="Olahraga">⚽ Senam / Olahraga Bersama</option>
                  <option value="Sosial/Budaya">🎉 Pentas Seni / Arisan Warga</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Penyelenggara / Panitia</label>
                <input 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all" 
                  value={organizer} 
                  onChange={e=>setOrganizer(e.target.value)} 
                  placeholder="Contoh: Pengurus RT 02 / Karang Taruna" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Tanggal Pelaksanaan</label>
                <input 
                  type="date" 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all cursor-pointer" 
                  value={date} 
                  onChange={e=>setDate(e.target.value)} 
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Waktu Acara (WITA)</label>
                <input 
                  type="time" 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all cursor-pointer" 
                  value={time} 
                  onChange={e=>setTime(e.target.value)} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Lokasi Acara</label>
                <input 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all" 
                  value={location} 
                  onChange={e=>setLocation(e.target.value)} 
                  placeholder="Contoh: Gedung Serbaguna RT 02..." 
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Pakaian / Dresscode</label>
                <input 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all" 
                  value={dresscode} 
                  onChange={e=>setDresscode(e.target.value)} 
                  placeholder="Contoh: Bebas Rapi / Baju Kaos Olahraga" 
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Deskripsi & Susunan Acara</label>
                <button 
                  type="button" 
                  onClick={handleGenerateWithAi} 
                  className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200/70 text-[11px] font-black py-1.5 px-3 rounded-full transition-all shrink-0 active:scale-95"
                >
                  {isAiLoading ? (
                    <Sparkles size={13} className="animate-spin text-orange-600" />
                  ) : (
                    <Sparkles size={13} className="text-orange-600 animate-pulse" />
                  )}
                  <span>{isAiLoading ? 'Menyusun Draft...' : 'Bantu Tulis AI Event'}</span>
                </button>
              </div>
              <textarea 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all min-h-[120px] resize-none" 
                rows={5} 
                value={description} 
                onChange={e=>setDescription(e.target.value)} 
                placeholder="Tuliskan tujuan kegiatan, susunan acara, dan imbauan untuk warga..." 
                required
              />
            </div>
            
            <div className="pt-2 border-t border-slate-100">
              <Button type="submit" className="w-full py-3.5 text-xs font-black uppercase tracking-wider rounded-2xl bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20 flex justify-center items-center gap-2 group/submit">
                {editingId ? (
                  <>Simpan Perubahan <CheckCircle2 size={16} className="group-hover/submit:scale-110 transition-transform" /></>
                ) : (
                  <>Terbitkan Agenda Acara <Calendar size={16} className="group-hover/submit:scale-110 transition-transform" /></>
                )}
              </Button>
            </div>
          </form>

          {/* Live Mobile Ticket/Pass Mockup Side */}
          <div className="lg:col-span-5 hidden lg:flex flex-col bg-slate-900 rounded-[2.5rem] p-5 text-white border border-slate-800 shadow-xl justify-between min-h-[500px]">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-orange-400 rounded-full animate-ping" />
                  <span className="text-[10px] font-mono text-orange-400 font-bold uppercase tracking-widest">LIVE EVENT PASS MOCKUP</span>
                </div>
                <Calendar size={15} className="text-orange-400" />
              </div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-3">Tampilan Tiket Undangan Warga:</p>
              
              <div className="bg-white text-slate-900 rounded-3xl p-5 border border-slate-800 shadow-2xl flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-100 text-[8.5px] font-black uppercase tracking-widest rounded-md">
                    {category}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">RT 02 PALU</span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-black text-base text-slate-900 leading-snug">
                    {title || '[Judul Acara RT]'}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">
                    {description || '[Detail agenda & susunan acara akan tampil di sini...]'}
                  </p>
                </div>

                <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl text-[10px] font-bold text-slate-600 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={13} className="text-orange-500 shrink-0" />
                    <span>{date ? new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Tanggal Belum Set'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-amber-500 shrink-0" />
                    <span>Pukul {time || '08:00'} WITA</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-emerald-500 shrink-0" />
                    <span>{location || 'Gedung Serbaguna RT 02'}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[9px] font-extrabold text-slate-400 border-t border-slate-100">
                  <span>PANITIA: {organizer || 'RT 02'}</span>
                  <span className="text-orange-600 uppercase">DRESSCODE: {dresscode}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[9.5px] text-slate-400 font-medium text-center leading-normal">
              Agenda acara otomatis disinkronkan ke kalender kegiatan seluruh warga RT 02.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
