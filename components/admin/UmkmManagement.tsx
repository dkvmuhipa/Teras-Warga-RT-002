import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, User, MessageCircle, Store, Tag, MapPin, Phone, Upload, ShoppingBag, Clock, CheckCircle2, XCircle, Package, Instagram, Link as LinkIcon, Loader2, Sparkles, ShieldCheck, DollarSign, Award, Star } from 'lucide-react';
import { UMKM, UMKMOrder } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { 
  addUMKMToDb, 
  updateUMKMInDb, 
  deleteUMKMFromDb, 
  uploadImageToStorage,
  subscribeToUMKMOrders,
  updateUMKMOrderStatus,
  handleFirestoreError,
  OperationType,
  isFirebaseConfigured
} from '../../services/databaseService';
import { generateAnnouncementDraft } from '../../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useConfirm } from '../../context/ConfirmContext';

interface UmkmManagementProps {
  umkm: UMKM[];
}

export const UmkmManagement: React.FC<UmkmManagementProps> = ({ umkm }) => {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<'list' | 'orders'>('list');
  const [orders, setOrders] = useState<UMKMOrder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchUmkm, setSearchUmkm] = useState('');
  const [editingUmkmId, setEditingUmkmId] = useState<string | null>(null);
  
  // Enhanced Form State
  const [umkmForm, setUmkmForm] = useState({ 
    name: '', 
    owner: '', 
    category: 'Kuliner', 
    contact: '', 
    image: '', 
    description: '',
    houseId: '',
    address: 'Wilayah RT 02 Palu',
    operatingHours: '08:00 - 21:00 WITA',
    priceRange: 'Rp 10.000 - Rp 50.000',
    featuredProduct: '',
    isVerified: true,
    rating: 5,
    gallery: [] as string[],
    socialMedia: [] as { platform: 'Instagram' | 'Facebook' | 'TikTok', url: string }[]
  });
  const [imageType, setImageType] = useState<'upload' | 'link'>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [galleryInput, setGalleryInput] = useState('');
  const [igUrl, setIgUrl] = useState('');
  const [ttUrl, setTtUrl] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToUMKMOrders(setOrders);
    return () => unsubscribe();
  }, []);

  const resetForms = () => {
    setUmkmForm({ 
      name: '', 
      owner: '', 
      category: 'Kuliner', 
      contact: '', 
      image: '', 
      description: '',
      houseId: '',
      address: 'Wilayah RT 02 Palu',
      operatingHours: '08:00 - 21:00 WITA',
      priceRange: 'Rp 10.000 - Rp 50.000',
      featuredProduct: '',
      isVerified: true,
      rating: 5,
      gallery: [],
      socialMedia: []
    });
    setGalleryInput('');
    setIgUrl('');
    setTtUrl('');
    setImageFile(null);
    setImageType('upload');
    setEditingUmkmId(null);
  };

  const openEditUMKM = (u: UMKM) => {
    setEditingUmkmId(u.id);
    setUmkmForm({
      name: u.name,
      owner: u.owner,
      category: u.category,
      contact: u.contact,
      image: u.image || '',
      description: u.description || '',
      houseId: u.houseId || '',
      address: u.address || 'Wilayah RT 02 Palu',
      operatingHours: u.operatingHours || '08:00 - 21:00 WITA',
      priceRange: u.priceRange || 'Rp 10.000 - Rp 50.000',
      featuredProduct: u.featuredProduct || '',
      isVerified: u.isVerified ?? true,
      rating: u.rating || 5,
      gallery: u.gallery || [],
      socialMedia: u.socialMedia || []
    });
    setGalleryInput(u.gallery?.join(', ') || '');
    setIgUrl(u.socialMedia?.find(s => s.platform === 'Instagram')?.url || '');
    setTtUrl(u.socialMedia?.find(s => s.platform === 'TikTok')?.url || '');
    setImageType('link');
    setIsModalOpen(true);
  };

  const handleGenerateWithAi = async () => {
    if (!umkmForm.name) return toast.error('Masukkan nama usaha UMKM terlebih dahulu');
    setIsAiLoading(true);
    try {
      const prompt = `Usaha UMKM Warga: ${umkmForm.name}, Kategori: ${umkmForm.category}, Produk Unggulan: ${umkmForm.featuredProduct || 'Aneka Pilihan'}`;
      const draft = await generateAnnouncementDraft(prompt, 'UMKM');
      setUmkmForm(prev => ({ ...prev, description: draft }));
      toast.success('Deskripsi promosi usaha AI berhasil disusun!');
    } catch (error) {
      toast.error('Gagal menyusun deskripsi AI.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmitUMKM = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let finalImageUrl = umkmForm.image;
      if (imageType === 'upload' && imageFile) {
        finalImageUrl = await uploadImageToStorage(imageFile, `umkm/${Date.now()}_${imageFile.name}`);
      }

      const socialMedia = [];
      if (igUrl) socialMedia.push({ platform: 'Instagram' as const, url: igUrl });
      if (ttUrl) socialMedia.push({ platform: 'TikTok' as const, url: ttUrl });

      const data = { 
        ...umkmForm, 
        image: finalImageUrl,
        gallery: galleryInput.split(',').map(s => s.trim()).filter(s => s !== ''),
        socialMedia
      };

      if (editingUmkmId) {
        await updateUMKMInDb(editingUmkmId, data);
        toast.success('Profil UMKM Warga berhasil diperbarui!');
      } else {
        await addUMKMToDb(data);
        toast.success('Usaha UMKM Warga berhasil didaftarkan!', { icon: '🛍️' });
      }
      setIsModalOpen(false);
      resetForms();
    } catch (error) {
      handleFirestoreError(error, editingUmkmId ? OperationType.UPDATE : OperationType.CREATE, "umkm");
      toast.error('Gagal menyimpan data UMKM.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteUMKM = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Data UMKM',
      message: 'Apakah Anda yakin ingin menghapus data UMKM ini? Tindakan ini tidak dapat dibatalkan.',
      confirmLabel: 'Hapus Permanen',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await deleteUMKMFromDb(id);
        toast.success('Data UMKM berhasil dihapus.');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `umkm/${id}`);
        toast.error('Gagal menghapus data UMKM.');
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: UMKMOrder['status']) => {
    try {
      await updateUMKMOrderStatus(orderId, status);
      toast.success(`Status pesanan diperbarui menjadi ${status}`);
    } catch (error) {
      toast.error('Gagal memperbarui status pesanan.');
    }
  };

  const filteredUmkm = umkm.filter((u: UMKM) => 
    u.name.toLowerCase().includes(searchUmkm.toLowerCase()) || 
    u.owner.toLowerCase().includes(searchUmkm.toLowerCase()) ||
    (u.featuredProduct && u.featuredProduct.toLowerCase().includes(searchUmkm.toLowerCase()))
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-pink-600 rounded-full"></div>
            <span className="text-[10px] font-black text-pink-600 uppercase tracking-widest">Pemberdayaan Ekonomi Lokal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">Bursa UMKM Warga RT 02</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Katalog produk lokal warga, pemesanan produk rumah tangga, dan pemberdayaan usaha.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex p-1 bg-slate-100 rounded-2xl">
            <button 
              onClick={() => setActiveTab('list')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Katalog UMKM
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Pesanan ({orders.filter(o => o.status === 'Pending').length})
            </button>
          </div>

          {activeTab === 'list' && (
            <Button 
              onClick={() => { resetForms(); setIsModalOpen(true); }} 
              className="w-full sm:w-auto px-6 py-3.5 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-pink-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Daftarkan UMKM
            </Button>
          )}
        </div>
      </div>

      {activeTab === 'list' ? (
        <>
          <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-xs">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Cari nama toko, pemilik, atau produk unggulan warga..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-pink-500/20 focus:bg-white focus:border-pink-500 outline-none transition-all"
                value={searchUmkm}
                onChange={(e) => setSearchUmkm(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500 transition-colors" size={18} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredUmkm.length > 0 ? (
                filteredUmkm.map((u: UMKM) => (
                  <motion.div 
                    key={u.id} 
                    variants={itemVariants}
                    layout
                    className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xs hover:shadow-xl hover:shadow-pink-100/30 transition-all group overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-48 bg-slate-100 relative overflow-hidden">
                        <img 
                          src={u.image || `https://picsum.photos/seed/${u.name}/800/600`} 
                          alt={u.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span className="absolute top-4 left-4 px-3 py-1 bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-xl border border-white/20">
                          {u.category}
                        </span>

                        {u.houseId && (
                          <span className="absolute bottom-3 left-4 px-2.5 py-0.5 bg-pink-600/90 backdrop-blur-xs text-white text-[8.5px] font-black rounded-md flex items-center gap-1">
                            📍 Blok {u.houseId}
                          </span>
                        )}

                        <div className="absolute top-4 right-4 flex gap-1">
                          <button onClick={() => openEditUMKM(u)} className="p-2 bg-white/90 backdrop-blur-md text-slate-700 hover:text-pink-600 rounded-xl transition-all shadow-sm" title="Edit Profil UMKM"><Edit2 size={15} /></button>
                          <button onClick={() => handleDeleteUMKM(u.id)} className="p-2 bg-white/90 backdrop-blur-md text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm" title="Hapus UMKM"><Trash2 size={15} /></button>
                        </div>
                      </div>

                      <div className="p-6 space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                          <span className="flex items-center gap-1"><User size={12}/> {u.owner}</span>
                          <span className="text-amber-500 flex items-center gap-0.5"><Star size={12} className="fill-amber-400" /> 5.0</span>
                        </div>

                        <h3 className="text-xl font-black text-slate-900 leading-snug group-hover:text-pink-600 transition-colors line-clamp-1">
                          {u.name}
                        </h3>

                        {u.featuredProduct && (
                          <p className="text-xs font-bold text-pink-600 flex items-center gap-1">
                            ✨ Unggulan: {u.featuredProduct}
                          </p>
                        )}

                        <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                          {u.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 pt-0 flex items-center justify-between border-t border-slate-50 mt-4 text-xs font-bold text-slate-600">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock size={12} /> {u.operatingHours || '08:00 - 21:00'}
                      </div>

                      <a 
                        href={`https://wa.me/${u.contact.replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-[11px] font-black transition-all"
                      >
                        <MessageCircle size={14} /> Hubungi WhatsApp
                      </a>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-16 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-xs">
                    <Store size={40} />
                  </div>
                  <p className="text-slate-400 font-bold text-lg">Belum ada UMKM yang terdaftar.</p>
                  <p className="text-slate-400 text-xs mt-1">Klik "Daftarkan UMKM" untuk mempromosikan produk warga RT 02.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {orders.length > 0 ? (
            orders.map(o => (
              <div key={o.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">#{o.id.slice(-6)}</span>
                    <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                      o.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {o.status}
                    </span>
                  </div>
                  <h4 className="font-black text-slate-900 text-base">{o.umkmName || 'Produk UMKM Warga'}</h4>
                  <p className="text-xs text-slate-500 font-medium">Pemesan: {o.customerName} (Blok {o.houseId}) • WA: {o.customerPhone}</p>
                  <p className="text-xs font-bold text-slate-700 mt-2">
                    Item: {typeof o.items === 'string' ? o.items : o.items.map((item: any) => `${item.name} (x${item.quantity})`).join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right mr-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Bayar</span>
                    <span className="text-lg font-black text-emerald-600">Rp {(o.totalPrice || o.totalAmount || 0).toLocaleString('id-ID')}</span>
                  </div>

                  {o.status === 'Pending' && (
                    <Button onClick={() => handleUpdateOrderStatus(o.id, 'Completed')} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs py-2 px-4">
                      Tandai Selesai
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <ShoppingBag size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-bold">Belum ada riwayat pesanan marketplace.</p>
            </div>
          )}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingUmkmId ? "Edit Profil UMKM Warga" : "Daftarkan UMKM Warga Baru"}
        maxWidth="max-w-5xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleSubmitUMKM} className="lg:col-span-7 space-y-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Nama Usaha / Toko</label>
              <input 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all" 
                value={umkmForm.name} 
                onChange={e=>setUmkmForm({...umkmForm, name: e.target.value})} 
                placeholder="Contoh: Dapur Mama RT 02 / Katering Berkah..." 
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Nama Pemilik Usaha</label>
                <input 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all" 
                  value={umkmForm.owner} 
                  onChange={e=>setUmkmForm({...umkmForm, owner: e.target.value})} 
                  placeholder="Nama pemilik usaha..." 
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Kategori Kemitraan</label>
                <select 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all cursor-pointer" 
                  value={umkmForm.category} 
                  onChange={e=>setUmkmForm({...umkmForm, category: e.target.value})}
                >
                  <option value="Kuliner">🍲 Kuliner & Makanan</option>
                  <option value="Jasa">🛠️ Jasa & Layanan</option>
                  <option value="Retail">🏪 Toko Kelontong / Retail</option>
                  <option value="Fashion">👕 Pakaian & Fashion</option>
                  <option value="Kerajinan">🎨 Kerajinan & Handcraft</option>
                  <option value="Lainnya">📌 Lainnya</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Produk Unggulan</label>
                <input 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all" 
                  value={umkmForm.featuredProduct} 
                  onChange={e=>setUmkmForm({...umkmForm, featuredProduct: e.target.value})} 
                  placeholder="Contoh: Nasi Kuning Khas Palu / Kue Nastar" 
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Kisaran Harga (Price Range)</label>
                <input 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all" 
                  value={umkmForm.priceRange} 
                  onChange={e=>setUmkmForm({...umkmForm, priceRange: e.target.value})} 
                  placeholder="Contoh: Rp 10.000 - Rp 50.000" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">WhatsApp Bisnis / Kontak</label>
                <input 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all" 
                  value={umkmForm.contact} 
                  onChange={e=>setUmkmForm({...umkmForm, contact: e.target.value})} 
                  placeholder="08123456789" 
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Jam Operasional & ID Blok</label>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all" 
                    value={umkmForm.operatingHours} 
                    onChange={e=>setUmkmForm({...umkmForm, operatingHours: e.target.value})} 
                    placeholder="08:00 - 21:00"
                  />
                  <input 
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all" 
                    value={umkmForm.houseId} 
                    onChange={e=>setUmkmForm({...umkmForm, houseId: e.target.value})} 
                    placeholder="Blok (Contoh: A-12)"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Deskripsi Layanan & Promosi</label>
                <button 
                  type="button" 
                  onClick={handleGenerateWithAi} 
                  className="inline-flex items-center gap-1.5 bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200/70 text-[11px] font-black py-1.5 px-3 rounded-full transition-all shrink-0 active:scale-95"
                >
                  {isAiLoading ? (
                    <Sparkles size={13} className="animate-spin text-pink-600" />
                  ) : (
                    <Sparkles size={13} className="text-pink-600 animate-pulse" />
                  )}
                  <span>{isAiLoading ? 'Menyusun Draft...' : 'Bantu Tulis Promosi AI'}</span>
                </button>
              </div>
              <textarea 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all min-h-[100px] resize-none" 
                rows={4} 
                value={umkmForm.description} 
                onChange={e=>setUmkmForm({...umkmForm, description: e.target.value})} 
                placeholder="Ceritakan detail keunggulan produk/jasa yang ditawarkan..." 
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Link Foto Sampul / Banner Bisnis</label>
              <input 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all" 
                value={umkmForm.image} 
                onChange={e=>setUmkmForm({...umkmForm, image: e.target.value})} 
                placeholder="https://images.unsplash.com/... (URL Foto Banner)" 
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <Button type="submit" className="w-full py-3.5 text-xs font-black uppercase tracking-wider rounded-2xl bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-600/20 flex justify-center items-center gap-2 group/submit" disabled={isUploading}>
                {isUploading ? (
                  <><Loader2 size={16} className="animate-spin" /> Sedang Mengunggah...</>
                ) : editingUmkmId ? (
                  <>Simpan Perubahan UMKM <CheckCircle2 size={16} className="group-hover/submit:scale-110 transition-transform" /></>
                ) : (
                  <>Daftarkan Profil UMKM <Store size={16} className="group-hover/submit:scale-110 transition-transform" /></>
                )}
              </Button>
            </div>
          </form>

          <div className="lg:col-span-5 hidden lg:flex flex-col bg-slate-900 rounded-[2.5rem] p-5 text-white border border-slate-800 shadow-xl justify-between min-h-[500px]">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-ping" />
                  <span className="text-[10px] font-mono text-pink-400 font-bold uppercase tracking-widest">LIVE SHOP CARD MOCKUP</span>
                </div>
                <Store size={15} className="text-pink-400" />
              </div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-3">Tampilan Katalog Usaha di Layar Warga:</p>
              
              <div className="bg-white text-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between">
                <div className="relative h-36 bg-slate-100">
                  {umkmForm.image ? (
                    <img src={umkmForm.image} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <Store size={36} />
                      <span className="text-[9px] font-bold text-slate-400 mt-1">Pratinjau Foto Usaha</span>
                    </div>
                  )}
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 bg-slate-900/80 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest rounded-lg">
                    {umkmForm.category}
                  </span>
                  {umkmForm.houseId && (
                    <span className="absolute bottom-2.5 left-3 px-2 py-0.5 bg-pink-600 text-white text-[8px] font-bold rounded-md">
                      📍 Blok {umkmForm.houseId}
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold">
                    <span>👤 {umkmForm.owner || 'Pemilik Usaha'}</span>
                    <span className="text-amber-500 font-bold">★ 5.0 (TERVERIFIKASI)</span>
                  </div>

                  <h4 className="font-black text-base text-slate-900 leading-snug">
                    {umkmForm.name || '[Nama Usaha / Toko Warga]'}
                  </h4>

                  {umkmForm.featuredProduct && (
                    <p className="text-[10px] font-bold text-pink-600">
                      ✨ Unggulan: {umkmForm.featuredProduct}
                    </p>
                  )}

                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                    {umkmForm.description || '[Uraian promosi usaha akan tampil di sini...]'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[9.5px] font-bold text-slate-600">
                  <span>💰 {umkmForm.priceRange || 'Harga Terjangkau'}</span>
                  <span className="text-emerald-600 font-black flex items-center gap-1">
                    <MessageCircle size={12} /> WA SEKARANG
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[9.5px] text-slate-400 font-medium text-center leading-normal">
              Profil usaha warga otomatis tampil di direktori marketplace seluruh warga RT 02 Palu.
            </div>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};
