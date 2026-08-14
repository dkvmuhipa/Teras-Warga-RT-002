import React, { useState, useEffect } from 'react';
import { FileText, AlertTriangle, CheckCircle2, XCircle, Clock, Search, Filter, Eye, MessageCircle, Sparkles, Trash2, Printer, Settings, Plus, Save, User, Home, Upload, Image as ImageIcon, Archive, RefreshCw, Phone, Hash, Briefcase, BookOpen, Heart, Mail, CreditCard, UserCheck, MapPin, Info, Calendar, ChevronRight, ClipboardList, Users, Flag } from 'lucide-react';
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
import { IncomingMailManager } from './IncomingMailManager';
import { toast } from 'sonner';
import { useConfirm } from '../../context/ConfirmContext';

interface ServiceManagerProps {
  reports: Report[];
  letters: LetterRequest[];
  houses: House[];
  pdfConfig: PdfConfig;
  setPdfConfig: (config: PdfConfig) => void;
  onDeleteReport?: (id: string) => void;
  incomingMails?: any[];
  initialTab?: 'letters' | 'reports' | 'official-letters' | 'incoming_mails' | 'letter-archive' | 'settings';
}

export const ServiceManager: React.FC<ServiceManagerProps> = ({ 
  reports, 
  letters, 
  houses,
  pdfConfig, 
  setPdfConfig,
  onDeleteReport,
  incomingMails = [],
  initialTab = 'letters'
}) => {
  const [activeTab, setActiveTab] = useState<'letters' | 'reports' | 'official-letters' | 'incoming_mails' | 'letter-archive' | 'settings'>(initialTab);
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
  const [previewPdfBlobUrl, setPreviewPdfBlobUrl] = useState<string | null>(null);
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);
  const [officialLetters, setOfficialLetters] = useState<OfficialLetter[]>([]);
  const [detailModalTab, setDetailModalTab] = useState<'profil' | 'keperluan' | 'penerbitan'>('profil');
  const [settingSubTab, setSettingSubTab] = useState<'identity' | 'assets' | 'templates' | 'whatsapp'>('identity');
  const lastLoadedIdRef = React.useRef<string | null>(null);

  const handleGenerateLivePreview = async (letterToPreview: LetterRequest) => {
    try {
      const { jsPDF } = await import('jspdf');
      // Create PDF in memory and get Blob URL
      const letterData = { ...letterToPreview, letterNumber: letterNumberInput || letterToPreview.letterNumber };
      const configToUse = tempSignature ? { ...pdfConfig, signature: tempSignature } : pdfConfig;
      
      // Temporarily store original save
      const originalSave = jsPDF.prototype.save;
      let blobUrl = '';
      
      jsPDF.prototype.save = function(this: any, filename?: string) {
        const blob = this.output('blob');
        blobUrl = URL.createObjectURL(blob);
        return this;
      } as any;

      await generateSuratPengantar(letterData, configToUse, false);
      jsPDF.prototype.save = originalSave;

      if (blobUrl) {
        setPreviewPdfBlobUrl(blobUrl);
        setShowPdfPreviewModal(true);
      }
    } catch (e) {
      console.error("Live preview error:", e);
      toast.error("Gagal memuat pratinjau PDF.");
    }
  };
  
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
    // Only auto-initialize if lastLetterNumber is not set yet (0 or undefined)
    if (pdfConfig.lastLetterNumber !== undefined && pdfConfig.lastLetterNumber !== 0) return;
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

    if (maxNum > 0) {
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
    if (!selectedLetter) {
      lastLoadedIdRef.current = null;
      return;
    }

    if (selectedLetter.id !== lastLoadedIdRef.current) {
      lastLoadedIdRef.current = selectedLetter.id;
      setDetailModalTab('profil');
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
        type: selectedLetter.type,
        familyHeadName: selectedLetter.familyHeadName || '',
        birthPlace: selectedLetter.birthPlace || '',
        birthDate: selectedLetter.birthDate || '',
        religion: selectedLetter.religion || '',
        gender: selectedLetter.gender || 'Laki-laki',
        maritalStatus: selectedLetter.maritalStatus || 'Belum Kawin',
        nationality: selectedLetter.nationality || 'WNI'
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
      const updatedFields = {
        ...editLetterData,
        letterNumber: letterNumberInput
      };
      await updateLetterInDb(selectedLetter.id, updatedFields);

      // Keep local selectedLetter current so that other UI parts reflect it
      setSelectedLetter({
        ...selectedLetter,
        ...updatedFields
      } as LetterRequest);
      
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

  const handleSyncLetterSequence = async () => {
    if (!selectedLetter) return;
    try {
      let maxNum = 0;
      
      // Scan remaining occupant letters
      letters.forEach(l => {
        if (l.id !== selectedLetter.id && l.letterNumber) {
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
      
      // Update pdfConfig
      const newConfig = { ...pdfConfig, lastLetterNumber: maxNum };
      setPdfConfig(newConfig);
      await updatePdfConfig(newConfig);

      // Format proposed number string
      const currentMonthRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][new Date().getMonth()];
      const currentYear = new Date().getFullYear();
      
      const words = (editLetterData.type || selectedLetter.type || 'S').split(' ').filter(w => w.length > 0);
      let letterCode = words.map(w => w[0].toUpperCase()).join('');
      if (!letterCode) letterCode = 'S';
      
      const suggestedNumber = `${letterCode}/${paddedNum}/${pdfConfig.rtName.replace(/\s/g, '')}/${currentMonthRoman}/${currentYear}`;
      setLetterNumberInput(suggestedNumber);
      
      toast.success("Sinkronisasi Berhasil!", {
        description: `Nomor surat terhitung dari maksimal database (${maxNum}). Nomor diusulkan: ${suggestedNumber}`
      });
    } catch (e) {
      console.error("Error syncing sequence", e);
      toast.error("Gagal melakukan sinkronisasi penomoran surat.");
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
        const letterToDelete = letters.find(l => l.id === id);
        await deleteLetterFromDb(id);
        toast.success('Pengajuan surat berhasil dihapus.');

        if (letterToDelete && letterToDelete.letterNumber) {
          const deletedNum = extractNum(letterToDelete.letterNumber);
          if (deletedNum > 0) {
            let maxNumOfOthers = 0;
            // Scan other occupant letters
            letters.forEach(l => {
              if (l.id !== id && l.letterNumber) {
                const num = extractNum(l.letterNumber);
                if (num > maxNumOfOthers) maxNumOfOthers = num;
              }
            });
            // Scan official letters
            officialLetters.forEach(ol => {
              if (ol.letterNumber) {
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
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {initialTab === 'reports' ? 'Aspirasi & Pengaduan Warga' : 'Persuratan RT'}
          </h2>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
            {initialTab === 'reports' 
              ? 'Pusat pengawasan, penanganan keluhan, dan aspirasi warga RT 02.'
              : 'Pusat pengelolaan surat pengantar warga, surat himbauan resmi, dan dokumen keluar.'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {activeTab === 'letters' && (
            <button
              onClick={() => {
                toast.promise(
                  (async () => {
                    const { jsPDF } = await import('jspdf');
                    const autoTable = (await import('jspdf-autotable')).default;
                    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                    
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(14);
                    doc.text(`REKAPITULASI PENGAJUAN SURAT PENGANTAR RT 02`, 105, 15, { align: 'center' });
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 105, 21, { align: 'center' });

                    const tableData = letters.map((l, i) => [
                      (i + 1).toString(),
                      l.letterNumber || '-',
                      l.applicantName || '-',
                      l.type || 'Pengantar',
                      new Date(l.date || Date.now()).toLocaleDateString('id-ID'),
                      l.status || '-'
                    ]);

                    autoTable(doc, {
                      startY: 28,
                      head: [['No', 'No. Surat', 'Pemohon', 'Jenis Surat', 'Tanggal', 'Status']],
                      body: tableData,
                      theme: 'striped',
                      headStyles: { fillColor: [79, 70, 229] },
                      styles: { fontSize: 9 }
                    });

                    doc.save(`Rekap_Surat_Pengantar_${new Date().toISOString().split('T')[0]}.pdf`);
                  })(),
                  {
                    loading: 'Menyusun Rekap Surat PDF...',
                    success: 'Rekap Surat PDF berhasil diunduh!',
                    error: 'Gagal mengunduh Rekap Surat.'
                  }
                );
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl transition-all shadow-md shadow-indigo-600/20 border border-indigo-500/30"
            >
              <Printer size={15} />
              <span>Cetak Rekap Surat</span>
            </button>
          )}

          {initialTab !== 'reports' && (
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
                  <span>Surat Pengantar ({letters.filter(l => l.status === 'Menunggu' || l.status === 'Pending').length})</span>
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
                  onClick={() => setActiveTab('incoming_mails')} 
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                    activeTab === 'incoming_mails' 
                      ? 'bg-white text-teal-600 shadow-md ring-1 ring-black/5' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  <FileText size={14} className="sm:w-4 sm:h-4" />
                  <span>Surat Masuk ({incomingMails.length})</span>
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
                  <span>Repositori Surat</span>
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
                  <span>Pengaturan Kop</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Analytics Card Widget */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Surat Menunggu */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 p-5 rounded-3xl border border-amber-200/50 shadow-sm flex items-center gap-4 transition-all hover:translate-y-[-2px] hover:shadow-md">
          <div className="p-3 bg-white text-amber-600 rounded-2xl shadow-sm border border-amber-100 shrink-0">
            <Clock size={18} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-amber-600 tracking-wider uppercase truncate">Surat Pending</p>
            <h4 className="text-xl sm:text-2xl font-black text-slate-850 leading-none mt-1">
              {letters.filter(l => l.status === 'Menunggu' || l.status === 'Pending').length}
            </h4>
          </div>
        </div>

        {/* KPI: Surat Disetujui */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 p-5 rounded-3xl border border-emerald-200/50 shadow-sm flex items-center gap-4 transition-all hover:translate-y-[-2px] hover:shadow-md">
          <div className="p-3 bg-white text-emerald-600 rounded-2xl shadow-sm border border-emerald-100 shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-emerald-600 tracking-wider uppercase truncate">Surat Disetujui</p>
            <h4 className="text-xl sm:text-2xl font-black text-slate-850 leading-none mt-1">
              {letters.filter(l => l.status === 'Disetujui' || l.status === 'Approved').length}
            </h4>
          </div>
        </div>

        {/* KPI: Aduan Baru */}
        <div className="bg-gradient-to-br from-rose-50 to-rose-100/30 p-5 rounded-3xl border border-rose-200/50 shadow-sm flex items-center gap-4 transition-all hover:translate-y-[-2px] hover:shadow-md">
          <div className="p-3 bg-white text-rose-600 rounded-2xl shadow-sm border border-rose-100 shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-rose-600 tracking-wider uppercase truncate">Aduan Baru</p>
            <h4 className="text-xl sm:text-2xl font-black text-slate-850 leading-none mt-1">
              {reports.filter(r => r.status === 'Baru').length}
            </h4>
          </div>
        </div>

        {/* KPI: Aduan Diproses */}
        <div className="bg-gradient-to-br from-sky-50 to-sky-100/30 p-5 rounded-3xl border border-sky-200/50 shadow-sm flex items-center gap-4 transition-all hover:translate-y-[-2px] hover:shadow-md">
          <div className="p-3 bg-white text-sky-600 rounded-2xl shadow-sm border border-sky-100 shrink-0">
            <RefreshCw size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-sky-600 tracking-wider uppercase truncate">Laporan Diproses</p>
            <h4 className="text-xl sm:text-2xl font-black text-slate-850 leading-none mt-1">
              {reports.filter(r => r.status === 'Diproses').length}
            </h4>
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

      {/* Filters (Only show for active list views: letters & reports) */}
      {(activeTab === 'letters' || activeTab === 'reports') && (
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
              {showArchived ? 'Lihat Aktif' : 'Lihat Terarsip'}
            </button>
            {!showArchived && (
              <button 
                onClick={handleAutoArchive}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-2xl hover:bg-amber-100 transition-all text-[10px] font-black uppercase tracking-widest"
                title="Arsipkan data yang sudah selesai lebih dari 30 hari"
              >
                <Archive size={14} />
                Auto Arsip (30 Hari)
              </button>
            )}
          </div>
        </div>
      )}

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
        ) : activeTab === 'incoming_mails' ? (
          <motion.div
            key="incoming_mails"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <IncomingMailManager incomingMails={incomingMails} />
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
            {/* Kop Settings Top Navigation & Card Container */}
            <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
                    <Settings size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Pengaturan Kop Surat & Dokumen Resmi</h3>
                    <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">Kelola identitas RT, stempel digital, logo, template surat, dan integrasi broadcast WhatsApp.</p>
                  </div>
                </div>
              </div>

              {/* Sub Navigation Bar inside Settings */}
              <div className="flex bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setSettingSubTab('identity')}
                  className={`flex-1 min-w-max flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    settingSubTab === 'identity'
                      ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Home size={15} />
                  <span>1. Identitas Wilayah</span>
                </button>
                <button
                  onClick={() => setSettingSubTab('assets')}
                  className={`flex-1 min-w-max flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    settingSubTab === 'assets'
                      ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ImageIcon size={15} />
                  <span>2. Logo, Stempel & TTD</span>
                </button>
                <button
                  onClick={() => setSettingSubTab('templates')}
                  className={`flex-1 min-w-max flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    settingSubTab === 'templates'
                      ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText size={15} />
                  <span>3. Template & Teks Surat</span>
                </button>
                <button
                  onClick={() => setSettingSubTab('whatsapp')}
                  className={`flex-1 min-w-max flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    settingSubTab === 'whatsapp'
                      ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MessageCircle size={15} />
                  <span>4. Integrasi WhatsApp</span>
                </button>
              </div>

              {/* Main Content & Live Preview Layout Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Side (7 Cols): Dynamic Form Content */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* TAB 1: IDENTITAS WILAYAH */}
                  {settingSubTab === 'identity' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100 flex items-center gap-3">
                        <Info size={18} className="text-indigo-600 shrink-0" />
                        <p className="text-xs font-bold text-indigo-900 leading-relaxed">
                          Informasi wilayah di bawah ini akan secara otomatis tampil pada bagian **KOP Header** setiap Surat Pengantar Warga dan Surat Resmi RT.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama RT (Kop Surat)</label>
                          <input 
                            type="text"
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                            value={pdfConfig.rtName || ''} 
                            onChange={e => {
                              const newConfig = {...pdfConfig, rtName: e.target.value};
                              setPdfConfig(newConfig);
                            }} 
                            placeholder="RT 02 / RW 020"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Ketua RT</label>
                          <input 
                            type="text"
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                            value={pdfConfig.rtChairman || ''} 
                            onChange={e => {
                              const newConfig = {...pdfConfig, rtChairman: e.target.value};
                              setPdfConfig(newConfig);
                            }} 
                            placeholder="NAMA KETUA RT"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kelurahan</label>
                          <input 
                            type="text"
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                            value={pdfConfig.kelurahan || ''} 
                            onChange={e => {
                              const newConfig = {...pdfConfig, kelurahan: e.target.value};
                              setPdfConfig(newConfig);
                              localStorage.setItem('pdf_config', safeJsonStringify(newConfig));
                            }} 
                            placeholder="TONDO"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kecamatan</label>
                          <input 
                            type="text"
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                            value={pdfConfig.kecamatan || ''} 
                            onChange={e => {
                              const newConfig = {...pdfConfig, kecamatan: e.target.value};
                              setPdfConfig(newConfig);
                              localStorage.setItem('pdf_config', safeJsonStringify(newConfig));
                            }} 
                            placeholder="MANTIKULORE"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kota / Kabupaten</label>
                          <input 
                            type="text"
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                            value={pdfConfig.kota || ''} 
                            onChange={e => {
                              const newConfig = {...pdfConfig, kota: e.target.value};
                              setPdfConfig(newConfig);
                              localStorage.setItem('pdf_config', safeJsonStringify(newConfig));
                            }} 
                            placeholder="PALU"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Sekertariat / RT</label>
                        <textarea 
                          rows={3}
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 outline-none transition-all resize-none" 
                          value={pdfConfig.rtAddress || ''} 
                          onChange={e => {
                            const newConfig = {...pdfConfig, rtAddress: e.target.value};
                            setPdfConfig(newConfig);
                            localStorage.setItem('pdf_config', safeJsonStringify(newConfig));
                          }} 
                          placeholder="Jln. Raya Tondo No. 12, Kota Palu, Sulawesi Tengah"
                        />
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Counter Nomor Surat Terakhir</label>
                        <div className="flex gap-2">
                          <input 
                            type="number"
                            className="flex-1 p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-black text-indigo-700 focus:outline-none" 
                            value={pdfConfig.lastLetterNumber || 0} 
                            onChange={e => {
                              const newConfig = {...pdfConfig, lastLetterNumber: parseInt(e.target.value) || 0};
                              setPdfConfig(newConfig);
                            }} 
                          />
                          <button 
                            type="button"
                            onClick={async () => {
                              let maxNum = 0;
                              letters.forEach(l => {
                                if (l.letterNumber) {
                                  const num = extractNum(l.letterNumber);
                                  if (num > maxNum) maxNum = num;
                                }
                              });
                              officialLetters.forEach(ol => {
                                if (ol.letterNumber) {
                                  const num = extractNum(ol.letterNumber);
                                  if (num > maxNum) maxNum = num;
                                }
                              });
                              if (maxNum > 0) {
                                const newConfig = { ...pdfConfig, lastLetterNumber: maxNum };
                                setPdfConfig(newConfig);
                                await updatePdfConfig(newConfig);
                                toast.success(`Counter nomor surat berhasil disinkronkan ke nomor urut: ${maxNum}`);
                              } else {
                                toast.error("Belum ada data nomor surat di database.");
                              }
                            }}
                            className="px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5"
                          >
                            <RefreshCw size={14} /> Sinkronkan Database
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: ASET VISUAL (LOGO, STEMPEL, TTD) */}
                  {settingSubTab === 'assets' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Logo Upload Card */}
                        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Logo Resmi RT / Kota</h4>
                            {pdfConfig.logo && <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Terpasang</span>}
                          </div>
                          <div className="relative aspect-[4/3] bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center overflow-hidden group/upload shadow-inner">
                            {pdfConfig.logo ? (
                              <>
                                <img src={pdfConfig.logo} alt="Logo" className="w-full h-full object-contain p-4" />
                                <button 
                                  onClick={() => {
                                    const newConfig = {...pdfConfig, logo: ''};
                                    setPdfConfig(newConfig);
                                    localStorage.setItem('pdf_config', safeJsonStringify(newConfig));
                                  }}
                                  className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-xl opacity-0 group-hover/upload:opacity-100 transition-opacity shadow-lg"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            ) : (
                              <div className="text-center p-4">
                                <ImageIcon size={28} className="mx-auto text-slate-300 mb-1.5" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Klik / Geser Logo Ke Sini</p>
                              </div>
                            )}
                            <label className="absolute inset-0 cursor-pointer">
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                            </label>
                          </div>
                        </div>

                        {/* Stempel Upload Card */}
                        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Stempel Transparan RT</h4>
                            {pdfConfig.stamp && <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Terpasang</span>}
                          </div>
                          <div className="relative aspect-[4/3] bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center overflow-hidden group/upload shadow-inner">
                            {pdfConfig.stamp ? (
                              <>
                                <img src={pdfConfig.stamp} alt="Stempel" className="w-full h-full object-contain p-4" />
                                <button 
                                  onClick={() => {
                                    const newConfig = {...pdfConfig, stamp: ''};
                                    setPdfConfig(newConfig);
                                    localStorage.setItem('pdf_config', safeJsonStringify(newConfig));
                                  }}
                                  className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-xl opacity-0 group-hover/upload:opacity-100 transition-opacity shadow-lg"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            ) : (
                              <div className="text-center p-4">
                                <ImageIcon size={28} className="mx-auto text-slate-300 mb-1.5" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Klik / Geser Stempel (PNG)</p>
                              </div>
                            )}
                            <label className="absolute inset-0 cursor-pointer">
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'stamp')} />
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Signature Pad Card */}
                      <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Tanda Tangan Digital Ketua RT</h4>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                          <SignaturePad 
                            initialValue={pdfConfig.signature}
                            onSave={(dataUrl) => {
                              const newConfig = { ...pdfConfig, signature: dataUrl };
                              setPdfConfig(newConfig);
                              toast.success("Tanda tangan Ketua RT tersimpan!");
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 3: TEMPLATE & TEKS SURAT */}
                  {settingSubTab === 'templates' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Teks Pembuka Surat (Intro)</label>
                          <textarea 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all h-24 resize-none leading-relaxed"
                            value={pdfConfig.introText || `Yang bertanda tangan di bawah ini Ketua ${pdfConfig.rtName}, Kel. ${pdfConfig.kelurahan || 'Tondo'}, Kec. ${pdfConfig.kecamatan || 'Mantikulore'}, Kota ${pdfConfig.kota || 'Palu'}, Provinsi Sulawesi Tengah menerangkan dengan sebenarnya bahwa :`}
                            onChange={(e) => {
                              const newConfig = { ...pdfConfig, introText: e.target.value };
                              setPdfConfig(newConfig);
                              localStorage.setItem('pdf_config', safeJsonStringify(newConfig));
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Teks Penutup Surat (Closing)</label>
                          <textarea 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all h-20 resize-none leading-relaxed"
                            value={pdfConfig.closingText || "Demikian surat keterangan ini dibuat, untuk dipergunakan sebagaimana mestinya."}
                            onChange={(e) => {
                              const newConfig = { ...pdfConfig, closingText: e.target.value };
                              setPdfConfig(newConfig);
                              localStorage.setItem('pdf_config', safeJsonStringify(newConfig));
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Daftar Jenis Surat & Template Keperluan</h4>
                          <div className="flex items-center gap-2">
                            <button 
                              type="button"
                              onClick={() => {
                                const defaultTemplates = [
                                  { type: 'Surat Pengantar', suggestion: 'Surat ini diberikan untuk keperluan kelengkapan administrasi sebagai persyaratan [Sebutkan Keperluan, cth: melamar pekerjaan di PT. XYZ / pendaftaran sekolah / dll].' },
                                  { type: 'Surat Pengantar KTP', suggestion: 'Surat pengantar ini dibuat sebagai kelengkapan administrasi dalam rangka permohonan pembuatan Kartu Tanda Penduduk (KTP) baru / perpanjangan KTP yang bersangkutan di tingkat Kelurahan/Kecamatan.' },
                                  { type: 'Surat Pengantar KK', suggestion: 'Surat pengantar ini dibuat sebagai persyaratan untuk keperluan administrasi pengurusan / perubahan data / pembuatan Kartu Keluarga (KK) baru di tingkat Kelurahan.' },
                                  { type: 'Surat Keterangan Domisili', suggestion: 'Bahwa yang bersangkutan benar-benar merupakan warga / penduduk yang berdomisili menetap di wilayah RT kami. Surat keterangan ini digunakan untuk persyaratan [cth: melamar pekerjaan / pembukaan rekening bank / pendaftaran sekolah].' },
                                  { type: 'Surat Keterangan Tidak Mampu', suggestion: 'Bahwa yang bersangkutan adalah benar warga RT kami dan berdasarkan keadaan yang sebenarnya, yang bersangkutan termasuk dalam keluarga prasejahtera / Kurang Mampu. Surat Keterangan ini digunakan untuk keperluan persyaratan [cth: pengajuan beasiswa / keringanan biaya rumah sakit / bantuan sosial].' },
                                  { type: 'Surat Izin Keramaian', suggestion: 'Surat ini sebagai pengantar / rekomendasi izin penyelenggaraan acara keramaian berupa [Nama/Jenis Acara, cth: Resepsi Pernikahan] yang akan diselenggarakan pada hari/tanggal [Tanggal Acara] bertempat di [Lokasi Acara].' },
                                  { type: 'Surat Keterangan Usaha', suggestion: 'Bahwa yang bersangkutan benar merupakan warga kami dan memiliki usaha / bisnis di bidang [Jenis Usaha, cth: Perdagangan/Kuliner] dengan nama usaha [Nama Usaha] yang berlokasi di wilayah RT kami. Surat ini dibuat untuk keperluan [cth: pengajuan kredit UMKM / pembuatan NPWP badan].' },
                                  { type: 'Surat Keterangan Berkelakuan Baik', suggestion: 'Bahwa yang bersangkutan adalah warga kami yang senantiasa berkelakuan baik, belum pernah tersangkut tindak pidana, dan tidak pernah mengganggu ketertiban lingkungan. Surat ini sebagai pengantar untuk pembuatan SKCK di kepolisian untuk keperluan [cth: pendaftaran TNI/Polri / melamar pekerjaan].' },
                                  { type: 'Surat Keterangan Kematian', suggestion: 'Menerangkan dengan sebenarnya bahwa warga kami yang bernama [Nama Almarhum/Almarhumah] telah meninggal dunia pada [Hari, Tanggal, Jam] dikarenakan [Sakit/Usia/dll]. Surat keterangan ini digunakan untuk persyaratan administrasi kepengurusan Akta Kematian di Kelurahan.' },
                                  { type: 'Surat Keterangan Kelahiran', suggestion: 'Menerangkan bahwa telah lahir seorang anak [Laki-laki / Perempuan] bernama [Nama Anak] pada tanggal [Tanggal Lahir] dari pasangan suami istri [Nama Ayah] dan [Nama Ibu]. Surat pengantar ini digunakan untuk keperluan pembuatan Akta Kelahiran.' },
                                  { type: 'Surat Keterangan Waris / Ahli Waris', suggestion: 'Surat keterangan ini menerangkan susunan ahli waris yang sah dari almarhum/almarhumah [Nama Almarhum] untuk digunakan sebagai persyaratan administrasi kepengurusan turun waris / pembagian harta warisan keluarga.' },
                                  { type: 'Surat Keterangan Pindah / Datang', suggestion: 'Bahwa yang bersangkutan bermaksud untuk mengurus administrasi pindah alamat dari RT kami menuju [Alamat Tujuan Pindah] / melapor kedatangan sebagai warga baru yang pindah dari [Alamat Asal].' },
                                  { type: 'Surat Pengantar Nikah (N1 - N4)', suggestion: 'Menerangkan bahwa yang bersangkutan bermaksud untuk melangsungkan pernikahan. Surat pengantar ini dibuat sebagai persyaratan pengurusan berkas administrasi pernikahan (N1, N2, N3, N4) di tingkat Kelurahan.' },
                                ];
                                setPdfConfig({ ...pdfConfig, letterTemplates: defaultTemplates });
                                toast.success("13 Template Jenis Surat & Keperluan standar berhasil diisi!");
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <RefreshCw size={12} /> Isi 13 Template Standar
                            </button>
                            <Button 
                              onClick={() => {
                                const newTemplates = [...(pdfConfig.letterTemplates || []), { type: 'Surat Baru', suggestion: 'Saran teks pengisian...' }];
                                const newConfig = { ...pdfConfig, letterTemplates: newTemplates };
                                setPdfConfig(newConfig);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-xs py-1.5"
                            >
                              <Plus size={14} className="mr-1" /> Tambah Template
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                          {(pdfConfig.letterTemplates && pdfConfig.letterTemplates.length > 0 ? pdfConfig.letterTemplates : [
                            { type: 'Surat Pengantar', suggestion: 'Surat ini diberikan untuk keperluan kelengkapan administrasi sebagai persyaratan [Sebutkan Keperluan, cth: melamar pekerjaan di PT. XYZ / pendaftaran sekolah / dll].' },
                            { type: 'Surat Pengantar KTP', suggestion: 'Surat pengantar ini dibuat sebagai kelengkapan administrasi dalam rangka permohonan pembuatan Kartu Tanda Penduduk (KTP) baru / perpanjangan KTP yang bersangkutan di tingkat Kelurahan/Kecamatan.' },
                            { type: 'Surat Pengantar KK', suggestion: 'Surat pengantar ini dibuat sebagai persyaratan untuk keperluan administrasi pengurusan / perubahan data / pembuatan Kartu Keluarga (KK) baru di tingkat Kelurahan.' },
                            { type: 'Surat Keterangan Domisili', suggestion: 'Bahwa yang bersangkutan benar-benar merupakan warga / penduduk yang berdomisili menetap di wilayah RT kami. Surat keterangan ini digunakan untuk persyaratan [cth: melamar pekerjaan / pembukaan rekening bank / pendaftaran sekolah].' },
                            { type: 'Surat Keterangan Tidak Mampu', suggestion: 'Bahwa yang bersangkutan adalah benar warga RT kami dan berdasarkan keadaan yang sebenarnya, yang bersangkutan termasuk dalam keluarga prasejahtera / Kurang Mampu. Surat Keterangan ini digunakan untuk keperluan persyaratan [cth: pengajuan beasiswa / keringanan biaya rumah sakit / bantuan sosial].' },
                            { type: 'Surat Izin Keramaian', suggestion: 'Surat ini sebagai pengantar / rekomendasi izin penyelenggaraan acara keramaian berupa [Nama/Jenis Acara, cth: Resepsi Pernikahan] yang akan diselenggarakan pada hari/tanggal [Tanggal Acara] bertempat di [Lokasi Acara].' },
                            { type: 'Surat Keterangan Usaha', suggestion: 'Bahwa yang bersangkutan benar merupakan warga kami dan memiliki usaha / bisnis di bidang [Jenis Usaha, cth: Perdagangan/Kuliner] dengan nama usaha [Nama Usaha] yang berlokasi di wilayah RT kami. Surat ini dibuat untuk keperluan [cth: pengajuan kredit UMKM / pembuatan NPWP badan].' },
                            { type: 'Surat Keterangan Berkelakuan Baik', suggestion: 'Bahwa yang bersangkutan adalah warga kami yang senantiasa berkelakuan baik, belum pernah tersangkut tindak pidana, dan tidak pernah mengganggu ketertiban lingkungan. Surat ini sebagai pengantar untuk pembuatan SKCK di kepolisian untuk keperluan [cth: pendaftaran TNI/Polri / melamar pekerjaan].' },
                            { type: 'Surat Keterangan Kematian', suggestion: 'Menerangkan dengan sebenarnya bahwa warga kami yang bernama [Nama Almarhum/Almarhumah] telah meninggal dunia pada [Hari, Tanggal, Jam] dikarenakan [Sakit/Usia/dll]. Surat keterangan ini digunakan untuk persyaratan administrasi kepengurusan Akta Kematian di Kelurahan.' },
                            { type: 'Surat Keterangan Kelahiran', suggestion: 'Menerangkan bahwa telah lahir seorang anak [Laki-laki / Perempuan] bernama [Nama Anak] pada tanggal [Tanggal Lahir] dari pasangan suami istri [Nama Ayah] dan [Nama Ibu]. Surat pengantar ini digunakan untuk keperluan pembuatan Akta Kelahiran.' },
                            { type: 'Surat Keterangan Waris / Ahli Waris', suggestion: 'Surat keterangan ini menerangkan susunan ahli waris yang sah dari almarhum/almarhumah [Nama Almarhum] untuk digunakan sebagai persyaratan administrasi kepengurusan turun waris / pembagian harta warisan keluarga.' },
                            { type: 'Surat Keterangan Pindah / Datang', suggestion: 'Bahwa yang bersangkutan bermaksud untuk mengurus administrasi pindah alamat dari RT kami menuju [Alamat Tujuan Pindah] / melapor kedatangan sebagai warga baru yang pindah dari [Alamat Asal].' },
                            { type: 'Surat Pengantar Nikah (N1 - N4)', suggestion: 'Menerangkan bahwa yang bersangkutan bermaksud untuk melangsungkan pernikahan. Surat pengantar ini dibuat sebagai persyaratan pengurusan berkas administrasi pernikahan (N1, N2, N3, N4) di tingkat Kelurahan.' },
                          ]).map((template, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 relative group">
                              <button 
                                onClick={() => {
                                  const newTemplates = (pdfConfig.letterTemplates || []).filter((_, i) => i !== idx);
                                  const newConfig = { ...pdfConfig, letterTemplates: newTemplates };
                                  setPdfConfig(newConfig);
                                }}
                                className="absolute top-3 right-3 text-rose-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 size={14} />
                              </button>
                              <input 
                                className="w-4/5 p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                                value={template.type}
                                onChange={(e) => {
                                  const newTemplates = [...(pdfConfig.letterTemplates || [])];
                                  newTemplates[idx].type = e.target.value;
                                  setPdfConfig({ ...pdfConfig, letterTemplates: newTemplates });
                                }}
                              />
                              <textarea 
                                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 outline-none h-14 resize-none"
                                value={template.suggestion}
                                onChange={(e) => {
                                  const newTemplates = [...(pdfConfig.letterTemplates || [])];
                                  newTemplates[idx].suggestion = e.target.value;
                                  setPdfConfig({ ...pdfConfig, letterTemplates: newTemplates });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 4: INTEGRASI WHATSAPP */}
                  {settingSubTab === 'whatsapp' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 flex items-start gap-3">
                        <MessageCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest">Pengaturan Broadcast WhatsApp Warga</h4>
                          <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                            Menghubungkan pengiriman notifikasi otomatis saat surat warga diterbitkan atau pengumuman RT disiarkan.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Group ID (JID)</label>
                          <div className="flex gap-2">
                            <input 
                              className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800 outline-none" 
                              placeholder="Cth: 1234567890@g.us"
                              value={pdfConfig.whatsappGroupId || ''} 
                              onChange={e => setPdfConfig({...pdfConfig, whatsappGroupId: e.target.value})} 
                            />
                            <button 
                              type="button" 
                              onClick={handleVerifyGroup}
                              disabled={isVerifyingGroup}
                              className="px-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl hover:bg-emerald-100 text-xs font-bold transition-all"
                            >
                              {isVerifyingGroup ? 'Verifikasi...' : 'Cari Grup'}
                            </button>
                          </div>

                          {showGroupList && availableGroups.length > 0 && (
                            <div className="p-3 bg-white border border-emerald-200 rounded-2xl shadow-lg max-h-48 overflow-y-auto space-y-2 mt-2">
                              <p className="text-[10px] font-bold text-emerald-700 uppercase mb-2">Pilih Grup WA Terdeteksi:</p>
                              {availableGroups.map(group => (
                                <button
                                  key={group.id}
                                  type="button"
                                  onClick={() => selectGroup(group.id, group.name)}
                                  className="w-full text-left p-2.5 hover:bg-emerald-50 rounded-xl transition-colors flex items-center justify-between group"
                                >
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">{group.name}</p>
                                    <p className="text-[9px] text-slate-400 font-mono">{group.id}</p>
                                  </div>
                                  <CheckCircle2 size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Tampilan Grup WhatsApp</label>
                          <input 
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none" 
                            placeholder="Cth: Warga RT 02 Official"
                            value={pdfConfig.whatsappGroupName || ''} 
                            onChange={e => setPdfConfig({...pdfConfig, whatsappGroupName: e.target.value})} 
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-6 border-t border-slate-100">
                    <Button 
                      onClick={handleSaveConfig} 
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 rounded-2xl font-black text-xs uppercase tracking-widest"
                      disabled={isSaving}
                    >
                      <Save size={18} className="mr-2" /> 
                      {isSaving ? 'Menyimpan...' : 'Simpan Seluruh Pengaturan Cloud'}
                    </Button>
                  </div>

                </div>

                {/* Right Side (5 Cols): REAL-TIME LIVE KOP SURAT MOCKUP */}
                <div className="lg:col-span-5 sticky top-24">
                  <div className="bg-slate-900 text-white p-5 rounded-[2rem] shadow-xl space-y-4 border border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                        <Sparkles size={12} /> Pratinjau KOP Surat Real-Time
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">A4 Document</span>
                    </div>

                    {/* Paper Mockup Container */}
                    <div className="bg-white text-slate-900 p-5 rounded-xl shadow-2xl space-y-3 font-serif min-h-[320px] relative overflow-hidden flex flex-col justify-between">
                      
                      {/* Kop Header Mockup */}
                      <div>
                        <div className="flex items-center justify-between gap-2 border-b-2 border-slate-900 pb-2 mb-0.5">
                          <div className="w-10 h-12 shrink-0 flex items-center justify-center">
                            {pdfConfig.logo ? (
                              <img src={pdfConfig.logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                            ) : (
                              <div className="w-8 h-10 border border-dashed border-slate-300 flex items-center justify-center text-[7px] text-slate-400">Logo</div>
                            )}
                          </div>
                          
                          <div className="text-center flex-1 leading-tight">
                            <p className="text-[9px] font-bold uppercase tracking-tight text-slate-800">PEMERINTAH KOTA {pdfConfig.kota || 'PALU'}</p>
                            <p className="text-[9px] font-bold uppercase tracking-tight text-slate-800">KECAMATAN {pdfConfig.kecamatan || 'MANTIKULORE'}</p>
                            <p className="text-[9px] font-bold uppercase tracking-tight text-slate-800">KELURAHAN {pdfConfig.kelurahan || 'TONDO'}</p>
                            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-900 mt-0.5">PENGURUS {pdfConfig.rtName || 'RT 02'}</p>
                            <p className="text-[7px] font-sans font-medium text-slate-500 mt-0.5 line-clamp-1">{pdfConfig.rtAddress || 'Alamat RT...'}</p>
                          </div>
                        </div>
                        <div className="h-0.5 bg-slate-900 w-full mb-3" />

                        {/* Title Mockup */}
                        <div className="text-center my-3">
                          <p className="text-[10px] font-bold uppercase underline text-slate-900">SURAT PENGANTAR</p>
                          <p className="text-[8px] font-sans text-slate-500">Nomor: SPK/001/{pdfConfig.rtName?.replace(/\s/g, '') || 'RT02'}/VIII/2026</p>
                        </div>

                        {/* Content Placeholder Mockup */}
                        <div className="space-y-1.5 text-[7px] font-sans text-slate-600 leading-normal">
                          <p className="indent-4">Yang bertanda tangan di bawah ini Ketua {pdfConfig.rtName || 'RT 02'}, Kel. {pdfConfig.kelurahan || 'TONDO'} menerangkan bahwa:</p>
                          <div className="pl-4 space-y-0.5">
                            <p><span className="inline-block w-16">Nama</span>: BUDI SANTOSO</p>
                            <p><span className="inline-block w-16">Keperluan</span>: Pengurusan Administrasi KTP Baru</p>
                          </div>
                        </div>
                      </div>

                      {/* Footer Signature & Stamp Mockup */}
                      <div className="pt-4 flex justify-between items-end text-[7px] font-sans border-t border-slate-100">
                        <div className="text-center">
                          <p>Pemohon,</p>
                          <div className="h-6" />
                          <p className="font-bold">( BUDIRAHARJO )</p>
                        </div>

                        <div className="text-center relative">
                          <p>Palu, 14 Agustus 2026</p>
                          <p className="font-bold">Ketua {pdfConfig.rtName || 'RT 02'}</p>
                          
                          <div className="relative h-10 w-24 mx-auto flex items-center justify-center my-0.5">
                            {pdfConfig.stamp && (
                              <img src={pdfConfig.stamp} alt="Stamp" className="absolute left-0 w-8 h-8 object-contain opacity-80" />
                            )}
                            {pdfConfig.signature && (
                              <img src={pdfConfig.signature} alt="TTD" className="relative w-16 h-8 object-contain z-10" />
                            )}
                          </div>
                          <p className="font-bold">{pdfConfig.rtChairman || 'NAMA KETUA RT'}</p>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

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
              
              const isWaiting = letter.status === 'Menunggu' || letter.status === 'Pending';
              const isApproved = letter.status === 'Disetujui' || letter.status === 'Approved';
              const isRejected = letter.status === 'Ditolak' || letter.status === 'Rejected';

              return (
                <motion.div 
                  key={letter.id}
                  layout
                  className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/40 transition-all group relative overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Status badge ring absolute indicator */}
                    <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-[2.5rem] flex items-center justify-center ${
                      isWaiting ? 'bg-amber-50 text-amber-600' :
                      isApproved ? 'bg-emerald-50 text-emerald-600' :
                      'bg-rose-50 text-rose-600'
                    }`}>
                      {isWaiting && (
                        <div className="relative">
                          <span className="absolute -inset-1 rounded-full bg-amber-400/20 animate-ping" />
                          <Clock size={20} className="relative" />
                        </div>
                      )}
                      {isApproved && <CheckCircle2 size={20} />}
                      {isRejected && <XCircle size={20} />}
                    </div>

                    <div className="mb-5 relative z-10">
                      <span className="inline-flex px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-3 border border-indigo-100/50">
                        {letter.type}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 leading-tight mb-1 group-hover:text-indigo-650 transition-colors">
                        {letter.applicantName}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-[11px] font-bold text-slate-500 mt-1">
                        <span className="bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Home size={10} className="text-indigo-400" /> Blok {letter.houseId}
                        </span>
                        {letter.nik && (
                          <span className="bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-md text-slate-400 tracking-wider">
                            NIK {letter.nik}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2.5 mb-6 relative z-10">
                      {/* Date details */}
                      <div className="bg-slate-50/70 rounded-2xl p-3 border border-slate-100 space-y-1 text-xs">
                        <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                          <Clock size={12} />
                          <span>Waktu Pengajuan:</span>
                        </div>
                        <div className="pl-5 text-slate-700 font-black flex flex-col">
                          <span>{formattedDate}</span>
                          {formattedTime && <span className="text-indigo-600 text-[11px] font-bold">{formattedTime}</span>}
                        </div>
                      </div>

                      {/* WhatsApp Quick Link */}
                      {letter.phone && (
                        <div className="flex items-center justify-between p-3 bg-emerald-50/40 rounded-2xl border border-emerald-100/60 transition-colors hover:bg-emerald-50/70">
                          <div className="flex items-center gap-2 text-xs text-slate-600 font-bold">
                            <Phone size={12} className="text-emerald-500 shrink-0" />
                            <span>Kontak: <span className="text-slate-700 font-extrabold">{letter.phone}</span></span>
                          </div>
                          <button
                            onClick={() => {
                              const templateText = formatLetterStatusForWhatsApp(letter.applicantName, letter.type, letter.status);
                              sendWhatsAppMessage(letter.phone, templateText);
                            }}
                            className="p-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 shadow-sm shadow-emerald-600/10"
                            title="Kirim status update via WhatsApp"
                          >
                            <MessageCircle size={10} /> Kirim WA
                          </button>
                        </div>
                      )}

                      {/* Necessity description */}
                      <div className="p-3.5 bg-slate-50 rounded-2xl text-xs text-slate-650 leading-relaxed border border-slate-100">
                        <span className="font-bold block mb-1 text-slate-400 uppercase tracking-widest text-[9px]">Keperluan:</span>
                        <p className="line-clamp-2 text-slate-600 font-medium italic">"{letter.purposeDetail || '-'}"</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap gap-2 relative z-10 pt-4 border-t border-slate-100 mt-auto">
                    <button 
                      onClick={() => setSelectedLetter(letter)}
                      className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs hover:bg-slate-800 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Eye size={13} /> Detail & Proses
                    </button>
                    
                    {isApproved && (
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
                        className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 hover:scale-[1.03] transition-all border border-emerald-100"
                        title="Cetak File PDF Surat"
                      >
                        <Printer size={15} />
                      </button>
                    )}

                    <button 
                      onClick={() => handleDeleteLetter(letter.id)}
                      className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 hover:scale-[1.03] transition-all border border-rose-100"
                      title="Hapus Permanen"
                    >
                      <Trash2 size={15} />
                    </button>

                    {!letter.archived && (isApproved || isRejected) && (
                      <button 
                        onClick={() => handleArchiveLetter(letter.id)}
                        className="p-3 bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-100 hover:scale-[1.03] transition-all border border-amber-100"
                        title="Arsipkan data"
                      >
                        <Archive size={15} />
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
            {filteredReports.map((report) => {
              const isNew = report.status === 'Baru';
              const isProcessing = report.status === 'Diproses';
              
              return (
                <motion.div 
                  key={report.id}
                  layout
                  className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md hover:shadow-slate-100 transition-all flex flex-col md:flex-row gap-5 items-start md:items-center justify-between group relative overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row gap-5 items-start md:items-center flex-1 min-w-0">
                    <div className={`p-4 rounded-2xl shrink-0 ${
                      report.type === 'Keamanan' ? 'bg-rose-550/10 text-rose-600' :
                      report.type === 'Kebersihan' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      <AlertTriangle size={22} />
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          isNew ? 'bg-rose-100/60 text-rose-700 border-rose-200/50' :
                          isProcessing ? 'bg-amber-150/60 text-amber-700 border-amber-200/50' :
                          'bg-emerald-100/60 text-emerald-700 border-emerald-200/50'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isNew ? 'bg-rose-500 animate-ping' : isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                          {report.status}
                        </span>
                        <span className="text-xs font-bold text-slate-300">•</span>
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest text-[9px]">{report.type}</span>
                        <span className="text-xs font-bold text-slate-300">•</span>
                        <span className="text-xs font-semibold text-slate-400">{new Date(report.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-850 mb-0.5 leading-snug text-slate-900 pr-4">{report.description}</h3>
                      <p className="text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-1.5">
                        Pelapor: <span className="text-slate-800 font-bold">{report.reporterName}</span> 
                        {(() => {
                          const house = houses.find(h => h.id === report.houseId || h.id === report.reporterHouseId);
                          return house ? (
                            <span className="bg-slate-100/70 border border-slate-200/50 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-bold">Blok {house.block}-{house.number}</span>
                          ) : (report.houseId ? (
                            <span className="bg-slate-100/70 border border-slate-200/50 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-bold">{report.houseId}</span>
                          ) : '');
                        })()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto pt-3 md:pt-0 border-t md:border-none border-slate-100/60 shrink-0">
                    {/* Inline Quick Action Status Transition Steps - highly user friendly */}
                    {isNew && (
                      <button 
                        onClick={() => handleUpdateReportStatus(report.id, 'Diproses')}
                        className="flex-1 sm:flex-none px-4 py-3 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                        title="Langsung respon dan tandai sedang dikerjakan"
                      >
                        <RefreshCw size={13} className="animate-spin-slow" /> Tangani
                      </button>
                    )}
                    {isProcessing && (
                      <button 
                        onClick={() => handleUpdateReportStatus(report.id, 'Selesai')}
                        className="flex-1 sm:flex-none px-4 py-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                        title="Tandai aduan warga selesai tuntas ditangani"
                      >
                        <CheckCircle2 size={13} /> Selesai
                      </button>
                    )}

                    <button 
                      onClick={() => setSelectedReport(report)}
                      className="flex-1 sm:flex-none px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white border-none rounded-2xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-[0.98]"
                    >
                      <Eye size={13} /> Detail
                    </button>

                    {onDeleteReport && (
                      <button 
                        onClick={() => onDeleteReport(report.id)}
                        className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 hover:scale-[1.03] transition-all border border-rose-100"
                        title="Hapus Laporan permanen"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}

                    {!report.archived && report.status === 'Selesai' && (
                      <button 
                        onClick={() => handleArchiveReport(report.id)}
                        className="p-3 bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-100 hover:scale-[1.03] transition-all border border-amber-100"
                        title="Arsipkan laporan"
                      >
                        <Archive size={15} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Letter Detail Modal */}
      <Modal isOpen={!!selectedLetter} onClose={() => setSelectedLetter(null)} title="Detail Permohonan Surat" maxWidth="max-w-3xl">
            {selectedLetter && (
              <div className="space-y-6">
                {/* Modern Navigation Tab Bar */}
                <div className="flex border border-slate-150 p-1 sm:p-1.5 rounded-2xl bg-slate-50/50">
                  <button
                    type="button"
                    onClick={() => setDetailModalTab('profil')}
                    className={`flex-1 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest transition-all flex items-center justify-center gap-1 sm:gap-2 ${
                      detailModalTab === 'profil'
                        ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100/50 border border-slate-150'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <User size={13} className={detailModalTab === 'profil' ? 'text-indigo-600' : 'text-slate-400'} />
                    <span>Profil <span className="hidden sm:inline">Pemohon</span></span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailModalTab('keperluan')}
                    className={`flex-1 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest transition-all flex items-center justify-center gap-1 sm:gap-2 ${
                      detailModalTab === 'keperluan'
                        ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100/50 border border-slate-150'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FileText size={13} className={detailModalTab === 'keperluan' ? 'text-indigo-600' : 'text-slate-400'} />
                    <span>Keperluan<span className="hidden sm:inline"> & Berkas</span></span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailModalTab('penerbitan')}
                    className={`flex-1 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest transition-all flex items-center justify-center gap-1 sm:gap-2 ${
                      detailModalTab === 'penerbitan'
                        ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100/50 border border-slate-150'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <CheckCircle2 size={13} className={detailModalTab === 'penerbitan' ? 'text-indigo-600' : 'text-slate-400'} />
                    <span>Penerbitan<span className="hidden sm:inline"> & TTD</span></span>
                  </button>
                </div>

                {/* Tab 1: Profil Pemohon */}
                {detailModalTab === 'profil' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Section 1: Identitas Pokok & KK */}
                    <div className="bg-slate-50/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 space-y-3 sm:space-y-4">
                      <h4 className="text-[11px] sm:text-xs font-black text-indigo-655 uppercase tracking-widest flex items-center gap-2 mb-0.5">
                        <CreditCard size={13} className="text-indigo-500" />
                        <span>Identitas Pokok & Kartu Keluarga (KK)</span>
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                            <User size={10} className="text-indigo-500" /> Nama Lengkap Sesuai KTP
                          </label>
                          <input 
                            type="text"
                            className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            value={editLetterData.applicantName || ''}
                            onChange={e => setEditLetterData({...editLetterData, applicantName: e.target.value})}
                            placeholder="Contoh: Budi Santoso"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                            <Hash size={10} className="text-indigo-500" /> NIK (16 Digit)
                          </label>
                          <input 
                            type="text"
                            className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            value={editLetterData.nik || ''}
                            onChange={e => setEditLetterData({...editLetterData, nik: e.target.value})}
                            placeholder="Contoh: 7271xxxxxxxxxxxx"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                            <Users size={10} className="text-indigo-500" /> Nama Kepala Keluarga (KK)
                          </label>
                          <input 
                            type="text"
                            className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            value={editLetterData.familyHeadName || ''}
                            onChange={e => setEditLetterData({...editLetterData, familyHeadName: e.target.value})}
                            placeholder="Nama Kepala Keluarga di Kartu Keluarga"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                            <UserCheck size={10} className="text-indigo-500" /> Hubungan Keluarga
                          </label>
                          <select 
                            className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            value={editLetterData.familyStatus || ''}
                            onChange={e => setEditLetterData({...editLetterData, familyStatus: e.target.value as any})}
                          >
                            <option value="Kepala Keluarga">Kepala Keluarga</option>
                            <option value="Suami">Suami</option>
                            <option value="Istri">Istri</option>
                            <option value="Anak">Anak</option>
                            <option value="Menantu">Menantu</option>
                            <option value="Cucu">Cucu</option>
                            <option value="Orang Tua">Orang Tua</option>
                            <option value="Mertua">Mertua</option>
                            <option value="Saudara/Adik/Kakak">Saudara/Adik/Kakak</option>
                            <option value="Famili Lain">Famili Lain</option>
                            <option value="Pembantu">Pembantu</option>
                            <option value="Lainnya">Lainnya</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Birth, Gender & Marital Status */}
                    <div className="bg-slate-50/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 space-y-3 sm:space-y-4">
                      <h4 className="text-[11px] sm:text-xs font-black text-indigo-650 uppercase tracking-widest flex items-center gap-2 mb-0.5">
                        <Calendar size={13} className="text-indigo-500" />
                        <span>Kelahiran, Jenis Kelamin, & Perkawinan</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                            <MapPin size={10} className="text-indigo-500" /> Tempat Kelahiran
                          </label>
                          <input 
                            type="text"
                            className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            value={editLetterData.birthPlace || ''}
                            onChange={e => setEditLetterData({...editLetterData, birthPlace: e.target.value})}
                            placeholder="Contoh: Palu"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                            <Calendar size={10} className="text-indigo-500" /> Tanggal Lahir (Format Terang / ISO)
                          </label>
                          <input 
                            type="text"
                            className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            value={editLetterData.birthDate || ''}
                            onChange={e => setEditLetterData({...editLetterData, birthDate: e.target.value})}
                            placeholder="Format: DD-MM-YYYY, misal: 15-08-1995"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                            <UserCheck size={10} className="text-indigo-500" /> Jenis Kelamin
                          </label>
                          <select 
                            className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            value={editLetterData.gender || 'Laki-laki'}
                            onChange={e => setEditLetterData({...editLetterData, gender: e.target.value as any})}
                          >
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                            <Heart size={10} className="text-indigo-500" /> Status Perkawinan
                          </label>
                          <select 
                            className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            value={editLetterData.maritalStatus || 'Belum Kawin'}
                            onChange={e => setEditLetterData({...editLetterData, maritalStatus: e.target.value as any})}
                          >
                            <option value="Belum Kawin">Belum Kawin</option>
                            <option value="Kawin">Kawin</option>
                            <option value="Cerai Hidup">Cerai Hidup</option>
                            <option value="Cerai Mati">Cerai Mati</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Sosial, Pendidikan & Latar Belakang */}
                    <div className="bg-slate-50/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 space-y-3 sm:space-y-4">
                      <h4 className="text-[11px] sm:text-xs font-black text-indigo-650 uppercase tracking-widest flex items-center gap-2 mb-0.5">
                        <BookOpen size={13} className="text-indigo-500" />
                        <span>Sosial, Pendidikan, Agama & Latar Belakang</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                            <Info size={10} className="text-indigo-500" /> Agama / Keyakinan
                          </label>
                          <select 
                            className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            value={editLetterData.religion || ''}
                            onChange={e => setEditLetterData({...editLetterData, religion: e.target.value})}
                          >
                            <option value="">-- Pilih Agama --</option>
                            <option value="Islam">Islam</option>
                            <option value="Kristen Protestan">Kristen Protestan</option>
                            <option value="Katolik">Katolik</option>
                            <option value="Hindu">Hindu</option>
                            <option value="Buddha">Buddha</option>
                            <option value="Khonghucu">Khonghucu</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                            <Flag size={10} className="text-indigo-500" /> Kewarganegaraan
                          </label>
                          <input 
                            type="text"
                            className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            value={editLetterData.nationality || ''}
                            onChange={e => setEditLetterData({...editLetterData, nationality: e.target.value})}
                            placeholder="Contoh: WNI atau WNA"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                            <BookOpen size={10} className="text-indigo-500" /> Pendidikan Terakhir
                          </label>
                          <input 
                            type="text"
                            className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            value={editLetterData.education || ''}
                            onChange={e => setEditLetterData({...editLetterData, education: e.target.value})}
                            placeholder="Contoh: SMA, Diploma, S1, S2, dll."
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                            <Briefcase size={10} className="text-indigo-500" /> Pekerjaan Saat Ini
                          </label>
                          <input 
                            type="text"
                            className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            value={editLetterData.job || ''}
                            onChange={e => setEditLetterData({...editLetterData, job: e.target.value})}
                            placeholder="Contoh: PNS, Swasta, Mahasiswa, Ibu Rumah Tangga"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Kontak & Medis */}
                    <div className="bg-slate-50/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 space-y-3 sm:space-y-4">
                      <h4 className="text-[11px] sm:text-xs font-black text-indigo-650 uppercase tracking-widest flex items-center gap-2 mb-0.5">
                        <Phone size={13} className="text-indigo-500" />
                        <span>Kontak & Data Medis</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div className="space-y-1 col-span-1">
                          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                            <Phone size={10} className="text-indigo-500" /> No. WhatsApp
                          </label>
                          <input 
                            type="text"
                            className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            value={editLetterData.phone || ''}
                            onChange={e => setEditLetterData({...editLetterData, phone: e.target.value})}
                            placeholder="Contoh: 081234567890"
                          />
                        </div>

                        <div className="space-y-1 col-span-1 border-t sm:border-t-0 pt-2.5 sm:pt-0">
                          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                            <Mail size={10} className="text-indigo-500" /> Alamat Email
                          </label>
                          <input 
                            type="email"
                            className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            value={editLetterData.email || ''}
                            onChange={e => setEditLetterData({...editLetterData, email: e.target.value})}
                            placeholder="Contoh: email@domain.com"
                          />
                        </div>

                        <div className="space-y-1 col-span-1 border-t sm:border-t-0 pt-2.5 sm:pt-0">
                          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                            <Heart size={10} className="text-indigo-500" /> Golongan Darah
                          </label>
                          <select 
                            className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            value={editLetterData.bloodType || ''}
                            onChange={e => setEditLetterData({...editLetterData, bloodType: e.target.value as any})}
                          >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="AB">AB</option>
                            <option value="O">O</option>
                            <option value="-">Tidak Tahu / -</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Tab 2: Keperluan & Berkas */}
                {detailModalTab === 'keperluan' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 sm:space-y-5"
                  >
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                          <FileText size={10} className="text-indigo-500" /> Format / Jenis Surat Keterangan <span className="text-rose-500">*</span>
                        </label>
                        <select 
                          className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          value={editLetterData.type || ''}
                          onChange={e => setEditLetterData({...editLetterData, type: e.target.value})}
                        >
                          {(pdfConfig.letterTemplates || [
                            { type: 'Surat Pengantar' },
                            { type: 'Surat Pengantar KTP' },
                            { type: 'Surat Pengantar KK' },
                            { type: 'Surat Keterangan Domisili' },
                            { type: 'Surat Keterangan Tidak Mampu' },
                            { type: 'Surat Izin Keramaian' },
                            { type: 'Surat Keterangan Usaha' },
                            { type: 'Surat Keterangan Berkelakuan Baik' },
                            { type: 'Surat Keterangan Kematian' },
                            { type: 'Surat Keterangan Kelahiran' },
                            { type: 'Surat Keterangan Waris / Ahli Waris' },
                            { type: 'Surat Keterangan Pindah / Datang' },
                            { type: 'Surat Pengantar Nikah (N1 - N4)' },
                          ]).map(t => <option key={t.type} value={t.type}>{t.type}</option>)}
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                          <ClipboardList size={10} className="text-indigo-500" /> Detail Keperluan & Maksud Pembuatan Surat
                        </label>
                        <button 
                          type="button"
                          onClick={() => {
                            const defaultTemplates = [
                              { type: 'Surat Pengantar', suggestion: 'Surat ini diberikan untuk keperluan kelengkapan administrasi sebagai persyaratan [Sebutkan Keperluan, cth: melamar pekerjaan di PT. XYZ / pendaftaran sekolah / dll].' },
                              { type: 'Surat Pengantar KTP', suggestion: 'Surat pengantar ini dibuat sebagai kelengkapan administrasi dalam rangka permohonan pembuatan Kartu Tanda Penduduk (KTP) baru / perpanjangan KTP yang bersangkutan di tingkat Kelurahan/Kecamatan.' },
                              { type: 'Surat Pengantar KK', suggestion: 'Surat pengantar ini dibuat sebagai persyaratan untuk keperluan administrasi pengurusan / perubahan data / pembuatan Kartu Keluarga (KK) baru di tingkat Kelurahan.' },
                              { type: 'Surat Keterangan Domisili', suggestion: 'Bahwa yang bersangkutan benar-benar merupakan warga / penduduk yang berdomisili menetap di wilayah RT kami. Surat keterangan ini digunakan untuk persyaratan [cth: melamar pekerjaan / pembukaan rekening bank / pendaftaran sekolah].' },
                              { type: 'Surat Keterangan Tidak Mampu', suggestion: 'Bahwa yang bersangkutan adalah benar warga RT kami dan berdasarkan keadaan yang sebenarnya, yang bersangkutan termasuk dalam keluarga prasejahtera / Kurang Mampu. Surat Keterangan ini digunakan untuk keperluan persyaratan [cth: pengajuan beasiswa / keringanan biaya rumah sakit / bantuan sosial].' },
                              { type: 'Surat Izin Keramaian', suggestion: 'Surat ini sebagai pengantar / rekomendasi izin penyelenggaraan acara keramaian berupa [Nama/Jenis Acara, cth: Resepsi Pernikahan] yang akan diselenggarakan pada hari/tanggal [Tanggal Acara] bertempat di [Lokasi Acara].' },
                              { type: 'Surat Keterangan Usaha', suggestion: 'Bahwa yang bersangkutan benar merupakan warga kami dan memiliki usaha / bisnis di bidang [Jenis Usaha, cth: Perdagangan/Kuliner] dengan nama usaha [Nama Usaha] yang berlokasi di wilayah RT kami. Surat ini dibuat untuk keperluan [cth: pengajuan kredit UMKM / pembuatan NPWP badan].' },
                              { type: 'Surat Keterangan Berkelakuan Baik', suggestion: 'Bahwa yang bersangkutan adalah warga kami yang senantiasa berkelakuan baik, belum pernah tersangkut tindak pidana, dan tidak pernah mengganggu ketertiban lingkungan. Surat ini sebagai pengantar untuk pembuatan SKCK di kepolisian untuk keperluan [cth: pendaftaran TNI/Polri / melamar pekerjaan].' },
                              { type: 'Surat Keterangan Kematian', suggestion: 'Menerangkan dengan sebenarnya bahwa warga kami yang bernama [Nama Almarhum/Almarhumah] telah meninggal dunia pada [Hari, Tanggal, Jam] dikarenakan [Sakit/Usia/dll]. Surat keterangan ini digunakan untuk persyaratan administrasi kepengurusan Akta Kematian di Kelurahan.' },
                              { type: 'Surat Keterangan Kelahiran', suggestion: 'Menerangkan bahwa telah lahir seorang anak [Laki-laki / Perempuan] bernama [Nama Anak] pada tanggal [Tanggal Lahir] dari pasangan suami istri [Nama Ayah] dan [Nama Ibu]. Surat pengantar ini digunakan untuk keperluan pembuatan Akta Kelahiran.' },
                              { type: 'Surat Keterangan Waris / Ahli Waris', suggestion: 'Surat keterangan ini menerangkan susunan ahli waris yang sah dari almarhum/almarhumah [Nama Almarhum] untuk digunakan sebagai persyaratan administrasi kepengurusan turun waris / pembagian harta warisan keluarga.' },
                              { type: 'Surat Keterangan Pindah / Datang', suggestion: 'Bahwa yang bersangkutan bermaksud untuk mengurus administrasi pindah alamat dari RT kami menuju [Alamat Tujuan Pindah] / melapor kedatangan sebagai warga baru yang pindah dari [Alamat Asal].' },
                              { type: 'Surat Pengantar Nikah (N1 - N4)', suggestion: 'Menerangkan bahwa yang bersangkutan bermaksud untuk melangsungkan pernikahan. Surat pengantar ini dibuat sebagai persyaratan pengurusan berkas administrasi pernikahan (N1, N2, N3, N4) di tingkat Kelurahan.' }
                            ];
                            const templates = (pdfConfig.letterTemplates && pdfConfig.letterTemplates.length > 0) ? pdfConfig.letterTemplates : defaultTemplates;
                            const template = templates.find(t => t.type === editLetterData.type)?.suggestion;
                            if (template) setEditLetterData({...editLetterData, purposeDetail: template});
                          }}
                          className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                        >
                          <Sparkles size={10} /> Isi Otomatis
                        </button>
                      </div>
                      <textarea 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all h-20 sm:h-24 resize-none"
                        value={editLetterData.purposeDetail || ''}
                        onChange={e => setEditLetterData({...editLetterData, purposeDetail: e.target.value})}
                        placeholder="Detail keperluan warga (misal: pengurusan pendaftaran beasiswa anak, pembuatan paspor dsb.)"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                          <MapPin size={10} className="text-indigo-500" /> Alamat Sesuai KTP Resmi
                        </label>
                        <textarea 
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all h-20 sm:h-24 resize-none"
                          value={editLetterData.addressKtp || ''}
                          onChange={e => setEditLetterData({...editLetterData, addressKtp: e.target.value})}
                          placeholder="Tulis alamat persis sesuai KTP daerah asal"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                          <Home size={10} className="text-indigo-500" /> Alamat Domisili Saat Ini (RT 02)
                        </label>
                        <textarea 
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all h-20 sm:h-24 resize-none"
                          value={editLetterData.currentAddress || ''}
                          onChange={e => setEditLetterData({...editLetterData, currentAddress: e.target.value})}
                          placeholder="Alamat domisili saat ini di wilayah RT"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Tab 3: Penerbitan & TTD */}
                {detailModalTab === 'penerbitan' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 sm:space-y-5"
                  >
                    {/* Status Visual Banner */}
                    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border">
                      {selectedLetter.status === 'Menunggu' || selectedLetter.status === 'Pending' ? (
                        <div className="bg-amber-50/80 border-amber-100 p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3">
                          <div className="p-2 bg-amber-100 text-amber-600 rounded-xl shrink-0">
                            <Clock size={16} className="animate-pulse" />
                          </div>
                          <div>
                            <h4 className="text-[11px] sm:text-xs font-black text-amber-800 uppercase tracking-wide">Status: Menunggu Persetujuan Ketua RT</h4>
                            <p className="text-[10px] sm:text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                              Permohonan masuk antrean. Anda dapat menyelaraskan format nomor surat di bawah, membubuhkan tanda tangan (opsional) atau langsung mencetak format resmi.
                            </p>
                          </div>
                        </div>
                      ) : selectedLetter.status === 'Disetujui' || selectedLetter.status === 'Approved' ? (
                        <div className="bg-emerald-50/80 border-emerald-105 p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3">
                          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
                            <CheckCircle2 size={16} />
                          </div>
                          <div>
                            <h4 className="text-[11px] sm:text-xs font-black text-emerald-800 uppercase tracking-wide">Status: Telah Disetujui (Diterbitkan)</h4>
                            <p className="text-[10px] sm:text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                              Dokumen pengantar telah selesai diproses dengan nomor surat <span className="font-extrabold">{selectedLetter.letterNumber}</span>. Berkas siap cetak kapan saja diperlukan.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-rose-50/80 border-rose-100 p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3">
                          <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                            <XCircle size={16} />
                          </div>
                          <div>
                            <h4 className="text-[11px] sm:text-xs font-black text-rose-800 uppercase tracking-wide">Status: Pengajuan Ditolak</h4>
                            <p className="text-[10px] sm:text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                              Permohonan tidak disetujui karena ketidaksesuaian administrasi RT. Silakan komunikasikan perbaikan kepada pemohon bersangkutan.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Letter Number Input Group WITH SYNC BUTTON - Extremely User Friendly & Professional */}
                    <div className="bg-slate-50/50 rounded-xl sm:rounded-2xl p-3.5 sm:p-4.5 border border-slate-150 space-y-4">
                      <div>
                        <label className="block text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                          Nomor Surat Resmi (Format Terbuka untuk Diedit)
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <Hash size={14} />
                            </div>
                            <input 
                              type="text"
                              className="w-full pl-10 pr-4 py-2.5 sm:py-3.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                              value={letterNumberInput}
                              onChange={(e) => setLetterNumberInput(e.target.value)}
                              placeholder="Contoh: SK/008/RT02/VI/2026"
                            />
                          </div>

                          {/* SINKRONISASI DAFTAR NOMOR SURAT BUTTON */}
                          <button
                            type="button"
                            onClick={handleSyncLetterSequence}
                            className="py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                            title="Samakan nomor surat dengan data historis tertinggi di database"
                          >
                            <RefreshCw size={13} className="animate-spin-slow text-amber-600 shrink-0" />
                            <span>Sinkronkan Nomor</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-2.5 sm:p-3 bg-white/70 border border-slate-100 rounded-xl flex items-start gap-2.5">
                        <Info size={13} className="text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] sm:text-[10.5px] text-slate-500 leading-relaxed">
                          Tombol <span className="font-extrabold text-amber-700">Sinkronkan Nomor</span> akan otomatis scanning database terhadap surat warga dan surat dinas lain, serta mengusulkan nomor urut selanjutnya agar urutan penomoran tidak melompat. Nama penanda tangan akan diambil secara otomatis dari tab Pengaturan.
                        </p>
                      </div>
                    </div>

                    {/* Signature pad - only for pending */}
                    {(selectedLetter.status === 'Menunggu' || selectedLetter.status === 'Pending') && (
                      <div className="p-3 sm:p-4 bg-indigo-50/50 rounded-xl sm:rounded-2xl border border-indigo-100/70">
                        <p className="text-[9px] sm:text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                          <Sparkles size={11} /> Tanda Tangan Digital Ketua RT (Opsional Untuk Persetujuan Instan)
                        </p>
                        <div className="bg-white rounded-xl border border-indigo-150 overflow-hidden shadow-sm">
                          <SignaturePad 
                            onSave={(sig) => setTempSignature(sig)} 
                            onClear={() => setTempSignature(null)}
                          />
                        </div>
                        <p className="text-[9px] text-indigo-400 mt-2 italic leading-normal">
                          * Apabila tidak ditandatangani manual, sistem akan menggunakan tanda tangan digital default yang tersimpan di pengaturan RT.
                        </p>
                      </div>
                    )}

                    {/* Review inline actions status change */}
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3 pt-2">
                      <Button 
                        type="button"
                        onClick={() => {
                          if (selectedLetter) {
                            handleGenerateLivePreview({
                              ...selectedLetter,
                              ...editLetterData,
                              letterNumber: letterNumberInput
                            } as LetterRequest);
                          }
                        }}
                        className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 py-2.5 sm:py-3.5 text-[10px] sm:text-xs"
                      >
                        <Eye size={14} className="mr-1 sm:mr-1.5 shrink-0" /> Pratinjau PDF
                      </Button>

                      {(selectedLetter.status === 'Menunggu' || selectedLetter.status === 'Pending') ? (
                        <>
                          <Button 
                            onClick={() => handleUpdateLetterStatus(selectedLetter.id, 'Ditolak')}
                            className="bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 shadow-none py-2.5 sm:py-3.5 text-[10px] sm:text-xs hover:scale-[1.01] transition-all"
                          >
                            <XCircle size={14} className="mr-1 sm:mr-1.5 shrink-0" /> Tolak
                          </Button>
                          <Button 
                            onClick={() => {
                              handleUpdateLetterStatus(selectedLetter.id, 'Disetujui', {
                                ...selectedLetter,
                                ...editLetterData,
                                letterNumber: letterNumberInput,
                              }, tempSignature);
                            }}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-750 font-black tracking-wide text-[10px] sm:text-xs py-2.5 sm:py-3.5 hover:scale-[1.01] transition-all shadow-md shadow-emerald-200"
                          >
                            <CheckCircle2 size={14} className="mr-1 sm:mr-1.5 shrink-0" /> Setujui & Terbitkan
                          </Button>
                        </>
                      ) : (
                        <Button 
                          onClick={handleSaveLetterDetails}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black tracking-wide text-[10px] sm:text-xs py-2.5 sm:py-3.5 shadow-md"
                        >
                          <Save size={14} className="mr-1 sm:mr-1.5 shrink-0" /> Simpan Detail Surat
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Persistent Footer Changes Actions */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 pt-4 sm:pt-5 border-t border-slate-100/80 mt-5 sm:mt-6">
                  <Button 
                    onClick={handleSaveLetterDetails}
                    variant="secondary"
                    className="w-full sm:flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border-none font-bold py-2.5 sm:py-3 text-xs"
                  >
                    <Save size={14} className="mr-1.5 shrink-0" /> Simpan Perubahan Data
                  </Button>
                  
                  <Button 
                    onClick={() => sendWhatsAppMessage(selectedLetter.phone, formatLetterStatusForWhatsApp(selectedLetter.applicantName, selectedLetter.type, selectedLetter.status))}
                    className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.01] transition-all font-bold py-2.5 sm:py-3 text-xs shadow-md shadow-emerald-200"
                  >
                    <MessageCircle size={14} className="mr-1.5 shrink-0" /> Kirim Update WhatsApp
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
                  <label className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1.5 ml-1 flex items-center gap-1">
                    <UserCheck size={12} /> Pilih Warga Terdaftar (Auto-Fill Fast Select)
                  </label>
                  <select
                    className="w-full p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-2xl text-xs font-bold text-indigo-900 focus:bg-white outline-none cursor-pointer"
                    onChange={(e) => {
                      const houseId = e.target.value;
                      if (!houseId) return;
                      const targetHouse = houses.find(h => h.id === houseId);
                      if (targetHouse) {
                        setAdminForm({
                          ...adminForm,
                          applicantName: targetHouse.headOfFamily || '',
                          nik: targetHouse.nik || '',
                          familyHeadName: targetHouse.ownerName || targetHouse.headOfFamily || '',
                          houseId: `${targetHouse.block}-${targetHouse.number}`,
                          currentAddress: `Kavling Blok ${targetHouse.block} No. ${targetHouse.number}`,
                          phone: targetHouse.phone || '',
                          birthPlace: targetHouse.birthPlace || '',
                          birthDate: targetHouse.birthDate || '',
                          gender: targetHouse.gender || 'Laki-laki',
                          religion: targetHouse.religion || 'Islam',
                          job: targetHouse.jobCategory || '',
                          maritalStatus: targetHouse.maritalStatus || 'Belum Kawin',
                          addressKtp: targetHouse.addressKtp || `Blok ${targetHouse.block}-${targetHouse.number} RT 02`
                        });
                        toast.success(`Data warga ${targetHouse.headOfFamily} (Blok ${targetHouse.block}-${targetHouse.number}) otomatis terisi!`);
                      }
                    }}
                  >
                    <option value="">-- Pilih dari Daftar Warga RT 02 --</option>
                    {houses.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.headOfFamily} - Blok {h.block}-{h.number} ({h.phone || 'No HP -'})
                      </option>
                    ))}
                  </select>
                </div>

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
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Nama Kepala Keluarga / Penghuni</label>
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
                      <option>Kepala Keluarga</option>
                      <option>Suami</option>
                      <option>Istri</option>
                      <option>Anak</option>
                      <option>Menantu</option>
                      <option>Cucu</option>
                      <option>Orang Tua</option>
                      <option>Mertua</option>
                      <option>Saudara/Adik/Kakak</option>
                      <option>Famili Lain</option>
                      <option>Pembantu</option>
                      <option>Lainnya</option>
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
                        { type: 'Surat Pengantar' },
                        { type: 'Surat Pengantar KTP' },
                        { type: 'Surat Pengantar KK' },
                        { type: 'Surat Keterangan Domisili' },
                        { type: 'Surat Keterangan Tidak Mampu' },
                        { type: 'Surat Izin Keramaian' },
                        { type: 'Surat Keterangan Usaha' },
                        { type: 'Surat Keterangan Berkelakuan Baik' },
                        { type: 'Surat Keterangan Kematian' },
                        { type: 'Surat Keterangan Kelahiran' },
                        { type: 'Surat Keterangan Waris / Ahli Waris' },
                        { type: 'Surat Keterangan Pindah / Datang' },
                        { type: 'Surat Pengantar Nikah (N1 - N4)' },
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
                        const defaultTemplates = [
                          { type: 'Surat Pengantar', suggestion: 'Surat ini diberikan untuk keperluan kelengkapan administrasi sebagai persyaratan [Sebutkan Keperluan, cth: melamar pekerjaan di PT. XYZ / pendaftaran sekolah / dll].' },
                          { type: 'Surat Pengantar KTP', suggestion: 'Surat pengantar ini dibuat sebagai kelengkapan administrasi dalam rangka permohonan pembuatan Kartu Tanda Penduduk (KTP) baru / perpanjangan KTP yang bersangkutan di tingkat Kelurahan/Kecamatan.' },
                          { type: 'Surat Pengantar KK', suggestion: 'Surat pengantar ini dibuat sebagai persyaratan untuk keperluan administrasi pengurusan / perubahan data / pembuatan Kartu Keluarga (KK) baru di tingkat Kelurahan.' },
                          { type: 'Surat Keterangan Domisili', suggestion: 'Bahwa yang bersangkutan benar-benar merupakan warga / penduduk yang berdomisili menetap di wilayah RT kami. Surat keterangan ini digunakan untuk persyaratan [cth: melamar pekerjaan / pembukaan rekening bank / pendaftaran sekolah].' },
                          { type: 'Surat Keterangan Tidak Mampu', suggestion: 'Bahwa yang bersangkutan adalah benar warga RT kami dan berdasarkan keadaan yang sebenarnya, yang bersangkutan termasuk dalam keluarga prasejahtera / Kurang Mampu. Surat Keterangan ini digunakan untuk keperluan persyaratan [cth: pengajuan beasiswa / keringanan biaya rumah sakit / bantuan sosial].' },
                          { type: 'Surat Izin Keramaian', suggestion: 'Surat ini sebagai pengantar / rekomendasi izin penyelenggaraan acara keramaian berupa [Nama/Jenis Acara, cth: Resepsi Pernikahan] yang akan diselenggarakan pada hari/tanggal [Tanggal Acara] bertempat di [Lokasi Acara].' },
                          { type: 'Surat Keterangan Usaha', suggestion: 'Bahwa yang bersangkutan benar merupakan warga kami dan memiliki usaha / bisnis di bidang [Jenis Usaha, cth: Perdagangan/Kuliner] dengan nama usaha [Nama Usaha] yang berlokasi di wilayah RT kami. Surat ini dibuat untuk keperluan [cth: pengajuan kredit UMKM / pembuatan NPWP badan].' },
                          { type: 'Surat Keterangan Berkelakuan Baik', suggestion: 'Bahwa yang bersangkutan adalah warga kami yang senantiasa berkelakuan baik, belum pernah tersangkut tindak pidana, dan tidak pernah mengganggu ketertiban lingkungan. Surat ini sebagai pengantar untuk pembuatan SKCK di kepolisian untuk keperluan [cth: pendaftaran TNI/Polri / melamar pekerjaan].' },
                          { type: 'Surat Keterangan Kematian', suggestion: 'Menerangkan dengan sebenarnya bahwa warga kami yang bernama [Nama Almarhum/Almarhumah] telah meninggal dunia pada [Hari, Tanggal, Jam] dikarenakan [Sakit/Usia/dll]. Surat keterangan ini digunakan untuk persyaratan administrasi kepengurusan Akta Kematian di Kelurahan.' },
                          { type: 'Surat Keterangan Kelahiran', suggestion: 'Menerangkan bahwa telah lahir seorang anak [Laki-laki / Perempuan] bernama [Nama Anak] pada tanggal [Tanggal Lahir] dari pasangan suami istri [Nama Ayah] dan [Nama Ibu]. Surat pengantar ini digunakan untuk keperluan pembuatan Akta Kelahiran.' },
                          { type: 'Surat Keterangan Waris / Ahli Waris', suggestion: 'Surat keterangan ini menerangkan susunan ahli waris yang sah dari almarhum/almarhumah [Nama Almarhum] untuk digunakan sebagai persyaratan administrasi kepengurusan turun waris / pembagian harta warisan keluarga.' },
                          { type: 'Surat Keterangan Pindah / Datang', suggestion: 'Bahwa yang bersangkutan bermaksud untuk mengurus administrasi pindah alamat dari RT kami menuju [Alamat Tujuan Pindah] / melapor kedatangan sebagai warga baru yang pindah dari [Alamat Asal].' },
                          { type: 'Surat Pengantar Nikah (N1 - N4)', suggestion: 'Menerangkan bahwa yang bersangkutan bermaksud untuk melangsungkan pernikahan. Surat pengantar ini dibuat sebagai persyaratan pengurusan berkas administrasi pernikahan (N1, N2, N3, N4) di tingkat Kelurahan.' }
                        ];
                        const templates = (pdfConfig.letterTemplates && pdfConfig.letterTemplates.length > 0) ? pdfConfig.letterTemplates : defaultTemplates;
                        const template = templates.find(t => t.type === adminForm.type)?.suggestion;
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

          <div className="pt-6 border-t border-slate-100 flex flex-wrap sm:flex-nowrap justify-end gap-3 sticky bottom-0 bg-white pb-2">
            <Button type="button" variant="secondary" onClick={() => setIsCreatingLetter(false)} className="px-6">Batal</Button>
            <Button 
              type="button"
              variant="secondary"
              onClick={() => {
                if (!adminForm.applicantName) {
                  toast.error("Isi nama pemohon terlebih dahulu!");
                  return;
                }
                const mockLetter: LetterRequest = {
                  ...adminForm as LetterRequest,
                  id: 'preview-' + Date.now(),
                  status: 'Disetujui',
                  date: new Date().toISOString(),
                  letterNumber: adminLetterNumber
                };
                handleGenerateLivePreview(mockLetter);
              }}
              className="bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
            >
              <Eye size={16} className="mr-1.5" /> Pratinjau PDF
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 px-8">
              <Printer size={18} className="mr-2" /> Terbitkan & Cetak
            </Button>
          </div>
        </form>
      </Modal>

      {/* Live PDF Preview Modal */}
      <Modal 
        isOpen={showPdfPreviewModal} 
        onClose={() => {
          setShowPdfPreviewModal(false);
          if (previewPdfBlobUrl) {
            URL.revokeObjectURL(previewPdfBlobUrl);
            setPreviewPdfBlobUrl(null);
          }
        }} 
        title="Pratinjau Visual Surat Pengantar (PDF)" 
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="bg-slate-100 rounded-2xl p-2 h-[70vh] w-full overflow-hidden border border-slate-200 flex items-center justify-center">
            {previewPdfBlobUrl ? (
              <iframe 
                src={previewPdfBlobUrl} 
                className="w-full h-full rounded-xl border-none"
                title="Pratinjau Dokumen Surat PDF"
              />
            ) : (
              <div className="text-center p-8">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-600">Menyusun dokumen PDF...</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowPdfPreviewModal(false);
                if (previewPdfBlobUrl) {
                  URL.revokeObjectURL(previewPdfBlobUrl);
                  setPreviewPdfBlobUrl(null);
                }
              }}
            >
              Tutup Pratinjau
            </Button>
          </div>
        </div>
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
                    const blockCompare = (a.block || '').localeCompare(b.block || '', undefined, { numeric: true });
                    if (blockCompare !== 0) return blockCompare;
                    return (a.number || '').localeCompare(b.number || '', undefined, { numeric: true });
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
