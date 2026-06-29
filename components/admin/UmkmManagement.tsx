import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, User, MessageCircle, Store, Tag, MapPin, Phone, Upload, ShoppingBag, Clock, CheckCircle2, XCircle, Package, Instagram, Link as LinkIcon, Loader2 } from 'lucide-react';
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
  
  // Form State
  const [umkmForm, setUmkmForm] = useState({ 
    name: '', 
    owner: '', 
    category: 'Kuliner', 
    contact: '', 
    image: '', 
    description: '',
    houseId: '',
    address: '',
    operatingHours: '',
    rating: 0,
    gallery: [] as string[],
    socialMedia: [] as { platform: 'Instagram' | 'Facebook' | 'TikTok', url: string }[]
  });
  const [imageType, setImageType] = useState<'upload' | 'link'>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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
      address: '',
      operatingHours: '',
      rating: 0,
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
      address: u.address || '',
      operatingHours: u.operatingHours || '',
      rating: u.rating || 0,
      gallery: u.gallery || [],
      socialMedia: u.socialMedia || []
    });
    setGalleryInput(u.gallery?.join(', ') || '');
    setIgUrl(u.socialMedia?.find(s => s.platform === 'Instagram')?.url || '');
    setTtUrl(u.socialMedia?.find(s => s.platform === 'TikTok')?.url || '');
    setImageType('link');
    setIsModalOpen(true);
  };

  const handleSaveUMKM = async (e: React.FormEvent) => {
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
      } else {
        await addUMKMToDb(data);
      }
      toast.success('Data UMKM berhasil disimpan!');
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
      confirmLabel: 'Hapus',
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
      toast.success('Status pesanan diperbarui.');
    } catch (error) {
      console.error(error);
      toast.error('Gagal memperbarui status pesanan.');
    }
  };

  const filteredUmkm = umkm.filter((u: UMKM) => 
    u.name.toLowerCase().includes(searchUmkm.toLowerCase()) || 
    u.owner.toLowerCase().includes(searchUmkm.toLowerCase())
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
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Marketplace <span className="text-indigo-600 italic font-serif">Warga</span></h2>
          <p className="text-slate-500 font-medium mt-1">Kelola data usaha dan pesanan marketplace lingkungan.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex p-1 bg-slate-100 rounded-2xl">
            <button 
              onClick={() => setActiveTab('list')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Daftar UMKM
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Pesanan ({orders.filter(o => o.status === 'Pending').length})
            </button>
          </div>
          {activeTab === 'list' && (
            <Button onClick={() => { resetForms(); setIsModalOpen(true); }} className="shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 shadow-lg transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
              <Plus size={18} className="mr-2"/> Tambah UMKM
            </Button>
          )}
        </div>
      </div>

      {activeTab === 'list' ? (
        <>
          <div className="relative max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Cari UMKM atau pemilik..." 
              className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm" 
              value={searchUmkm} 
              onChange={(e) => setSearchUmkm(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredUmkm.length > 0 ? (
                filteredUmkm.map((u: UMKM) => (
                  <motion.div 
                    key={u.id} 
                    variants={itemVariants}
                    layout
                    className="bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all group relative flex flex-col"
                  >
                    <div className="h-56 bg-slate-100 relative overflow-hidden">
                      <img 
                        src={u.image || `https://picsum.photos/seed/${u.name}/800/600`} 
                        alt={u.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${u.name}&background=random&size=256`;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                      
                      <div className="absolute top-6 left-6">
                        <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md text-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                          <Tag size={12} className="text-indigo-600" />
                          {u.category}
                        </span>
                      </div>

                      <div className="absolute top-6 right-6 flex flex-col gap-2 translate-x-16 group-hover:translate-x-0 transition-transform duration-300">
                        <button onClick={() => openEditUMKM(u)} className="p-3 bg-white/90 backdrop-blur-md text-slate-600 hover:text-indigo-600 rounded-2xl shadow-lg transition-all hover:scale-110"><Edit2 size={18}/></button>
                        <button onClick={() => handleDeleteUMKM(u.id)} className="p-3 bg-white/90 backdrop-blur-md text-slate-600 hover:text-rose-600 rounded-2xl shadow-lg transition-all hover:scale-110"><Trash2 size={18}/></button>
                      </div>
                    </div>

                    <div className="p-8 flex-1 flex flex-col">
                      <h3 className="font-black text-slate-800 text-2xl leading-tight mb-3 group-hover:text-indigo-600 transition-colors tracking-tight">{u.name}</h3>
                      
                      <div className="flex items-center gap-3 text-slate-500 text-xs font-black uppercase tracking-widest mb-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <User size={14} />
                        </div>
                        {u.owner}
                      </div>
                      
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-6 font-medium italic">"{u.description}"</p>

                      <div className="mt-auto space-y-4 pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner">
                            <Phone size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</span>
                            <span className="font-black text-slate-700 tracking-tight">{u.contact}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div key="empty-umkm" variants={itemVariants} className="col-span-full py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mx-auto mb-8">
                    <Store size={48} />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Belum Ada Data UMKM</h4>
                  <p className="text-slate-400 font-medium max-w-xs mx-auto text-sm">Silakan tambah data usaha warga untuk menghidupkan marketplace lingkungan.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence mode="popLayout">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <motion.div 
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-8 items-start lg:items-center"
                  >
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-3xl ${
                          order.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                          order.status === 'Processing' ? 'bg-blue-50 text-blue-600' :
                          order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                          'bg-rose-50 text-rose-600'
                        }`}>
                          <ShoppingBag size={24} />
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-slate-900 tracking-tight">{order.customerName}</h4>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={12} /> {new Date(order.createdAt || order.orderDate).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Item Pesanan</p>
                          <p className="text-sm font-bold text-slate-700">
                            {typeof order.items === 'string' 
                              ? order.items 
                              : order.items.map(item => `${item.name} (${item.quantity}x)`).join(', ')}
                          </p>
                        </div>
                        <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Alamat Pengiriman</p>
                          <p className="text-sm font-bold text-slate-700">{order.customerAddress}</p>
                        </div>
                      </div>

                      {order.notes && (
                        <div className="p-5 bg-indigo-50/50 rounded-[2rem] border border-indigo-100">
                          <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Catatan Tambahan</p>
                          <p className="text-xs font-medium text-slate-600 italic">"{order.notes}"</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-48">
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Status Pesanan</p>
                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-center ${
                          order.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                          order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {order.status}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {order.status === 'Pending' && (
                          <button 
                            onClick={() => handleUpdateOrderStatus(order.id, 'Processing')}
                            className="flex-1 p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center"
                            title="Proses Pesanan"
                          >
                            <Package size={18} />
                          </button>
                        )}
                        {order.status === 'Processing' && (
                          <button 
                            onClick={() => handleUpdateOrderStatus(order.id, 'Completed')}
                            className="flex-1 p-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center"
                            title="Selesaikan Pesanan"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
                        {order.status !== 'Cancelled' && order.status !== 'Completed' && (
                          <button 
                            onClick={() => handleUpdateOrderStatus(order.id, 'Cancelled')}
                            className="flex-1 p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center"
                            title="Batalkan Pesanan"
                          >
                            <XCircle size={18} />
                          </button>
                        )}
                      </div>
                      
                      <a 
                        href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                      >
                        <MessageCircle size={14} /> Hubungi Pembeli
                      </a>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div key="empty-orders" className="py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mx-auto mb-8">
                    <ShoppingBag size={48} />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Belum Ada Pesanan</h4>
                  <p className="text-slate-400 font-medium max-w-xs mx-auto text-sm">Pesanan dari marketplace warga akan muncul di sini untuk dikelola.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUmkmId ? "Edit Profil UMKM" : "Registrasi UMKM Baru"}>
        <form onSubmit={handleSaveUMKM} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Nama Usaha / Brand</label>
              <input 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" 
                value={umkmForm.name} 
                onChange={e=>setUmkmForm({...umkmForm, name: e.target.value})} 
                placeholder="Contoh: Kedai Makanan Bu Siti..." 
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Pemilik Usaha</label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                    <User size={16} />
                  </div>
                  <input 
                    className="w-full pl-12 pr-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" 
                    value={umkmForm.owner} 
                    onChange={e=>setUmkmForm({...umkmForm, owner: e.target.value})} 
                    placeholder="Nama lengkap..." 
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Kategori Bisnis</label>
                <div className="relative">
                  <select 
                    className="w-full p-4 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer" 
                    value={umkmForm.category} 
                    onChange={e=>setUmkmForm({...umkmForm, category: e.target.value})}
                  >
                    <option value="Kuliner">🍲 Kuliner</option>
                    <option value="Jasa">🛠️ Jasa & Layanan</option>
                    <option value="Retail">🏪 Retail / Toko</option>
                    <option value="Fashion">👕 Fashion</option>
                    <option value="Kerajinan">🎨 Kerajinan</option>
                    <option value="Lainnya">📌 Lainnya</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                    <svg width="12" height="8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Deskripsi Layanan / Produk</label>
              <textarea 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all min-h-[100px] resize-none" 
                rows={3} 
                value={umkmForm.description} 
                onChange={e=>setUmkmForm({...umkmForm, description: e.target.value})} 
                placeholder="Ceritakan detail produk atau jasa yang ditawarkan kepada warga..." 
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">WhatsApp Bisnis</label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-emerald-500">
                    <MessageCircle size={16} />
                  </div>
                  <input 
                    className="w-full pl-12 pr-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" 
                    value={umkmForm.contact} 
                    onChange={e=>setUmkmForm({...umkmForm, contact: e.target.value})} 
                    placeholder="08123456789" 
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Jam Operasional</label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-amber-500">
                    <Clock size={16} />
                  </div>
                  <input 
                    className="w-full pl-12 pr-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" 
                    value={umkmForm.operatingHours} 
                    onChange={e=>setUmkmForm({...umkmForm, operatingHours: e.target.value})} 
                    placeholder="Contoh: 08:00 - 21:00"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Media Sosial</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-rose-500">
                    <Instagram size={16} />
                  </div>
                  <input 
                    className="w-full pl-12 pr-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" 
                    value={igUrl} 
                    onChange={e=>setIgUrl(e.target.value)} 
                    placeholder="Username Instagram..."
                  />
                </div>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-800">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2-1.74 2.89 2.89 0 012.9-2.88h.02v-3.46h-.02a6.36 6.36 0 106.36 6.36v-6.3a8.31 8.31 0 004.16 1.45V5.53a4.7 4.7 0 01-1 .16z"/></svg>
                  </div>
                  <input 
                    className="w-full pl-12 pr-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" 
                    value={ttUrl} 
                    onChange={e=>setTtUrl(e.target.value)} 
                    placeholder="Username TikTok..."
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Identitas Lokasi (Opsional)</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                  <MapPin size={16} />
                </div>
                <input 
                  className="w-full pl-12 pr-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" 
                  value={umkmForm.houseId} 
                  onChange={e=>setUmkmForm({...umkmForm, houseId: e.target.value})} 
                  placeholder="ID Blok Rumah (Contoh: A-12)"
                />
              </div>
              <p className="text-[10px] font-medium text-slate-400 px-1">Isi jika bisnis berlokasi di rumah warga RT 02.</p>
            </div>

            <div className="space-y-3 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Unggah Banner / Foto Bisnis</label>
                <div className="flex bg-slate-200/50 p-1 rounded-xl">
                  <button type="button" onClick={() => setImageType('upload')} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${imageType === 'upload' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Upload</button>
                  <button type="button" onClick={() => setImageType('link')} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${imageType === 'link' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>URL</button>
                </div>
              </div>

              {imageType === 'upload' ? (
                <div className="relative group">
                  <input 
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="umkm-file-upload"
                      onChange={e => setImageFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="umkm-file-upload" className="flex flex-col items-center justify-center gap-3 w-full p-8 bg-white border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 hover:border-indigo-300 transition-all">
                      <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 group-hover:scale-110 group-hover:bg-indigo-100 transition-all">
                        <Upload size={20} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-700 mb-1">{imageFile ? imageFile.name : 'Pilih File Gambar'}</p>
                        <p className="text-[10px] text-slate-400">JPG, PNG atau WEBP (Max. 2MB)</p>
                      </div>
                  </label>
                </div>
              ) : (
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                    <LinkIcon size={16} />
                  </div>
                  <input 
                    className="w-full pl-12 pr-4 p-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm" 
                    value={umkmForm.image} 
                    onChange={e=>setUmkmForm({...umkmForm, image: e.target.value})} 
                    placeholder="https://contoh.com/gambar.jpg"
                  />
                </div>
              )}
            </div>

          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <Button type="submit" className="w-full py-4 text-sm font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-500/20 flex justify-center items-center gap-2 group/submit" disabled={isUploading}>
              {isUploading ? (
                <><Loader2 size={18} className="animate-spin" /> Sedang Mengunggah...</>
              ) : editingUmkmId ? (
                <>Simpan Perubahan <CheckCircle2 size={18} className="group-hover/submit:scale-110 transition-transform" /></>
              ) : (
                <>Registrasi UMKM <CheckCircle2 size={18} className="group-hover/submit:scale-110 transition-transform" /></>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};
