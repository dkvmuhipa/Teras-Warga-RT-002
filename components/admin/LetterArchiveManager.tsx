import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, Edit2, Trash2, Send, Eye, X, Save, Calendar, User, Upload, Download, File as FileIcon } from 'lucide-react';
import { OfficialLetter, PdfConfig } from '../../types';
import { subscribeToOfficialLetters, addOfficialLetterToDb, updateOfficialLetterInDb, deleteOfficialLetterFromDb, uploadFile } from '../../services/databaseService';
import { sendWhatsAppMessage } from '../../services/whatsappService';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface LetterArchiveManagerProps {
  pdfConfig: PdfConfig;
}

export const LetterArchiveManager: React.FC<LetterArchiveManagerProps> = ({ pdfConfig }) => {
  const [letters, setLetters] = useState<OfficialLetter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLetter, setEditingLetter] = useState<OfficialLetter | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<OfficialLetter, 'id' | 'createdAt' | 'updatedAt'>>({
    letterNumber: '',
    subject: '',
    date: new Date().toISOString().split('T')[0],
    content: '', // Not used for external
    recipient: '',
    type: 'Lainnya',
    status: 'Published',
    attachmentUrl: '',
    source: 'External'
  });

  useEffect(() => {
    const unsubscribe = subscribeToOfficialLetters((allLetters) => {
      // Only show external letters in archive
      setLetters(allLetters.filter(l => l.source === 'External'));
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (letter?: OfficialLetter) => {
    if (letter) {
      setEditingLetter(letter);
      setFormData({
        letterNumber: letter.letterNumber,
        subject: letter.subject,
        date: letter.date,
        content: letter.content || '',
        recipient: letter.recipient,
        type: letter.type,
        status: letter.status,
        attachmentUrl: letter.attachmentUrl || '',
        source: 'External'
      });
    } else {
      setEditingLetter(null);
      setFormData({
        letterNumber: '',
        subject: '',
        date: new Date().toISOString().split('T')[0],
        content: '',
        recipient: '',
        type: 'Lainnya',
        status: 'Published',
        attachmentUrl: '',
        source: 'External'
      });
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    try {
      let attachmentUrl = formData.attachmentUrl;

      // Upload file if selected
      if (selectedFile) {
        const path = `official-letters/archive/${Date.now()}_${selectedFile.name}`;
        attachmentUrl = await uploadFile(selectedFile, path);
      }

      const finalData = { ...formData, attachmentUrl };

      if (editingLetter) {
        await updateOfficialLetterInDb(editingLetter.id, finalData);
        toast.success('Arsip surat berhasil diperbarui');
      } else {
        await addOfficialLetterToDb({
          ...finalData,
          createdAt: new Date().toISOString()
        });
        toast.success('Surat berhasil diarsipkan');
      }

      setIsModalOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan arsip surat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus arsip surat ini secara permanen?')) {
      try {
        await deleteOfficialLetterFromDb(id);
        toast.success('Arsip berhasil dihapus');
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus arsip');
      }
    }
  };

  const handleShareWhatsApp = (letter: OfficialLetter) => {
    const message = `*ARSIP SURAT ${pdfConfig.rtName}*\n\n` +
      `Nomor: ${letter.letterNumber}\n` +
      `Perihal: ${letter.subject}\n` +
      `Tanggal: ${new Date(letter.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n\n` +
      `Kepada Yth,\n${letter.recipient}\n\n` +
      `Surat ini telah diarsipkan secara digital.\n\n` +
      `_Pesan otomatis dari Sistem Teras Warga_`;

    sendWhatsAppMessage(pdfConfig.whatsappGroupId || '', message);
    toast.success('Membuka WhatsApp...');
  };

  const filteredLetters = letters.filter(l => {
    const matchSearch = l.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        l.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        l.letterNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'All' || l.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Cari nomor surat, perihal, atau penerima di arsip..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
             <Filter size={14} className="text-slate-400"/>
             <select 
               className="bg-transparent border-none text-[10px] sm:text-xs font-black text-slate-600 uppercase tracking-widest outline-none cursor-pointer w-full" 
               value={filterType} 
               onChange={(e) => setFilterType(e.target.value)}
             >
               <option value="All">Semua Jenis</option>
               <option value="Himbauan">Himbauan</option>
               <option value="Undangan">Undangan</option>
               <option value="Pemberitahuan">Pemberitahuan</option>
               <option value="Lainnya">Lainnya</option>
             </select>
          </div>
          <Button onClick={() => handleOpenModal()} className="bg-amber-600 hover:bg-amber-700">
            <Upload size={18} className="mr-2" /> Upload Surat Luar
          </Button>
        </div>
      </div>

      {/* Letters List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredLetters.map((letter) => (
            <motion.div
              key={letter.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    letter.type === 'Himbauan' ? 'bg-amber-100 text-amber-600' :
                    letter.type === 'Undangan' ? 'bg-indigo-100 text-indigo-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {letter.type}
                  </div>
                  <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-600">
                    TERARSIP
                  </div>
                </div>

                <h4 className="text-lg font-black text-slate-900 mb-1 line-clamp-1">{letter.subject}</h4>
                <p className="text-xs font-bold text-amber-600 mb-4">{letter.letterNumber}</p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar size={14} />
                    <span>{new Date(letter.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <User size={14} />
                    <span className="line-clamp-1">Yth. {letter.recipient}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                  <a 
                    href={letter.attachmentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    <Eye size={14} /> Lihat File
                  </a>
                  <button 
                    onClick={() => handleOpenModal(letter)}
                    className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
                    title="Edit Data"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleShareWhatsApp(letter)}
                    className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                    title="Bagikan Info"
                  >
                    <Send size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(letter.id)}
                    className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all"
                    title="Hapus"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredLetters.length === 0 && (
        <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload size={40} className="text-slate-200" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Belum Ada Arsip Surat</h3>
          <p className="text-slate-500 max-w-xs mx-auto">Gunakan tombol "Upload Surat Luar" untuk mengarsipkan surat fisik atau file eksternal.</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingLetter ? 'Edit Arsip Surat' : 'Upload Arsip Surat Baru'}>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Jenis Surat</label>
              <select 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as any})}
              >
                <option value="Himbauan">Himbauan</option>
                <option value="Undangan">Undangan</option>
                <option value="Pemberitahuan">Pemberitahuan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tanggal Surat</label>
              <input 
                type="date"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nomor Surat</label>
            <input 
              type="text"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              value={formData.letterNumber}
              onChange={e => setFormData({...formData, letterNumber: e.target.value})}
              placeholder="Masukkan nomor surat asli..."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Perihal / Subjek</label>
            <input 
              type="text"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              value={formData.subject}
              onChange={e => setFormData({...formData, subject: e.target.value})}
              placeholder="Contoh: Undangan Rapat Warga"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Penerima (Yth.)</label>
            <input 
              type="text"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              value={formData.recipient}
              onChange={e => setFormData({...formData, recipient: e.target.value})}
              placeholder="Contoh: Seluruh Warga RT 02"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">File Surat</label>
            <div className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${
              selectedFile ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-slate-50 hover:border-indigo-300'
            }`}>
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                accept=".pdf,image/*"
              />
              <div className="flex flex-col items-center justify-center gap-3">
                {selectedFile ? (
                  <>
                    <FileIcon className="text-indigo-600" size={40} />
                    <span className="text-sm font-bold text-indigo-600 truncate max-w-full px-4">{selectedFile.name}</span>
                    <button 
                      type="button"
                      onClick={(e) => { e.preventDefault(); setSelectedFile(null); }}
                      className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                    >
                      Ganti File
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className="text-slate-400" size={40} />
                    <div className="text-center">
                      <span className="block text-xs font-bold text-slate-500">Klik atau seret file PDF/Gambar di sini</span>
                      <span className="text-[10px] text-slate-400">Maksimal 5MB</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            {formData.attachmentUrl && !selectedFile && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <FileIcon size={14} className="text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700 flex-1 truncate">File sudah terunggah</span>
                <a href={formData.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">Lihat</a>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : (editingLetter ? 'Simpan Perubahan' : 'Arsipkan Surat')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
