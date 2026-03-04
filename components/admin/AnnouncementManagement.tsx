import React, { useState } from 'react';
import { Plus, Trash2, Megaphone, Calendar, AlertCircle, Info, CalendarDays, Edit2 } from 'lucide-react';
import { Announcement } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { addAnnouncementToDb, deleteAnnouncementFromDb, updateAnnouncementInDb } from '../../services/databaseService';
import { motion, AnimatePresence } from 'motion/react';

interface AnnouncementManagementProps {
  announcements: Announcement[];
}

export const AnnouncementManagement: React.FC<AnnouncementManagementProps> = ({ announcements }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState('Info');

  const resetForms = () => {
    setAnnTitle('');
    setAnnContent('');
    setAnnType('Info');
    setEditingId(null);
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateAnnouncementInDb(editingId, {
          title: annTitle,
          content: annContent,
          type: annType as any
        });
        alert('Pengumuman berhasil diperbarui!');
      } else {
        await addAnnouncementToDb({
          title: annTitle,
          content: annContent,
          date: new Date().toISOString(),
          type: annType as any
        });
        alert('Pengumuman berhasil dibuat!');
      }
      setIsModalOpen(false);
      resetForms();
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan pengumuman.');
    }
  };

  const handleEdit = (ann: Announcement) => {
    setEditingId(ann.id);
    setAnnTitle(ann.title);
    setAnnContent(ann.content);
    setAnnType(ann.type);
    setIsModalOpen(true);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (window.confirm('Hapus pengumuman ini?')) {
      try {
        await deleteAnnouncementFromDb(id);
      } catch (error) {
        console.error(error);
        alert('Gagal menghapus pengumuman.');
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Urgent': return <AlertCircle size={16} />;
      case 'Event': return <CalendarDays size={16} />;
      default: return <Info size={16} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Urgent': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Event': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default: return 'bg-sky-50 text-sky-600 border-sky-100';
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pengumuman Warga</h2>
          <p className="text-slate-500 font-medium mt-1">Kelola informasi dan berita untuk warga RT 002.</p>
        </div>
        <Button onClick={() => { resetForms(); setIsModalOpen(true); }} className="shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 shadow-lg transition-all hover:scale-105 active:scale-95">
          <Plus size={18} className="mr-2"/> Buat Pengumuman
        </Button>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {announcements.map((a: Announcement) => (
            <motion.div 
              key={a.id} 
              variants={itemVariants}
              layout
              className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-1.5 h-full ${
                a.type === 'Urgent' ? 'bg-rose-500' : 
                a.type === 'Event' ? 'bg-indigo-500' : 
                'bg-sky-500'
              }`}></div>
              
              <div className="flex flex-col md:flex-row justify-between gap-4 pl-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getTypeColor(a.type)}`}>
                      {getTypeIcon(a.type)}
                      {a.type}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <Calendar size={12} />
                      {new Date(a.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="font-black text-xl text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{a.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{a.content}</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <button 
                    onClick={() => handleEdit(a)} 
                    className="p-3 rounded-xl text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    title="Edit Pengumuman"
                  >
                    <Edit2 size={20}/>
                  </button>
                  <button 
                    onClick={() => handleDeleteAnnouncement(a.id)} 
                    className="p-3 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    title="Hapus Pengumuman"
                  >
                    <Trash2 size={20}/>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {announcements.length === 0 && (
          <motion.div variants={itemVariants} className="py-16 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-sm">
              <Megaphone size={40} />
            </div>
            <p className="text-slate-400 font-bold text-lg">Belum ada pengumuman aktif.</p>
            <p className="text-slate-400 text-sm mt-1">Buat pengumuman baru untuk menginformasikan warga.</p>
          </motion.div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Pengumuman" : "Buat Pengumuman Baru"}>
        <form onSubmit={handleSaveAnnouncement} className="space-y-5">
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Judul Pengumuman</label>
            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={annTitle} onChange={e=>setAnnTitle(e.target.value)} placeholder="Contoh: Kerja Bakti Minggu Ini" required/>
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Isi Pengumuman</label>
            <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all min-h-[120px]" rows={4} value={annContent} onChange={e=>setAnnContent(e.target.value)} placeholder="Tulis detail pengumuman di sini..." required/>
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Tipe / Kategori</label>
            <div className="grid grid-cols-3 gap-3">
              {['Info', 'Urgent', 'Event'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAnnType(type)}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all flex flex-col items-center gap-2 ${
                    annType === type 
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-600 ring-1 ring-indigo-500' 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {getTypeIcon(type)}
                  {type === 'Info' ? 'Info Umum' : type === 'Urgent' ? 'Penting' : 'Kegiatan'}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full py-3.5 text-sm shadow-xl shadow-indigo-200 mt-2">
            {editingId ? 'Simpan Perubahan' : 'Terbitkan Pengumuman'}
          </Button>
        </form>
      </Modal>
    </motion.div>
  );
};
