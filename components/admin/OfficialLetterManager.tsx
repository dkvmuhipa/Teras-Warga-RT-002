import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, Edit2, Trash2, Printer, Send, Eye, X, Save, Calendar, User, MessageSquare, Upload, Download, File as FileIcon, RefreshCw } from 'lucide-react';
import { OfficialLetter, PdfConfig } from '../../types';
import { subscribeToOfficialLetters, addOfficialLetterToDb, updateOfficialLetterInDb, deleteOfficialLetterFromDb, uploadFile } from '../../services/databaseService';
import { generateOfficialLetterPDF } from '../../services/pdfService';
import { sendWhatsAppMessage } from '../../services/whatsappService';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { SignaturePad } from './SignaturePad';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useConfirm } from '../../context/ConfirmContext';

interface OfficialLetterManagerProps {
  pdfConfig: PdfConfig;
  setPdfConfig: (config: PdfConfig) => void;
}

export const OfficialLetterManager: React.FC<OfficialLetterManagerProps> = ({ pdfConfig, setPdfConfig }) => {
  const confirm = useConfirm();
  const [letters, setLetters] = useState<OfficialLetter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLetter, setEditingLetter] = useState<OfficialLetter | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tempSignature, setTempSignature] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form State
  const [formData, setFormData] = useState<Omit<OfficialLetter, 'id' | 'createdAt' | 'updatedAt'>>({
    letterNumber: '',
    subject: '',
    date: new Date().toISOString().split('T')[0],
    content: '',
    recipient: '',
    type: 'Himbauan',
    status: 'Draft',
    attachmentUrl: '',
    source: 'Internal'
  });

  useEffect(() => {
    const unsubscribe = subscribeToOfficialLetters(setLetters);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isModalOpen && !editingLetter) {
      generateAutoLetterNumber();
    }
  }, [isModalOpen, editingLetter, formData.type, pdfConfig.lastLetterNumber, pdfConfig.rtName, formData.date]);

  const generateAutoLetterNumber = () => {
    const letterDate = new Date(formData.date);
    const currentMonthRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][letterDate.getMonth()];
    const currentYear = letterDate.getFullYear();
    const nextNum = (pdfConfig.lastLetterNumber || 0) + 1;
    const paddedNum = nextNum.toString().padStart(3, '0');
    
    let letterCode = 'SR'; // Surat Resmi
    if (formData.type === 'Himbauan') letterCode = 'HIM';
    else if (formData.type === 'Undangan') letterCode = 'UND';
    else if (formData.type === 'Pemberitahuan') letterCode = 'PBT';

    setFormData(prev => ({
      ...prev,
      letterNumber: `${letterCode}/${paddedNum}/${pdfConfig.rtName.replace(/\s/g, '')}/${currentMonthRoman}/${currentYear}`
    }));
  };

  const handleOpenModal = (letter?: OfficialLetter) => {
    if (letter) {
      setEditingLetter(letter);
      setFormData({
        letterNumber: letter.letterNumber,
        subject: letter.subject,
        date: letter.date,
        content: letter.content,
        recipient: letter.recipient,
        type: letter.type,
        status: letter.status,
        attachmentUrl: letter.attachmentUrl || '',
        source: letter.source || 'Internal'
      });
    } else {
      setEditingLetter(null);
      setFormData({
        letterNumber: '',
        subject: '',
        date: new Date().toISOString().split('T')[0],
        content: '',
        recipient: '',
        type: 'Himbauan',
        status: 'Draft',
        attachmentUrl: '',
        source: 'Internal'
      });
    }
    setTempSignature(null);
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
        const path = `official-letters/attachments/${Date.now()}_${selectedFile.name}`;
        attachmentUrl = await uploadFile(selectedFile, path);
      }

      const finalData = { ...formData, attachmentUrl };

      let letterId = editingLetter?.id;
      if (editingLetter) {
        await updateOfficialLetterInDb(editingLetter.id, finalData);
        toast.success('Surat resmi berhasil diperbarui');
      } else {
        const result = await addOfficialLetterToDb({
          ...finalData,
          createdAt: new Date().toISOString()
        });
        letterId = result?.id;
        toast.success('Surat resmi berhasil dibuat');
      }

      // Auto-generate PDF if Published
      if (formData.status === 'Published') {
        const letterToPrint: OfficialLetter = {
          ...formData,
          id: letterId || 'temp',
          createdAt: new Date().toISOString()
        };
        const configToUse = tempSignature ? { ...pdfConfig, signature: tempSignature } : pdfConfig;
        await generateOfficialLetterPDF(letterToPrint, configToUse);
      }

      // Update lastLetterNumber in config based on the number used
      let nextNum = (pdfConfig.lastLetterNumber || 0);
      const parts = formData.letterNumber.split('/');
      
      if (parts.length >= 2) {
        const extractedNum = parseInt(parts[1]);
        if (!isNaN(extractedNum) && extractedNum > nextNum) nextNum = extractedNum;
      } else {
        const match = formData.letterNumber.match(/(\d+)/);
        if (match) {
          const extractedNum = parseInt(match[1]);
          if (!isNaN(extractedNum) && extractedNum > nextNum) nextNum = extractedNum;
        }
      }

      if (nextNum > (pdfConfig.lastLetterNumber || 0)) {
        const newConfig = { ...pdfConfig, lastLetterNumber: nextNum };
        setPdfConfig(newConfig);
      }

      setIsModalOpen(false);
      setTempSignature(null);
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan surat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Surat Resmi',
      message: 'Apakah Anda yakin ingin menghapus surat resmi ini secara permanen?',
      confirmLabel: 'Hapus',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await deleteOfficialLetterFromDb(id);
        toast.success('Surat berhasil dihapus');
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus surat');
      }
    }
  };

  const handlePrint = async (letter: OfficialLetter) => {
    await generateOfficialLetterPDF(letter, pdfConfig);
    toast.success('PDF berhasil dibuat');
  };

  const handleShareWhatsApp = (letter: OfficialLetter) => {
    // Strip HTML tags for WhatsApp message
    const cleanContent = letter.content
      .replace(/<\/p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    const message = `*SURAT RESMI ${pdfConfig.rtName}*\n\n` +
      `Nomor: ${letter.letterNumber}\n` +
      `Perihal: ${letter.subject}\n` +
      `Tanggal: ${new Date(letter.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n\n` +
      `Kepada Yth,\n${letter.recipient}\n\n` +
      `${cleanContent}\n\n` +
      `Demikian disampaikan, terima kasih.\n\n` +
      `_Pesan otomatis dari Sistem Teras Warga_`;

    sendWhatsAppMessage(pdfConfig.whatsappGroupId || '', message);
    toast.success('Membuka WhatsApp...');
  };

  const filteredLetters = letters.filter(l => {
    const matchSearch = l.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        l.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        l.letterNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'All' || l.type === filterType;
    // Only show internal letters here
    return matchSearch && matchType && l.source === 'Internal';
  });

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Cari nomor surat, perihal, atau penerima..."
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
          <Button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus size={18} className="mr-2" /> Buat Surat Resmi
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
                  <div className="flex gap-2">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      letter.type === 'Himbauan' ? 'bg-amber-100 text-amber-600' :
                      letter.type === 'Undangan' ? 'bg-indigo-100 text-indigo-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {letter.type}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    letter.status === 'Published' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {letter.status}
                  </div>
                </div>

                <h4 className="text-lg font-black text-slate-900 mb-1 line-clamp-1">{letter.subject}</h4>
                <p className="text-xs font-bold text-indigo-600 mb-4">{letter.letterNumber}</p>

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
                  <button 
                    onClick={() => handleOpenModal(letter)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button 
                    onClick={() => handlePrint(letter)}
                    className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all"
                    title="Cetak PDF"
                  >
                    <Printer size={16} />
                  </button>
                  {letter.attachmentUrl && (
                    <a 
                      href={letter.attachmentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all"
                      title="Lihat Lampiran"
                    >
                      <Download size={16} />
                    </a>
                  )}
                  <button 
                    onClick={() => handleShareWhatsApp(letter)}
                    className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                    title="Bagikan ke WhatsApp"
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
            <FileText size={40} className="text-slate-200" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Belum Ada Surat Resmi</h3>
          <p className="text-slate-500 max-w-xs mx-auto">Klik tombol "Buat Surat Resmi" untuk mulai membuat himbauan atau undangan.</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingLetter ? 'Edit Surat Resmi' : 'Buat Surat Resmi Baru'}>
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
            <div className="flex justify-between items-center mb-1.5 ml-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nomor Surat</label>
              <button 
                type="button" 
                onClick={generateAutoLetterNumber}
                className="flex items-center gap-1 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
              >
                <RefreshCw size={10} /> Buat Otomatis
              </button>
            </div>
            <input 
              type="text"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              value={formData.letterNumber}
              onChange={e => setFormData({...formData, letterNumber: e.target.value})}
              placeholder="Contoh: HIM/001/RT02/IV/2024"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Perihal / Subjek</label>
            <input 
              type="text"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              value={formData.subject}
              onChange={e => setFormData({...formData, subject: e.target.value})}
              placeholder="Contoh: Himbauan Kerja Bakti"
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
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
              Lampiran Surat (Opsional)
            </label>
            <div className={`relative border-2 border-dashed rounded-2xl p-6 transition-all ${
              selectedFile ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-slate-50 hover:border-indigo-300'
            }`}>
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                accept=".pdf,image/*"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                {selectedFile ? (
                  <>
                    <FileIcon className="text-indigo-600" size={32} />
                    <span className="text-sm font-bold text-indigo-600 truncate max-w-full px-4">{selectedFile.name}</span>
                    <button 
                      type="button"
                      onClick={(e) => { e.preventDefault(); setSelectedFile(null); }}
                      className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                    >
                      Hapus
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className="text-slate-400" size={32} />
                    <span className="text-xs font-bold text-slate-500">Klik atau seret file PDF/Gambar di sini</span>
                    <span className="text-[10px] text-slate-400">Maksimal 5MB</span>
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

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Isi Surat</label>
            <div className="quill-editor-container">
              <ReactQuill 
                theme="snow"
                value={formData.content}
                onChange={content => setFormData({...formData, content})}
                placeholder="Tuliskan isi surat secara lengkap di sini..."
                className="bg-white rounded-2xl overflow-hidden border border-slate-200"
                modules={{
                  toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['clean']
                  ],
                }}
              />
            </div>
            <style>{`
              .quill-editor-container .ql-toolbar {
                border-top-left-radius: 1rem;
                border-top-right-radius: 1rem;
                border-color: #e2e8f0;
                background: #f8fafc;
              }
              .quill-editor-container .ql-container {
                border-bottom-left-radius: 1rem;
                border-bottom-right-radius: 1rem;
                border-color: #e2e8f0;
                min-height: 200px;
                font-family: inherit;
              }
              .quill-editor-container .ql-editor {
                font-size: 0.875rem;
                line-height: 1.5;
              }
            `}</style>
          </div>

          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-500">Status:</p>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setFormData({...formData, status: 'Draft'})}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  formData.status === 'Draft' ? 'bg-slate-800 text-white' : 'bg-white text-slate-400 border border-slate-200'
                }`}
              >
                Draft
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, status: 'Published'})}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  formData.status === 'Published' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400 border border-slate-200'
                }`}
              >
                Published (Siap Cetak)
              </button>
            </div>
          </div>

          {formData.status === 'Published' && (
            <div className="space-y-4 p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <Edit2 size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-indigo-900">Tanda Tangan Digital</h4>
                  <p className="text-[10px] font-bold text-indigo-500 uppercase">Gunakan tanda tangan khusus untuk surat ini (Opsional)</p>
                </div>
              </div>
              <SignaturePad 
                initialValue={tempSignature || pdfConfig.signature}
                onSave={(dataUrl) => {
                  setTempSignature(dataUrl);
                  toast.success("Tanda tangan khusus disimpan untuk surat ini.");
                }}
              />
              <p className="text-[10px] text-slate-400 italic">Jika tidak diisi, akan menggunakan tanda tangan default dari pengaturan.</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
              Batal
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              {isLoading ? 'Menyimpan...' : (editingLetter ? 'Simpan Perubahan' : 'Buat Surat')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
