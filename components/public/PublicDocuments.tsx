import React, { useState, useEffect } from 'react';
import { FileText, Download, Search, Filter, Clock, User, FileArchive, FileCode, FileSpreadsheet, File as FileIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Document } from '../../types';
import { subscribeToDocuments } from '../../services/databaseService';

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

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="text-rose-500" size={24} />;
    if (['doc', 'docx'].includes(ext || '')) return <FileIcon className="text-blue-500" size={24} />;
    if (['xls', 'xlsx'].includes(ext || '')) return <FileSpreadsheet className="text-emerald-500" size={24} />;
    if (['zip', 'rar'].includes(ext || '')) return <FileArchive className="text-amber-500" size={24} />;
    return <FileIcon className="text-slate-400" size={24} />;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto px-4 py-8 mb-24 font-sans"
    >
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
          Pusat <span className="text-indigo-600">Dokumen Publik</span>
        </h1>
        <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">
          Unduh dokumen resmi, aturan lingkungan, dan formulir administrasi RT 002.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari judul dokumen..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl shrink-0 border border-slate-200/50">
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

      {/* Document List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredDocs.map((doc) => (
              <motion.div
                key={doc.id}
                layout
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all group"
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
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Clock size={12} /> {new Date(doc.uploadDate).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-800 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {doc.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-4">
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-slate-900/20"
                      >
                        <Download size={14} /> Unduh File
                      </a>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                        <User size={12} /> {doc.uploadedBy}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredDocs.length === 0 && (
            <div className="col-span-full text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6 shadow-sm">
                <FileText size={40} />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">Dokumen Tidak Ditemukan</h3>
              <p className="text-slate-400 font-medium">Coba gunakan kata kunci lain atau pilih kategori yang berbeda.</p>
            </div>
          )}
        </div>
    </motion.div>
  );
};
