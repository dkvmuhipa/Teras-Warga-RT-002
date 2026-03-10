import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Search, Filter, Upload, X, Clock, User, Download, FileArchive, FileCode, FileSpreadsheet, File as FileIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Document } from '../../types';
import { subscribeToDocuments, addDocumentToDb, deleteDocumentFromDb, uploadImageToStorage } from '../../services/databaseService';
import { toast } from 'react-hot-toast';

interface DocumentManagerProps {
  documents: Document[];
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ documents }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'All' | Document['category']>('All');
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [newDoc, setNewDoc] = useState<Partial<Document>>({
    title: '',
    category: 'Aturan',
    url: '',
    uploadDate: new Date().toISOString(),
    uploadedBy: 'Admin RT'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.title || !selectedFile) {
      toast.error('Judul dan file wajib diisi');
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const url = await uploadImageToStorage(selectedFile, `documents/${fileName}`);
      
      await addDocumentToDb({
        ...newDoc,
        url,
        uploadDate: new Date().toISOString(),
        uploadedBy: 'Admin RT'
      });

      toast.success('Dokumen berhasil diunggah');
      setIsAdding(false);
      setNewDoc({ title: '', category: 'Aturan', url: '' });
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengunggah dokumen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus dokumen ini?')) {
      try {
        await deleteDocumentFromDb(id);
        toast.success('Dokumen dihapus');
      } catch (error) {
        toast.error('Gagal menghapus dokumen');
      }
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="text-rose-500" size={24} />;
    if (['doc', 'docx'].includes(ext || '')) return <FileIcon className="text-blue-500" size={24} />;
    if (['xls', 'xlsx'].includes(ext || '')) return <FileSpreadsheet className="text-emerald-500" size={24} />;
    if (['zip', 'rar'].includes(ext || '')) return <FileArchive className="text-amber-500" size={24} />;
    return <FileIcon className="text-slate-400" size={24} />;
  };

  return (
    <div className="p-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pusat Dokumen</h1>
          <p className="text-slate-500 font-medium">Kelola dokumen publik, aturan, dan formulir RT.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus size={18} /> Unggah Dokumen
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari dokumen..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
          {(['All', 'SK RT', 'Aturan', 'Formulir', 'Lainnya'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`
                px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                ${filterCategory === cat 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'}
              `}
            >
              {cat === 'All' ? 'Semua' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredDocs.map((doc) => (
              <motion.div
                key={doc.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative"
              >
                <div className="flex items-start gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                    {getFileIcon(doc.url)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-widest rounded">
                        {doc.category}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-800 mb-1 line-clamp-1">
                      {doc.title}
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(doc.uploadDate).toLocaleDateString('id-ID')}</span>
                      <span className="flex items-center gap-1"><User size={12} /> {doc.uploadedBy}</span>
                    </div>
                  </div>
                </div>
                
                  <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-50">
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      <Download size={14} /> Lihat
                    </a>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isUploading && setIsAdding(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Unggah Dokumen Baru</h2>
                  <button 
                    onClick={() => !isUploading && setIsAdding(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Judul Dokumen</label>
                    <input
                      type="text"
                      required
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      placeholder="Contoh: Tata Tertib Lingkungan 2026"
                      value={newDoc.title}
                      onChange={(e) => setNewDoc({...newDoc, title: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kategori</label>
                    <select
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      value={newDoc.category}
                      onChange={(e) => setNewDoc({...newDoc, category: e.target.value as any})}
                    >
                      <option value="SK RT">SK RT</option>
                      <option value="Aturan">Aturan</option>
                      <option value="Formulir">Formulir</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pilih File</label>
                    <div className="relative group">
                      <input
                        type="file"
                        required
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className={`
                        flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all
                        ${selectedFile ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-slate-50 group-hover:border-indigo-300 group-hover:bg-indigo-50/10'}
                      `}>
                        <Upload className={selectedFile ? 'text-indigo-600' : 'text-slate-300'} size={32} />
                        <p className="mt-3 text-xs font-black text-slate-600 uppercase tracking-widest">
                          {selectedFile ? selectedFile.name : 'Klik atau seret file ke sini'}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400 font-medium">PDF, Word, Excel, ZIP (Maks 10MB)</p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Mengunggah...
                      </>
                    ) : (
                      <>
                        <Upload size={18} /> Simpan & Publikasikan
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
