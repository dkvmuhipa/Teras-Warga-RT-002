import React, { useState } from 'react';
import { Plus, Trash2, BookOpen, Calendar, Edit2, MessageCircle, Sparkles, Image as ImageIcon } from 'lucide-react';
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
        <form onSubmit={handleSaveNews} className="space-y-5">
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Judul Berita</label>
            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Contoh: Suksesnya Acara Kerja Bakti" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Kategori</label>
            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={category} onChange={e=>setCategory(e.target.value as any)}>
              <option value="Kegiatan">Kegiatan</option>
              <option value="Pengumuman">Pengumuman</option>
              <option value="Warga">Warga</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Gambar Berita</label>
            <div className="relative h-40 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-400 transition-all">
              {image ? (
                <img src={image} className="h-full w-full object-cover" />
              ) : (
                <div className="text-slate-400 flex flex-col items-center">
                  <ImageIcon size={24} />
                  <span className="text-xs font-bold mt-2">Pilih Gambar</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Isi Berita</label>
            <Button type="button" onClick={handleGenerateWithAi} className="mb-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shadow-none text-xs py-2 px-3">
              <Sparkles size={14} className="mr-2" /> {isAiLoading ? 'Memproses...' : 'Buat dengan AI'}
            </Button>
            <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all min-h-[120px]" rows={4} value={content} onChange={e=>setContent(e.target.value)} placeholder="Tulis isi berita di sini..." />
          </div>
          <Button type="submit" className="w-full py-3.5 text-sm shadow-xl shadow-indigo-200 mt-2">
            {editingId ? 'Simpan Perubahan' : 'Terbitkan Berita'}
          </Button>
        </form>
      </Modal>
    </motion.div>
  );
};
