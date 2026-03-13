import React, { useState } from 'react';
import { Search, User, MessageCircle, MapPin, Phone, Star, Clock, Instagram, Globe, Plus, ChevronRight, ExternalLink, ShoppingBag, Info, Package, Send, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UMKM, UMKMOrder } from '../../types';
import { SmartImage } from '../SmartImage';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { addUMKMOrderToDb } from '../../services/databaseService';

interface PublicUMKMProps {
  umkmData: UMKM[];
}

export const PublicUMKM: React.FC<PublicUMKMProps> = ({ umkmData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedUMKM, setSelectedUMKM] = useState<UMKM | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    items: '',
    notes: ''
  });

  const categories = ['All', 'Kuliner', 'Jasa', 'Fashion', 'Retail', 'Kerajinan', 'Lainnya'];
  
  const filteredUMKM = umkmData.filter(u => 
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.description.toLowerCase().includes(searchTerm.toLowerCase())) && 
    (filterCategory === 'All' || u.category === filterCategory)
  );

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUMKM) return;

    const newOrder: Omit<UMKMOrder, 'id'> = {
      umkmId: selectedUMKM.id,
      umkmName: selectedUMKM.name,
      customerName: orderForm.customerName,
      customerPhone: orderForm.customerPhone,
      customerAddress: orderForm.customerAddress,
      houseId: orderForm.customerAddress, // Using address as houseId for now
      items: orderForm.items,
      totalPrice: 0, 
      status: 'Pending',
      orderDate: new Date().toISOString(),
      notes: orderForm.notes
    };

    await addUMKMOrderToDb(newOrder);
    setOrderSuccess(true);
    setTimeout(() => {
      setOrderSuccess(false);
      setIsOrderModalOpen(false);
      setOrderForm({ customerName: '', customerPhone: '', customerAddress: '', items: '', notes: '' });
    }, 3000);
  };

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
        <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto leading-relaxed mb-8">
          Dukung usaha tetangga, majukan ekonomi warga. Temukan berbagai produk dan jasa menarik di lingkungan kita.
        </p>
        <div className="flex justify-center">
          <Button 
            onClick={() => window.open(`https://wa.me/628123456789?text=Halo Pengurus RT, saya ingin mendaftarkan UMKM saya di website.`, '_blank')}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 px-8 py-4 rounded-2xl flex items-center gap-2 group transition-all hover:scale-105"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            Daftarkan UMKM Anda
          </Button>
        </div>
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
              onClick={() => { setSelectedUMKM(u); setIsDetailModalOpen(true); }}
              className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500 overflow-hidden flex flex-col cursor-pointer"
            >
              <div className="relative h-56 bg-slate-100 overflow-hidden">
                <SmartImage 
                  src={u.image} 
                  alt={u.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                  <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md border border-white/20 bg-white/90 text-slate-800">
                    {u.category}
                  </span>
                  {u.rating && (
                    <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md border border-white/20 bg-amber-400 text-white flex items-center gap-1">
                      <Star size={10} fill="currentColor" /> {u.rating}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <p className="text-white text-xs font-bold flex items-center gap-2">
                    Klik untuk detail <ChevronRight size={14} />
                  </p>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <div className="mb-6">
                  <h3 className="font-black text-xl text-slate-900 line-clamp-1 leading-tight mb-2 group-hover:text-blue-700 transition-colors">
                    {u.name}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed font-medium">
                    {u.description}
                  </p>
                </div>
                
                <div className="mt-auto space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
                      <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm">
                        <User size={12} strokeWidth={2.5}/>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Pemilik</p>
                        <p className="text-[10px] font-black text-slate-700 truncate">{u.owner}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
                      <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm">
                        <MapPin size={12} strokeWidth={2.5}/>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Lokasi</p>
                        <p className="text-[10px] font-black text-slate-700 truncate">{u.houseId || 'RT 002'}</p>
                      </div>
                    </div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`https://wa.me/${u.contact.replace(/^0/, '62').replace(/\D/g, '')}?text=Halo, saya melihat usaha Anda di Website RT 002.`, '_blank');
                    }}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm hover:shadow-emerald-500/30 font-black text-xs uppercase tracking-widest"
                  >
                    <MessageCircle size={16} strokeWidth={2.5}/> Hubungi Penjual
                  </motion.button>
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

      <Modal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        title="Detail UMKM"
      >
        {selectedUMKM && (
          <div className="space-y-8">
            <div className="relative h-64 rounded-[2rem] overflow-hidden shadow-xl">
              <SmartImage src={selectedUMKM.image} alt={selectedUMKM.name} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4">
                <span className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg backdrop-blur-md border border-white/20 bg-white/90 text-slate-800">
                  {selectedUMKM.category}
                </span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedUMKM.name}</h2>
                {selectedUMKM.rating && (
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                    <Star size={18} fill="currentColor" />
                    <span className="font-black text-lg">{selectedUMKM.rating}</span>
                    <span className="text-xs font-bold text-amber-400">({selectedUMKM.reviewsCount || 0})</span>
                  </div>
                )}
              </div>
              <p className="text-slate-500 font-medium leading-relaxed text-lg">
                {selectedUMKM.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pemilik Usaha</p>
                  <p className="text-lg font-black text-slate-800">{selectedUMKM.owner}</p>
                </div>
              </div>
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lokasi / Alamat</p>
                  <p className="text-lg font-black text-slate-800">{selectedUMKM.houseId || selectedUMKM.address || 'RT 002'}</p>
                </div>
              </div>
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-amber-600 shadow-sm">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jam Operasional</p>
                  <p className="text-lg font-black text-slate-800">{selectedUMKM.operatingHours || '08:00 - 20:00'}</p>
                </div>
              </div>
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</p>
                  <p className="text-lg font-black text-slate-800">{selectedUMKM.category}</p>
                </div>
              </div>
            </div>

            {selectedUMKM.gallery && selectedUMKM.gallery.length > 0 && (
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Galeri Produk</h4>
                <div className="grid grid-cols-3 gap-4">
                  {selectedUMKM.gallery.map((img, i) => (
                    <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm group">
                      <SmartImage src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                onClick={() => setIsOrderModalOpen(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest"
              >
                <ShoppingBag size={20} /> Pesan Sekarang
              </Button>
              <Button 
                onClick={() => window.open(`https://wa.me/${selectedUMKM.contact.replace(/^0/, '62').replace(/\D/g, '')}?text=Halo, saya tertarik dengan produk ${selectedUMKM.name}.`, '_blank')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-200 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest"
              >
                <MessageCircle size={20} /> Hubungi via WhatsApp
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title={`Pesan dari ${selectedUMKM?.name}`}
      >
        {orderSuccess ? (
          <div className="py-12 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-900">Pesanan Terkirim!</h3>
            <p className="text-slate-500 font-medium">Terima kasih telah mendukung UMKM warga. Penjual akan segera menghubungi Anda.</p>
          </div>
        ) : (
          <form onSubmit={handleOrderSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nama Lengkap</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  value={orderForm.customerName}
                  onChange={e => setOrderForm({...orderForm, customerName: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nomor WhatsApp</label>
                <input 
                  required
                  type="tel" 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  value={orderForm.customerPhone}
                  onChange={e => setOrderForm({...orderForm, customerPhone: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Alamat / Blok Rumah</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  value={orderForm.customerAddress}
                  onChange={e => setOrderForm({...orderForm, customerAddress: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Pesanan (Item & Jumlah)</label>
                <textarea 
                  required
                  rows={3}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none"
                  placeholder="Contoh: 2 Nasi Goreng, 1 Es Teh"
                  value={orderForm.items}
                  onChange={e => setOrderForm({...orderForm, items: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Catatan Tambahan (Opsional)</label>
                <input 
                  type="text" 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  value={orderForm.notes}
                  onChange={e => setOrderForm({...orderForm, notes: e.target.value})}
                />
              </div>
            </div>

            <Button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200"
            >
              <Send size={20} /> Kirim Pesanan
            </Button>
          </form>
        )}
      </Modal>
    </motion.div>
  );
};
