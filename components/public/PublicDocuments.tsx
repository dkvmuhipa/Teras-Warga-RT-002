import React, { useState, useMemo } from 'react';
import { 
  FileText, Download, Search, Clock, User, FileArchive, 
  FileSpreadsheet, File as FileIcon, Eye, ShieldCheck, Sparkles, 
  FolderOpen, ArrowUpRight, CheckCircle2, LayoutGrid, List, 
  Share2, Copy, Check, ExternalLink, Calendar, 
  X, Info, Globe, Building2, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Document } from '../../types';
import { getDocumentPreviewUrl } from '../../services/databaseService';
import { Modal } from '../ui/Modal';

interface PublicDocumentsProps {
  documents: Document[];
}

type SortOption = 'latest' | 'oldest' | 'title-asc' | 'title-desc';

export const PublicDocuments: React.FC<PublicDocumentsProps> = ({ documents }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'All' | Document['category']>('All');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<Document | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Category Theme Config
  const categoryConfig: Record<Document['category'], {
    bg: string;
    text: string;
    border: string;
    accent: string;
    icon: string;
    label: string;
  }> = {
    'SK RT': {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      accent: 'from-amber-500/10 to-orange-500/5',
      icon: '📜',
      label: 'Surat Keputusan RT'
    },
    'Aturan': {
      bg: 'bg-indigo-50',
      text: 'text-indigo-800',
      border: 'border-indigo-200',
      accent: 'from-indigo-500/10 to-blue-500/5',
      icon: '⚖️',
      label: 'Peraturan Lingkungan'
    },
    'Formulir': {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      accent: 'from-emerald-500/10 to-teal-500/5',
      icon: '📝',
      label: 'Formulir Administrasi'
    },
    'Notulensi': {
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200',
      accent: 'from-purple-500/10 to-pink-500/5',
      icon: '📋',
      label: 'Notulensi Rapat'
    },
    'Lainnya': {
      bg: 'bg-slate-50',
      text: 'text-slate-800',
      border: 'border-slate-200',
      accent: 'from-slate-500/10 to-slate-400/5',
      icon: '📁',
      label: 'Dokumen Lainnya'
    }
  };

  // Only display documents intended for public view
  const publicDocs = useMemo(() => {
    return documents.filter(doc => doc.accessLevel !== 'Internal');
  }, [documents]);

  // Dynamic Category Counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: publicDocs.length,
      'SK RT': 0,
      Aturan: 0,
      Formulir: 0,
      Notulensi: 0,
      Lainnya: 0
    };
    publicDocs.forEach(doc => {
      if (counts[doc.category] !== undefined) {
        counts[doc.category]++;
      }
    });
    return counts;
  }, [publicDocs]);

  // Filtered & Sorted Documents
  const filteredDocs = useMemo(() => {
    return publicDocs.filter(doc => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        doc.title.toLowerCase().includes(query) ||
        (doc.documentNumber && doc.documentNumber.toLowerCase().includes(query)) ||
        (doc.description && doc.description.toLowerCase().includes(query)) ||
        doc.category.toLowerCase().includes(query);
      const matchesCategory = filterCategory === 'All' || doc.category === filterCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      if (sortBy === 'latest') {
        const dateA = new Date(a.effectiveDate || a.uploadDate).getTime();
        const dateB = new Date(b.effectiveDate || b.uploadDate).getTime();
        return dateB - dateA;
      }
      if (sortBy === 'oldest') {
        const dateA = new Date(a.effectiveDate || a.uploadDate).getTime();
        const dateB = new Date(b.effectiveDate || b.uploadDate).getTime();
        return dateA - dateB;
      }
      if (sortBy === 'title-asc') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'title-desc') {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });
  }, [publicDocs, searchQuery, filterCategory, sortBy]);

  const getFileBadge = (url: string) => {
    if (url.includes('drive.google.com') || url.includes('docs.google.com') || url.startsWith('http://') || (url.startsWith('https://') && !url.includes('res.cloudinary.com'))) {
      if (url.toLowerCase().endsWith('.pdf') || url.includes('/pdf')) {
        return {
          icon: <FileText className="text-rose-500" size={24} />,
          bg: 'bg-rose-50/80 border-rose-100 text-rose-700',
          badge: 'bg-rose-100 text-rose-800',
          label: 'PDF Document',
          ext: 'PDF'
        };
      }
      return {
        icon: <Globe className="text-indigo-500" size={24} />,
        bg: 'bg-indigo-50/80 border-indigo-100 text-indigo-700',
        badge: 'bg-indigo-100 text-indigo-800',
        label: 'Google Drive / Cloud',
        ext: 'CLOUD'
      };
    }

    const ext = url.split('.').pop()?.split('?')[0].toLowerCase() || '';
    if (ext === 'pdf') {
      return {
        icon: <FileText className="text-rose-500" size={24} />,
        bg: 'bg-rose-50/80 border-rose-100 text-rose-700',
        badge: 'bg-rose-100 text-rose-800',
        label: 'PDF Document',
        ext: 'PDF'
      };
    }
    if (['doc', 'docx'].includes(ext)) {
      return {
        icon: <FileIcon className="text-blue-500" size={24} />,
        bg: 'bg-blue-50/80 border-blue-100 text-blue-700',
        badge: 'bg-blue-100 text-blue-800',
        label: 'Word Document',
        ext: 'DOCX'
      };
    }
    if (['xls', 'xlsx'].includes(ext)) {
      return {
        icon: <FileSpreadsheet className="text-emerald-500" size={24} />,
        bg: 'bg-emerald-50/80 border-emerald-100 text-emerald-700',
        badge: 'bg-emerald-100 text-emerald-800',
        label: 'Excel Spreadsheet',
        ext: 'XLSX'
      };
    }
    if (['zip', 'rar', '7z'].includes(ext)) {
      return {
        icon: <FileArchive className="text-amber-500" size={24} />,
        bg: 'bg-amber-50/80 border-amber-100 text-amber-700',
        badge: 'bg-amber-100 text-amber-800',
        label: 'Archive Package',
        ext: 'ZIP'
      };
    }
    return {
      icon: <FileIcon className="text-indigo-500" size={24} />,
      bg: 'bg-indigo-50/80 border-indigo-100 text-indigo-700',
      badge: 'bg-indigo-100 text-indigo-800',
      label: 'Official Document',
      ext: 'FILE'
    };
  };

  const handleCopyLink = (doc: Document) => {
    const fullUrl = doc.url.startsWith('http') ? doc.url : window.location.origin + doc.url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(doc.id);
    toast.success('Tautan dokumen berhasil disalin ke clipboard');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleShareWhatsApp = (doc: Document) => {
    const fullUrl = doc.url.startsWith('http') ? doc.url : window.location.origin + doc.url;
    const nomor = doc.documentNumber ? `\n📌 Nomor: ${doc.documentNumber}` : '';
    const desc = doc.description ? `\n📝 Keterangan: ${doc.description}` : '';
    
    const text = encodeURIComponent(
      `🏛️ *ARSIP DOKUMEN RESMI RT 02 / RW 020*\n` +
      `*Kelurahan Tondo, Kecamatan Mantikulore*\n\n` +
      `📄 *${doc.title}*${nomor}\n` +
      `📂 Kategori: ${doc.category}${desc}\n\n` +
      `🔗 *Unduh / Buka Dokumen:*\n${fullUrl}\n\n` +
      `_Diverifikasi resmi oleh Pengurus RT 02._`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const categories = ['All', 'SK RT', 'Aturan', 'Formulir', 'Notulensi', 'Lainnya'] as const;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8 sm:py-12 mb-28 font-sans space-y-8"
    >
      {/* 1. Executive Government Hero Banner */}
      <motion.div 
        variants={itemVariants}
        className="relative w-full overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[2.5rem] p-6 sm:p-10 md:p-12 shadow-xl shadow-slate-950/20 border border-slate-800/80"
      >
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-indigo-500/20 to-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl space-y-6">
          {/* Official Badge & RT Indicator */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-500/20 backdrop-blur-md rounded-full border border-indigo-400/30 text-indigo-300 text-[11px] font-black uppercase tracking-widest shadow-xs">
              <Building2 size={13} className="text-indigo-400" /> Repository Resmi RT 02 / RW 020
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 backdrop-blur-md rounded-full border border-emerald-400/30 text-emerald-300 text-[11px] font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Terverifikasi Digital
            </span>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.15]">
              Pusat Arsip & <span className="bg-gradient-to-r from-indigo-300 via-indigo-200 to-amber-200 bg-clip-text text-transparent">Dokumen Publik</span>
            </h1>

            <p className="text-slate-300/90 font-normal text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl">
              Portal keterbukaan informasi dan regulasi resmi warga RT 02 / RW 020 Kelurahan Tondo. Akses cepat dan transparan untuk Surat Keputusan (SK), Peraturan Lingkungan, Formulir Administrasi, dan Notulensi Rapat.
            </p>
          </div>

          {/* 4 Executive Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Dokumen</span>
                <FolderOpen size={16} className="text-indigo-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1">{publicDocs.length}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Arsip Publik Tersedia</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-amber-300/80 uppercase tracking-widest">SK & Aturan</span>
                <ShieldCheck size={16} className="text-amber-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-amber-300 mt-1">
                {(categoryCounts['SK RT'] || 0) + (categoryCounts['Aturan'] || 0)}
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Regulasi Resmi RT</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-emerald-300/80 uppercase tracking-widest">Formulir Warga</span>
                <CheckCircle2 size={16} className="text-emerald-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-300 mt-1">
                {categoryCounts['Formulir'] || 0}
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Siap Unduh & Isi</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-indigo-300/80 uppercase tracking-widest">Akses Warga</span>
                <Sparkles size={16} className="text-indigo-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-indigo-300 mt-1">24 / 7</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Terbuka & Transparan</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Search, Filter Pills & View Controls */}
      <motion.div variants={itemVariants} className="space-y-4">
        {/* Top Control Bar */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-3 sm:p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input 
              type="text" 
              placeholder="Cari nomor SK, judul, atau kata kunci..." 
              className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Right Controls: Sort & View Toggle */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">Urutan:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Urutkan dokumen berdasarkan"
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="latest">Terbaru Ditambahkan</option>
                <option value="oldest">Terlama</option>
                <option value="title-asc">Judul (A - Z)</option>
                <option value="title-desc">Judul (Z - A)</option>
              </select>
            </div>

            {/* Layout Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/70">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-white text-indigo-600 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Tampilan Kartu"
              >
                <LayoutGrid size={15} />
                <span className="hidden sm:inline text-[11px]">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'table' 
                    ? 'bg-white text-indigo-600 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Tampilan Tabel Berkas"
              >
                <List size={15} />
                <span className="hidden sm:inline text-[11px]">Tabel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills with Count Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isSelected = filterCategory === cat;
            const cfg = cat !== 'All' ? categoryConfig[cat] : null;

            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`
                  px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 flex items-center gap-2
                  ${isSelected 
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/15 scale-[1.02]' 
                    : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-xs'}
                `}
              >
                <span>{cfg ? `${cfg.icon} ${cat}` : '📂 Semua Berkas'}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results Info Banner */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-2">
          <span>Menampilkan <strong className="text-slate-900 font-bold">{filteredDocs.length}</strong> dokumen resmi publik</span>
          {(searchQuery || filterCategory !== 'All') && (
            <button
              onClick={() => { setSearchQuery(''); setFilterCategory('All'); }}
              className="text-indigo-600 hover:underline font-bold text-[11px]"
            >
              Reset Filter
            </button>
          )}
        </div>
      </motion.div>

      {/* 3. Document Content Display (Grid Cards or Table View) */}
      <motion.div variants={itemVariants}>
        {viewMode === 'grid' ? (
          /* --- A. GRID CARD VIEW --- */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {filteredDocs.map((doc) => {
                const fileMeta = getFileBadge(doc.url);
                const theme = categoryConfig[doc.category] || categoryConfig['Lainnya'];
                const formattedDate = new Date(doc.effectiveDate || doc.uploadDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                });

                return (
                  <motion.div
                    key={doc.id}
                    layout
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group relative bg-white rounded-[2rem] border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 p-6 sm:p-7 flex flex-col justify-between overflow-hidden"
                  >
                    {/* Top Ambient Highlight */}
                    <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl ${theme.accent} rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-500`} />

                    {/* Card Body */}
                    <div className="space-y-4 relative z-10">
                      {/* Category Badge & File Format Pill */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className={`p-3 rounded-2xl border ${fileMeta.bg} shadow-xs group-hover:scale-105 transition-transform`}>
                            {fileMeta.icon}
                          </div>
                          <div>
                            <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${fileMeta.badge}`}>
                              {fileMeta.ext}
                            </span>
                            {doc.fileSize && (
                              <span className="text-[11px] font-bold text-slate-500 ml-2">
                                {doc.fileSize}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-2xs ${theme.bg} ${theme.text} ${theme.border}`}>
                          {theme.icon} {doc.category}
                        </span>
                      </div>

                      {/* Document Number & Title */}
                      <div className="space-y-2">
                        {doc.documentNumber && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-mono font-bold text-slate-700">
                            <span>No: {doc.documentNumber}</span>
                          </div>
                        )}

                        <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                          {doc.title}
                        </h3>

                        {doc.description && (
                          <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                            {doc.description}
                          </p>
                        )}
                      </div>

                      {/* Official Verification Watermark Badge */}
                      <div className="flex items-center gap-2 pt-1">
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                          <CheckCircle2 size={12} className="text-emerald-600" /> Dokumen Resmi Terverifikasi RT 02
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Metadata & Action Buttons */}
                    <div className="pt-5 mt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                      {/* Meta Info */}
                      <div className="space-y-1 text-slate-400">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                          <Calendar size={13} className="text-indigo-500" />
                          <span>Berlaku: {formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <User size={12} />
                          <span>Diterbitkan oleh {doc.uploadedBy || 'Admin RT 02'}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* WhatsApp Share Button */}
                        <button
                          onClick={() => handleShareWhatsApp(doc)}
                          className="p-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200/80 hover:border-emerald-200 rounded-xl transition-all"
                          title="Bagikan ke WhatsApp Warga"
                        >
                          <Share2 size={15} />
                        </button>

                        {/* Copy Link Button */}
                        <button
                          onClick={() => handleCopyLink(doc)}
                          className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80 rounded-xl transition-all"
                          title="Salin Tautan Dokumen"
                        >
                          {copiedId === doc.id ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                        </button>

                        {/* Preview In-Modal / Eye Button */}
                        <button
                          onClick={() => setSelectedPreviewDoc(doc)}
                          className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
                          title="Pratinjau Dokumen"
                        >
                          <Eye size={15} />
                          <span className="hidden sm:inline text-[11px]">Lihat</span>
                        </button>

                        {/* Download / Open Full Document */}
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md shadow-slate-900/10 active:scale-95"
                        >
                          <Download size={14} /> Unduh
                        </a>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          /* --- B. EXECUTIVE TABLE / LIST VIEW --- */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-5">Format</th>
                    <th className="py-4 px-5">Judul & Nomor Dokumen</th>
                    <th className="py-4 px-5">Kategori</th>
                    <th className="py-4 px-5">Tanggal Ditetapkan</th>
                    <th className="py-4 px-5">Ukuran</th>
                    <th className="py-4 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredDocs.map((doc) => {
                    const fileMeta = getFileBadge(doc.url);
                    const theme = categoryConfig[doc.category] || categoryConfig['Lainnya'];
                    const formattedDate = new Date(doc.effectiveDate || doc.uploadDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });

                    return (
                      <tr key={doc.id} className="hover:bg-indigo-50/30 transition-colors group">
                        {/* Format */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-xl border ${fileMeta.bg}`}>
                              {fileMeta.icon}
                            </div>
                            <span className="font-bold text-slate-700">{fileMeta.ext}</span>
                          </div>
                        </td>

                        {/* Title & Document Number */}
                        <td className="py-4 px-5 max-w-sm">
                          {doc.documentNumber && (
                            <span className="text-[10px] font-mono font-bold text-indigo-600 block mb-0.5">
                              {doc.documentNumber}
                            </span>
                          )}
                          <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {doc.title}
                          </p>
                          {doc.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              {doc.description}
                            </p>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${theme.bg} ${theme.text} ${theme.border}`}>
                            {doc.category}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-5 whitespace-nowrap text-slate-500 font-semibold">
                          {formattedDate}
                        </td>

                        {/* File Size */}
                        <td className="py-4 px-5 whitespace-nowrap text-slate-500 font-semibold">
                          {doc.fileSize || '-'}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleShareWhatsApp(doc)}
                              className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Bagikan ke WhatsApp"
                            >
                              <Share2 size={15} />
                            </button>
                            <button
                              onClick={() => setSelectedPreviewDoc(doc)}
                              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Pratinjau Dokumen"
                            >
                              <Eye size={15} />
                            </button>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="p-2 text-slate-700 hover:text-white hover:bg-slate-900 rounded-lg transition-all"
                              title="Unduh Dokumen"
                            >
                              <Download size={15} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredDocs.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 p-8 space-y-4 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto shadow-inner border border-slate-100">
              <FileText size={38} className="text-slate-400" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-black text-slate-800">Tidak Ada Dokumen Yang Ditemukan</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Tidak ada berkas yang sesuai dengan kata kunci pencarian <span className="font-bold text-slate-800">"{searchQuery}"</span> atau kategori yang dipilih.
              </p>
            </div>
            <button 
              onClick={() => { setSearchQuery(''); setFilterCategory('All'); }}
              className="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-100 transition-all cursor-pointer"
            >
              Tampilkan Semua Dokumen
            </button>
          </div>
        )}
      </motion.div>

      {/* 4. Interactive In-App Document Preview Modal */}
      <Modal
        isOpen={!!selectedPreviewDoc}
        onClose={() => setSelectedPreviewDoc(null)}
        title={selectedPreviewDoc?.title || 'Pratinjau Dokumen Resmi'}
        maxWidth="max-w-4xl"
      >
        {selectedPreviewDoc && (
          <div className="space-y-5">
            {/* Metadata Summary Banner */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {selectedPreviewDoc.category}
                </span>
                {selectedPreviewDoc.documentNumber && (
                  <span className="font-mono font-bold text-slate-700">
                    No: {selectedPreviewDoc.documentNumber}
                  </span>
                )}
                {selectedPreviewDoc.fileSize && (
                  <span className="text-slate-400 font-semibold">• {selectedPreviewDoc.fileSize}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyLink(selectedPreviewDoc)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 flex items-center gap-1.5 text-[11px]"
                >
                  {copiedId === selectedPreviewDoc.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>Salin Tautan</span>
                </button>
                <button
                  onClick={() => handleShareWhatsApp(selectedPreviewDoc)}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold hover:bg-emerald-100 flex items-center gap-1.5 text-[11px]"
                >
                  <Share2 size={13} />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>

            {selectedPreviewDoc.description && (
              <p className="text-xs text-slate-600 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100 leading-relaxed">
                <strong>Keterangan:</strong> {selectedPreviewDoc.description}
              </p>
            )}

            {/* Document Embedded Viewer */}
            <div className="w-full h-[65vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex flex-col items-center justify-center relative">
              {selectedPreviewDoc.url.toLowerCase().endsWith('.pdf') || selectedPreviewDoc.url.includes('res.cloudinary.com') ? (
                <iframe
                  src={getDocumentPreviewUrl(selectedPreviewDoc.url)}
                  title={selectedPreviewDoc.title}
                  className="w-full h-full border-0 bg-white"
                />
              ) : selectedPreviewDoc.url.includes('drive.google.com') ? (
                <iframe
                  src={selectedPreviewDoc.url.replace('/view', '/preview')}
                  title={selectedPreviewDoc.title}
                  className="w-full h-full border-0 bg-white"
                />
              ) : (
                <div className="text-center p-8 space-y-3 text-white">
                  <Globe size={40} className="mx-auto text-indigo-400" />
                  <p className="text-sm font-bold">Dokumen Berada di Layanan Tautan Eksternal</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Berkas ini ditautkan secara daring. Klik tombol di bawah untuk membuka langsung di peramban Anda.
                  </p>
                  <a
                    href={selectedPreviewDoc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700 transition-all"
                  >
                    Buka Dokumen <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <a
                href={selectedPreviewDoc.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1.5"
              >
                Buka di Tab Baru Penuh <ArrowUpRight size={13} />
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedPreviewDoc(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  Tutup
                </button>
                <a
                  href={selectedPreviewDoc.url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-slate-900/10 active:scale-95"
                >
                  <Download size={14} /> Unduh Berkas
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};
