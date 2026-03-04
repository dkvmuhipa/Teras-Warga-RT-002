import React, { useState } from 'react';
import { Search, User, MessageCircle, Edit2, Trash2, MapPin, Phone, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UMKM } from '../../types';
import { SmartImage } from '../SmartImage';

interface PublicUMKMProps {
  umkmData: UMKM[];
}

export const PublicUMKM: React.FC<PublicUMKMProps> = ({ umkmData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  const categories = ['All', 'Kuliner', 'Jasa', 'Fashion', 'Retail', 'Kerajinan', 'Lainnya'];
  
  const filteredUMKM = umkmData.filter(u => 
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.description.toLowerCase().includes(searchTerm.toLowerCase())) && 
    (filterCategory === 'All' || u.category === filterCategory)
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 py-8 mb-24 font-sans"
    >
      <div className="text-center mb-12">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-100 shadow-sm"
        >
          <Star size={14} strokeWidth={3} /> 
          Ekonomi Warga
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">
          UMKM <span className="text-blue-600">RT 002</span>
        </h1>
        <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
          Dukung usaha tetangga, majukan ekonomi warga. Temukan berbagai produk dan jasa menarik di lingkungan kita.
        </p>
      </div>

      <div className="sticky top-20 z-30 bg-white/80 backdrop-blur-xl p-4 rounded-[2rem] border border-slate-200/50 shadow-lg shadow-slate-200/20 mb-12 flex flex-col md:flex-row justify-between items-center gap-4 transition-all">
        <div className="flex w-full md:w-auto gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setFilterCategory(cat)}
              className={`
                px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap
                ${filterCategory === cat 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-105' 
                  : 'bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600'}
              `}
            >
              {cat === 'All' ? 'Semua' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Cari UMKM..." 
            className="w-full pl-12 pr-6 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl text-sm font-bold outline-none transition-all placeholder:text-slate-400"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {filteredUMKM.map(u => (
            <motion.div 
              key={u.id} 
              layout
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500 overflow-hidden flex flex-col"
            >
              <div className="relative h-56 bg-slate-100 overflow-hidden">
                <SmartImage 
                  src={u.image} 
                  alt={u.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md border border-white/20 bg-white/90 text-slate-800">
                    {u.category}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <div className="mb-6">
                  <h3 className="font-black text-xl text-slate-900 line-clamp-1 leading-tight mb-2 group-hover:text-blue-700 transition-colors">
                    {u.name}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed font-medium">
                    {u.description}
                  </p>
                </div>
                
                <div className="mt-auto space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm">
                      <User size={14} strokeWidth={2.5}/>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pemilik</p>
                      <p className="text-xs font-black text-slate-700">{u.owner}</p>
                    </div>
                  </div>

                  <motion.a 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href={`https://wa.me/${u.contact.replace(/^0/, '62').replace(/\D/g, '')}?text=Halo, saya melihat usaha Anda di Website RT 002.`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm hover:shadow-emerald-500/30 font-black text-xs uppercase tracking-widest"
                  >
                    <MessageCircle size={16} strokeWidth={2.5}/> Hubungi Penjual
                  </motion.a>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredUMKM.length === 0 && (
          <div className="col-span-full py-24 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-slate-300 mx-auto mb-6 shadow-sm">
              <Search size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Tidak Ada UMKM</h3>
            <p className="text-slate-400 font-medium">Coba ubah kata kunci pencarian atau kategori.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
