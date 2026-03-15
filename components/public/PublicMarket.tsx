import React, { useState } from 'react';
import { ShoppingCart, Search, Plus, Lock, MessageCircle, Tag, User, Phone, Image as ImageIcon, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MarketItem } from '../../types';
import { addMarketItem, validateResidentAccess, formatHouseId } from '../../services/databaseService';
import { SmartImage } from '../SmartImage';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface PublicMarketProps {
  items: MarketItem[];
}

export const PublicMarket: React.FC<PublicMarketProps> = ({ items }) => {
  const [filter, setFilter] = useState('All');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  // Post Form State
  const [postTitle, setPostTitle] = useState('');
  const [postDesc, setPostDesc] = useState('');
  const [postPrice, setPostPrice] = useState('');
  const [postCategory, setPostCategory] = useState<'Jual' | 'Barter' | 'Gratis'>('Jual');
  const [postSeller, setPostSeller] = useState('');
  const [postContact, setPostContact] = useState('');
  const [postImage, setPostImage] = useState('');
  
  // Auth
  const [postHouseId, setPostHouseId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [showPin, setShowPin] = useState(false);

  const filteredItems = items.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || item.category === filter;
    return matchSearch && matchFilter && item.status === 'Available';
  });

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await validateResidentAccess(postHouseId, accessCode);
    if (!isValid) {
      alert("Verifikasi Gagal! Kode Akses Rumah tidak valid.");
      return;
    }

    const formattedPostHouseId = formatHouseId(postHouseId);

    const newItem: any = {
      title: postTitle,
      description: postDesc,
      price: parseInt(postPrice) || 0,
      category: postCategory,
      sellerName: postSeller,
      sellerContact: postContact,
      image: postImage,
      date: new Date().toISOString(),
      status: 'Available',
      houseId: formattedPostHouseId
    };

    await addMarketItem(newItem);
    alert("Iklan berhasil ditayangkan!");
    setIsPostModalOpen(false);
    setPostTitle(''); setPostDesc(''); setPostPrice(''); setPostSeller(''); setPostContact(''); setPostImage(''); setAccessCode(''); setPostHouseId('');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 py-8 mb-24 font-sans"
    >
      {/* Hero Banner */}
      <div className="relative rounded-[3rem] overflow-hidden bg-emerald-900 shadow-2xl shadow-emerald-900/20 min-h-[300px] flex items-center justify-center text-center px-6 py-12 mb-12 group">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1472851294608-415105094a3f?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay group-hover:scale-105 transition-transform duration-[20s]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-800/90 to-teal-900/90"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-100 text-[10px] font-black uppercase tracking-widest shadow-lg"
          >
            <ShoppingCart size={14} strokeWidth={3} /> Marketplace Warga
          </motion.div>
          
          <motion.h1 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg leading-tight"
          >
            Bursa Warga <span className="text-emerald-300">RT 02</span>
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-emerald-50 text-lg font-medium max-w-xl mx-auto leading-relaxed"
          >
            Jual barang bekas, barter tanaman, atau berbagi makanan. Dari warga, untuk warga.
          </motion.p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="sticky top-20 z-30 bg-white/80 backdrop-blur-xl p-4 rounded-[2rem] border border-slate-200/50 shadow-lg shadow-slate-200/20 mb-12 flex flex-col md:flex-row justify-between items-center gap-4 transition-all">
        <div className="flex w-full md:w-auto gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {['All', 'Jual', 'Barter', 'Gratis'].map(cat => (
            <button 
              key={cat} 
              onClick={() => setFilter(cat)}
              className={`
                px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap
                ${filter === cat 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-105' 
                  : 'bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'}
              `}
            >
              {cat === 'All' ? 'Semua' : cat}
            </button>
          ))}
        </div>

        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Cari barang..." 
              className="w-full pl-12 pr-6 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-emerald-500 rounded-2xl text-sm font-bold outline-none transition-all placeholder:text-slate-400"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsPostModalOpen(true)} 
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={16} strokeWidth={3}/> Pasang Iklan
          </motion.button>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <AnimatePresence>
          {filteredItems.map(item => (
            <motion.div 
              key={item.id} 
              layout
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-500 overflow-hidden flex flex-col relative"
            >
              <div className="relative h-64 bg-slate-100 overflow-hidden">
                <SmartImage 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 z-10">
                  <span className={`
                    px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md border border-white/20
                    ${item.category === 'Gratis' ? 'bg-emerald-500/90 text-white' : 
                      item.category === 'Barter' ? 'bg-purple-500/90 text-white' : 
                      'bg-blue-500/90 text-white'}
                  `}>
                    {item.category}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              <div className="p-6 flex-1 flex flex-col relative">
                <div className="mb-4">
                  <h3 className="font-black text-lg text-slate-800 line-clamp-2 leading-tight mb-2 group-hover:text-emerald-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed font-medium">
                    {item.description}
                  </p>
                </div>
                
                <div className="mt-auto pt-6 border-t border-slate-50 flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                        {item.sellerName.charAt(0)}
                      </div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{item.sellerName}</p>
                    </div>
                    <p className={`font-black text-xl tracking-tight ${item.category === 'Gratis' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {item.category === 'Gratis' ? 'GRATIS' : item.category === 'Barter' ? 'BARTER' : `Rp ${item.price.toLocaleString()}`}
                    </p>
                  </div>
                  <motion.a 
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                    href={`https://wa.me/${item.sellerContact.replace(/^0/, '62').replace(/\D/g, '')}?text=Halo, saya tertarik dengan ${item.title} di Bursa Warga.`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm hover:shadow-emerald-500/30"
                  >
                    <MessageCircle size={20} strokeWidth={2.5}/>
                  </motion.a>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredItems.length === 0 && (
          <div className="col-span-full py-24 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-slate-300 mx-auto mb-6 shadow-sm">
              <Search size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Tidak Ada Barang</h3>
            <p className="text-slate-400 font-medium">Coba ubah kata kunci pencarian atau kategori.</p>
          </div>
        )}
      </div>

      {/* Post Modal */}
      <Modal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} title="Pasang Iklan Baru">
        <form onSubmit={handlePostSubmit} className="space-y-6">
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl h-fit">
              <AlertCircle size={16} />
            </div>
            <p className="text-xs font-medium text-amber-800 leading-relaxed">
              Gunakan Link Google Drive untuk foto jika ukurannya besar. Pastikan link dapat diakses publik (Anyone with the link).
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Kategori Iklan</label>
              <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                {['Jual', 'Barter', 'Gratis'].map(cat => (
                  <button 
                    type="button" 
                    key={cat} 
                    onClick={() => setPostCategory(cat as any)}
                    className={`
                      flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                      ${postCategory === cat 
                        ? 'bg-white text-slate-900 shadow-md' 
                        : 'text-slate-400 hover:text-slate-600'}
                    `}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="group focus-within:ring-2 ring-indigo-500/20 rounded-2xl transition-all">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Judul Barang</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:font-medium" 
                    value={postTitle} 
                    onChange={e=>setPostTitle(e.target.value)} 
                    required 
                    placeholder="Contoh: Sepeda Lipat Polygon"
                  />
                </div>
              </div>
              
              {postCategory === 'Jual' && (
                <div className="group focus-within:ring-2 ring-indigo-500/20 rounded-2xl transition-all">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Harga (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">Rp</span>
                    <input 
                      type="number" 
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:font-medium" 
                      value={postPrice} 
                      onChange={e=>setPostPrice(e.target.value)} 
                      required
                      placeholder="0"
                    />
                  </div>
                </div>
              )}

              <div className="group focus-within:ring-2 ring-indigo-500/20 rounded-2xl transition-all">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Deskripsi & Kondisi</label>
                <textarea 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:font-medium min-h-[120px] resize-none" 
                  value={postDesc} 
                  onChange={e=>setPostDesc(e.target.value)} 
                  required 
                  placeholder="Jelaskan kondisi barang, minus, kelengkapan, dll..."
                />
              </div>
              
              <div className="group focus-within:ring-2 ring-indigo-500/20 rounded-2xl transition-all">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Link Foto / Google Drive</label>
                <div className="relative">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:font-medium" 
                    value={postImage} 
                    onChange={e=>setPostImage(e.target.value)} 
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="group focus-within:ring-2 ring-indigo-500/20 rounded-2xl transition-all">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Penjual</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:font-medium" 
                    value={postSeller} 
                    onChange={e=>setPostSeller(e.target.value)} 
                    required 
                    placeholder="Nama Anda"
                  />
                </div>
              </div>
              <div className="group focus-within:ring-2 ring-indigo-500/20 rounded-2xl transition-all">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:font-medium" 
                    value={postContact} 
                    onChange={e=>setPostContact(e.target.value)} 
                    required 
                    placeholder="08..."
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem] space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-slate-200 text-slate-600 rounded-xl">
                  <Lock size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">Verifikasi Warga</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Wajib Diisi</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Blok Rumah</label>
                  <input 
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:border-slate-400 outline-none transition-all text-center uppercase placeholder:normal-case" 
                    placeholder="Cth: C7-02" 
                    value={postHouseId} 
                    onChange={e=>setPostHouseId(e.target.value)} 
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">PIN Akses</label>
                  <div className="relative">
                    <input 
                      type={showPin ? "text" : "password"} 
                      placeholder="PIN Rumah" 
                      className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:border-slate-400 outline-none transition-all text-center placeholder:normal-case" 
                      value={accessCode} 
                      onChange={e=>setAccessCode(e.target.value)} 
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-1 transition-all">
            Tayangkan Iklan
          </Button>
        </form>
      </Modal>
    </motion.div>
  );
};
