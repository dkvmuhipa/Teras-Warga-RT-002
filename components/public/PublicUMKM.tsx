import React, { useState, useEffect } from 'react';
import { Search, User, MessageCircle, MapPin, Phone, Star, Clock, Instagram, Globe, Plus, ChevronRight, ExternalLink, ShoppingBag, Info, Package, Send, CheckCircle2, Wrench, Store, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { UMKM, UMKMOrder, CommunitySkill } from '../../types';
import { SmartImage } from '../SmartImage';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { addUMKMOrderToDb, subscribeToCollection, addToCollection } from '../../services/databaseService';

interface PublicUMKMProps {
  umkmData: UMKM[];
}

export const PublicUMKM: React.FC<PublicUMKMProps> = ({ umkmData }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeMainTab = searchParams.get('tab') === 'jasa' ? 'jasa' : 'umkm';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedUMKM, setSelectedUMKM] = useState<UMKM | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  // Community Skills State
  const [communitySkills, setCommunitySkills] = useState<CommunitySkill[]>([]);
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [skillCategoryFilter, setSkillCategoryFilter] = useState('All');
  const [skillForm, setSkillForm] = useState({
    providerName: '',
    houseId: '',
    category: 'Pertukangan & Bangunan' as CommunitySkill['category'],
    title: '',
    description: '',
    phone: '',
    rateInfo: ''
  });

  useEffect(() => {
    const unsubSkills = subscribeToCollection('communitySkills', (data) => {
      setCommunitySkills(data as CommunitySkill[]);
    });
    return () => unsubSkills();
  }, []);
  
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

  const skillCategories = ['All', 'Pertukangan & Bangunan', 'Elektronik & Kelistrikan', 'Pendidikan & Les', 'Katering & Kuliner', 'Kecantikan & Jahit', 'Otomotif & Transportasi', 'Lainnya'];

  const filteredSkills = communitySkills.filter(s =>
    (s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.providerName.toLowerCase().includes(searchTerm.toLowerCase())) && 
    (skillCategoryFilter === 'All' || s.category === skillCategoryFilter)
  );

  const handleAddSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillForm.title || !skillForm.providerName || !skillForm.phone) {
      toast.error('Mohon lengkapi nama penyedia, judul keahlian, dan nomor WhatsApp.');
      return;
    }

    try {
      await addToCollection('communitySkills', {
        ...skillForm,
        isAvailable: true,
        createdAt: new Date().toISOString()
      });
      toast.success('Keahlian & Jasa Anda berhasil didaftarkan di direktori warga!');
      setIsAddSkillModalOpen(false);
      setSkillForm({
        providerName: '',
        houseId: '',
        category: 'Pertukangan & Bangunan',
        title: '',
        description: '',
        phone: '',
        rateInfo: ''
      });
    } catch (err) {
      toast.error('Gagal mendaftarkan jasa. Silakan coba lagi.');
    }
  };

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
      className="max-w-7xl mx-auto px-4 py-8 mb-24 font-sans text-left"
    >
      {/* Top Banner & Main Tabs */}
      <div className="text-center mb-8">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest mb-4 border border-blue-100 shadow-xs"
        >
          <Sparkles size={14} className="text-blue-600" /> 
          Pusat Ekonomi &amp; Keahlian Warga RT 02
        </motion.div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-3">
          {activeMainTab === 'umkm' ? (
            <>Direktori UMKM <span className="text-blue-600 font-serif italic">RT 02</span></>
          ) : (
            <>Jasa &amp; Keahlian <span className="text-amber-600 font-serif italic">Warga</span></>
          )}
        </h1>
        <p className="text-slate-500 font-medium text-xs md:text-sm max-w-2xl mx-auto leading-relaxed mb-6">
          {activeMainTab === 'umkm' 
            ? 'Dukung usaha tetangga, majukan ekonomi lokal. Temukan aneka produk kuliner, kriya, dan barang kreatif buatan warga Huntap Tondo 2.'
            : 'Temukan tukang bangunan, teknisi kelistrikan/AC, guru les, penjahit, hingga katering langsung dari tetangga terdekat di lingkungan RT kita.'}
        </p>

        {/* Main Tab Switcher */}
        <div className="inline-flex p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60 shadow-xs gap-1">
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'umkm' })}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'umkm'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Store size={15} /> Produk &amp; UMKM
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'jasa' })}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'jasa'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wrench size={15} /> Jasa &amp; Keahlian Warga
          </button>
        </div>
      </div>

      {activeMainTab === 'umkm' ? (
        <>
          <div className="flex justify-center mb-8">
            <Button 
              onClick={() => window.open(`https://wa.me/6285961194621?text=Halo Pengurus RT, saya ingin mendaftarkan UMKM saya di website.`, '_blank')}
              className="bg-slate-900 hover:bg-slate-800 text-white shadow-md px-6 py-3 rounded-2xl flex items-center gap-2 text-xs uppercase tracking-wider font-black transition-all hover:scale-105 cursor-pointer"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              Daftarkan UMKM Anda
            </Button>
          </div>

          <div className="sticky top-[64px] md:top-[80px] z-30 bg-white/90 backdrop-blur-xl p-4 rounded-[2rem] border border-slate-200/50 shadow-lg shadow-slate-200/20 mb-12 flex flex-col md:flex-row justify-between items-center gap-4 transition-all">
            <div className="flex w-full md:w-auto gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setFilterCategory(cat)}
                  className={`
                    px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer
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
        </>
      ) : (
        <>
          <div className="flex justify-center mb-8">
            <Button 
              onClick={() => setIsAddSkillModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white shadow-md px-6 py-3 rounded-2xl flex items-center gap-2 text-xs uppercase tracking-wider font-black transition-all hover:scale-105 cursor-pointer"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              Promosikan Jasa / Keahlian Anda
            </Button>
          </div>

          <div className="sticky top-[64px] md:top-[80px] z-30 bg-white/90 backdrop-blur-xl p-4 rounded-[2rem] border border-slate-200/50 shadow-lg shadow-slate-200/20 mb-12 flex flex-col md:flex-row justify-between items-center gap-4 transition-all">
            <div className="flex w-full md:w-auto gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
              {skillCategories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setSkillCategoryFilter(cat)}
                  className={`
                    px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer
                    ${skillCategoryFilter === cat 
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20 scale-105' 
                      : 'bg-slate-50 text-slate-500 hover:bg-amber-50 hover:text-amber-600'}
                  `}
                >
                  {cat === 'All' ? 'Semua Jasa' : cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Cari keahlian / tukang / jasa..." 
                className="w-full pl-12 pr-6 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-amber-500 rounded-2xl text-sm font-bold outline-none transition-all placeholder:text-slate-400"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {activeMainTab === 'umkm' ? filteredUMKM.map(u => (
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
                        <p className="text-[10px] font-black text-slate-700 truncate">{u.houseId || 'RT 02'}</p>
                      </div>
                    </div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`https://wa.me/${u.contact.replace(/^0/, '62').replace(/\D/g, '')}?text=Halo, saya melihat usaha Anda di Website RT 02.`, '_blank');
                    }}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm hover:shadow-emerald-500/30 font-black text-xs uppercase tracking-widest"
                  >
                    <MessageCircle size={16} strokeWidth={2.5}/> Hubungi Penjual
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )) : (
            filteredSkills.map(skill => (
              <motion.div
                key={skill.id}
                layout
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 p-7 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-xl text-[9px] font-black uppercase tracking-wider border border-amber-200">
                      {skill.category}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Blok {skill.houseId || 'RT 02'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-xl text-slate-900 group-hover:text-amber-600 transition-colors leading-tight">
                      {skill.title}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
                      {skill.description}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl space-y-1.5 border border-slate-100/80">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Penyedia Jasa (Warga RT 02)</p>
                    <p className="text-sm font-bold text-slate-800">{skill.providerName}</p>
                    {skill.rateInfo && (
                      <p className="text-xs font-bold text-emerald-600 mt-1">💰 Tarif: {skill.rateInfo}</p>
                    )}
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-100">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const waPhone = (skill.phone || '6285961194621').replace(/\D/g, '').replace(/^0/, '62');
                      const msg = `Halo Bpk/Ibu ${skill.providerName} (Blok ${skill.houseId || 'RT 02'}), saya tetangga di RT 02 ingin menanyakan tentang jasa "${skill.title}". Apakah sedang tersedia?`;
                      window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    <Phone size={15} /> Hubungi via WhatsApp
                  </motion.button>
                </div>
              </motion.div>
            )))}
        </AnimatePresence>

        {activeMainTab === 'umkm' && filteredUMKM.length === 0 && (
          <div className="col-span-full py-24 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-slate-300 mx-auto mb-6 shadow-sm">
              <Search size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Tidak Ada UMKM</h3>
            <p className="text-slate-400 font-medium">Coba ubah kata kunci pencarian atau kategori.</p>
          </div>
        )}

        {activeMainTab === 'jasa' && filteredSkills.length === 0 && (
          <div className="col-span-full py-24 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-slate-300 mx-auto mb-6 shadow-sm">
              <Wrench size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Belum Ada Daftar Jasa</h3>
            <p className="text-slate-400 font-medium mb-4">Jadilah yang pertama mempromosikan keahlian pertukangan, servis, atau katering Anda!</p>
            <Button onClick={() => setIsAddSkillModalOpen(true)} className="bg-amber-600 text-white font-black text-xs uppercase tracking-wider">
              <Plus size={16} className="mr-1.5" /> Tambah Jasa Saya
            </Button>
          </div>
        )}
      </div>

      {/* Modal Tambah Jasa & Keahlian Warga */}
      <Modal
        isOpen={isAddSkillModalOpen}
        onClose={() => setIsAddSkillModalOpen(false)}
        title="Promosikan Jasa &amp; Keahlian Warga"
      >
        <form onSubmit={handleAddSkillSubmit} className="space-y-4">
          <p className="text-xs text-slate-500 font-medium">Daftarkan profesi, jasa pertukangan, perbaikan, bimbingan belajar, atau katering Anda agar mudah dihubungi tetangga di RT 02.</p>
          
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nama Penyedia / Kepala Keluarga</label>
            <input 
              type="text"
              required
              placeholder="Contoh: Pak Budi Santoso"
              value={skillForm.providerName}
              onChange={e => setSkillForm({ ...skillForm, providerName: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Blok Rumah</label>
              <input 
                type="text"
                required
                placeholder="Contoh: B3-12"
                value={skillForm.houseId}
                onChange={e => setSkillForm({ ...skillForm, houseId: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">No. WhatsApp</label>
              <input 
                type="tel"
                required
                placeholder="08123456789"
                value={skillForm.phone}
                onChange={e => setSkillForm({ ...skillForm, phone: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Kategori Keahlian</label>
            <select
              value={skillForm.category}
              onChange={e => setSkillForm({ ...skillForm, category: e.target.value as any })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-amber-500 focus:bg-white cursor-pointer"
            >
              {skillCategories.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nama Layanan / Keahlian</label>
            <input 
              type="text"
              required
              placeholder="Contoh: Servis AC &amp; Kelistrikan Rumah"
              value={skillForm.title}
              onChange={e => setSkillForm({ ...skillForm, title: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Deskripsi Layanan</label>
            <textarea 
              rows={3}
              required
              placeholder="Jelaskan detail keahlian, pengalaman, garansi, atau jangkauan layanan..."
              value={skillForm.description}
              onChange={e => setSkillForm({ ...skillForm, description: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-amber-500 focus:bg-white resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Estimasi Tarif / Biaya (Opsional)</label>
            <input 
              type="text"
              placeholder="Contoh: Mulai Rp 50.000 / cuci AC atau Menyesuaikan"
              value={skillForm.rateInfo}
              onChange={e => setSkillForm({ ...skillForm, rateInfo: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>

          <Button type="submit" className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-600/20 cursor-pointer">
            Daftarkan Jasa Sekarang
          </Button>
        </form>
      </Modal>

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
                  <p className="text-lg font-black text-slate-800">{selectedUMKM.houseId || selectedUMKM.address || 'RT 02'}</p>
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
