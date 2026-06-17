import React, { useState } from 'react';
import { HelpCircle, Search, X, MessageSquare, ChevronDown, Minus, ArrowLeft, BookOpen, ExternalLink, ShieldCheck, Scale, PhoneCall, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FAQItem } from '../../types';
import { Link, useNavigate } from 'react-router-dom';

interface PublicFAQProps {
  faqItems: FAQItem[];
}

export const PublicFAQ: React.FC<PublicFAQProps> = ({ faqItems }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'Semua Topik', desc: 'Seluruh informasi bantuan warga' },
    { id: 'layanan', label: 'Layanan & Surat', desc: 'Panduan persuratan dan berkas administrasi' },
    { id: 'iuran', label: 'Keuangan & Iuran', desc: 'Sistem pembayaran digital, kas, dan akuntabilitas keuangan' },
    { id: 'keamanan', label: 'Keamanan & Ronda', desc: 'Sistem ronda malam, swap jadwal, dan panic button' },
    { id: 'lingkungan', label: 'Sampah & Lingkungan', desc: 'Bank sampah, jadwal kebersihan, dan laporan fasilitas' },
    { id: 'sosial', label: 'Sosial & Kegiatan', desc: 'Info posyandu, bantuan sosial pemerintah, dan UMKM' }
  ];

  const getBadgeDetails = (cat?: string) => {
    switch (cat) {
      case 'layanan': return { label: 'Administrasi', color: 'bg-sky-50 text-sky-700 border-sky-100' };
      case 'iuran': return { label: 'Iuran & Kas', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
      case 'keamanan': return { label: 'Keamanan', color: 'bg-rose-50 text-rose-700 border-rose-100' };
      case 'lingkungan': return { label: 'Lingkungan', color: 'bg-teal-50 text-teal-700 border-teal-100' };
      case 'sosial': return { label: 'Sosial', color: 'bg-purple-50 text-purple-700 border-purple-100' };
      default: return { label: 'Umum', color: 'bg-slate-50 text-slate-600 border-slate-100' };
    }
  };

  const filteredFaqs = faqItems.filter(f => {
    const matchesSearch = f.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeCategoryDesc = categories.find(c => c.id === selectedCategory)?.desc || '';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto px-4 py-8 mb-24 font-sans"
    >
      {/* Back Button */}
      <motion.button 
        variants={itemVariants}
        onClick={() => navigate('/')}
        className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-black uppercase tracking-wider transition-all bg-slate-50 hover:bg-slate-100/80 px-4 py-2.5 rounded-xl border border-slate-100"
      >
        <ArrowLeft size={16} strokeWidth={2.5} /> Kembali ke Beranda
      </motion.button>

      {/* Header Banner */}
      <motion.div 
        variants={itemVariants}
        className="text-center mb-12 relative"
      >
        <div className="absolute inset-0 -top-12 -z-10 bg-gradient-to-b from-indigo-50/20 to-transparent rounded-full blur-3xl w-72 h-72 mx-auto" />
        <div className="inline-flex justify-center items-center p-3.5 bg-indigo-50 text-indigo-600 rounded-3xl border border-indigo-100 mb-4 shadow-sm">
          <BookOpen size={32} strokeWidth={2} />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
          Buku Saku <span className="text-indigo-600">Digital RT 02</span>
        </h1>
        <p className="text-slate-500 font-medium text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Temukan panduan lengkap, regulasi lingkungan rutin, tata cara layanan, dan jawaban instan atas pertanyaan Anda.
        </p>
      </motion.div>

      {/* Quick Access Info Cards Banner (3 pillars) */}
      <motion.div 
        variants={itemVariants} 
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"
      >
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/80 flex items-start gap-3.5">
          <div className="p-2 bg-sky-100 text-sky-700 rounded-xl shrink-0 mt-0.5">
            <Scale size={18} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Regulasi Hukum</h4>
            <p className="text-[11px] text-slate-500 leading-normal mt-1">Sesuai dengan kode hukum resmi wilayah RT2LAW.</p>
          </div>
        </div>
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/80 flex items-start gap-3.5">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0 mt-0.5">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Verifikasi Data</h4>
            <p className="text-[11px] text-slate-500 leading-normal mt-1">Layanan digital aman & data pribadi dijamin terlindungi.</p>
          </div>
        </div>
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/80 flex items-start gap-3.5">
          <div className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0 mt-0.5">
            <PhoneCall size={18} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Layanan Darurat</h4>
            <p className="text-[11px] text-slate-500 leading-normal mt-1">Panic Button aktif 24 jam dengan respons langsung pengurus.</p>
          </div>
        </div>
      </motion.div>

      {/* Search & Tabs Layout */}
      <motion.div variants={itemVariants} className="space-y-4 mb-8">
        {/* Search Field */}
        <div className="relative">
          <Search size={20} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200/80 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 rounded-2xl text-sm outline-none transition-all placeholder:text-slate-400 font-bold text-slate-800 shadow-sm"
            placeholder="Ketik topik bantuan... (misal: surat pengantar, iuran sampah, bank sampah, swap ronda)"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 items-center">
          {categories.map((cat) => {
            const count = faqItems.filter(f => cat.id === 'all' || f.category === cat.id).length;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setOpenFaqId(null); // Reset open accordion on category change
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black border transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold ${
                  isActive ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-500'
                }`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Active Category Description */}
        <p className="text-xs text-slate-400 font-medium italic transition-all px-1.5">
          {activeCategoryDesc}
        </p>
      </motion.div>

      {/* Accordion Questions List */}
      <motion.div variants={itemVariants} className="space-y-3.5">
        <AnimatePresence mode="popLayout">
          {filteredFaqs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200 text-slate-500 flex flex-col items-center justify-center p-6 shadow-sm"
            >
              <HelpCircle size={44} className="text-slate-300 mb-3" />
              <h4 className="font-bold text-slate-800 text-base mb-1">Pertanyaan Tidak Ditemukan</h4>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed font-semibold">
                Coba gunakan kata kunci lain (misalnya pembayaran, kerja bakti, dll) atau hubungi langsung Ketua RT untuk info mendesak.
              </p>
            </motion.div>
          ) : (
            filteredFaqs.map(f => {
              const isOpen = openFaqId === f.id;
              const badge = getBadgeDetails(f.category);

              return (
                <motion.div 
                  key={f.id} 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
                    isOpen 
                      ? 'bg-indigo-50/10 border-indigo-100 shadow-md shadow-indigo-100/10' 
                      : 'bg-white hover:bg-slate-50/50 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaqId(isOpen ? null : f.id)}
                    className="w-full text-left p-6 flex items-start justify-between gap-4 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:ring-inset"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <h4 className={`font-black text-sm md:text-base leading-snug transition-colors ${
                        isOpen ? 'text-indigo-600' : 'text-slate-800'
                      }`}>
                        {f.question}
                      </h4>
                    </div>
                    <div className={`p-2 rounded-xl border transition-all shrink-0 mt-1 ${
                      isOpen 
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                        : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-slate-600'
                    }`}>
                      {isOpen ? <Minus size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>
                  
                  <motion.div
                    initial={false}
                    animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 md:px-7 md:pb-7 text-xs md:text-sm text-slate-600 leading-relaxed space-y-3 border-t border-slate-100/60 pt-4 bg-slate-50/40">
                      <p className="whitespace-pre-line font-medium leading-relaxed">{f.answer}</p>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>

      {/* Customer Service Hub Callout */}
      <motion.div 
        variants={itemVariants}
        className="mt-12 bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-16 -translate-y-16 pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-lg">
            <span className="bg-indigo-500/25 text-indigo-300 font-extrabold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-500/20">
              Layanan Informasi Lanjutan
            </span>
            <h3 className="text-xl md:text-2xl font-black">Masih belum menemukan jawaban?</h3>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-semibold">
              Jangan khawatir. Pengurus RT 02 siap sedia membantu Anda. Ajukan klarifikasi atau langsung hubungi Ketua RT maupun seksi humas via WhatsApp.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0 pt-2 md:pt-0">
            <a 
              href="https://wa.me/6285961194621" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25d366] hover:bg-[#20ba5a] text-white px-5 py-3.5 rounded-2xl text-xs font-black shadow-lg shadow-black/10 transition-all active:scale-95"
            >
              <MessageSquare size={16} /> Hubungi Ketua RT
            </a>
            <Link 
              to="/rules"
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3.5 rounded-2xl text-xs font-black shadow-lg transition-all active:scale-95"
            >
              <Scale size={16} /> Lihat Tata Tertib
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
