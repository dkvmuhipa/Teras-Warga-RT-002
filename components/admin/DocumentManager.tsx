import React, { useState, useRef } from 'react';
import { 
  FileText, Plus, Trash2, Search, Filter, Upload, X, Clock, User, Download, 
  FileArchive, FileCode, FileSpreadsheet, File as FileIcon, FileUp, Hash, 
  Calendar, Lock, Globe, FileCheck, AlertCircle, Info, Sparkles, CheckCircle2, 
  ShieldCheck, Share2, ArrowUpRight, FolderOpen, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Document } from '../../types';
import { addDocumentToDb, deleteDocumentFromDb, uploadImageToStorage, handleFirestoreError, OperationType, getDocumentPreviewUrl } from '../../services/databaseService';
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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const initialDocState: Partial<Document> = {
    title: '',
    category: 'Aturan',
    url: '',
    documentNumber: '',
    description: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    accessLevel: 'Publik',
    uploadDate: new Date().toISOString(),
    uploadedBy: 'Admin RT'
  };

  const [newDoc, setNewDoc] = useState<Partial<Document>>(initialDocState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleFileSelection = (file: File | null) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Ukuran berkas melebihi batas maksimum 15MB');
      return;
    }
    setSelectedFile(file);
    if (!newDoc.title) {
      const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      setNewDoc(prev => ({ ...prev, title: formattedName }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.title?.trim()) {
      toast.error('Judul dokumen wajib diisi');
      return;
    }
    if (uploadType === 'file' && !selectedFile) {
      toast.error('Silakan pilih berkas dokumen yang ingin diunggah');
      return;
    }
    if (uploadType === 'url' && !newDoc.url?.trim()) {
      toast.error('Silakan isi tautan URL dokumen');
      return;
    }

    setIsUploading(true);
    try {
      let finalUrl = newDoc.url?.trim() || '';
      let fileSize = '';
      let fileType = '';

      if (uploadType === 'file' && selectedFile) {
        fileSize = formatBytes(selectedFile.size);
        fileType = selectedFile.name.split('.').pop()?.toUpperCase() || 'FILE';
        const cleanFileName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `documents/${Date.now()}_${cleanFileName}`;
        finalUrl = await uploadImageToStorage(selectedFile, storagePath);
      } else if (uploadType === 'url') {
        fileType = 'URL';
        fileSize = 'Cloud';
      }

      await addDocumentToDb({
        ...newDoc,
        title: newDoc.title.trim(),
        documentNumber: newDoc.documentNumber?.trim() || undefined,
        description: newDoc.description?.trim() || undefined,
        category: newDoc.category || 'Aturan',
        accessLevel: newDoc.accessLevel || 'Publik',
        effectiveDate: newDoc.effectiveDate || new Date().toISOString().split('T')[0],
        url: finalUrl,
        fileSize,
        fileType,
        uploadDate: new Date().toISOString(),
        uploadedBy: 'Admin RT'
      });

      toast.success('Dokumen resmi berhasil diunggah & dipublikasikan');
      setIsAdding(false);
      setNewDoc(initialDocState);
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
      message: 'Apakah Anda yakin ingin menghapus dokumen ini dari arsip RT 02? Tindakan ini tidak dapat dibatalkan.',
      confirmLabel: 'Hapus Dokumen',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await deleteDocumentFromDb(id);
        toast.success('Dokumen berhasil dihapus dari arsip');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `documents/${id}`);
        toast.error('Gagal menghapus dokumen');
      }
    }
  };

  const filteredDocs = documents.filter(doc => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      doc.title.toLowerCase().includes(query) ||
      (doc.documentNumber && doc.documentNumber.toLowerCase().includes(query)) ||
      (doc.description && doc.description.toLowerCase().includes(query));
    const matchesCategory = filterCategory === 'All' || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileBadgeInfo = (url: string) => {
    const ext = url.split('.').pop()?.split('?')[0].toLowerCase() || '';
    if (ext === 'pdf') return { icon: <FileText className="text-rose-500" size={24} />, badge: 'bg-rose-50 text-rose-600 border-rose-100', ext: 'PDF' };
    if (['doc', 'docx'].includes(ext)) return { icon: <FileIcon className="text-blue-500" size={24} />, badge: 'bg-blue-50 text-blue-600 border-blue-100', ext: 'DOCX' };
    if (['xls', 'xlsx'].includes(ext)) return { icon: <FileSpreadsheet className="text-emerald-500" size={24} />, badge: 'bg-emerald-50 text-emerald-600 border-emerald-100', ext: 'XLSX' };
    if (['zip', 'rar', '7z'].includes(ext)) return { icon: <FileArchive className="text-amber-500" size={24} />, badge: 'bg-amber-50 text-amber-600 border-amber-100', ext: 'ZIP' };
    if (url.includes('drive.google') || url.startsWith('http')) return { icon: <Globe className="text-indigo-500" size={24} />, badge: 'bg-indigo-50 text-indigo-600 border-indigo-100', ext: 'CLOUD' };
    return { icon: <FileIcon className="text-slate-400" size={24} />, badge: 'bg-slate-50 text-slate-600 border-slate-100', ext: 'FILE' };
  };

  const getCategoryTheme = (category: Document['category']) => {
    switch (category) {
      case 'SK RT':
        return 'bg-amber-50 text-amber-700 border-amber-200/70';
      case 'Aturan':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/70';
      case 'Formulir':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/70';
      case 'Notulensi':
        return 'bg-purple-50 text-purple-700 border-purple-200/70';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200/70';
    }
  };

  return (
    <div className="p-4 sm:p-6 font-sans space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 sm:p-7 rounded-[2.5rem] border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-indigo-600 rounded-full"></div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Pusat Arsip Digital</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">Arsip Dokumen RT 02</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Pengelolaan regulasi resmi, SK kepengurusan, tata tertib lingkungan, formulir administrasi, dan notulensi musyawarah.
          </p>
        </div>
        <button
          onClick={() => {
            setNewDoc(initialDocState);
            setSelectedFile(null);
            setIsAdding(true);
          }}
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
            <p className="text-[9px] font-black text-purple-600 uppercase tracking-wider">Formulir & Notulensi</p>
            <h4 className="text-xl font-black text-slate-900 leading-none mt-1">
              {documents.filter(d => d.category === 'Formulir' || d.category === 'Notulensi').length} Berkas
            </h4>
          </div>
        </div>
      </div>

      {/* 4. Filters & Glassmorphic Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-xs">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Cari judul dokumen, nomor SK, atau kata kunci..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 max-w-full overflow-x-auto no-scrollbar shadow-inner">
          <div className="flex items-center gap-1 min-w-max">
            {(['All', 'SK RT', 'Aturan', 'Formulir', 'Notulensi', 'Lainnya'] as const).map((cat) => {
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
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${filterCategory === cat ? 'bg-indigo-50 text-indigo-700 font-bold' : 'bg-slate-200/70 text-slate-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredDocs.map((doc) => {
            const badgeInfo = getFileBadgeInfo(doc.url);
            const isInternal = doc.accessLevel === 'Internal';

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
                      {badgeInfo.icon}
                      <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black uppercase tracking-wider">
                        {doc.fileType || badgeInfo.ext}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
                        <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md border ${getCategoryTheme(doc.category)}`}>
                          {doc.category}
                        </span>

                        {isInternal ? (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/60 text-[8px] font-black uppercase tracking-wider rounded-md flex items-center gap-1">
                            <Lock size={10} /> Internal
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[8px] font-black uppercase tracking-wider rounded-md flex items-center gap-1">
                            <Globe size={10} /> Publik
                          </span>
                        )}

                        {doc.fileSize && (
                          <span className="text-[9px] font-semibold text-slate-400">
                            • {doc.fileSize}
                          </span>
                        )}
                      </div>

                      {doc.documentNumber && (
                        <p className="text-[10px] font-mono font-bold text-indigo-600 mb-0.5 tracking-tight flex items-center gap-1">
                          <Hash size={11} className="shrink-0" /> {doc.documentNumber}
                        </p>
                      )}

                      <h3 className="text-base font-black text-slate-900 mb-1 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {doc.title}
                      </h3>

                      {doc.description && (
                        <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-2 leading-relaxed">
                          {doc.description}
                        </p>
                      )}

                      <div className="flex items-center flex-wrap gap-3 text-[10px] text-slate-400 font-bold mt-2 pt-2 border-t border-slate-50">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {new Date(doc.uploadDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={12} /> {doc.uploadedBy || 'Admin RT'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100">
                  <a 
                    href={getDocumentPreviewUrl(doc.url)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xs"
                  >
                    <Download size={14} /> Lihat Dokumen
                  </a>

                  {/* WhatsApp Share Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const numberText = doc.documentNumber ? `\n*No. Berkas:* ${doc.documentNumber}` : '';
                      const descText = doc.description ? `\n*Keterangan:* ${doc.description}` : '';
                      const shareText = `*ARSIP DOKUMEN RESMI RT 02* 📑\n\n*Judul:* ${doc.title}${numberText}\n*Kategori:* ${doc.category}\n*Tanggal Terbit:* ${new Date(doc.uploadDate).toLocaleDateString('id-ID')}${descText}\n\nSilakan unduh atau telaah dokumen resmi melalui tautan berkas:\n${doc.url}\n\n_Hormat kami,\nPengurus RT 02 Palu_`;
                      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
                      window.open(waUrl, '_blank');
                    }}
                    className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200/60 rounded-xl transition-all"
                    title="Bagikan ke WhatsApp Warga"
                  >
                    <Share2 size={16} className="text-emerald-600" />
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

        {filteredDocs.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white rounded-[2.5rem] border border-slate-100 p-8 space-y-4">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto border border-slate-100">
              <FolderOpen size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-800">Tidak Ada Dokumen Ditemukan</h3>
              <p className="text-xs text-slate-400 font-medium">
                {searchQuery ? `Tidak ada dokumen yang cocok dengan kata kunci "${searchQuery}"` : 'Belum ada dokumen yang diunggah dalam kategori ini.'}
              </p>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        )}
      </div>

      {/* Professional Detailed Upload Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isUploading && setIsAdding(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 my-auto z-10 flex flex-col max-h-[92vh]"
            >
              {/* Header */}
              <div className="px-6 sm:px-8 pt-6 sm:pt-7 pb-4 border-b border-slate-100 flex items-start justify-between gap-4 bg-gradient-to-b from-slate-50/70 to-white shrink-0">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-2xl shadow-md shadow-indigo-600/25 shrink-0">
                    <FileUp size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                        Formulir Arsip Resmi
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">RT 02</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                      Unggah Dokumen Baru
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-1 sm:line-clamp-none">
                      Publikasikan SK kepengurusan, aturan lingkungan, blangko formulir, atau notulensi musyawarah.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => !isUploading && setIsAdding(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors shrink-0"
                  disabled={isUploading}
                  aria-label="Tutup Modal"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Form Content (Scrollable) */}
              <form onSubmit={handleUpload} className="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                {/* 1. Judul Dokumen */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <FileText size={13} className="text-indigo-600" />
                      Judul Dokumen Resmi <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[9px] font-semibold text-slate-400">Wajib diisi</span>
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full px-4 sm:px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Misal: Peraturan Bersama Pengelolaan Sampah & Ketertiban Lingkungan 2026"
                    value={newDoc.title}
                    onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  />
                  <p className="text-[10px] text-slate-400 font-medium mt-1.5">
                    Gunakan penamaan yang jelas dan informatif agar mudah dicari oleh warga.
                  </p>
                </div>

                {/* 2. Grid: Nomor Dokumen & Kategori */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nomor Surat / Berkas */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Hash size={13} className="text-indigo-600" />
                        Nomor Surat / SK Dokumen
                      </label>
                      <span className="text-[9px] font-semibold text-slate-400">Opsional</span>
                    </div>
                    <input
                      type="text"
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono"
                      placeholder="Misal: 004/SK-RT02/X/2026"
                      value={newDoc.documentNumber || ''}
                      onChange={(e) => setNewDoc({ ...newDoc, documentNumber: e.target.value })}
                    />
                  </div>

                  {/* Kategori Dokumen */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                      Kategori Dokumen <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                      value={newDoc.category}
                      onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value as any })}
                    >
                      <option value="SK RT">📋 SK RT (Surat Keputusan)</option>
                      <option value="Aturan">⚖️ Aturan & Tata Tertib</option>
                      <option value="Formulir">📝 Formulir & Blangko Warga</option>
                      <option value="Notulensi">📑 Notulensi Rapat RT</option>
                      <option value="Lainnya">📁 Dokumen & Panduan Lainnya</option>
                    </select>
                  </div>
                </div>

                {/* 3. Grid: Tingkat Hak Akses & Tanggal Dokumen */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tingkat Akses */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                      Tingkat Akses Dokumen
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewDoc({ ...newDoc, accessLevel: 'Publik' })}
                        className={`flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl border text-xs font-bold transition-all ${
                          newDoc.accessLevel === 'Publik'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <Globe size={14} className={newDoc.accessLevel === 'Publik' ? 'text-emerald-600' : 'text-slate-400'} />
                        <span>Publik Warga</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewDoc({ ...newDoc, accessLevel: 'Internal' })}
                        className={`flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl border text-xs font-bold transition-all ${
                          newDoc.accessLevel === 'Internal'
                            ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <Lock size={14} className={newDoc.accessLevel === 'Internal' ? 'text-amber-600' : 'text-slate-400'} />
                        <span>Internal RT</span>
                      </button>
                    </div>
                  </div>

                  {/* Tanggal Terbit / Penetapan */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Calendar size={13} className="text-indigo-600" />
                      Tanggal Penetapan / Berlaku
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      value={newDoc.effectiveDate || ''}
                      onChange={(e) => setNewDoc({ ...newDoc, effectiveDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* 4. Deskripsi / Keterangan Dokumen */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Ringkasan & Keterangan Dokumen
                    </label>
                    <span className="text-[9px] font-semibold text-slate-400">Opsional</span>
                  </div>
                  <textarea
                    rows={2}
                    className="w-full px-4 sm:px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none leading-relaxed"
                    placeholder="Tulis ringkasan singkat isi regulasi, latar belakang keputusan, atau instruksi tindak lanjut bagi warga..."
                    value={newDoc.description || ''}
                    onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
                  />
                </div>

                {/* 5. Metode Berkas (File vs Link URL) */}
                <div className="space-y-3 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Upload size={13} className="text-indigo-600" />
                      Sumber Berkas Dokumen <span className="text-rose-500">*</span>
                    </label>
                  </div>

                  {/* Dual Tab Switcher */}
                  <div className="flex gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 shadow-inner">
                    <button 
                      type="button" 
                      onClick={() => setUploadType('file')} 
                      className={`flex-1 py-2.5 text-[11px] font-black rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-2 ${
                        uploadType === 'file' 
                          ? 'bg-white shadow-sm text-indigo-600 border border-indigo-100/60' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Upload size={14} /> Upload File Lokal
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setUploadType('url')} 
                      className={`flex-1 py-2.5 text-[11px] font-black rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-2 ${
                        uploadType === 'url' 
                          ? 'bg-white shadow-sm text-indigo-600 border border-indigo-100/60' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Globe size={14} /> Link Dokumen / Cloud
                    </button>
                  </div>

                  {/* Tab 1: Upload File Drag & Drop */}
                  {uploadType === 'file' ? (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileSelection(e.target.files?.[0] || null)}
                        className="hidden"
                      />

                      {selectedFile ? (
                        <div className="p-4 bg-indigo-50/40 border-2 border-indigo-200 rounded-2xl flex items-center justify-between gap-3 transition-all">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-3 bg-white rounded-xl shadow-xs text-indigo-600 shrink-0 border border-indigo-100">
                              <FileCheck size={24} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-900 truncate max-w-[220px] sm:max-w-xs block">
                                  {selectedFile.name}
                                </span>
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase rounded-full shrink-0">
                                  Siap Unggah
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                Ukuran: <span className="font-bold text-slate-700">{formatBytes(selectedFile.size)}</span> • Format: <span className="uppercase">{selectedFile.name.split('.').pop()}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-1.5 bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                              Ganti
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedFile(null)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                              title="Hapus berkas terpilih"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`
                            flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all cursor-pointer text-center
                            ${isDragging 
                              ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]' 
                              : 'border-slate-200 bg-slate-50/60 hover:border-indigo-300 hover:bg-indigo-50/20'}
                          `}
                        >
                          <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-100 flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-110 transition-transform">
                            <Upload size={24} />
                          </div>
                          <p className="text-xs font-black text-slate-700 uppercase tracking-wider">
                            Tarik & Lepas Berkas ke Sini
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium mt-1">
                            atau <span className="text-indigo-600 font-bold underline">klik untuk memilih dari perangkat</span>
                          </p>
                          
                          <div className="flex items-center justify-center flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-200/60 max-w-sm">
                            <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 text-[9px] font-bold rounded-md">.PDF</span>
                            <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 text-[9px] font-bold rounded-md">.DOCX</span>
                            <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 text-[9px] font-bold rounded-md">.XLSX</span>
                            <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 text-[9px] font-bold rounded-md">.ZIP</span>
                            <span className="text-[9px] text-slate-400 font-semibold">• Maks 15MB</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Tab 2: Direct URL / Cloud Link */
                    <div className="space-y-2">
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="url"
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                          placeholder="https://drive.google.com/file/... atau tautan berkas resmi"
                          value={newDoc.url || ''}
                          onChange={(e) => setNewDoc({ ...newDoc, url: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                        <Info size={12} className="text-indigo-500 shrink-0" />
                        <span>Mendukung tautan publik Google Drive, Dropbox, OneDrive, atau tautan file langsung.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. Security & Storage Notice */}
                <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-2xl flex items-start gap-3">
                  <ShieldCheck size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-indigo-900/80 font-medium leading-relaxed">
                    Dokumen yang diunggah akan otomatis terindeks secara digital pada arsip RT 02 Palu dan dapat dibagikan langsung ke grup WhatsApp warga dengan format resmi.
                  </p>
                </div>

                {/* 7. Action Buttons Footer */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => !isUploading && setIsAdding(false)}
                    disabled={isUploading}
                    className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors uppercase tracking-wider"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-xl shadow-indigo-600/25 disabled:opacity-50 active:scale-[0.98]"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Mengunggah Berkas...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Simpan & Publikasikan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
