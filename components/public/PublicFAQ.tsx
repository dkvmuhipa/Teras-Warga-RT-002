import React, { useState } from 'react';
import { HelpCircle, Search, X, MessageSquare, ChevronDown, Minus, ArrowLeft, BookOpen, ExternalLink, ShieldCheck, Scale, PhoneCall, Share2, Copy, Check, Flame, Tag, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FAQItem } from '../../types';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface PublicFAQProps {
  faqItems: FAQItem[];
}

export const PublicFAQ: React.FC<PublicFAQProps> = ({ faqItems }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'Semua Topik', desc: 'Seluruh panduan informasi bantuan warga' },
    { id: 'layanan', label: 'Layanan & Surat', desc: 'Panduan persuratan dan berkas administrasi' },
    { id: 'iuran', label: 'Keuangan & Iuran', desc: 'Sistem pembayaran digital, kas, dan akuntabilitas keuangan' },
    { id: 'keamanan', label: 'Keamanan & Ronda', desc: 'Sistem ronda malam, swap jadwal, dan panic button' },
    { id: 'lingkungan', label: 'Sampah & Lingkungan', desc: 'Bank sampah, jadwal kebersihan, dan laporan fasilitas' },
    { id: 'sosial', label: 'Sosial & Kegiatan', desc: 'Info posyandu, bantuan sosial pemerintah, dan UMKM' }
  ];

  // Popular Tag Suggestions
  const popularTags = ['iuran', 'surat pengantar', 'ronda', 'bank sampah', 'posyandu', 'bantuan sosial', 'tamu 24 jam'];

  const getBadgeDetails = (cat?: string) => {
    switch (cat) {
      case 'layanan': return { label: 'Administrasi', color: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'iuran': return { label: 'Iuran & Kas', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'keamanan': return { label: 'Keamanan', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'lingkungan': return { label: 'Lingkungan', color: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'sosial': return { label: 'Sosial', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      default: return { label: 'Umum', color: 'bg-slate-50 text-slate-600 border-slate-200' };
    }
  };

  const filteredFaqs = faqItems.filter(f => {
    const matchesSearch = f.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (f.keywords && f.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeCategoryDesc = categories.find(c => c.id === selectedCategory)?.desc || '';

  const handleShareWa = (item: FAQItem) => {
    const text = `*PANDUAN INFORMASI TERAS RT 02 PALU*\n\n❓ *Q:* ${item.question}\n\n💡 *A:* ${item.answer}\n\n_Pusat Layanan & Bantuan Warga RT 02_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = (item: FAQItem) => {
    const linkText = `${window.location.origin}/faq?id=${item.id}`;
    navigator.clipboard.writeText(linkText);
    setCopiedId(item.id);
    toast.success('Link panduan berhasil disalin!');
    setTimeout(() => setCopiedId(null), 2000);
  };

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
        className="mb-8 flex items-center gap-2 text-slate-600 hover:text-slate-900 text-xs font-black uppercase tracking-wider transition-all bg-white hover:bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs"
      >
        <ArrowLeft size={16} strokeWidth={2.5} /> Kembali ke Beranda
      </motion.button>

      {/* Header Banner */}
      <motion.div 
        variants={itemVariants}
        className="text-center mb-10 relative"
      >
        <div className="absolute inset-0 -top-12 -z-10 bg-gradient-to-b from-teal-100/30 via-sky-50/20 to-transparent rounded-full blur-3xl w-80 h-80 mx-auto" />
        <div className="inline-flex justify-center items-center p-4 bg-teal-50 text-teal-600 rounded-3xl border border-teal-100 mb-4 shadow-xs">
          <BookOpen size={36} strokeWidth={2} />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-3">
          Pusat Bantuan & <span className="text-teal-600">FAQ RT 02</span>
        </h1>
        <p className="text-slate-500 font-medium text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Temukan jawaban resmi, prosedur layanan administrasi, regulasi lingkungan, dan panduan praktis warga.
        </p>
      </motion.div>

      {/* Quick Access Info Cards Banner (3 pillars) */}
      <motion.div 
        variants={itemVariants} 
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
      >
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-start gap-3.5 hover:border-sky-200 transition-all">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl shrink-0 mt-0.5 border border-sky-100">
            <Scale size={18} />
          </div>
          <div>
            <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Regulasi Resmi</h4>
            <p className="text-[11px] text-slate-500 leading-normal mt-1">Sesuai kesepakatan musyawarah & tata tertib RT 02 Palu.</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-start gap-3.5 hover:border-emerald-200 transition-all">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 mt-0.5 border border-emerald-100">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Layanan Terverifikasi</h4>
            <p className="text-[11px] text-slate-500 leading-normal mt-1">Informasi valid & terverifikasi langsung oleh pengurus RT.</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-start gap-3.5 hover:border-rose-200 transition-all">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl shrink-0 mt-0.5 border border-rose-100">
            <PhoneCall size={18} />
          </div>
          <div>
            <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Bantuan 24 Jam</h4>
            <p className="text-[11px] text-slate-500 leading-normal mt-1">Layanan Panic Button & WhatsApp siaga pengurus.</p>
          </div>
        </div>
      </motion.div>

      {/* Search & Filter Controls */}
      <motion.div variants={itemVariants} className="space-y-4 mb-8">
        {/* Search Field */}
        <div className="relative group">
          <Search size={20} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200/80 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-2xl text-sm outline-none transition-all placeholder:text-slate-400 font-bold text-slate-800 shadow-xs"
            placeholder="Cari kata kunci panduan... (misal: surat pengantar, iuran, ronda, sampah)"
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

        {/* Popular Tag Pills Suggestions */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-400 px-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
            <Sparkles size={12} className="text-teal-500" /> Sering Dicari:
          </span>
          {popularTags.map((tag, idx) => (
            <button
              key={idx}
              onClick={() => setSearchTerm(tag)}
              className="px-3 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 text-slate-600 rounded-xl text-[11px] font-bold border border-slate-200/60 transition-all"
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 items-center pt-2">
          {categories.map((cat) => {
            const count = faqItems.filter(f => cat.id === 'all' || f.category === cat.id).length;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setOpenFaqId(null);
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                  isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'
                }`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Active Category Description */}
        <p className="text-xs text-slate-400 font-medium italic transition-all px-1">
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
              className="py-16 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200 text-slate-500 flex flex-col items-center justify-center p-6 shadow-xs"
            >
              <HelpCircle size={44} className="text-slate-300 mb-3" />
              <h4 className="font-bold text-slate-800 text-base mb-1">Panduan Tidak Ditemukan</h4>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed font-semibold">
                Coba ketik kata kunci lain atau gunakan fitur tanya langsung ke Ketua RT via WhatsApp di bawah.
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
                      ? 'bg-teal-50/20 border-teal-200 shadow-md shadow-teal-100/20' 
                      : 'bg-white hover:bg-slate-50/50 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaqId(isOpen ? null : f.id)}
                    className="w-full text-left p-6 flex items-start justify-between gap-4 outline-none"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-md text-[8.5px] font-black tracking-wider uppercase border ${badge.color}`}>
                          {badge.label}
                        </span>
                        {f.isPopular && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Flame size={10} className="text-amber-500" /> Sering Ditanyakan
                          </span>
                        )}
                        {f.keywords && f.keywords.map((kw, i) => (
                          <span key={i} className="text-[9px] font-medium text-slate-400">
                            #{kw}
                          </span>
                        ))}
                      </div>
                      <h4 className={`font-black text-sm md:text-base leading-snug transition-colors ${
                        isOpen ? 'text-teal-700' : 'text-slate-900'
                      }`}>
                        {f.question}
                      </h4>
                    </div>
                    
                    <div className={`p-2 rounded-xl border transition-all shrink-0 mt-1 ${
                      isOpen 
                        ? 'bg-teal-50 text-teal-600 border-teal-200' 
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
                    <div className="px-6 pb-6 md:px-7 md:pb-7 text-xs md:text-sm text-slate-700 leading-relaxed space-y-4 border-t border-slate-100/60 pt-4 bg-slate-50/40">
                      <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs font-medium leading-relaxed whitespace-pre-line text-slate-700">
                        {f.answer}
                      </div>

                      {/* Action Share Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-1 text-[11px] font-bold text-slate-500">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleShareWa(f); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all"
                          >
                            <Share2 size={13} /> Bagi via WA
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyLink(f); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all"
                          >
                            {copiedId === f.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            {copiedId === f.id ? 'Tersalin' : 'Salin Link'}
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">RESMI RT 02</span>
                      </div>
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
            <span className="bg-teal-500/20 text-teal-300 font-extrabold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-teal-500/30">
              Layanan Informasi Lanjutan
            </span>
            <h3 className="text-xl md:text-2xl font-black">Masih belum menemukan jawaban?</h3>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-semibold">
              Jangan khawatir. Pengurus RT 02 siap sedia membantu Anda. Ajukan pertanyaan atau langsung hubungi Ketua RT maupun seksi humas via WhatsApp.
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
              className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-3.5 rounded-2xl text-xs font-black shadow-lg transition-all active:scale-95"
            >
              <Scale size={16} /> Lihat Tata Tertib
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
