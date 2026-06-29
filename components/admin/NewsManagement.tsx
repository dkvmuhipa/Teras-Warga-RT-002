import React, { useState } from 'react';
import { Plus, Trash2, BookOpen, Calendar, Edit2, MessageCircle, Sparkles, Image as ImageIcon, Loader2, CheckCircle2, Megaphone } from 'lucide-react';
import { News } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { addNewsToDb, deleteNewsFromDb, updateNewsInDb, handleFirestoreError, OperationType } from '../../services/databaseService';
import { generateAnnouncementDraft } from '../../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useConfirm } from '../../context/ConfirmContext';

interface NewsManagementProps {
  news: News[];
}

export const NewsManagement: React.FC<NewsManagementProps> = ({ news }) => {
  const confirm = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState<'Kegiatan' | 'Pengumuman' | 'Warga' | 'Lainnya'>('Kegiatan');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const filteredNews = news.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          setImage(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateWithAi = async () => {
    if (!title) return toast.error('Masukkan judul berita terlebih dahulu');
    setIsAiLoading(true);
    const draft = await generateAnnouncementDraft(title, 'Jurnalistik');
    setContent(draft);
    setIsAiLoading(false);
  };

  const resetForms = () => {
    setTitle('');
    setContent('');
    setImage('');
    setCategory('Kegiatan');
    setEditingId(null);
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateNewsInDb(editingId, { title, content, image, category });
        toast.success('Berita berhasil diperbarui!');
      } else {
        await addNewsToDb({
          title,
          content,
          image,
          category,
          date: new Date().toISOString(),
        });
        toast.success('Berita berhasil dibuat!');
      }
      setIsModalOpen(false);
      resetForms();
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, "news");
      toast.error('Gagal menyimpan berita.');
    }
  };

  const handleEdit = (item: News) => {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setImage(item.image || '');
    setCategory(item.category || 'Kegiatan');
    setIsModalOpen(true);
  };

  const handleDeleteNews = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Berita',
      message: 'Apakah Anda yakin ingin menghapus berita ini secara permanen?',
      confirmLabel: 'Hapus',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await deleteNewsFromDb(id);
        toast.success('Berita berhasil dihapus.');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `news/${id}`);
        toast.error('Gagal menghapus berita.');
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

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Berita RT</h2>
          <p className="text-slate-500 font-medium mt-1">Dokumentasi kegiatan dan artikel untuk warga RT 02.</p>
        </div>
        <Button onClick={() => { resetForms(); setIsModalOpen(true); }} className="shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 shadow-lg transition-all hover:scale-105 active:scale-95">
          <Plus size={18} className="mr-2"/> Buat Berita
        </Button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <input 
          type="text" 
          placeholder="Cari berita..." 
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredNews.map((item: News) => (
            <motion.div 
              key={item.id} 
              variants={itemVariants}
              layout
              className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden"
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-600 border-emerald-100">
                      <BookOpen size={16} /> {item.category || 'Berita'}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <Calendar size={12} />
                      {new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="font-black text-xl text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">{item.content}</p>
                  {item.image && (
                    <img src={item.image} alt={item.title} className="w-full h-48 object-cover rounded-2xl" referrerPolicy="no-referrer" />
                  )}
                </div>
                
                <div className="flex items-start gap-2">
                  <button 
                    onClick={() => handleEdit(item)} 
                    className="p-3 rounded-xl text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    title="Edit Berita"
                  >
                    <Edit2 size={20}/>
                  </button>
                  <button 
                    onClick={() => handleDeleteNews(item.id)} 
                    className="p-3 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    title="Hapus Berita"
                  >
                    <Trash2 size={20}/>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredNews.length === 0 && (
          <motion.div key="empty-news" variants={itemVariants} className="py-16 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-sm">
              <BookOpen size={40} />
            </div>
            <p className="text-slate-400 font-bold text-lg">Belum ada berita yang cocok.</p>
            <p className="text-slate-400 text-sm mt-1">Coba ubah kata kunci pencarian.</p>
          </motion.div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Berita" : "Buat Berita Baru"}>
        <form onSubmit={handleSaveNews} className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Judul Berita</label>
            <input 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" 
              value={title} 
              onChange={e=>setTitle(e.target.value)} 
              placeholder="Contoh: Gebyar Kemerdekaan 17 Agustus..." 
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Kategori Berita</label>
              <div className="relative">
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer" 
                  value={category} 
                  onChange={e=>setCategory(e.target.value as any)}
                >
                  <option value="Kegiatan">🗓️ Kegiatan Warga</option>
                  <option value="Pengumuman">📢 Pengumuman</option>
                  <option value="Warga">👤 Info Warga</option>
                  <option value="Lainnya">📌 Lainnya</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Tanggal Publish</label>
              <div className="w-full p-4 bg-slate-100/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 cursor-not-allowed">
                {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Sampul/Thumbnail Berita</label>
            <div className="relative h-48 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-400 hover:bg-slate-100/80 transition-all group">
              {image ? (
                <>
                  <img src={image} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white text-slate-800 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg">
                      <ImageIcon size={14} /> Ganti Gambar
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-slate-400 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100 text-indigo-500 group-hover:scale-110 transition-transform">
                    <ImageIcon size={24} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 mb-1">Pilih Gambar Sampul</span>
                  <span className="text-[10px] text-slate-400">Format: JPG, PNG, WEBP (Max 2MB)</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Isi & Konten Berita</label>
              <Button type="button" onClick={handleGenerateWithAi} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 shadow-none text-[10px] py-1.5 px-3 rounded-full">
                {isAiLoading ? (
                  <Loader2 size={12} className="mr-1.5 animate-spin" />
                ) : (
                  <Sparkles size={12} className="mr-1.5" />
                )}
                {isAiLoading ? 'Menyusun Draft...' : 'Bantu Tulis dengan AI'}
              </Button>
            </div>
            <textarea 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all min-h-[160px] resize-none" 
              rows={6} 
              value={content} 
              onChange={e=>setContent(e.target.value)} 
              placeholder="Tuliskan isi berita secara lengkap di sini..." 
              required
            />
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <Button type="submit" className="w-full py-4 text-sm font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-500/20 flex justify-center items-center gap-2 group/submit">
              {editingId ? (
                <>Simpan Perubahan <CheckCircle2 size={18} className="group-hover/submit:scale-110 transition-transform" /></>
              ) : (
                <>Terbitkan Berita <Megaphone size={18} className="group-hover/submit:scale-110 transition-transform" /></>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};
