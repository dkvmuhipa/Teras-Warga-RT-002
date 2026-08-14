import React, { useState } from 'react';
import { FAQItem } from '../../types';
import { Plus, Edit2, Trash2, HelpCircle, Save, X, Download, Search, Sparkles, CheckCircle2, ChevronDown, ChevronUp, Share2, MessageCircle, BookOpen, Tag } from 'lucide-react';
import { addFAQToDb, updateFAQInDb, deleteFAQFromDb, handleFirestoreError, OperationType } from '../../services/databaseService';
import { generateAnnouncementDraft } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { toast } from 'sonner';
import { MOCK_FAQ } from '../../constants';
import { useConfirm } from '../../context/ConfirmContext';
import { motion, AnimatePresence } from 'motion/react';

interface FAQManagementProps {
  faqItems: FAQItem[];
}

const CATEGORIES = [
  { value: 'layanan', label: 'Layanan & Administrasi', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'iuran', label: 'Keuangan & Iuran', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'keamanan', label: 'Keamanan & Ronda', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'lingkungan', label: 'Lingkungan & Sampah', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { value: 'sosial', label: 'Sosial & Kegiatan', color: 'bg-purple-50 text-purple-700 border-purple-200' }
];

export const FAQManagement: React.FC<FAQManagementProps> = ({ faqItems }) => {
  const confirm = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Enhanced Form State
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState<'layanan' | 'iuran' | 'keamanan' | 'lingkungan' | 'sosial'>('layanan');
  const [keywords, setKeywords] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const resetForm = () => {
    setQuestion('');
    setAnswer('');
    setCategory('layanan');
    setKeywords('');
    setIsPopular(false);
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: FAQItem) => {
    setQuestion(item.question);
    setAnswer(item.answer);
    setCategory(item.category || 'layanan');
    setKeywords(item.keywords ? item.keywords.join(', ') : '');
    setIsPopular(item.isPopular ?? false);
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleGenerateWithAi = async () => {
    if (!question) return toast.error('Masukkan topik pertanyaan warga terlebih dahulu');
    setIsAiLoading(true);
    try {
      const prompt = `Pertanyaan Warga RT: ${question}, Kategori: ${category}`;
      const draft = await generateAnnouncementDraft(prompt, 'FAQ');
      setAnswer(draft);
      toast.success('Jawaban panduan santun AI berhasil di-formulasikan!');
    } catch (error) {
      toast.error('Gagal menyusun jawaban AI.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleImportDefaults = async () => {
    const isConfirmed = await confirm({
      title: 'Impor FAQ Default TERAS',
      message: 'Apakah Anda yakin ingin mengimpor FAQ standar? Ini akan memuat 16 FAQ panduan lengkap ke dalam database.',
      confirmLabel: 'Impor',
      isDanger: false
    });

    if (isConfirmed) {
      setIsImporting(true);
      try {
        let importedCount = 0;
        for (const faq of MOCK_FAQ) {
          if (!faqItems.some(f => f.question.trim().toLowerCase() === faq.question.trim().toLowerCase())) {
            const { id, ...data } = faq;
            await addFAQToDb(data);
            importedCount++;
          }
        }
        if (importedCount > 0) {
          toast.success(`${importedCount} FAQ default berhasil diimpor!`);
        } else {
          toast.info('Semua FAQ default sudah ada di dalam database.');
        }
      } catch (error) {
        console.error(error);
        toast.error('Gagal mengimpor FAQ default.');
      } finally {
        setIsImporting(false);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      toast.error('Pertanyaan dan jawaban tidak boleh kosong!');
      return;
    }

    try {
      const data = { 
        question: question.trim(), 
        answer: answer.trim(), 
        category,
        keywords: keywords.split(',').map(s => s.trim()).filter(s => s !== ''),
        isPopular
      };
      
      if (editingId) {
        await updateFAQInDb(editingId, data);
        toast.success('FAQ Panduan berhasil diperbarui!');
      } else {
        await addFAQToDb(data);
        toast.success('FAQ Panduan baru berhasil ditambahkan!');
      }
      
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, "faq");
      toast.error('Gagal menyimpan FAQ.');
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus FAQ',
      message: 'Apakah Anda yakin ingin menghapus panduan FAQ ini secara permanen?',
      confirmLabel: 'Hapus Permanen',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await deleteFAQFromDb(id);
        toast.success('FAQ berhasil dihapus.');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `faq/${id}`);
        toast.error('Gagal menghapus FAQ.');
      }
    }
  };

  const handleShareWa = (item: FAQItem) => {
    const text = `*PANDUAN INFORMASI RT 02 PALU*\n\n❓ *Q:* ${item.question}\n\n💡 *A:* ${item.answer}\n\n_Pusat Layanan Warga Teras RT 02_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getCategoryBadge = (cat?: string) => {
    const matched = CATEGORIES.find(c => c.value === cat);
    return {
      label: matched ? matched.label : 'Umum',
      colorClass: matched ? matched.color : 'bg-slate-50 text-slate-600 border-slate-200'
    };
  };

  const filteredFaqItems = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.keywords && item.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Title Header with Executive Badge */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-teal-600 rounded-full"></div>
            <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Pusat Informasi & Bantuan Warga</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">FAQ & Helpdesk RT 02</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Koleksi jawaban resmi tata cara perizinan, iuran, ronda, dan aturan lingkungan.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={handleImportDefaults} 
            disabled={isImporting}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 justify-center rounded-2xl text-xs font-black uppercase tracking-wider py-3.5"
          >
            <Download size={16} className="mr-2" /> 
            {isImporting ? 'Mengimpor...' : 'Impor 16 FAQ TERAS'}
          </Button>
          <Button 
            onClick={handleOpenAdd} 
            className="w-full sm:w-auto px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-teal-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Tambah FAQ Baru
          </Button>
        </div>
      </div>

      {/* Search & Categories Filter Bar */}
      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-xs space-y-4">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Cari pertanyaan, panduan iuran, atau kata kunci..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:bg-white focus:border-teal-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={18} />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Semua ({faqItems.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = faqItems.filter(f => f.category === cat.value).length;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                  selectedCategory === cat.value
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.label.split(' & ')[0]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Accordion FAQ Grid */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredFaqItems.map((item) => {
            const badge = getCategoryBadge(item.category);
            const isExpanded = expandedId === item.id;

            return (
              <motion.div 
                key={item.id} 
                layout
                className="bg-white rounded-[2rem] border border-slate-100 shadow-xs overflow-hidden hover:border-teal-200 transition-all"
              >
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-6 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                      <HelpCircle size={20} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-widest border ${badge.colorClass}`}>
                          {badge.label}
                        </span>
                        {item.keywords && item.keywords.map((kw, i) => (
                          <span key={i} className="text-[9px] font-medium text-slate-400">
                            #{kw}
                          </span>
                        ))}
                      </div>
                      <h4 className="font-black text-slate-900 text-base leading-snug">{item.question}</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleShareWa(item); }}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                      title="Bagi Jawaban via WhatsApp"
                    >
                      <Share2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }}
                      className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
                      title="Edit FAQ"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Hapus FAQ"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="p-2 text-slate-400">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-6 pt-0 border-t border-slate-50 bg-slate-50/40 text-slate-700 text-sm font-medium leading-relaxed whitespace-pre-line"
                  >
                    <div className="p-4 bg-white rounded-2xl border border-slate-100 mt-4 shadow-xs">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredFaqItems.length === 0 && (
          <div className="py-16 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <HelpCircle size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-bold text-base">Belum ada panduan FAQ yang ditemukan.</p>
            <p className="text-slate-400 text-xs mt-1">Klik "Tambah FAQ Baru" atau "Impor 16 FAQ TERAS" untuk menambah panduan warga.</p>
          </div>
        )}
      </div>

      {/* Enhanced Add/Edit FAQ Modal (Max-W-5XL Split View Layout) */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Edit Panduan FAQ Warga" : "Buat Panduan FAQ Baru"}
        maxWidth="max-w-5xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Input Side */}
          <form onSubmit={handleSave} className="lg:col-span-7 space-y-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Kategori Informasi</label>
              <select
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all cursor-pointer"
                value={category}
                onChange={e => setCategory(e.target.value as any)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Pertanyaan Warga (Question)</label>
              <input 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all" 
                value={question} 
                onChange={e => setQuestion(e.target.value)} 
                placeholder="Contoh: Bagaimana prosedur pembuatan Surat Pengantar RT?"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Kata Kunci / Tag Pencarian (Dipisahkan Koma)</label>
              <input 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all" 
                value={keywords} 
                onChange={e => setKeywords(e.target.value)} 
                placeholder="Contoh: surat, pengantar, iuran, domisili" 
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Jawaban Panduan Resmi & Terperinci</label>
                <button 
                  type="button" 
                  onClick={handleGenerateWithAi} 
                  className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200/70 text-[11px] font-black py-1.5 px-3 rounded-full transition-all shrink-0 active:scale-95"
                >
                  {isAiLoading ? (
                    <Sparkles size={13} className="animate-spin text-teal-600" />
                  ) : (
                    <Sparkles size={13} className="text-teal-600 animate-pulse" />
                  )}
                  <span>{isAiLoading ? 'Formulasi AI...' : 'Bantu Tulis AI Formulator'}</span>
                </button>
              </div>
              <textarea 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all min-h-[140px] resize-none leading-relaxed" 
                rows={6} 
                value={answer} 
                onChange={e => setAnswer(e.target.value)} 
                placeholder="Tuliskan langkah-langkah, syarat dokumen, dan panduan lengkap di sini..."
                required
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <Button type="submit" className="w-full py-3.5 text-xs font-black uppercase tracking-wider rounded-2xl bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 flex justify-center items-center gap-2 group/submit">
                {editingId ? (
                  <>Simpan Perubahan FAQ <CheckCircle2 size={16} className="group-hover/submit:scale-110 transition-transform" /></>
                ) : (
                  <>Terbitkan Panduan FAQ <BookOpen size={16} className="group-hover/submit:scale-110 transition-transform" /></>
                )}
              </Button>
            </div>
          </form>

          {/* Live Mobile Knowledge Base Mockup Side */}
          <div className="lg:col-span-5 hidden lg:flex flex-col bg-slate-900 rounded-[2.5rem] p-5 text-white border border-slate-800 shadow-xl justify-between min-h-[500px]">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-teal-400 rounded-full animate-ping" />
                  <span className="text-[10px] font-mono text-teal-400 font-bold uppercase tracking-widest">LIVE KNOWLEDGE BASE MOCKUP</span>
                </div>
                <HelpCircle size={15} className="text-teal-400" />
              </div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-3">Tampilan Panduan di Aplikasi Warga:</p>
              
              <div className="bg-white text-slate-900 rounded-3xl p-5 border border-slate-800 shadow-2xl flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-100 text-[8.5px] font-black uppercase tracking-widest rounded-md">
                    {category}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">PANDUAN RT 02</span>
                </div>

                <div className="space-y-2">
                  <h4 className="font-black text-sm text-slate-900 leading-snug">
                    {question || '[Pertanyaan Warga RT]'}
                  </h4>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed font-medium">
                    {answer || '[Jawaban lengkap dan panduan terperinci akan tampil di sini...]'}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[9px] font-bold text-slate-400 border-t border-slate-100">
                  <span>PUSAT HELPDESK 24/7</span>
                  <span className="text-teal-600">TERVERIFIKASI PENGURUS ✓</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[9.5px] text-slate-400 font-medium text-center leading-normal">
              FAQ otomatis dapat diakses warga melalui Pusat Bantuan di aplikasi Teras Warga RT 02.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
