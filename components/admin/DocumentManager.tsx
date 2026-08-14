import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Search, Filter, Upload, X, Clock, User, Download, FileArchive, FileCode, FileSpreadsheet, File as FileIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Document } from '../../types';
import { subscribeToDocuments, addDocumentToDb, deleteDocumentFromDb, uploadImageToStorage, handleFirestoreError, OperationType } from '../../services/databaseService';
import { toast } from 'sonner';
import { useConfirm } from '../../context/ConfirmContext';

interface DocumentManagerProps {
  documents: Document[];
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ documents }) => {
  const confirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'All' | Document['category']>('All');
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'file' | 'url'>('file');

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
    if (!newDoc.title || (uploadType === 'file' && !selectedFile) || (uploadType === 'url' && !newDoc.url)) {
      toast.error('Judul dan file/URL wajib diisi');
      return;
    }

    setIsUploading(true);
    try {
      let url = newDoc.url || '';
      
      if (uploadType === 'file' && selectedFile) {
        const fileName = `${Date.now()}_${selectedFile.name}`;
        url = await uploadImageToStorage(selectedFile, `documents/${fileName}`);
      }
      
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
      handleFirestoreError(error, OperationType.CREATE, "documents");
      toast.error('Gagal mengunggah dokumen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Dokumen',
      message: 'Apakah Anda yakin ingin menghapus dokumen ini?',
      confirmLabel: 'Hapus',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await deleteDocumentFromDb(id);
        toast.success('Dokumen dihapus');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `documents/${id}`);
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
    <div className="p-4 sm:p-6 font-sans space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-indigo-600 rounded-full"></div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Pusat Arsip Digital</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">Arsip Dokumen RT 02</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Pengelolaan regulasi resmi, SK kepengurusan, aturan lingkungan, dan formulir pelayanan.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
        >
          <Plus size={18} /> Unggah Dokumen
        </button>
      </div>

      {/* 2. Live Document Statistics Bento Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/40 p-5 rounded-3xl border border-indigo-200/50 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-white text-indigo-600 rounded-2xl shadow-xs shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-indigo-600 uppercase tracking-wider">Total Dokumen</p>
            <h4 className="text-xl font-black text-slate-900 leading-none mt-1">{documents.length} File</h4>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100/40 p-5 rounded-3xl border border-amber-200/50 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-white text-amber-600 rounded-2xl shadow-xs shrink-0">
            <FileCode size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-amber-600 uppercase tracking-wider">SK RT & Kebijakan</p>
            <h4 className="text-xl font-black text-slate-900 leading-none mt-1">{documents.filter(d => d.category === 'SK RT').length} Berkas</h4>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/40 p-5 rounded-3xl border border-emerald-200/50 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-white text-emerald-600 rounded-2xl shadow-xs shrink-0">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Aturan Lingkungan</p>
            <h4 className="text-xl font-black text-slate-900 leading-none mt-1">{documents.filter(d => d.category === 'Aturan').length} Dokumen</h4>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100/40 p-5 rounded-3xl border border-purple-200/50 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-white text-purple-600 rounded-2xl shadow-xs shrink-0">
            <FileArchive size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-purple-600 uppercase tracking-wider">Formulir Publik</p>
            <h4 className="text-xl font-black text-slate-900 leading-none mt-1">{documents.filter(d => d.category === 'Formulir').length} Template</h4>
          </div>
        </div>
      </div>

      {/* 4. Filters & Glassmorphic Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-xs">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Cari judul dokumen atau regulasi..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 max-w-full overflow-x-auto no-scrollbar shadow-inner">
          <div className="flex items-center gap-1 min-w-max">
            {(['All', 'SK RT', 'Aturan', 'Formulir', 'Lainnya'] as const).map((cat) => {
              const count = cat === 'All' ? documents.length : documents.filter(d => d.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`
                    px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5
                    ${filterCategory === cat 
                      ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}
                  `}
                >
                  <span>{cat === 'All' ? 'Semua' : cat}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${filterCategory === cat ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/70 text-slate-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredDocs.map((doc) => {
            const ext = doc.url ? doc.url.split('.').pop()?.split('?')[0].toUpperCase() : 'PDF';
            return (
              <motion.div
                key={doc.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xs hover:shadow-xl hover:shadow-indigo-100/40 transition-all group relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors shrink-0 relative">
                      {getFileIcon(doc.url)}
                      {/* 1. Extension Badge */}
                      <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black uppercase tracking-wider">
                        {ext}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-black uppercase tracking-widest rounded-md">
                          {doc.category}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 mb-1 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {doc.title}
                      </h3>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold mt-2">
                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(doc.uploadDate).toLocaleDateString('id-ID')}</span>
                        <span className="flex items-center gap-1"><User size={12} /> {doc.uploadedBy}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100">
                  <a 
                    href={doc.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xs"
                  >
                    <Download size={14} /> Lihat Dokumen
                  </a>

                  {/* 3. Direct Share to WhatsApp Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const shareText = `*ARSIP DOKUMEN RESMI RT 02 PALU* 📑\n\n*Judul:* ${doc.title}\n*Kategori:* ${doc.category}\n*Tanggal Muka:* ${new Date(doc.uploadDate).toLocaleDateString('id-ID')}\n\nSilakan unduh atau baca dokumen resmi melalui tautan berikut:\n${doc.url}\n\n_Hormat kami,\nPengurus RT 02 Palu_`;
                      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
                      window.open(waUrl, '_blank');
                    }}
                    className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200/60 rounded-xl transition-all"
                    title="Bagikan ke WhatsApp Warga"
                  >
                    <FileText size={16} className="text-emerald-600" />
                  </button>

                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/60 rounded-xl transition-all"
                    title="Hapus Dokumen"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
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

                  <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-2">
                    <button 
                      type="button" 
                      onClick={() => setUploadType('file')} 
                      className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${uploadType === 'file' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                    >
                      Upload File
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setUploadType('url')} 
                      className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${uploadType === 'url' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                    >
                      Link URL
                    </button>
                  </div>

                  {uploadType === 'file' ? (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pilih File</label>
                      <div className="relative group">
                        <input
                          type="file"
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
                  ) : (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Link URL Dokumen</label>
                      <input
                        type="url"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        placeholder="https://..."
                        value={newDoc.url}
                        onChange={(e) => setNewDoc({...newDoc, url: e.target.value})}
                      />
                    </div>
                  )}

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
