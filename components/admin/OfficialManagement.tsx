import React, { useState } from 'react';
import { Plus, Edit2, Trash2, User, Phone, MapPin, Briefcase, Upload, AlertTriangle } from 'lucide-react';
import { Official, House } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { addOfficialToDb, updateOfficialInDb, deleteOfficialFromDb, uploadImageToStorage, formatHouseId, getHouseDisplayLabel, handleFirestoreError, OperationType, isFirebaseConfigured } from '../../services/databaseService';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useConfirm } from '../../context/ConfirmContext';

interface OfficialManagementProps {
  officials: Official[];
  houses: House[];
}

export const OfficialManagement: React.FC<OfficialManagementProps> = ({ officials, houses }) => {
  const confirm = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfficialId, setEditingOfficialId] = useState<string | null>(null);
  
  // Form State
  const [offName, setOffName] = useState('');
  const [offRole, setOffRole] = useState('');
  const [offPhone, setOffPhone] = useState('');
  const [offHouse, setOffHouse] = useState('');
  const [offPhoto, setOffPhoto] = useState('');
  const [offEmail, setOffEmail] = useState('');
  const [offTermStart, setOffTermStart] = useState('');
  const [offTermEnd, setOffTermEnd] = useState('');
  const [offDuties, setOffDuties] = useState('');
  const [imageType, setImageType] = useState<'upload' | 'link'>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const resetForms = () => {
    setOffName('');
    setOffRole('');
    setOffPhone('');
    setOffHouse('');
    setOffPhoto('');
    setOffEmail('');
    setOffTermStart('');
    setOffTermEnd('');
    setOffDuties('');
    setImageFile(null);
    setImageType('upload');
    setEditingOfficialId(null);
  };

  const handleEditOfficial = (o: Official) => {
    setEditingOfficialId(o.id);
    setOffName(o.name);
    setOffRole(o.role);
    setOffPhone(o.phone);
    setOffHouse(o.houseId);
    setOffPhoto(o.photo || '');
    setOffEmail(o.email || '');
    setOffTermStart(o.termStart || '');
    setOffTermEnd(o.termEnd || '');
    setOffDuties(o.duties?.join('\n') || '');
    setImageType('link');
    setIsModalOpen(true);
  };

  const handleSaveOfficial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let finalPhotoUrl = offPhoto;
      if (imageType === 'upload' && imageFile) {
        finalPhotoUrl = await uploadImageToStorage(imageFile, `officials/${Date.now()}_${imageFile.name}`);
      }

      const data = {
        name: offName,
        role: offRole,
        phone: offPhone,
        houseId: formatHouseId(offHouse),
        photo: finalPhotoUrl,
        email: offEmail,
        termStart: offTermStart,
        termEnd: offTermEnd,
        duties: offDuties.split('\n').filter(d => d.trim() !== '')
      };

      if (editingOfficialId) {
        await updateOfficialInDb(editingOfficialId, data);
        toast.success('Data pengurus berhasil diperbarui!');
      } else {
        await addOfficialToDb(data);
        toast.success('Data pengurus berhasil disimpan!');
      }
      setIsModalOpen(false);
      resetForms();
    } catch (error) {
      handleFirestoreError(error, editingOfficialId ? OperationType.UPDATE : OperationType.CREATE, "officials");
      toast.error('Gagal menyimpan data pengurus.');
    } finally {
        setIsUploading(false);
    }
  };

  const handleDeleteOfficial = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Pengurus',
      message: 'Apakah Anda yakin ingin menghapus data pengurus ini?',
      confirmLabel: 'Hapus',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await deleteOfficialFromDb(id);
        toast.success('Data pengurus berhasil dihapus.');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `officials/${id}`);
        toast.error('Gagal menghapus data pengurus.');
      }
    }
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
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pengurus RT 02</h2>
          <p className="text-slate-500 font-medium mt-1">Kelola data struktur organisasi dan personil Rukun Tetangga.</p>
        </div>
        <Button onClick={() => { resetForms(); setIsModalOpen(true); }} className="shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 shadow-lg transition-all hover:scale-105 active:scale-95">
          <Plus size={18} className="mr-2"/> Tambah Personil
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {officials.map((o: Official) => { 
            const isChairman = o.role.toLowerCase().includes('ketua'); 
            return (
              <motion.div 
                key={o.id} 
                variants={itemVariants}
                layout
                className="group bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 relative"
              >
                <div className={`h-28 relative ${isChairman ? 'bg-gradient-to-br from-violet-600 to-indigo-600' : 'bg-slate-800'}`}>
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                  <div className="absolute top-4 right-4">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button onClick={() => handleEditOfficial(o)} className="p-2 bg-white/20 hover:bg-white text-white hover:text-indigo-600 rounded-xl backdrop-blur-sm transition-all shadow-sm"><Edit2 size={14}/></button>
                      <button onClick={() => handleDeleteOfficial(o.id)} className="p-2 bg-white/20 hover:bg-rose-500 text-white rounded-xl backdrop-blur-sm transition-all shadow-sm"><Trash2 size={14}/></button>
                    </div>
                  </div>
                </div>
                
                <div className="absolute top-14 left-1/2 -translate-x-1/2">
                  <div className="p-1.5 bg-white rounded-2xl shadow-lg rotate-3 group-hover:rotate-0 transition-transform duration-300">
                    <img 
                      src={o.photo || `https://ui-avatars.com/api/?name=${o.name}&background=random&size=128`} 
                      className="w-20 h-20 rounded-xl object-cover bg-slate-100" 
                      alt={o.name}
                    />
                  </div>
                </div>

                <div className="pt-16 pb-6 px-6 text-center mt-2">
                  <h3 className="font-black text-slate-800 text-lg mb-1 group-hover:text-indigo-600 transition-colors">{o.name}</h3>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 ${isChairman ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                    <Briefcase size={10} /> {o.role}
                  </div>
                  
                  <div className="space-y-2 text-left bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 shrink-0">
                        <Phone size={14} />
                      </div>
                      <span className="font-medium truncate">{o.phone || '-'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 shrink-0">
                        <MapPin size={14} />
                      </div>
                      <span className="font-medium truncate">{getHouseDisplayLabel(o.houseId, houses)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ); 
          })}
        </AnimatePresence>
        
        {officials.length === 0 && (
          <motion.div key="empty-officials" variants={itemVariants} className="col-span-full py-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-sm">
              <User size={32} />
            </div>
            <p className="text-slate-400 font-bold">Belum ada data pengurus.</p>
            <button onClick={() => setIsModalOpen(true)} className="mt-4 text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Tambah Sekarang</button>
          </motion.div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingOfficialId ? "Edit Pengurus" : "Tambah Pengurus Baru"}>
        <form onSubmit={handleSaveOfficial} className="space-y-5">
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Nama Lengkap</label>
            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={offName} onChange={e=>setOffName(e.target.value)} placeholder="Nama lengkap..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Jabatan</label>
              <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={offRole} onChange={e=>setOffRole(e.target.value)} placeholder="Contoh: Ketua RT" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Blok Rumah</label>
              <input 
                list="house-list"
                className={`w-full p-3 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${
                  offHouse && !houses.some(h => formatHouseId(h.id) === formatHouseId(offHouse)) 
                  ? 'border-rose-300 bg-rose-50' 
                  : 'border-slate-200'
                }`}
                value={offHouse} 
                onChange={e=>setOffHouse(e.target.value)} 
                placeholder="Contoh: C10-08" 
              />
              <datalist id="house-list">
                {houses.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.headOfFamily && h.headOfFamily !== '-' ? `${h.id} - ${h.headOfFamily}` : h.id}
                  </option>
                ))}
              </datalist>
              {offHouse && !houses.some(h => formatHouseId(h.id) === formatHouseId(offHouse)) && (
                <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1 flex items-center gap-1">
                  <AlertTriangle size={10} /> ID Rumah tidak ditemukan
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Nomor Telepon / WA</label>
            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={offPhone} onChange={e=>setOffPhone(e.target.value)} placeholder="08..." />
          </div>

          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Email</label>
            <input type="email" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={offEmail} onChange={e=>setOffEmail(e.target.value)} placeholder="email@example.com"/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Mulai Jabatan</label>
              <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={offTermStart} onChange={e=>setOffTermStart(e.target.value)}/>
            </div>
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Akhir Jabatan</label>
              <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={offTermEnd} onChange={e=>setOffTermEnd(e.target.value)}/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Tugas & Tanggung Jawab</label>
            <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all min-h-[100px]" value={offDuties} onChange={e=>setOffDuties(e.target.value)} placeholder="Tuliskan tugas per baris..."/>
            <p className="text-[10px] text-slate-400 mt-1 ml-1">Pisahkan setiap tugas dengan baris baru.</p>
          </div>
          
          <div className="flex items-center justify-between p-1 bg-slate-100 rounded-xl">
            <button type="button" onClick={() => setImageType('upload')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${imageType === 'upload' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Upload File</button>
            <button type="button" onClick={() => setImageType('link')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${imageType === 'link' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Link URL</button>
          </div>

          {!isFirebaseConfigured && imageType === 'upload' && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest leading-tight">
                ⚠️ Firebase Storage Offline. Upload akan digantikan dengan gambar placeholder otomatis. Gunakan "Link URL" untuk foto asli.
              </p>
            </div>
          )}

          {imageType === 'upload' ? (
            <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 uppercase tracking-wide">Pilih Foto</label>
                <div className="relative">
                    <input 
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="official-file-upload"
                        onChange={e => setImageFile(e.target.files?.[0] || null)}
                    />
                    <label htmlFor="official-file-upload" className="flex items-center gap-3 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold cursor-pointer hover:bg-slate-100 transition-colors">
                        <Upload size={18} className="text-slate-400" />
                        <span className="text-slate-600">{imageFile ? imageFile.name : 'Pilih file foto...'}</span>
                    </label>
                </div>
            </div>
          ) : (
            <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 uppercase tracking-wide">URL Foto Profil</label>
                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={offPhoto} onChange={e=>setOffPhoto(e.target.value)} placeholder="https://..."/>
                <p className="text-[10px] text-slate-400 mt-1.5 ml-1">*Biarkan kosong untuk menggunakan avatar default.</p>
            </div>
          )}
          
          <Button type="submit" className="w-full py-3.5 text-sm shadow-xl shadow-indigo-200 mt-2" disabled={isUploading}>
            {isUploading ? 'Sedang Mengunggah...' : (editingOfficialId ? 'Simpan Perubahan' : 'Simpan Data Pengurus')}
          </Button>
        </form>
      </Modal>
    </motion.div>
  );
};
