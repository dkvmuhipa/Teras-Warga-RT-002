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
  
  // Enhanced Form State
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [author, setAuthor] = useState('Humas RT 02');
  const [location, setLocation] = useState('Wilayah RT 02 Palu');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState<'Kegiatan' | 'Pengumuman' | 'Warga' | 'Lainnya'>('Kegiatan');
  const [aiTone, setAiTone] = useState<'Jurnalistik' | 'Resmi' | 'Santai'>('Jurnalistik');
  const [isBroadcast, setIsBroadcast] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const filteredNews = news.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.author && item.author.toLowerCase().includes(searchTerm.toLowerCase()))
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
    try {
      const promptTitle = `${title} (${location ? 'Lokasi: ' + location : ''}) [Gaya: ${aiTone}]`;
      const draft = await generateAnnouncementDraft(promptTitle, 'Jurnalistik');
      setContent(draft);
      if (!excerpt) {
        setExcerpt(draft.slice(0, 120) + '...');
      }
      toast.success('Draft artikel jurnalistik berhasil disusun!');
    } catch (error) {
      toast.error('Gagal menyusun draft artikel AI.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const resetForms = () => {
    setTitle('');
    setExcerpt('');
    setAuthor('Humas RT 02');
    setLocation('Wilayah RT 02 Palu');
    setContent('');
    setImage('');
    setCategory('Kegiatan');
    setAiTone('Jurnalistik');
    setIsBroadcast(true);
    setEditingId(null);
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newsData = {
        title,
        content,
        excerpt: excerpt || content.slice(0, 120) + '...',
        author: author || 'Humas RT 02',
        location: location || 'Wilayah RT 02 Palu',
        image,
        category,
        isBroadcast
      };

      if (editingId) {
        await updateNewsInDb(editingId, newsData);
        toast.success('Berita RT berhasil diperbarui!');
      } else {
        await addNewsToDb({
          ...newsData,
          date: new Date().toISOString(),
        });
        toast.success('Berita RT berhasil diterbitkan!');
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
    setExcerpt(item.excerpt || '');
    setAuthor(item.author || 'Humas RT 02');
    setLocation(item.location || 'Wilayah RT 02 Palu');
    setContent(item.content);
    setImage(item.image || '');
    setCategory(item.category || 'Kegiatan');
    setIsBroadcast(item.isBroadcast ?? true);
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
      className="space-y-6"
    >
      {/* Title Header with Executive Badge */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-emerald-600 rounded-full"></div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Kanal Jurnalistik Lingkungan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">Berita & Artikel RT 02</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Pengelolaan warta jurnalistik, liputan dokumentasi kegiatan warga, dan kabar lingkungan.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            onClick={() => { resetForms(); setIsModalOpen(true); }} 
            className="w-full md:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Buat Berita Baru
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-xs">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Cari judul berita, penulis, atau kata kunci artikel..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
        </div>
      </div>

      {/* News Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredNews.map((item: News) => (
            <motion.div 
              key={item.id} 
              variants={itemVariants}
              layout
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xs hover:shadow-xl hover:shadow-emerald-100/30 transition-all group overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail Image Header */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-emerald-50/50 text-slate-300">
                      <BookOpen size={40} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">Tanpa Gambar Sampul</span>
                    </div>
                  )}

                  <span className="absolute top-4 left-4 px-3 py-1 bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-xl border border-white/20">
                    {item.category || 'Berita'}
                  </span>

                  {item.location && (
                    <span className="absolute bottom-3 left-4 px-2.5 py-0.5 bg-emerald-600/90 backdrop-blur-xs text-white text-[8.5px] font-black rounded-md flex items-center gap-1">
                      📍 {item.location}
                    </span>
                  )}
                </div>

                {/* Content Body */}
                <div className="p-6 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(item.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span>✍️ {item.author || 'Humas RT'}</span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium line-clamp-3 leading-relaxed">
                    {item.excerpt || item.content}
                  </p>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-6 pt-0 flex items-center justify-between border-t border-slate-50 mt-4">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">RT 02 PALU</span>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => handleEdit(item)} 
                    className="p-2.5 bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all"
                    title="Edit Berita"
                  >
                    <Edit2 size={16}/>
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleDeleteNews(item.id)} 
                    className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-all"
                    title="Hapus Berita"
                  >
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredNews.length === 0 && (
          <div className="col-span-full py-16 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-xs">
              <BookOpen size={40} />
            </div>
            <p className="text-slate-400 font-bold text-lg">Belum ada berita yang diterbitkan.</p>
            <p className="text-slate-400 text-xs mt-1">Klik "Buat Berita Baru" untuk menerbitkan artikel pertama warga.</p>
          </div>
        )}
      </div>

      {/* Modal Buat / Edit Berita (Enhanced Max-W-5XL Layout) */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Edit Artikel Berita" : "Buat Artikel Berita Baru"}
        maxWidth="max-w-5xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Input Side */}
          <form onSubmit={handleSaveNews} className="lg:col-span-7 space-y-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Judul Berita / Liputan</label>
              <input 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all" 
                value={title} 
                onChange={e=>setTitle(e.target.value)} 
                placeholder="Contoh: Gebyar Kemerdekaan RT 02 Tahun 2026..." 
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Penulis / Reporter</label>
                <input 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all" 
                  value={author} 
                  onChange={e=>setAuthor(e.target.value)} 
                  placeholder="Nama Penulis / Humas..." 
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Lokasi Liputan</label>
                <input 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all" 
                  value={location} 
                  onChange={e=>setLocation(e.target.value)} 
                  placeholder="Contoh: Gedung Serbaguna RT 02..." 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Kategori Berita</label>
                <select 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all cursor-pointer" 
                  value={category} 
                  onChange={e=>setCategory(e.target.value as any)}
                >
                  <option value="Kegiatan">🗓️ Kegiatan Warga</option>
                  <option value="Pengumuman">📢 Pengumuman</option>
                  <option value="Warga">👤 Info Warga</option>
                  <option value="Lainnya">📌 Lainnya</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Gaya AI (Tone Preset)</label>
                <select 
                  className="w-full p-3.5 bg-indigo-50/70 border border-indigo-200/70 rounded-2xl text-xs font-bold text-indigo-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all cursor-pointer" 
                  value={aiTone} 
                  onChange={e=>setAiTone(e.target.value as any)}
                >
                  <option value="Jurnalistik">📰 Jurnalistik / Berita Resmi</option>
                  <option value="Resmi">📜 Himbauan / Undangan Resmi</option>
                  <option value="Santai">🎉 Santai / Komunitas Warga</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Ringkasan Berita (Excerpt / Sub-Judul)</label>
              <input 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all" 
                value={excerpt} 
                onChange={e=>setExcerpt(e.target.value)} 
                placeholder="Ringkasan 1-2 kalimat untuk preview di kartu berita & WhatsApp..." 
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Sampul / Thumbnail Foto Berita</label>
              <div className="relative h-36 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-emerald-400 hover:bg-slate-100/80 transition-all group">
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
                  <div className="text-slate-400 flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-1.5 shadow-xs border border-slate-100 text-emerald-500 group-hover:scale-110 transition-transform">
                      <ImageIcon size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Pilih Gambar Sampul</span>
                    <span className="text-[9px] text-slate-400">JPG, PNG, WEBP (Max 2MB)</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Isi & Konten Artikel Berita</label>
                <button 
                  type="button" 
                  onClick={handleGenerateWithAi} 
                  className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/70 text-[11px] font-black py-1.5 px-3 rounded-full transition-all shrink-0 active:scale-95"
                >
                  {isAiLoading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Sparkles size={13} className="text-emerald-600 animate-pulse" />
                  )}
                  <span>{isAiLoading ? 'Menyusun Draft...' : 'Bantu Tulis Jurnalistik AI'}</span>
                </button>
              </div>
              <textarea 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all min-h-[120px] resize-none" 
                rows={5} 
                value={content} 
                onChange={e=>setContent(e.target.value)} 
                placeholder="Tuliskan isi artikel berita secara lengkap di sini..." 
                required
              />
            </div>
            
            <div className="pt-2 border-t border-slate-100">
              <Button type="submit" className="w-full py-3.5 text-xs font-black uppercase tracking-wider rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 flex justify-center items-center gap-2 group/submit">
                {editingId ? (
                  <>Simpan Perubahan <CheckCircle2 size={16} className="group-hover/submit:scale-110 transition-transform" /></>
                ) : (
                  <>Terbitkan Artikel Berita <BookOpen size={16} className="group-hover/submit:scale-110 transition-transform" /></>
                )}
              </Button>
            </div>
          </form>

          {/* Live Mobile Card Preview Side */}
          <div className="lg:col-span-5 hidden lg:flex flex-col bg-slate-900 rounded-[2.5rem] p-5 text-white border border-slate-800 shadow-xl justify-between min-h-[500px]">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest">LIVE ARTICLE MOCKUP</span>
                </div>
                <BookOpen size={15} className="text-emerald-400" />
              </div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-3">Tampilan Berita di Layar Warga:</p>
              
              <div className="bg-white text-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between">
                <div className="relative h-40 bg-slate-100">
                  {image ? (
                    <img src={image} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <BookOpen size={36} />
                      <span className="text-[9px] font-bold text-slate-400 mt-1">Pratinjau Sampul</span>
                    </div>
                  )}
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 bg-slate-900/80 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest rounded-lg">
                    {category}
                  </span>
                  {location && (
                    <span className="absolute bottom-2.5 left-3 px-2 py-0.5 bg-emerald-600 text-white text-[8px] font-bold rounded-md">
                      📍 {location}
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold">
                    <span>📅 {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>✍️ {author || 'Humas RT'}</span>
                  </div>
                  <h4 className="font-black text-sm text-slate-900 leading-snug line-clamp-2">
                    {title || '[Judul Berita RT]'}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">
                    {excerpt || content || '[Ringkasan isi artikel berita akan tampil di sini...]'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400">
                  <span>RT 02 PALU MEDIA</span>
                  <span className="text-emerald-600">BACA SELENGKAPNYA →</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[9.5px] text-slate-400 font-medium text-center leading-normal">
              Artikel akan otomatis langsung tampil secara real-time pada aplikasi seluruh warga RT 02.
            </div>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};
