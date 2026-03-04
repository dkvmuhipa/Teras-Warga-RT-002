import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, User, MessageCircle, Store, Tag, MapPin, Phone } from 'lucide-react';
import { UMKM } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { addUMKMToDb, updateUMKMInDb, deleteUMKMFromDb } from '../../services/databaseService';
import { motion, AnimatePresence } from 'motion/react';

interface UmkmManagementProps {
  umkm: UMKM[];
}

export const UmkmManagement: React.FC<UmkmManagementProps> = ({ umkm }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchUmkm, setSearchUmkm] = useState('');
  const [editingUmkmId, setEditingUmkmId] = useState<string | null>(null);
  
  // Form State
  const [umkmForm, setUmkmForm] = useState({ name: '', owner: '', category: 'Kuliner', contact: '', image: '', description: '' });

  const resetForms = () => {
    setUmkmForm({ name: '', owner: '', category: 'Kuliner', contact: '', image: '', description: '' });
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
      description: u.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveUMKM = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUmkmId) {
        await updateUMKMInDb(editingUmkmId, umkmForm);
      } else {
        await addUMKMToDb(umkmForm);
      }
      alert('Data UMKM berhasil disimpan!');
      setIsModalOpen(false);
      resetForms();
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan data UMKM.');
    }
  };

  const handleDeleteUMKM = async (id: string) => {
    if (window.confirm('Hapus data UMKM ini?')) {
      try {
        await deleteUMKMFromDb(id);
      } catch (error) {
        console.error(error);
        alert('Gagal menghapus data UMKM.');
      }
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
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">UMKM Warga</h2>
          <p className="text-slate-500 font-medium mt-1">Dukung ekonomi lokal dengan mengelola data usaha warga.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Cari UMKM..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm" 
              value={searchUmkm} 
              onChange={(e) => setSearchUmkm(e.target.value)} 
            />
          </div>
          <Button onClick={() => { resetForms(); setIsModalOpen(true); }} className="shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 shadow-lg transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
            <Plus size={18} className="mr-2"/> Tambah UMKM
          </Button>
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
                className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative flex flex-col"
              >
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  <img 
                    src={u.image || `https://source.unsplash.com/random/800x600/?${u.category}`} 
                    alt={u.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${u.name}&background=random&size=256`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                  
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                      <Tag size={10} />
                      {u.category}
                    </span>
                  </div>

                  <div className="absolute top-4 right-4 flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-300">
                    <button onClick={() => openEditUMKM(u)} className="p-2 bg-white/90 backdrop-blur-md text-slate-600 hover:text-indigo-600 rounded-xl shadow-lg transition-all hover:scale-110"><Edit2 size={16}/></button>
                    <button onClick={() => handleDeleteUMKM(u.id)} className="p-2 bg-white/90 backdrop-blur-md text-slate-600 hover:text-rose-600 rounded-xl shadow-lg transition-all hover:scale-110"><Trash2 size={16}/></button>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-black text-slate-800 text-xl leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{u.name}</h3>
                  
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mb-2">
                    <User size={14} className="text-indigo-500"/>
                    {u.owner}
                  </div>
                  
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">{u.description}</p>

                  <div className="mt-auto space-y-3 pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Phone size={14} />
                      </div>
                      <span className="font-bold">{u.contact}</span>
                    </div>
                    <button className="w-full py-3 rounded-xl bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                      Lihat Detail
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div variants={itemVariants} className="col-span-full py-16 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-sm">
                <Store size={40} />
              </div>
              <p className="text-slate-400 font-bold text-lg">{searchUmkm ? 'Tidak ada UMKM yang cocok dengan pencarian.' : 'Belum ada data UMKM.'}</p>
              {!searchUmkm && <button onClick={() => setIsModalOpen(true)} className="mt-2 text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Tambah Sekarang</button>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUmkmId ? "Edit UMKM" : "Tambah UMKM Baru"}>
        <form onSubmit={handleSaveUMKM} className="space-y-5">
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Nama Usaha</label>
            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={umkmForm.name} onChange={e=>setUmkmForm({...umkmForm, name: e.target.value})} placeholder="Contoh: Warung Makan Bu Siti" required/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Pemilik</label>
              <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={umkmForm.owner} onChange={e=>setUmkmForm({...umkmForm, owner: e.target.value})} placeholder="Nama Pemilik" required/>
            </div>
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Kategori</label>
              <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={umkmForm.category} onChange={e=>setUmkmForm({...umkmForm, category: e.target.value})}>
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
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Deskripsi Usaha</label>
            <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all min-h-[80px]" rows={3} value={umkmForm.description} onChange={e=>setUmkmForm({...umkmForm, description: e.target.value})} placeholder="Jelaskan produk atau jasa yang ditawarkan..." required/>
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Kontak (WhatsApp)</label>
            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={umkmForm.contact} onChange={e=>setUmkmForm({...umkmForm, contact: e.target.value})} placeholder="08..." required/>
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">URL Foto Produk/Usaha</label>
            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={umkmForm.image} onChange={e=>setUmkmForm({...umkmForm, image: e.target.value})} placeholder="https://..."/>
          </div>
          <Button type="submit" className="w-full py-3.5 text-sm shadow-xl shadow-indigo-200 mt-2">
            {editingUmkmId ? 'Simpan Perubahan' : 'Simpan Data UMKM'}
          </Button>
        </form>
      </Modal>
    </motion.div>
  );
};
