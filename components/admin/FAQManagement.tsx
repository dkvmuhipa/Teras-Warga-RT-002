import React, { useState } from 'react';
import { FAQItem } from '../../types';
import { Plus, Edit2, Trash2, HelpCircle, Save, X, Download, Search, Filter } from 'lucide-react';
import { addFAQToDb, updateFAQInDb, deleteFAQFromDb, handleFirestoreError, OperationType } from '../../services/databaseService';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { toast } from 'sonner';
import { MOCK_FAQ } from '../../constants';
import { useConfirm } from '../../context/ConfirmContext';

interface FAQManagementProps {
  faqItems: FAQItem[];
}

const CATEGORIES = [
  { value: 'layanan', label: 'Layanan & Administrasi', color: 'bg-sky-50 text-sky-700 border-sky-100' },
  { value: 'iuran', label: 'Keuangan & Iuran', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { value: 'keamanan', label: 'Keamanan & Ronda', color: 'bg-rose-50 text-rose-700 border-rose-100' },
  { value: 'lingkungan', label: 'Lingkungan & Sampah', color: 'bg-teal-50 text-teal-700 border-teal-100' },
  { value: 'sosial', label: 'Sosial & Kegiatan', color: 'bg-purple-50 text-purple-700 border-purple-100' }
];

export const FAQManagement: React.FC<FAQManagementProps> = ({ faqItems }) => {
  const confirm = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState<'layanan' | 'iuran' | 'keamanan' | 'lingkungan' | 'sosial'>('layanan');
  const [isImporting, setIsImporting] = useState(false);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const resetForm = () => {
    setQuestion('');
    setAnswer('');
    setCategory('layanan');
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
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleImportDefaults = async () => {
    const isConfirmed = await confirm({
      title: 'Impor FAQ Default',
      message: 'Apakah Anda yakin ingin mengimpor FAQ default yang sangat lengkap dan detail? Ini akan menambahkan 16 FAQ standar industri TERAS ke dalam sistem.',
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
      toast.error('Koleksi pertanyaan dan jawaban tidak boleh kosong!');
      return;
    }

    try {
      const data = { 
        question: question.trim(), 
        answer: answer.trim(), 
        category 
      };
      
      if (editingId) {
        await updateFAQInDb(editingId, data);
        toast.success('FAQ berhasil diperbarui!');
      } else {
        await addFAQToDb(data);
        toast.success('FAQ berhasil ditambahkan!');
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
      message: 'Apakah Anda yakin ingin menghapus FAQ ini? Tindakan ini permanen.',
      confirmLabel: 'Hapus',
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

  const getCategoryBadge = (cat?: string) => {
    const matched = CATEGORIES.find(c => c.value === cat);
    return {
      label: matched ? matched.label : 'Umum',
      colorClass: matched ? matched.color : 'bg-slate-50 text-slate-600 border-slate-100'
    };
  };

  // Filter Logic
  const filteredFaqItems = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800">Daftar FAQ</h3>
          <p className="text-sm text-slate-500">Kelola tanya jawab umum terperinci untuk kenyamanan warga.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={handleImportDefaults} 
            disabled={isImporting}
            className="border-slate-200 text-slate-600 hover:bg-slate-50 justify-center"
          >
            <Download size={18} className="mr-2" /> 
            {isImporting ? 'Mengimpor...' : 'Impor Default'}
          </Button>
          <Button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-700 justify-center">
            <Plus size={18} className="mr-2" /> Tambah FAQ
          </Button>
        </div>
      </div>

      {/* Search & Categories Filter Controls */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400"
            placeholder="Cari pertanyaan atau jawaban..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Categories Tab Selector */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2 hidden lg:inline">Kategori:</span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border ${
              selectedCategory === 'all'
                ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border ${
                  selectedCategory === cat.value
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat.label.split(' & ')[0]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of items */}
      <div className="grid grid-cols-1 gap-4">
        {filteredFaqItems.map((item) => {
          const badge = getCategoryBadge(item.category);
          return (
            <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 mt-1">
                    <HelpCircle size={20} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${badge.colorClass}`}>
                        {badge.label}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-base">{item.question}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.answer}</p>
                  </div>
                </div>
                <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button 
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Hapus"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredFaqItems.length === 0 && (
          <div className="py-12 text-center text-slate-400 italic bg-white rounded-2xl border border-dashed border-slate-200">
            {faqItems.length === 0 ? 'Belum ada data FAQ.' : 'Tidak ada FAQ yang cocok dengan pencarian / filter Anda.'}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Edit FAQ" : "Tambah FAQ Baru"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700 uppercase tracking-wider">Kategori</label>
            <select
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-800"
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
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700 uppercase tracking-wider">Pertanyaan</label>
            <input 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold" 
              value={question} 
              onChange={e => setQuestion(e.target.value)} 
              placeholder="Contoh: Bagaimana cara lapor tamu?"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700 uppercase tracking-wider">Jawaban Lengkap & Terperinci</label>
            <textarea 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[160px] leading-relaxed" 
              value={answer} 
              onChange={e => setAnswer(e.target.value)} 
              placeholder="Tuliskan jawaban yang detail, lengkap, dan informatif di sini agar mudah dibaca warga..."
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
              Batal
            </Button>
            <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              <Save size={18} className="mr-2" /> Simpan FAQ
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
