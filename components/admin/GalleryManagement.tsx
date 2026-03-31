import React, { useState } from 'react';
import { Image, Trash2, Plus, Calendar, Upload } from 'lucide-react';
import { GalleryItem } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { addGalleryItemToDb, deleteGalleryItemFromDb, uploadImageToStorage } from '../../services/databaseService';
import { toast } from 'sonner';

interface GalleryManagementProps {
  gallery: GalleryItem[];
}

export const GalleryManagement: React.FC<GalleryManagementProps> = ({ gallery }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [imageType, setImageType] = useState<'upload' | 'link'>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsUploading(true);
    try {
        let finalImageUrl = imageUrl;
        if (imageType === 'upload') {
            if (!imageFile) return;
            finalImageUrl = await uploadImageToStorage(imageFile, `gallery/${Date.now()}_${imageFile.name}`);
        }
        
        const newItem = {
          title,
          image: finalImageUrl,
          date: new Date().toISOString()
        };
        await addGalleryItemToDb(newItem);
        setIsModalOpen(false);
        setTitle('');
        setImageFile(null);
        setImageUrl('');
        toast.success('Foto berhasil ditambahkan ke galeri!');
    } catch (e) {
        console.error("Error adding gallery item:", e);
        toast.error('Gagal menambahkan foto ke galeri.');
    } finally {
        setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus foto ini dari galeri?')) {
      try {
        await deleteGalleryItemFromDb(id);
        toast.success('Foto berhasil dihapus dari galeri.');
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus foto.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-xl font-black text-slate-800">Galeri Kegiatan</h3>
          <p className="text-sm text-slate-500 font-medium">Kelola foto dokumentasi kegiatan warga.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200">
          <Plus size={18} className="mr-2" /> Tambah Foto
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {gallery.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100"
            >
              <div className="aspect-square relative">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-white/20 hover:bg-rose-500 text-white rounded-xl backdrop-blur-sm transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-slate-800 text-sm truncate mb-1">{item.title}</h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Calendar size={12} />
                  {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {gallery.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-sm">
              <Image size={32} />
            </div>
            <p className="text-slate-400 font-bold">Belum ada foto di galeri.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Foto Galeri">
        <form onSubmit={handleAddGallery} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700 uppercase tracking-wide">Judul Kegiatan <span className="text-rose-500">*</span></label>
            <input 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Contoh: Kerja Bakti..."
              required
            />
          </div>
          
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button type="button" onClick={() => setImageType('upload')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${imageType === 'upload' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Upload File</button>
            <button type="button" onClick={() => setImageType('link')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${imageType === 'link' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Link URL</button>
          </div>

          {imageType === 'upload' ? (
            <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 uppercase tracking-wide">Pilih Foto <span className="text-rose-500">*</span></label>
                <div className="relative">
                    <input 
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="gallery-file-upload"
                        onChange={e => setImageFile(e.target.files?.[0] || null)}
                        required={imageType === 'upload'}
                    />
                    <label htmlFor="gallery-file-upload" className="flex items-center gap-3 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold cursor-pointer hover:bg-slate-100 transition-colors">
                        <Upload size={18} className="text-slate-400" />
                        <span className="text-slate-600">{imageFile ? imageFile.name : 'Pilih file foto...'}</span>
                    </label>
                </div>
            </div>
          ) : (
            <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 uppercase tracking-wide">URL Foto <span className="text-rose-500">*</span></label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  required={imageType === 'link'}
                />
            </div>
          )}
          
          <Button type="submit" className="w-full py-3 mt-2" disabled={isUploading}>
            {isUploading ? 'Sedang Mengunggah...' : 'Simpan Foto'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
