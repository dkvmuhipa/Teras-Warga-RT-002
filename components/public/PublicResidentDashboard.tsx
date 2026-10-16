import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Sun, Moon } from 'lucide-react';

import { useFinancial } from '../../context/FinancialContext';
import { getIndonesianMonthYear } from '../../src/utils/dateUtils';
import { 
  getHouseWasteFee, 
  getHouseWasteTier 
} from '../../constants';
import { 
  House, 
  GuestReport, 
  UpdateRequest, 
  PaymentStatus, 
  Report, 
  LetterRequest, 
  CommunitySkill, 
  UtilityOutage, 
  WaterMeterReading, 
  WaterUtilitySettings, 
  STBMRecord 
} from '../../types';
import { 
  subscribeToHouseGuestReports,
  addUpdateRequest,
  subscribeToHouseUpdateRequests,
  subscribeToHouseReports,
  subscribeToHouseLetters,
  addReportToDb,
  handleFirestoreError,
  OperationType,
  subscribeToPdfConfig,
  validateResidentAccess,
  subscribeToCollection,
  subscribeToHouseWaterMeterReadings,
  addWaterMeterReading,
  subscribeToSettings,
  calculateWaterUtilityBill,
  checkNikDuplicate,
  subscribeToSTBMRecords
} from '../../services/databaseService';
import { generateIuranReceiptPDF } from '../../services/pdfService';
import { UtilityOutageTrackerModal } from './UtilityOutageTrackerModal';

// Modular Dashboard Subcomponents
import { DashboardActiveTab, SkillFormData, ReportFormData } from './dashboard/types';
import { ResidentLoginGate } from './dashboard/ResidentLoginGate';
import { ResidentHeader } from './dashboard/ResidentHeader';
import { ResidentEidTab } from './dashboard/tabs/ResidentEidTab';
import { ResidentWaterTab } from './dashboard/tabs/ResidentWaterTab';
import { ResidentLettersTab } from './dashboard/tabs/ResidentLettersTab';
import { ResidentUpdateDataTab } from './dashboard/tabs/ResidentUpdateDataTab';
import { ResidentGuestsTab } from './dashboard/tabs/ResidentGuestsTab';
import { ResidentReportsTab } from './dashboard/tabs/ResidentReportsTab';
import { ResidentPointsTab } from './dashboard/tabs/ResidentPointsTab';
import { ResidentSkillsTab } from './dashboard/tabs/ResidentSkillsTab';
import { ResidentOutagesTab } from './dashboard/tabs/ResidentOutagesTab';
import { ResidentStbmTab } from './dashboard/tabs/ResidentStbmTab';
import { ResidentIuranModal } from './dashboard/modals/ResidentIuranModal';
import { ResidentReportModal } from './dashboard/modals/ResidentReportModal';
import { ResidentWaterModal } from './dashboard/modals/ResidentWaterModal';
import { ResidentSkillModal } from './dashboard/modals/ResidentSkillModal';

interface PublicResidentDashboardProps {
  houses: House[];
}

export const PublicResidentDashboard: React.FC<PublicResidentDashboardProps> = ({ houses }) => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as DashboardActiveTab | null;

  const [selectedHouseId, setSelectedHouseId] = useState<string>(
    sessionStorage.getItem('resident_house_id') || localStorage.getItem('resident_house_id') || ''
  );
  const [rememberSession, setRememberSession] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isOutageModalOpen, setIsOutageModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [tempHouseId, setTempHouseId] = useState('');
  const [pinError, setPinError] = useState(false);
  
  const [activeTab, setActiveTab] = useState<DashboardActiveTab>(
    (tabParam && ['eid', 'water', 'points', 'skills', 'outages', 'letters', 'update', 'guests', 'reports', 'stbm'].includes(tabParam)) 
      ? tabParam 
      : 'eid'
  );

  useEffect(() => {
    if (tabParam && ['eid', 'water', 'points', 'skills', 'outages', 'letters', 'update', 'guests', 'reports', 'stbm'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [stbmRecord, setStbmRecord] = useState<STBMRecord | null>(null);
  const [communitySkills, setCommunitySkills] = useState<CommunitySkill[]>([]);
  const [utilityOutages, setUtilityOutages] = useState<UtilityOutage[]>([]);
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [skillForm, setSkillForm] = useState<SkillFormData>({
    category: 'Pertukangan & Bangunan',
    title: '',
    description: '',
    phone: '',
    rateInfo: ''
  });

  const [guestReports, setGuestReports] = useState<GuestReport[]>([]);
  const [updateRequests, setUpdateRequests] = useState<UpdateRequest[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [letters, setLetters] = useState<LetterRequest[]>([]);
  const [pdfConfig, setPdfConfig] = useState<any>(null);

  // Water Meter States
  const [houseWaterReadings, setHouseWaterReadings] = useState<WaterMeterReading[]>([]);
  const [waterUtilityConfig, setWaterUtilityConfig] = useState<WaterUtilitySettings>({
    billingMode: 'pdam',
    providerName: 'PDAM Kota Palu',
    baseQuotaM3: 10,
    baseFee: 35000,
    ratePerM3: 3500,
    maintenanceFee: 0,
    readingDueDate: 20
  });
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);
  const [waterInputReading, setWaterInputReading] = useState<number | ''>('');
  const [waterPhoto, setWaterPhoto] = useState<string>('');
  const [isSubmittingWater, setIsSubmittingWater] = useState(false);
  
  // Data Privacy & Security Toggles
  const [showFullNiks, setShowFullNiks] = useState<Record<string, boolean>>({});
  
  const toggleNikVisibility = (id: string) => {
    setShowFullNiks(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatSensitiveNik = (nik: string, isVisible: boolean) => {
    if (!nik) return '-';
    if (isVisible) return nik;
    if (nik.length === 16) {
      return `${nik.slice(0, 4)}********${nik.slice(-4)}`;
    }
    return nik.length > 4 ? `${nik.slice(0, 2)}******${nik.slice(-2)}` : '******';
  };
  
  const { getPaymentStatus, settings, iuranPayments } = useFinancial();
  const currentHouse = houses.find(h => h.id === selectedHouseId);

  const currentMonth = getIndonesianMonthYear(new Date());
  const isPaidAir = currentHouse ? getPaymentStatus(currentHouse, 'Air', currentMonth) === PaymentStatus.PAID : true;
  const isPaidSampah = currentHouse ? getPaymentStatus(currentHouse, 'Sampah', currentMonth) === PaymentStatus.PAID : true;
  const isAllPaid = isPaidAir && isPaidSampah;
  const dayOfMonth = new Date().getDate();
  const isMandatory = dayOfMonth >= 20;

  // CITIZEN SCORE & GAMIFICATION SYSTEM
  const calculateHousePoints = (h: House) => {
    let score = 50; // Poin dasar registrasi KK
    if (getPaymentStatus(h, 'Air', currentMonth) === PaymentStatus.PAID && getPaymentStatus(h, 'Sampah', currentMonth) === PaymentStatus.PAID) {
      score += 50;
    }
    if (h.rondaPoints) {
      score += h.rondaPoints;
    }
    if (h.isVerified) {
      score += 30;
    }
    score += (h.occupants || 1) * 10;
    return score;
  };

  const currentPoints = currentHouse ? calculateHousePoints(currentHouse) : 0;
  
  const allHousePoints = houses
    .filter(h => h.status === 'Occupied')
    .map(h => ({
      house: h,
      points: calculateHousePoints(h)
    }))
    .sort((a, b) => b.points - a.points);

  const currentRank = allHousePoints.findIndex(item => item.house.id === selectedHouseId) + 1;
  const citizenTier = currentPoints >= 200 ? { name: 'Warga Teladan Platinum', color: 'from-amber-400 to-amber-600 text-white', badge: '👑 Platinum' }
    : currentPoints >= 140 ? { name: 'Warga Teladan Gold', color: 'from-yellow-400 to-amber-500 text-slate-900', badge: '🥇 Gold' }
    : currentPoints >= 100 ? { name: 'Warga Aktif Silver', color: 'from-slate-300 to-slate-400 text-slate-900', badge: '🥈 Silver' }
    : { name: 'Warga Rukun Bronze', color: 'from-amber-700 to-amber-900 text-white', badge: '🥉 Bronze' };

  const airFee = settings?.airFee !== undefined ? Number(settings.airFee) : 0;
  const currentHouseWasteTier = getHouseWasteTier(currentHouse);
  const sampahFee = getHouseWasteFee(currentHouse, settings?.sampahTiers);
  const totalBaseFee = airFee + sampahFee;
  const unpaidAirFee = isPaidAir ? 0 : airFee;
  const unpaidSampahFee = isPaidSampah ? 0 : sampahFee;
  const totalRemainingFee = unpaidAirFee + unpaidSampahFee;
  const totalFee = totalBaseFee;

  // Handle Download Kwitansi PDF Resmi
  const handleDownloadReceipt = () => {
    if (!currentHouse) return;
    const existingPayment = iuranPayments?.find(
      (p: any) => p.houseId === currentHouse.id && (p.month === currentMonth || p.period === currentMonth)
    );

    const paymentData = existingPayment || {
      id: `KAS-${currentHouse.block}${currentHouse.number}-${Date.now().toString().slice(-6)}`,
      headOfFamily: currentHouse.headOfFamily || 'Warga RT 002',
      block: currentHouse.block,
      number: currentHouse.number,
      type: airFee > 0 ? 'Both' : 'Sampah',
      month: currentMonth,
      date: new Date().toISOString(),
      amount: totalFee
    };

    try {
      generateIuranReceiptPDF(paymentData, pdfConfig);
      toast.success('Kwitansi resmi iuran berhasil diunduh!');
    } catch (err) {
      console.error('Error generating receipt PDF:', err);
      toast.error('Gagal mengunduh kwitansi PDF.');
    }
  };

  // Modern Greeting Helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return { text: 'Selamat Pagi', icon: Sun, color: 'text-amber-400 bg-amber-500/10 border-amber-400/20' };
    if (hour >= 11 && hour < 15) return { text: 'Selamat Siang', icon: Sun, color: 'text-amber-300 bg-amber-500/10 border-amber-300/20' };
    if (hour >= 15 && hour < 18) return { text: 'Selamat Sore', icon: Sun, color: 'text-orange-400 bg-orange-500/10 border-orange-400/20' };
    return { text: 'Selamat Malam', icon: Moon, color: 'text-indigo-300 bg-indigo-500/10 border-indigo-400/20' };
  };
  const greeting = getGreeting();

  const pendingLettersCount = letters.filter(l => l.status === 'Menunggu' || l.status === 'Pending').length;
  const activeReportsCount = reports.filter(r => r.status !== 'Selesai').length;
  const maleCount = currentHouse?.familyMembers?.filter((m: any) => m.gender === 'Laki-laki').length || (currentHouse?.gender === 'Laki-laki' ? 1 : 0);
  const femaleCount = currentHouse?.familyMembers?.filter((m: any) => m.gender === 'Perempuan').length || (currentHouse?.gender === 'Perempuan' ? 1 : 0);

  useEffect(() => {
    const unsubPdfConfig = subscribeToPdfConfig(setPdfConfig);
    const unsubSkills = subscribeToCollection('communitySkills', (data) => setCommunitySkills(data as CommunitySkill[]));
    const unsubOutages = subscribeToCollection('utilityOutages', (data) => setUtilityOutages(data as UtilityOutage[]));
    const unsubSettings = subscribeToSettings((data) => {
      if (data?.waterUtility) {
        setWaterUtilityConfig({
          billingMode: data.waterUtility.billingMode ?? 'pdam',
          providerName: data.waterUtility.providerName ?? 'PDAM Kota Palu',
          baseQuotaM3: data.waterUtility.baseQuotaM3 ?? 10,
          baseFee: data.waterUtility.baseFee ?? 35000,
          ratePerM3: data.waterUtility.ratePerM3 ?? 3500,
          maintenanceFee: data.waterUtility.maintenanceFee ?? 0,
          readingDueDate: data.waterUtility.readingDueDate ?? 20,
          minUsageM3: data.waterUtility.minUsageM3 ?? 10,
          autoSyncToBills: data.waterUtility.autoSyncToBills ?? true
        });
      }
    });

    return () => {
      unsubPdfConfig();
      unsubSkills();
      unsubOutages();
      unsubSettings();
    };
  }, []);

  useEffect(() => {
    if (!selectedHouseId) {
      setGuestReports([]);
      setUpdateRequests([]);
      setReports([]);
      setLetters([]);
      setHouseWaterReadings([]);
      setStbmRecord(null);
      return;
    }
    
    const unsubGuests = subscribeToHouseGuestReports(selectedHouseId, setGuestReports);
    const unsubUpdates = subscribeToHouseUpdateRequests(selectedHouseId, setUpdateRequests);
    const unsubReports = subscribeToHouseReports(selectedHouseId, setReports);
    const unsubLetters = subscribeToHouseLetters(selectedHouseId, setLetters);

    const currentH = houses.find(h => h.id === selectedHouseId);
    const houseIdentifier = currentH ? `${currentH.block}-${currentH.number}` : selectedHouseId;
    const unsubWater = subscribeToHouseWaterMeterReadings(houseIdentifier, (data) => {
      const sorted = [...data].sort((a, b) => b.period.localeCompare(a.period));
      setHouseWaterReadings(sorted);
    });

    const unsubSTBM = subscribeToSTBMRecords((records) => {
      const found = records.find(r => 
        r.houseId === selectedHouseId || 
        r.id === `stbm_${selectedHouseId}` || 
        (currentH && r.block === currentH.block && r.number === currentH.number)
      );
      if (found) {
        setStbmRecord(found);
      } else if (currentH) {
        setStbmRecord({
          id: `stbm_${currentH.id}`,
          houseId: currentH.id,
          block: currentH.block,
          number: currentH.number,
          headOfFamily: currentH.headOfFamily,
          occupants: currentH.occupants || 1,
          hasHealthyLatrine: true,
          isBABS: false,
          hasCTPS: true,
          safeWaterAndFood: true,
          wasteManagement: true,
          liquidWasteManagement: true,
          hasCleanWaterAccess: true,
          hasSTBMTriggering: true,
          needsFollowUp: false,
          problemType: '',
          notes: '',
          updatedAt: new Date().toISOString()
        });
      }
    });
    
    return () => {
      unsubGuests();
      unsubUpdates();
      unsubReports();
      unsubLetters();
      unsubWater();
      unsubSTBM();
    };
  }, [selectedHouseId, houses]);

  // Current active period and meter values
  const currentWaterPeriod = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  })();

  const currentWaterReading = houseWaterReadings.find(r => r.period === currentWaterPeriod);
  const previousWaterReading = houseWaterReadings.find(r => r.period < currentWaterPeriod);
  const previousReadingNumber = previousWaterReading ? previousWaterReading.currentReading : 0;

  // Handle Water Meter Photo with Client Canvas Compression
  const handleWaterPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 1000;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setWaterPhoto(canvas.toDataURL('image/jpeg', 0.75));
        } else {
          setWaterPhoto(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Submit Water Meter Reading
  const handleSubmitWaterMeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHouseId || waterInputReading === '') {
      toast.error('Harap masukkan angka meteran air.');
      return;
    }

    const currentHouseData = houses.find(h => h.id === selectedHouseId);
    const houseIdentifier = currentHouseData ? `${currentHouseData.block}-${currentHouseData.number}` : selectedHouseId;
    const currentVal = Number(waterInputReading);
    const prevVal = Number(previousReadingNumber);

    if (currentVal < prevVal) {
      toast.error(`Angka meteran (${currentVal} m³) tidak boleh lebih rendah dari bulan lalu (${prevVal} m³).`);
      return;
    }

    setIsSubmittingWater(true);
    try {
      const usage = Math.max(0, currentVal - prevVal);
      const bill = calculateWaterUtilityBill(usage, waterUtilityConfig);

      await addWaterMeterReading({
        houseId: houseIdentifier,
        period: currentWaterPeriod,
        previousReading: prevVal,
        currentReading: currentVal,
        usage,
        ratePerM3: waterUtilityConfig.ratePerM3,
        maintenanceFee: waterUtilityConfig.maintenanceFee,
        baseFee: bill.baseFee,
        excessUsage: bill.excessUsage,
        excessFee: bill.excessFee,
        totalAmount: bill.totalAmount,
        photoUrl: waterPhoto || '',
        recordedBy: 'Warga',
        recordedByName: currentHouseData ? currentHouseData.headOfFamily : 'Warga Mandiri',
        recordedAt: new Date().toISOString(),
        status: 'Menunggu Verifikasi',
        adminNotes: ''
      });

      toast.success('Pencatatan meter air mandiri berhasil dikirim! Menunggu verifikasi pengurus RT.');
      setIsWaterModalOpen(false);
      setWaterInputReading('');
      setWaterPhoto('');
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengirim catatan meter air.');
    } finally {
      setIsSubmittingWater(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await validateResidentAccess(tempHouseId, pinInput);
    if (isValid) {
      const house = houses.find(h => h.id === tempHouseId);
      setSelectedHouseId(tempHouseId);

      const resName = house ? house.headOfFamily : 'Warga';
      const resLoc = house ? `Blok ${house.block}-${house.number}` : `Blok ${tempHouseId}`;

      if (rememberSession) {
        localStorage.setItem('resident_house_id', tempHouseId);
        localStorage.setItem('resident_name', resName);
        localStorage.setItem('resident_location', resLoc);
      } else {
        sessionStorage.setItem('resident_house_id', tempHouseId);
        sessionStorage.setItem('resident_name', resName);
        sessionStorage.setItem('resident_location', resLoc);
        localStorage.removeItem('resident_house_id');
        localStorage.removeItem('resident_name');
        localStorage.removeItem('resident_location');
      }

      setIsPinModalOpen(false);
      setPinInput('');
      setPinError(false);
      toast.success(`Selamat datang, ${resName}!`, {
        description: `Berhasil masuk ke portal hunian ${resLoc}.`
      });
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 2000);
    }
  };

  const handleLogout = () => {
    setSelectedHouseId('');
    setTempHouseId('');
    setPinInput('');
    setPinError(false);

    setGuestReports([]);
    setUpdateRequests([]);
    setReports([]);
    setLetters([]);
    setHouseWaterReadings([]);
    setShowFullNiks({});
    setSelectedRequest(null);
    setWaterPhoto('');
    setWaterInputReading('');
    setIsUpdateModalOpen(false);
    setIsReportModalOpen(false);
    setIsIuranModalOpen(false);
    setIsWaterModalOpen(false);
    setActiveTab('eid');

    localStorage.removeItem('resident_house_id');
    localStorage.removeItem('resident_name');
    localStorage.removeItem('resident_location');
    sessionStorage.removeItem('resident_house_id');
    sessionStorage.removeItem('resident_name');
    sessionStorage.removeItem('resident_location');

    toast.success('Sesi portal warga telah keluar.', {
      description: 'Seluruh data hunian dan profil Anda telah dibersihkan secara aman dari perangkat ini.'
    });
  };

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UpdateRequest | null>(null);
  const [updateForm, setUpdateForm] = useState({
    headOfFamily: '',
    gender: 'Laki-laki' as any,
    birthPlace: '',
    birthDate: '',
    phone: '',
    occupants: 0,
    residenceType: 'Tetap' as any,
    nik: '',
    kkNumber: '',
    maritalStatus: 'Belum Kawin' as any,
    religion: '',
    education: '',
    job: '',
    jobCategory: '',
    bloodType: '-' as any,
    nationality: 'WNI',
    ktpStatus: 'Sesuai Domisili' as any,
    addressKtp: '',
    bpjsStatus: 'Tidak Ada' as any,
    vehicleCount: 0,
    twoWheelCount: 0,
    fourWheelCount: 0,
    ownerName: '',
    ownerPhone: '',
    isPKH: false,
    isBLT: false,
    isBPNT: false,
    isBansosLain: false,
    bansosLainName: '',
    economicStatus: 'Sejahtera' as any,
    pregnantCount: 0,
    babyCount: 0,
    toddlerCount: 0,
    teenagerCount: 0,
    adultCount: 0,
    elderlyCount: 0,
    widowCount: 0,
    childCount: 0,
    familyMembers: [] as any[],
    hasBusiness: false,
    businessName: '',
    businessCategory: 'Kuliner & Makanan',
    businessDescription: '',
    businessPhone: '',
    businessLocation: 'Di Rumah',
    isUmkmRegistered: true,
    reason: ''
  });

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isIuranModalOpen, setIsIuranModalOpen] = useState(false);
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [selectedReportDetail, setSelectedReportDetail] = useState<Report | null>(null);
  const [reportForm, setReportForm] = useState<ReportFormData>({
    type: 'Keamanan',
    description: '',
  });

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.description) {
      toast.error("Mohon isi deskripsi laporan");
      return;
    }

    setIsSubmittingReport(true);
    try {
      await addReportToDb({
        ...reportForm,
        reporterName: currentHouse?.headOfFamily || 'Warga',
        reporterHouseId: selectedHouseId,
        date: new Date().toISOString(),
        status: 'Baru'
      });
      toast.success("Laporan berhasil dikirim!");
      setIsReportModalOpen(false);
      setReportForm({ type: 'Keamanan', description: '' });
    } catch (error) {
      toast.error("Gagal mengirim laporan");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  useEffect(() => {
    if (currentHouse) {
      setUpdateForm({
        headOfFamily: currentHouse.headOfFamily,
        gender: currentHouse.gender || 'Laki-laki',
        birthPlace: currentHouse.birthPlace || '',
        birthDate: currentHouse.birthDate || '',
        phone: currentHouse.phone || '',
        occupants: currentHouse.occupants,
        residenceType: currentHouse.residenceType || 'Tetap',
        nik: currentHouse.nik || '',
        kkNumber: currentHouse.kkNumber || '',
        maritalStatus: currentHouse.maritalStatus || 'Belum Kawin',
        religion: currentHouse.religion || '',
        education: currentHouse.education || '',
        job: currentHouse.job || '',
        jobCategory: currentHouse.jobCategory || '',
        bloodType: currentHouse.bloodType || '-',
        nationality: currentHouse.nationality || 'WNI',
        ktpStatus: currentHouse.ktpStatus || (currentHouse.addressKtp?.toLowerCase().includes('tondo') || currentHouse.addressKtp?.toLowerCase().includes('pue lombe') ? 'Sesuai Domisili' : (currentHouse.addressKtp ? 'Luar Wilayah (Belum Mutasi)' : 'Sesuai Domisili')),
        addressKtp: currentHouse.addressKtp || '',
        bpjsStatus: currentHouse.bpjsStatus || 'Tidak Ada',
        vehicleCount: (currentHouse.twoWheelCount || 0) + (currentHouse.fourWheelCount || 0) > 0 ? (currentHouse.twoWheelCount || 0) + (currentHouse.fourWheelCount || 0) : (currentHouse.vehicleCount || 0),
        twoWheelCount: currentHouse.twoWheelCount ?? 0,
        fourWheelCount: currentHouse.fourWheelCount ?? 0,
        ownerName: currentHouse.ownerName || '',
        ownerPhone: currentHouse.ownerPhone || '',
        isPKH: currentHouse.isPKH || false,
        isBLT: currentHouse.isBLT || false,
        isBPNT: currentHouse.isBPNT || false,
        isBansosLain: currentHouse.isBansosLain || false,
        bansosLainName: currentHouse.bansosLainName || '',
        economicStatus: currentHouse.economicStatus || 'Sejahtera',
        pregnantCount: currentHouse.pregnantCount || 0,
        babyCount: currentHouse.babyCount || 0,
        toddlerCount: currentHouse.toddlerCount || 0,
        teenagerCount: currentHouse.teenagerCount || 0,
        adultCount: currentHouse.adultCount || 0,
        elderlyCount: currentHouse.elderlyCount || 0,
        widowCount: currentHouse.widowCount || 0,
        childCount: currentHouse.childCount || 0,
        familyMembers: currentHouse.familyMembers || [],
        hasBusiness: currentHouse.hasBusiness || !!currentHouse.businessName,
        businessName: currentHouse.businessName || '',
        businessCategory: currentHouse.businessCategory || 'Kuliner & Makanan',
        businessDescription: currentHouse.businessDescription || '',
        businessPhone: currentHouse.businessPhone || currentHouse.phone || '',
        businessLocation: currentHouse.businessLocation || 'Di Rumah',
        isUmkmRegistered: currentHouse.isUmkmRegistered ?? true,
        reason: ''
      });
    }
  }, [currentHouse, isUpdateModalOpen]);

  const addFamilyMember = () => {
    setUpdateForm({
      ...updateForm,
      familyMembers: [
        ...updateForm.familyMembers,
        { name: '', nik: '', relation: 'Anak', gender: 'Laki-laki', birthDate: '', job: '' }
      ]
    });
  };

  const removeFamilyMember = (index: number) => {
    const newMembers = [...updateForm.familyMembers];
    newMembers.splice(index, 1);
    setUpdateForm({ ...updateForm, familyMembers: newMembers });
  };

  const updateFamilyMember = (index: number, field: string, value: any) => {
    const newMembers = [...updateForm.familyMembers];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setUpdateForm({ ...updateForm, familyMembers: newMembers });
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanHeadNik = (currentHouse?.nik || '').replace(/\D/g, '');
      const seenNiks = new Set<string>();

      for (let i = 0; i < (updateForm.familyMembers || []).length; i++) {
        const m = updateForm.familyMembers[i];
        const mNik = (m.nik || '').replace(/\D/g, '');
        if (mNik) {
          if (mNik.length !== 16) {
            toast.error(`NIK anggota ke-${i + 1} (${m.name || 'Anggota'}) harus 16 digit angka.`);
            return;
          }
          if (cleanHeadNik && mNik === cleanHeadNik) {
            toast.error(`NIK anggota ke-${i + 1} (${m.name || 'Anggota'}) tidak boleh sama dengan NIK Kepala Keluarga.`);
            return;
          }
          if (seenNiks.has(mNik)) {
            toast.error(`NIK anggota ke-${i + 1} (${m.name || 'Anggota'}) kembar dengan anggota keluarga lain.`);
            return;
          }
          seenNiks.add(mNik);

          const dup = checkNikDuplicate(mNik, selectedHouseId, houses);
          if (dup.isDuplicate) {
            toast.error(`NIK anggota ke-${i + 1} (${m.name || 'Anggota'}) sudah terdaftar atas nama ${dup.residentName} di Unit ${dup.houseId}.`);
            return;
          }
        }
      }

      await addUpdateRequest({
        houseId: selectedHouseId,
        ...updateForm
      });
      setIsUpdateModalOpen(false);
      toast.success('Permohonan pembaruan data berhasil dikirim!', {
        description: 'Admin akan meninjau permohonan Anda.'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "updateRequests");
      toast.error('Gagal mengirim permohonan.');
    }
  };

  if (!selectedHouseId && activeTab !== 'skills' && activeTab !== 'outages') {
    return (
      <ResidentLoginGate
        houses={houses}
        tempHouseId={tempHouseId}
        setTempHouseId={setTempHouseId}
        isPinModalOpen={isPinModalOpen}
        setIsPinModalOpen={setIsPinModalOpen}
        pinInput={pinInput}
        setPinInput={setPinInput}
        pinError={pinError}
        handlePinSubmit={handlePinSubmit}
        rememberSession={rememberSession}
        setRememberSession={setRememberSession}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <ResidentHeader
        currentHouse={currentHouse}
        selectedHouseId={selectedHouseId}
        greeting={greeting}
        handleLogout={handleLogout}
        setActiveTab={setActiveTab}
        setIsVotingModalOpen={setIsVotingModalOpen}
        setIsReportModalOpen={setIsReportModalOpen}
        setIsIuranModalOpen={setIsIuranModalOpen}
        activeTab={activeTab}
        currentWaterReading={currentWaterReading}
        currentPoints={currentPoints}
        stbmRecord={stbmRecord}
        pendingLettersCount={pendingLettersCount}
        guestReports={guestReports}
        activeReportsCount={activeReportsCount}
      />

      <AnimatePresence mode="wait">
        {activeTab === 'eid' && (
          <ResidentEidTab
            currentHouse={currentHouse}
            selectedHouseId={selectedHouseId}
            currentWaterReading={currentWaterReading}
            waterUtilityConfig={waterUtilityConfig}
            currentMonth={currentMonth}
            letters={letters}
            reports={reports}
            guestReports={guestReports}
            updateRequests={updateRequests}
            pdfConfig={pdfConfig}
            isAllPaid={isAllPaid}
            isMandatory={isMandatory}
            totalRemainingFee={totalRemainingFee}
            currentHouseWasteTier={currentHouseWasteTier}
            sampahFee={sampahFee}
            airFee={airFee}
            pendingLettersCount={pendingLettersCount}
            activeReportsCount={activeReportsCount}
            currentPoints={currentPoints}
            citizenTier={citizenTier}
            maleCount={maleCount}
            femaleCount={femaleCount}
            showFullNiks={showFullNiks}
            toggleNikVisibility={toggleNikVisibility}
            formatSensitiveNik={formatSensitiveNik}
            setIsIuranModalOpen={setIsIuranModalOpen}
            setIsWaterModalOpen={setIsWaterModalOpen}
            setIsUpdateModalOpen={setIsUpdateModalOpen}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'water' && (
          <ResidentWaterTab
            currentHouse={currentHouse}
            waterUtilityConfig={waterUtilityConfig}
            currentWaterReading={currentWaterReading}
            houseWaterReadings={houseWaterReadings}
            previousReadingNumber={previousReadingNumber}
            onOpenWaterModal={(currentReadingVal, photoVal) => {
              setWaterInputReading(currentReadingVal === '' ? '' : Number(currentReadingVal));
              setWaterPhoto(photoVal);
              setIsWaterModalOpen(true);
            }}
          />
        )}

        {activeTab === 'letters' && (
          <ResidentLettersTab
            letters={letters}
            currentHouse={currentHouse}
            pdfConfig={pdfConfig}
            showFullNiks={showFullNiks}
            toggleNikVisibility={toggleNikVisibility}
            formatSensitiveNik={formatSensitiveNik}
          />
        )}

        {activeTab === 'update' && (
          <ResidentUpdateDataTab
            updateRequests={updateRequests}
            isUpdateModalOpen={isUpdateModalOpen}
            setIsUpdateModalOpen={setIsUpdateModalOpen}
            selectedRequest={selectedRequest}
            setSelectedRequest={setSelectedRequest}
            updateForm={updateForm}
            setUpdateForm={setUpdateForm}
            handleUpdateSubmit={handleUpdateSubmit}
            addFamilyMember={addFamilyMember}
            removeFamilyMember={removeFamilyMember}
            updateFamilyMember={updateFamilyMember}
            currentHouse={currentHouse}
            selectedHouseId={selectedHouseId}
            houses={houses}
            showFullNiks={showFullNiks}
            toggleNikVisibility={toggleNikVisibility}
            formatSensitiveNik={formatSensitiveNik}
          />
        )}

        {activeTab === 'guests' && (
          <ResidentGuestsTab guestReports={guestReports} />
        )}

        {activeTab === 'reports' && (
          <ResidentReportsTab
            reports={reports}
            onOpenReportModal={() => setIsReportModalOpen(true)}
            onSelectReportDetail={(report) => setSelectedReportDetail(report)}
          />
        )}

        {activeTab === 'points' && (
          <ResidentPointsTab
            citizenTier={citizenTier}
            currentHouse={currentHouse}
            currentPoints={currentPoints}
            currentRank={currentRank}
            isAllPaid={isAllPaid}
            currentMonth={currentMonth}
            allHousePoints={allHousePoints}
            selectedHouseId={selectedHouseId}
          />
        )}

        {activeTab === 'skills' && (
          <ResidentSkillsTab
            communitySkills={communitySkills}
            currentHouse={currentHouse}
            onOpenAddSkillModal={() => {
              setSkillForm({
                category: 'Pertukangan & Bangunan',
                title: '',
                description: '',
                phone: currentHouse?.phone || '',
                rateInfo: ''
              });
              setIsAddSkillModalOpen(true);
            }}
          />
        )}

        {activeTab === 'outages' && (
          <ResidentOutagesTab
            utilityOutages={utilityOutages}
            onOpenOutageModal={() => setIsOutageModalOpen(true)}
          />
        )}

        {activeTab === 'stbm' && (
          <ResidentStbmTab
            currentHouse={currentHouse}
            stbmRecord={stbmRecord}
            onReportIssue={(desc) => {
              setReportForm({
                type: 'Fasilitas',
                description: desc,
              });
              setIsReportModalOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Modals */}
      <ResidentSkillModal
        isOpen={isAddSkillModalOpen}
        onClose={() => setIsAddSkillModalOpen(false)}
        skillForm={skillForm}
        setSkillForm={setSkillForm}
        currentHouse={currentHouse}
        selectedHouseId={selectedHouseId}
      />

      <ResidentIuranModal
        isOpen={isIuranModalOpen}
        onClose={() => setIsIuranModalOpen(false)}
        isAllPaid={isAllPaid}
        currentMonth={currentMonth}
        currentHouse={currentHouse}
        totalRemainingFee={totalRemainingFee}
        totalFee={totalFee}
        currentHouseWasteTier={currentHouseWasteTier}
        sampahFee={sampahFee}
        isPaidSampah={isPaidSampah}
        airFee={airFee}
        isPaidAir={isPaidAir}
        currentWaterReading={currentWaterReading}
        handleDownloadReceipt={handleDownloadReceipt}
      />

      <ResidentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportForm={reportForm}
        setReportForm={setReportForm}
        handleSubmitReport={handleSubmitReport}
        isSubmittingReport={isSubmittingReport}
        selectedReportDetail={selectedReportDetail}
        onCloseReportDetail={() => setSelectedReportDetail(null)}
      />

      {isWaterModalOpen && (
        <ResidentWaterModal
          isOpen={isWaterModalOpen}
          onClose={() => setIsWaterModalOpen(false)}
          handleSubmitWaterMeter={handleSubmitWaterMeter}
          currentHouse={currentHouse}
          waterUtilityConfig={waterUtilityConfig}
          previousReadingNumber={previousReadingNumber}
          waterInputReading={waterInputReading}
          setWaterInputReading={setWaterInputReading}
          handleWaterPhotoUpload={handleWaterPhotoUpload}
          waterPhoto={waterPhoto}
          setWaterPhoto={setWaterPhoto}
          isSubmittingWater={isSubmittingWater}
        />
      )}

      {/* Utility Outage Tracker Modal */}
      <UtilityOutageTrackerModal 
        isOpen={isOutageModalOpen}
        onClose={() => setIsOutageModalOpen(false)}
        outages={utilityOutages}
      />
    </div>
  );
};
