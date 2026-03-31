import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, User, MessageCircle, Store, Tag, MapPin, Phone, Upload, ShoppingBag, Clock, CheckCircle2, XCircle, Package } from 'lucide-react';
import { UMKM, UMKMOrder } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { 
  addUMKMToDb, 
  updateUMKMInDb, 
  deleteUMKMFromDb, 
  uploadImageToStorage,
  subscribeToUMKMOrders,
  updateUMKMOrderStatus
} from '../../services/databaseService';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface UmkmManagementProps {
  umkm: UMKM[];
}

export const UmkmManagement: React.FC<UmkmManagementProps> = ({ umkm }) => {
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
      console.error(error);
      toast.error('Gagal menyimpan data UMKM.');
    } finally {
        setIsUploading(false);
    }
  };

  const handleDeleteUMKM = async (id: string) => {
    toast.info('Hapus data UMKM ini?', {
      action: {
        label: 'Hapus',
        onClick: async () => {
          try {
            await deleteUMKMFromDb(id);
            toast.success('Data UMKM berhasil dihapus.');
          } catch (error) {
            console.error(error);
            toast.error('Gagal menghapus data UMKM.');
          }
        }
      },
      cancel: {
        label: 'Batal',
        onClick: () => {}
      }
    });
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUmkmId ? "Edit UMKM" : "Tambah UMKM Baru"}>
        <form onSubmit={handleSaveUMKM} className="space-y-5">
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Nama Usaha <span className="text-rose-500">*</span></label>
            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={umkmForm.name} onChange={e=>setUmkmForm({...umkmForm, name: e.target.value})} placeholder="Contoh: Warung Makan Bu Siti" required/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Pemilik <span className="text-rose-500">*</span></label>
              <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={umkmForm.owner} onChange={e=>setUmkmForm({...umkmForm, owner: e.target.value})} placeholder="Nama Pemilik" required/>
            </div>
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Kategori <span className="text-rose-500">*</span></label>
              <select required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={umkmForm.category} onChange={e=>setUmkmForm({...umkmForm, category: e.target.value})}>
                <option>Kuliner</option>
                <option>Jasa</option>
                <option>Retail</option>
                <option>Fashion</option>
                <option>Kerajinan</option>
                <option>Lainnya</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Deskripsi Usaha <span className="text-rose-500">*</span></label>
            <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all min-h-[80px]" rows={3} value={umkmForm.description} onChange={e=>setUmkmForm({...umkmForm, description: e.target.value})} placeholder="Jelaskan produk atau jasa yang ditawarkan..." required/>
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Kontak (WhatsApp) <span className="text-rose-500">*</span></label>
            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={umkmForm.contact} onChange={e=>setUmkmForm({...umkmForm, contact: e.target.value})} placeholder="08..." required/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Blok Rumah</label>
              <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={umkmForm.houseId} onChange={e=>setUmkmForm({...umkmForm, houseId: e.target.value})} placeholder="Contoh: A-12"/>
            </div>
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Jam Operasional</label>
              <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={umkmForm.operatingHours} onChange={e=>setUmkmForm({...umkmForm, operatingHours: e.target.value})} placeholder="Contoh: 08:00 - 21:00"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Instagram URL</label>
              <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={igUrl} onChange={e=>setIgUrl(e.target.value)} placeholder="https://instagram.com/..."/>
            </div>
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">TikTok URL</label>
              <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={ttUrl} onChange={e=>setTtUrl(e.target.value)} placeholder="https://tiktok.com/..."/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Galeri Foto (Link, pisahkan dengan koma)</label>
            <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all min-h-[60px]" rows={2} value={galleryInput} onChange={e=>setGalleryInput(e.target.value)} placeholder="https://link1.com, https://link2.com..."/>
          </div>
          
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button type="button" onClick={() => setImageType('upload')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${imageType === 'upload' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Upload File</button>
            <button type="button" onClick={() => setImageType('link')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${imageType === 'link' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Link URL</button>
          </div>

          {imageType === 'upload' ? (
            <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 uppercase tracking-wide">Pilih Foto</label>
                <div className="relative">
                    <input 
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="umkm-file-upload"
                        onChange={e => setImageFile(e.target.files?.[0] || null)}
                    />
                    <label htmlFor="umkm-file-upload" className="flex items-center gap-3 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold cursor-pointer hover:bg-slate-100 transition-colors">
                        <Upload size={18} className="text-slate-400" />
                        <span className="text-slate-600">{imageFile ? imageFile.name : 'Pilih file foto...'}</span>
                    </label>
                </div>
            </div>
          ) : (
            <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 uppercase tracking-wide">URL Foto Produk/Usaha</label>
                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={umkmForm.image} onChange={e=>setUmkmForm({...umkmForm, image: e.target.value})} placeholder="https://..."/>
            </div>
          )}
          
          <Button type="submit" className="w-full py-3.5 text-sm shadow-xl shadow-indigo-200 mt-2" disabled={isUploading}>
            {isUploading ? 'Sedang Mengunggah...' : (editingUmkmId ? 'Simpan Perubahan' : 'Simpan Data UMKM')}
          </Button>
        </form>
      </Modal>
    </motion.div>
  );
};
