import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FileText, AlertTriangle, History, Send, User, MapPin, 
  Calendar, Briefcase, Heart, Flag, Home, Lock, CheckCircle2, Clock, XCircle, Sparkles, Eye, EyeOff,
  Camera, Star, MessageCircle, ExternalLink, Share2, Users, UserPlus, ShieldAlert, Info, ArrowRight, Phone,
  ChevronDown, ShieldCheck, Shield, Trash2, Wrench, Building, Download, Search, RefreshCw, Check, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { PdfConfig, LetterRequest, Report, House } from '../../types';
import { generateSuratPengantar, generateReportReceiptPDF } from '../../services/pdfService';
import { addLetterToDb, addReportToDb, addPopulationLogToDb, validateResidentAccess, formatHouseId, deepSanitize, safeJsonStringify, checkWasteRetribution, handleFirestoreError, OperationType, getLetterById, getReportById, getGuestReportById, getPopulationLogById, getRequestsByPhoneOrHouse } from '../../services/databaseService';
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
  const [localHistory, setLocalHistory] = useState<any[]>([]);
  const [statusSearchId, setStatusSearchId] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [accessCode, setAccessCode] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'Surat' | 'Laporan' | 'Tamu' | 'Mutasi'>('all');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [isSearchingDb, setIsSearchingDb] = useState(false);
  const [searchMode, setSearchMode] = useState<'id' | 'phone_house'>('id');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchHouseId, setSearchHouseId] = useState('');
  const [phoneSearchResults, setPhoneSearchResults] = useState<any[] | null>(null);

  const handleSearchByPhoneOrHouse = async () => {
    if (!searchPhone.trim() && !searchHouseId.trim()) {
      toast.error('Masukkan Nomor WhatsApp atau Nomor Rumah.');
      return;
    }
    setIsSearchingDb(true);
    setPhoneSearchResults(null);
    setSearchResult(null);
    const toastId = toast.loading('Mencari berkas layanan Anda dari sistem...');

    try {
      const results = await getRequestsByPhoneOrHouse(searchPhone, searchHouseId);
      setPhoneSearchResults(results);
      toast.dismiss(toastId);
      if (results.length > 0) {
        toast.success(`Berhasil! Ditemukan ${results.length} berkas layanan.`);
      } else {
        toast.error('Tidak ada berkas yang cocok dengan nomor WA atau Rumah tersebut.', {
          description: 'Coba isi salah satu atau periksa kembali isian Anda.'
        });
      }
    } catch (error) {
      console.error("Error searching by phone or house:", error);
      toast.dismiss(toastId);
      toast.error('Gagal memuat berkas. Coba lagi dalam beberapa saat.');
    } finally {
      setIsSearchingDb(false);
    }
  };
  
  const syncLocalHistoryWithDb = async (currentHistoryList?: any[]) => {
    const listToCheck = currentHistoryList || localHistory;
    if (!listToCheck || listToCheck.length === 0) return;
    try {
      const updatedHistory = [...listToCheck];
      let changed = false;
      
      await Promise.all(listToCheck.map(async (item) => {
        try {
          let exists = false;
          if (item.category === 'Surat') {
            const res = await getLetterById(item.id);
            if (res) exists = true;
          } else if (item.category === 'Laporan') {
            const res = await getReportById(item.id);
            if (res) exists = true;
          } else if (item.category === 'Tamu') {
            const res = await getGuestReportById(item.id);
            if (res) exists = true;
          } else if (item.category === 'Mutasi') {
            const res = await getPopulationLogById(item.id);
            if (res) exists = true;
          }
          
          if (!exists) {
            const index = updatedHistory.findIndex(h => h.id === item.id);
            if (index !== -1) {
              updatedHistory.splice(index, 1);
              changed = true;
            }
          }
        } catch (e) {
          // Keep it on network/transient error, do not prune.
        }
      }));

      if (changed) {
        setLocalHistory(updatedHistory);
        localStorage.setItem('userRequestHistory', safeJsonStringify(deepSanitize(updatedHistory)));
        toast.info('Riwayat Diperbarui', {
          description: 'Beberapa berkas yang telah dihapus oleh Admin disinkronkan dan dihapus dari perangkat Anda.'
        });
      }
    } catch (err) {
      console.error("Error during history sync:", err);
    }
  };

  const handleSearchById = async (id: string) => {
    if (!id || !id.trim()) {
      toast.error('Masukkan ID Lacak terlebih dahulu.');
      return;
    }
    const cleanId = id.trim();
    setIsSearchingDb(true);
    setSearchResult(null);
    const toastId = toast.loading('Mencari data layanan dari sistem...');

    try {
      // 1. Check if category is known from local history
      const foundLocal = localHistory.find(h => h.id === cleanId);
      let foundCategory = foundLocal?.category;
      
      let fetchedData: any = null;
      
      // If found local category, prioritize checking that collection first
      if (foundCategory === 'Surat') {
        fetchedData = await getLetterById(cleanId);
        if (fetchedData) fetchedData.category = 'Surat';
      } else if (foundCategory === 'Laporan') {
        fetchedData = await getReportById(cleanId);
        if (fetchedData) fetchedData.category = 'Laporan';
      } else if (foundCategory === 'Tamu') {
        fetchedData = await getGuestReportById(cleanId);
        if (fetchedData) fetchedData.category = 'Tamu';
      } else if (foundCategory === 'Mutasi') {
        fetchedData = await getPopulationLogById(cleanId);
        if (fetchedData) fetchedData.category = 'Mutasi';
      }

      // 2. If not found, run comprehensive parallel check across all collections
      if (!fetchedData) {
        const [letterRes, reportRes, guestRes, mutationRes] = await Promise.all([
          getLetterById(cleanId).catch(() => null),
          getReportById(cleanId).catch(() => null),
          getGuestReportById(cleanId).catch(() => null),
          getPopulationLogById(cleanId).catch(() => null)
        ]);
        
        if (letterRes) {
          fetchedData = { ...letterRes, category: 'Surat' };
        } else if (reportRes) {
          fetchedData = { ...reportRes, category: 'Laporan' };
        } else if (guestRes) {
          fetchedData = { ...guestRes, category: 'Tamu' };
        } else if (mutationRes) {
          fetchedData = { ...mutationRes, category: 'Mutasi' };
        }
      }

      if (fetchedData) {
        setSearchResult(fetchedData);
        toast.dismiss(toastId);
        toast.success('Lacak Data Berhasil!', {
          description: `Ditemukan data kategori: ${fetchedData.category || 'Layanan'}.`
        });
      } else if (foundLocal) {
        // It was found locally, but NOT on the server database. This means it has been deleted by the admin!
        const updatedHistory = localHistory.filter(h => h.id !== cleanId);
        setLocalHistory(updatedHistory);
        localStorage.setItem('userRequestHistory', safeJsonStringify(deepSanitize(updatedHistory)));
        setSearchResult('not_found');
        toast.dismiss(toastId);
        toast.error('Berkas Telah Dihapus', {
          description: 'Aduan/Surat ini tidak lagi terdaftar di server database rukun tetangga (telah dihapus oleh admin). Riwayat pelacakan lokal berhasil dibersihkan.'
        });
      } else {
        setSearchResult('not_found');
        toast.dismiss(toastId);
        toast.error('Lacak Gagal', {
          description: 'ID tidak terdaftar di server database RT 02.'
        });
      }
    } catch (error) {
      console.error("Error searching letter/report status:", error);
      toast.dismiss(toastId);
      const foundLocal = localHistory.find(h => h.id === cleanId);
      if (foundLocal) {
        setSearchResult(foundLocal);
        toast.info('Menampilkan Riwayat Lokal', {
          description: 'Koneksi database terganggu. Menggunakan arsip lokal.'
        });
      } else {
        setSearchResult('not_found');
        toast.error('Koneksi bermasalah dengan server database.');
      }
    } finally {
      setIsSearchingDb(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      let currentHistory = localHistory;
      if (currentHistory.length === 0) {
        try {
          const stored = localStorage.getItem('userRequestHistory');
          if (stored) {
            currentHistory = JSON.parse(stored);
          }
        } catch (e) {
          console.error(e);
        }
      }
      syncLocalHistoryWithDb(currentHistory);
    }
  }, [activeTab]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const id = searchParams.get('id');
    
    if (tab === 'lapor' || tab === 'tamu' || tab === 'surat' || tab === 'mutasi' || tab === 'history') {
      setActiveTab(tab as any);
      
      if (tab === 'history' && id) {
        setStatusSearchId(id);
        handleSearchById(id);
      }
    }
  }, [searchParams]);
  
  // Form States
  const [reportType, setReportType] = useState<Report['type']>('Fasilitas');
  const [reportDesc, setReportDesc] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState(''); // NEW: Reporter's phone number
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
  const [mutationResidenceType, setMutationResidenceType] = useState<'Tetap' | 'Sewa' | 'Rumah Keluarga'>('Tetap');
  const [mutationReligion, setMutationReligion] = useState('Islam');
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
  const [letterStep, setLetterStep] = useState(1); // NEW: Step for letter request
  
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
    'Surat Keterangan Kematian': 'Persyaratan permohonan akta kematian / pelaporan warga meninggal dunia ke Kantor Kelurahan.',
    'Surat Keterangan Kelahiran': 'Persyaratan pembuatan akta kelahiran anak baru / pendaftaran ke dalam Kartu Keluarga.',
    'Surat Keterangan Waris / Ahli Waris': 'Persyaratan administrasi pengurusan hak waris / pembagian harta waris keluarga.',
    'Surat Keterangan Pindah / Datang': 'Persyaratan pengurusan surat pindah domisili keluar daerah atau pelaporan kedatangan warga baru.',
    'Surat Pengantar Nikah (N1 - N4)': 'Persyaratan rekomendasi pernikahan untuk pengurusan berkas administrasi N1 - N4 di Kantor Kelurahan.',
  };

  const letterRequirements: Record<string, string[]> = {
    'Surat Pengantar': ['Fotokopi KTP', 'Fotokopi KK'],
    'Surat Pengantar KTP': ['Fotokopi Kartu Keluarga (KK)', 'KTP Lama (jika perpanjangan)', 'Pas Foto 3x4 (2 lembar)'],
    'Surat Pengantar KK': ['KK Asli', 'Surat Pindah (jika warga baru)', 'Akta Kelahiran/Nikah (jika tambah anggota)'],
    'Surat Keterangan Domisili': ['Fotokopi KTP', 'Fotokopi KK', 'Surat Keterangan Kerja (jika untuk melamar)'],
    'Surat Keterangan Tidak Mampu': ['Fotokopi KK & KTP', 'Foto Rumah (tampak depan)', 'Surat Pernyataan Bermaterai'],
    'Surat Keterangan Usaha': ['Fotokopi KTP', 'Foto Lokasi Usaha', 'Surat Pernyataan Usaha'],
    'Surat Keterangan Berkelakuan Baik': ['Fotokopi KTP & KK', 'Pas Foto 4x6 (2 lembar)'],
    'Surat Keterangan Kematian': ['Surat Kematian dari RS / RT lama', 'Fotokopi KTP Alm/Almh', 'Fotokopi KK Terkait'],
    'Surat Keterangan Kelahiran': ['Surat Bidan/Rumah Sakit', 'Fotokopi Buku Nikah', 'Fotokopi KK Orang Tua'],
    'Surat Keterangan Waris / Ahli Waris': ['Surat Kematian Pewaris', 'Fotokopi KTP Semua Ahli Waris', 'Fotokopi KK Semua Ahli Waris'],
    'Surat Keterangan Pindah / Datang': ['Surat Pindah dari asal (untuk datang)', 'Fotokopi KTP & KK Pemohon'],
    'Surat Pengantar Nikah (N1 - N4)': ['Fotokopi KTP & KK Calon Pengantin', 'Fotokopi Akta Kelahiran / Surat Kelahiran', 'Fotokopi KTP & KK Orang Tua', 'Pas Foto Latar Biru (2x3 & 3x4)'],
  };

  const [reportPhoto, setReportPhoto] = useState<string | null>(null);

  const estimatedTimes: Record<string, string> = {
    'Surat Pengantar': '1x24 Jam',
    'Surat Pengantar KTP': '1x24 Jam',
    'Surat Pengantar KK': '1-2 Hari Kerja',
    'Surat Keterangan Domisili': '1x24 Jam',
    'Surat Keterangan Tidak Mampu': '2-3 Hari Kerja',
    'Surat Izin Keramaian': '1x24 Jam',
    'Surat Keterangan Usaha': '1-2 Hari Kerja',
    'Surat Keterangan Berkelakuan Baik': '1x24 Jam',
    'Surat Keterangan Kematian': '1x24 Jam',
    'Surat Keterangan Kelahiran': '1x24 Jam',
    'Surat Keterangan Waris / Ahli Waris': '1-2 Hari Kerja',
    'Surat Keterangan Pindah / Datang': '1-2 Hari Kerja',
    'Surat Pengantar Nikah (N1 - N4)': '1x24 Jam',
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
      localStorage.setItem('userRequestHistory', safeJsonStringify(sanitized)); 
    } catch (e) { console.error("Error saving history", e); } 
  };

  const handleNextToStep2 = () => {
    if (!applicantName.trim()) {
      toast.error("Validasi Gagal", { description: "Nama Lengkap wajib diisi sesuai KTP." });
      return;
    }
    if (!nik.trim()) {
      toast.error("Validasi Gagal", { description: "NIK (16 Digit) wajib diisi." });
      return;
    }
    if (!/^\d{16}$/.test(nik.trim())) {
      toast.error("Validasi Gagal", { description: "NIK harus terdiri dari 16 digit angka." });
      return;
    }
    if (!familyHeadName.trim()) {
      toast.error("Validasi Gagal", { description: "Nama Kepala Keluarga / Penghuni wajib diisi." });
      return;
    }
    if (!birthPlace.trim()) {
      toast.error("Validasi Gagal", { description: "Tempat Lahir wajib diisi." });
      return;
    }
    if (!birthDate) {
      toast.error("Validasi Gagal", { description: "Tanggal Lahir wajib diisi." });
      return;
    }
    if (!nationality.trim()) {
      toast.error("Validasi Gagal", { description: "Kewarganegaraan wajib diisi." });
      return;
    }
    if (!job.trim()) {
      toast.error("Validasi Gagal", { description: "Pekerjaan wajib diisi." });
      return;
    }
    if (!addressKtp.trim()) {
      toast.error("Validasi Gagal", { description: "Alamat Sesuai KTP wajib diisi." });
      return;
    }
    if (!isSameAddress && !currentAddress.trim()) {
      toast.error("Validasi Gagal", { description: "Alamat Domisili Saat Ini wajib diisi karena berbeda dengan KTP." });
      return;
    }
    setLetterStep(2);
  };

  const handleNextToStep3 = () => {
    const cleanPhone = phone.trim().replace(/[^0-9+]/g, '');
    if (!cleanPhone) {
      toast.error("Validasi Gagal", { description: "Nomor HP / WhatsApp wajib diisi." });
      return;
    }
    if (!/^(0|62|\+62)/.test(cleanPhone) || cleanPhone.replace(/\D/g, '').length < 9 || cleanPhone.replace(/\D/g, '').length > 15) {
      toast.error("Validasi Gagal", { description: "Format nomor HP / WhatsApp tidak valid. Masukkan nomor yang benar (contoh: 08123456789 atau +628123456789)." });
      return;
    }
    if (requestType === 'Lainnya' && !customRequestType.trim()) {
      toast.error("Validasi Gagal", { description: "Silakan sebutkan jenis surat lainnya secara spesifik." });
      return;
    }
    if (!purposeDetail.trim()) {
      toast.error("Validasi Gagal", { description: "Tujuan / Keperluan Surat wajib diisi." });
      return;
    }
    setLetterStep(3);
  };

  const handleSubmitSurat = async (e?: React.FormEvent | React.MouseEvent) => { 
    if (e) e.preventDefault(); 
    try {
      // Re-validate All Steps
      if (!applicantName.trim() || !nik.trim() || !/^\d{16}$/.test(nik.trim()) || !familyHeadName.trim() || !birthPlace.trim() || !birthDate || !nationality.trim() || !job.trim() || !addressKtp.trim() || (!isSameAddress && !currentAddress.trim())) {
        toast.error("Validasi Gagal", { description: "Tolong lengkapi semua data identitas diri di Step 1 dengan benar." });
        setLetterStep(1);
        return;
      }
      const cleanPhone = phone.trim().replace(/[^0-9+]/g, '');
      if (!cleanPhone || !/^(0|62|\+62)/.test(cleanPhone) || cleanPhone.replace(/\D/g, '').length < 9 || cleanPhone.replace(/\D/g, '').length > 15) {
        toast.error("Validasi Gagal", { description: "Nomor HP / WhatsApp wajib diisi dengan format yang benar." });
        setLetterStep(2);
        return;
      }
      if (requestType === 'Lainnya' && !customRequestType.trim()) {
        toast.error("Validasi Gagal", { description: "Silakan sebutkan jenis surat lainnya di Step 2." });
        setLetterStep(2);
        return;
      }
      if (!purposeDetail.trim()) {
        toast.error("Validasi Gagal", { description: "Tujuan / Keperluan Surat wajib diisi pada Step 2." });
        setLetterStep(2);
        return;
      }
      if (!houseId.trim()) {
        toast.error("Validasi Gagal", { description: "Blok Rumah wajib diisi pada Step 3." });
        setLetterStep(3);
        return;
      }
      if (!accessCode.trim()) {
        toast.error("Validasi Gagal", { description: "PIN Akses wajib diisi pada Step 3." });
        setLetterStep(3);
        return;
      }

      const isValid = await validateResidentAccess(houseId, accessCode);
      if (!isValid) {
        toast.error("Verifikasi Gagal!", {
          description: "Kode Akses Rumah tidak valid. Silakan hubungi Ketua RT jika lupa kode."
        });
        return;
      }

      const formattedHouseId = formatHouseId(houseId);
      
      // Check Waste Retribution (Mandatory in Palu City)
      const retribution = await checkWasteRetribution(formattedHouseId);
      if (!retribution.paid) {
        if (retribution.isMandatory) {
          toast.warning("PENGURUSAN DITANGGUHKAN", {
            description: `Pembayaran Retribusi Sampah & Air untuk bulan ${retribution.month} belum tercatat. Sesuai peraturan, iuran wajib dilunasi paling lambat tanggal 20 setiap bulannya. Silakan hubungi petugas atau Ketua RT.`,
            duration: 10000
          });
          return;
        } else {
          // Information only, not blocking
          toast.info("INFORMASI TAGIHAN", {
            description: `Tagihan Sampah & Air bulan ${retribution.month} sudah tersedia. Batas pelunasan adalah tanggal 20. Mohon segera melakukan pembayaran agar tidak menghambat pengurusan administrasi di akhir bulan.`,
            duration: 8000
          });
        }
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
        status: 'Menunggu', 
        date: new Date().toISOString(),
        estimatedTime: estimatedTimes[finalRequestType] || estimatedTimes['Lainnya']
      }; 
      
      await addLetterToDb(letterData); 
      const historyItem = {...letterData, category: 'Surat', title: `Surat ${finalRequestType}`};
      saveToHistory(historyItem); 
      
      toast.success("Surat Berhasil Diajukan!", {
        description: `ID: #${letterData.id.slice(-8)} | Estimasi: ${letterData.estimatedTime}`,
        action: {
          label: "WhatsApp RT",
          onClick: () => window.open(`https://wa.me/${(pdfConfig.rtPhone || '6285961194621').toString().replace(/^0/, '62').replace(/\D/g, '')}?text=Halo%20Pak%20RT,%20saya%20telah%20mengajukan%20${finalRequestType}%20dengan%20ID%20${letterData.id.slice(-8)}.%20Mohon%20bantuannya%20untuk%20verifikasi.`, '_blank')
        },
        duration: 10000
      });
      
      // Reset form
      setApplicantName(''); setNik(''); setFamilyHeadName(''); setBirthPlace(''); setBirthDate(''); setJob(''); setAddressKtp(''); setHouseId(''); setPurposeDetail(''); setAccessCode('');
      setNationality('Indonesia'); setMaritalStatus('Kawin'); setPhone(''); setEmail(''); setCustomRequestType('');
      setLetterStep(1); // Reset step
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "letters");
      toast.error("Gagal mengajukan surat.");
    }
  };

  const handleSubmitLapor = async (e?: React.FormEvent | React.MouseEvent) => { 
    if (e) e.preventDefault(); 
    try {
      const isValid = await validateResidentAccess(reporterHouseId, accessCode);
      if (!isValid) {
        toast.error("Verifikasi Gagal!", {
          description: "Kode Akses Rumah tidak valid."
        });
        return;
      }

      const formattedReporterHouseId = formatHouseId(reporterHouseId);
      const formattedReportHouseId = reportHouseId ? formatHouseId(reportHouseId) : '';

      const reportData: Report = { 
        id: Date.now().toString(), 
        type: reportType, 
        description: reportDesc, 
        reporterName, 
        reporterPhone, // NEW: Include reporter phone
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
      
      toast.success("Laporan Berhasil Terkirim!", {
        description: `ID: #${reportData.id.slice(-8)} | Kategori: ${reportType}`,
        action: {
          label: "WhatsApp RT",
          onClick: () => window.open(`https://wa.me/${(pdfConfig.rtPhone || '6285961194621').toString().replace(/^0/, '62').replace(/\D/g, '')}?text=Halo%20Pak%20RT,%20saya%20telah%20mengajukan%20Laporan%20${reportType}%20dengan%20ID%20${reportData.id.slice(-8)}.%20Mohon%20bantuannya%20untuk%20verifikasi.`, '_blank')
        },
        duration: 10000
      });
      
      // Reset form
      setReportDesc(''); setReporterName(''); setReporterPhone(''); setReportHouseId(''); setReporterHouseId(''); setAccessCode('');
      setReportPhoto(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "reports");
      toast.error("Gagal mengirim laporan.");
    }
  };

  const handleSubmitMutasi = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
    // As per guidance, Mutasi is for active houses which must have a PIN.
    const isValid = await validateResidentAccess(mutationHouseId, accessCode);
    if (!isValid) {
      toast.error("Verifikasi Gagal!", {
        description: "Kode Akses Rumah tidak valid."
      });
      return;
    }

    const formattedMutationHouseId = formatHouseId(mutationHouseId);
    
    // Check Waste Retribution (Mandatory in Palu City)
    const retribution = await checkWasteRetribution(formattedMutationHouseId);
    if (!retribution.paid) {
      if (retribution.isMandatory) {
        toast.warning("PELAPORAN DITANGGUHKAN", {
          description: `Pembayaran Retribusi Sampah & Air untuk bulan ${retribution.month} belum tercatat. Sesuai peraturan, iuran wajib dilunasi paling lambat tanggal 20 setiap bulannya. Silakan hubungi petugas atau Ketua RT.`,
          duration: 10000
        });
        return;
      } else {
        // Information only, not blocking
        toast.info("INFORMASI TAGIHAN", {
          description: `Tagihan Sampah & Air bulan ${retribution.month} sudah tersedia. Batas pelunasan adalah tanggal 20. Mohon segera melakukan pembayaran agar tidak menghambat pelaporan di akhir bulan.`,
          duration: 8000
        });
      }
    }

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
        religion: mutationType === 'Newcomer' ? mutationReligion : undefined,
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
    
    toast.success("Laporan Mutasi Berhasil!", {
      description: `ID: #${mutationData.id.slice(-8)} | Jenis: ${mutationType}`,
      action: {
        label: "WhatsApp RT",
        onClick: () => window.open(`https://wa.me/${(pdfConfig.rtPhone || '6285961194621').toString().replace(/^0/, '62').replace(/\D/g, '')}?text=Halo%20Pak%20RT,%20saya%20telah%20mengajukan%20Laporan%20Mutasi%20${mutationType}%20dengan%20ID%20${mutationData.id.slice(-8)}.%20Mohon%20bantuannya%20untuk%20verifikasi.`, '_blank')
      },
      duration: 10000
    });

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
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "mutation");
      toast.error("Gagal mengirim laporan mutasi.");
    }
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
      <div className="sticky top-[64px] md:top-[80px] z-30 flex justify-center mb-8 md:mb-16 px-4 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-xl p-1.5 rounded-[2rem] inline-flex shadow-2xl shadow-indigo-500/10 border border-white/50 overflow-x-auto no-scrollbar max-w-full pointer-events-auto">
          {[
            { id: 'surat', label: 'Layanan Surat', shortLabel: 'Surat', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { id: 'tamu', label: 'Lapor Tamu', shortLabel: 'Tamu', icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
            { id: 'lapor', label: 'Lapor Warga', shortLabel: 'Aduan', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
            { id: 'mutasi', label: 'Mutasi Warga', shortLabel: 'Mutasi', icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { id: 'history', label: 'Cek Status', shortLabel: 'Status', icon: History, color: 'text-amber-600', bg: 'bg-amber-50' }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  relative flex items-center justify-center gap-1.5 px-3 py-2.5 sm:px-6 sm:py-3 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-wider md:tracking-widest transition-all duration-300
                  ${isActive 
                    ? `${tab.bg} ${tab.color} shadow-sm px-4 sm:px-6` 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'}
                `}
              >
                <tab.icon size={15} strokeWidth={2.5} className={`${isActive ? 'scale-110' : 'scale-100'} transition-transform shrink-0`} />
                <span className={`
                  text-[9px] md:text-xs font-black tracking-wider whitespace-nowrap transition-all duration-300
                  ${isActive 
                    ? 'block opacity-100 ml-1' 
                    : 'hidden sm:block opacity-60 overflow-hidden'}
                `}>
                  {isActive ? tab.shortLabel : tab.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 border-2 border-current opacity-10 rounded-2xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            );
          })}
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
            className="bg-white p-6 md:p-16 rounded-[3rem] md:rounded-[4rem] border border-slate-100 shadow-2xl shadow-indigo-100/30 overflow-hidden"
          >
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 pb-8 border-b border-slate-100">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-indigo-600 text-white rounded-[1.8rem] shadow-xl shadow-indigo-200/80 transition-transform duration-300 hover:scale-105">
                  <FileText size={36} strokeWidth={2} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em] block mb-1">E-Layanan Mandiri</span>
                  <h2 className="text-2xl md:text-3.5xl font-black text-slate-900 tracking-tight">Permohonan Surat</h2>
                  <p className="text-slate-500 text-xs md:text-sm font-medium mt-0.5">Dapatkan surat pengantar resmi RT 02 ke Kelurahan secara instan dan aman.</p>
                </div>
              </div>
            </div>

            {/* Palu City Regulation Notice - Modernized Banner */}
            <div className="mb-10 p-6 bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-200/70 rounded-[2rem] flex items-start gap-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
              <div className="p-3 bg-white text-amber-600 rounded-2xl shadow-sm shrink-0">
                <ShieldAlert size={22} className="animate-bounce" />
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Aturan Pemerintah Kota Palu</p>
                <p className="text-[13px] font-medium text-amber-800 mt-1 leading-relaxed">
                  Berdasarkan peraturan daerah, pembayaran <b>Retribusi Sampah</b> wajib dilunasi sebelum mengurus surat administrasi warga. Sistem kami terintegrasi untuk mengecek pelunasan iuran secara otomatis saat data dikirimkan.
                </p>
              </div>
            </div>

            {/* Stepper Progress Block */}
            <div className="flex items-center justify-center mb-16 px-2 md:px-0">
              <div className="flex items-center w-full max-w-2xl justify-between">
                {[
                  { step: 1, label: 'Identitas', icon: User },
                  { step: 2, label: 'Keperluan', icon: Briefcase },
                  { step: 3, label: 'Verifikasi', icon: Lock }
                ].map((s, i) => {
                  const Icon = s.icon;
                  const isActive = letterStep >= s.step;
                  const isCompleted = letterStep > s.step;
                  return (
                    <React.Fragment key={s.step}>
                      <div className="flex flex-col items-center relative z-10">
                        <motion.div 
                          animate={{ 
                            scale: letterStep === s.step ? 1.08 : 1,
                            backgroundColor: isCompleted ? 'rgb(16, 185, 129)' : isActive ? 'rgb(79, 70, 229)' : 'rgb(241, 245, 249)',
                            color: isActive ? 'rgb(255, 255, 255)' : 'rgb(148, 163, 184)',
                            boxShadow: isActive ? '0 10px 15px -3px rgba(79, 70, 229, 0.3)' : 'none'
                          }}
                          className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-sm font-black`}
                        >
                          {isCompleted ? <CheckCircle2 size={22} className="text-white" /> : <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />}
                        </motion.div>
                        <span className={`absolute -bottom-7 text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors duration-300 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                          {s.label}
                        </span>
                      </div>
                      {i < 2 && (
                        <div className="flex-1 h-[3px] mx-2 bg-slate-100 rounded-full overflow-hidden relative">
                          <motion.div 
                            initial={false}
                            animate={{ width: letterStep > s.step ? '100%' : '0%' }}
                            className="h-full bg-indigo-600"
                            transition={{ duration: 0.4 }}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmitSurat} className="space-y-12">
              {/* STEP 1: IDENTITAS DIRI */}
              {letterStep === 1 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-12"
                >
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black shadow-sm">01</div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 tracking-tight">Identitas Diri Pemohon</h3>
                      <p className="text-xs text-slate-400 font-bold">Pastikan data yang Anda masukkan sesuai dengan KTP & Kartu Keluarga (KK).</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-7">
                    {/* SECTION A: Identitas Utama */}
                    <div className="md:col-span-2">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-4">A. Informasi Kependudukan Utama</span>
                    </div>

                    <div className="md:col-span-2 group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Lengkap Sesuai KTP</label>
                      <div className="relative">
                        <input 
                          className="w-full p-4.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300" 
                          value={applicantName} 
                          onChange={e=>setApplicantName(e.target.value)} 
                          required 
                          placeholder="Masukkan nama lengkap Anda"
                        />
                        <User className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                      </div>
                    </div>

                    <div className="group">
                      <div className="flex justify-between items-center mb-2 ml-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">NIK (16 Digit)</label>
                        <span className={`text-[10px] font-black transition-colors ${nik.length === 16 ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {nik.length}/16 Digit
                        </span>
                      </div>
                      <input 
                        maxLength={16}
                        className={`w-full p-4.5 bg-slate-50/50 hover:bg-slate-50 border rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all ${nik.length > 0 && nik.length < 16 ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-500/10' : nik.length === 16 ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/10' : 'border-slate-200'}`} 
                        value={nik} 
                        onChange={e=>setNik(e.target.value.replace(/\D/g, ''))} 
                        required 
                        placeholder="Contoh: 720102XXXXXXXXXX"
                      />
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Kepala Keluarga (di KK)</label>
                      <input 
                        className="w-full p-4.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" 
                        value={familyHeadName} 
                        onChange={e=>setFamilyHeadName(e.target.value)} 
                        required 
                        placeholder="Contoh: Budi Santoso"
                      />
                    </div>

                    {/* SECTION B: Biodata Lahir */}
                    <div className="md:col-span-2 mt-4">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-4">B. Tempat & Tanggal Lahir</span>
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tempat Lahir</label>
                      <input 
                        className="w-full p-4.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" 
                        value={birthPlace} 
                        onChange={e=>setBirthPlace(e.target.value)} 
                        required
                        placeholder="Contoh: Palu"
                      />
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tanggal Lahir</label>
                      <input 
                        type="date" 
                        className="w-full p-4.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" 
                        value={birthDate} 
                        onChange={e=>setBirthDate(e.target.value)} 
                        required
                      />
                    </div>

                    {/* SECTION C: Detail Personal */}
                    <div className="md:col-span-2 mt-4">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-4">C. Profil Sosial & Kependudukan</span>
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Jenis Kelamin</label>
                      <div className="relative">
                        <select 
                          className="w-full p-4.5 pr-12 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer" 
                          value={gender} 
                          onChange={e=>setGender(e.target.value as any)}
                        >
                          <option>Laki-laki</option>
                          <option>Perempuan</option>
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-600 transition-colors" size={18} />
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Agama</label>
                      <div className="relative">
                        <select 
                          className="w-full p-4.5 pr-12 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer" 
                          value={religion} 
                          onChange={e=>setReligion(e.target.value)}
                        >
                          <option>Islam</option>
                          <option>Kristen</option>
                          <option>Katolik</option>
                          <option>Hindu</option>
                          <option>Buddha</option>
                          <option>Konghucu</option>
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-600 transition-colors" size={18} />
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Status Perkawinan</label>
                      <div className="relative">
                        <select 
                          className="w-full p-4.5 pr-12 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer" 
                          value={maritalStatus} 
                          onChange={e=>setMaritalStatus(e.target.value as any)}
                        >
                          <option>Belum Kawin</option>
                          <option>Kawin</option>
                          <option>Cerai Hidup</option>
                          <option>Cerai Mati</option>
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-600 transition-colors" size={18} />
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Kewarganegaraan</label>
                      <input 
                        className="w-full p-4.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" 
                        value={nationality} 
                        onChange={e=>setNationality(e.target.value)} 
                        required 
                        placeholder="Contoh: WNI"
                      />
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Pekerjaan</label>
                      <input 
                        className="w-full p-4.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" 
                        value={job} 
                        onChange={e=>setJob(e.target.value)} 
                        required
                        placeholder="Contoh: Karyawan Swasta"
                      />
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Golongan Darah</label>
                      <div className="relative">
                        <select 
                          className="w-full p-4.5 pr-12 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer" 
                          value={bloodType} 
                          onChange={e=>setBloodType(e.target.value as any)}
                        >
                          <option>-</option>
                          <option>A</option>
                          <option>B</option>
                          <option>AB</option>
                          <option>O</option>
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-600 transition-colors" size={18} />
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Pendidikan Terakhir</label>
                      <div className="relative">
                        <select 
                          className="w-full p-4.5 pr-12 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer" 
                          value={education} 
                          onChange={e=>setEducation(e.target.value)}
                        >
                          <option>SD/Sederajat</option>
                          <option>SMP/Sederajat</option>
                          <option>SMA/Sederajat</option>
                          <option>D3</option>
                          <option>S1</option>
                          <option>S2</option>
                          <option>S3</option>
                          <option>Tidak Sekolah</option>
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-600 transition-colors" size={18} />
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Hubungan Keluarga</label>
                      <div className="relative">
                        <select 
                          className="w-full p-4.5 pr-12 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer" 
                          value={familyStatus} 
                          onChange={e=>setFamilyStatus(e.target.value as any)}
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
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-600 transition-colors" size={18} />
                      </div>
                    </div>

                    {/* SECTION D: Alamat & Domisili */}
                    <div className="md:col-span-2 mt-4">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-4">D. Alamat & Status Tempat Tinggal</span>
                    </div>

                    <div className="md:col-span-2 group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Alamat Sesuai KTP</label>
                      <textarea 
                        className="w-full p-4.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none h-20 leading-relaxed" 
                        value={addressKtp} 
                        onChange={e=>setAddressKtp(e.target.value)} 
                        required 
                        placeholder="Tuliskan alamat lengkap Anda sesuai dokumen KTP"
                      />
                    </div>

                    <div className="md:col-span-2 group">
                      <div className="flex items-center justify-between mb-3 ml-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Alamat Domisili Saat Ini</label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            className="w-4.5 h-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            checked={isSameAddress}
                            onChange={(e) => setIsSameAddress(e.target.checked)}
                          />
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Sama dengan KTP</span>
                        </label>
                      </div>
                      {!isSameAddress && (
                        <textarea 
                          className="w-full p-4.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none h-20 leading-relaxed" 
                          value={currentAddress} 
                          onChange={e=>setCurrentAddress(e.target.value)} 
                          required={!isSameAddress}
                          placeholder="Tuliskan alamat tempat tinggal saat ini di wilayah RT 02..."
                        />
                      )}
                      {isSameAddress && (
                        <div className="w-full p-4.5 bg-slate-100/55 border border-slate-200 rounded-2xl text-xs font-bold text-slate-400 italic flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> Alamat tinggal sekarang sesuai dengan alamat KTP Anda.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step Buttons */}
                  <div className="flex justify-end pt-8 border-t border-slate-100">
                    <button 
                      type="button"
                      onClick={handleNextToStep2}
                      className="px-8 py-4.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100/85 hover:shadow-indigo-200 transition-all flex items-center gap-2.5 duration-200"
                    >
                      Lanjut ke Keperluan <ArrowRight size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: KONTAK & KEPERLUAN */}
              {letterStep === 2 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-12"
                >
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black shadow-sm">02</div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 tracking-tight">Detail Kontak & Keperluan Surat</h3>
                      <p className="text-xs text-slate-400 font-bold">Pilih jenis surat dan isikan alasan keperluan administratif Anda secara jelas.</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Phone & Email Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="group">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">No. HP / WhatsApp (Aktif)</label>
                        <div className="relative">
                          <input 
                            className="w-full p-4.5 pr-12 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300" 
                            value={phone} 
                            onChange={e=>setPhone(e.target.value)} 
                            required 
                            placeholder="Contoh: 081234567890"
                          />
                          <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" size={18} />
                        </div>
                      </div>
                      <div className="group">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Alamat Email (Opsional)</label>
                        <input 
                          type="email" 
                          className="w-full p-4.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" 
                          value={email} 
                          onChange={e=>setEmail(e.target.value)} 
                          placeholder="alamat.email@contoh.com"
                        />
                      </div>
                    </div>

                    {/* Integrated Letter Type Selector & Estimated Timing Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Jenis Surat Pengantar</label>
                        <div className="relative">
                          <select 
                            className="w-full p-4.5 pr-12 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer shadow-sm" 
                            value={requestType} 
                            onChange={e=>setRequestType(e.target.value)}
                          >
                            {Object.keys(dynamicTemplates).map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                            <option value="Lainnya">Lainnya</option>
                          </select>
                          <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                        </div>
                      </div>
                      <div className="bg-white border border-slate-100 rounded-[1.8rem] p-4 flex flex-col justify-center shadow-sm">
                        <div className="flex items-center gap-1.5 mb-1 text-indigo-600">
                          <Clock size={14} strokeWidth={2.5} />
                          <span className="text-[9px] font-black uppercase tracking-wider">Durasi Pengurusan</span>
                        </div>
                        <span className="text-base font-black text-indigo-600 transition-all">
                          {estimatedTimes[requestType] || '1x24 Jam'}
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">Sejak RT menyetujui</span>
                      </div>
                    </div>

                    {/* If Custom chosen */}
                    {requestType === 'Lainnya' && (
                      <div className="group">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Sebutkan Jenis Surat Lainnya <span className="text-red-500">*</span></label>
                        <input 
                          className="w-full p-4.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" 
                          value={customRequestType} 
                          onChange={e => setCustomRequestType(e.target.value)} 
                          placeholder="Tuliskan jenis surat pengantar (Contoh: Surat Keterangan Usaha)" 
                          required 
                        />
                      </div>
                    )}

                    {/* Letter Physical Requirements Banner */}
                    {letterRequirements[requestType] && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] gap-4"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Flag size={14} className="text-slate-700" />
                          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Persyaratan Berkas Fisik (Wajib Dibawa)</h4>
                        </div>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {letterRequirements[requestType].map((req, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs font-bold text-slate-600">
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-4 pt-3 border-t border-slate-100 text-[9px] text-slate-400 font-medium italic">
                          * Serahkan atau berikan berkas fisik di atas saat Anda akan mengambil berkas cetak di kediaman RT.
                        </p>
                      </motion.div>
                    )}

                    {/* Purpose Text area & Suggester Button */}
                    <div className="group">
                      <div className="flex justify-between items-center mb-2.5 ml-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tujuan / Keperluan Surat</label>
                        {dynamicTemplates[requestType] && (
                          <button 
                            type="button"
                            onClick={handleUseTemplate}
                            className="bg-indigo-50 hover:bg-indigo-100 text-[10px] font-black text-indigo-600 uppercase tracking-widest px-4 py-2 rounded-2xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95 duration-150"
                          >
                            <Sparkles size={11} className="animate-pulse" /> Gunakan Draf Otomatis
                          </button>
                        )}
                      </div>
                      <textarea 
                        className="w-full p-4.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all min-h-[120px] resize-none leading-relaxed" 
                        value={purposeDetail} 
                        onChange={e=>setPurposeDetail(e.target.value)} 
                        required 
                        placeholder="Jelaskan secara rinci detail keperluan surat ini (Paling sedikit 5 kata)..."
                      />
                    </div>
                  </div>

                  {/* Step Buttons */}
                  <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                    <button 
                      type="button"
                      onClick={() => setLetterStep(1)}
                      className="px-6 py-4 text-slate-400 hover:text-slate-600 font-black uppercase tracking-widest transition-colors text-xs"
                    >
                      Sebelumnya
                    </button>
                    <button 
                      type="button"
                      onClick={handleNextToStep3}
                      className="px-8 py-4.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100/85 hover:shadow-indigo-200 transition-all flex items-center gap-2.5 duration-200"
                    >
                      Lanjut ke Verifikasi <ArrowRight size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: VERIFIKASI WARGA */}
              {letterStep === 3 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-12"
                >
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black shadow-sm">03</div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 tracking-tight">Verifikasi & Pengiriman</h3>
                      <p className="text-xs text-slate-400 font-bold">Lakukan verifikasi keamanan menggunakan PIN Akses Rumah yang sah dari RT.</p>
                    </div>
                  </div>

                  {/* High Contrast Secure Verification Card */}
                  <div className="bg-gradient-to-b from-indigo-50/50 to-indigo-100/10 border border-indigo-100 p-8 md:p-10 rounded-[2.5rem] space-y-8">
                    <div className="flex items-center gap-4.5">
                      <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-150">
                        <ShieldCheck size={28} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-indigo-900 tracking-tight">Autentikasi Hak Akses</h4>
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-100/80 px-2.5 py-1 rounded-full inline-block mt-1">Keamanan Enkripsi</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="group">
                        <label className="block text-[10px] font-black text-indigo-900/60 uppercase tracking-widest mb-3 text-center">Blok & No. Rumah</label>
                        <input 
                          className="w-full p-5 bg-white border border-indigo-100 rounded-2xl text-lg font-black focus:border-indigo-500 outline-none transition-all text-center uppercase shadow-sm placeholder:text-slate-300" 
                          placeholder="A-12 atau B3-01" 
                          value={houseId} 
                          onChange={e=>setHouseId(e.target.value)} 
                          required
                        />
                      </div>
                      <div className="group">
                        <label className="block text-[10px] font-black text-indigo-900/60 uppercase tracking-widest mb-3 text-center">PIN Akses Rumah</label>
                        <div className="relative">
                          <input 
                            type={showPin ? "text" : "password"} 
                            placeholder="6 Digit PIN" 
                            className="w-full p-5 bg-white border border-indigo-100 rounded-2xl text-lg font-black focus:border-indigo-500 outline-none transition-all text-center shadow-sm tracking-[0.4em] placeholder:text-slate-300" 
                            value={accessCode} 
                            onChange={e=>setAccessCode(e.target.value)} 
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-600 transition-colors"
                          >
                            {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-white border border-indigo-100/50 rounded-2xl flex items-start gap-4">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                        <Info size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-indigo-800/85 font-medium leading-relaxed">
                          PIN Akses adalah kode otentikasi unik 6 digit yang terdaftar di database pengurus RT untuk nomor rumah Anda. Jika belum terdaftar atau lupa, silakan hubungi Ketua RT untuk mendapatkan PIN Anda.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submission Row with Assurances Checklist */}
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-100">
                    <button 
                      type="button"
                      onClick={() => setLetterStep(2)}
                      className="px-6 py-4 text-slate-400 hover:text-slate-600 font-black uppercase tracking-widest transition-colors text-xs self-start lg:self-auto"
                    >
                      Sebelumnya
                    </button>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
                      <div className="hidden sm:flex flex-col text-right">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sistem Validasi Aktif</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">Seksi Kependudukan & Administrasi RT 02</p>
                      </div>
                      
                      <Button 
                        type="submit" 
                        size="lg" 
                        onClick={handleSubmitSurat}
                        className="w-full sm:w-auto px-12 py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/35 hover:shadow-indigo-600/50 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
                      >
                        <Send size={15} strokeWidth={2.5} className="mr-2" /> Kirim Pengajuan Surat
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </form>
          </motion.div>
        )}

        {activeTab === 'lapor' && (
          <motion.div 
            key="lapor"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 md:p-14 rounded-[3rem] border border-slate-150 shadow-2xl shadow-rose-150/15"
          >
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-100">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20">
                  <AlertTriangle size={32} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[9px] font-black uppercase tracking-wider">Public Service</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-950 tracking-tight mt-1">Laporan & Pengaduan Warga</h2>
                  <p className="text-slate-500 text-xs font-semibold">Saluran aspirasi dan pengaduan insiden lingkungan RT 02 yang aman dan terkawal.</p>
                </div>
              </div>
            </div>

            {/* Quick Informative Info Boxes - Premium Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              {[
                { title: "Verifikasi Keamanan PIN", desc: "Setiap laporan diverifikasi dengan PIN Akses Rumah untuk menjamin laporan riil, bebas spam, dan jaminan valid.", icon: ShieldCheck, colorClass: "text-emerald-600 bg-emerald-50/50 border-emerald-100" },
                { title: "Kerahasiaan Dijamin", desc: "Identitas pelapor dilindungi dengan aman dan hanya dipergunakan untuk koordinasi klarifikasi internal pengurus.", icon: Lock, colorClass: "text-indigo-600 bg-indigo-50/50 border-indigo-100" },
                { title: "Koordinasi Cepat RT", desc: "Laporan diteruskan langsung ke sistem kendali Ketua RT dan grup keamanan warga untuk tindak lanjut responsif.", icon: Sparkles, colorClass: "text-rose-600 bg-rose-50/50 border-rose-100" },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className={`p-5 rounded-2xl border ${item.colorClass} flex gap-4 transition-all hover:scale-[1.01]`}>
                    <div className="p-2.5 bg-white rounded-xl shadow-xs self-start shrink-0">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide mb-1">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <form onSubmit={handleSubmitLapor} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8.5">
                
                {/* Left Side: Report Details (7 Cols) */}
                <div className="lg:col-span-7 space-y-7">
                  <div className="flex items-center gap-3.5 pb-2.5 border-b border-slate-100">
                    <div className="w-6.5 h-6.5 bg-slate-900 text-white rounded-lg flex items-center justify-center text-[10px] font-black">1</div>
                    <h3 className="text-[10.5px] font-black text-slate-850 uppercase tracking-widest">Detail & Kronologi Kejadian</h3>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Category Selection Option */}
                    <div className="space-y-2">
                      <label className="block text-[10.5px] font-black text-slate-455 uppercase tracking-widest ml-1">Kategori Permasalahan / Kejadian <span className="text-rose-500">*</span></label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { id: 'Keamanan', title: 'Keamanan Domestik', desc: 'Sengketa, keributan, kecurigaan', icon: Shield, color: 'text-rose-600', activeBg: 'bg-rose-50/70 border-rose-500 text-rose-950 ring-2 ring-rose-500/10' },
                          { id: 'Kebersihan', title: 'Kebersihan & Sanitasi', desc: 'Saluran air pampat, pembuangan liar', icon: Trash2, color: 'text-emerald-600', activeBg: 'bg-emerald-50/70 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/10' },
                          { id: 'Fasilitas', title: 'Prasarana & Fasilitas', desc: 'Lampu jalan malfungsi, trotoar rusak', icon: Wrench, color: 'text-blue-600', activeBg: 'bg-blue-50/70 border-blue-500 text-blue-950 ring-2 ring-blue-500/10' },
                          { id: 'Sosial', title: 'Ketertiban Sosial', desc: 'Kebisingan malam, izin acara massal', icon: Users, color: 'text-amber-600', activeBg: 'bg-amber-50/70 border-amber-500 text-amber-950 ring-2 ring-amber-500/10' },
                          { id: 'Lainnya', title: 'Umum & Lainnya', desc: 'Hal-hal umum diluar kategori primer', icon: AlertTriangle, color: 'text-slate-600', activeBg: 'bg-slate-100 border-slate-500 text-slate-950 ring-2 ring-slate-500/15' },
                        ].map(item => {
                          const Icon = item.icon;
                          const isSelected = reportType === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setReportType(item.id as any)}
                              className={`
                                p-4.5 rounded-xl border text-left flex gap-3.5 transition-all duration-250 cursor-pointer w-full
                                ${isSelected 
                                  ? `${item.activeBg} shadow-sm` 
                                  : 'bg-slate-50 hover:bg-slate-100/75 text-slate-650 border-slate-200/85'
                                }
                              `}
                            >
                              <div className={`p-2.5 bg-white rounded-xl shadow-xs self-start shrink-0 ${item.color} ${isSelected ? 'scale-110' : ''} transition-all`}>
                                <Icon size={16} />
                              </div>
                              <div>
                                <p className="text-[11px] font-black uppercase tracking-wider">{item.title}</p>
                                <p className="text-[10px] text-slate-450 font-semibold mt-1 leading-normal">{item.desc}</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    
                    {/* Location Block */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <label className="block text-[10.5px] font-black text-slate-455 uppercase tracking-widest">Lokasi Lapangan Kejadian <span className="text-rose-500">*</span></label>
                        <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">Koordinat Riil</span>
                      </div>
                      <div className="relative">
                        <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          className="w-full pl-11 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-slate-900 outline-none hover:border-slate-350 focus:ring-4 focus:ring-slate-900/5 transition-all uppercase placeholder:normal-case shadow-xs" 
                          value={reportHouseId} 
                          onChange={e=>setReportHouseId(e.target.value)} 
                          placeholder="Cth: Blok C7-02 atau Depan Lapangan RT"
                          required
                        />
                      </div>
                    </div>

                    {/* Description Textarea */}
                    <div className="space-y-2">
                      <label className="block text-[10.5px] font-black text-slate-455 uppercase tracking-widest ml-1">Deskripsi Kronologis Insiden <span className="text-rose-500">*</span></label>
                      <textarea 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-slate-900 outline-none hover:border-slate-350 focus:ring-4 focus:ring-slate-900/5 transition-all min-h-[148px] resize-none leading-relaxed placeholder:font-medium shadow-xs" 
                        value={reportDesc} 
                        onChange={e=>setReportDesc(e.target.value)} 
                        required 
                        placeholder="Uraikan detail laporan: sebutkan perkiraan waktu kejadian, pelaku jika ada, kronologi singkat, dampak yang diakibatkan..."
                      />
                    </div>

                    {/* Photo Upload Area */}
                    <div className="space-y-2">
                      <label className="block text-[10.5px] font-black text-slate-455 uppercase tracking-widest ml-1">Unggah Lampiran Visual / Foto Bukti <span className="text-slate-450 font-medium">(Opsional)</span></label>
                      <div className="relative">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handlePhotoChange}
                          className="hidden" 
                          id="report-photo"
                        />
                        {reportPhoto ? (
                          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 shadow-sm group">
                            <img src={reportPhoto} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2.5">
                              <label htmlFor="report-photo" className="px-4 py-2 bg-white text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-md hover:bg-slate-50 transition-all">
                                Ubah Lampiran Foto
                              </label>
                              <button 
                                type="button"
                                onClick={() => setReportPhoto(null)}
                                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md hover:bg-rose-700 transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Trash2 size={12} /> Hapus Lampiran
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label 
                            htmlFor="report-photo"
                            className="flex flex-col items-center justify-center w-full p-6 border border-dashed border-slate-250 hover:border-slate-950 rounded-xl bg-slate-50/50 hover:bg-slate-100/40 transition-all cursor-pointer group"
                          >
                            <div className="p-2.5 bg-white rounded-lg shadow-sm text-slate-400 mb-2 group-hover:text-slate-900 transition-colors">
                              <Camera size={18} />
                            </div>
                            <p className="text-[11px] font-black text-slate-750">Pilih atau Seret Foto File Bukti</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest">JPG, PNG (Format Digital Maksimal 5MB)</p>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Identity of Reporter (5 Cols) */}
                <div className="lg:col-span-5 space-y-7">
                  <div className="flex items-center gap-3 pb-2.5 border-b border-slate-100">
                    <div className="w-6.5 h-6.5 bg-slate-900 text-white rounded-lg flex items-center justify-center text-[10px] font-black">2</div>
                    <h3 className="text-[10.5px] font-black text-slate-850 uppercase tracking-widest">Identitas Akuntabel Pelapor</h3>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="block text-[10.5px] font-black text-slate-455 uppercase tracking-widest ml-1">Nama Lengkap Sesuai KTP <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          className="w-full pl-11 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-slate-900 outline-none hover:border-slate-350 focus:ring-4 focus:ring-slate-900/5 transition-all shadow-xs" 
                          value={reporterName} 
                          onChange={e=>setReporterName(e.target.value)} 
                          required 
                          placeholder="Ketik nama lengkap Anda sesuai KTP"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10.5px] font-black text-slate-455 uppercase tracking-widest ml-1">Nomor WhatsApp Aktif <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          className="w-full pl-11 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-slate-900 outline-none hover:border-slate-350 focus:ring-4 focus:ring-slate-900/5 transition-all shadow-xs" 
                          value={reporterPhone} 
                          onChange={e=>setReporterPhone(e.target.value)} 
                          required 
                          placeholder="Contoh: 08123456789"
                        />
                      </div>
                    </div>

                    {/* Premium Verification Box */}
                    <div className="p-5 bg-rose-50/45 border border-rose-100 rounded-2xl space-y-4 shadow-sm relative overflow-hidden">
                      <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-12 h-12 bg-rose-500/5 rounded-full blur-xl" />
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-905 text-white bg-slate-900 rounded-xl shadow-md shrink-0">
                          <Lock size={14} />
                        </div>
                        <div>
                          <h4 className="text-[11.5px] font-black text-rose-955 uppercase tracking-wide">Validasi Otoritas Rumah</h4>
                          <p className="text-[9.5px] text-rose-700/70 font-semibold uppercase tracking-wider">Verifikasi Keaslian Laporan</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 pt-1">
                        <div className="space-y-1.5">
                          <label className="block text-[9.5px] font-black text-rose-900 uppercase tracking-widest ml-1">Blok Rumah Anda <span className="text-rose-500">*</span></label>
                          <input 
                            className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs font-black focus:border-rose-500 hover:border-slate-300 outline-none transition-all text-center uppercase shadow-xs" 
                            placeholder="Cth: C7-02" 
                            value={reporterHouseId} 
                            onChange={e=>setReporterHouseId(e.target.value)} 
                            required
                          />
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="block text-[9.5px] font-black text-rose-900 uppercase tracking-widest ml-1">PIN Akses Rumah Anda <span className="text-rose-500">*</span></label>
                          <div className="relative">
                            <input 
                              type={showPin ? "text" : "password"} 
                              placeholder="Ketik 6 digit PIN rumah Anda" 
                              className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs font-black focus:border-rose-500 hover:border-slate-300 outline-none transition-all text-center tracking-widest shadow-xs" 
                              value={accessCode} 
                              onChange={e=>setAccessCode(e.target.value.replace(/\D/g, ''))} 
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPin(!showPin)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            >
                              {showPin ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                          <p className="text-[9.5px] text-slate-450 font-semibold mt-1.5 leading-relaxed text-center">PIN terdaftar saat sensus warga pertama kali. Jika lupa, silakan hubungi Ketua RT.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form submit with explicit ID target and neat layout */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center sm:text-left">
                  Setiap laporan didokumentasikan resmi dan dilindungi kerahasiaannya.
                </p>
                <Button 
                  id="submit-public-citizens-report"
                  type="submit" 
                  variant="danger" 
                  size="lg" 
                  onClick={handleSubmitLapor}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-white"
                >
                  <Send size={13} className="mr-2" /> Kirim Laporan Resmi
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
            className="bg-white p-6 md:p-12 rounded-[3.5rem] border border-slate-150 shadow-2xl shadow-slate-150/40"
          >
            {/* Header section with step badges and indicators */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-slate-100">
              <div className="flex items-center gap-4.5">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100 shrink-0">
                  <UserPlus size={30} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-black uppercase tracking-widest border border-emerald-100/50">Kependudukan</span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">Laporan Mutasi Warga</h2>
                  <p className="text-xs text-slate-500 font-semibold">Prosedur pelaporan penambahan atau pengurangan anggota keluarga RT 02.</p>
                </div>
              </div>

              {/* Progress Stepper Pills */}
              <div className="flex items-center gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200/50 self-start md:self-center">
                {[
                  { step: 1, title: 'Kategori' },
                  { step: 2, title: 'Identitas' },
                  { step: 3, title: 'Detail' }
                ].map(s => {
                  const isActive = mutationStep === s.step;
                  const isCompleted = mutationStep > s.step;
                  return (
                    <div 
                      key={s.step} 
                      className={`
                        px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all duration-300
                        ${isActive 
                          ? 'bg-emerald-600 text-white shadow-xs' 
                          : isCompleted 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'text-slate-400 hover:text-slate-600'}
                      `}
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${isActive ? 'bg-white text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>{s.step}</span>
                      <span className="text-[10px] font-black uppercase tracking-wider">{s.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation of Registration vs Mutation */}
            <div className="mb-6 p-4 bg-indigo-50/40 border border-indigo-100/60 rounded-2xl flex items-start gap-4">
              <div className="p-2 bg-white text-indigo-600 rounded-xl shadow-xs shrink-0 border border-indigo-50">
                <Info size={18} />
              </div>
              <div>
                <p className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">Panduan Kependudukan RT 02</p>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5 leading-relaxed">
                  Gunakan menu <b>Mutasi</b> ini jika hunian Anda sudah aktif dan terdaftar di sistem. Jika Anda penghuni baru pertama kali yang ingin meregistrasikan alamat unit baru, harap gunakan menu <b>Registrasi Penghuni</b> di beranda utama.
                </p>
              </div>
            </div>

            {/* Palu City Regulation Notice */}
            <div className="mb-8 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-start gap-4">
              <div className="p-2 bg-white text-amber-600 rounded-xl shadow-xs shrink-0 border border-amber-50">
                <ShieldAlert size={18} />
              </div>
              <div>
                <p className="text-[11px] font-black text-amber-900 uppercase tracking-widest">Ketentuan Retribusi Kota Palu</p>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5 leading-relaxed">
                  Sesuai Perda Kota Palu, pemenuhan iuran <b>Retribusi Sampah & Kebersihan</b> wajib dilunasi untuk setiap pengurusan kelengkapan mutasi administrasi. Sistem akan melakukan autocheck tagihan rumah Anda.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitMutasi} className="space-y-8">
              {mutationStep === 1 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                    <div className="w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center text-xs font-black">1</div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Pilih Kategori Mutasi</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pilih tipe kejadian administrasi yang terjadi di rumah Anda</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: 'Newcomer', label: 'Tambah Anggota Keluarga', icon: UserPlus, desc: 'Pernikahan, tumpangan keluarga, atau pindah masuk ke hunian siber RT 02 yang sudah aktif', color: 'text-emerald-600', activeBg: 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/10' },
                      { id: 'MovedOut', label: 'Warga Pindah Keluar', icon: Share2, desc: 'Laporan perpindahan keluar atau domisili baru di luar wilayah administratif RT 02', color: 'text-blue-500', activeBg: 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/10' },
                      { id: 'Birth', label: 'Kelahiran Baru', icon: Heart, desc: 'Pemberitahuan resmi kelahiran buah hati atau kelahiran baru di dalam wilayah keluarga RT 02', color: 'text-rose-500', activeBg: 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/10' },
                      { id: 'Death', label: 'Kematian / Kedukaan', icon: Flag, desc: 'Berita duka pelaporan wafatnya anggota keluarga resmi demi ketertiban data kependudukan', color: 'text-slate-600', activeBg: 'bg-slate-100 border-slate-500 ring-2 ring-slate-500/10' }
                    ].map(type => {
                      const Icon = type.icon;
                      const isSelected = mutationType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => {
                            setMutationType(type.id as any);
                            setMutationStep(2);
                          }}
                          className={`
                            p-6 rounded-2xl flex items-start gap-4.5 border transition-all duration-300 text-left cursor-pointer w-full group
                            ${isSelected 
                              ? `${type.activeBg} text-slate-900 shadow-md` 
                              : 'bg-slate-50/50 text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'}
                          `}
                        >
                          <div className={`p-3.5 rounded-xl transition-all shadow-xs shrink-0 ${isSelected ? 'bg-white ' + type.color : 'bg-white border border-slate-200/80 text-slate-400 group-hover:text-emerald-600'}`}>
                            <Icon size={22} />
                          </div>
                          <div>
                            <span className="text-[11px] font-black uppercase tracking-widest block">{type.label}</span>
                            <p className={`text-[10px] font-medium leading-relaxed mt-1 ${isSelected ? 'text-slate-500' : 'text-slate-400'}`}>{type.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {mutationStep === 2 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                    <div className="w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center text-xs font-black">2</div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Informasi Dasar Kependudukan</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Identifikasi identitas warga siber kependudukan RT 02</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5">
                    <div className="space-y-2">
                      <label className="block text-[10.5px] font-black text-slate-450 uppercase tracking-widest ml-1">Nama Warga Terkait <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input 
                          className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:bg-white focus:border-emerald-500 hover:border-slate-300 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-xs" 
                          value={mutationName} 
                          onChange={e=>setMutationName(e.target.value)} 
                          required 
                          placeholder="Ketik nama lengkap warga bersangkutan"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10.5px] font-black text-slate-450 uppercase tracking-widest ml-1">No. HP / WhatsApp <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input 
                          className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:bg-white focus:border-emerald-500 hover:border-slate-300 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-xs" 
                          value={mutationPhone} 
                          onChange={e=>setMutationPhone(e.target.value)} 
                          required 
                          placeholder="WhatsApp aktif pelaku/pelapor (Contoh: 08123...)"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10.5px] font-black text-slate-450 uppercase tracking-widest ml-1">Tanggal Kejadian <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input 
                          type="date"
                          className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:bg-white focus:border-emerald-500 hover:border-slate-300 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-xs" 
                          value={mutationDate} 
                          onChange={e=>setMutationDate(e.target.value)} 
                          required 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10.5px] font-black text-slate-450 uppercase tracking-widest ml-1">Blok & No. Rumah Keluarga <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input 
                          className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:bg-white focus:border-emerald-500 hover:border-slate-300 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all uppercase shadow-xs" 
                          value={mutationHouseId} 
                          onChange={e=>setMutationHouseId(e.target.value.toUpperCase())} 
                          required 
                          placeholder="Contoh: C7-02"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setMutationStep(1)}
                      className="flex-1 py-4.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all cursor-pointer border border-slate-200/50"
                    >
                      Batal / Kembali
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        if (!mutationName || !mutationPhone || !mutationDate || !mutationHouseId) {
                          toast.error("Wajib melengkapi semua kolom dengan tanda bintang (*)");
                          return;
                        }
                        setMutationStep(3);
                      }}
                      className="flex-[2] py-4.5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md cursor-pointer"
                    >
                      Lanjut ke Detail Mutasi
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
                        <div className="space-y-2">
                          <label className="block text-[10.5px] font-black text-slate-450 uppercase tracking-widest ml-1">Alamat Asal Domisili Sebelumnya <span className="text-rose-500">*</span></label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-4 text-slate-400" size={15} />
                            <textarea 
                              className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold focus:bg-white focus:border-emerald-500 hover:border-slate-300 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-xs min-h-[85px] resize-none" 
                              value={prevAddress} 
                              onChange={e=>setPrevAddress(e.target.value)} 
                              required 
                              placeholder="Ketik alamat asal lengkap sebelumnya (Kabupaten, Provinsi, RT/RW, dsb)"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5">
                          <div className="space-y-2">
                            <label className="block text-[10.5px] font-black text-slate-450 uppercase tracking-widest ml-1">Alasan Kepindahan <span className="text-rose-500">*</span></label>
                            <input 
                              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold focus:bg-white focus:border-emerald-500 hover:border-slate-300 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-xs" 
                              value={moveReason} 
                              onChange={e=>setMoveReason(e.target.value)} 
                              required 
                              placeholder="Cek kerjaan, ikut orang tua, dinas dll"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10.5px] font-black text-slate-455 uppercase tracking-widest ml-1">Jumlah Anggota Keluarga Baru <span className="text-rose-500">*</span></label>
                            <input 
                              type="number"
                              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold focus:bg-white focus:border-emerald-500 hover:border-slate-300 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-xs" 
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
                          <div className="space-y-4 p-5 md:p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200/85">
                            <div className="flex items-center gap-2 mb-2">
                              <Users size={16} className="text-emerald-605" />
                              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Identitas Pengikut Anggota Keluarga Lainnya</h4>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                              {familyMembers.map((member, idx) => (
                                <div key={idx} className="space-y-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                  <p className="text-[10px] font-black text-emerald-650 uppercase tracking-widest">Anggota Keluarga #{idx + 2}</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input 
                                      placeholder="Nama Lengkap Sesuai KTP"
                                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-colors"
                                      value={member.name}
                                      onChange={e => {
                                        const updated = [...familyMembers];
                                        updated[idx].name = e.target.value;
                                        setFamilyMembers(updated);
                                      }}
                                      required
                                    />
                                    <input 
                                      placeholder="Kekerabatan (Istri/Anak/Orang tua)"
                                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-colors"
                                      value={member.relationship}
                                      onChange={e => {
                                        const updated = [...familyMembers];
                                        updated[idx].relationship = e.target.value;
                                        setFamilyMembers(updated);
                                      }}
                                      required
                                    />
                                    <input 
                                      placeholder="Nomor NIK KTP (16 Digit)"
                                      maxLength={16}
                                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-colors md:col-span-2"
                                      value={member.nik}
                                      onChange={e => {
                                        const updated = [...familyMembers];
                                        updated[idx].nik = e.target.value.replace(/\D/g, '');
                                        setFamilyMembers(updated);
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5">
                          <div className="space-y-2">
                            <label className="block text-[10.5px] font-black text-slate-455 uppercase tracking-widest ml-1">Status Kepemilikan Hunian <span className="text-rose-500">*</span></label>
                            <div className="flex gap-2.5">
                              {['Tetap', 'Sewa', 'Rumah Keluarga'].map((type) => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => setMutationResidenceType(type as any)}
                                  className={`
                                    flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer
                                    ${mutationResidenceType === type 
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/10' 
                                      : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200/85'}
                                  `}
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-[10.5px] font-black text-slate-455 uppercase tracking-widest ml-1">Keyakinan / Agama <span className="text-rose-500">*</span></label>
                            <div className="relative">
                              <select 
                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                                value={mutationReligion}
                                onChange={e => setMutationReligion(e.target.value)}
                              >
                                <option value="Islam">Islam</option>
                                <option value="Kristen">Kristen</option>
                                <option value="Katolik">Katolik</option>
                                <option value="Hindu">Hindu</option>
                                <option value="Budha">Budha</option>
                                <option value="Konghucu">Konghucu</option>
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <Building size={12} />
                              </div>
                            </div>
                          </div>

                          <div className="md:col-span-2 space-y-2">
                            <label className="block text-[10.5px] font-black text-slate-455 uppercase tracking-widest ml-1">Klasifikasi Kerentanan Sosial / Medis <span className="text-slate-450 font-medium">(Bisa Pilih Lebih Dari Satu)</span></label>
                            <div className="flex flex-wrap gap-2">
                              {['Ibu Hamil', 'Bayi', 'Balita', 'Lansia', 'Disabilitas', 'Janda/Duda'].map((v) => {
                                const isSelected = mutationVulnerability.includes(v);
                                return (
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
                                    className={`
                                      px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer
                                      ${isSelected 
                                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-500/10' 
                                        : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200/85'}
                                    `}
                                  >
                                    {v}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {mutationType === 'MovedOut' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                          <label className="block text-[10.5px] font-black text-slate-455 uppercase tracking-widest ml-1">Alamat Tujuan Kepindahan <span className="text-rose-500">*</span></label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-4 text-slate-400" size={15} />
                            <textarea 
                              className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold focus:bg-white focus:border-emerald-500 hover:border-slate-300 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-xs min-h-[85px] resize-none" 
                              value={newAddress} 
                              onChange={e=>setNewAddress(e.target.value)} 
                              required 
                              placeholder="Ketik alamat tujuan mutasi lengkap baru Anda"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10.5px] font-black text-slate-455 uppercase tracking-widest ml-1">Alasan Pindah Keluar <span className="text-rose-500">*</span></label>
                          <input 
                            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold focus:bg-white focus:border-emerald-500 hover:border-slate-300 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-xs" 
                            value={moveReason} 
                            onChange={e=>setMoveReason(e.target.value)} 
                            required 
                            placeholder="Cth: Ikut Orang Tua, Pekerjaan Baru, dsb"
                          />
                        </div>
                      </div>
                    )}

                    {mutationType === 'Birth' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-[10.5px] font-black text-slate-455 uppercase tracking-widest ml-1">Nama Ayah Kandung <span className="text-rose-500">*</span></label>
                            <input 
                              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold focus:bg-white focus:border-emerald-500 hover:border-slate-300 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-xs" 
                              value={fatherName} 
                              onChange={e=>setFatherName(e.target.value)} 
                              required 
                              placeholder="Ketik nama ayah"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10.5px] font-black text-slate-455 uppercase tracking-widest ml-1">Nama Ibu Kandung <span className="text-rose-500">*</span></label>
                            <input 
                              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold focus:bg-white focus:border-emerald-500 hover:border-slate-300 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-xs" 
                              value={motherName} 
                              onChange={e=>setMotherName(e.target.value)} 
                              required 
                              placeholder="Ketik nama ibu"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10.5px] font-black text-slate-455 uppercase tracking-widest ml-1">Jenis Kelamin Bayi <span className="text-rose-500">*</span></label>
                          <div className="flex gap-4">
                            {['Laki-laki', 'Perempuan'].map((g) => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => setMutationGender(g as any)}
                                className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer ${mutationGender === g ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/10' : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'}`}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {mutationType === 'Death' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-[10.5px] font-black text-slate-455 uppercase tracking-widest ml-1">Penyebab Wafat <span className="text-rose-500">*</span></label>
                            <input 
                              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold focus:bg-white focus:border-emerald-500 hover:border-slate-300 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-xs" 
                              value={deathCause} 
                              onChange={e=>setDeathCause(e.target.value)} 
                              required 
                              placeholder="Sakit, lanjut usia, kecelakaan, dsb"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10.5px] font-black text-slate-455 uppercase tracking-widest ml-1">Lokasi Wafat / Berpulang <span className="text-rose-500">*</span></label>
                            <input 
                              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold focus:bg-white focus:border-emerald-500 hover:border-slate-300 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-xs" 
                              value={deathPlace} 
                              onChange={e=>setDeathPlace(e.target.value)} 
                              required 
                              placeholder="Rumah duka, RSUD Undata, dsb"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-[10.5px] font-black text-slate-455 uppercase tracking-widest ml-1">
                        {mutationType === 'Newcomer' ? 'Catatan Tambahan Kedatangan' : 
                         mutationType === 'MovedOut' ? 'Catatan Tambahan Kepindahan' : 
                         mutationType === 'Birth' ? 'Catatan Tambahan Kelahiran' : 
                         'Catatan Tambahan Kedukaan'}
                      </label>
                      <textarea 
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold focus:bg-white focus:border-emerald-500 hover:border-slate-300 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all min-h-[92px] resize-none shadow-xs" 
                        value={mutationDesc} 
                        onChange={e=>setMutationDesc(e.target.value)} 
                        placeholder={
                          mutationType === 'Newcomer' ? 'Ketik keterangan tambahan mengenai kepindahan masuk...' : 
                          mutationType === 'MovedOut' ? 'Ketik keterangan tambahan mengenai kepindahan keluar...' : 
                          mutationType === 'Birth' ? 'Ketik rincian persalinan atau info bayi...' : 
                          'Ketik keterangan tambahan terkait pemakaman / kedukaan...'
                        }
                      />
                    </div>

                    <div className="p-5 md:p-7 bg-emerald-50/55 border border-emerald-100 rounded-2xl space-y-4 shadow-xs">
                      <div className="flex items-center gap-3.5">
                        <div className="p-3 bg-slate-900 text-white rounded-xl shadow-md">
                          {mutationType === 'Newcomer' ? <Users size={16} /> : <Lock size={16} />}
                        </div>
                        <div>
                          <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-wider">
                            {mutationType === 'Newcomer' ? 'Otoritas Verifikasi Warga Baru' : 'Otoritas Verifikasi Pelapor'}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                            {mutationType === 'Newcomer' 
                              ? 'Demi validasi siber kependudukan RT 02, masukkan PIN rumah yang dituju.' 
                              : 'Untuk menyetujui transaksi ini, gunakan PIN rumah aktif Anda.'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 pt-1">
                        <label className="block text-[9px] font-black text-emerald-700 uppercase tracking-widest ml-1">
                          Kredit PIN Rumah <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input 
                            type={showPin ? "text" : "password"} 
                            placeholder="Maksimal 6 Digit Angka PIN" 
                            maxLength={6}
                            className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-xs font-black focus:border-emerald-500 outline-none transition-all text-center tracking-widest shadow-xs" 
                            value={accessCode} 
                            onChange={e=>setAccessCode(e.target.value.replace(/\D/g, ''))} 
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                          >
                            {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100">
                    <button 
                      type="button"
                      onClick={() => setMutationStep(2)}
                      className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all cursor-pointer border border-slate-200"
                    >
                      Kembali ke Langkah 2
                    </button>
                    <Button 
                      type="submit" 
                      onClick={handleSubmitMutasi}
                      className="flex-[2] py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 transition-all duration-300 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send size={14} /> Kirim Form Mutasi RT 02
                    </Button>
                  </div>
                </motion.div>
              )}
            </form>
          </motion.div>
        )}

        {activeTab === 'history' && (() => {
          // Calculate filtered history list inside an IIFE to isolate scope
          const filteredHistory = localHistory.filter(item => {
            if (historyFilter !== 'all' && item.category !== historyFilter) return false;
            if (historySearchTerm.trim()) {
              const queryStr = historySearchTerm.toLowerCase();
              const idMatch = (item.id || '').toLowerCase().includes(queryStr);
              const titleMatch = (item.title || '').toLowerCase().includes(queryStr);
              const nameMatch = (item.applicantName || item.reporterName || item.guestName || item.name || '').toLowerCase().includes(queryStr);
              return idMatch || titleMatch || nameMatch;
            }
            return true;
          });

          // Helper to map statuses into a 3-step timeline
          const getStatusStepInfo = (category: string, status: string) => {
            const rawStatus = (status || '').toLowerCase().trim();
            let currentStep = 1;
            let statusColor = "amber"; // amber, indigo, emerald, rose
            let statusLabel = "Menunggu Antrean";
            let statusDesc = "Permohonan Anda telah terdaftar dan mengantre di sistem RT 02. Menunggu peninjauan pengurus.";
            
            if (category === 'Surat') {
              if (['disetujui', 'approved', 'selesai', 'issued', 'aktif'].includes(rawStatus)) {
                currentStep = 3;
                statusColor = "emerald";
                statusLabel = "Surat Resmi Terbit";
                statusDesc = "Surat pengantar digital selesai diverifikasi, ditandatangani Ketua RT, dan diterbitkan resmi.";
              } else if (['diproses', 'review', 'ditinjau', 'pemeriksaan'].includes(rawStatus)) {
                currentStep = 2;
                statusColor = "indigo";
                statusLabel = "Pemeriksaan Dokumen";
                statusDesc = "Pengurus RT sedang memverifikasi rujukan kependudukan dan memvalidasi silsilah KK.";
              } else if (['ditolak', 'rejected', 'batal'].includes(rawStatus)) {
                currentStep = 3;
                statusColor = "rose";
                statusLabel = "Pengajuan Ditolak";
                statusDesc = "Mohon maaf, pengajuan Anda tidak dapat diterbitkan. Hubungi Ketua RT untuk petunjuk lanjut.";
              }
            } else if (category === 'Laporan') {
              if (['selesai', 'completed', 'sukses', 'tuntas'].includes(rawStatus)) {
                currentStep = 3;
                statusColor = "emerald";
                statusLabel = "Laporan Selesai";
                statusDesc = "Keluhan Anda telah diproses, dituntaskan, dan diarsipkan oleh petugas RT 02.";
              } else if (['diproses', 'peninjauan', 'perbaikan', 'investigasi', 'action'].includes(rawStatus)) {
                currentStep = 2;
                statusColor = "indigo";
                statusLabel = "Sedang Ditangani";
                statusDesc = "Laporan sedang diproses dan petugas ditunjuk dikoordinasikan untuk investigasi lapangan.";
              } else if (['ditolak', 'ditangguhkan'].includes(rawStatus)) {
                currentStep = 3;
                statusColor = "rose";
                statusLabel = "Laporan Ditangguhkan";
                statusDesc = "Penyidikan dihentikan karena rujukan lapangan tidak cocok dengan deskripsi laporan.";
              }
            } else if (category === 'Tamu') {
              if (['completed', 'selesai'].includes(rawStatus)) {
                currentStep = 3;
                statusColor = "emerald";
                statusLabel = "Kunjungan Berakhir";
                statusDesc = "Masa singgah tamu telah berakhir sepenuhnya dan pelaporan resmi diarsipkan.";
              } else if (['active', 'berjalan', 'aktif', 'tinggal'].includes(rawStatus) || !rawStatus) {
                currentStep = 2;
                statusColor = "indigo";
                statusLabel = "Tamu Bermalam Aktif";
                statusDesc = "Tamu terdaftar aktif mendiami rukun tetangga dengan pengawasan ketertiban lingkungan.";
              }
            } else if (category === 'Mutasi') {
              if (['approved', 'disetujui', 'selesai'].includes(rawStatus)) {
                currentStep = 3;
                statusColor = "emerald";
                statusLabel = "Sensus Diperbarui";
                statusDesc = "Data sensus mutasi kependudukan Anda selesai diarsipkan di Buku Registrasi Induk RT.";
              } else if (['pending', 'baru', 'proses'].includes(rawStatus) || !rawStatus) {
                currentStep = 2;
                statusColor = "indigo";
                statusLabel = "Verifikasi Kependudukan";
                statusDesc = "Petugas mencocokkan kelengkapan mutasi serta sinkronisasi alamat domisili rujukan.";
              } else if (['ditolak', 'rejected'].includes(rawStatus)) {
                currentStep = 3;
                statusColor = "rose";
                statusLabel = "Berkas Ditolak";
                statusDesc = "Data gagal diverifikasi karena berkas mutasi kependudukan rujukan tidak cocok.";
              }
            }
            
            return { currentStep, statusColor, statusLabel, statusDesc };
          };

          const handleClearHistory = () => {
            if (window.confirm("Apakah Anda yakin ingin menghapus seluruh riwayat pelacakan lokal di perangkat ini?")) {
              localStorage.removeItem('userRequestHistory');
              setLocalHistory([]);
              toast.success("Riwayat lokal berhasil dibersihkan");
            }
          };

          const handleDeleteHistoryItem = (idToDelete: string, e: React.MouseEvent) => {
            e.stopPropagation(); // Prevent triggering search parent click
            const updated = localHistory.filter(h => h.id !== idToDelete);
            setLocalHistory(updated);
            const sanitized = deepSanitize(updated);
            localStorage.setItem('userRequestHistory', safeJsonStringify(sanitized));
            toast.success("Item riwayat berhasil dihapus dari perangkat.");
          };

          const handleQuickTrack = (idToTrack: string) => {
            setStatusSearchId(idToTrack);
            handleSearchById(idToTrack);
            // Scroll smooth to top of tracking element
            const trackerElem = document.getElementById('status-tracker-header');
            if (trackerElem) {
              trackerElem.scrollIntoView({ behavior: 'smooth' });
            }
          };

          return (
            <motion.div 
              key="history"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-12"
            >
              {/* Status Tracker Search */}
              <div id="status-tracker-header" className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-slate-50 rounded-full opacity-50 pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-100">
                    <div className="flex items-center gap-5">
                      <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100">
                        <Clock size={28} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Pusat Lacak Status Layanan</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">Lacak status verifikasi surat rujukan, aduan warga, laporan tamu, atau mutasi secara real-time.</p>
                      </div>
                    </div>
                    {localHistory.length > 0 && (
                      <button 
                        onClick={handleClearHistory}
                        className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-rose-100 transition-all border border-rose-100/60 cursor-pointer"
                      >
                        <Trash2 size={14} /> Hapus Semua Riwayat
                      </button>
                    )}
                  </div>

                  {/* Dual Mode Switcher Tabs */}
                  <div className="flex flex-wrap p-1.5 bg-slate-100/80 rounded-2xl w-fit mb-8 border border-slate-200/50">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchMode('id');
                        setSearchResult(null);
                        setPhoneSearchResults(null);
                      }}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        searchMode === 'id'
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Cari dengan ID Unik
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchMode('phone_house');
                        setSearchResult(null);
                        setPhoneSearchResults(null);
                      }}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                        searchMode === 'phone_house'
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      No. WhatsApp / Rumah
                      <span className="bg-emerald-100 text-emerald-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Lebih Mudah</span>
                    </button>
                  </div>
                  
                  {searchMode === 'id' ? (
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 relative">
                        <input 
                          className="w-full p-5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-black focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all pl-14"
                          placeholder="Masukkan ID Unik Lacak (Format: 17xxxxxx atau hash ID)..."
                          value={statusSearchId}
                          onChange={e => setStatusSearchId(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSearchById(statusSearchId); }}
                        />
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      </div>
                      <Button 
                        onClick={() => handleSearchById(statusSearchId)}
                        disabled={isSearchingDb}
                        className="px-10 py-5 rounded-2xl text-sm font-black bg-indigo-600 hover:bg-indigo-700 text-white uppercase tracking-widest shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSearchingDb ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" /> Menghubungkan...
                          </>
                        ) : (
                          <>
                            Lacak Berkas <ArrowRight size={16} />
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                          <input 
                            className="w-full p-5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-black focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all pl-14"
                            placeholder="Contoh: 08123456789 (WhatsApp)..."
                            value={searchPhone}
                            onChange={e => setSearchPhone(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSearchByPhoneOrHouse(); }}
                          />
                          <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        </div>
                        <div className="md:w-64 relative">
                          <input 
                            className="w-full p-5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-black focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all pl-14"
                            placeholder="No. Rumah (Contoh: 04, B12)"
                            value={searchHouseId}
                            onChange={e => setSearchHouseId(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSearchByPhoneOrHouse(); }}
                          />
                          <Building className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        </div>
                        <Button 
                          onClick={handleSearchByPhoneOrHouse}
                          disabled={isSearchingDb}
                          className="px-10 py-5 rounded-2xl text-sm font-black bg-indigo-600 hover:bg-indigo-700 text-white uppercase tracking-widest shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isSearchingDb ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" /> Menganalisis...
                            </>
                          ) : (
                            <>
                              Cari Berkas <ArrowRight size={16} />
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 pl-1">
                        <Info size={14} className="text-slate-400 flex-shrink-0" />
                        <span>Sistem akan mencocokkan nomor WhatsApp / nomor rumah Anda untuk memunculkan riwayat permohonan surat, aduan, lapor tamu, & mutasi secara instan.</span>
                      </p>
                    </div>
                  )}

                  {/* Multi results from WhatsApp/House Lookup */}
                  {phoneSearchResults !== null && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 space-y-4 border-t border-slate-100 pt-8"
                    >
                      <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                        <div>
                          <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Ditemukan {phoneSearchResults.length} Berkas Layanan:</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Daftar arsip Anda terdaftar di Pengurus RT 02 yang cocok dengan kriteria pencarian Anda.</p>
                        </div>
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-black uppercase tracking-wider">Klik Berkas Untuk Status Detail</span>
                      </div>
                      
                      {phoneSearchResults.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {phoneSearchResults.map((item) => {
                            const rawStatus = (item.status || '').toLowerCase().trim();
                            let badgeColor = "bg-amber-100 text-amber-700";
                            if (['disetujui', 'approved', 'selesai', 'issued', 'aktif', 'tuntas', 'completed', 'active'].includes(rawStatus)) {
                              badgeColor = "bg-emerald-100 text-emerald-700";
                            } else if (['diproses', 'review', 'ditinjau', 'pemeriksaan', 'tinggal'].includes(rawStatus)) {
                              badgeColor = "bg-indigo-100 text-indigo-700";
                            } else if (['ditolak', 'rejected', 'batal', 'ditangguhkan'].includes(rawStatus)) {
                              badgeColor = "bg-rose-100 text-rose-700";
                            }

                            return (
                              <motion.div
                                key={item.id}
                                whileHover={{ y: -3, scale: 1.01 }}
                                onClick={() => {
                                  setSearchResult(item);
                                  setTimeout(() => {
                                    const detElem = document.getElementById('search-details-node');
                                    if (detElem) {
                                      detElem.scrollIntoView({ behavior: 'smooth' });
                                    }
                                  }, 100);
                                }}
                                className="p-5 bg-white border border-slate-100 hover:border-indigo-150 rounded-2.5xl shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                              >
                                <div className="relative z-10 space-y-3 w-full">
                                  <div className="flex justify-between items-center w-full">
                                    <span className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                      {item.category === 'Surat' ? '📄 Surat' : item.category === 'Laporan' ? '🚨 Aduan' : item.category === 'Tamu' ? '👥 Tamu' : '🔄 Mutasi'}
                                    </span>
                                    <span className={`px-2.5 py-1 ${badgeColor} rounded-xl text-[10px] font-black uppercase tracking-widest`}>
                                      {item.status || 'Terkirim'}
                                    </span>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">
                                      {item.title || item.requestType || `Layanan ${item.category}`}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 font-bold mt-1">
                                      Sandi: <span className="font-mono text-slate-500">{item.id.slice(0, 8)}...</span> | Pemohon: {item.applicantName || item.reporterName || item.guestName || item.name || 'Warga'}
                                    </p>
                                  </div>

                                  <div className="pt-3 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400">
                                    <span>{new Date(item.date || item.createdAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                    <span className="font-mono text-[10px] text-indigo-500 font-black group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                      Pilih & Lacak <ArrowRight size={12} />
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                          <p className="text-slate-400 text-xs font-semibold">Tidak ditemukan berkas kependudukan yang cocok dengan nomor WA atau Rumah tersebut.</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Live Search Result Component */}
                <AnimatePresence mode="wait">
                  {searchResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="mt-10 pt-10 border-t border-slate-100"
                    >
                      {searchResult === 'not_found' ? (
                        <div className="flex flex-col md:flex-row items-center gap-5 text-rose-600 bg-rose-50/60 p-6 md:p-8 rounded-[2rem] border border-rose-100/80 animate-pulse">
                          <XCircle size={36} className="text-rose-500 flex-shrink-0" />
                          <div className="text-center md:text-left">
                            <p className="text-base font-black">ID Layanan Tidak Ditemukan</p>
                            <p className="text-xs text-rose-700/80 mt-1 font-medium">Sistem tidak mendeteksi ID ini di database Surat, Laporan, Tamu, maupun Mutasi RT 02. Harap periksa kembali penulisan huruf atau angka ID Anda.</p>
                          </div>
                        </div>
                      ) : (() => {
                        const { currentStep, statusColor, statusLabel, statusDesc } = getStatusStepInfo(searchResult.category, searchResult.status);
                        
                        return (
                          <div id="search-details-node" className="bg-white p-6 md:p-10 rounded-[2.5rem] border-2 border-slate-100 shadow-xl relative overflow-hidden">
                            {/* Color Bar Indent on top */}
                            <div className={`absolute top-0 left-0 right-0 h-2 ${
                              statusColor === 'emerald' ? 'bg-emerald-500' :
                              statusColor === 'indigo' ? 'bg-indigo-500' :
                              statusColor === 'rose' ? 'bg-rose-500' : 'bg-amber-500'
                            }`} />
                            
                            <div className="relative z-10 space-y-8">
                              {/* Header details bar */}
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-50">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">{searchResult.category || 'Berkas'}</span>
                                    <span className="text-xs font-mono font-bold text-slate-400">ID: {searchResult.id}</span>
                                  </div>
                                  <h4 className="text-2xl font-black text-slate-900 leading-tight">
                                    {searchResult.title || searchResult.requestType || `Laporan ${searchResult.type || 'Layanan'}`}
                                  </h4>
                                </div>
                                <div className={`px-6 py-3 rounded-2xl border flex items-center gap-2 ${
                                  statusColor === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                  statusColor === 'indigo' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                  statusColor === 'rose' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                  <div className={`w-2.5 h-2.5 rounded-full ${
                                    statusColor === 'emerald' ? 'bg-emerald-500 animate-pulse' :
                                    statusColor === 'indigo' ? 'bg-indigo-500 animate-pulse' :
                                    statusColor === 'rose' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
                                  }`} />
                                  <span className="text-xs font-black uppercase tracking-widest">{statusLabel}</span>
                                </div>
                              </div>

                              {/* PARCEL-STYLE INTERACTIVE PROGRESS TRACK TIMELINE */}
                              <div className="py-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100/60">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Alur Pemprosesan Berkas</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                                  {/* Line Track on desktop */}
                                  <div className="hidden md:block absolute top-[1.35rem] left-[15%] right-[15%] h-0.5 bg-slate-200 pointer-events-none z-0">
                                    <div 
                                      className={`h-full transition-all duration-700 ${
                                        currentStep === 1 ? 'w-[0%]' :
                                        currentStep === 2 ? 'w-[50%] bg-indigo-500' :
                                        statusColor === 'rose' ? 'w-[100%] bg-rose-500' : 'w-[100%] bg-emerald-500'
                                      }`}
                                    />
                                  </div>

                                  {/* Step 1: Registrasi */}
                                  <div className="flex md:flex-col items-center md:text-center gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                                      <Check size={20} />
                                    </div>
                                    <div>
                                      <h5 className="font-extrabold text-slate-800 text-sm">Registrasi Berhasil</h5>
                                      <p className="text-[11px] text-slate-400 font-medium">Validasi sistem & antrean masuk.</p>
                                    </div>
                                  </div>

                                  {/* Step 2: Pemeriksaan */}
                                  <div className="flex md:flex-col items-center md:text-center gap-4 relative z-10">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                                      currentStep >= 2 
                                        ? (statusColor === 'rose' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20')
                                        : 'bg-white border-2 border-slate-200 text-slate-400'
                                    }`}>
                                      {currentStep > 2 ? <Check size={20} /> : <FileText size={18} className={currentStep === 2 ? "animate-pulse" : ""} />}
                                    </div>
                                    <div>
                                      <h5 className={`font-extrabold text-sm ${currentStep >= 2 ? 'text-slate-800' : 'text-slate-400'}`}>Verifikasi Pengurus</h5>
                                      <p className="text-[11px] text-slate-400 font-medium">Pemeriksaan database kependudukan.</p>
                                    </div>
                                  </div>

                                  {/* Step 3: Selesai */}
                                  <div className="flex md:flex-col items-center md:text-center gap-4 relative z-10">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                                      currentStep === 3
                                        ? (statusColor === 'rose' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20')
                                        : 'bg-white border-2 border-slate-200 text-slate-400'
                                    }`}>
                                      {statusColor === 'rose' ? <XCircle size={20} /> : (currentStep === 3 ? <CheckCircle2 size={20} /> : <ShieldCheck size={20} />)}
                                    </div>
                                    <div>
                                      <h5 className={`font-extrabold text-sm ${currentStep === 3 ? 'text-slate-800' : 'text-slate-400'}`}>
                                        {statusColor === 'rose' ? 'Pengajuan Ditolak' : 'Pengarsipan Selesai'}
                                      </h5>
                                      <p className="text-[11px] text-slate-400 font-medium">Arsip diterbitkan dan dimutakhirkan.</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-6 pt-5 border-t border-slate-100 flex items-start gap-4">
                                  <div className={`p-2 rounded-xl h-fit ${
                                    statusColor === 'emerald' ? 'bg-emerald-100/50 text-emerald-600' :
                                    statusColor === 'indigo' ? 'bg-indigo-100/50 text-indigo-600' :
                                    statusColor === 'rose' ? 'bg-rose-100/50 text-rose-600' : 'bg-amber-100/50 text-amber-600'
                                  }`}>
                                    <Info size={16} />
                                  </div>
                                  <p className="text-xs font-semibold text-slate-500 leading-relaxed">{statusDesc}</p>
                                </div>
                              </div>

                              {/* BENTO GRID DETAILS */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="space-y-4">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informasi Berkas</p>
                                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100/60 space-y-4">
                                    <div className="flex justify-between pb-3 border-b border-slate-200/50">
                                      <span className="text-xs font-bold text-slate-400">Pemohon / Pelapor</span>
                                      <span className="text-xs font-black text-slate-800">{searchResult.applicantName || searchResult.reporterName || searchResult.guestName || searchResult.name || 'Warga RT 02'}</span>
                                    </div>
                                    
                                    {searchResult.nik && (
                                      <div className="flex justify-between pb-3 border-b border-slate-200/50">
                                        <span className="text-xs font-bold text-slate-400">NIK (Sandi Kependudukan)</span>
                                        <span className="text-xs font-bold font-mono text-slate-800">{searchResult.nik.replace(/(\d{4})\d+(\d{4})/, '$1-******-$2')}</span>
                                      </div>
                                    )}

                                    {searchResult.houseId && (
                                      <div className="flex justify-between pb-3 border-b border-slate-200/50">
                                        <span className="text-xs font-bold text-slate-400">Nomor Rumah</span>
                                        <span className="text-xs font-mono font-black text-indigo-600">Rumah {searchResult.houseId}</span>
                                      </div>
                                    )}

                                    <div className="flex justify-between">
                                      <span className="text-xs font-bold text-slate-400">Tanggal Pengajuan</span>
                                      <span className="text-xs font-bold text-slate-800">
                                        {new Date(searchResult.date || searchResult.createdAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan / Rincian</p>
                                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100/60 h-[calc(100%-2rem)] flex flex-col justify-between">
                                    <div className="space-y-3">
                                      {searchResult.category === 'Surat' && (
                                        <p className="text-xs font-medium text-slate-600">
                                          Permohonan pembuatan <b>{searchResult.requestType || 'Surat Pengantar RT'}</b> untuk keperluan tertulis yang disetujui pengurus. Kode referansi sistem terlampir aman.
                                        </p>
                                      )}
                                      {searchResult.category === 'Laporan' && (
                                        <p className="text-xs font-medium text-slate-600">
                                          Laporan/Aduan kategori <b>{searchResult.type || 'Fasilitas umum'}</b>: 
                                          <span className="block mt-2 p-3 bg-white rounded-xl border border-slate-200/50 italic font-medium">"{searchResult.description || 'Tidak ada uraian.'}"</span>
                                        </p>
                                      )}
                                      {searchResult.category === 'Tamu' && (
                                        <p className="text-xs font-medium text-slate-600">
                                          Tamu berkunjung bernama <b>{searchResult.guestName}</b> tinggal selama <b>{searchResult.stayDuration || '1 Hari'}</b> untuk tujuan <b>"{searchResult.purpose || 'Silaturahmi'}"</b>.
                                        </p>
                                      )}
                                      {searchResult.category === 'Mutasi' && (
                                        <p className="text-xs font-medium text-slate-600">
                                          Laporaan mutasi kependudukan tipe <b>{searchResult.type === 'Newcomer' ? 'Warga Baru' : searchResult.type === 'MovedOut' ? 'Warga Pindah' : searchResult.type === 'Birth' ? 'Kelahiran' : 'Kematian'}</b> untuk memperbarui struktur Buku Sensus Warga.
                                        </p>
                                      )}
                                    </div>

                                    {/* Warnings / Terms */}
                                    <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-400 font-bold leading-normal">
                                      <Shield size={14} className="text-slate-300 flex-shrink-0" />
                                      Autentisitas sistem dijamin menggunakan sandi kriptografis validasi RT 02.
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* ACTIONS TOOLBAR */}
                              <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-4 justify-between items-center">
                                <div className="flex flex-wrap gap-3">
                                  {/* Re-download PDF of Letter if approved */}
                                  {searchResult.category === 'Surat' && (searchResult.status === 'Disetujui' || searchResult.status === 'Approved') && (
                                    <button 
                                      onClick={async () => {
                                        try {
                                          toast.info('Menyiapkan berkas PDF resmi...');
                                          await generateSuratPengantar(searchResult, pdfConfig, false);
                                          toast.success('Surat digital berhasil diunduh.');
                                        } catch (err) {
                                          console.error(err);
                                          toast.error('Gagal mengunduh dokumen.');
                                        }
                                      }}
                                      className="flex items-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
                                    >
                                      <Download size={14} /> Unduh Surat Resmi (PDF)
                                    </button>
                                  )}

                                  {/* Report Receipt PDF */}
                                  {searchResult.category === 'Laporan' && (
                                    <button 
                                      onClick={() => {
                                        try {
                                          generateReportReceiptPDF(searchResult, pdfConfig);
                                          toast.success('Tanda terima laporan berhasil diunduh.');
                                        } catch (err) {
                                          console.error(err);
                                          toast.error('Gagal membuat cetak struk.');
                                        }
                                      }}
                                      className="flex items-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
                                    >
                                      <Download size={14} /> Unduh Tanda Terima (PDF)
                                    </button>
                                  )}

                                  {/* Contact RT on WhatsApp */}
                                  <button 
                                    onClick={() => {
                                      const text = `Halo Pak RT, saya ingin menanyakan status pendaftaran dengan ID: *${searchResult.id}* berkategori *${searchResult.category || 'Berkas'}* atas nama *${searchResult.applicantName || searchResult.reporterName || searchResult.guestName || searchResult.name || 'Warga'}*. Mohon bantuannya untuk diperiksa. Terima kasih.`;
                                      window.open(`https://wa.me/${(pdfConfig.rtPhone || '6285961194621').toString().replace(/^0/, '62').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                                    }}
                                    className="flex items-center gap-2 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer border border-slate-200"
                                  >
                                    <MessageCircle size={14} className="text-emerald-500" /> Hubungi Ketua RT
                                  </button>
                                </div>

                                <button 
                                  onClick={() => setSearchResult(null)}
                                  className="px-5 py-3 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                  Tutup Detail
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Informative Bento Feature Cards for Public Usability */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-amber-50/50 p-8 md:p-10 rounded-[3rem] border border-amber-100/80 flex items-start gap-6 shadow-sm">
                  <div className="p-4 bg-white text-amber-600 rounded-2xl shadow-md shadow-amber-500/5 h-fit">
                    <ShieldAlert size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-amber-900 tracking-tight">Otentikasi Aman & Validasi QR</h4>
                    <p className="text-sm text-amber-800/80 mt-2 font-medium leading-relaxed">
                      Sistem pelayanan berkas dilengkapi <b>kode autentikasi pengaman</b> eksklusif. Lembaga publik rujukan luar (seperti Kelurahan, Bank, atau KUA) dapat memverifikasi keabsahan dokumen warga dengan mengetik kode ID di portal ini secara langsung.
                    </p>
                  </div>
                </div>

                <div className="bg-indigo-50/50 p-8 md:p-10 rounded-[3rem] border border-indigo-100/80 flex items-start gap-6 shadow-sm">
                  <div className="p-4 bg-white text-indigo-600 rounded-2xl shadow-md shadow-indigo-500/5 h-fit">
                    <History size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-indigo-900 tracking-tight">Pencatatan Seluler Mandiri</h4>
                    <p className="text-sm text-indigo-800/80 mt-2 font-medium leading-relaxed">
                      Untuk menjamin privasi kedaulatan data kependudukan luar, seluruh transaksi Anda terekam otomatis di memori lokal seluler Anda. Tidak dipasarkan secara komersial dan dilindungi enkripsi Firestore internal rukun tetangga.
                    </p>
                  </div>
                </div>
              </div>

              {/* LOCAL SERVICE HISTORY LIST BLOCK */}
              <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 space-y-8">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Riwayat Log Lokal Anda ({localHistory.length})</h3>
                    <p className="text-xs font-medium text-slate-400 mt-1">Daftar berkas atau pengajuan yang diajukan dari perangkat browser ini.</p>
                  </div>

                  {localHistory.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full xl:w-auto">
                      {/* FILTER LOCAL SEARCH PILLS */}
                      <div className="relative flex-1 sm:w-64">
                        <input 
                          className="w-full py-2.5 pl-10 pr-4 bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all"
                          placeholder="Cari riwayat lokal..."
                          value={historySearchTerm}
                          onChange={e => setHistorySearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      </div>

                      {/* Filter pill tabs row */}
                      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit">
                        {([
                          { id: 'all', label: 'Semua' },
                          { id: 'Surat', label: 'Surat' },
                          { id: 'Laporan', label: 'Aduan' },
                          { id: 'Tamu', label: 'Tamu' },
                          { id: 'Mutasi', label: 'Mutasi' }
                        ] as const).map(tabOpt => (
                          <button
                            key={tabOpt.id}
                            onClick={() => setHistoryFilter(tabOpt.id)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-wider ${
                              historyFilter === tabOpt.id 
                                ? 'bg-white text-indigo-600 shadow-sm' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            {tabOpt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {filteredHistory.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredHistory.map((item, idx) => {
                      const isProcessed = ['disetujui', 'selesai', 'approved', 'tuntas', 'completed'].includes((item.status || '').toLowerCase().trim());
                      const isRejected = ['ditolak', 'rejected', 'ditangguhkan'].includes((item.status || '').toLowerCase().trim());
                      
                      return (
                        <motion.div 
                          key={idx} 
                          whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.05)" }}
                          onClick={() => handleQuickTrack(item.id)}
                          className="bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:border-indigo-100 shadow-xl shadow-slate-200/10 cursor-pointer transition-all group relative overflow-hidden flex flex-col justify-between"
                        >
                          {/* Inner rounded glow inside element */}
                          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:bg-indigo-50/50 transition-colors duration-500" />
                          
                          <div className="relative z-10 space-y-4">
                            <div className="flex justify-between items-start">
                              <div className={`p-3.5 rounded-2xl shadow-sm ${
                                item.category === 'Surat' ? 'bg-indigo-600 text-white' :
                                item.category === 'Laporan' ? 'bg-amber-600 text-white' :
                                item.category === 'Tamu' ? 'bg-emerald-600 text-white' : 'bg-pink-600 text-white'
                              }`}>
                                {item.category === 'Surat' && <FileText size={20}/>}
                                {item.category === 'Laporan' && <AlertTriangle size={20}/>}
                                {item.category === 'Tamu' && <UserCheck size={20}/>}
                                {item.category === 'Mutasi' && <Users size={20}/>}
                              </div>
                              <div className="flex flex-col items-end gap-1.5">
                                <span className={`px-3.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                  isProcessed ? 'bg-emerald-100 text-emerald-600' :
                                  isRejected ? 'bg-rose-100 text-rose-600' :
                                  'bg-amber-100 text-amber-600'
                                }`}>
                                  {item.status || 'Terkirim'}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">#{item.id.slice(-6)}</span>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight leading-snug">{item.title}</h3>
                              <p className="text-[11px] font-bold text-slate-400 mt-2 flex items-center gap-1.5">
                                <Calendar size={12} />
                                {new Date(item.date || item.createdAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                          </div>

                          <div className="relative z-10 pt-4 mt-4 border-t border-slate-100/80 flex justify-between items-center text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${
                                isProcessed ? 'bg-emerald-500' :
                                isRejected ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
                              }`} />
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Log: {item.category}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity pr-2">Lacak Detail</span>
                              <button 
                                onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                                className="p-2 text-slate-300 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 rounded-lg transition-all"
                                title="Hapus dari daftar lokal"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200/50">
                    <div className="w-20 h-20 bg-white shadow-xl shadow-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300 mx-auto mb-6">
                      <History size={36} />
                    </div>
                    {localHistory.length > 0 ? (
                      <>
                        <h4 className="text-xl font-bold text-slate-700 mb-1">Hasil Pencarian Nihil</h4>
                        <p className="text-slate-400 font-medium max-w-sm mx-auto text-sm">Tidak ada riwayat lokal yang sesuai dengan kata kuncinya.</p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-black text-slate-800 mb-2">Belum Ada Riwayat Pelayanan</h3>
                        <p className="text-slate-400 font-semibold max-w-sm mx-auto text-xs leading-normal">
                          Saat Anda melakukan pengajuan Surat Pengantar, melaporkan warga yang bermalam, atau mendaftar mutasi rukun tetangga, riwayat lengkap Anda akan tercatat otomatis di panel ini.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </motion.div>
  );
};
