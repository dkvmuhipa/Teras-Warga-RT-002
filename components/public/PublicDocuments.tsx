import React, { useState } from 'react';
import { 
  FileText, Download, Search, Clock, User, FileArchive, 
  FileSpreadsheet, File as FileIcon, Eye, ShieldCheck, Sparkles, FolderOpen, ArrowUpRight, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Document } from '../../types';

interface PublicDocumentsProps {
  documents: Document[];
}

export const PublicDocuments: React.FC<PublicDocumentsProps> = ({ documents }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'All' | Document['category']>('All');

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileBadge = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      return {
        icon: <FileText className="text-rose-500" size={24} />,
        bg: 'bg-rose-50 border-rose-100 text-rose-600',
        label: 'PDF Document'
      };
    }
    if (['doc', 'docx'].includes(ext || '')) {
      return {
        icon: <FileIcon className="text-blue-500" size={24} />,
        bg: 'bg-blue-50 border-blue-100 text-blue-600',
        label: 'Word Document'
      };
    }
    if (['xls', 'xlsx'].includes(ext || '')) {
      return {
        icon: <FileSpreadsheet className="text-emerald-500" size={24} />,
        bg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
        label: 'Excel Sheet'
      };
    }
    if (['zip', 'rar'].includes(ext || '')) {
      return {
        icon: <FileArchive className="text-amber-500" size={24} />,
        bg: 'bg-amber-50 border-amber-100 text-amber-600',
        label: 'Archive File'
      };
    }
    return {
      icon: <FileIcon className="text-indigo-500" size={24} />,
      bg: 'bg-indigo-50 border-indigo-100 text-indigo-600',
      label: 'Document'
    };
  };

  const categories = ['All', 'SK RT', 'Aturan', 'Formulir', 'Notulensi', 'Lainnya'] as const;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-4 py-8 mb-24 font-sans space-y-10"
    >
      {/* Clean Modern Hero Banner */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden bg-white rounded-[2.5rem] p-8 md:p-12 text-slate-900 border border-slate-200/70 shadow-sm"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/60 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 rounded-full border border-indigo-100 text-xs font-black uppercase tracking-widest text-indigo-700">
            <ShieldCheck size={14} className="text-indigo-600" /> Repository Resmi RT 02/RW 020
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Pusat Arsip & <span className="text-indigo-600 font-serif italic">Dokumen Publik</span>
          </h1>

          <p className="text-slate-500 font-medium text-xs md:text-sm leading-relaxed max-w-2xl">
            Akses cepat dan terverifikasi untuk mengunduh Surat Keputusan (SK), Peraturan Lingkungan, Formulir Administrasi Warga, dan Notulensi Rapat RT 02.
          </p>

          {/* Document Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
            <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60">
              <p className="text-xl font-black text-slate-900">{documents.length}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                <FolderOpen size={12} className="text-indigo-500" /> Total Dokumen
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60">
              <p className="text-xl font-black text-emerald-600">100%</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500" /> Terverifikasi RT
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60">
              <p className="text-xl font-black text-amber-600">24/7</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                <Sparkles size={12} className="text-amber-500" /> Akses Publik
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modern Floating Search Bar & Pills Filter */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white/80 backdrop-blur-md p-3 rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-900/5">
          {/* Search Box */}
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari kata kunci atau judul dokumen..." 
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`
                  px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0
                  ${filterCategory === cat 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-[1.02]' 
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'}
                `}
              >
                {cat === 'All' ? '📂 Semua Dokumen' : cat}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Document Grid Cards */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredDocs.map((doc) => {
              const fileMeta = getFileBadge(doc.url);
              return (
                <motion.div
                  key={doc.id}
                  layout
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white p-7 rounded-[2.5rem] border border-slate-200/80 shadow-md hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Subtle Card Accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none group-hover:from-indigo-500/10 transition-all" />

                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between gap-3">
                      <div className={`p-3.5 rounded-2xl border ${fileMeta.bg} shadow-sm group-hover:scale-105 transition-transform`}>
                        {fileMeta.icon}
                      </div>
                      <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-full shadow-xs">
                        {doc.category}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        {fileMeta.label}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                        <User size={12} className="text-indigo-500" /> {doc.uploadedBy || 'Admin RT'}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                        <Clock size={12} /> {new Date(doc.uploadDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                        title="Buka / Preview Document"
                      >
                        <Eye size={16} />
                      </a>
                      <a 
                        href={doc.url} 
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md shadow-slate-900/20 active:scale-95"
                      >
                        <Download size={14} /> Unduh <ArrowUpRight size={12} />
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredDocs.length === 0 && (
            <div className="col-span-full text-center py-20 bg-slate-50/80 rounded-[3rem] border-2 border-dashed border-slate-200 p-8 space-y-4">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-300 mx-auto shadow-sm border border-slate-100">
                <FileText size={40} />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-base font-black text-slate-800">Dokumen Tidak Ditemukan</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Tidak ada berkas yang sesuai dengan pencarian <span className="font-bold text-slate-700">"{searchQuery}"</span> atau kategori terpilih.
                </p>
              </div>
              <button 
                onClick={() => { setSearchQuery(''); setFilterCategory('All'); }}
                className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-100 transition-all"
              >
                Reset Pencarian
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

