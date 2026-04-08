import React, { useState } from 'react';
import { FAQItem } from '../../types';
import { Plus, Edit2, Trash2, HelpCircle, Save, X, Download } from 'lucide-react';
import { addFAQToDb, updateFAQInDb, deleteFAQFromDb, handleFirestoreError, OperationType } from '../../services/databaseService';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { toast } from 'sonner';
import { MOCK_FAQ } from '../../constants';

interface FAQManagementProps {
  faqItems: FAQItem[];
}

export const FAQManagement: React.FC<FAQManagementProps> = ({ faqItems }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const resetForm = () => {
    setQuestion('');
    setAnswer('');
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: FAQItem) => {
    setQuestion(item.question);
    setAnswer(item.answer);
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleImportDefaults = async () => {
    if (window.confirm('Impor FAQ default? Ini akan menambahkan FAQ standar ke sistem.')) {
      setIsImporting(true);
      try {
        for (const faq of MOCK_FAQ) {
          // Check if already exists by question
          if (!faqItems.some(f => f.question === faq.question)) {
            const { id, ...data } = faq;
            await addFAQToDb(data);
          }
        }
        toast.success('FAQ default berhasil diimpor!');
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
    try {
      const data = { question, answer };
      
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
    if (window.confirm('Hapus FAQ ini?')) {
      try {
        await deleteFAQFromDb(id);
        toast.success('FAQ berhasil dihapus.');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `faq/${id}`);
        toast.error('Gagal menghapus FAQ.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800">Daftar FAQ</h3>
          <p className="text-sm text-slate-500">Kelola tanya jawab umum untuk warga.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleImportDefaults} 
            disabled={isImporting}
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <Download size={18} className="mr-2" /> 
            {isImporting ? 'Mengimpor...' : 'Impor Default'}
          </Button>
          <Button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus size={18} className="mr-2" /> Tambah FAQ
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {faqItems.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start gap-4">
              <div className="flex gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">{item.question}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.answer}</p>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenEdit(item)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {faqItems.length === 0 && (
          <div className="py-12 text-center text-slate-400 italic bg-white rounded-2xl border border-dashed border-slate-200">
            Belum ada data FAQ.
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Edit FAQ" : "Tambah FAQ Baru"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700 uppercase tracking-wider">Pertanyaan</label>
            <input 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
              value={question} 
              onChange={e => setQuestion(e.target.value)} 
              placeholder="Contoh: Bagaimana cara lapor tamu?"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700 uppercase tracking-wider">Jawaban</label>
            <textarea 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[120px]" 
              value={answer} 
              onChange={e => setAnswer(e.target.value)} 
              placeholder="Tuliskan jawaban lengkap di sini..."
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
