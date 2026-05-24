import React, { useState, useEffect } from 'react';
import { FileText, AlertTriangle, CheckCircle2, XCircle, Clock, Search, Filter, Eye, MessageCircle, Sparkles, Trash2, Printer, Settings, Plus, Save, User, Home, Upload, Image as ImageIcon, Archive, RefreshCw, Phone } from 'lucide-react';
import { LetterRequest, Report, PdfConfig, OfficialLetter, House } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { updateLetterStatus, updateReportStatus, deleteLetterFromDb, updateLetterInDb, deepSanitize, safeJsonStringify, archiveOldLetters, archiveOldReports, logAction, updatePdfConfig, handleFirestoreError, OperationType, addReportToDb, subscribeToOfficialLetters } from '../../services/databaseService';
import { sendWhatsAppMessage, formatLetterStatusForWhatsApp, getWhatsAppGroups } from '../../services/whatsappService';
import { analyzeReports } from '../../services/geminiService';
import { generateSuratPengantar, generateIncidentReportPDF } from '../../services/pdfService';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SignaturePad } from './SignaturePad';
import { OfficialLetterManager } from './OfficialLetterManager';
import { LetterArchiveManager } from './LetterArchiveManager';
import { toast } from 'sonner';
import { useConfirm } from '../../context/ConfirmContext';

interface ServiceManagerProps {
  reports: Report[];
  letters: LetterRequest[];
  houses: House[];
  pdfConfig: PdfConfig;
  setPdfConfig: (config: PdfConfig) => void;
  onDeleteReport?: (id: string) => void;
}

export const ServiceManager: React.FC<ServiceManagerProps> = ({ 
  reports, 
  letters, 
  houses,
  pdfConfig, 
  setPdfConfig,
  onDeleteReport
}) => {
  const [activeTab, setActiveTab] = useState<'letters' | 'reports' | 'official-letters' | 'letter-archive' | 'settings'>('letters');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showArchived, setShowArchived] = useState(false);
  
  const [selectedLetter, setSelectedLetter] = useState<LetterRequest | null>(null);
  const [isCreatingLetter, setIsCreatingLetter] = useState(false);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [letterNumberInput, setLetterNumberInput] = useState('');
  const [adminLetterNumber, setAdminLetterNumber] = useState('');
  const [editLetterData, setEditLetterData] = useState<Partial<LetterRequest>>({});
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const confirm = useConfirm();
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [tempSignature, setTempSignature] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifyingGroup, setIsVerifyingGroup] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<{id: string, name: string}[]>([]);
  const [showGroupList, setShowGroupList] = useState(false);
  const [officialLetters, setOfficialLetters] = useState<OfficialLetter[]>([]);
  
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
    const unsubscribe = subscribeToOfficialLetters(setOfficialLetters);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!pdfConfig) return;
    let maxNum = 0;

    // Check resident letters
    letters.forEach(l => {
      if (l.letterNumber) {
        const num = extractNum(l.letterNumber);
        if (num > maxNum) maxNum = num;
      }
    });

    // Check official letters
    officialLetters.forEach(ol => {
      if (ol.letterNumber) {
        const num = extractNum(ol.letterNumber);
        if (num > maxNum) maxNum = num;
      }
    });

    if (maxNum > (pdfConfig.lastLetterNumber || 0)) {
      const newConfig = { ...pdfConfig, lastLetterNumber: maxNum };
      setPdfConfig(newConfig);
      updatePdfConfig(newConfig).catch(err => {
        console.error("Auto-sync pdfConfig error:", err);
      });
    }
  }, [letters, officialLetters, pdfConfig, setPdfConfig]);
  
  // Admin Form State
  const [adminForm, setAdminForm] = useState<Partial<LetterRequest>>({
    type: 'Surat Pengantar KTP',
    applicantName: '',
    nik: '',
    familyHeadName: '',
    birthPlace: '',
    birthDate: '',
    gender: 'Laki-laki',
    religion: 'Islam',
    job: '',
    maritalStatus: 'Kawin',
    nationality: 'Indonesia',
    addressKtp: '',
    currentAddress: '',
    houseId: '',
    purposeDetail: '',
    phone: '',
    email: '',
    education: 'SMA/Sederajat',
    familyStatus: 'Kepala Keluarga',
    bloodType: '-',
  });

  const [adminReportForm, setAdminReportForm] = useState<Partial<Report>>({
    type: 'Keamanan',
    status: 'Baru',
    reporterName: '',
    houseId: '',
    description: '',
    date: new Date().toISOString(),
    archived: false
  });

  React.useEffect(() => {
    if (selectedLetter) {
      setEditLetterData({
        applicantName: selectedLetter.applicantName,
        nik: selectedLetter.nik,
        phone: selectedLetter.phone,
        email: selectedLetter.email,
        education: selectedLetter.education,
        bloodType: selectedLetter.bloodType,
        familyStatus: selectedLetter.familyStatus,
        job: selectedLetter.job,
        addressKtp: selectedLetter.addressKtp,
        currentAddress: selectedLetter.currentAddress,
        purposeDetail: selectedLetter.purposeDetail,
        type: selectedLetter.type
      });

      if (selectedLetter.status === 'Menunggu' || selectedLetter.status === 'Pending') {
        const currentMonthRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][new Date().getMonth()];
        const currentYear = new Date().getFullYear();
        
        let maxNum = pdfConfig.lastLetterNumber || 0;
        
        // Scan resident letters
        letters.forEach(l => {
          if (l.letterNumber) {
            const num = extractNum(l.letterNumber);
            if (num > maxNum) maxNum = num;
          }
        });

        // Scan official letters
        officialLetters.forEach(ol => {
          if (ol.letterNumber) {
            const num = extractNum(ol.letterNumber);
            if (num > maxNum) maxNum = num;
          }
        });

        const nextNum = maxNum + 1;
        const paddedNum = nextNum.toString().padStart(3, '0');
        
        const words = selectedLetter.type.split(' ').filter(w => w.length > 0);
        let letterCode = words.map(w => w[0].toUpperCase()).join('');
        if (!letterCode) letterCode = 'S';
        
        setLetterNumberInput(`${letterCode}/${paddedNum}/${pdfConfig.rtName.replace(/\s/g, '')}/${currentMonthRoman}/${currentYear}`);
      } else if (selectedLetter.letterNumber) {
        setLetterNumberInput(selectedLetter.letterNumber);
      }
    }
  }, [selectedLetter, pdfConfig.lastLetterNumber, pdfConfig.rtName, letters, officialLetters]);

  React.useEffect(() => {
    if (isCreatingLetter) {
      const currentMonthRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][new Date().getMonth()];
      const currentYear = new Date().getFullYear();
      
      let maxNum = pdfConfig.lastLetterNumber || 0;
      
      // Scan resident letters
      letters.forEach(l => {
        if (l.letterNumber) {
          const num = extractNum(l.letterNumber);
          if (num > maxNum) maxNum = num;
        }
      });

      // Scan official letters
      officialLetters.forEach(ol => {
        if (ol.letterNumber) {
          const num = extractNum(ol.letterNumber);
          if (num > maxNum) maxNum = num;
        }
      });

      const nextNum = maxNum + 1;
      const paddedNum = nextNum.toString().padStart(3, '0');
      
      const words = (adminForm.type || '').split(' ').filter(w => w.length > 0);
      let letterCode = words.map(w => w[0].toUpperCase()).join('');
      if (!letterCode) letterCode = 'S';
      
      setAdminLetterNumber(`${letterCode}/${paddedNum}/${pdfConfig.rtName.replace(/\s/g, '')}/${currentMonthRoman}/${currentYear}`);
    }
  }, [isCreatingLetter, adminForm.type, pdfConfig.lastLetterNumber, pdfConfig.rtName, letters, officialLetters]);

  const handleAnalyzeReports = async () => {
    setIsAiLoading(true);
    const reportTexts = reports.map(r => r.description);
    const analysis = await analyzeReports(reportTexts);
    setAiAnalysis(analysis);
    setIsAiLoading(false);
  };

  const handleUpdateLetterStatus = async (id: string, status: 'Disetujui' | 'Ditolak', letter?: LetterRequest, tempSignature?: string | null) => {
    const isConfirmed = await confirm({
      title: 'Update Status Surat',
      message: `Apakah Anda yakin ingin mengubah status pengajuan surat ini menjadi ${status}?`,
      confirmLabel: 'Ubah Status',
      isDanger: status === 'Ditolak'
    });

    if (isConfirmed) {
      try {
        await updateLetterStatus(id, status, status === 'Disetujui' ? letterNumberInput : undefined);
        await logAction('Update Status Surat', `Ubah status surat ${id} menjadi ${status}`);
        
        if (status === 'Disetujui' && letter) {
          // Generate official PDF with stamp and signature
          const updatedLetter = { ...letter, letterNumber: letterNumberInput };
          
          // Use tempSignature if provided, otherwise use global pdfConfig.signature
          const configToUse = tempSignature ? { ...pdfConfig, signature: tempSignature } : pdfConfig;
          
          await generateSuratPengantar(updatedLetter, configToUse, false);
        }

        // Update lastLetterNumber in config based on the number used
        let nextNum = (pdfConfig.lastLetterNumber || 0);
        const parts = letterNumberInput.split('/');
        
        if (parts.length >= 2) {
          const extractedNum = parseInt(parts[1]);
          if (!isNaN(extractedNum) && extractedNum > nextNum) nextNum = extractedNum;
        } else {
          // Fallback: try to find any number in the input if format doesn't match
          const match = letterNumberInput.match(/(\d+)/);
          if (match) {
            const extractedNum = parseInt(match[1]);
            if (!isNaN(extractedNum) && extractedNum > nextNum) nextNum = extractedNum;
          }
        }

        const newConfig = { ...pdfConfig, lastLetterNumber: nextNum };
        setPdfConfig(newConfig);
        await updatePdfConfig(newConfig);
        
        setSelectedLetter(null);
        setLetterNumberInput('');
        setTempSignature(null);
        toast.success(`Status surat berhasil diubah menjadi ${status}`);
      } catch (error) {
        console.error(error);
        toast.error('Gagal mengubah status surat.');
      }
    }
  };

  const handleSaveLetterDetails = async () => {
    if (!selectedLetter) return;
    try {
      await updateLetterInDb(selectedLetter.id, {
        ...editLetterData,
        letterNumber: letterNumberInput
      });
      
      // Update lastLetterNumber in config if it's a valid number
      let nextNum = (pdfConfig.lastLetterNumber || 0);
      const parts = letterNumberInput.split('/');
      
      if (parts.length >= 2) {
        const extractedNum = parseInt(parts[1]);
        if (!isNaN(extractedNum) && extractedNum > nextNum) nextNum = extractedNum;
      } else {
        // Fallback for manual entry without slashes
        const match = letterNumberInput.match(/(\d+)/);
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
      
      toast.success("Detail surat berhasil disimpan!");
    } catch (error) {
      console.error("Error saving letter details:", error);
      toast.error("Gagal menyimpan detail surat.");
    }
  };

  const handleUpdateReportStatus = async (id: string, status: 'Diproses' | 'Selesai') => {
    const isConfirmed = await confirm({
      title: 'Update Status Laporan',
      message: `Apakah Anda yakin ingin mengubah status laporan warga ini menjadi ${status}?`,
      confirmLabel: 'Update Status'
    });

    if (isConfirmed) {
      try {
        await updateReportStatus(id, status);
        await logAction('Update Status Laporan', `Ubah status laporan ${id} menjadi ${status}`);
        setSelectedReport(null);
        toast.success(`Status laporan berhasil diubah menjadi ${status}`);
      } catch (error) {
        console.error(error);
        toast.error('Gagal mengubah status laporan.');
      }
    }
  };

  const handleArchiveReport = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Arsipkan Laporan',
      message: 'Arsipkan laporan ini? Laporan tidak akan muncul di daftar utama.',
      confirmLabel: 'Arsipkan'
    });

    if (isConfirmed) {
      try {
        await updateReportStatus(id, 'Selesai'); // Ensure it's finished
        const { updateDoc, doc } = await import('firebase/firestore');
        const { db } = await import('../../services/firebaseConfig');
        await updateDoc(doc(db, 'reports', id), { archived: true });
        toast.success('Laporan berhasil diarsipkan.');
      } catch (error) {
        console.error(error);
        toast.error('Gagal mengarsipkan laporan.');
      }
    }
  };

  const handleArchiveLetter = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Arsipkan Surat',
      message: 'Arsipkan surat ini? Surat tidak akan muncul di daftar utama.',
      confirmLabel: 'Arsipkan'
    });

    if (isConfirmed) {
      try {
        await updateLetterInDb(id, { archived: true });
        toast.success('Surat berhasil diarsipkan.');
      } catch (error) {
        console.error(error);
        toast.error('Gagal mengarsipkan surat.');
      }
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReportForm.description || !adminReportForm.reporterName) {
      toast.error("Mohon lengkapi data laporan!");
      return;
    }

    setIsSaving(true);
    try {
      const reportData = {
        ...adminReportForm,
        date: new Date().toISOString(),
        archived: false,
        status: adminReportForm.status || 'Baru'
      };
      
      await addReportToDb(reportData);
      await logAction('Buat Laporan Baru', `Admin membuat laporan baru: ${adminReportForm.description}`);
      
      toast.success("Laporan berhasil dibuat!");
      setIsCreatingReport(false);
      setAdminReportForm({
        type: 'Keamanan',
        status: 'Baru',
        date: new Date().toISOString(),
        archived: false
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reports');
      toast.error("Gagal membuat laporan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoArchive = async () => {
    const toastId = toast.loading('Sedang mengarsipkan data lama...');
    try {
      const archivedLetters = await archiveOldLetters(30);
      const archivedReports = await archiveOldReports(30);
      toast.success(`Berhasil mengarsipkan ${archivedLetters} surat dan ${archivedReports} laporan lama.`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Gagal menjalankan auto-arsip.', { id: toastId });
    }
  };

  const handleDeleteLetter = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Pengajuan Surat',
      message: 'Apakah Anda yakin ingin menghapus pengajuan surat ini secara permanen? Data yang sudah dihapus tidak dapat dikembalikan.',
      confirmLabel: 'Hapus Permanen',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await deleteLetterFromDb(id);
        toast.success('Pengajuan surat berhasil dihapus.');
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus pengajuan surat.');
      }
    }
  };

  const handleAdminCreateLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    const newLetter: LetterRequest = {
      ...adminForm as LetterRequest,
      id: Date.now().toString(),
      status: 'Disetujui',
      date: new Date().toISOString(),
      letterNumber: adminLetterNumber
    };

    const { addLetterToDb } = await import('../../services/databaseService');
    await addLetterToDb(newLetter);

    // Use tempSignature if provided, otherwise use global pdfConfig.signature
    const configToUse = tempSignature ? { ...pdfConfig, signature: tempSignature } : pdfConfig;
    
    await generateSuratPengantar(newLetter, configToUse, false);

    // Update lastLetterNumber in config based on the number used
    let nextNum = (pdfConfig.lastLetterNumber || 0);
    const parts = adminLetterNumber.split('/');
    
    if (parts.length >= 2) {
      const extractedNum = parseInt(parts[1]);
      if (!isNaN(extractedNum) && extractedNum > nextNum) nextNum = extractedNum;
    } else {
      const match = adminLetterNumber.match(/(\d+)/);
      if (match) {
        const extractedNum = parseInt(match[1]);
        if (!isNaN(extractedNum) && extractedNum > nextNum) nextNum = extractedNum;
      }
    }

    const newConfig = { ...pdfConfig, lastLetterNumber: nextNum };
    setPdfConfig(newConfig);
    await updatePdfConfig(newConfig);

    setIsCreatingLetter(false);
    toast.success("Surat berhasil dibuat dan diunduh!");
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await updatePdfConfig(pdfConfig);
      toast.success('Konfigurasi berhasil disimpan ke cloud!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "pdfConfig");
      toast.error('Gagal menyimpan konfigurasi ke cloud.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyGroup = async () => {
    setIsVerifyingGroup(true);
    try {
      const result = await getWhatsAppGroups();
      if (result?.success && Array.isArray(result?.data)) {
        setAvailableGroups(result.data.map((g: any) => ({
          id: g.id || g.jid,
          name: g.name || g.subject
        })));
        setShowGroupList(true);
        toast.success(`Ditemukan ${result.data.length} grup.`);
      } else if (result?.error) {
        toast.error(`Gagal: ${result?.error}`);
      } else {
        const data = result?.data || result;
        if (Array.isArray(data)) {
          setAvailableGroups(data.map((g: any) => ({
            id: g.id || g.jid,
            name: g.name || g.subject
          })));
          setShowGroupList(true);
          toast.success(`Ditemukan ${data.length} grup.`);
        } else {
          toast.error('Gagal mengambil daftar grup. Pastikan API Key benar.');
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat verifikasi.');
    } finally {
      setIsVerifyingGroup(false);
    }
  };

  const selectGroup = (id: string, name: string) => {
    const newConfig = {
      ...pdfConfig,
      whatsappGroupId: id,
      whatsappGroupName: name
    };
    setPdfConfig(newConfig);
    setShowGroupList(false);
  };

  const filteredLetters = letters.filter(l => {
    const matchSearch = l.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        l.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'All' || l.status === filterStatus;
    const matchArchived = showArchived ? l.archived === true : !l.archived;
    return matchSearch && matchStatus && matchArchived;
  }).sort((a, b) => {
    const isNewA = a.status === 'Menunggu' || a.status === 'Pending';
    const isNewB = b.status === 'Menunggu' || b.status === 'Pending';
    if (isNewA && !isNewB) return -1;
    if (!isNewA && isNewB) return 1;
    
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    return timeB - timeA;
  });

  const filteredReports = reports.filter(r => {
    const matchSearch = r.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        r.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'All' || r.status === filterStatus;
    const matchArchived = showArchived ? r.archived === true : !r.archived;
    return matchSearch && matchStatus && matchArchived;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof PdfConfig) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newConfig = { ...pdfConfig, [field]: reader.result as string };
        setPdfConfig(newConfig);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Layanan & Aduan</h2>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">Pusat pengelolaan surat pengantar dan laporan warga.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200/50 shadow-inner overflow-x-auto no-scrollbar w-full md:w-auto">
          <div className="flex min-w-max w-full">
            <button 
              onClick={() => setActiveTab('letters')} 
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'letters' 
                  ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <FileText size={14} className="sm:w-4 sm:h-4" />
              <span>Surat ({letters.filter(l => l.status === 'Menunggu' || l.status === 'Pending').length})</span>
            </button>
            <button 
              onClick={() => setActiveTab('reports')} 
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'reports' 
                  ? 'bg-white text-rose-600 shadow-md ring-1 ring-black/5' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <AlertTriangle size={14} className="sm:w-4 sm:h-4" />
              <span>Aspirasi & Pengaduan ({reports.filter(r => r.status === 'Baru').length})</span>
            </button>
            <button 
              onClick={() => setActiveTab('official-letters')} 
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'official-letters' 
                  ? 'bg-white text-amber-600 shadow-md ring-1 ring-black/5' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <FileText size={14} className="sm:w-4 sm:h-4" />
              <span>Surat Resmi</span>
            </button>
            <button 
              onClick={() => setActiveTab('letter-archive')} 
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'letter-archive' 
                  ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Archive size={14} className="sm:w-4 sm:h-4" />
              <span>Arsip Surat</span>
            </button>
            <button 
              onClick={() => setActiveTab('settings')} 
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'settings' 
                  ? 'bg-white text-slate-800 shadow-md ring-1 ring-black/5' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Settings size={14} className="sm:w-4 sm:h-4" />
              <span>Pengaturan</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'reports' && (
        <div className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm font-bold text-slate-600">Butuh bantuan menganalisis laporan warga?</p>
          <Button onClick={handleAnalyzeReports} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700">
            <Sparkles size={18} className="mr-2" /> {isAiLoading ? 'Menganalisis...' : 'Analisis dengan AI'}
          </Button>
        </div>
      )}

      {aiAnalysis && (
        <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl">
          <h4 className="font-bold text-lg mb-4 text-indigo-300">Hasil Analisis AI:</h4>
          <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
            {aiAnalysis}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-white p-4 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder={activeTab === 'letters' ? "Cari pemohon atau jenis surat..." : "Cari pelapor atau isi laporan..."}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {activeTab === 'letters' && (
            <Button onClick={() => setIsCreatingLetter(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus size={18} className="mr-2" /> Buat Surat Baru
            </Button>
          )}
          {activeTab === 'reports' && (
            <div className="flex gap-2">
              <Button 
                onClick={() => generateIncidentReportPDF(filteredReports, houses, pdfConfig)} 
                className="bg-slate-800 hover:bg-slate-900 border border-slate-700 shadow-lg shadow-slate-200"
              >
                <Printer size={18} className="mr-2" /> Cetak Rekap Harian
              </Button>
              <Button onClick={() => setIsCreatingReport(true)} className="bg-rose-600 hover:bg-rose-700">
                <Plus size={18} className="mr-2" /> Buat Aspirasi/Pengaduan
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
             <Filter size={14} className="text-slate-400"/>
             <select className="bg-transparent border-none text-[10px] sm:text-xs font-black text-slate-600 uppercase tracking-widest outline-none cursor-pointer w-full" value={filterStatus} onChange={(e:any) => setFilterStatus(e.target.value)}>
               <option value="All">Semua Status</option>
               {activeTab === 'letters' ? (
                 <>
                   <option value="Menunggu">Menunggu</option>
                   <option value="Disetujui">Disetujui</option>
                   <option value="Ditolak">Ditolak</option>
                 </>
               ) : (
                 <>
                   <option value="Baru">Baru</option>
                   <option value="Diproses">Diproses</option>
                   <option value="Selesai">Selesai</option>
                 </>
               )}
             </select>
          </div>
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${
              showArchived 
                ? 'bg-indigo-600 text-white border-indigo-600' 
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Archive size={14} />
            {showArchived ? 'Lihat Aktif' : 'Lihat Arsip'}
          </button>
          {!showArchived && (
            <button 
              onClick={handleAutoArchive}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-2xl hover:bg-amber-100 transition-all text-[10px] font-black uppercase tracking-widest"
              title="Arsipkan data yang sudah selesai lebih dari 30 hari"
            >
              <Archive size={14} />
              Auto Arsip
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'official-letters' ? (
          <motion.div
            key="official-letters"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <OfficialLetterManager pdfConfig={pdfConfig} setPdfConfig={setPdfConfig} residentLetters={letters} />
          </motion.div>
        ) : activeTab === 'letter-archive' ? (
          <motion.div
            key="letter-archive"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <LetterArchiveManager pdfConfig={pdfConfig} />
          </motion.div>
        ) : activeTab === 'settings' ? (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl">
                    <Settings size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Konfigurasi Kop Surat & Validasi</h3>
                    <p className="text-sm font-medium text-slate-500">Atur informasi RT dan aset visual untuk dokumen resmi.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nama RT (Kop Surat)</label>
                      <input 
                        type="text"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                        value={pdfConfig.rtName || ''} 
                        onChange={e => {
                          const newConfig = {...pdfConfig, rtName: e.target.value};
                          setPdfConfig(newConfig);
                        }} 
                        placeholder="RT 02 / RW 005"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nama Ketua RT</label>
                      <input 
                        type="text"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                        value={pdfConfig.rtChairman || ''} 
                        onChange={e => {
                          const newConfig = {...pdfConfig, rtChairman: e.target.value};
                          setPdfConfig(newConfig);
                        }} 
                        placeholder="NAMA KETUA RT"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">No. Surat Terakhir</label>
                      <div className="flex gap-2">
                        <input 
                          type="number"
                          className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                          value={pdfConfig.lastLetterNumber || 0} 
                          onChange={e => {
                            const newConfig = {...pdfConfig, lastLetterNumber: parseInt(e.target.value) || 0};
                            setPdfConfig(newConfig);
                          }} 
                          placeholder="0"
                        />
                        <button 
                          onClick={async () => {
                            let maxNum = 0;
                            // Scan resident letters
                            letters.forEach(l => {
                              if (l.letterNumber) {
                                const match = ["", (extractNum(l.letterNumber) || 0).toString()];
                                if (match) {
                                  const num = parseInt(match[1]);
                                  if (!isNaN(num) && num > maxNum) maxNum = num;
                                }
                              }
                            });
                            // Scan official letters
                            officialLetters.forEach(ol => {
                              if (ol.letterNumber) {
                                const match = ["", (extractNum(ol.letterNumber) || 0).toString()];
                                if (match) {
                                  const num = parseInt(match[1]);
                                  if (!isNaN(num) && num > maxNum) maxNum = num;
                                }
                              }
                            });
                            if (maxNum > 0) {
                              const newConfig = { ...pdfConfig, lastLetterNumber: maxNum };
                              setPdfConfig(newConfig);
                              try {
                                await updatePdfConfig(newConfig);
                                toast.success(`Counter disinkronkan ke nomor: ${maxNum} (dari seluruh dokumen surat)`);
                              } catch (err) {
                                console.error(err);
                                toast.error("Gagal menyimpan sinkronisasi nomor surat ke cloud.");
                              }
                            } else {
                              toast.error("Tidak ditemukan nomor surat valid untuk sinkronisasi.");
                            }
                          }}
                          className="px-4 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl hover:bg-indigo-100 transition-all"
                          title="Sinkronkan dengan nomor tertinggi dari surat yang ada"
                        >
                          <RefreshCw size={18} />
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1 ml-1 leading-tight">
                        Digunakan untuk penomoran otomatis. Format: KODE/NOMOR/RT/BULAN/TAHUN
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Kelurahan</label>
                      <input 
                        type="text"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                        value={pdfConfig.kelurahan || ''} 
                        onChange={e => {
                          const newConfig = {...pdfConfig, kelurahan: e.target.value};
                          setPdfConfig(newConfig);
                          localStorage.setItem('pdf_config', JSON.stringify(deepSanitize(newConfig)));
                        }} 
                        placeholder="TONDO"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Kecamatan</label>
                      <input 
                        type="text"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                        value={pdfConfig.kecamatan || ''} 
                        onChange={e => {
                          const newConfig = {...pdfConfig, kecamatan: e.target.value};
                          setPdfConfig(newConfig);
                          localStorage.setItem('pdf_config', JSON.stringify(deepSanitize(newConfig)));
                        }} 
                        placeholder="MANTIKULORE"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Kota</label>
                      <input 
                        type="text"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                        value={pdfConfig.kota || ''} 
                        onChange={e => {
                          const newConfig = {...pdfConfig, kota: e.target.value};
                          setPdfConfig(newConfig);
                          localStorage.setItem('pdf_config', JSON.stringify(deepSanitize(newConfig)));
                        }} 
                        placeholder="PALU"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Alamat Lengkap RT</label>
                    <textarea 
                      rows={3}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all resize-none" 
                      value={pdfConfig.rtAddress || ''} 
                      onChange={e => {
                        const newConfig = {...pdfConfig, rtAddress: e.target.value};
                        setPdfConfig(newConfig);
                        localStorage.setItem('pdf_config', JSON.stringify(deepSanitize(newConfig)));
                      }} 
                      placeholder="Alamat lengkap untuk kop surat..."
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Logo */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Logo RT / Kota</p>
                    <div className="relative aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center overflow-hidden group/upload">
                      {pdfConfig.logo ? (
                        <>
                          <img src={pdfConfig.logo} alt="Logo" className="w-full h-full object-contain p-4" />
                          <button 
                            onClick={() => {
                              const newConfig = {...pdfConfig, logo: ''};
                              setPdfConfig(newConfig);
                              localStorage.setItem('pdf_config', JSON.stringify(deepSanitize(newConfig)));
                            }}
                            className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-xl opacity-0 group-hover/upload:opacity-100 transition-opacity shadow-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <ImageIcon size={24} className="mx-auto text-slate-300 mb-1" />
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Belum Ada Logo</p>
                        </div>
                      )}
                      <label className="absolute inset-0 cursor-pointer">
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                      </label>
                    </div>
                  </div>

                  {/* Stempel */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Stempel RT</p>
                    <div className="relative aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center overflow-hidden group/upload">
                      {pdfConfig.stamp ? (
                        <>
                          <img src={pdfConfig.stamp} alt="Stempel" className="w-full h-full object-contain p-4" />
                          <button 
                            onClick={() => {
                              const newConfig = {...pdfConfig, stamp: ''};
                              setPdfConfig(newConfig);
                              localStorage.setItem('pdf_config', JSON.stringify(deepSanitize(newConfig)));
                            }}
                            className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-xl opacity-0 group-hover/upload:opacity-100 transition-opacity shadow-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <ImageIcon size={24} className="mx-auto text-slate-300 mb-1" />
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Belum Ada Stempel</p>
                        </div>
                      )}
                      <label className="absolute inset-0 cursor-pointer">
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'stamp')} />
                      </label>
                    </div>
                  </div>

                  {/* Tanda Tangan */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tanda Tangan Ketua RT</p>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                      <SignaturePad 
                        initialValue={pdfConfig.signature}
                        onSave={(dataUrl) => {
                          const newConfig = { ...pdfConfig, signature: dataUrl };
                          setPdfConfig(newConfig);
                          toast.success("Tanda tangan berhasil disimpan!");
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Pengaturan Template Surat</h3>
                    <p className="text-sm font-medium text-slate-500">Atur jenis surat dan saran pengisian untuk warga.</p>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    const newTemplates = [...(pdfConfig.letterTemplates || []), { type: 'Jenis Surat Baru', suggestion: 'Isi saran pengisian di sini...' }];
                    const newConfig = { ...pdfConfig, letterTemplates: newTemplates };
                    setPdfConfig(newConfig);
                    localStorage.setItem('pdf_config', JSON.stringify(deepSanitize(newConfig)));
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus size={18} className="mr-2" /> Tambah Jenis Surat
                </Button>
              </div>

              <div className="space-y-6">
                {(pdfConfig.letterTemplates || [
                  { type: 'Surat Pengantar', suggestion: 'Surat pengantar umum untuk berbagai keperluan administratif.' },
                  { type: 'Surat Pengantar KTP', suggestion: 'Persyaratan permohonan pembuatan KTP baru / perpanjangan KTP di Kantor Kelurahan.' },
                  { type: 'Surat Pengantar KK', suggestion: 'Persyaratan perubahan data Kartu Keluarga / penambahan anggota keluarga baru.' },
                  { type: 'Surat Keterangan Domisili', suggestion: 'Keterangan domisili untuk keperluan melamar pekerjaan / pembukaan rekening bank.' },
                  { type: 'Surat Keterangan Tidak Mampu', suggestion: 'Persyaratan pengajuan bantuan sosial / beasiswa pendidikan / keringanan biaya medis.' },
                  { type: 'Surat Izin Keramaian', suggestion: 'Permohonan izin penyelenggaraan acara [Nama Acara] pada tanggal [Tanggal] di [Lokasi].' },
                  { type: 'Surat Keterangan Usaha', suggestion: 'Persyaratan pengajuan modal usaha / pembuatan NPWP badan usaha.' },
                  { type: 'Surat Keterangan Berkelakuan Baik', suggestion: 'Persyaratan melamar pekerjaan / pendaftaran institusi pendidikan.' },
                ]).map((template, idx) => (
                  <div key={idx} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative group">
                    <button 
                      onClick={() => {
                        const newTemplates = (pdfConfig.letterTemplates || []).filter((_, i) => i !== idx);
                        const newConfig = { ...pdfConfig, letterTemplates: newTemplates };
                        setPdfConfig(newConfig);
                        localStorage.setItem('pdf_config', JSON.stringify(deepSanitize(newConfig)));
                      }}
                      className="absolute top-4 right-4 p-2 text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Jenis Surat</label>
                        <input 
                          className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                          value={template.type}
                          onChange={(e) => {
                            const newTemplates = [...(pdfConfig.letterTemplates || [])];
                            if (newTemplates.length === 0) {
                              // Initialize if empty
                              newTemplates.push(...[
                                { type: 'Surat Pengantar', suggestion: 'Surat pengantar umum untuk berbagai keperluan administratif.' },
                                { type: 'Surat Pengantar KTP', suggestion: 'Persyaratan permohonan pembuatan KTP baru / perpanjangan KTP di Kantor Kelurahan.' },
                                { type: 'Surat Pengantar KK', suggestion: 'Persyaratan perubahan data Kartu Keluarga / penambahan anggota keluarga baru.' },
                                { type: 'Surat Keterangan Domisili', suggestion: 'Keterangan domisili untuk keperluan melamar pekerjaan / pembukaan rekening bank.' },
                                { type: 'Surat Keterangan Tidak Mampu', suggestion: 'Persyaratan pengajuan bantuan sosial / beasiswa pendidikan / keringanan biaya medis.' },
                                { type: 'Surat Izin Keramaian', suggestion: 'Permohonan izin penyelenggaraan acara [Nama Acara] pada tanggal [Tanggal] di [Lokasi].' },
                                { type: 'Surat Keterangan Usaha', suggestion: 'Persyaratan pengajuan modal usaha / pembuatan NPWP badan usaha.' },
                                { type: 'Surat Keterangan Berkelakuan Baik', suggestion: 'Persyaratan melamar pekerjaan / pendaftaran institusi pendidikan.' },
                              ]);
                            }
                            newTemplates[idx].type = e.target.value;
                            const newConfig = { ...pdfConfig, letterTemplates: newTemplates };
                            setPdfConfig(newConfig);
                            localStorage.setItem('pdf_config', JSON.stringify(deepSanitize(newConfig)));
                          }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Saran Pengisian (Template)</label>
                        <textarea 
                          className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none transition-all h-20 resize-none"
                          value={template.suggestion}
                          onChange={(e) => {
                            const newTemplates = [...(pdfConfig.letterTemplates || [])];
                            if (newTemplates.length === 0) {
                              newTemplates.push(...[
                                { type: 'Surat Pengantar', suggestion: 'Surat pengantar umum untuk berbagai keperluan administratif.' },
                                { type: 'Surat Pengantar KTP', suggestion: 'Persyaratan permohonan pembuatan KTP baru / perpanjangan KTP di Kantor Kelurahan.' },
                                { type: 'Surat Pengantar KK', suggestion: 'Persyaratan perubahan data Kartu Keluarga / penambahan anggota keluarga baru.' },
                                { type: 'Surat Keterangan Domisili', suggestion: 'Keterangan domisili untuk keperluan melamar pekerjaan / pembukaan rekening bank.' },
                                { type: 'Surat Keterangan Tidak Mampu', suggestion: 'Persyaratan pengajuan bantuan sosial / beasiswa pendidikan / keringanan biaya medis.' },
                                { type: 'Surat Izin Keramaian', suggestion: 'Permohonan izin penyelenggaraan acara [Nama Acara] pada tanggal [Tanggal] di [Lokasi].' },
                                { type: 'Surat Keterangan Usaha', suggestion: 'Persyaratan pengajuan modal usaha / pembuatan NPWP badan usaha.' },
                                { type: 'Surat Keterangan Berkelakuan Baik', suggestion: 'Persyaratan melamar pekerjaan / pendaftaran institusi pendidikan.' },
                              ]);
                            }
                            newTemplates[idx].suggestion = e.target.value;
                            const newConfig = { ...pdfConfig, letterTemplates: newTemplates };
                            setPdfConfig(newConfig);
                            localStorage.setItem('pdf_config', JSON.stringify(deepSanitize(newConfig)));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Teks Pembuka Surat (Intro)</label>
                  <textarea 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all h-32 resize-none"
                    value={pdfConfig.introText || `Yang bertanda tangan di bawah ini Ketua ${pdfConfig.rtName}, Kel. ${pdfConfig.kelurahan || 'Tondo'}, Kec. ${pdfConfig.kecamatan || 'Mantikulore'}, Kota ${pdfConfig.kota || 'Palu'}, Provinsi Sulawesi Tengah menerangkan dengan sebenarnya bahwa :`}
                    onChange={(e) => {
                      const newConfig = { ...pdfConfig, introText: e.target.value };
                      setPdfConfig(newConfig);
                      localStorage.setItem('pdf_config', JSON.stringify(deepSanitize(newConfig)));
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Teks Penutup Surat (Closing)</label>
                  <textarea 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all h-32 resize-none"
                    value={pdfConfig.closingText || "Demikian surat keterangan ini dibuat, untuk dipergunakan sebagaimana mestinya."}
                    onChange={(e) => {
                      const newConfig = { ...pdfConfig, closingText: e.target.value };
                      setPdfConfig(newConfig);
                      localStorage.setItem('pdf_config', JSON.stringify(deepSanitize(newConfig)));
                    }}
                  />
                </div>
              </div>

              {/* Field Visibility Toggles */}
              <div className="mt-12 pt-12 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Eye size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Visibilitas Data Surat</h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">Pilih data apa saja yang akan ditampilkan pada Surat Pengantar PDF.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { id: 'applicantName', defaultLabel: 'Nama Lengkap' },
                    { id: 'nik', defaultLabel: 'NIK / No KTP' },
                    { id: 'familyHeadName', defaultLabel: 'Kepala Keluarga' },
                    { id: 'birthPlaceDate', defaultLabel: 'Tempat/Tgl Lahir' },
                    { id: 'gender', defaultLabel: 'Jenis Kelamin' },
                    { id: 'addressKtp', defaultLabel: 'Alamat KTP' },
                    { id: 'currentAddress', defaultLabel: 'Alamat Domisili' },
                    { id: 'religion', defaultLabel: 'Agama' },
                    { id: 'maritalStatus', defaultLabel: 'Status Kawin' },
                    { id: 'job', defaultLabel: 'Pekerjaan' },
                    { id: 'education', defaultLabel: 'Pendidikan' },
                    { id: 'familyStatus', defaultLabel: 'Hub. Keluarga' },
                    { id: 'bloodType', defaultLabel: 'Gol. Darah' },
                    { id: 'nationality', defaultLabel: 'Kewarganegaraan' },
                    { id: 'purposeDetail', defaultLabel: 'Keperluan' }
                  ].map(field => (
                    <div 
                      key={field.id}
                      className={`
                        p-4 rounded-2xl border transition-all
                        ${(pdfConfig.visibleFields?.[field.id] !== false) 
                          ? 'bg-white border-slate-200 shadow-sm' 
                          : 'bg-slate-50 border-slate-100 opacity-60 hover:opacity-100'}
                      `}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Field ID: {field.id}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={pdfConfig.visibleFields?.[field.id] !== false}
                            onChange={(e) => {
                              const newVisibleFields = { 
                                ...(pdfConfig.visibleFields || {}), 
                                [field.id]: e.target.checked 
                              };
                              const newConfig = { ...pdfConfig, visibleFields: newVisibleFields };
                              setPdfConfig(newConfig);
                              localStorage.setItem('pdf_config', JSON.stringify(deepSanitize(newConfig)));
                            }}
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                      <input 
                        type="text"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                        value={pdfConfig.fieldLabels?.[field.id] || field.defaultLabel}
                        onChange={(e) => {
                          const newLabels = {
                            ...(pdfConfig.fieldLabels || {}),
                            [field.id]: e.target.value
                          };
                          const newConfig = { ...pdfConfig, fieldLabels: newLabels };
                          setPdfConfig(newConfig);
                          localStorage.setItem('pdf_config', JSON.stringify(deepSanitize(newConfig)));
                        }}
                        placeholder={field.defaultLabel}
                        disabled={pdfConfig.visibleFields?.[field.id] === false}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* WhatsApp Integration */}
              <div className="mt-12 pt-12 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <MessageCircle size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Integrasi WhatsApp</h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">Hubungkan aplikasi dengan grup WhatsApp warga untuk notifikasi otomatis.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Group ID (JID)</label>
                    <div className="flex gap-2">
                      <input 
                        className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all font-mono" 
                        placeholder="Cth: 1234567890@g.us"
                        value={pdfConfig.whatsappGroupId || ''} 
                        onChange={e => {
                          const newConfig = {...pdfConfig, whatsappGroupId: e.target.value};
                          setPdfConfig(newConfig);
                          localStorage.setItem('pdf_config', JSON.stringify(deepSanitize(newConfig)));
                        }} 
                      />
                      <button 
                        type="button" 
                        onClick={handleVerifyGroup}
                        disabled={isVerifyingGroup}
                        className="px-4 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl hover:bg-indigo-100 transition-all"
                      >
                        {isVerifyingGroup ? '...' : <Search size={18} />}
                      </button>
                    </div>

                    {showGroupList && availableGroups.length > 0 && (
                      <div className="p-3 bg-white border border-indigo-100 rounded-xl shadow-inner max-h-40 overflow-y-auto space-y-2">
                        <p className="text-[10px] font-bold text-indigo-600 uppercase mb-2">Pilih dari Grup Anda:</p>
                        {availableGroups.map(group => (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => selectGroup(group.id, group.name)}
                            className="w-full text-left p-2 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-between group"
                          >
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-slate-700 truncate">{group.name}</p>
                              <p className="text-[9px] text-slate-400 truncate">{group.id}</p>
                            </div>
                            <CheckCircle2 size={14} className="text-indigo-400 opacity-0 group-hover:opacity-100" />
                          </button>
                        ))}
                        <button 
                          type="button" 
                          onClick={() => setShowGroupList(false)}
                          className="w-full text-center py-1 text-[10px] text-slate-400 hover:text-slate-600"
                        >
                          Tutup Daftar
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Grup WhatsApp (Display)</label>
                    <input 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                      placeholder="Cth: Warga RT 02 Official"
                      value={pdfConfig.whatsappGroupName || ''} 
                      onChange={e => {
                        const newConfig = {...pdfConfig, whatsappGroupName: e.target.value};
                        setPdfConfig(newConfig);
                        localStorage.setItem('pdf_config', JSON.stringify(deepSanitize(newConfig)));
                      }} 
                    />
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-100">
                <Button 
                  onClick={handleSaveConfig} 
                  className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100 rounded-[2rem]"
                  disabled={isSaving}
                >
                  <Save size={20} className="mr-2" /> 
                  {isSaving ? 'Menyimpan...' : 'Simpan Seluruh Konfigurasi ke Cloud'}
                </Button>
                <p className="text-[10px] text-center text-slate-400 mt-4 font-bold uppercase tracking-widest">
                  Klik simpan agar perubahan logo, stempel, TTD, dan WhatsApp tersimpan permanen.
                </p>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'letters' ? (
          <motion.div 
            key="letters"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredLetters.map((letter) => {
              const dateObj = new Date(letter.date);
              const formattedDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Makassar' });
              const hasTime = letter.date && (letter.date.includes('T') || letter.date.includes(':'));
              const formattedTime = hasTime && !isNaN(dateObj.getTime()) ? dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Makassar' }) + ' WITA' : '';
              
              return (
                <motion.div 
                  key={letter.id}
                  layout
                  className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all group relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[2.5rem] flex items-center justify-center ${
                    letter.status === 'Menunggu' || letter.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                    letter.status === 'Disetujui' || letter.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-rose-50 text-rose-600'
                  }`}>
                    {(letter.status === 'Menunggu' || letter.status === 'Pending') && <Clock size={24} />}
                    {(letter.status === 'Disetujui' || letter.status === 'Approved') && <CheckCircle2 size={24} />}
                    {(letter.status === 'Ditolak' || letter.status === 'Rejected') && <XCircle size={24} />}
                  </div>

                  <div className="mb-6 relative z-10">
                    <span className="inline-block px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-3 border border-indigo-100">
                      {letter.type}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 leading-tight mb-1">{letter.applicantName}</h3>
                    <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500 mt-1">
                      <span className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">Blok {letter.houseId}</span>
                      {letter.nik && <span className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md text-slate-400">NIK {letter.nik}</span>}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 relative z-10">
                    <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100/80 space-y-1 text-xs">
                      <div className="flex items-center gap-2 text-slate-500 font-bold">
                        <Clock size={13} className="text-slate-400" />
                        <span>Waktu Pengajuan:</span>
                      </div>
                      <div className="pl-5 text-slate-700 font-black flex flex-col">
                        <span>{formattedDate}</span>
                        {formattedTime && <span className="text-indigo-600 text-[11px] font-bold">{formattedTime}</span>}
                      </div>
                    </div>

                    {letter.phone && (
                      <div className="flex items-center gap-2 pl-3 text-xs text-slate-500 font-bold">
                        <Phone size={13} className="text-indigo-500" />
                        <span>Telepon: <span className="text-slate-700 font-extrabold">{letter.phone}</span></span>
                      </div>
                    )}

                    <div className="p-3 bg-slate-50 rounded-2xl text-xs text-slate-600 leading-relaxed border border-slate-100">
                      <span className="font-bold block mb-1 text-slate-400 uppercase tracking-wider text-[10px]">Keperluan:</span>
                      <p className="line-clamp-2 text-slate-600 font-medium">{letter.purposeDetail || '-'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 relative z-10">
                    <button 
                      onClick={() => setSelectedLetter(letter)}
                      className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
                    >
                      <Eye size={14} /> Detail
                    </button>
                    
                    {letter.status === 'Disetujui' && (
                      <button 
                        onClick={async () => {
                          try {
                            await generateSuratPengantar(letter, pdfConfig, false);
                            toast.success('Surat sedang diunduh...');
                          } catch (err) {
                            console.error("Print Error:", err);
                            toast.error("Gagal mencetak surat. Pastikan data lengkap.");
                          }
                        }}
                        className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-100"
                        title="Cetak Surat"
                      >
                        <Printer size={16} />
                      </button>
                    )}

                    <button 
                      onClick={() => handleDeleteLetter(letter.id)}
                      className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors border border-rose-100"
                      title="Hapus Pengajuan"
                    >
                      <Trash2 size={16} />
                    </button>

                    {!letter.archived && (letter.status === 'Disetujui' || letter.status === 'Ditolak') && (
                      <button 
                        onClick={() => handleArchiveLetter(letter.id)}
                        className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors border border-amber-100"
                        title="Arsipkan"
                      >
                        <Archive size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div 
            key="reports"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {filteredReports.map((report) => (
              <motion.div 
                key={report.id}
                layout
                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-rose-100/50 transition-all flex flex-col md:flex-row gap-6 items-start md:items-center group"
              >
                <div className={`p-4 rounded-2xl shrink-0 ${
                  report.type === 'Keamanan' ? 'bg-rose-50 text-rose-600' :
                  report.type === 'Kebersihan' ? 'bg-emerald-50 text-emerald-600' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  <AlertTriangle size={24} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                      report.status === 'Baru' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                      report.status === 'Diproses' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {report.status}
                    </span>
                    <span className="text-xs font-bold text-slate-400">•</span>
                    <span className="text-xs font-bold text-slate-500">{report.type}</span>
                    <span className="text-xs font-bold text-slate-400">•</span>
                    <span className="text-xs font-medium text-slate-400">{new Date(report.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-1 truncate">{report.description}</h3>
                  <p className="text-sm font-medium text-slate-500">
                    Pelapor: <span className="text-slate-800">{report.reporterName}</span> 
                    {(() => {
                      const house = houses.find(h => h.id === report.houseId || h.id === report.reporterHouseId);
                      return house ? ` (Blok ${house.block}-${house.number})` : (report.houseId ? ` (${report.houseId})` : '');
                    })()}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => setSelectedReport(report)}
                    className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all shadow-sm whitespace-nowrap flex items-center gap-2 justify-center"
                  >
                    <Eye size={14} /> Lihat Detail
                  </button>
                  {onDeleteReport && (
                    <button 
                      onClick={() => onDeleteReport(report.id)}
                      className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors border border-rose-100"
                      title="Hapus Laporan"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  {!report.archived && report.status === 'Selesai' && (
                    <button 
                      onClick={() => handleArchiveReport(report.id)}
                      className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors border border-amber-100"
                      title="Arsipkan"
                    >
                      <Archive size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Letter Detail Modal */}
      <Modal isOpen={!!selectedLetter} onClose={() => setSelectedLetter(null)} title="Detail Permohonan Surat" maxWidth="max-w-2xl">
            {selectedLetter && (
              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Jenis Surat <span className="text-rose-500">*</span></p>
                      <select 
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                        value={editLetterData.type || ''}
                        onChange={e => setEditLetterData({...editLetterData, type: e.target.value})}
                      >
                        {(pdfConfig.letterTemplates || []).map(t => <option key={t.type}>{t.type}</option>)}
                        <option>Lainnya</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Saat Ini</p>
                      <span className={`inline-block px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                        (selectedLetter.status === 'Menunggu' || selectedLetter.status === 'Pending') ? 'bg-amber-100 text-amber-700' :
                        (selectedLetter.status === 'Disetujui' || selectedLetter.status === 'Approved') ? 'bg-emerald-100 text-emerald-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {selectedLetter.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nama Pemohon</p>
                      <input 
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                        value={editLetterData.applicantName || ''}
                        onChange={e => setEditLetterData({...editLetterData, applicantName: e.target.value})}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">NIK</p>
                      <input 
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                        value={editLetterData.nik || ''}
                        onChange={e => setEditLetterData({...editLetterData, nik: e.target.value})}
                      />
                    </div>
                    
                    {/* New Fields */}
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">No. HP / WA</p>
                      <input 
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                        value={editLetterData.phone || ''}
                        onChange={e => setEditLetterData({...editLetterData, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                      <input 
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                        value={editLetterData.email || ''}
                        onChange={e => setEditLetterData({...editLetterData, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pendidikan</p>
                      <input 
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                        value={editLetterData.education || ''}
                        onChange={e => setEditLetterData({...editLetterData, education: e.target.value})}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gol. Darah</p>
                      <select 
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                        value={editLetterData.bloodType || ''}
                        onChange={e => setEditLetterData({...editLetterData, bloodType: e.target.value as any})}
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="AB">AB</option>
                        <option value="O">O</option>
                        <option value="-">-</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Keluarga</p>
                      <select 
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                        value={editLetterData.familyStatus || ''}
                        onChange={e => setEditLetterData({...editLetterData, familyStatus: e.target.value as any})}
                      >
                        <option value="Kepala Keluarga">Kepala Keluarga</option>
                        <option value="Istri">Istri</option>
                        <option value="Anak">Anak</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pekerjaan</p>
                      <input 
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                        value={editLetterData.job || ''}
                        onChange={e => setEditLetterData({...editLetterData, job: e.target.value})}
                      />
                    </div>

                    <div className="col-span-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Alamat KTP</p>
                      <textarea 
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-medium h-16 resize-none"
                        value={editLetterData.addressKtp || ''}
                        onChange={e => setEditLetterData({...editLetterData, addressKtp: e.target.value})}
                      />
                    </div>

                    <div className="col-span-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Alamat Domisili Saat Ini</p>
                      <textarea 
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-medium h-16 resize-none"
                        value={editLetterData.currentAddress || ''}
                        onChange={e => setEditLetterData({...editLetterData, currentAddress: e.target.value})}
                      />
                    </div>

                    <div className="col-span-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Keperluan</p>
                      <textarea 
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-medium h-20 resize-none"
                        value={editLetterData.purposeDetail || ''}
                        onChange={e => setEditLetterData({...editLetterData, purposeDetail: e.target.value})}
                      />
                    </div>

                    <div className="col-span-2 pt-4 border-t border-slate-200">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nomor Surat (Dapat Diedit)</label>
                      <input 
                        type="text"
                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        value={letterNumberInput}
                        onChange={(e) => setLetterNumberInput(e.target.value)}
                        placeholder="Contoh: 001/RT02/III/2026"
                      />
                      <p className="text-[10px] font-medium text-slate-400 mt-2 italic">* Nomor ini akan dicetak pada dokumen resmi.</p>
                    </div>
                  </div>
                </div>

                {(selectedLetter.status === 'Menunggu' || selectedLetter.status === 'Pending') && (
                  <div className="space-y-4">
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Tanda Tangan Ketua RT (Opsional)</p>
                      <div className="bg-white rounded-xl border border-indigo-200 overflow-hidden">
                        <SignaturePad 
                          onSave={(sig) => setTempSignature(sig)} 
                          onClear={() => setTempSignature(null)}
                        />
                      </div>
                      <p className="text-[10px] text-indigo-400 mt-2 italic">* Jika tidak diisi, akan menggunakan tanda tangan default di pengaturan.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        onClick={() => handleUpdateLetterStatus(selectedLetter.id, 'Ditolak')}
                        className="bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 shadow-none"
                      >
                        <XCircle size={18} className="mr-2" /> Tolak
                      </Button>
                      <Button 
                        onClick={() => {
                          // If tempSignature exists, we might want to pass it to handleUpdateLetterStatus
                          // or update pdfConfig temporarily. For now, let's just use it in the generation.
                          handleUpdateLetterStatus(selectedLetter.id, 'Disetujui', {
                            ...selectedLetter,
                            ...editLetterData,
                            letterNumber: letterNumberInput,
                            // We can't easily pass tempSignature through handleUpdateLetterStatus without changing its signature
                            // but we can use it if we modify handleUpdateLetterStatus
                          }, tempSignature);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                      >
                        <CheckCircle2 size={18} className="mr-2" /> Setujui & Cetak
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <Button 
                    onClick={handleSaveLetterDetails}
                    variant="secondary"
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border-none"
                  >
                    <Save size={18} className="mr-2" /> Simpan Perubahan
                  </Button>
                  
                  <Button 
                    onClick={() => sendWhatsAppMessage(selectedLetter.phone, formatLetterStatusForWhatsApp(selectedLetter.applicantName, selectedLetter.type, selectedLetter.status))}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                  >
                    <MessageCircle size={18} className="mr-2" /> Update WA
                  </Button>
                </div>
              </div>
            )}
      </Modal>

      {/* Admin Create Letter Modal */}
      <Modal isOpen={isCreatingLetter} onClose={() => setIsCreatingLetter(false)} title="Buat Surat Baru (Admin)" maxWidth="max-w-4xl">
        <form onSubmit={handleAdminCreateLetter} className="space-y-8 max-h-[75vh] overflow-y-auto px-2 pb-4">
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <Sparkles size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-indigo-900">Mode Penerbitan Langsung</h4>
              <p className="text-xs text-indigo-700/80 mt-1">Surat yang dibuat di sini akan langsung disetujui dan diterbitkan dengan nomor resmi.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Personal Data */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <User size={16} className="text-slate-400" />
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Data Pemohon</h4>
              </div>
              
              <div className="space-y-4">
                <div className="group">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Nama Lengkap</label>
                  <input 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300" 
                    value={adminForm.applicantName || ''} 
                    onChange={e=>setAdminForm({...adminForm, applicantName: e.target.value})} 
                    placeholder="Sesuai KTP"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">NIK</label>
                    <input 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" 
                      value={adminForm.nik || ''} 
                      onChange={e=>setAdminForm({...adminForm, nik: e.target.value})} 
                      placeholder="16 digit NIK"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Nama Kepala Keluarga</label>
                    <input 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" 
                      value={adminForm.familyHeadName || ''} 
                      onChange={e=>setAdminForm({...adminForm, familyHeadName: e.target.value})} 
                      placeholder="Nama di KK"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Tempat Lahir</label>
                    <input 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                      value={adminForm.birthPlace || ''} 
                      onChange={e=>setAdminForm({...adminForm, birthPlace: e.target.value})} 
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Tanggal Lahir</label>
                    <input 
                      type="date" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                      value={adminForm.birthDate || ''} 
                      onChange={e=>setAdminForm({...adminForm, birthDate: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Jenis Kelamin</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                      value={adminForm.gender || 'Laki-laki'} 
                      onChange={e=>setAdminForm({...adminForm, gender: e.target.value as any})}
                    >
                      <option>Laki-laki</option>
                      <option>Perempuan</option>
                    </select>
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Agama</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                      value={adminForm.religion || 'Islam'} 
                      onChange={e=>setAdminForm({...adminForm, religion: e.target.value})}
                    >
                      <option>Islam</option><option>Kristen</option><option>Katolik</option><option>Hindu</option><option>Buddha</option><option>Konghucu</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Pekerjaan</label>
                    <input 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                      value={adminForm.job || ''} 
                      onChange={e=>setAdminForm({...adminForm, job: e.target.value})} 
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Golongan Darah</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                      value={adminForm.bloodType || '-'} 
                      onChange={e=>setAdminForm({...adminForm, bloodType: e.target.value as any})}
                    >
                      <option>-</option><option>A</option><option>B</option><option>AB</option><option>O</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Pendidikan</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                      value={adminForm.education || 'SMA/Sederajat'} 
                      onChange={e=>setAdminForm({...adminForm, education: e.target.value})}
                    >
                      <option>SD/Sederajat</option><option>SMP/Sederajat</option><option>SMA/Sederajat</option><option>D3</option><option>S1</option><option>S2</option><option>S3</option><option>Tidak Sekolah</option>
                    </select>
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Hubungan Keluarga</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                      value={adminForm.familyStatus || 'Kepala Keluarga'} 
                      onChange={e=>setAdminForm({...adminForm, familyStatus: e.target.value as any})}
                    >
                      <option>Kepala Keluarga</option><option>Istri</option><option>Anak</option><option>Lainnya</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Status Perkawinan</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                      value={adminForm.maritalStatus || 'Kawin'} 
                      onChange={e=>setAdminForm({...adminForm, maritalStatus: e.target.value as any})}
                    >
                      <option>Belum Kawin</option>
                      <option>Kawin</option>
                      <option>Cerai Hidup</option>
                      <option>Cerai Mati</option>
                    </select>
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Kewarganegaraan</label>
                    <input 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                      value={adminForm.nationality || ''} 
                      onChange={e=>setAdminForm({...adminForm, nationality: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">No. HP / WhatsApp</label>
                    <input 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                      value={adminForm.phone || ''} 
                      onChange={e=>setAdminForm({...adminForm, phone: e.target.value})} 
                      placeholder="0812..."
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Email (Opsional)</label>
                    <input 
                      type="email"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                      value={adminForm.email || ''} 
                      onChange={e=>setAdminForm({...adminForm, email: e.target.value})} 
                      placeholder="email@contoh.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Letter Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <FileText size={16} className="text-slate-400" />
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Detail Surat</h4>
              </div>

              <div className="space-y-4">
                <div className="group">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Nomor Surat (Otomatis)</label>
                  <input 
                    type="text"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-indigo-600 focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                    value={adminLetterNumber || ''} 
                    onChange={e => setAdminLetterNumber(e.target.value)}
                    placeholder="Contoh: SPK/001/RT02/III/2026"
                  />
                </div>

                <div className="group">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Jenis Surat</label>
                  <div className="relative">
                    <select 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none" 
                      value={adminForm.type} 
                      onChange={e=>setAdminForm({...adminForm, type: e.target.value})}
                    >
                      {(pdfConfig.letterTemplates || [
                        { type: 'Surat Pengantar KTP' }, { type: 'Surat Pengantar KK' }, { type: 'Surat Keterangan Domisili' }
                      ]).map(t => <option key={t.type}>{t.type}</option>)}
                      <option>Lainnya</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Blok / Nomor Rumah</label>
                  <div className="relative">
                    <Home size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                      value={adminForm.houseId || ''} 
                      onChange={e=>setAdminForm({...adminForm, houseId: e.target.value})} 
                      placeholder="Cth: C7-02" 
                    />
                  </div>
                </div>

                <div className="group">
                  <div className="flex justify-between items-end mb-1.5 ml-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Keperluan</label>
                    <button 
                      type="button"
                      onClick={() => {
                        const template = (pdfConfig.letterTemplates || []).find(t => t.type === adminForm.type)?.suggestion;
                        if (template) setAdminForm({...adminForm, purposeDetail: template});
                      }}
                      className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                    >
                      <Sparkles size={10} /> Isi Otomatis
                    </button>
                  </div>
                  <textarea 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all h-32 resize-none leading-relaxed" 
                    value={adminForm.purposeDetail || ''} 
                    onChange={e=>setAdminForm({...adminForm, purposeDetail: e.target.value})} 
                    placeholder="Jelaskan keperluan surat..."
                  />
                </div>

                <div className="group">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Alamat Lengkap (Sesuai KTP)</label>
                  <textarea 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all h-24 resize-none leading-relaxed" 
                    value={adminForm.addressKtp || ''} 
                    onChange={e=>setAdminForm({...adminForm, addressKtp: e.target.value})} 
                    placeholder="Jalan, RT/RW, Kelurahan, Kecamatan..."
                  />
                </div>

                <div className="group">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Alamat Domisili Saat Ini</label>
                  <textarea 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all h-24 resize-none leading-relaxed" 
                    value={adminForm.currentAddress || ''} 
                    onChange={e=>setAdminForm({...adminForm, currentAddress: e.target.value})} 
                    placeholder="Kosongkan jika sama dengan KTP"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 mt-4">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Tanda Tangan Ketua RT (Opsional)</p>
              <div className="bg-white rounded-xl border border-indigo-200 overflow-hidden">
                <SignaturePad 
                  onSave={(sig) => setTempSignature(sig)} 
                  onClear={() => setTempSignature(null)}
                />
              </div>
              <p className="text-[10px] text-indigo-400 mt-2 italic">* Jika tidak diisi, akan menggunakan tanda tangan default di pengaturan.</p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white pb-2">
            <Button type="button" variant="secondary" onClick={() => setIsCreatingLetter(false)} className="px-6">Batal</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 px-8">
              <Printer size={18} className="mr-2" /> Terbitkan & Cetak
            </Button>
          </div>
        </form>
      </Modal>

      {/* Admin Create Report Modal */}
      <Modal isOpen={isCreatingReport} onClose={() => setIsCreatingReport(false)} title="Buat Aspirasi/Pengaduan Baru (Admin)" maxWidth="max-w-2xl">
        <form onSubmit={handleCreateReport} className="space-y-6">
          <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 flex items-start gap-3">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900">Pencatatan Laporan & Temuan Lapangan</h4>
              <p className="text-xs text-rose-700/80 mt-1">Gunakan ini untuk mencatat aspirasi warga atau temuan petugas saat kontrol lapangan (misal: air tumpah, lampu mati).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Nama Pelapor / Warga</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-rose-500 outline-none transition-all" 
                  value={adminReportForm.reporterName || ''} 
                  onChange={e=>setAdminReportForm({...adminReportForm, reporterName: e.target.value})} 
                  placeholder="Nama warga"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Pilih Unit Rumah (Opsional)</label>
              <div className="relative">
                <Home size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                <select 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-rose-500 outline-none transition-all appearance-none"
                  value={adminReportForm.houseId || ''} 
                  onChange={e=>setAdminReportForm({...adminReportForm, houseId: e.target.value})} 
                >
                  <option value="">-- Lokasi Fasilitas / Unit --</option>
                  {[...houses].sort((a, b) => {
                    if (a.block !== b.block) return (a.block || '').localeCompare(b.block || '');
                    return parseInt(a.number || '0') - parseInt(b.number || '0');
                  }).map(h => (
                    <option key={h.id} value={h.id}>
                      {h.block}-{h.number} ({h.headOfFamily})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Jenis Laporan/Aspirasi</label>
              <select 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-rose-500 outline-none transition-all" 
                value={adminReportForm.type} 
                onChange={e=>setAdminReportForm({...adminReportForm, type: e.target.value as any})}
              >
                <option value="Keamanan">Keamanan</option>
                <option value="Kebersihan">Kebersihan</option>
                <option value="Fasilitas">Fasilitas</option>
                <option value="Sosial">Sosial</option>
                <option value="Aspirasi/Saran">Aspirasi/Saran</option>
                <option value="Temuan Lapangan">Temuan Lapangan (Petugas)</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="group">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Status Awal</label>
              <select 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-rose-500 outline-none transition-all" 
                value={adminReportForm.status} 
                onChange={e=>setAdminReportForm({...adminReportForm, status: e.target.value as any})}
              >
                <option value="Baru">Baru (Belum Ditangani)</option>
                <option value="Diproses">Diproses (Sedang Ditangani)</option>
                <option value="Selesai">Selesai (Sudah Tuntas)</option>
              </select>
            </div>
          </div>

          <div className="group">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Isi Laporan / Aspirasi</label>
            <textarea 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-rose-500 outline-none transition-all h-32 resize-none leading-relaxed" 
              value={adminReportForm.description || ''} 
              onChange={e=>setAdminReportForm({...adminReportForm, description: e.target.value})} 
              placeholder="Jelaskan detail laporan, aspirasi, atau temuan di lokasi..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="button" 
              onClick={() => setIsCreatingReport(false)} 
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border-none"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving}
              className="flex-1 bg-rose-600 hover:bg-rose-700 shadow-rose-200"
            >
              {isSaving ? (
                <RefreshCw size={18} className="mr-2 animate-spin" />
              ) : (
                <Save size={18} className="mr-2" />
              )}
              Simpan Laporan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Report Detail Modal */}
      <Modal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} title="Detail Aspirasi & Pengaduan" maxWidth="max-w-lg">
        {selectedReport && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-xl ${
                  selectedReport.type === 'Keamanan' ? 'bg-rose-100 text-rose-600' :
                  selectedReport.type === 'Kebersihan' ? 'bg-emerald-100 text-emerald-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-lg">{selectedReport.type}</h4>
                  <p className="text-xs font-medium text-slate-500">{new Date(selectedReport.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Isi Laporan/Aspirasi</p>
                <p className="font-medium text-slate-800 bg-white p-4 rounded-xl border border-slate-200 leading-relaxed">
                  "{selectedReport.description}"
                </p>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pelapor</p>
                  <p className="font-bold text-slate-800">{selectedReport.reporterName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lokasi/Unit</p>
                  <p className="font-bold text-slate-800">
                    {(() => {
                      const house = houses.find(h => h.id === selectedReport.houseId || h.id === selectedReport.reporterHouseId);
                      return house ? `${house.block}-${house.number}` : (selectedReport.houseId || '-');
                    })()}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {selectedReport.status === 'Baru' && (
                <Button 
                  onClick={() => handleUpdateReportStatus(selectedReport.id, 'Diproses')}
                  className="col-span-2 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                >
                  <Clock size={18} className="mr-2" /> Tandai Sedang Diproses
                </Button>
              )}
              {selectedReport.status === 'Diproses' && (
                <Button 
                  onClick={() => handleUpdateReportStatus(selectedReport.id, 'Selesai')}
                  className="col-span-2 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                >
                  <CheckCircle2 size={18} className="mr-2" /> Tandai Selesai
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};
