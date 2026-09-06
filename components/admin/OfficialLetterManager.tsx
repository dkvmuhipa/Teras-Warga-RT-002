import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, Edit2, Trash2, Printer, Send, Eye, X, Save, Calendar, User, MessageSquare, Upload, Download, File as FileIcon, RefreshCw, CheckCircle2, ShieldCheck, Tag, Sparkles, Building2 } from 'lucide-react';
import { OfficialLetter, PdfConfig, LetterRequest } from '../../types';
import { subscribeToOfficialLetters, addOfficialLetterToDb, updateOfficialLetterInDb, deleteOfficialLetterFromDb, uploadFile, updatePdfConfig } from '../../services/databaseService';
import { generateOfficialLetterPDF } from '../../services/pdfService';
import { generateOfficialLettersExcel } from '../../services/excelService';
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
  residentLetters?: LetterRequest[];
}

export const OfficialLetterManager: React.FC<OfficialLetterManagerProps> = ({ pdfConfig, setPdfConfig, residentLetters = [] }) => {
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

  const extractNum = (str: string) => {
    const parts = str.split('/');
    if (parts.length >= 2) {
      const num = parseInt(parts[1], 10);
      if (!isNaN(num) && num < 1000) return num;
    }
    const match = str.match(/\/(\d+)\//) || str.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1] || match[0], 10);
      if (!isNaN(num) && num < 1000) return num;
    }
    return 0;
  };

  useEffect(() => {
    const unsubscribe = subscribeToOfficialLetters(setLetters);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isModalOpen && !editingLetter) {
      generateAutoLetterNumber();
    }
  }, [isModalOpen, editingLetter, formData.type, pdfConfig.lastLetterNumber, pdfConfig.rtName, formData.date, residentLetters, letters]);

  const generateAutoLetterNumber = () => {
    const letterDate = new Date(formData.date);
    const currentMonthRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][letterDate.getMonth()];
    const currentYear = letterDate.getFullYear();
    
    let maxNum = pdfConfig.lastLetterNumber || 0;
    
    // Scan resident letters
    residentLetters.forEach(l => {
      if (l.letterNumber) {
        const num = extractNum(l.letterNumber);
        if (num > maxNum) maxNum = num;
      }
    });

    // Scan official letters
    letters.forEach(ol => {
      if (ol.letterNumber) {
        const num = extractNum(ol.letterNumber);
        if (num > maxNum) maxNum = num;
      }
    });

    const nextNum = maxNum + 1;
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

  const applyOfficialLetterTemplate = (templateType: 'gotong-royong' | 'rapat' | 'ronda' | 'iuran') => {
    if (templateType === 'gotong-royong') {
      setFormData(prev => ({
        ...prev,
        type: 'Himbauan',
        subject: 'Himbauan Kerja Bakti & Kebersihan Lingkungan RT 002 / RW 020',
        recipient: 'Seluruh Warga RT 002 / RW 020',
        content: '<p>Dengan hormat,</p><p>Dalam rangka menjaga kebersihan, kerapian, serta kenyamanan lingkungan bersama di wilayah <strong>RT 002 / RW 020 Kelurahan Tondo</strong>, pengurus RT mengimbau kepada seluruh bapak/ibu warga untuk dapat berpartisipasi aktif dalam kegiatan kerja bakti lingkungan.</p><p><strong>Fokus Kegiatan:</strong> Pembersihan saluran drainase, pemotongan rumput liar, serta penataan area fasilitas umum.</p><p>Setiap rumah dimohon mengirimkan perwakilan serta membawa peralatan kerja secukupnya. Atas perhatian dan kepedulian seluruh warga, kami sampaikan terima kasih.</p>'
      }));
      toast.success('Template Kerja Bakti diterapkan');
    } else if (templateType === 'rapat') {
      setFormData(prev => ({
        ...prev,
        type: 'Undangan',
        subject: 'Undangan Musyawarah Warga & Koordinasi Lingkungan RT 002',
        recipient: 'Bapak/Ibu Kepala Keluarga RT 002 / RW 020',
        content: '<p>Dengan hormat,</p><p>Sehubungan dengan agenda evaluasi ketertiban lingkungan dan pembahasan rencana program kerja RT 002 / RW 020 Kelurahan Tondo, kami mengundang Bapak/Ibu untuk hadir dalam rapat musyawarah warga pada:</p><p><strong>Hari/Tanggal:</strong> Sabtu (Menyesuaikan)<br/><strong>Waktu:</strong> 19.30 WITA s/d Selesai (Ba\'da Isya)<br/><strong>Tempat:</strong> Pos Kamling RT 02 / Balai Pertemuan Warga<br/><strong>Agenda:</strong> Evaluasi Keamanan Ronda, Pengelolaan Air PDAM, dan Kas Lingkungan</p><p>Mengingat pentingnya musyawarah ini bagi kemajuan lingkungan kita, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktunya. Terima kasih.</p>'
      }));
      toast.success('Template Undangan Rapat diterapkan');
    } else if (templateType === 'ronda') {
      setFormData(prev => ({
        ...prev,
        type: 'Pemberitahuan',
        subject: 'Surat Edaran Peningkatan Kewaspadaan & Jadwal Siskamling',
        recipient: 'Seluruh Warga & Petugas Siskamling RT 002 / RW 020',
        content: '<p>Dengan hormat,</p><p>Guna menjaga ketertiban, keamanan, dan ketenteraman lingkungan di wilayah RT 002 / RW 020 Kelurahan Tondo, pengurus RT menyampaikan surat edaran sebagai berikut:</p><ol><li>Wajib lapor 1x24 jam bagi warga yang kedatangan tamu menginap melalui portal Teras Warga atau pos kamling.</li><li>Petugas ronda malam dimohon disiplin hadir sesuai jadwal giliran jaga.</li><li>Seluruh warga diharapkan memastikan kendaraan terkunci ganda dan pagar tertutup saat malam hari.</li></ol><p>Demikian surat edaran ini disampaikan untuk dilaksanakan bersama dengan penuh tanggung jawab. Terima kasih.</p>'
      }));
      toast.success('Template Edaran Ronda diterapkan');
    } else if (templateType === 'iuran') {
      setFormData(prev => ({
        ...prev,
        type: 'Pemberitahuan',
        subject: 'Pemberitahuan Pembayaran Iuran Kebersihan & Pengelolaan Air PDAM',
        recipient: 'Seluruh Kepala Keluarga RT 002 / RW 020',
        content: '<p>Dengan hormat,</p><p>Disampaikan kepada seluruh warga RT 002 / RW 020 Kelurahan Tondo perihal pembayaran iuran bulanan kebersihan lingkungan serta tagihan air PDAM (tarif dasar Rp35.000 / 10 m³ pertama).</p><p>Pembayaran dapat dilakukan melalui transfer kas RT atau disetorkan langsung ke bendahara RT sebelum tanggal 10 setiap bulannya. Status lunas dapat dicek secara transparan di aplikasi Teras Warga.</p><p>Atas kerjasama dan kedisiplinan bapak/ibu warga dalam mendukung kelancaran operasional fasilitas lingkungan, kami ucapkan terima kasih.</p>'
      }));
      toast.success('Template Iuran & Air PDAM diterapkan');
    }
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
        await updatePdfConfig(newConfig);
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
        const letterToDelete = letters.find(l => l.id === id);
        await deleteOfficialLetterFromDb(id);
        toast.success('Surat berhasil dihapus');

        if (letterToDelete && letterToDelete.letterNumber) {
          const deletedNum = extractNum(letterToDelete.letterNumber);
          if (deletedNum > 0) {
            let maxNumOfOthers = 0;
            // Scan occupant letters
            residentLetters.forEach(l => {
              if (l.letterNumber) {
                const num = extractNum(l.letterNumber);
                if (num > maxNumOfOthers) maxNumOfOthers = num;
              }
            });
            // Scan other remaining official letters
            letters.forEach(ol => {
              if (ol.id !== id && ol.letterNumber) {
                const num = extractNum(ol.letterNumber);
                if (num > maxNumOfOthers) maxNumOfOthers = num;
              }
            });

            // If the deleted number is the max or exceeds the remaining, adjust the config
            if (deletedNum >= (pdfConfig.lastLetterNumber || 0)) {
              const newConfig = { ...pdfConfig, lastLetterNumber: maxNumOfOthers };
              setPdfConfig(newConfig);
              await updatePdfConfig(newConfig);
              toast.success(`Nomor surat terakhir disesuaikan kembali menjadi: ${maxNumOfOthers}`);
            }
          }
        }
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
          <Button onClick={() => generateOfficialLettersExcel(filteredLetters)} variant="secondary">
            <Download size={18} className="mr-2" /> Ekspor Excel
          </Button>
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
                    className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-sm shadow-emerald-200"
                    title="Bagikan ke Broadcast WhatsApp Grup RT"
                  >
                    <Send size={15} />
                    <span className="text-[10px] font-black uppercase tracking-wider">WA Broadcast</span>
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

      {/* Modal Surat Resmi Widescreen 2-Kolom RT 002 / RW 020 */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingLetter ? 'Edit Surat Resmi RT 002 / RW 020' : 'Buat Surat Resmi Baru RT 002 / RW 020'}
        maxWidth="max-w-5xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          {/* Header Identitas Resmi RT 002 / RW 020 */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-violet-50 via-slate-50 to-violet-50/30 border border-violet-100/80 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                <FileText size={16} />
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-800 tracking-tight leading-tight">
                  Sistem Tata Naskah Surat Dinas Resmi RT 002 / RW 020
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Kelurahan Tondo, Kecamatan Mantikulore, Kota Palu
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-violet-100/80 text-violet-700 px-3 py-1 rounded-lg border border-violet-200">
              Format Standar Baku RT
            </span>
          </div>

          {/* Quick Template Bar (4 Pilihan Instan) */}
          <div className="space-y-1.5 p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Sparkles size={12} className="text-violet-600" />
              Template Surat Cepat (1-Klik Isi Form & Format Baku)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={() => applyOfficialLetterTemplate('gotong-royong')}
                className="p-2.5 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl text-left transition-all group"
              >
                <p className="text-xs font-black text-slate-800 group-hover:text-emerald-700">🧹 Kerja Bakti</p>
                <p className="text-[9px] text-slate-400 leading-tight mt-0.5">Himbauan kebersihan lingkungan</p>
              </button>
              <button
                type="button"
                onClick={() => applyOfficialLetterTemplate('rapat')}
                className="p-2.5 bg-white hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-xl text-left transition-all group"
              >
                <p className="text-xs font-black text-slate-800 group-hover:text-indigo-700">👥 Rapat Warga</p>
                <p className="text-[9px] text-slate-400 leading-tight mt-0.5">Undangan musyawarah RT</p>
              </button>
              <button
                type="button"
                onClick={() => applyOfficialLetterTemplate('ronda')}
                className="p-2.5 bg-white hover:bg-rose-50 hover:border-rose-300 border border-slate-200 rounded-xl text-left transition-all group"
              >
                <p className="text-xs font-black text-slate-800 group-hover:text-rose-700">🛡️ Edaran Ronda</p>
                <p className="text-[9px] text-slate-400 leading-tight mt-0.5">Keamanan & wajib lapor tamu</p>
              </button>
              <button
                type="button"
                onClick={() => applyOfficialLetterTemplate('iuran')}
                className="p-2.5 bg-white hover:bg-sky-50 hover:border-sky-300 border border-slate-200 rounded-xl text-left transition-all group"
              >
                <p className="text-xs font-black text-slate-800 group-hover:text-sky-700">💧 Iuran & Air PDAM</p>
                <p className="text-[9px] text-slate-400 leading-tight mt-0.5">Pemberitahuan tagihan resmi</p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Kolom Kiri: Form Input Data Surat (7 Kolom) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Jenis Surat *</label>
                  <select 
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all cursor-pointer"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as any})}
                  >
                    <option value="Himbauan">📢 Himbauan</option>
                    <option value="Undangan">✉️ Undangan</option>
                    <option value="Pemberitahuan">📋 Pemberitahuan</option>
                    <option value="Lainnya">📝 Lainnya</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal Surat *</label>
                  <input 
                    type="date"
                    required
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all cursor-pointer"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

              {/* Nomor Surat dengan Tombol Auto-Generate */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nomor Surat Resmi *</label>
                  <button 
                    type="button" 
                    onClick={generateAutoLetterNumber}
                    className="flex items-center gap-1 text-[10px] font-black text-violet-600 uppercase tracking-widest hover:text-violet-700 transition-colors"
                  >
                    <RefreshCw size={11} /> Buat Format Otomatis
                  </button>
                </div>
                <input 
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all"
                  value={formData.letterNumber}
                  onChange={e => setFormData({...formData, letterNumber: e.target.value})}
                  placeholder="Contoh: HIM/001/RT02/IX/2026"
                />
              </div>

              {/* Perihal / Subjek */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Perihal / Hal *</label>
                <input 
                  type="text"
                  required
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all"
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                  placeholder="Contoh: Himbauan Kerja Bakti Bersama RT 002"
                />
              </div>

              {/* Penerima (Yth.) */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Penerima (Yth.) *</label>
                <input 
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all"
                  value={formData.recipient}
                  onChange={e => setFormData({...formData, recipient: e.target.value})}
                  placeholder="Contoh: Seluruh Warga RT 002 / RW 020"
                />
              </div>

              {/* Upload Lampiran File */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Lampiran Dokumen / Berkas (Opsional)
                </label>
                <div className={`relative border-2 border-dashed rounded-2xl p-4 transition-all ${
                  selectedFile ? 'border-violet-500 bg-violet-50/40' : 'border-slate-200 bg-slate-50 hover:border-violet-300'
                }`}>
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    accept=".pdf,image/*"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {selectedFile ? (
                        <FileIcon className="text-violet-600" size={22} />
                      ) : (
                        <Upload className="text-slate-400" size={22} />
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-700 truncate max-w-[240px]">
                          {selectedFile ? selectedFile.name : 'Pilih Berkas PDF / Gambar'}
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium">Maksimal 5MB</p>
                      </div>
                    </div>
                    {selectedFile && (
                      <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); setSelectedFile(null); }}
                        className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline relative z-10"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
                {formData.attachmentUrl && !selectedFile && (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-xs">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold">
                      <FileIcon size={14} className="text-emerald-600" />
                      <span>Lampiran aktif tersimpan di cloud</span>
                    </div>
                    <a href={formData.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">
                      Lihat File
                    </a>
                  </div>
                )}
              </div>

              {/* Editor Isi Surat */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Isi Surat Lengkap *
                </label>
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
                    min-height: 160px;
                    font-family: inherit;
                  }
                  .quill-editor-container .ql-editor {
                    font-size: 0.85rem;
                    line-height: 1.5;
                  }
                `}</style>
              </div>

              {/* Status Publikasi */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-xs font-bold text-slate-600">Status Dokumen:</span>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, status: 'Draft'})}
                    className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      formData.status === 'Draft' ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-400 border border-slate-200'
                    }`}
                  >
                    Draft
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, status: 'Published'})}
                    className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      formData.status === 'Published' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-400 border border-slate-200'
                    }`}
                  >
                    Published (Siap Cetak)
                  </button>
                </div>
              </div>

              {formData.status === 'Published' && (
                <div className="space-y-3 p-4 bg-violet-50/50 rounded-2xl border border-violet-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-violet-100 text-violet-600 rounded-lg">
                      <Edit2 size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-violet-900">Tanda Tangan Digital Khusus</h4>
                      <p className="text-[9px] font-bold text-violet-500 uppercase">Tanda tangan khusus untuk surat ini (Opsional)</p>
                    </div>
                  </div>
                  <SignaturePad 
                    initialValue={tempSignature || pdfConfig.signature}
                    onSave={(dataUrl) => {
                      setTempSignature(dataUrl);
                      toast.success("Tanda tangan khusus disimpan.");
                    }}
                  />
                  <p className="text-[9px] text-slate-400 italic">Jika tidak diisi, menggunakan tanda tangan default sistem.</p>
                </div>
              )}
            </div>

            {/* Kolom Kanan: Live Official Letter Print Preview (5 Kolom) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Eye size={13} className="text-violet-600" />
                  Pratinjau Cetak Surat Resmi (A4)
                </span>
                <span className="text-[9px] font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200/60 uppercase">
                  Kop RT 002 / RW 020
                </span>
              </div>

              {/* Lembar Surat Format A4 Resmi */}
              <div className="bg-white shadow-xl rounded-2xl p-5 sm:p-6 border border-slate-300/80 text-slate-900 space-y-3.5 min-h-[580px] flex flex-col justify-between text-[11px] leading-relaxed relative overflow-hidden">
                {/* Kop Surat Resmi RT 002 / RW 020 */}
                <div>
                  <div className="text-center pb-2">
                    <p className="font-serif font-black text-[12px] tracking-wide text-slate-900 uppercase">
                      PENGURUS RUKUN TETANGGA 002 / RW 020
                    </p>
                    <p className="font-serif font-bold text-[10px] text-slate-700 uppercase">
                      KELURAHAN TONDO, KECAMATAN MANTIKULORE
                    </p>
                    <p className="font-serif text-[9px] text-slate-500">
                      KOTA PALU, SULAWESI TENGAH 94119
                    </p>
                  </div>
                  {/* Garis Ganda Kop Surat */}
                  <div className="border-b-2 border-slate-900 pb-0.5">
                    <div className="border-b border-slate-900"></div>
                  </div>
                </div>

                {/* Nomor, Lampiran, Perihal, & Tanggal */}
                <div className="space-y-1 pt-1 font-serif text-[10px]">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <p><span className="w-16 inline-block font-semibold">Nomor</span>: <span className="font-mono font-bold">{formData.letterNumber || '.../SR/RT002/RW020/...'}</span></p>
                      <p><span className="w-16 inline-block font-semibold">Lampiran</span>: {selectedFile ? selectedFile.name : (formData.attachmentUrl ? '1 (Satu) Berkas' : '-')}</p>
                      <p><span className="w-16 inline-block font-semibold">Perihal</span>: <span className="font-bold">{formData.subject || '(Belum diisi)'}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="font-sans text-[9px] text-slate-500 font-bold">
                        Palu, {formData.date ? new Date(formData.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tujuan Surat (Kepada Yth.) */}
                <div className="pt-2 font-serif text-[10px]">
                  <p>Kepada Yth,</p>
                  <p className="font-bold">{formData.recipient || 'Bapak/Ibu Warga RT 002 / RW 020'}</p>
                  <p>Di Tempat</p>
                </div>

                {/* Konten Surat */}
                <div className="flex-1 py-2 font-serif text-[10px] leading-relaxed border-t border-dashed border-slate-200">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: formData.content || '<p class="italic text-slate-400 font-sans">Ketikkan isi surat resmi pada formulir sebelah kiri...</p>' 
                    }} 
                  />
                </div>

                {/* Kolom Tanda Tangan & Stempel Resmi */}
                <div className="pt-3 border-t border-slate-100 flex justify-end text-right font-serif text-[10px]">
                  <div className="space-y-1 text-center min-w-[170px]">
                    <p>Pengurus RT 002 / RW 020</p>
                    <p className="font-bold">Ketua RT 002,</p>
                    <div className="h-16 flex items-center justify-center relative py-1">
                      {tempSignature || pdfConfig.signature ? (
                        <img 
                          src={tempSignature || pdfConfig.signature} 
                          alt="Tanda Tangan" 
                          className="h-14 max-w-full object-contain relative z-10" 
                        />
                      ) : (
                        <span className="text-[9px] text-slate-300 italic font-sans">[Tanda Tangan Digital]</span>
                      )}
                      {/* Stempel Digital */}
                      {pdfConfig.stamp && (
                        <img 
                          src={pdfConfig.stamp} 
                          alt="Stempel" 
                          className="h-14 absolute opacity-70 mix-blend-multiply" 
                        />
                      )}
                    </div>
                    <p className="font-bold underline text-[10px]">
                      {pdfConfig.signatoryName || 'Muhammad Irfan, S.Kom.'}
                    </p>
                    <p className="text-[8px] text-slate-400 font-sans uppercase tracking-wider">
                      Ketua RT 002 / RW 020 Tondo
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsModalOpen(false)} 
              className="flex-1 py-3.5 rounded-2xl text-xs font-bold"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="flex-[2] py-3.5 rounded-2xl text-xs font-black shadow-lg bg-violet-600 hover:bg-violet-700 shadow-violet-600/25 text-white transition-all"
            >
              {isLoading ? 'Menyimpan...' : (editingLetter ? 'Simpan Perubahan Surat' : 'Terbitkan Surat Resmi')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
