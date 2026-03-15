import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FileText, AlertTriangle, History, Send, User, MapPin, 
  Calendar, Briefcase, Heart, Flag, Home, Lock, CheckCircle2, Clock, XCircle, Sparkles, Eye, EyeOff,
  Camera, Star, MessageCircle, ExternalLink, Share2, Users, UserPlus, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PdfConfig, LetterRequest, Report, House } from '../../types';
import { generateSuratPengantar, generateReportReceiptPDF } from '../../services/pdfService';
import { addLetterToDb, addReportToDb, addPopulationLogToDb, validateResidentAccess, formatHouseId, deepSanitize, checkWasteRetribution } from '../../services/databaseService';
import { HouseMap } from '../HouseMap';
import { Button } from '../ui/Button';
import { GuestReportForm } from '../GuestReportForm';

interface PublicServicesProps {
  pdfConfig: PdfConfig;
  houses?: House[]; // Optional for map
}

export const PublicServices: React.FC<PublicServicesProps> = ({ pdfConfig, houses = [] }) => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'lapor' ? 'lapor' : 
                     searchParams.get('tab') === 'tamu' ? 'tamu' : 'surat';
  const initialHouseId = searchParams.get('houseId') || '';
  
  const [activeTab, setActiveTab] = useState<'surat' | 'lapor' | 'tamu' | 'mutasi' | 'history'>(initialTab as any);
  
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'lapor' || tab === 'tamu' || tab === 'surat' || tab === 'mutasi' || tab === 'history') {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const [localHistory, setLocalHistory] = useState<any[]>([]);
  const [accessCode, setAccessCode] = useState('');
  const [showPin, setShowPin] = useState(false);
  
  // Form States
  const [reportType, setReportType] = useState<Report['type']>('Fasilitas');
  const [reportDesc, setReportDesc] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reportHouseId, setReportHouseId] = useState(initialHouseId); 
  const [reporterHouseId, setReporterHouseId] = useState(''); 

  // Mutasi States
  const [mutationType, setMutationType] = useState<'Newcomer' | 'MovedOut' | 'Birth' | 'Death'>('Newcomer');
  const [mutationName, setMutationName] = useState('');
  const [mutationPhone, setMutationPhone] = useState('');
  const [mutationDate, setMutationDate] = useState(new Date().toISOString().split('T')[0]);
  const [mutationDesc, setMutationDesc] = useState('');
  const [mutationHouseId, setMutationHouseId] = useState(initialHouseId);
  const [mutationStep, setMutationStep] = useState(1);

  // Mutation Details States
  const [prevAddress, setPrevAddress] = useState('');
  const [moveReason, setMoveReason] = useState('');
  const [familyCount, setFamilyCount] = useState(1);
  const [newAddress, setNewAddress] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [mutationGender, setMutationGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [deathCause, setDeathCause] = useState('');
  const [deathPlace, setDeathPlace] = useState('');
  const [familyMembers, setFamilyMembers] = useState<{name: string, relationship: string, nik?: string}[]>([]);
  const [mutationResidenceType, setMutationResidenceType] = useState<'Tetap' | 'Kontrak' | 'Kost'>('Tetap');
  const [mutationVulnerability, setMutationVulnerability] = useState<string[]>([]);

  const [requestType, setRequestType] = useState<string>('Surat Pengantar');
  const [customRequestType, setCustomRequestType] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [nik, setNik] = useState('');
  const [familyHeadName, setFamilyHeadName] = useState(''); 
  const [birthPlace, setBirthPlace] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [religion, setReligion] = useState('Islam');
  const [job, setJob] = useState('');
  const [maritalStatus, setMaritalStatus] = useState<LetterRequest['maritalStatus']>('Kawin');
  const [nationality, setNationality] = useState('Indonesia'); 
  const [addressKtp, setAddressKtp] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [isSameAddress, setIsSameAddress] = useState(false);
  const [houseId, setHouseId] = useState(initialHouseId);
  const [purposeDetail, setPurposeDetail] = useState(''); 
  
  const dynamicTemplates = pdfConfig.letterTemplates?.reduce((acc, curr) => {
    acc[curr.type] = curr.suggestion;
    return acc;
  }, {} as Record<string, string>) || {
    'Surat Pengantar': 'Surat pengantar umum untuk berbagai keperluan administratif.',
    'Surat Pengantar KTP': 'Persyaratan permohonan pembuatan KTP baru / perpanjangan KTP di Kantor Kelurahan.',
    'Surat Pengantar KK': 'Persyaratan perubahan data Kartu Keluarga / penambahan anggota keluarga baru.',
    'Surat Keterangan Domisili': 'Keterangan domisili untuk keperluan melamar pekerjaan / pembukaan rekening bank.',
    'Surat Keterangan Tidak Mampu': 'Persyaratan pengajuan bantuan sosial / beasiswa pendidikan / keringanan biaya medis.',
    'Surat Izin Keramaian': 'Permohonan izin penyelenggaraan acara [Nama Acara] pada tanggal [Tanggal] di [Locasi].',
    'Surat Keterangan Usaha': 'Persyaratan pengajuan modal usaha / pembuatan NPWP badan usaha.',
    'Surat Keterangan Berkelakuan Baik': 'Persyaratan melamar pekerjaan / pendaftaran institusi pendidikan.',
  };

  const letterRequirements: Record<string, string[]> = {
    'Surat Pengantar': ['Fotokopi KTP', 'Fotokopi KK'],
    'Surat Pengantar KTP': ['Fotokopi Kartu Keluarga (KK)', 'KTP Lama (jika perpanjangan)', 'Pas Foto 3x4 (2 lembar)'],
    'Surat Pengantar KK': ['KK Asli', 'Surat Pindah (jika warga baru)', 'Akta Kelahiran/Nikah (jika tambah anggota)'],
    'Surat Keterangan Domisili': ['Fotokopi KTP', 'Fotokopi KK', 'Surat Keterangan Kerja (jika untuk melamar)'],
    'Surat Keterangan Tidak Mampu': ['Fotokopi KK & KTP', 'Foto Rumah (tampak depan)', 'Surat Pernyataan Bermaterai'],
    'Surat Keterangan Usaha': ['Fotokopi KTP', 'Foto Lokasi Usaha', 'Surat Pernyataan Usaha'],
  };

  const [statusSearchId, setStatusSearchId] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);

  const [reportPhoto, setReportPhoto] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedItem, setSubmittedItem] = useState<any>(null);

  const estimatedTimes: Record<string, string> = {
    'Surat Pengantar': '1x24 Jam',
    'Surat Pengantar KTP': '1x24 Jam',
    'Surat Pengantar KK': '1-2 Hari Kerja',
    'Surat Keterangan Domisili': '1x24 Jam',
    'Surat Keterangan Tidak Mampu': '2-3 Hari Kerja',
    'Surat Izin Keramaian': '1x24 Jam',
    'Surat Keterangan Usaha': '1-2 Hari Kerja',
    'Surat Keterangan Berkelakuan Baik': '1x24 Jam',
    'Lainnya': 'Menunggu Konfirmasi RT'
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReportPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseTemplate = () => {
    const template = dynamicTemplates[requestType];
    if (template) setPurposeDetail(template);
  };
  
  // New Fields State
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [education, setEducation] = useState('SMA/Sederajat');
  const [familyStatus, setFamilyStatus] = useState<LetterRequest['familyStatus']>('Kepala Keluarga');
  const [bloodType, setBloodType] = useState<LetterRequest['bloodType']>('-');

  useEffect(() => { 
    try { 
      const stored = localStorage.getItem('userRequestHistory'); 
      if (stored) setLocalHistory(JSON.parse(stored)); 
    } catch (e) { console.error("Error reading history", e); } 
  }, []);

  useEffect(() => { 
    if(initialHouseId) { 
      if (activeTab === 'lapor') setReportHouseId(initialHouseId); 
      if (activeTab === 'surat') setHouseId(initialHouseId); 
    } 
  }, [initialHouseId, activeTab]);

  const saveToHistory = (item: any) => { 
    try { 
      const updated = [item, ...localHistory]; 
      setLocalHistory(updated); 
      // Use deepSanitize to prevent circular structure errors
      const sanitized = deepSanitize(updated);
      localStorage.setItem('userRequestHistory', JSON.stringify(sanitized)); 
    } catch (e) { console.error("Error saving history", e); } 
  };

  const handleSubmitSurat = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    const isValid = await validateResidentAccess(houseId, accessCode);
    if (!isValid) {
      alert("Verifikasi Gagal! Kode Akses Rumah tidak valid. Silakan hubungi Ketua RT jika lupa kode.");
      return;
    }

    const formattedHouseId = formatHouseId(houseId);
    
    // Check Waste Retribution (Mandatory in Palu City)
    const retribution = await checkWasteRetribution(formattedHouseId);
    if (!retribution.paid) {
      alert(`PENGURUSAN DITANGGUHKAN: Pembayaran Retribusi Sampah untuk bulan ${retribution.month} belum tercatat. Sesuai peraturan Kota Palu, retribusi sampah wajib dilunasi sebelum pengurusan administrasi. Silakan hubungi petugas kebersihan atau Ketua RT.`);
      return;
    }

    const finalRequestType = requestType === 'Lainnya' ? customRequestType : requestType;

    const letterData: LetterRequest = { 
      id: Date.now().toString(), 
      type: finalRequestType, 
      applicantName, 
      nik, 
      familyHeadName, 
      birthPlace, 
      birthDate, 
      gender, 
      religion, 
      job, 
      maritalStatus, 
      nationality, 
      addressKtp, 
      currentAddress: isSameAddress ? addressKtp : currentAddress,
      houseId: formattedHouseId, 
      purposeDetail, 
      phone,
      email,
      education,
      familyStatus,
      bloodType,
      status: 'Pending', 
      date: new Date().toISOString().split('T')[0],
      estimatedTime: estimatedTimes[finalRequestType] || estimatedTimes['Lainnya']
    }; 
    
    await generateSuratPengantar(letterData, pdfConfig, true); 
    await addLetterToDb(letterData); 
    const historyItem = {...letterData, category: 'Surat', title: `Surat ${finalRequestType}`};
    saveToHistory(historyItem); 
    setSubmittedItem(historyItem);
    setShowSuccessModal(true);
    
    // Reset form
    setApplicantName(''); setNik(''); setFamilyHeadName(''); setBirthPlace(''); setBirthDate(''); setJob(''); setAddressKtp(''); setHouseId(''); setPurposeDetail(''); setAccessCode('');
    setNationality('Indonesia'); setMaritalStatus('Kawin'); setPhone(''); setEmail(''); setCustomRequestType('');
  };

  const handleSubmitLapor = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    const isValid = await validateResidentAccess(reporterHouseId, accessCode);
    if (!isValid) {
      alert("Verifikasi Gagal! Kode Akses Rumah tidak valid.");
      return;
    }

    const formattedReporterHouseId = formatHouseId(reporterHouseId);
    const formattedReportHouseId = reportHouseId ? formatHouseId(reportHouseId) : '';

    const reportData: Report = { 
      id: Date.now().toString(), 
      type: reportType, 
      description: reportDesc, 
      reporterName, 
      houseId: formattedReportHouseId, 
      reporterHouseId: formattedReporterHouseId, 
      status: 'Baru', 
      date: new Date().toISOString(),
      photoUrl: reportPhoto || undefined
    };
    
    generateReportReceiptPDF(reportData, pdfConfig);
    await addReportToDb(reportData);
    const historyItem = {...reportData, category: 'Laporan', title: `Laporan ${reportType}`};
    saveToHistory(historyItem);
    setSubmittedItem(historyItem);
    setShowSuccessModal(true);
    
    // Reset form
    setReportDesc(''); setReporterName(''); setReportHouseId(''); setReporterHouseId(''); setAccessCode('');
    setReportPhoto(null);
  };

  const handleSubmitMutasi = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only validate PIN for existing residents (MovedOut, Birth, Death)
    if (mutationType !== 'Newcomer') {
      const isValid = await validateResidentAccess(mutationHouseId, accessCode);
      if (!isValid) {
        alert("Verifikasi Gagal! Kode Akses Rumah tidak valid.");
        return;
      }

      const formattedMutationHouseId = formatHouseId(mutationHouseId);
      
      // Check Waste Retribution (Mandatory in Palu City)
      const retribution = await checkWasteRetribution(formattedMutationHouseId);
      if (!retribution.paid) {
        alert(`PELAPORAN DITANGGUHKAN: Pembayaran Retribusi Sampah untuk bulan ${retribution.month} belum tercatat. Sesuai peraturan Kota Palu, retribusi sampah wajib dilunasi sebelum pengurusan administrasi. Silakan hubungi petugas kebersihan atau Ketua RT.`);
        return;
      }
    }

    const formattedMutationHouseId = formatHouseId(mutationHouseId);

    const mutationData = {
      id: Date.now().toString(),
      type: mutationType,
      name: mutationName,
      phone: mutationPhone,
      date: mutationDate,
      description: mutationDesc,
      houseId: formattedMutationHouseId,
      status: 'Pending',
      details: {
        previousAddress: mutationType === 'Newcomer' ? prevAddress : undefined,
        reasonForMoving: (mutationType === 'Newcomer' || mutationType === 'MovedOut') ? moveReason : undefined,
        familyCount: mutationType === 'Newcomer' ? familyCount : undefined,
        familyMembers: mutationType === 'Newcomer' && familyCount > 1 ? familyMembers : undefined,
        residenceType: mutationType === 'Newcomer' ? mutationResidenceType : undefined,
        vulnerability: mutationType === 'Newcomer' ? mutationVulnerability : undefined,
        newAddress: mutationType === 'MovedOut' ? newAddress : undefined,
        fatherName: mutationType === 'Birth' ? fatherName : undefined,
        motherName: mutationType === 'Birth' ? motherName : undefined,
        gender: mutationType === 'Birth' ? mutationGender : undefined,
        causeOfDeath: mutationType === 'Death' ? deathCause : undefined,
        placeOfDeath: mutationType === 'Death' ? deathPlace : undefined,
      }
    };

    await addPopulationLogToDb(mutationData);

    // In a real app, we would add this to a database
    saveToHistory({
      ...mutationData, 
      category: 'Mutasi', 
      title: `${mutationType === 'Newcomer' ? 'Warga Baru' : mutationType === 'MovedOut' ? 'Warga Pindah' : mutationType === 'Birth' ? 'Kelahiran' : 'Kematian'}: ${mutationName}`
    });
    
    setSubmittedItem({
      ...mutationData,
      category: 'Mutasi',
      title: `Laporan Mutasi: ${mutationName}`
    });
    setShowSuccessModal(true);

    // Reset form
    setMutationStep(1);
    setMutationName('');
    setMutationPhone('');
    setMutationDesc('');
    setAccessCode('');
    setPrevAddress('');
    setMoveReason('');
    setFamilyCount(1);
    setNewAddress('');
    setFatherName('');
    setMotherName('');
    setDeathCause('');
    setDeathPlace('');
    setFamilyMembers([]);
    setMutationVulnerability([]);
    setMutationResidenceType('Tetap');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto px-4 py-8 mb-24 font-sans"
    >
      {/* Header Section */}
      <div className="relative mb-20 pt-10">
        {/* Atmospheric Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[10%] w-[40%] h-[60%] bg-indigo-200/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[10%] w-[30%] h-[50%] bg-violet-200/20 blur-[100px] rounded-full" />
        </div>

        <div className="text-center max-w-4xl mx-auto">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-indigo-100 rounded-full shadow-sm mb-8"
          >
            <Sparkles size={16} className="text-indigo-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Layanan Digital Terpadu</span>
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-8 leading-[0.95]"
          >
            Solusi Administrasi <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] animate-gradient-x">
              Warga Lebih Cerdas.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-500 font-medium text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12"
          >
            Urus surat pengantar, lapor kejadian, hingga mutasi warga kini lebih mudah, cepat, dan transparan langsung dari genggaman Anda.
          </motion.p>

          {/* Quick Stats / Info */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {[
              { label: 'Proses Cepat', icon: Clock, desc: '1x24 Jam' },
              { label: 'Transparan', icon: Eye, desc: 'Pantau Status' },
              { label: 'Paperless', icon: FileText, desc: 'Digital PDF' },
              { label: 'Terintegrasi', icon: CheckCircle2, desc: 'Data Akurat' }
            ].map((item, i) => (
              <div key={i} className="p-4 bg-white/50 backdrop-blur-sm border border-slate-100 rounded-3xl text-left hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
                <item.icon size={20} className="text-indigo-600 mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">{item.label}</p>
                <p className="text-sm font-bold text-slate-700">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Modern Tabs Navigation */}
      <div className="sticky top-4 z-50 flex justify-center mb-16 px-4">
        <div className="bg-white/80 backdrop-blur-xl p-1.5 rounded-[2rem] inline-flex shadow-2xl shadow-indigo-500/10 border border-white/50 overflow-x-auto no-scrollbar max-w-full">
          {[
            { id: 'surat', label: 'Layanan Surat', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { id: 'tamu', label: 'Lapor Tamu', icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
            { id: 'lapor', label: 'Lapor Warga', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
            { id: 'mutasi', label: 'Mutasi Warga', icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { id: 'history', label: 'Cek Status', icon: History, color: 'text-amber-600', bg: 'bg-amber-50' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                relative flex items-center gap-2 px-4 md:px-6 py-3 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-500
                ${activeTab === tab.id 
                  ? `${tab.bg} ${tab.color} shadow-sm` 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'}
              `}
            >
              <tab.icon size={16} strokeWidth={2.5} className={`${activeTab === tab.id ? 'scale-110' : 'scale-100'} transition-transform`} />
              <span className="hidden sm:inline">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 border-2 border-current opacity-10 rounded-2xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'tamu' && (
          <motion.div
            key="tamu"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-2xl mx-auto"
          >
            <GuestReportForm onClose={() => setActiveTab('surat')} houses={houses} />
          </motion.div>
        )}

        {activeTab === 'surat' && (
          <motion.div 
            key="surat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 md:p-16 rounded-[4rem] border border-slate-100 shadow-2xl shadow-indigo-100/30"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 pb-12 border-b border-slate-100">
              <div className="flex items-center gap-6">
                <div className="p-5 bg-indigo-600 text-white rounded-[2rem] shadow-lg shadow-indigo-200">
                  <FileText size={40} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900">Permohonan Surat</h2>
                  <p className="text-slate-500 font-medium mt-1">Lengkapi data untuk mendapatkan surat pengantar resmi.</p>
                </div>
              </div>
            </div>

            {/* Palu City Regulation Notice */}
            <div className="mb-12 p-6 bg-amber-50 border border-amber-100 rounded-[2rem] flex items-start gap-4 shadow-sm">
              <div className="p-3 bg-white text-amber-600 rounded-2xl shadow-sm">
                <ShieldAlert size={24} />
              </div>
              <div>
                <p className="text-xs font-black text-amber-900 uppercase tracking-widest">Aturan Pemerintah Kota Palu</p>
                <p className="text-sm font-medium text-amber-700 mt-1 leading-relaxed">
                  Sesuai peraturan daerah, pembayaran <b>Retribusi Sampah</b> wajib dilunasi untuk setiap pengurusan administrasi kependudukan. Sistem akan mengecek status pembayaran bulan berjalan secara otomatis saat Anda mengirim pengajuan.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitSurat} className="space-y-16">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                {/* Left Column: Personal Info (Wider) */}
                <div className="lg:col-span-7 space-y-12">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-sm font-black shadow-lg shadow-slate-200">01</div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Identitas Diri</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Informasi sesuai KTP & KK</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Lengkap Sesuai KTP</label>
                      <div className="relative">
                        <input 
                          className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300" 
                          value={applicantName} 
                          onChange={e=>setApplicantName(e.target.value)} 
                          required 
                          placeholder="Contoh: Ahmad Subarjo"
                        />
                        <User className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">NIK (16 Digit)</label>
                      <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" value={nik} onChange={e=>setNik(e.target.value)} required placeholder="320..."/>
                    </div>
                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Kepala Keluarga</label>
                      <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" value={familyHeadName} onChange={e=>setFamilyHeadName(e.target.value)} required placeholder="Nama di KK"/>
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tempat Lahir</label>
                      <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" value={birthPlace} onChange={e=>setBirthPlace(e.target.value)} required/>
                    </div>
                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tanggal Lahir</label>
                      <input type="date" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" value={birthDate} onChange={e=>setBirthDate(e.target.value)} required/>
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Jenis Kelamin</label>
                      <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none" value={gender} onChange={e=>setGender(e.target.value as any)}>
                        <option>Laki-laki</option>
                        <option>Perempuan</option>
                      </select>
                    </div>
                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Agama</label>
                      <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none" value={religion} onChange={e=>setReligion(e.target.value)}>
                        <option>Islam</option><option>Kristen</option><option>Katolik</option><option>Hindu</option><option>Buddha</option><option>Konghucu</option>
                      </select>
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Status Kawin</label>
                      <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none" value={maritalStatus} onChange={e=>setMaritalStatus(e.target.value as any)}>
                        <option>Belum Kawin</option><option>Kawin</option><option>Cerai Hidup</option><option>Cerai Mati</option>
                      </select>
                    </div>
                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Kewarganegaraan</label>
                      <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" value={nationality} onChange={e=>setNationality(e.target.value)} required placeholder="WNI"/>
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Pekerjaan</label>
                      <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" value={job} onChange={e=>setJob(e.target.value)} required/>
                    </div>
                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Golongan Darah</label>
                      <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none" value={bloodType} onChange={e=>setBloodType(e.target.value as any)}>
                        <option>-</option><option>A</option><option>B</option><option>AB</option><option>O</option>
                      </select>
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Pendidikan Terakhir</label>
                      <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none" value={education} onChange={e=>setEducation(e.target.value)}>
                        <option>SD/Sederajat</option><option>SMP/Sederajat</option><option>SMA/Sederajat</option><option>D3</option><option>S1</option><option>S2</option><option>S3</option><option>Tidak Sekolah</option>
                      </select>
                    </div>
                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Hubungan Keluarga</label>
                      <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none" value={familyStatus} onChange={e=>setFamilyStatus(e.target.value as any)}>
                        <option>Kepala Keluarga</option><option>Istri</option><option>Anak</option><option>Lainnya</option>
                      </select>
                    </div>

                    <div className="md:col-span-2 group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Alamat Sesuai KTP</label>
                      <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all resize-none h-24" value={addressKtp} onChange={e=>setAddressKtp(e.target.value)} required placeholder="Alamat lengkap sesuai KTP"/>
                    </div>

                    <div className="md:col-span-2 group">
                      <div className="flex items-center justify-between mb-2 ml-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Alamat Domisili Saat Ini</label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            checked={isSameAddress}
                            onChange={(e) => setIsSameAddress(e.target.checked)}
                          />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sama dengan KTP</span>
                        </label>
                      </div>
                      {!isSameAddress && (
                        <textarea 
                          className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all resize-none h-24" 
                          value={currentAddress} 
                          onChange={e=>setCurrentAddress(e.target.value)} 
                          required={!isSameAddress}
                          placeholder="Alamat tempat tinggal sekarang..."
                        />
                      )}
                      {isSameAddress && (
                        <div className="w-full p-5 bg-slate-100 border border-slate-200 rounded-3xl text-sm font-bold text-slate-400 italic">
                          Alamat domisili sama dengan alamat KTP.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Request & Contact (Narrower) */}
                <div className="lg:col-span-5 space-y-12">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-sm font-black shadow-lg shadow-slate-200">02</div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Kontak & Keperluan</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Detail pengajuan surat</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="group">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">No. HP / WhatsApp</label>
                        <input className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" value={phone} onChange={e=>setPhone(e.target.value)} required placeholder="08..."/>
                      </div>
                      <div className="group">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email (Opsional)</label>
                        <input type="email" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@contoh.com"/>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Jenis Surat</label>
                      <div className="relative">
                        <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none" value={requestType} onChange={e=>setRequestType(e.target.value)}>
                          {Object.keys(dynamicTemplates).map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                          <option value="Lainnya">Lainnya</option>
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <Briefcase size={18} />
                        </div>
                      </div>
                    </div>

                    {letterRequirements[requestType] && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-6 bg-amber-50 border border-amber-100 rounded-3xl"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Flag size={14} className="text-amber-600" />
                          <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Persyaratan Berkas Fisik</h4>
                        </div>
                        <ul className="space-y-2">
                          {letterRequirements[requestType].map((req, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs font-bold text-amber-700/80">
                              <div className="w-1 h-1 bg-amber-400 rounded-full" />
                              {req}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-4 text-[9px] text-amber-600/60 font-medium italic">
                          * Siapkan berkas di atas saat mengambil surat fisik di rumah Ketua RT.
                        </p>
                      </motion.div>
                    )}

                    <div className="group">
                      <div className="flex justify-between items-end mb-2 ml-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tujuan / Keperluan</label>
                        {dynamicTemplates[requestType] && (
                          <button 
                            type="button"
                            onClick={handleUseTemplate}
                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1.5"
                          >
                            <Sparkles size={12} /> Gunakan Saran
                          </button>
                        )}
                      </div>
                      <textarea 
                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all min-h-[120px] resize-none leading-relaxed" 
                        value={purposeDetail} 
                        onChange={e=>setPurposeDetail(e.target.value)} 
                        required 
                        placeholder="Jelaskan secara detail keperluan Anda..."
                      />
                    </div>

                    <div className="p-8 bg-indigo-50/50 border border-indigo-100 rounded-[3rem] space-y-8 mt-10">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200">
                          <Lock size={24} />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-indigo-900 tracking-tight">Verifikasi Warga</h4>
                          <p className="text-xs text-indigo-700/70 font-bold uppercase tracking-widest">Wajib Diisi</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-5">
                        <div className="group">
                          <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 ml-1 text-center">Blok Rumah</label>
                          <input 
                            className="w-full p-5 bg-white border border-indigo-100 rounded-2xl text-base font-black focus:border-indigo-500 outline-none transition-all text-center uppercase shadow-sm" 
                            placeholder="C7-02" 
                            value={houseId} 
                            onChange={e=>setHouseId(e.target.value)} 
                            required
                          />
                        </div>
                        <div className="group">
                          <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 ml-1 text-center">PIN Akses</label>
                          <div className="relative">
                            <input 
                              type={showPin ? "text" : "password"} 
                              placeholder="PIN" 
                              className="w-full p-5 bg-white border border-indigo-100 rounded-2xl text-base font-black focus:border-indigo-500 outline-none transition-all text-center shadow-sm tracking-[0.5em]" 
                              value={accessCode} 
                              onChange={e=>setAccessCode(e.target.value)} 
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPin(!showPin)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-600 transition-colors"
                            >
                              {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3 text-slate-400">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                  <p className="text-xs font-bold">Data Anda aman dan hanya digunakan untuk keperluan administrasi RT.</p>
                </div>
                <Button type="submit" size="lg" className="w-full md:w-auto px-12 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:-translate-y-1.5 transition-all duration-300">
                  <Send size={20} className="mr-2" /> Kirim Permohonan
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === 'lapor' && (
          <motion.div 
            key="lapor"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 md:p-16 rounded-[4rem] border border-slate-100 shadow-2xl shadow-rose-100/30"
          >
            <div className="flex items-center gap-6 mb-12 pb-12 border-b border-slate-100">
              <div className="p-5 bg-rose-600 text-white rounded-[2rem] shadow-lg shadow-rose-200">
                <AlertTriangle size={40} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900">Laporan Warga</h2>
                <p className="text-slate-500 font-medium mt-1">Sampaikan keluhan atau kejadian di lingkungan RT.</p>
              </div>
            </div>

            <form onSubmit={handleSubmitLapor} className="space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div className="space-y-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-black">01</div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Detail Kejadian</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Kategori Laporan</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {['Keamanan', 'Kebersihan', 'Fasilitas', 'Sosial', 'Lainnya'].map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setReportType(type as any)}
                            className={`
                              p-4 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all duration-300
                              ${reportType === type 
                                ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-200' 
                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-rose-300 hover:text-rose-600'}
                            `}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Lokasi Kejadian (Blok)</label>
                      <input 
                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-rose-500 outline-none transition-all uppercase placeholder:normal-case" 
                        value={reportHouseId} 
                        onChange={e=>setReportHouseId(e.target.value)} 
                        placeholder="Cth: C7-02"
                      />
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Deskripsi Laporan</label>
                      <textarea 
                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-rose-500 outline-none transition-all min-h-[180px] resize-none leading-relaxed" 
                        value={reportDesc} 
                        onChange={e=>setReportDesc(e.target.value)} 
                        required 
                        placeholder="Ceritakan kejadian secara lengkap..."
                      />
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Foto Bukti (Opsional)</label>
                      <div className="relative">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handlePhotoChange}
                          className="hidden" 
                          id="report-photo"
                        />
                        <label 
                          htmlFor="report-photo"
                          className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 hover:bg-slate-100 hover:border-rose-300 transition-all cursor-pointer group"
                        >
                          {reportPhoto ? (
                            <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
                              <img src={reportPhoto} alt="Preview" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white" size={32} />
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-400 mb-3 group-hover:text-rose-500 transition-colors">
                                <Camera size={32} />
                              </div>
                              <p className="text-sm font-bold text-slate-500">Klik untuk unggah foto</p>
                              <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-widest">Format: JPG, PNG (Maks 5MB)</p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-black">02</div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Identitas Pelapor</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Lengkap Anda</label>
                      <input 
                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-rose-500 outline-none transition-all" 
                        value={reporterName} 
                        onChange={e=>setReporterName(e.target.value)} 
                        required 
                        placeholder="Nama sesuai KTP"
                      />
                    </div>

                    <div className="p-8 bg-rose-50/50 border border-rose-100 rounded-[2.5rem] space-y-6 mt-10">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-md">
                          <Lock size={20} />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-rose-900">Verifikasi Pelapor</h4>
                          <p className="text-xs text-rose-700/70 font-medium">Laporan anonim tidak akan diproses.</p>
                        </div>
                      </div>
                      
                      <div className="space-y-5">
                        <div className="group">
                          <label className="block text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2 ml-1">Blok Rumah Anda</label>
                          <input 
                            className="w-full p-5 bg-white border border-rose-100 rounded-2xl text-sm font-black focus:border-rose-500 outline-none transition-all text-center uppercase shadow-sm" 
                            placeholder="C7-02" 
                            value={reporterHouseId} 
                            onChange={e=>setReporterHouseId(e.target.value)} 
                            required
                          />
                        </div>
                        <div className="group">
                          <label className="block text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2 ml-1">PIN Akses</label>
                          <div className="relative">
                            <input 
                              type={showPin ? "text" : "password"} 
                              placeholder="PIN" 
                              className="w-full p-5 bg-white border border-rose-100 rounded-2xl text-sm font-black focus:border-rose-500 outline-none transition-all text-center shadow-sm" 
                              value={accessCode} 
                              onChange={e=>setAccessCode(e.target.value)} 
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPin(!showPin)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-400 hover:text-rose-600 transition-colors"
                            >
                              {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-12 border-t border-slate-100 flex justify-end">
                <Button type="submit" variant="danger" size="lg" className="w-full md:w-auto px-12 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-2xl shadow-rose-500/40 hover:shadow-rose-500/60 hover:-translate-y-1.5 transition-all duration-300">
                  <Send size={20} className="mr-2" /> Kirim Laporan Resmi
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === 'mutasi' && (
          <motion.div 
            key="mutasi"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 md:p-16 rounded-[4rem] border border-slate-100 shadow-2xl shadow-emerald-100/30"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 pb-12 border-b border-slate-100">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-200">
                  <UserPlus size={40} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900">Mutasi Warga</h2>
                  <p className="text-slate-500 font-medium mt-1">Laporkan warga baru, pindah, kelahiran, atau kematian.</p>
                </div>
              </div>

              <div className="flex gap-2">
                {[1, 2, 3].map(s => (
                  <div 
                    key={s} 
                    className={`w-12 h-2 rounded-full transition-all duration-500 ${mutationStep >= s ? 'bg-emerald-600' : 'bg-slate-200'}`}
                  />
                ))}
              </div>
            </div>

            {/* Palu City Regulation Notice */}
            <div className="mb-12 p-6 bg-amber-50 border border-amber-100 rounded-[2rem] flex items-start gap-4 shadow-sm">
              <div className="p-3 bg-white text-amber-600 rounded-2xl shadow-sm">
                <ShieldAlert size={24} />
              </div>
              <div>
                <p className="text-xs font-black text-amber-900 uppercase tracking-widest">Aturan Pemerintah Kota Palu</p>
                <p className="text-sm font-medium text-amber-700 mt-1 leading-relaxed">
                  Sesuai peraturan daerah, pembayaran <b>Retribusi Sampah</b> wajib dilunasi untuk setiap pengurusan administrasi kependudukan. Sistem akan mengecek status pembayaran bulan berjalan secara otomatis saat Anda mengirim laporan.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitMutasi} className="space-y-10">
              {mutationStep === 1 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-lg font-black shadow-lg shadow-slate-200">01</div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Pilih Jenis Mutasi</h3>
                      <p className="text-xs text-slate-400 font-bold">Apa kejadian yang ingin Anda laporkan?</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      { id: 'Newcomer', label: 'Warga Masuk', icon: UserPlus, desc: 'Pindah masuk ke RT 02' },
                      { id: 'MovedOut', label: 'Warga Pindah', icon: Share2, desc: 'Pindah keluar dari RT 02' },
                      { id: 'Birth', label: 'Kelahiran', icon: Heart, desc: 'Anggota keluarga baru lahir' },
                      { id: 'Death', label: 'Kematian', icon: Flag, desc: 'Laporan warga meninggal dunia' }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setMutationType(type.id as any);
                          setMutationStep(2);
                        }}
                        className={`
                          p-8 rounded-[2.5rem] flex flex-col items-start gap-4 border-2 transition-all duration-500 group text-left
                          ${mutationType === type.id 
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xl shadow-emerald-200 scale-[1.02]' 
                            : 'bg-white text-slate-500 border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/30'}
                        `}
                      >
                        <div className={`p-4 rounded-2xl transition-colors ${mutationType === type.id ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}>
                          <type.icon size={28} />
                        </div>
                        <div>
                          <span className="text-sm font-black uppercase tracking-widest block">{type.label}</span>
                          <p className={`text-[10px] font-bold mt-1 ${mutationType === type.id ? 'text-white/70' : 'text-slate-400'}`}>{type.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {mutationStep === 2 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-lg font-black shadow-lg shadow-slate-200">02</div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Informasi Dasar</h3>
                      <p className="text-xs text-slate-400 font-bold">Identitas warga yang bersangkutan</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Warga Terkait</label>
                      <input 
                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all" 
                        value={mutationName} 
                        onChange={e=>setMutationName(e.target.value)} 
                        required 
                        placeholder="Nama lengkap warga"
                      />
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">No. HP / WhatsApp</label>
                      <input 
                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all" 
                        value={mutationPhone} 
                        onChange={e=>setMutationPhone(e.target.value)} 
                        required 
                        placeholder="08..."
                      />
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tanggal Kejadian</label>
                      <input 
                        type="date"
                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all" 
                        value={mutationDate} 
                        onChange={e=>setMutationDate(e.target.value)} 
                        required 
                      />
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Blok & No. Rumah</label>
                      <input 
                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all" 
                        value={mutationHouseId} 
                        onChange={e=>setMutationHouseId(e.target.value.toUpperCase())} 
                        required 
                        placeholder="Cth: C7-02"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setMutationStep(1)}
                      className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Kembali
                    </button>
                    <button 
                      type="button"
                      onClick={() => setMutationStep(3)}
                      className="flex-1 py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                    >
                      Lanjut ke Detail
                    </button>
                  </div>
                </motion.div>
              )}

              {mutationStep === 3 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-lg font-black shadow-lg shadow-slate-200">03</div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Detail Khusus</h3>
                      <p className="text-xs text-slate-400 font-bold">Lengkapi informasi spesifik mutasi</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Dynamic Fields based on Mutation Type */}
                    {mutationType === 'Newcomer' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="group">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Alamat Asal</label>
                          <input 
                            className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all" 
                            value={prevAddress} 
                            onChange={e=>setPrevAddress(e.target.value)} 
                            required 
                            placeholder="Alamat lengkap sebelumnya"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Alasan Pindah</label>
                            <input 
                              className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all" 
                              value={moveReason} 
                              onChange={e=>setMoveReason(e.target.value)} 
                              required 
                              placeholder="Cth: Pekerjaan"
                            />
                          </div>
                          <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Jumlah Anggota Keluarga</label>
                            <input 
                              type="number"
                              className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all" 
                              value={familyCount} 
                              onChange={e=>{
                                const count = parseInt(e.target.value) || 1;
                                setFamilyCount(count);
                                if (count > 1) {
                                  const newMembers = Array(count - 1).fill(null).map((_, i) => familyMembers[i] || { name: '', relationship: '', nik: '' });
                                  setFamilyMembers(newMembers);
                                } else {
                                  setFamilyMembers([]);
                                }
                              }} 
                              required 
                              min="1"
                            />
                          </div>
                        </div>

                        {familyCount > 1 && (
                          <div className="space-y-4 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Biodata Anggota Keluarga Lainnya</h4>
                            <div className="grid grid-cols-1 gap-4">
                              {familyMembers.map((member, idx) => (
                                <div key={idx} className="space-y-4 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                  <p className="text-[10px] font-bold text-emerald-600 uppercase">Anggota #{idx + 2}</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input 
                                      placeholder="Nama Lengkap"
                                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-emerald-500"
                                      value={member.name}
                                      onChange={e => {
                                        const updated = [...familyMembers];
                                        updated[idx].name = e.target.value;
                                        setFamilyMembers(updated);
                                      }}
                                      required
                                    />
                                    <input 
                                      placeholder="Hubungan (Istri/Anak/dll)"
                                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-emerald-500"
                                      value={member.relationship}
                                      onChange={e => {
                                        const updated = [...familyMembers];
                                        updated[idx].relationship = e.target.value;
                                        setFamilyMembers(updated);
                                      }}
                                      required
                                    />
                                    <input 
                                      placeholder="NIK (Opsional)"
                                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-emerald-500 md:col-span-2"
                                      value={member.nik}
                                      onChange={e => {
                                        const updated = [...familyMembers];
                                        updated[idx].nik = e.target.value;
                                        setFamilyMembers(updated);
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Status Hunian</label>
                            <div className="flex gap-2">
                              {['Tetap', 'Kontrak', 'Kost'].map((type) => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => setMutationResidenceType(type as any)}
                                  className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${mutationResidenceType === type ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Kerentanan (Jika Ada)</label>
                            <div className="flex flex-wrap gap-2">
                              {['Ibu Hamil', 'Bayi', 'Balita', 'Lansia', 'Disabilitas', 'Janda/Duda'].map((v) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => {
                                    if (mutationVulnerability.includes(v)) {
                                      setMutationVulnerability(mutationVulnerability.filter(item => item !== v));
                                    } else {
                                      setMutationVulnerability([...mutationVulnerability, v]);
                                    }
                                  }}
                                  className={`px-4 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-wider border transition-all ${mutationVulnerability.includes(v) ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {mutationType === 'MovedOut' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="group">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Alamat Tujuan</label>
                          <input 
                            className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all" 
                            value={newAddress} 
                            onChange={e=>setNewAddress(e.target.value)} 
                            required 
                            placeholder="Alamat lengkap tujuan"
                          />
                        </div>
                        <div className="group">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Alasan Pindah</label>
                          <input 
                            className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all" 
                            value={moveReason} 
                            onChange={e=>setMoveReason(e.target.value)} 
                            required 
                            placeholder="Cth: Ikut Orang Tua"
                          />
                        </div>
                      </div>
                    )}

                    {mutationType === 'Birth' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Ayah</label>
                            <input 
                              className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all" 
                              value={fatherName} 
                              onChange={e=>setFatherName(e.target.value)} 
                              required 
                              placeholder="Nama Ayah"
                            />
                          </div>
                          <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Ibu</label>
                            <input 
                              className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all" 
                              value={motherName} 
                              onChange={e=>setMotherName(e.target.value)} 
                              required 
                              placeholder="Nama Ibu"
                            />
                          </div>
                        </div>
                        <div className="group">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Jenis Kelamin</label>
                          <div className="flex gap-4">
                            {['Laki-laki', 'Perempuan'].map((g) => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => setMutationGender(g as any)}
                                className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${mutationGender === g ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {mutationType === 'Death' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Penyebab Kematian</label>
                            <input 
                              className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all" 
                              value={deathCause} 
                              onChange={e=>setDeathCause(e.target.value)} 
                              required 
                              placeholder="Cth: Sakit, Usia Lanjut, dsb."
                            />
                          </div>
                          <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tempat Kematian</label>
                            <input 
                              className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all" 
                              value={deathPlace} 
                              onChange={e=>setDeathPlace(e.target.value)} 
                              required 
                              placeholder="Cth: RSUD Undata, Rumah, dsb."
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                        {mutationType === 'Newcomer' ? 'Catatan Kedatangan' : 
                         mutationType === 'MovedOut' ? 'Catatan Kepindahan' : 
                         mutationType === 'Birth' ? 'Catatan Kelahiran' : 
                         'Catatan Kematian'}
                      </label>
                      <textarea 
                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all min-h-[120px] resize-none" 
                        value={mutationDesc} 
                        onChange={e=>setMutationDesc(e.target.value)} 
                        placeholder={
                          mutationType === 'Newcomer' ? 'Cth: Pindah karena tugas kerja, membawa kendaraan pribadi...' : 
                          mutationType === 'MovedOut' ? 'Cth: Pindah ke luar kota, rumah akan dikosongkan...' : 
                          mutationType === 'Birth' ? 'Cth: Lahir normal di RS, kondisi sehat...' : 
                          'Cth: Meninggal karena sakit di rumah sakit...'
                        }
                      />
                    </div>

                    <div className="p-8 bg-emerald-50/50 border border-emerald-100 rounded-[2.5rem] space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md">
                          {mutationType === 'Newcomer' ? <Users size={20} /> : <Lock size={20} />}
                        </div>
                        <div>
                          <h4 className="text-base font-black text-emerald-900">
                            {mutationType === 'Newcomer' ? 'Verifikasi Warga Baru' : 'Verifikasi Pelapor'}
                          </h4>
                          <p className="text-xs text-emerald-700/70 font-medium">
                            {mutationType === 'Newcomer' 
                              ? 'Laporan akan diverifikasi manual oleh RT.' 
                              : 'Gunakan PIN rumah Anda untuk melapor.'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="group">
                        <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 ml-1">
                          {mutationType === 'Newcomer' ? 'PIN (Opsional)' : 'PIN Akses'}
                        </label>
                        <div className="relative">
                          <input 
                            type={showPin ? "text" : "password"} 
                            placeholder={mutationType === 'Newcomer' ? 'Kosongkan' : 'Masukkan PIN Rumah'} 
                            className={`w-full p-5 bg-white border border-emerald-100 rounded-2xl text-sm font-black focus:border-emerald-500 outline-none transition-all text-center shadow-sm ${mutationType === 'Newcomer' ? 'opacity-50' : ''}`} 
                            value={accessCode} 
                            onChange={e=>setAccessCode(e.target.value)} 
                            required={mutationType !== 'Newcomer'}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-600 transition-colors"
                          >
                            {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 pt-8 border-t border-slate-100">
                    <button 
                      type="button"
                      onClick={() => setMutationStep(2)}
                      className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Kembali
                    </button>
                    <Button 
                      type="submit" 
                      className="flex-[2] py-5 rounded-3xl text-sm font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 hover:-translate-y-1 transition-all duration-300 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Send size={18} className="mr-2" /> Kirim Laporan Mutasi
                    </Button>
                  </div>
                </motion.div>
              )}
            </form>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-12"
          >
            {/* Status Tracker Search */}
            <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/30">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Cek Status Surat</h3>
                  <p className="text-sm text-slate-500 font-medium">Masukkan ID Surat untuk melacak proses verifikasi.</p>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <input 
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black focus:bg-white focus:border-indigo-500 outline-none transition-all pl-14"
                    placeholder="Contoh: 1710283948..."
                    value={statusSearchId}
                    onChange={e => setStatusSearchId(e.target.value)}
                  />
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                </div>
                <Button 
                  onClick={() => {
                    const found = localHistory.find(h => h.id === statusSearchId);
                    setSearchResult(found || 'not_found');
                  }}
                  className="px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest"
                >
                  Lacak Sekarang
                </Button>
              </div>

              {searchResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 pt-8 border-t border-slate-50"
                >
                  {searchResult === 'not_found' ? (
                    <div className="flex items-center gap-3 text-rose-600 bg-rose-50 p-4 rounded-2xl border border-rose-100">
                      <XCircle size={20} />
                      <p className="text-sm font-bold">ID Surat tidak ditemukan. Pastikan ID yang Anda masukkan benar.</p>
                    </div>
                  ) : (
                    <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                          <CheckCircle2 size={24} />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-indigo-900">{searchResult.title}</h4>
                          <p className="text-xs text-indigo-700 font-bold uppercase tracking-widest">Status: {searchResult.status || 'Menunggu Verifikasi'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Terakhir Diperbarui</p>
                        <p className="text-sm font-bold text-indigo-900">{new Date(searchResult.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-start gap-4">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                <History size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-amber-900">Riwayat Aktivitas Lokal</h4>
                <p className="text-xs text-amber-700/80 mt-1 font-medium">Data ini disimpan di perangkat Anda untuk memudahkan pengecekan status permohonan terakhir.</p>
              </div>
            </div>

            {localHistory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {localHistory.map((item, idx) => (
                  <motion.div 
                    key={idx} 
                    whileHover={{ y: -5 }}
                    className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/30 hover:shadow-indigo-100 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-50 transition-colors duration-500" />
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div className={`p-4 rounded-2xl shadow-sm ${item.category === 'Surat' ? 'bg-indigo-600 text-white' : 'bg-rose-600 text-white'}`}>
                          {item.category === 'Surat' ? <FileText size={24}/> : <AlertTriangle size={24}/>}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            item.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                            item.status === 'Rejected' ? 'bg-rose-100 text-rose-600' :
                            'bg-amber-100 text-amber-600'
                          }`}>
                            {item.status || 'Terkirim'}
                          </span>
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">#{item.id.slice(-6)}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                      <div className="flex items-center gap-2 text-slate-400 mb-6">
                        <Calendar size={14} />
                        <p className="text-xs font-bold">{new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>

                      <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status: {item.status || 'Menunggu'}</span>
                        </div>
                        <button className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                          <Eye size={18} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-inner">
                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto mb-8 shadow-sm">
                  <History size={48} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-3">Belum Ada Riwayat</h3>
                <p className="text-slate-400 font-medium max-w-xs mx-auto">Aktivitas pengajuan surat atau laporan Anda akan tercatat secara otomatis di sini.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && submittedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-2xl"
            >
              <div className={`p-10 text-center ${submittedItem.category === 'Surat' ? 'bg-indigo-600' : 'bg-rose-600'} text-white relative`}>
                <button 
                  onClick={() => setShowSuccessModal(false)}
                  className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <XCircle size={24} />
                </button>
                <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-black mb-2 tracking-tight">Berhasil Terkirim!</h2>
                <p className="text-white/80 font-medium">Data Anda telah masuk ke sistem administrasi RT.</p>
              </div>

              <div className="p-10 space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Pengajuan</span>
                    <span className="text-sm font-black text-slate-900">#{submittedItem.id.slice(-8)}</span>
                  </div>
                  {submittedItem.category === 'Surat' && (
                    <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-indigo-600" />
                        <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Estimasi Selesai</span>
                      </div>
                      <span className="text-sm font-black text-indigo-600">{submittedItem.estimatedTime}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">Tindakan Selanjutnya</p>
                  <div className="grid grid-cols-1 gap-3">
                    <a 
                      href={`https://wa.me/${pdfConfig.rtChairman.replace(/[^0-9]/g, '')}?text=Halo%20Pak%20RT,%20saya%20telah%20mengajukan%20${submittedItem.title}%20dengan%20ID%20${submittedItem.id.slice(-8)}.%20Mohon%20bantuannya%20untuk%20verifikasi.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 w-full p-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
                    >
                      <MessageCircle size={18} /> Hubungi Ketua RT (WA)
                    </a>
                    <Button 
                      variant="outline"
                      onClick={() => setShowSuccessModal(false)}
                      className="w-full p-5 rounded-2xl font-black uppercase tracking-widest text-xs"
                    >
                      Tutup & Kembali
                    </Button>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Berikan Rating Layanan</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} className="p-2 text-slate-200 hover:text-amber-400 transition-colors">
                        <Star size={24} fill="currentColor" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
