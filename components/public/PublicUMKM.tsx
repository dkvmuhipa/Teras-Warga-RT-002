import React, { useState, useEffect } from 'react';
import { 
  Search, User, MessageCircle, MapPin, Phone, Star, Clock, Instagram, Globe, 
  Plus, ChevronRight, ExternalLink, ShoppingBag, Info, Package, Send, CheckCircle2, 
  Wrench, Store, Sparkles, ShoppingCart, Trash2, X, AlertCircle, ThumbsUp, Heart, Share2, Tag,
  ShieldCheck, Award, Briefcase, Calendar, DollarSign, Check, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { UMKM, UMKMOrder, CommunitySkill, UMKMReview, UMKMMenuItem } from '../../types';
import { SmartImage } from '../SmartImage';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  addUMKMOrderToDb, 
  subscribeToCollection, 
  addToCollection, 
  updateDocumentInCollection 
} from '../../services/databaseService';
import { formatUMKMCartOrderForWhatsApp } from '../../services/whatsappService';

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
  
  // Real-time Community Skills State
  const [communitySkills, setCommunitySkills] = useState<CommunitySkill[]>([]);
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [skillCategoryFilter, setSkillCategoryFilter] = useState('All');

  // Real-time Reviews State
  const [allReviews, setAllReviews] = useState<UMKMReview[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewHouse, setNewReviewHouse] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');

  // Cart State (Per UMKM)
  const [cart, setCart] = useState<{ [menuItemId: string]: { item: UMKMMenuItem; quantity: number } }>({});
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });

  const [skillForm, setSkillForm] = useState({
    providerName: '',
    blockName: 'Blok C',
    houseNumber: '',
    houseId: '',
    category: 'Pertukangan & Bangunan' as CommunitySkill['category'],
    title: '',
    description: '',
    phone: '',
    rateType: 'Mulai dari',
    rateInfo: '',
    experienceYears: '1 - 3 Tahun',
    workingHours: 'Fleksibel (Sesuai Janji)',
    hasWarranty: true,
    serviceArea: 'Khusus Huntap Tondo 2 & Sekitarnya',
    imageUrl: ''
  });

  useEffect(() => {
    const unsubSkills = subscribeToCollection('communitySkills', (data) => {
      setCommunitySkills(data as CommunitySkill[]);
    });
    const unsubReviews = subscribeToCollection('umkmReviews', (data) => {
      setAllReviews(data as UMKMReview[]);
    });
    return () => {
      unsubSkills();
      unsubReviews();
    };
  }, []);

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

  // Helper to check live Open/Closed Status
  const getOperatingStatus = (umkm: UMKM) => {
    if (umkm.isOpenToday === false) return { isOpen: false, label: 'Tutup Sementara', color: 'bg-rose-50 text-rose-600 border-rose-200' };
    if (umkm.isOpenAlways) return { isOpen: true, label: 'Buka 24 Jam', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    
    if (umkm.operatingHours) {
      // Try parsing like 08:00 - 21:00
      const match = umkm.operatingHours.match(/(\d{1,2})[:.](\d{2})\s*(?:-|s\/d|sampai)\s*(\d{1,2})[:.](\d{2})/);
      if (match) {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const startMins = parseInt(match[1]) * 60 + parseInt(match[2]);
        const endMins = parseInt(match[3]) * 60 + parseInt(match[4]);
        
        if (currentMins >= startMins && currentMins <= endMins) {
          return { isOpen: true, label: `Buka (s.d ${match[3]}:${match[4]})`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        } else {
          return { isOpen: false, label: `Tutup (Buka ${match[1]}:${match[2]})`, color: 'bg-slate-100 text-slate-600 border-slate-200' };
        }
      }
    }
    return { isOpen: true, label: 'Buka Hari Ini', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  // Cart operations
  const handleAddToCart = (item: UMKMMenuItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCart(prev => {
      const currentQty = prev[item.id]?.quantity || 0;
      return {
        ...prev,
        [item.id]: { item, quantity: currentQty + 1 }
      };
    });
    toast.success(`${item.name} dimasukkan ke keranjang!`);
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(prev => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      const current = prev[itemId];
      if (!current) return prev;
      const newQty = current.quantity + delta;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return {
        ...prev,
        [itemId]: { ...current, quantity: newQty }
      };
    });
  };

  const cartList = Object.values(cart);
  const cartTotal = cartList.reduce((sum, entry) => sum + (entry.item.price * entry.quantity), 0);
  const cartTotalItems = cartList.reduce((sum, entry) => sum + entry.quantity, 0);

  // Submit Order via WhatsApp & DB
  const handleCheckoutWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUMKM) return;
    if (cartList.length === 0) {
      toast.error('Keranjang belanja Anda masih kosong.');
      return;
    }
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      toast.error('Mohon lengkapi nama, nomor HP, dan alamat antar.');
      return;
    }

    try {
      const orderItemsSummary = cartList.map(c => `${c.item.name} (${c.quantity}x)`).join(', ');
      
      // Save order to Firestore
      await addToCollection('umkmOrders', {
        umkmId: selectedUMKM.id,
        umkmName: selectedUMKM.name,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerAddress: customerInfo.address,
        items: orderItemsSummary,
        totalPrice: cartTotal,
        status: 'Pending',
        orderDate: new Date().toISOString(),
        notes: customerInfo.notes
      });

      // Generate WhatsApp order message
      const waText = formatUMKMCartOrderForWhatsApp(
        selectedUMKM.owner,
        selectedUMKM.name,
        customerInfo.name,
        customerInfo.phone,
        customerInfo.address,
        cartList.map(c => ({ name: c.item.name, price: c.item.price, quantity: c.quantity })),
        cartTotal,
        customerInfo.notes
      );

      const waPhone = (selectedUMKM.contact || '6285961194621').replace(/^0/, '62').replace(/\D/g, '');
      window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`, '_blank');

      toast.success('Pesanan berhasil dibuat & dialihkan ke WhatsApp Penjual!');
      setCart({});
      setIsCartModalOpen(false);
      setIsDetailModalOpen(false);
    } catch (error) {
      toast.error('Terjadi kesalahan saat memproses pesanan.');
    }
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUMKM) return;
    if (!newReviewName || !newReviewComment) {
      toast.error('Mohon lengkapi nama dan ulasan Anda.');
      return;
    }

    try {
      await addToCollection('umkmReviews', {
        umkmId: selectedUMKM.id,
        reviewerName: newReviewName,
        reviewerHouseId: newReviewHouse || 'Warga RT 02',
        rating: newReviewRating,
        comment: newReviewComment,
        date: new Date().toISOString()
      });

      toast.success('Terima kasih! Ulasan tetangga berhasil dipublikasikan.');
      setIsReviewModalOpen(false);
      setNewReviewComment('');
      setNewReviewHouse('');
    } catch (err) {
      toast.error('Gagal mengirim ulasan.');
    }
  };

  const handleAddSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillForm.title.trim() || !skillForm.providerName.trim() || !skillForm.phone.trim()) {
      toast.error('Mohon lengkapi nama penyedia, nama layanan, dan nomor WhatsApp.');
      return;
    }

    // Susun format blok rumah yang rapi dan konsisten
    const compiledHouseId = skillForm.houseNumber.trim()
      ? `${skillForm.blockName}-${skillForm.houseNumber.trim().toUpperCase()}`
      : skillForm.houseId.trim() || skillForm.blockName;

    // Format nomor WhatsApp dengan kode negara Indonesia
    let cleanPhone = skillForm.phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone;
    }

    // Susun format tarif
    const compiledRateInfo = skillForm.rateInfo.trim()
      ? `${skillForm.rateType}: ${skillForm.rateInfo.trim()}`
      : skillForm.rateType;

    try {
      await addToCollection('communitySkills', {
        providerName: skillForm.providerName.trim(),
        houseId: compiledHouseId,
        category: skillForm.category,
        title: skillForm.title.trim(),
        description: skillForm.description.trim(),
        phone: cleanPhone,
        rateInfo: compiledRateInfo,
        experienceYears: skillForm.experienceYears,
        workingHours: skillForm.workingHours,
        hasWarranty: skillForm.hasWarranty,
        serviceArea: skillForm.serviceArea,
        imageUrl: skillForm.imageUrl.trim() || undefined,
        isAvailable: true,
        rating: 5.0,
        createdAt: new Date().toISOString()
      });
      toast.success('Keahlian & Jasa Anda berhasil dipromosikan ke seluruh warga!');
      setIsAddSkillModalOpen(false);
      setSkillForm({
        providerName: '',
        blockName: 'Blok C',
        houseNumber: '',
        houseId: '',
        category: 'Pertukangan & Bangunan',
        title: '',
        description: '',
        phone: '',
        rateType: 'Mulai dari',
        rateInfo: '',
        experienceYears: '1 - 3 Tahun',
        workingHours: 'Fleksibel (Sesuai Janji)',
        hasWarranty: true,
        serviceArea: 'Khusus Huntap Tondo 2 & Sekitarnya',
        imageUrl: ''
      });
    } catch (err) {
      toast.error('Gagal mendaftarkan jasa. Silakan coba lagi.');
    }
  };

  // Get Reviews for currently selected UMKM
  const selectedUMKMReviews = allReviews.filter(r => r.umkmId === selectedUMKM?.id);
  const avgRating = selectedUMKMReviews.length > 0 
    ? (selectedUMKMReviews.reduce((sum, r) => sum + r.rating, 0) / selectedUMKMReviews.length).toFixed(1)
    : selectedUMKM?.rating?.toFixed(1) || '5.0';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
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
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-24 font-sans text-left"
    >
      {/* Hero Header */}
      <div className="relative rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-14 mb-10 overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-4 border border-indigo-500/30 backdrop-blur-md">
            <Sparkles size={13} className="text-indigo-400" />
            Pusat Ekonomi Kreatif &amp; Jasa Tetangga
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight mb-3">
            {activeMainTab === 'umkm' ? 'Pasar & Kuliner Warga RT 02' : 'Direktori Jasa & Tukang Tetangga'}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl mb-6">
            {activeMainTab === 'umkm' 
              ? 'Beli produk segar, kuliner rumahan, dan kriya dari tetangga terdekat. Dilengkapi status buka/tutup live, keranjang belanja WhatsApp, dan rating ulasan terpercaya.'
              : 'Butuh perbaikan listrik, tukang bangunan, servis AC, katering syukuran, atau les privat? Temukan solusinya langsung dari tetangga satu RT.'}
          </p>

          {/* Main Switcher Tabs */}
          <div className="inline-flex p-1.5 bg-slate-950/70 rounded-2xl border border-slate-800 backdrop-blur-md gap-1">
            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'umkm' })}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeMainTab === 'umkm'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Store size={15} /> Produk &amp; Kuliner UMKM
            </button>
            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'jasa' })}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeMainTab === 'jasa'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wrench size={15} /> Jasa &amp; Keahlian Warga
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons & Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {(activeMainTab === 'umkm' ? categories : skillCategories).map(cat => {
            const isSelected = (activeMainTab === 'umkm' ? filterCategory : skillCategoryFilter) === cat;
            return (
              <button 
                key={cat} 
                onClick={() => activeMainTab === 'umkm' ? setFilterCategory(cat) : setSkillCategoryFilter(cat)}
                className={`
                  px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border
                  ${isSelected 
                    ? activeMainTab === 'umkm' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' : 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20' 
                    : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'}
                `}
              >
                {cat === 'All' ? 'Semua Kategori' : cat}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={activeMainTab === 'umkm' ? "Cari produk / nama toko..." : "Cari tukang, servis, les..."}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 shadow-2xs"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {activeMainTab === 'umkm' ? (
            <Button 
              onClick={() => window.open(`https://wa.me/6285961194621?text=Halo Pengurus RT, saya warga ingin mendaftarkan produk UMKM saya.`, '_blank')}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider shrink-0"
            >
              <Plus size={15} className="mr-1" /> Daftar UMKM
            </Button>
          ) : (
            <Button 
              onClick={() => setIsAddSkillModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider shrink-0"
            >
              <Plus size={15} className="mr-1" /> Promosi Jasa
            </Button>
          )}
        </div>
      </div>

      {/* Floating Floating Mini Cart Bar if items exist */}
      {cartTotalItems > 0 && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-6 py-4 rounded-3xl shadow-2xl border border-slate-700 flex items-center justify-between gap-6 max-w-lg w-[90%]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center relative">
              <ShoppingCart size={18} />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-900">
                {cartTotalItems}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Keranjang Belanja</p>
              <p className="text-sm font-black text-emerald-400">Rp {cartTotal.toLocaleString('id-ID')}</p>
            </div>
          </div>

          <button
            onClick={() => setIsCartModalOpen(true)}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            Checkout WA <ChevronRight size={15} />
          </button>
        </motion.div>
      )}

      {/* Grid of UMKM or Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {activeMainTab === 'umkm' ? (
            filteredUMKM.map(u => {
              const opStatus = getOperatingStatus(u);
              const uReviews = allReviews.filter(r => r.umkmId === u.id);
              const storeRating = uReviews.length > 0 
                ? (uReviews.reduce((sum, r) => sum + r.rating, 0) / uReviews.length).toFixed(1)
                : u.rating?.toFixed(1) || '5.0';

              return (
                <motion.div
                  key={u.id}
                  layout
                  variants={itemVariants}
                  className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* Cover Image & Live Badge */}
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      <SmartImage src={u.image} alt={u.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      
                      {/* Top Bar Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                        <span className="px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-white/95 text-slate-800 backdrop-blur-md shadow-xs border border-white/40">
                          {u.category}
                        </span>

                        <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border backdrop-blur-md shadow-xs ${opStatus.color}`}>
                          ● {opStatus.label}
                        </span>
                      </div>

                      {/* Rating pill bottom-right */}
                      <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl text-[10px] font-black bg-slate-900/80 text-amber-300 backdrop-blur-md flex items-center gap-1">
                        <Star size={12} fill="currentColor" /> {storeRating}
                        <span className="text-[8.5px] text-slate-300 font-normal">({uReviews.length || u.reviewsCount || 0})</span>
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="p-6 space-y-3">
                      <div>
                        <h3 className="font-black text-lg text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                          {u.name}
                        </h3>
                        <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                          Oleh: <span className="text-slate-700">{u.owner}</span> • Blok {u.houseId || 'RT 02'}
                        </p>
                      </div>

                      <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-2">
                        {u.description}
                      </p>

                      {/* Menu Highlights if any */}
                      {u.menuItems && u.menuItems.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 space-y-1.5">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pilihan Menu Terpopuler:</p>
                          <div className="space-y-1">
                            {u.menuItems.slice(0, 2).map((mItem) => (
                              <div key={mItem.id} className="flex items-center justify-between text-xs p-1.5 bg-slate-50 rounded-lg">
                                <span className="font-bold text-slate-800">{mItem.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-blue-600">Rp {mItem.price.toLocaleString('id-ID')}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedUMKM(u);
                                      handleAddToCart(mItem, e);
                                    }}
                                    className="p-1 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-md transition-all cursor-pointer"
                                    title="Tambah ke Keranjang"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => {
                        setSelectedUMKM(u);
                        setIsDetailModalOpen(true);
                      }}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
                    >
                      Katalog Menu
                    </Button>

                    <button
                      onClick={() => {
                        const waPhone = (u.contact || '6285961194621').replace(/^0/, '62').replace(/\D/g, '');
                        window.open(`https://wa.me/${waPhone}?text=Halo Bpk/Ibu ${u.owner} (${u.name}), saya tetangga di RT 02 ingin bertanya seputar produk Anda.`, '_blank');
                      }}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            filteredSkills.map(skill => (
              <motion.div
                key={skill.id}
                layout
                variants={itemVariants}
                className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 p-6 flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-xl text-[9px] font-black uppercase tracking-wider border border-amber-200">
                      {skill.category}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Blok {skill.houseId || 'RT 02'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-lg text-slate-900 group-hover:text-amber-600 transition-colors leading-tight">
                      {skill.title}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                      {skill.description}
                    </p>
                  </div>

                  {/* Badges Keunggulan: Garansi, Jam Terbang, Jam Siaga */}
                  {(skill.hasWarranty || skill.experienceYears || skill.workingHours) && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {skill.hasWarranty && (
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-black px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                          <ShieldCheck size={11} className="text-emerald-600" /> Bergaransi
                        </span>
                      )}
                      {skill.experienceYears && (
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-black px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                          <Award size={11} className="text-blue-600" /> {skill.experienceYears}
                        </span>
                      )}
                      {skill.workingHours && (
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-black px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                          <Clock size={11} className="text-slate-500" /> {skill.workingHours}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1.5 border border-slate-100/80 text-xs">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Penyedia Jasa (Warga)</p>
                      {skill.serviceArea && (
                        <span className="text-[9px] font-bold text-slate-400">📍 {skill.serviceArea}</span>
                      )}
                    </div>
                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                      <User size={13} className="text-slate-400" /> {skill.providerName}
                    </p>
                    {skill.rateInfo && (
                      <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-500">Estimasi Biaya</span>
                        <span className="text-xs font-black text-emerald-600">💰 {skill.rateInfo}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      const waPhone = (skill.phone || '6285961194621').replace(/\D/g, '').replace(/^0/, '62');
                      const msg = `Halo Bpk/Ibu ${skill.providerName} (Blok ${skill.houseId || 'RT 02'}), saya tetangga di RT 02 ingin menanyakan tentang jasa "${skill.title}". Apakah sedang tersedia?`;
                      window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-500/20 cursor-pointer"
                  >
                    <Phone size={14} /> Hubungi via WhatsApp
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Modal Detail UMKM, Menu Catalog, and Reviews */}
      <Modal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        title={selectedUMKM?.name || 'Detail UMKM'}
        maxWidth="max-w-2xl"
      >
        {selectedUMKM && (
          <div className="space-y-6 text-left p-1">
            {/* Store Cover Header */}
            <div className="relative h-56 rounded-3xl overflow-hidden shadow-md">
              <SmartImage src={selectedUMKM.image} alt={selectedUMKM.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end text-white">
                <div>
                  <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white mb-1 inline-block">
                    {selectedUMKM.category}
                  </span>
                  <h2 className="text-2xl font-black text-white">{selectedUMKM.name}</h2>
                  <p className="text-xs text-slate-300 font-medium">Pemilik: {selectedUMKM.owner} • Blok {selectedUMKM.houseId || selectedUMKM.address || 'RT 02'}</p>
                </div>

                <div className="flex items-center gap-1 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl text-amber-300 font-black text-sm border border-white/10">
                  <Star size={16} fill="currentColor" /> {avgRating}
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {selectedUMKM.description}
            </p>

            {/* Menu Items List & Cart Addition */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag size={14} className="text-blue-600" /> Katalog Menu &amp; Produk
                </h4>
                <span className="text-[10px] text-slate-400 font-bold">Pilih item untuk dipesan via WhatsApp</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(selectedUMKM.menuItems && selectedUMKM.menuItems.length > 0) ? (
                  selectedUMKM.menuItems.map((mItem) => {
                    const inCartQty = cart[mItem.id]?.quantity || 0;
                    return (
                      <div key={mItem.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3">
                        <div>
                          <h5 className="text-xs font-black text-slate-800">{mItem.name}</h5>
                          <p className="text-xs font-bold text-blue-600 mt-0.5">Rp {mItem.price.toLocaleString('id-ID')}</p>
                          {mItem.description && <p className="text-[10px] text-slate-400">{mItem.description}</p>}
                        </div>

                        {inCartQty > 0 ? (
                          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(mItem.id, -1)}
                              className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-700 font-black text-xs flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs font-black px-1.5">{inCartQty}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(mItem.id, 1)}
                              className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleAddToCart(mItem)}
                            className="py-1.5 px-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-xs"
                          >
                            + Tambah
                          </Button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  // Default sample item if no item list defined
                  <div className="col-span-full p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
                    <p className="text-xs text-slate-500 font-medium">Hubungi penjual langsung via WhatsApp untuk daftar menu lengkap harian.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Resident Reviews Section */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Star size={14} className="text-amber-500 fill-amber-500" /> Ulasan &amp; Rating Tetangga ({selectedUMKMReviews.length})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(true)}
                  className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} /> Beri Ulasan
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedUMKMReviews.length > 0 ? (
                  selectedUMKMReviews.map((rev) => (
                    <div key={rev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{rev.reviewerName} <span className="text-[10px] text-slate-400 font-normal">({rev.reviewerHouseId})</span></span>
                        <div className="flex text-amber-500 text-[10px]">
                          {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">"{rev.comment}"</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 font-medium text-center py-3">Belum ada ulasan untuk toko ini. Jadilah yang pertama memberi bintang!</p>
                )}
              </div>
            </div>

            {/* Direct Order or WA Action Footer */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  if (cartTotalItems > 0) {
                    setIsCartModalOpen(true);
                  } else {
                    const waPhone = (selectedUMKM.contact || '6285961194621').replace(/^0/, '62').replace(/\D/g, '');
                    window.open(`https://wa.me/${waPhone}?text=Halo Bpk/Ibu ${selectedUMKM.owner}, saya ingin memesan produk ${selectedUMKM.name}.`, '_blank');
                  }
                }}
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {cartTotalItems > 0 ? <ShoppingCart size={16} /> : <MessageCircle size={16} />}
                {cartTotalItems > 0 ? `Checkout Keranjang (${cartTotalItems} item)` : 'Chat WhatsApp Penjual'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Shopping Cart & Checkout */}
      <Modal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        title="Ringkasan Pesanan &amp; Checkout WA"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCheckoutWhatsApp} className="space-y-4 text-left p-1">
          {/* Item List Summary */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Daftar Belanja:</span>
            {cartList.map(c => (
              <div key={c.item.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/50 last:border-none">
                <div>
                  <span className="font-bold text-slate-800">{c.item.name}</span>
                  <span className="text-slate-400 font-semibold ml-1.5">x{c.quantity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-800">Rp {(c.item.price * c.quantity).toLocaleString('id-ID')}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFromCart(c.item.id)}
                    className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-black text-sm">
              <span className="text-slate-700">Total Pembayaran:</span>
              <span className="text-emerald-600 text-base">Rp {cartTotal.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Nama Pemesan</label>
            <input 
              type="text" 
              required
              value={customerInfo.name}
              onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
              placeholder="Contoh: Bpk. Irfan"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Nomor WhatsApp</label>
              <input 
                type="text" 
                required
                value={customerInfo.phone}
                onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                placeholder="0812xxxx"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Alamat Antar / Blok</label>
              <input 
                type="text" 
                required
                value={customerInfo.address}
                onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})}
                placeholder="Blok C-04"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Catatan Khusus (Opsional)</label>
            <input 
              type="text" 
              value={customerInfo.notes}
              onChange={e => setCustomerInfo({...customerInfo, notes: e.target.value})}
              placeholder="Contoh: Sambal dipisah ya bu, antar pk 12.00 WITA"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
            />
          </div>

          <Button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer">
            <Send size={15} /> Kirim Format Pesanan ke WA Penjual
          </Button>
        </form>
      </Modal>

      {/* Modal Beri Ulasan Tetangga */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={`Beri Ulasan: ${selectedUMKM?.name}`}
      >
        <form onSubmit={handleSubmitReview} className="space-y-4 text-left p-1">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Beri Bintang Kepuasan</label>
            <div className="flex gap-2 text-2xl cursor-pointer">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewReviewRating(star)}
                  className={`transition-transform hover:scale-125 ${newReviewRating >= star ? 'text-amber-500' : 'text-slate-200'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Nama Anda</label>
              <input 
                type="text" 
                required
                value={newReviewName}
                onChange={e => setNewReviewName(e.target.value)}
                placeholder="Contoh: Ibu Rina"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Hunian / Blok</label>
              <input 
                type="text" 
                value={newReviewHouse}
                onChange={e => setNewReviewHouse(e.target.value)}
                placeholder="Blok A-02"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tulis Ulasan / Rekomendasi Anda</label>
            <textarea 
              rows={3}
              required
              value={newReviewComment}
              onChange={e => setNewReviewComment(e.target.value)}
              placeholder="Masakannya enak sekali, porsi banyak dan pengantaran cepat ke rumah!"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <Button type="submit" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/20 cursor-pointer">
            Kirim Ulasan Warga
          </Button>
        </form>
      </Modal>

      {/* Modal Tambah Jasa & Keahlian Warga (Modern & Profesional) */}
      <Modal
        isOpen={isAddSkillModalOpen}
        onClose={() => setIsAddSkillModalOpen(false)}
        title="Promosikan Jasa & Keahlian Warga"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleAddSkillSubmit} className="space-y-6 text-left p-1">
          {/* Header Banner Informatif */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 border border-amber-200/70 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/25 mt-0.5">
              <Sparkles size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 tracking-tight">
                Direktori Keahlian &amp; Jasa Komunitas Warga Huntap Tondo 2
              </h4>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-1">
                Bantu tetangga memenuhi kebutuhan harian sekaligus tingkatkan pendapatan keluarga Anda. Transaksi 100% langsung antar-warga tanpa potongan komisi RT.
              </p>
            </div>
          </div>

          {/* SEKSI 1: IDENTITAS PENYEDIA & DOMISILI */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">1</span>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Identitas Penyedia &amp; Lokasi Rumah</h4>
            </div>

            <div>
              <label className="block text-[10.5px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                Nama Lengkap / Nama Panggilan <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  required
                  placeholder="Contoh: Bpk. Joko Supriyadi / Mas Rizal"
                  value={skillForm.providerName}
                  onChange={e => setSkillForm({ ...skillForm, providerName: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10.5px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                  Blok Kawasan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={skillForm.blockName}
                  onChange={e => setSkillForm({ ...skillForm, blockName: e.target.value })}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all cursor-pointer"
                >
                  <option value="Blok A">Blok A (RW 19 / RT 01)</option>
                  <option value="Blok B">Blok B (RW 19 / RT 02)</option>
                  <option value="Blok C">Blok C (RW 19 RT 03 &amp; RW 20 RT 02)</option>
                  <option value="Blok D">Blok D (RW 20 / RT 01)</option>
                  <option value="Blok E">Blok E (RW 20 / RT 03)</option>
                  <option value="Blok F">Blok F (RW 20 / RT 01 &amp; RT 03)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10.5px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                  Nomor Rumah (Opsional)
                </label>
                <input 
                  type="text"
                  placeholder="Contoh: 07 / 12B"
                  value={skillForm.houseNumber}
                  onChange={e => setSkillForm({ ...skillForm, houseNumber: e.target.value })}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs font-black text-slate-500 flex items-center gap-1">
                  <span>🇮🇩</span> +62
                </span>
                <input 
                  type="tel"
                  required
                  placeholder="812-3456-7890"
                  value={skillForm.phone.replace(/^62|^0/, '')}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setSkillForm({ ...skillForm, phone: raw });
                  }}
                  className="w-full pl-18 pr-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-1 pl-1">
                💡 Calon pelanggan tetangga akan langsung menghubungi WhatsApp ini saat memesan.
              </p>
            </div>
          </div>

          {/* SEKSI 2: KATEGORI & SPESIFIKASI LAYANAN */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-black">2</span>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Kategori &amp; Nama Keahlian</h4>
            </div>

            <div>
              <label className="block text-[10.5px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                Kategori Bidang Keahlian <span className="text-rose-500">*</span>
              </label>
              <select
                value={skillForm.category}
                onChange={e => setSkillForm({ ...skillForm, category: e.target.value as any })}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all cursor-pointer"
              >
                <option value="Pertukangan & Bangunan">🔨 Pertukangan &amp; Bangunan (Renovasi, Cat, Plafon, Keramik)</option>
                <option value="Elektronik & Kelistrikan">⚡ Elektronik &amp; Kelistrikan (Servis AC, Pompa Air, Kulkas, Lampu)</option>
                <option value="Pipa & Sanitasi">🚰 Pipa, Ledeng &amp; Sanitasi Air (Saluran Mampet, Tandon, Kran Bocor)</option>
                <option value="Pendidikan & Les">📚 Pendidikan &amp; Les Privat (Bimbel SD-SMA, Mengaji, Bahasa Asing)</option>
                <option value="Katering & Kuliner">🍲 Katering &amp; Pesanan Kuliner (Nasi Kotak, Snack Box, Tumpeng)</option>
                <option value="Kecantikan & Jahit">✂️ Jahit Pakaian, Vermak &amp; Rias Busana (Jahit Baju, Permak, MUA)</option>
                <option value="Otomotif & Transportasi">🏍️ Otomotif &amp; Kendaraan (Servis Motor Panggilan, Cuci, Ganti Oli)</option>
                <option value="IT, Komputer & Cetak">💻 Komputer, IT &amp; Desain (Install Laptop, Servis PC, Desain, Cetak)</option>
                <option value="Taman & Kebersihan">🌿 Taman &amp; Kebersihan (Potong Rumput, Pangkas Dahan, Kuras Toren)</option>
                <option value="Lainnya">🛠️ Keahlian &amp; Layanan Khusus Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-[10.5px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                Nama Layanan / Judul Promosi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Wrench size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  required
                  placeholder="Contoh: Servis AC Bergaransi, Cuci AC &amp; Pasang Instalasi Rumah"
                  value={skillForm.title}
                  onChange={e => setSkillForm({ ...skillForm, title: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                Deskripsi Lengkap Keahlian &amp; Jangkauan Layanan <span className="text-rose-500">*</span>
              </label>
              <textarea 
                rows={4}
                required
                placeholder="Jelaskan secara rinci pengalaman kerja, peralatan yang Anda gunakan, garansi pengerjaan, respon panggilan, dan keunggulan jasa Anda agar tetangga semakin yakin..."
                value={skillForm.description}
                onChange={e => setSkillForm({ ...skillForm, description: e.target.value })}
                className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* SEKSI 3: PENGALAMAN, WAKTU & JAMINAN */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">3</span>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Pengalaman, Waktu &amp; Jaminan</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10.5px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                  Pengalaman Kerja
                </label>
                <div className="relative">
                  <Award size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={skillForm.experienceYears}
                    onChange={e => setSkillForm({ ...skillForm, experienceYears: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all cursor-pointer"
                  >
                    <option value="< 1 Tahun">&lt; 1 Tahun (Pemula / Mandiri)</option>
                    <option value="1 - 3 Tahun">1 - 3 Tahun (Cukup Berpengalaman)</option>
                    <option value="3 - 5 Tahun">3 - 5 Tahun (Berpengalaman)</option>
                    <option value="> 5 Tahun">&gt; 5 Tahun (Senior / Teknisi Ahli)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                  Waktu Siaga Layanan
                </label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={skillForm.workingHours}
                    onChange={e => setSkillForm({ ...skillForm, workingHours: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all cursor-pointer"
                  >
                    <option value="Fleksibel (Sesuai Janji)">Fleksibel (Sesuai Janji / Janjian Dulu)</option>
                    <option value="Pagi & Siang (08.00 - 17.00 WITA)">Pagi &amp; Siang (08.00 - 17.00 WITA)</option>
                    <option value="Malam (Setelah Jam Kantor)">Malam Hari (Setelah Jam Kerja / 17.00+)</option>
                    <option value="Siaga Panggilan 24 Jam">Siaga Panggilan Darurat 24 Jam</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Interactive Toggle Garansi Pengerjaan */}
            <div 
              onClick={() => setSkillForm({ ...skillForm, hasWarranty: !skillForm.hasWarranty })}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                skillForm.hasWarranty 
                  ? 'bg-emerald-50/80 border-emerald-300/80 shadow-xs' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  skillForm.hasWarranty ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">Menyediakan Garansi / Jaminan Kerapian</p>
                  <p className="text-[10.5px] text-slate-500 font-medium">
                    Servis atau perbaikan ulang jika timbul kendala pasca pengerjaan
                  </p>
                </div>
              </div>

              <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                skillForm.hasWarranty 
                  ? 'bg-emerald-600 border-emerald-600 text-white' 
                  : 'border-slate-300 bg-white'
              }`}>
                {skillForm.hasWarranty && <Check size={14} className="stroke-[3]" />}
              </div>
            </div>
          </div>

          {/* SEKSI 4: TARIF & PORTOFOLIO */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
              <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-black">4</span>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Skema Tarif &amp; Portofolio (Opsional)</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10.5px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                  Tipe Tarif
                </label>
                <select
                  value={skillForm.rateType}
                  onChange={e => setSkillForm({ ...skillForm, rateType: e.target.value })}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all cursor-pointer"
                >
                  <option value="Mulai dari">Mulai dari</option>
                  <option value="Tarif Per Jam / Harian">Tarif Per Jam / Harian</option>
                  <option value="Sistem Borongan">Sistem Borongan / Paket</option>
                  <option value="Sesuai Kesepakatan">Sesuai Kesepakatan (Cek Lokasi Dulu)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10.5px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                  Nominal / Keterangan Biaya
                </label>
                <input 
                  type="text"
                  placeholder="Contoh: Rp 65.000 / cuci AC atau Menyesuaikan"
                  value={skillForm.rateInfo}
                  onChange={e => setSkillForm({ ...skillForm, rateInfo: e.target.value })}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                Link Foto Portofolio / Hasil Kerja (Opsional)
              </label>
              <input 
                type="url"
                placeholder="https://... (Link foto pengerjaan, akun Instagram usaha, atau portofolio)"
                value={skillForm.imageUrl}
                onChange={e => setSkillForm({ ...skillForm, imageUrl: e.target.value })}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddSkillModalOpen(false)}
              className="w-full sm:w-1/3 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
            >
              Batalkan
            </button>
            <Button 
              type="submit" 
              className="w-full sm:w-2/3 py-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-700 hover:to-orange-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <CheckCircle2 size={16} /> Promosikan Jasa Sekarang
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};
