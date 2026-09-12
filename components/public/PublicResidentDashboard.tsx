import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  ArrowLeft, 
  QrCode, 
  FileEdit, 
  History, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Phone,
  Users,
  Home,
  Calendar,
  LogOut,
  ChevronRight,
  Info,
  X,
  CreditCard,
  Trash2,
  Droplets,
  Globe,
  MapPin,
  Heart,
  GraduationCap,
  Briefcase,
  Activity,
  DollarSign,
  Baby,
  Accessibility,
  Plus,
  Stethoscope,
  AlertTriangle,
  Send,
  Camera,
  FileText,
  Wrench,
  Eye,
  EyeOff,
  Download,
  Check,
  ShieldCheck,
  Box,
  PackageCheck,
  Trophy,
  Sparkles,
  Award,
  Zap,
  Hammer,
  TrendingUp,
  CheckCircle2,
  Sun,
  Moon,
  Copy,
  ExternalLink,
  Printer,
  Bell,
  Share2,
  Wallet,
  Receipt
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { getIndonesianMonthYear } from '../../src/utils/dateUtils';
import { 
  getHouseWasteFee, 
  getHouseWasteTier, 
  DEFAULT_SAMPAH_TIERS, 
  WATER_PROVIDER_NAME 
} from '../../constants';
import { House, GuestReport, UpdateRequest, PaymentStatus, Report, LetterRequest, InventoryItem, CommunitySkill, UtilityOutage, WaterMeterReading, WaterUtilitySettings } from '../../types';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
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
  checkNikDuplicate
} from '../../services/databaseService';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { generateSuratPengantar, generateIuranReceiptPDF } from '../../services/pdfService';
import { NotificationToggle } from '../PushNotificationManager';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { UtilityOutageTrackerModal } from './UtilityOutageTrackerModal';

import { useSearchParams } from 'react-router-dom';

interface PublicResidentDashboardProps {
  houses: House[];
}

export const PublicResidentDashboard: React.FC<PublicResidentDashboardProps> = ({ houses }) => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as any;

  const [selectedHouseId, setSelectedHouseId] = useState<string>(
    sessionStorage.getItem('resident_house_id') || localStorage.getItem('resident_house_id') || ''
  );
  const [rememberSession, setRememberSession] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isOutageModalOpen, setIsOutageModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [tempHouseId, setTempHouseId] = useState('');
  const [pinError, setPinError] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'eid' | 'water' | 'points' | 'skills' | 'outages' | 'letters' | 'update' | 'guests' | 'reports'>(
    (tabParam && ['eid', 'water', 'points', 'skills', 'outages', 'letters', 'update', 'guests', 'reports'].includes(tabParam)) ? tabParam as any : 'eid'
  );

  useEffect(() => {
    if (tabParam && ['eid', 'water', 'points', 'skills', 'outages', 'letters', 'update', 'guests', 'reports'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);
  const [communitySkills, setCommunitySkills] = useState<CommunitySkill[]>([]);
  const [utilityOutages, setUtilityOutages] = useState<UtilityOutage[]>([]);
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [skillForm, setSkillForm] = useState({
    category: 'Pertukangan & Bangunan' as CommunitySkill['category'],
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
    // +50 jika lunas iuran bulan berjalan
    if (getPaymentStatus(h, 'Air', currentMonth) === PaymentStatus.PAID && getPaymentStatus(h, 'Sampah', currentMonth) === PaymentStatus.PAID) {
      score += 50;
    }
    // +Poin Ronda Malam
    if (h.rondaPoints) {
      score += h.rondaPoints;
    }
    // +Poin Verifikasi Data Lengkap
    if (h.isVerified) {
      score += 30;
    }
    // +Poin Keaktifan Laporan Selesai
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
      headOfFamily: currentHouse.headOfFamily || currentHouse.residentName || 'Warga RT 002',
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
  const GreetingIcon = greeting.icon;

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
    
    return () => {
      unsubGuests();
      unsubUpdates();
      unsubReports();
      unsubLetters();
      unsubWater();
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
        // Clear any old permanent localStorage keys
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
    // 1. Reset all house identifier & input states
    setSelectedHouseId('');
    setTempHouseId('');
    setPinInput('');
    setPinError(false);

    // 2. Clear all resident specific in-memory data
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

    // 3. Purge all storage keys from both localStorage and sessionStorage
    localStorage.removeItem('resident_house_id');
    localStorage.removeItem('resident_name');
    localStorage.removeItem('resident_location');
    sessionStorage.removeItem('resident_house_id');
    sessionStorage.removeItem('resident_name');
    sessionStorage.removeItem('resident_location');

    // 4. Reset update form state
    setUpdateForm({
      headOfFamily: '',
      gender: 'Laki-laki',
      birthPlace: '',
      birthDate: '',
      phone: '',
      occupants: 0,
      residenceType: 'Tetap',
      nik: '',
      kkNumber: '',
      maritalStatus: 'Belum Kawin',
      religion: '',
      education: '',
      job: '',
      jobCategory: '',
      bloodType: '-',
      nationality: 'WNI',
      addressKtp: '',
      bpjsStatus: 'Tidak Ada',
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
      economicStatus: 'Sejahtera',
      pregnantCount: 0,
      babyCount: 0,
      toddlerCount: 0,
      teenagerCount: 0,
      adultCount: 0,
      elderlyCount: 0,
      widowCount: 0,
      childCount: 0,
      familyMembers: [],
      reason: ''
    });

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
    reason: ''
  });

  const [formStep, setFormStep] = useState<'profile' | 'kependudukan' | 'ekonomi' | 'anggota'>('profile');

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isIuranModalOpen, setIsIuranModalOpen] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [selectedReportDetail, setSelectedReportDetail] = useState<Report | null>(null);
  const [reportForm, setReportForm] = useState({
    type: 'Keamanan' as Report['type'],
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

  const [showPin, setShowPin] = useState(false);
  const [copiedText, setCopiedText] = useState<'pin' | 'houseId' | null>(null);

  const handleCopyToClipboard = (text: string, type: 'pin' | 'houseId') => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    toast.success(`${type === 'pin' ? 'PIN Akses' : 'ID Rumah'} berhasil disalin ke clipboard!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (!selectedHouseId && activeTab !== 'skills' && activeTab !== 'outages') {
    const sortedHouses = [...houses]
      .filter(h => h.status === 'Occupied')
      .sort((a, b) => {
        if (a.block !== b.block) return a.block.localeCompare(b.block, undefined, { numeric: true });
        return (a.number || '').localeCompare(b.number || '', undefined, { numeric: true });
      });

    return (
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-6 md:p-12 relative overflow-hidden">
          {/* Atmospheric Background glow */}
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-100/40 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-emerald-50/30 blur-[100px] rounded-full pointer-events-none" />
          
          {/* Left illustration/info column */}
          <div className="md:col-span-7 space-y-6 md:pr-6 relative z-10 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 shadow-sm">
              <Shield size={14} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Warga Hub Portal Mandiri</span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Akses Portal Mandiri <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-800">Warga RT 02</span>
            </h2>
            
            <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-lg">
              Selamat datang di sistem siber layanan mandiri warga. Gunakan kode PIN unik hunian Anda untuk memantau iuran bulanan, mengurus surat pengantar resmi kelurahan secara instan, mencetak E-ID, serta menyampaikan laporan masalah lingkungan secara langsung.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {[
                { title: "E-ID Card Digital", desc: "Verifikasi barcode identitas RT secara instan", icon: QrCode, color: "text-indigo-600 bg-indigo-50 border-indigo-100/50" },
                { title: "Update KK Mandiri", desc: "Ubah data penghuni & keluarga kapan saja", icon: FileEdit, color: "text-emerald-600 bg-emerald-50 border-emerald-100/50" },
                { title: "Log Tamu Keamanan", desc: "Pantau & atur kedatangan tamu bermalam", icon: History, color: "text-amber-600 bg-amber-50 border-amber-100/50" },
                { title: "Laporan & Aduan", desc: "Sampaikan keluhan fasilitas secara digital", icon: AlertTriangle, color: "text-rose-600 bg-rose-50 border-rose-100/50" }
              ].map((feat, idx) => (
                <div key={idx} className="flex gap-3 text-left p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className={`p-2.5 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center border ${feat.color}`}>
                    <feat.icon size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800">{feat.title}</h5>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5 leading-snug">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Login form column */}
          <div className="md:col-span-5 bg-slate-50/60 p-6 md:p-8 rounded-3xl border border-slate-100 flex flex-col justify-center relative z-10">
            <div className="w-16 h-16 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100/80 mb-6">
              <User size={32} />
            </div>
            
            <h3 className="text-xl font-black text-slate-800 mb-1 text-left">Pilih Rumah Anda</h3>
            <p className="text-xs text-slate-400 font-semibold mb-6 text-left">Silakan tentukan identitas hunian aktif Anda di bawah ini:</p>

            <div className="space-y-4">
              <select 
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm cursor-pointer hover:border-indigo-200"
                value={tempHouseId}
                onChange={(e) => {
                  setTempHouseId(e.target.value);
                  if (e.target.value) setIsPinModalOpen(true);
                }}
              >
                <option value="">Pilih Hunian Kelurahan...</option>
                {sortedHouses.map(h => (
                  <option key={h.id} value={h.id}>Blok {h.block}-{h.number} ({h.headOfFamily})</option>
                ))}
              </select>
              
              <div className="flex items-center gap-1.5 pl-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">
                <Info size={12} className="text-slate-400 shrink-0" />
                <span>Gunakan PIN 6-digit rahasia rumah Anda</span>
              </div>
            </div>
          </div>
        </div>

        <Modal isOpen={isPinModalOpen} onClose={() => {
          setIsPinModalOpen(false);
          setTempHouseId('');
          setPinInput('');
        }} title="Verifikasi PIN Akses">
          <form onSubmit={handlePinSubmit} className="space-y-6 p-2">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-800">Masukkan PIN Rumah</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Akses masuk aman untuk warga <span className="font-bold text-indigo-600">Blok {houses.find(h => h.id === tempHouseId)?.block}-{houses.find(h => h.id === tempHouseId)?.number}</span>
              </p>
            </div>

            {/* Hidden Input for Keyboard Typing */}
            <input 
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              autoFocus
              className="sr-only"
              id="pin-hidden-input"
              value={pinInput}
              onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
            />

            {/* Premium PIN Slot Visual Indicators */}
            <div 
              onClick={() => document.getElementById('pin-hidden-input')?.focus()}
              className="flex justify-center gap-3 my-4 cursor-pointer"
              title="Klik untuk mengetik"
            >
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const hasValue = pinInput.length > idx;
                return (
                  <div 
                    key={idx} 
                    className={`w-11 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-black transition-all ${
                      pinError 
                        ? 'border-rose-500 bg-rose-50 text-rose-600 animate-pulse' 
                        : hasValue 
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-md shadow-indigo-100/50 scale-105' 
                          : 'border-slate-200 bg-white text-slate-300'
                    }`}
                  >
                    {hasValue ? (showPin ? pinInput[idx] : '•') : ''}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center px-4">
              <button 
                type="button" 
                onClick={() => setShowPin(!showPin)}
                className="text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-colors"
              >
                {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{showPin ? "Sembunyikan PIN" : "Tampilkan PIN"}</span>
              </button>
              <button
                type="button"
                onClick={() => setPinInput('')}
                className="text-xs font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest cursor-pointer transition-colors"
              >
                Hapus Semua
              </button>
            </div>

            {pinError && (
              <p className="text-xs text-rose-500 font-bold text-center animate-bounce">PIN Salah! Periksa sandi unik hunian Anda kembali.</p>
            )}

            {/* Interactive Tactile Keypad */}
            <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto pt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    if (pinInput.length < 6) setPinInput(prev => prev + num);
                  }}
                  className="w-16 h-16 bg-slate-50 hover:bg-slate-100 active:scale-95 text-lg font-black text-slate-800 rounded-2xl flex items-center justify-center transition-all cursor-pointer border border-slate-100 hover:border-slate-200"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="w-16 h-16 text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-2xl flex items-center justify-center"
                disabled
              >
                {/* Blank Spacer */}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pinInput.length < 6) setPinInput(prev => prev + '0');
                }}
                className="w-16 h-16 bg-slate-50 hover:bg-slate-100 active:scale-95 text-lg font-black text-slate-800 rounded-2xl flex items-center justify-center transition-all cursor-pointer border border-slate-100 hover:border-slate-200"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setPinInput(prev => prev.slice(0, -1))}
                className="w-16 h-16 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center transition-all cursor-pointer border border-slate-100 hover:border-slate-200 hover:text-rose-500 hover:bg-rose-50"
                title="Hapus satu angka"
              >
                <ArrowLeft size={18} />
              </button>
            </div>

            {/* Remember Session Option */}
            <label className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl cursor-pointer select-none text-left hover:bg-slate-100/60 transition-colors">
              <input 
                type="checkbox"
                checked={rememberSession}
                onChange={(e) => setRememberSession(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
              />
              <span className="text-[11px] font-semibold text-slate-700 leading-snug">
                Ingat sesi di perangkat ini
                <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                  Jangan dicentang jika menggunakan perangkat publik/bersama. Data akan otomatis terhapus saat Anda keluar sesi atau menutup browser.
                </span>
              </span>
            </label>

            <Button type="submit" className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer font-black text-xs uppercase tracking-widest">
              Verifikasi & Masuk <ChevronRight size={16} />
            </Button>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 mb-24 text-left">
      {/* Modern Civic Hero Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800/80 p-6 md:p-8 text-white shadow-xl shadow-indigo-950/20 mb-6">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-start md:items-center gap-4">
            {/* Avatar Initials / Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-500/25 border border-white/20 shrink-0">
              {currentHouse?.headOfFamily ? (
                currentHouse.headOfFamily.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
              ) : (
                <User size={28} />
              )}
            </div>

            <div className="space-y-1">
              {/* Contextual Greeting & Date */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${greeting.color}`}>
                  <GreetingIcon size={12} />
                  <span>{greeting.text}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>

              {/* Title & House Block */}
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {currentHouse?.headOfFamily ? currentHouse.headOfFamily : (selectedHouseId ? 'Warga RT 02' : 'Portal Layanan Warga')}
                </h2>
                {selectedHouseId && (
                  <span className="px-3 py-1 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl text-xs font-black uppercase tracking-widest text-indigo-200 border border-white/15">
                    Blok {currentHouse?.block}-{currentHouse?.number}
                  </span>
                )}
              </div>

              {/* Status Pills */}
              {selectedHouseId && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px] font-semibold">
                    <Home size={12} className="text-indigo-400" />
                    <span>Status: <strong>{currentHouse?.residenceType || 'Tetap'}</strong></span>
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[11px] font-semibold ${
                    currentHouse?.isVerified 
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  }`}>
                    <CheckCircle size={12} />
                    <span>{currentHouse?.isVerified ? 'Data KK Terverifikasi' : 'Perlu Verifikasi KK'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px] font-semibold">
                    <Shield size={12} className="text-sky-400" />
                    <span>{currentHouse?.rondaExempt ? 'Bebas Ronda Siskamling' : 'Wajib Ronda Aktif'}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Sesi Controls */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end pt-2 md:pt-0 border-t border-white/10 md:border-t-0">
            {selectedHouseId ? (
              <button 
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-white/10 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40 border border-white/15 transition-all cursor-pointer text-slate-300"
                title="Keluar dari sesi warga"
              >
                <LogOut size={14} /> <span>Keluar Sesi</span>
              </button>
            ) : (
              <button 
                onClick={() => setActiveTab('eid')}
                className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <QrCode size={14} /> Masuk Portal Warga (PIN)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Command Hub */}
      {selectedHouseId && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Sparkles size={13} className="text-indigo-600" /> Pintasan Aksi Cepat Warga
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Layanan mandiri instan</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <button
              onClick={() => setActiveTab('water')}
              className="p-3.5 rounded-2xl bg-white hover:bg-blue-50/50 border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Droplets size={18} />
              </div>
              <p className="text-xs font-black text-slate-800">Catat Meter</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Air Mandiri m³</p>
            </button>

            <button
              onClick={() => setActiveTab('letters')}
              className="p-3.5 rounded-2xl bg-white hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <FileText size={18} />
              </div>
              <p className="text-xs font-black text-slate-800">Surat Pengantar</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Permohonan RT</p>
            </button>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="p-3.5 rounded-2xl bg-white hover:bg-rose-50/50 border border-slate-200/80 hover:border-rose-300 hover:shadow-md transition-all text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <AlertTriangle size={18} />
              </div>
              <p className="text-xs font-black text-slate-800">Lapor Aduan</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Fasilitas/Warga</p>
            </button>

            <button
              onClick={() => setActiveTab('guests')}
              className="p-3.5 rounded-2xl bg-white hover:bg-amber-50/50 border border-slate-200/80 hover:border-amber-300 hover:shadow-md transition-all text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Users size={18} />
              </div>
              <p className="text-xs font-black text-slate-800">Lapor Tamu</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Wajib 1x24 Jam</p>
            </button>

            <button
              onClick={() => setIsIuranModalOpen(true)}
              className="p-3.5 rounded-2xl bg-white hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <CreditCard size={18} />
              </div>
              <p className="text-xs font-black text-slate-800">Rincian Iuran</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Sampah & Air RT</p>
            </button>

            <button
              onClick={() => setActiveTab('eid')}
              className="p-3.5 rounded-2xl bg-white hover:bg-purple-50/50 border border-slate-200/80 hover:border-purple-300 hover:shadow-md transition-all text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <QrCode size={18} />
              </div>
              <p className="text-xs font-black text-slate-800">Kartu E-ID</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Cetak & Unduh</p>
            </button>
          </div>
        </div>
      )}

      {/* Tabs with Dynamic Badges */}
      <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 border border-slate-200/60 rounded-3xl mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: 'eid', label: 'E-ID & Profil', shortLabel: 'E-ID', icon: QrCode, badge: null, badgeColor: '' },
          { 
            id: 'water', 
            label: 'Meter Air Mandiri', 
            shortLabel: 'Air Bersih', 
            icon: Droplets, 
            badge: currentWaterReading ? '✓ Tercatat' : 'Catat',
            badgeColor: currentWaterReading ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'
          },
          { 
            id: 'points', 
            label: 'Poin & Teladan', 
            shortLabel: 'Poin', 
            icon: Trophy, 
            badge: `${currentPoints} Pts`,
            badgeColor: 'bg-amber-100 text-amber-900'
          },
          { 
            id: 'letters', 
            label: 'Status Surat', 
            shortLabel: 'Surat', 
            icon: FileText, 
            badge: pendingLettersCount > 0 ? `${pendingLettersCount}` : null,
            badgeColor: 'bg-indigo-600 text-white'
          },
          { 
            id: 'update', 
            label: 'Pembaruan Data KK', 
            shortLabel: 'Update KK', 
            icon: FileEdit, 
            badge: currentHouse?.isVerified ? '✓ Sah' : 'Update',
            badgeColor: currentHouse?.isVerified ? 'bg-slate-200/70 text-slate-700' : 'bg-amber-100 text-amber-800'
          },
          { 
            id: 'guests', 
            label: 'Log Tamu Menginap', 
            shortLabel: 'Tamu', 
            icon: History, 
            badge: guestReports.length > 0 ? `${guestReports.length}` : null,
            badgeColor: 'bg-slate-200 text-slate-700'
          },
          { 
            id: 'reports', 
            label: 'Aduan & Masalah', 
            shortLabel: 'Aduan', 
            icon: AlertTriangle, 
            badge: activeReportsCount > 0 ? `${activeReportsCount}` : null,
            badgeColor: 'bg-rose-600 text-white'
          }
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                isSelected 
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/40 font-black' 
                : 'text-slate-500 hover:text-slate-800 font-semibold'
              }`}
            >
              <tab.icon size={15} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />
              <span className="hidden md:inline">{tab.label}</span>
              <span className="inline md:hidden">{tab.shortLabel}</span>
              {tab.badge && (
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight ${tab.badgeColor || 'bg-slate-200 text-slate-600'}`}>
                  {tab.badge}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'eid' && (
          <motion.div 
            key="eid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Bento Grid Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              {/* Card 1: Iuran */}
              <motion.div 
                whileHover={{ y: -3 }}
                onClick={() => setIsIuranModalOpen(true)}
                className={`p-6 rounded-[2rem] border cursor-pointer transition-all ${
                  isAllPaid 
                    ? 'bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white border-emerald-200/80 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100/30' 
                    : (isMandatory ? 'bg-gradient-to-br from-rose-50/70 via-red-50/40 to-white border-rose-200/80 hover:border-rose-300 hover:shadow-lg hover:shadow-rose-100/30' : 'bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-white border-amber-200/80 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100/30')
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${
                    isAllPaid ? 'bg-emerald-500/10 text-emerald-600' : (isMandatory ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600')
                  }`}>
                    <CreditCard size={20} />
                  </div>
                  <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                    isAllPaid 
                      ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30' 
                      : (isMandatory ? 'bg-rose-500/20 text-rose-700 border-rose-500/30' : 'bg-amber-500/20 text-amber-700 border-amber-500/30')
                  }`}>
                    {isAllPaid ? '✓ Lunas' : (isMandatory ? '⚠ Lewat Tempo' : 'Tagihan Baru')}
                  </span>
                </div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Iuran Kas RT ({currentMonth})</h4>
                <p className="text-xl font-black text-slate-800">
                  {isAllPaid ? 'Lunas Terbayar' : `Rp ${totalRemainingFee.toLocaleString('id-ID')}`}
                </p>
                <p className="text-[11px] text-slate-500 font-semibold mt-1 truncate">
                  Sampah ({currentHouseWasteTier}): Rp {sampahFee.toLocaleString('id-ID')} {airFee > 0 ? `• Air Rp ${airFee.toLocaleString('id-ID')}` : '• Air PDAM Palu'}
                </p>
                <p className="text-[10px] text-indigo-600 font-bold mt-2 flex items-center gap-1">
                  Rincian &amp; Konfirmasi Bayar →
                </p>
              </motion.div>

              {/* Card 2: Meter Air Mandiri */}
              <motion.div 
                whileHover={{ y: -3 }}
                onClick={() => setActiveTab('water')}
                className="p-6 rounded-[2rem] bg-gradient-to-br from-cyan-50/70 via-blue-50/40 to-white border border-cyan-200/80 hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-100/30 cursor-pointer transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-cyan-500/10 text-cyan-600 rounded-2xl">
                    <Droplets size={20} />
                  </div>
                  <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                    currentWaterReading 
                      ? (currentWaterReading.status === 'Terverifikasi' 
                          ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30' 
                          : 'bg-amber-500/20 text-amber-700 border-amber-500/30')
                      : 'bg-rose-500/20 text-rose-700 border-rose-500/30'
                  }`}>
                    {currentWaterReading ? (currentWaterReading.status === 'Terverifikasi' ? '✓ Sah' : 'Menunggu') : 'Belum Catat'}
                  </span>
                </div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Meter Air Mandiri</h4>
                <p className="text-xl font-black text-slate-800">
                  {currentWaterReading ? `${currentWaterReading.usage} m³ • Rp ${currentWaterReading.totalAmount.toLocaleString('id-ID')}` : 'Catat Pemakaian'}
                </p>
                <p className="text-[11px] text-slate-500 font-semibold mt-1">
                  {currentWaterReading ? `Angka: ${currentWaterReading.reading} m³ (${waterUtilityConfig.providerName || 'PDAM'})` : `Batas input: Tgl ${waterUtilityConfig.readingDueDate || 20} ${currentMonth}`}
                </p>
                <p className="text-[10px] text-cyan-700 font-bold mt-2 flex items-center gap-1">
                  Buka Portal Meter Air →
                </p>
              </motion.div>

              {/* Card 3: Pengajuan Aktif */}
              <motion.div 
                whileHover={{ y: -3 }}
                onClick={() => {
                  if (pendingLettersCount > 0) setActiveTab('letters');
                  else setActiveTab('reports');
                }}
                className="p-6 rounded-[2rem] bg-gradient-to-br from-indigo-50/40 via-violet-50/20 to-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/20 cursor-pointer transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <FileText size={20} />
                  </div>
                  {pendingLettersCount + activeReportsCount > 0 ? (
                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-200">
                      {pendingLettersCount + activeReportsCount} Berkas Aktif
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-200">
                      Semua Beres
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Administrasi &amp; Aduan</h4>
                <p className="text-xl font-black text-slate-800">
                  {pendingLettersCount} Surat • {activeReportsCount} Aduan
                </p>
                <p className="text-[11px] text-slate-500 font-semibold mt-1">
                  Total {letters.length} Pengantar diajukan • {reports.length} Laporan
                </p>
                <p className="text-[10px] text-indigo-600 font-bold mt-2 flex items-center gap-1">
                  Lacak Perkembangan Berkas →
                </p>
              </motion.div>

              {/* Card 4: Profil Demografi */}
              <motion.div 
                whileHover={{ y: -3 }}
                onClick={() => setActiveTab('update')}
                className="p-6 rounded-[2rem] bg-gradient-to-br from-emerald-50/40 via-teal-50/20 to-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100/20 cursor-pointer transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <Users size={20} />
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-200/60">
                    {currentHouse?.isVerified ? '✓ Valid' : 'Cek KK'}
                  </span>
                </div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Anggota KK &amp; Armada</h4>
                <p className="text-xl font-black text-slate-800">
                  {currentHouse?.occupants || 0} Jiwa ({maleCount} L / {femaleCount} P)
                </p>
                <p className="text-[11px] text-slate-500 font-semibold mt-1 truncate">
                  {(currentHouse?.twoWheelCount || 0) + (currentHouse?.fourWheelCount || 0) > 0 
                    ? `${currentHouse?.twoWheelCount || 0} Motor • ${currentHouse?.fourWheelCount || 0} Mobil` 
                    : `${currentHouse?.vehicleCount || 0} Kendaraan terdaftar`}
                </p>
                <p className="text-[10px] text-emerald-700 font-bold mt-2 flex items-center gap-1">
                  Pembaruan Data Mandiri →
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* E-ID Smart Card */}
              <div className="lg:col-span-2">
                <motion.div 
                  whileHover={{ y: -4, scale: 1.005 }}
                  className="relative group overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white border border-indigo-400/40 hover:border-indigo-300 shadow-[0_25px_60px_rgba(79,70,229,0.3)] rounded-[2.5rem] p-0 min-h-[380px] transition-all id-card-printable relative"
                >
                  {/* Holographic Sheen Animated Light Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
                  
                  <div className="relative h-full flex flex-col p-8 md:p-12 justify-between">
                    {/* Card Top Row: EMV Chip & Hologram Seal */}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-wider mb-2.5 backdrop-blur-md border border-white/20 text-cyan-200">
                          <ShieldCheck size={12} className="text-emerald-400" />
                          <span>E-ID RESMI • HUNTAP TONDO 2</span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-black tracking-tight uppercase whitespace-nowrap">Kartu Warga Digital</h3>
                        <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] text-indigo-300/80">Rukun Tetangga 002 / RW 020 • Tondo</p>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Gold EMV Chip Simulation */}
                        <div className="w-12 h-9 rounded-md bg-gradient-to-tr from-amber-300 via-yellow-200 to-amber-400 border border-amber-300/80 shadow-md relative overflow-hidden flex items-center justify-center shrink-0">
                          <div className="w-full h-[1px] bg-amber-700/40 absolute top-1/2 -translate-y-1/2" />
                          <div className="h-full w-[1px] bg-amber-700/40 absolute left-1/3" />
                          <div className="h-full w-[1px] bg-amber-700/40 absolute right-1/3" />
                          <div className="w-4 h-3 rounded-xs border border-amber-700/50 bg-amber-300/40 z-10" />
                        </div>

                        <div className="w-12 h-12 md:w-14 md:h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shrink-0 shadow-lg">
                          <Home size={28} className="text-white/90" />
                        </div>
                      </div>
                    </div>

                    {/* Card Middle: Citizen Details */}
                    <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-8 mt-auto">
                      <div className="space-y-4 text-left w-full md:w-auto">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300/80 mb-0.5">Kepala Keluarga / Penghuni Utama</p>
                          <p className="text-2xl md:text-3.5xl font-black tracking-tight text-white">{currentHouse?.headOfFamily}</p>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                            NIK: {formatSensitiveNik(currentHouse?.nik || '', !!showFullNiks['nik'])}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-4 md:gap-8">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300/80 mb-1">ID Hunian</p>
                            <span 
                              onClick={() => currentHouse?.id && handleCopyToClipboard(currentHouse.id, 'houseId')}
                              className="text-lg md:text-xl font-black hover:text-indigo-200 hover:underline cursor-pointer flex items-center gap-1.5 text-amber-300"
                              title="Klik untuk salin ID Rumah"
                            >
                              Blok {currentHouse?.block}-{currentHouse?.number}
                            </span>
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300/80 mb-1">Status Iuran ({currentMonth})</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              isAllPaid 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                              : (isMandatory ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')
                            }`}>
                              {isAllPaid ? '✓ Lunas' : (isMandatory ? '⚠ Wajib Bayar' : 'Tagihan Baru')}
                            </span>
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300/80 mb-1">Poin Keaktifan</p>
                            <span 
                              onClick={() => setActiveTab('points')}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-white/15 text-amber-300 border-white/20 cursor-pointer hover:bg-white/25 transition-all"
                            >
                              <Sparkles size={11} /> {currentPoints} Pts ({citizenTier.badge})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Barcode & Security Stamp */}
                      <div className="bg-white p-3.5 rounded-2xl shadow-2xl self-start md:self-auto flex-shrink-0 animate-fade-in text-center">
                        <QRCodeSVG 
                          value={`RESIDENT:${selectedHouseId}`} 
                          size={105} 
                          level="H"
                          includeMargin={false}
                        />
                        <div style={{ display: 'none' }}>
                          <QRCodeCanvas 
                            id="resident-qrcode-canvas"
                            value={`RESIDENT:${selectedHouseId}`} 
                            size={256}
                            level="H"
                            includeMargin={false}
                          />
                        </div>
                        <p className="text-[8px] font-black tracking-widest uppercase text-slate-500 mt-2">Scan QR Warga</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* E-ID Card Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <Button
                    onClick={() => {
                      window.print();
                    }}
                    className="py-3 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    <Printer size={15} /> Cetak Kartu Warga Fisik
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      try {
                        const canvas = document.createElement('canvas');
                        canvas.width = 1012;
                        canvas.height = 638;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) throw new Error('Canvas context not available');

                        ctx.beginPath();
                        if (ctx.roundRect) ctx.roundRect(0, 0, 1012, 638, 48);
                        else ctx.rect(0, 0, 1012, 638);
                        ctx.clip();

                        const gradient = ctx.createLinearGradient(0, 0, 1012, 638);
                        gradient.addColorStop(0, '#1e1b4b');
                        gradient.addColorStop(0.5, '#312e81');
                        gradient.addColorStop(1, '#0f172a');
                        ctx.fillStyle = gradient;
                        ctx.fillRect(0, 0, 1012, 638);

                        ctx.fillStyle = '#ffffff';
                        ctx.font = '900 36px system-ui, -apple-system, sans-serif';
                        ctx.textAlign = 'left';
                        ctx.fillText('KARTU WARGA DIGITAL', 80, 150);

                        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                        ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
                        ctx.fillText('RUKUN TETANGGA 002 / RW 020 • TONDO', 80, 185);

                        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                        ctx.font = '900 12px system-ui, -apple-system, sans-serif';
                        ctx.fillText('NAMA KEPALA KELUARGA / PENGHUNI', 80, 290);

                        ctx.fillStyle = '#ffffff';
                        ctx.font = '900 38px system-ui, -apple-system, sans-serif';
                        ctx.fillText((currentHouse?.headOfFamily || 'Warga RT 02').toUpperCase(), 80, 345);

                        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                        ctx.font = '900 12px system-ui, -apple-system, sans-serif';
                        ctx.fillText('NOMOR HUNIAN AKTIF', 80, 435);

                        ctx.fillStyle = '#ffffff';
                        ctx.font = '900 28px system-ui, -apple-system, sans-serif';
                        ctx.fillText(`BLOK ${currentHouse?.block}-${currentHouse?.number}`, 80, 480);

                        const qrCanvas = document.getElementById('resident-qrcode-canvas') as HTMLCanvasElement;
                        if (qrCanvas) {
                          ctx.fillStyle = '#ffffff';
                          if (ctx.roundRect) ctx.roundRect(660, 140, 272, 318, 32);
                          else ctx.rect(660, 140, 272, 318);
                          ctx.fill();
                          ctx.drawImage(qrCanvas, 696, 172, 200, 200);
                        }

                        const dataUrl = canvas.toDataURL('image/png');
                        const link = document.createElement('a');
                        link.download = `E-ID_RT02_Blok_${currentHouse?.block || 'RT'}_${currentHouse?.number || '02'}.png`;
                        link.href = dataUrl;
                        link.click();
                        toast.success('Kartu E-ID Berhasil Diunduh!');
                      } catch (e) {
                        toast.error('Gagal mengunduh kartu E-ID');
                      }
                    }}
                    className="py-3 px-5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border-slate-200 hover:bg-slate-50 cursor-pointer"
                  >
                    <Download size={15} /> Unduh Gambar PNG
                  </Button>
                </div>
              </div>

              {/* Quick Info Sidebar */}
              <div className="space-y-6 text-left">
                {/* Iuran Warning */}
                {!isAllPaid && (
                  <div className={`p-6 rounded-[2rem] border-2 ${isMandatory ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      <div className={`p-3.5 rounded-2xl shadow-sm shrink-0 ${isMandatory ? 'bg-white text-rose-600' : 'bg-white text-amber-600'}`}>
                        <AlertTriangle size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-sm font-black uppercase tracking-widest mb-1 ${isMandatory ? 'text-rose-900' : 'text-amber-900'}`}>
                          {isMandatory ? 'Layanan Ditangguhkan' : 'Tagihan Iuran Tersedia'}
                        </h4>
                        <p className={`text-xs font-semibold leading-relaxed mb-4 ${isMandatory ? 'text-rose-700' : 'text-amber-700'}`}>
                          {isMandatory 
                            ? `Layanan administrasi ditangguhkan sementara karena iuran bulan ${currentMonth} belum diselesaikan (melewati jatuh tempo tgl 20).` 
                            : `Tagihan pembayaran iuran bulan ${currentMonth} telah dirilis. Harap koordinasi sebelum jatuh tempo.`}
                        </p>
                        <div className="flex flex-col gap-2">
                          <Button 
                            onClick={() => setIsIuranModalOpen(true)}
                            className={`h-11 px-6 text-[10px] font-black uppercase tracking-widest w-full shadow-md cursor-pointer ${isMandatory ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-55'}`}
                          >
                            Lihat Rincian
                          </Button>
                          <Button 
                            variant="secondary" 
                            onClick={() => window.open(`https://wa.me/${(currentHouse?.phone || '6285961194621').toString().replace(/^0/, '62').replace(/\D/g, '')}`, '_blank')}
                            className="h-11 px-6 text-[10px] font-black uppercase tracking-widest w-full bg-white border-slate-200 cursor-pointer"
                          >
                            Hubungi Pengurus RT
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Card className="bg-white border-slate-100 shadow-sm">
                  <h4 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
                    <Info size={16} className="text-indigo-600" /> Informasi Hunian & Kunci
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Jumlah Penghuni</span>
                      <span className="text-xs font-black text-slate-800">{currentHouse?.occupants || 0} Jiwa</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status Tinggal</span>
                      <span className="text-xs font-black text-slate-800">{currentHouse?.residenceType || 'Tetap'}</span>
                    </div>
                    {currentHouse?.phone && (
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">No. Telepon WA</span>
                        <span className="text-xs font-black text-slate-800">{currentHouse.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">PIN Akses Rumah</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 select-all relative group">
                          {showPin ? currentHouse?.accessCode : '••••••'}
                        </span>
                        <button 
                          onClick={() => setShowPin(!showPin)} 
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
                          title="Tampilkan PIN"
                        >
                          {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button 
                          onClick={() => currentHouse?.accessCode && handleCopyToClipboard(currentHouse.accessCode, 'pin')} 
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
                          title="Salin PIN"
                        >
                          <CreditCard size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-indigo-50 border-indigo-100 shadow-sm p-5 text-left">
                  <h4 className="font-black text-indigo-900 text-sm mb-2 flex items-center gap-1.5">
                    <QrCode size={16} /> Manfaat E-ID Aktif
                  </h4>
                  <p className="text-[11px] text-indigo-700 font-medium leading-relaxed mb-4">
                    Gunakan Barcode di samping saat verifikasi kehadiran rapat RT, pengambilan kupon bantuan, kerja bakti, maupun saat pembayaran retribusi iuran tunai.
                  </p>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => {
                        try {
                          // Create high-res canvas for crisp rendering
                          const canvas = document.createElement('canvas');
                          canvas.width = 1012;
                          canvas.height = 638;
                          const ctx = canvas.getContext('2d');
                          if (!ctx) {
                            throw new Error('Canvas context not available');
                          }

                          // 1. Clip boundaries as rounded corner card
                          ctx.beginPath();
                          if (ctx.roundRect) {
                            ctx.roundRect(0, 0, 1012, 638, 48);
                          } else {
                            ctx.rect(0, 0, 1012, 638);
                          }
                          ctx.clip();

                          // 2. Draw modern luxury cosmic deep space gradient
                          const gradient = ctx.createLinearGradient(0, 0, 1012, 638);
                          gradient.addColorStop(0, '#4f46e5'); // Indigo-600
                          gradient.addColorStop(0.5, '#312e81'); // Indigo-900
                          gradient.addColorStop(1, '#0f172a'); // Slate-900
                          ctx.fillStyle = gradient;
                          ctx.fillRect(0, 0, 1012, 638);

                          // Ambient background layers/glows
                          ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
                          ctx.beginPath();
                          ctx.arc(1012, 0, 380, 0, Math.PI * 2);
                          ctx.fill();

                          ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
                          ctx.beginPath();
                          ctx.arc(0, 638, 300, 0, Math.PI * 2);
                          ctx.fill();

                          // 3. Draw Header "KARTU WARGA DIGITAL"
                          ctx.fillStyle = '#ffffff';
                          ctx.font = '900 36px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
                          ctx.textAlign = 'left';
                          ctx.fillText('KARTU WARGA DIGITAL', 80, 150);

                          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                          ctx.font = 'bold 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
                          ctx.fillText('RUKUN TETANGGA 02 / RW 05', 80, 185);

                          // "E-ID AKTIF" pill badge
                          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                          ctx.beginPath();
                          if (ctx.roundRect) {
                            ctx.roundRect(80, 70, 140, 34, 17);
                          } else {
                            ctx.rect(80, 70, 140, 34);
                          }
                          ctx.fill();

                          // Green circle
                          ctx.fillStyle = '#10b981';
                          ctx.beginPath();
                          ctx.arc(102, 87, 5, 0, Math.PI * 2);
                          ctx.fill();

                          ctx.fillStyle = '#ffffff';
                          ctx.font = '900 11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
                          ctx.fillText('E-ID AKTIF', 115, 91);

                          // 4. Draw family head/resident name
                          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                          ctx.font = '900 12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
                          ctx.fillText('NAMA KEPALA KELUARGA / PENGHUNI', 80, 290);

                          ctx.fillStyle = '#ffffff';
                          ctx.font = '900 38px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
                          ctx.fillText((currentHouse?.headOfFamily || 'Anggota RT 02').toUpperCase(), 80, 345);

                          // 5. Draw ID Hunian
                          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                          ctx.font = '900 12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
                          ctx.fillText('NOMOR HUNIAN AKTIF', 80, 435);

                          ctx.fillStyle = '#ffffff';
                          ctx.font = '900 28px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
                          ctx.fillText(`BLOK ${currentHouse?.block}-${currentHouse?.number}`, 80, 480);

                          // 6. Draw Status Iuran Pill
                          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                          ctx.font = '900 12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
                          ctx.fillText('REKENING IURAN RT', 380, 435);

                          ctx.fillStyle = isAllPaid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)';
                          ctx.beginPath();
                          if (ctx.roundRect) {
                            ctx.roundRect(380, 452, 175, 36, 10);
                          } else {
                            ctx.rect(380, 452, 175, 36);
                          }
                          ctx.fill();

                          ctx.fillStyle = isAllPaid ? '#34d399' : '#fbbf24';
                          ctx.font = '900 12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
                          ctx.fillText(isAllPaid ? '✔ LUNAS AKTIF' : '⚠ TAGIHAN BARU', 396, 474);

                          // 7. Watermark / Credit footer
                          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                          ctx.font = '800 11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
                          ctx.fillText('TERAS WARGA RT02 • DIKELOLA SECARA MANDIRI & TRANSPARAN', 80, 565);

                          // 8. Draw QR Code White Container
                          ctx.fillStyle = '#ffffff';
                          ctx.beginPath();
                          if (ctx.roundRect) {
                            ctx.roundRect(660, 140, 272, 318, 32);
                          } else {
                            ctx.rect(660, 140, 272, 318);
                          }
                          ctx.fill();

                          // 9. Fetch and draw QR Code from our hidden QRCodeCanvas
                          const qrCanvas = document.getElementById('resident-qrcode-canvas') as HTMLCanvasElement;
                          if (qrCanvas) {
                            ctx.drawImage(qrCanvas, 696, 172, 200, 200);
                          }

                          // Text inside white card below QR
                          ctx.fillStyle = '#475569'; // Slate 600
                          ctx.font = '900 12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
                          ctx.textAlign = 'center';
                          ctx.fillText('PINDAI VERIFIKASI', 796, 405);
                          ctx.font = 'bold 9px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
                          ctx.fillStyle = '#94a3b8'; // Slate 400
                          ctx.fillText('PEMERINTAH KOTA KELURAHAN', 796, 423);

                          // 10. Generate PNG Data & Trigger Download
                          const dataUrl = canvas.toDataURL('image/png');
                          const link = document.createElement('a');
                          link.download = `E-ID_RT02_Blok_${currentHouse?.block || 'RT'}_${currentHouse?.number || '02'}.png`;
                          link.href = dataUrl;
                          link.click();
                          
                          toast.success('Kartu E-ID Berhasil Diunduh!', {
                            description: 'Kartu E-ID Warga Digital Anda telah disimpan ke galeri perangkat Anda.'
                          });
                        } catch (err) {
                          console.error('Error generating card image:', err);
                          toast.error('Gagal Mengunduh Kartu', {
                            description: 'Terjadi kegagalan render identitas digital lokal.'
                          });
                        }
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-[10px] font-black uppercase tracking-widest h-11 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Download size={14} /> Unduh & Simpan Kartu E-ID
                    </Button>
                    <div className="pt-2 border-t border-indigo-200/50 text-left">
                      <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Notifikasi Pemberitahuan</p>
                      <NotificationToggle userId={selectedHouseId} />
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* C. DETAIL PROFIL KEPALA KELUARGA (Full Profile of Head of Family) */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-6 md:p-8 text-left mt-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-50">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Detail Profil Kepala Keluarga</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Rincian data identitas kependudukan, status sosial, dan fasilitas hunian Anda.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('update')}
                  className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Ajukan Perubahan Data →
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Shield size={11} className="text-slate-450"/> NIK Kepala Keluarga</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono font-black text-slate-800">
                      {formatSensitiveNik(currentHouse?.nik || '', !!showFullNiks['nik'])}
                    </p>
                    {currentHouse?.nik && (
                      <button 
                        onClick={() => toggleNikVisibility('nik')}
                        className="p-0.5 hover:bg-slate-200/50 rounded text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center justify-center cursor-pointer"
                        title={showFullNiks['nik'] ? "Sembunyikan NIK" : "Tampilkan NIK"}
                      >
                        {showFullNiks['nik'] ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Users size={11} className="text-slate-450"/> Nomor Kartu Keluarga</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono font-black text-slate-800">
                      {formatSensitiveNik(currentHouse?.kkNumber || '', !!showFullNiks['kkNumber'])}
                    </p>
                    {currentHouse?.kkNumber && (
                      <button 
                        onClick={() => toggleNikVisibility('kkNumber')}
                        className="p-0.5 hover:bg-slate-200/50 rounded text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center justify-center cursor-pointer"
                        title={showFullNiks['kkNumber'] ? "Sembunyikan No. KK" : "Tampilkan No. KK"}
                      >
                        {showFullNiks['kkNumber'] ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><User size={11} className="text-slate-450"/> Jenis Kelamin</p>
                  <p className="text-xs font-black text-slate-800">{currentHouse?.gender || '-'}</p>
                </div>

                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar size={11} className="text-slate-450"/> Kelahiran</p>
                  <p className="text-xs font-black text-slate-800 truncate">
                    {currentHouse?.birthPlace || '-'}{currentHouse?.birthDate ? `, ${currentHouse?.birthDate}` : ''}
                  </p>
                </div>

                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Briefcase size={11} className="text-slate-450"/> Pekerjaan</p>
                  <p className="text-xs font-black text-slate-800 truncate">{currentHouse?.job || currentHouse?.jobCategory || '-'}</p>
                </div>

                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><GraduationCap size={11} className="text-slate-450"/> Pendidikan</p>
                  <p className="text-xs font-black text-slate-800 truncate">{currentHouse?.education || '-'}</p>
                </div>

                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Heart size={11} className="text-slate-450"/> Golongan Darah</p>
                  <p className="text-xs font-black text-slate-800">{currentHouse?.bloodType || '-'}</p>
                </div>

                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Globe size={11} className="text-slate-450"/> Kewarganegaraan</p>
                  <p className="text-xs font-black text-slate-800">{currentHouse?.nationality || 'WNI'}</p>
                </div>

                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Activity size={11} className="text-slate-450"/> Status BPJS</p>
                  <p className="text-xs font-black text-slate-800">{currentHouse?.bpjsStatus || 'Tidak Ada'}</p>
                </div>

                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><ShieldCheck size={11} className="text-slate-450"/> Status Vaksinasi</p>
                  <p className="text-xs font-black text-slate-800">{currentHouse?.vaccinationStatus || 'Tidak Ada Data'}</p>
                </div>

                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><DollarSign size={11} className="text-slate-450"/> Status Ekonomi</p>
                  <p className="text-xs font-black text-slate-800">{currentHouse?.economicStatus || 'Sejahtera'}</p>
                </div>

                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Shield size={11} className="text-slate-450"/> Kewajiban Ronda</p>
                  <p className="text-xs font-black text-slate-800">
                    {currentHouse?.rondaExempt ? 'Bebas Tugas Siskamling' : 'Wajib Ronda Aktif'}
                  </p>
                </div>

                {currentHouse?.addressKtp && (
                  <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/85 col-span-2 md:col-span-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><MapPin size={11} className="text-slate-450"/> Alamat Sesuai KTP</p>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed">{currentHouse.addressKtp}</p>
                  </div>
                )}
              </div>
            </div>

            {/* A. DAFTAR ANGGOTA KELUARGA (Family Members Section) */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-6 md:p-8 text-left mt-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-50">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Anggota Keluarga Terdaftar</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Daftar resmi penghuni rumah yang tercatat pada database kependudukan RT 002.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-black">
                    {currentHouse?.occupants || currentHouse?.familyMembers?.length || 1} Jiwa Terdaftar
                  </span>
                  <button 
                    onClick={() => setActiveTab('update')}
                    className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Edit KK Mandiri →
                  </button>
                </div>
              </div>

              {/* Demographic Summary Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Jiwa</span>
                  <span className="text-lg font-black text-slate-800 mt-0.5 block">{currentHouse?.occupants || 0} Orang</span>
                </div>
                <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 text-center">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Laki-Laki</span>
                  <span className="text-lg font-black text-blue-900 mt-0.5 block">{maleCount} Jiwa</span>
                </div>
                <div className="p-3 bg-pink-50/50 rounded-2xl border border-pink-100 text-center">
                  <span className="text-[10px] font-bold text-pink-700 uppercase tracking-wider block">Perempuan</span>
                  <span className="text-lg font-black text-pink-900 mt-0.5 block">{femaleCount} Jiwa</span>
                </div>
                <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Verifikasi RT</span>
                  <span className="text-lg font-black text-emerald-900 mt-0.5 block">
                    {currentHouse?.isVerified ? 'Tervalidasi' : 'Belum'}
                  </span>
                </div>
              </div>

              {currentHouse?.familyMembers && currentHouse.familyMembers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentHouse.familyMembers.map((member: any, index: number) => {
                    const isMale = member.gender === 'Laki-laki';
                    return (
                      <div key={index} className="p-4 bg-slate-50/60 hover:bg-slate-50 rounded-2xl border border-slate-100/90 flex items-start gap-3.5 transition-all shadow-xs">
                        <div className={`p-3 rounded-2xl shrink-0 ${isMale ? 'bg-blue-100/70 text-blue-700' : 'bg-pink-100/70 text-pink-700'}`}>
                          <User size={20} />
                        </div>
                        <div className="flex-1 space-y-1.5 overflow-hidden">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-extrabold text-slate-800 text-sm truncate">{member.name || '-' }</h4>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                              member.relation === 'Kepala Keluarga' 
                                ? 'bg-indigo-100 text-indigo-800' 
                                : member.relation === 'Istri' 
                                  ? 'bg-pink-100 text-pink-800' 
                                  : member.relation === 'Anak' 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : 'bg-slate-200/80 text-slate-700'
                            }`}>
                              {member.relation || 'Anggota'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                            <span>NIK:</span>
                            <span className="font-mono text-slate-600 font-bold">
                              {formatSensitiveNik(member.nik, !!showFullNiks[`member-${index}`])}
                            </span>
                            {member.nik && (
                              <button 
                                onClick={() => toggleNikVisibility(`member-${index}`)}
                                className="p-0.5 hover:bg-slate-200/60 rounded text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center justify-center cursor-pointer"
                                title={showFullNiks[`member-${index}`] ? "Sembunyikan NIK" : "Tampilkan NIK"}
                              >
                                {showFullNiks[`member-${index}`] ? <EyeOff size={12} /> : <Eye size={12} />}
                              </button>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] text-slate-500 font-medium">
                            {member.birthDate && (
                              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-100">
                                <Calendar size={10} className="text-slate-400" />
                                {member.birthDate}
                              </span>
                            )}
                            {member.job && (
                              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-100 truncate max-w-[130px]">
                                <Briefcase size={10} className="text-slate-400" />
                                {member.job}
                              </span>
                            )}
                            {member.bpjsStatus && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                                member.bpjsStatus.toLowerCase().includes('aktif') 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                <Activity size={10} />
                                {member.bpjsStatus}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-150 p-6 flex flex-col items-center justify-center">
                  <p className="text-slate-400 text-xs font-medium">Belum ada anggota keluarga sekunder yang didaftarkan secara detail.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('update')} 
                    className="mt-3 text-[10px] font-black uppercase tracking-widest cursor-pointer scale-90 border-slate-200"
                  >
                    Lengkapi Anggota KK Sekarang
                  </Button>
                </div>
              )}
            </div>

            {/* B. AKTIVITAS & LOG LAINNYA TERBARU TIMELINE (Recent activity list widget) */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-6 md:p-8 text-left mt-8">
              <div className="mb-6 pb-4 border-b border-slate-50">
                <h3 className="text-lg font-black text-slate-800">Timeline Pelacakan & Aktivitas</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Pantau update terbaru dari segala aduan, surat, dan permohonan yang diajukan oleh hunian Anda.</p>
              </div>

              {(() => {
                const combinedActivities: any[] = [];
                
                letters.forEach(item => {
                  combinedActivities.push({
                    id: item.id,
                    title: `Permohonan: ${item.type}`,
                    createdAt: item.date || (item as any).createdAt || '',
                    status: item.status,
                    tag: 'surat',
                    color: 'text-indigo-600 bg-indigo-50',
                    desc: item.purposeDetail || 'Pengurusan surat pengantar rujukan.'
                  });
                });

                reports.forEach(item => {
                  combinedActivities.push({
                    id: item.id,
                    title: `Aduan Warga: ${item.type}`,
                    createdAt: item.date || (item as any).createdAt || '',
                    status: item.status,
                    tag: 'lapor',
                    color: 'text-rose-600 bg-rose-50',
                    desc: item.description || 'Laporan kejadian / aduan kerusakan.'
                  });
                });

                guestReports.forEach(item => {
                  combinedActivities.push({
                    id: item.id,
                    title: `Tamu Bermalam: ${item.guestName}`,
                    createdAt: item.createdAt || '',
                    status: item.status === 'Active' ? 'Active' : 'Checkout',
                    tag: 'guests',
                    color: 'text-amber-600 bg-amber-50',
                    desc: `Tamu hubungan ${item.relationship} menginap selama ${item.stayDuration}.`
                  });
                });

                updateRequests.forEach(item => {
                  combinedActivities.push({
                    id: item.id,
                    title: `Update KK Mandiri`,
                    createdAt: item.createdAt || '',
                    status: item.status || 'Menunggu',
                    tag: 'update',
                    color: 'text-emerald-600 bg-emerald-50',
                    desc: item.reason || 'Permohonan pembaruan data kependudukan.'
                  });
                });

                // Sort descending
                const sortedHistoryList = combinedActivities.sort((a, b) => {
                  const dateA = new Date(a.createdAt || 0).getTime();
                  const dateB = new Date(b.createdAt || 0).getTime();
                  return dateB - dateA;
                }).slice(0, 4);

                if (sortedHistoryList.length === 0) {
                  return (
                    <div className="py-12 text-center bg-slate-50/50 rounded-2xl flex flex-col items-center justify-center">
                      <History className="text-slate-350 mb-2" size={32} />
                      <p className="text-slate-400 text-xs font-semibold">Belum ada catatan permohonan administrasi atau laporan.</p>
                    </div>
                  );
                }

                return (
                  <div className="relative border-l-2 border-slate-100 pl-6 ml-4 space-y-8 py-2 text-left">
                    {sortedHistoryList.map((act, index) => {
                      const dateText = act.createdAt ? new Date(act.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Menunggu antrean';

                      const isDone = ['disetujui', 'approved', 'selesai', 'issued', 'tuntas', 'completed', 'active', 'aktif'].includes(String(act.status).toLowerCase());
                      const isRejected = ['ditolak', 'rejected', 'batal'].includes(String(act.status).toLowerCase());
                      
                      let badgeStyle = "bg-amber-50 text-amber-700 border-amber-100";
                      if (isDone) badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-100";
                      if (isRejected) badgeStyle = "bg-rose-50 text-rose-700 border-rose-100";

                      return (
                        <div key={act.id} className="relative group text-left">
                          {/* Dot item list */}
                          <span className="absolute -left-[35px] top-1.5 focus:outline-none w-4.5 h-4.5 rounded-full border-4 border-white bg-indigo-500 shadow-sm shrink-0" />
                          
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-800 hover:text-indigo-600 transition-colors">{act.title}</span>
                              <span className="text-[10px] font-bold text-slate-400 truncate max-w-[80px] font-mono">#{act.id.slice(0,6)}...</span>
                            </div>
                            
                            <div className="flex items-center gap-2 self-start md:self-auto">
                              <span className="text-[9px] font-mono text-slate-400 font-bold">{dateText}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${badgeStyle}`}>
                                {act.status === 'Active' ? 'Aktif' : act.status}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{act.desc}</p>
                          
                          <button
                            onClick={() => setActiveTab(act.tag as any)}
                            className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 mt-2 hover:underline tracking-wider uppercase block"
                          >
                            Lihat di Tab {act.tag.toUpperCase()} →
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}

        {activeTab === 'water' && (
          <motion.div
            key="water"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 text-left"
          >
            {/* Hero Header Air Bersih */}
            <div className="relative overflow-hidden bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-800 rounded-[2.5rem] p-6 sm:p-8 text-white shadow-xl">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-12 translate-x-12 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-cyan-100">
                    <Droplets className="w-3.5 h-3.5 animate-pulse" />
                    Utilitas Air Bersih PDAM • RT 002
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Catat Meter Air Mandiri (PDAM)
                  </h3>
                  <p className="text-cyan-100 text-xs sm:text-sm max-w-xl">
                    Pengelolaan air bersih kini resmi dikelola oleh <strong>PDAM Kota Palu</strong> dengan skema iuran <strong>Rp 35.000 / 10 m³ pertama</strong> (+ Rp 3.500/m³ kelebihan pemakaian). Kirim angka meteran sebelum tanggal {waterUtilityConfig.readingDueDate} setiap bulan.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    onClick={() => {
                      setWaterInputReading(currentWaterReading ? currentWaterReading.currentReading : '');
                      setWaterPhoto(currentWaterReading?.photoUrl || '');
                      setIsWaterModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-blue-700 hover:bg-cyan-50 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-black/10 transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    {currentWaterReading ? 'Update Catatan Meter' : 'Catat Meter Bulan Ini'}
                  </button>
                </div>
              </div>
            </div>

            {/* Current Month Status Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Box 1: Status Bulan Ini */}
              <Card className="p-6 border-slate-100 rounded-[2rem] bg-white shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Periode Tagihan</span>
                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                    currentWaterReading 
                      ? (currentWaterReading.status === 'Terverifikasi' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200')
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {currentWaterReading ? currentWaterReading.status : 'Belum Dicatat'}
                  </span>
                </div>

                <div>
                  <div className="text-2xl font-black text-slate-800">
                    {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Batas catat mandiri: <strong className="text-blue-600">Tgl {waterUtilityConfig.readingDueDate} {new Date().toLocaleDateString('id-ID', { month: 'short' })}</strong>
                  </p>
                </div>

                {currentWaterReading?.adminNotes && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                    <span className="font-bold block text-slate-700 mb-0.5">Catatan Pengurus RT:</span>
                    {currentWaterReading.adminNotes}
                  </div>
                )}
              </Card>

              {/* Box 2: Kubikasi Pemakaian */}
              <Card className="p-6 border-slate-100 rounded-[2rem] bg-white shadow-sm space-y-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Volume Pemakaian</span>
                <div>
                  <div className="text-3xl font-black text-blue-600 flex items-baseline gap-1">
                    {currentWaterReading ? currentWaterReading.usage : 0}
                    <span className="text-sm font-bold text-slate-400">m³</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {currentWaterReading ? (
                      `Meter Lalu: ${currentWaterReading.previousReading} m³ → Baru: ${currentWaterReading.currentReading} m³`
                    ) : (
                      `Meter Terakhir: ${previousReadingNumber} m³`
                    )}
                  </p>
                </div>
                <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 flex justify-between">
                  <span>Dicatat oleh:</span>
                  <span className="font-bold text-slate-700">{currentWaterReading?.recordedByName || (currentWaterReading ? 'Warga' : '-')}</span>
                </div>
              </Card>

              {/* Box 3: Total Tagihan */}
              <Card className="p-6 border-slate-100 rounded-[2rem] bg-gradient-to-br from-emerald-50/50 to-white shadow-sm space-y-4 border-emerald-100">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Total Tagihan Air</span>
                <div>
                  <div className="text-3xl font-black text-emerald-600">
                    Rp {currentWaterReading ? currentWaterReading.totalAmount.toLocaleString('id-ID') : 0}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {waterUtilityConfig.billingMode === 'pdam'
                      ? `Paket Dasar PDAM (10 m³: Rp ${(waterUtilityConfig.baseFee || 35000).toLocaleString('id-ID')})`
                      : waterUtilityConfig.billingMode === 'flat' 
                      ? 'Tarif flat lingkungan' 
                      : `Kubikasi (${waterUtilityConfig.ratePerM3}/m³)`}
                  </p>
                </div>
                <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex justify-between">
                  <span>Kelebihan Pemakaian:</span>
                  <span className="font-bold text-slate-700">
                    {currentWaterReading ? `${currentWaterReading.excessUsage || 0} m³ (Rp ${(currentWaterReading.excessFee || 0).toLocaleString('id-ID')})` : '-'}
                  </span>
                </div>
              </Card>
            </div>

            {/* Photo Evidence Card (if recorded) */}
            {currentWaterReading?.photoUrl && (
              <Card className="p-6 border-slate-100 rounded-[2rem] bg-white shadow-sm">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  Foto Bukti Angka Meteran Bulan Ini
                </h4>
                <div className="max-w-md rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                  <img
                    src={currentWaterReading.photoUrl}
                    alt="Foto Meteran Air"
                    className="w-full h-56 object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Card>
            )}

            {/* Historical Usage Chart */}
            <Card className="p-6 sm:p-8 border-slate-100 rounded-[2.5rem] bg-white shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h4 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Tren Pemakaian Air Keluarga (m³)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Grafik riwayat kubikasi meteran air dari bulan ke bulan.</p>
                </div>
              </div>

              {houseWaterReadings.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <Droplets className="w-10 h-10 mx-auto mb-2 text-slate-300 opacity-50" />
                  Belum ada rekaman riwayat meter air sebelumnya.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[...houseWaterReadings].reverse().map(r => ({
                        period: r.period,
                        usage: r.usage,
                        total: r.totalAmount
                      }))}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                        formatter={(val: any) => [`${val} m³`, 'Pemakaian']}
                        labelFormatter={(label) => `Periode: ${label}`}
                      />
                      <Area type="monotone" dataKey="usage" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#waterGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* History Table */}
            <Card className="p-6 border-slate-100 rounded-[2.5rem] bg-white shadow-sm overflow-hidden">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">
                Riwayat Pencatatan Terdahulu
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Periode</th>
                      <th className="py-3 px-4 text-center">Meter Awal</th>
                      <th className="py-3 px-4 text-center">Meter Akhir</th>
                      <th className="py-3 px-4 text-center">Pemakaian</th>
                      <th className="py-3 px-4 text-right">Tagihan</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {houseWaterReadings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Belum ada riwayat pencatatan.
                        </td>
                      </tr>
                    ) : (
                      houseWaterReadings.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-700">{r.period}</td>
                          <td className="py-3 px-4 text-center font-mono">{r.previousReading} m³</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">{r.currentReading} m³</td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              {r.usage} m³
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600">
                            Rp {r.totalAmount.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.status === 'Terverifikasi' 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : r.status === 'Ditolak' 
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'letters' && (
          <motion.div 
            key="letters"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800">Status Pengajuan Surat</h3>
                <p className="text-sm text-slate-500 font-medium">Pantau status surat pengantar yang Anda ajukan melalui menu Layanan.</p>
              </div>
              <Button onClick={() => window.location.hash = '#/services'} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                <Plus size={18} className="mr-2" /> Buat Pengajuan
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {letters.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                  <p className="text-slate-500 font-bold">Belum ada pengajuan surat.</p>
                </div>
              ) : (
                [...letters].sort((a, b) => {
                  const isNewA = a.status === 'Menunggu' || a.status === 'Pending';
                  const isNewB = b.status === 'Menunggu' || b.status === 'Pending';
                  if (isNewA && !isNewB) return -1;
                  if (!isNewA && isNewB) return 1;
                  
                  const timeA = a.date ? new Date(a.date).getTime() : 0;
                  const timeB = b.date ? new Date(b.date).getTime() : 0;
                  return timeB - timeA;
                }).map(letter => {
                  const dateObj = new Date(letter.date);
                  const formattedDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Makassar' });
                  const hasTime = letter.date && (letter.date.includes('T') || letter.date.includes(':'));
                  const formattedTime = hasTime && !isNaN(dateObj.getTime()) ? dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Makassar' }) + ' WITA' : '';
                  
                  return (() => {
                    const isApproved = letter.status === 'Disetujui' || letter.status === 'Approved';
                    const isRejected = letter.status === 'Ditolak' || letter.status === 'Rejected';
                    const isPending = !isApproved && !isRejected;

                    const timelineSteps = [
                      {
                        title: 'Pengajuan Dikirim',
                        description: 'Permohonan surat pengantar berhasil dikirim oleh warga.',
                        status: 'completed',
                        date: formattedDate,
                        time: formattedTime,
                      },
                      {
                        title: 'Verifikasi Administrasi',
                        description: isPending 
                          ? 'Ketua RT sedang meninjau kelengkapan berkas dan NIK Pemohon.' 
                          : 'Berkas dan keaslian NIK warga telah dikonfirmasi oleh Ketua RT.',
                        status: isPending ? 'active' : 'completed',
                      },
                      {
                        title: 'Penomoran & Tanda Tangan',
                        description: isApproved 
                          ? `Ketua RT telah menandatangani surat dengan No: ${letter.letterNumber || '-'}.` 
                          : isRejected 
                          ? 'Proses penomoran dibatalkan karena pengajuan ditolak.' 
                          : 'Sedang menunggu antrean penomoran surat resmi.',
                        status: isApproved ? 'completed' : isRejected ? 'failed' : 'pending',
                      },
                      {
                        title: isRejected ? 'Pengajuan Ditolak' : 'Surat Selesai',
                        description: isApproved 
                          ? 'Surat pengantar selesai diproses dan siap untuk diunduh / dicetak.' 
                          : isRejected 
                          ? `Maaf, permohonan ditolak. Alasan: ${letter.estimatedTime || 'Dokumen kurang lengkap atau tidak sesuai.'}`
                          : 'Surat akan otomatis terbit setelah disetujui.',
                        status: isApproved ? 'completed' : isRejected ? 'failed' : 'pending',
                      }
                    ];

                    return (
                      <Card key={letter.id} className="bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50/50 transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                <FileText size={20} />
                              </div>
                              <div>
                                <h4 className="font-black text-slate-800">{letter.type}</h4>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex flex-col mt-0.5">
                                  <span>Diajukan: {formattedDate}</span>
                                  {formattedTime && <span className="text-indigo-600 font-extrabold mt-0.5">{formattedTime}</span>}
                                </div>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              isApproved ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                              isRejected ? 'bg-rose-50 text-rose-600 border-rose-200' :
                              'bg-amber-50 text-amber-600 border-amber-200'
                            }`}>
                              {letter.status === 'Approved' ? 'Disetujui' : letter.status === 'Rejected' ? 'Ditolak' : letter.status === 'Pending' ? 'Menunggu' : letter.status}
                            </span>
                          </div>
                          <div className="space-y-3">
                            <div className="p-3 bg-slate-50 rounded-xl">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Keperluan</p>
                              <p className="text-xs font-semibold text-slate-700 leading-relaxed">{letter.purposeDetail}</p>
                            </div>
                            {letter.nik && (
                              <p className="text-[11px] font-bold text-slate-500 inline-flex items-center gap-1.5">
                                NIK Pemohon: <span className="text-slate-700 font-mono">{formatSensitiveNik(letter.nik, !!showFullNiks[`letter-${letter.id}`])}</span>
                                <button 
                                  onClick={() => toggleNikVisibility(`letter-${letter.id}`)}
                                  className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                  title={showFullNiks[`letter-${letter.id}`] ? "Sembunyikan NIK" : "Tampilkan NIK"}
                                >
                                  {showFullNiks[`letter-${letter.id}`] ? <EyeOff size={11} /> : <Eye size={11} />}
                                </button>
                              </p>
                            )}
                            {letter.letterNumber && (
                              <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs">
                                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Nomor Surat Resmi</p>
                                <p className="font-black text-indigo-700">{letter.letterNumber}</p>
                              </div>
                            )}
                          </div>

                          {/* Timeline Status Pelacakan */}
                          <div className="mt-5 pt-4 border-t border-slate-100">
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-1.5 font-sans">
                              <Clock size={12} className="text-indigo-500" /> ALUR PELACAKAN STATUS SURAT
                            </p>
                            <div className="space-y-4 relative pl-3.5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                              {timelineSteps.map((step, idx) => {
                                let iconBg = 'bg-slate-100 text-slate-400';
                                let titleColor = 'text-slate-400 font-bold';
                                let iconElement = <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />;
                                
                                if (step.status === 'completed') {
                                  iconBg = 'bg-emerald-500 text-white';
                                  titleColor = 'text-slate-800 font-extrabold';
                                  iconElement = <Check size={10} className="stroke-[3]" />;
                                } else if (step.status === 'active') {
                                  iconBg = 'bg-indigo-600 text-white animate-pulse';
                                  titleColor = 'text-indigo-700 font-extrabold';
                                  iconElement = <Clock size={10} className="stroke-[3]" />;
                                } else if (step.status === 'failed') {
                                  iconBg = 'bg-rose-500 text-white';
                                  titleColor = 'text-rose-600 font-extrabold';
                                  iconElement = <X size={10} className="stroke-[3]" />;
                                }

                                return (
                                  <div key={idx} className="relative flex gap-3 text-xs">
                                    <div className={`absolute -left-[23px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-xs z-10 ${iconBg}`}>
                                      {iconElement}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-center gap-2">
                                        <span className={titleColor}>{step.title}</span>
                                        {step.date && (
                                          <span className="text-[9px] font-bold text-slate-400 font-mono whitespace-nowrap">
                                            {step.date} {step.time ? `• ${step.time}` : ''}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">
                                        {step.description}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Download PDF Section */}
                        {isApproved && (
                          <div className="mt-5 pt-4 border-t border-slate-100">
                            <Button 
                              onClick={async () => {
                                try {
                                  await generateSuratPengantar(letter, pdfConfig, false);
                                  toast.success('Surat Pengantar berhasil diunduh!');
                                } catch (error) {
                                  console.error(error);
                                  toast.error('Gagal mengunduh Surat Pengantar PDF.');
                                }
                              }}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/15 animate-bounce-short"
                            >
                              <Download size={14} /> Unduh Surat Pengantar Resmi (PDF)
                            </Button>
                          </div>
                        )}
                      </Card>
                    );
                  })();
                })
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'update' && (
          <motion.div 
            key="update"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800">Pembaruan Data Mandiri</h3>
                <p className="text-sm text-slate-500 font-medium">Ajukan perubahan data jika ada ketidaksesuaian atau penambahan penghuni.</p>
              </div>
              <Button onClick={() => setIsUpdateModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                <FileEdit size={18} className="mr-2" /> Ajukan Perubahan
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {updateRequests.length > 0 ? (
                updateRequests.map((req) => (
                  <Card 
                    key={req.id} 
                    className="p-6 bg-white border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setSelectedRequest(req)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-2xl ${
                        req.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-600' :
                        req.status === 'Ditolak' ? 'bg-rose-50 text-rose-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {req.status === 'Disetujui' ? <CheckCircle size={24} /> : 
                         req.status === 'Ditolak' ? <AlertCircle size={24} /> : 
                         <Clock size={24} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black text-slate-800">Permohonan Update Data</h4>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                            req.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-600' :
                            req.status === 'Ditolak' ? 'bg-rose-100 text-rose-600' :
                            'bg-amber-100 text-amber-600'
                          }`}>
                            {req.status === 'Menunggu' ? 'Menunggu Review' : req.status === 'Disetujui' ? 'Disetujui' : 'Ditolak'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium line-clamp-1">{req.reason}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Diajukan: {new Date(req.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          {req.updatedAt && (
                            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
                              Diproses: {new Date(req.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </Card>
                ))
              ) : (
                <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4">
                    <FileEdit size={32} />
                  </div>
                  <h4 className="font-black text-slate-800 mb-1">Belum Ada Pengajuan</h4>
                  <p className="text-xs text-slate-400 font-medium">Data Anda saat ini sudah sesuai dengan catatan RT.</p>
                </div>
              )}
            </div>

            <Modal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} title="Formulir Update Data">
              <form onSubmit={handleUpdateSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <User size={14} /> Identitas Kepala Keluarga / Penghuni
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Nama Kepala Keluarga / Penghuni</label>
                        <input 
                          type="text" 
                          required
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          value={updateForm.headOfFamily}
                          onChange={e => setUpdateForm({...updateForm, headOfFamily: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Jenis Kelamin</label>
                        <select 
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          value={updateForm.gender}
                          onChange={e => setUpdateForm({...updateForm, gender: e.target.value as any})}
                        >
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Tempat Lahir</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          value={updateForm.birthPlace}
                          onChange={e => setUpdateForm({...updateForm, birthPlace: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Tanggal Lahir</label>
                        <input 
                          type="date" 
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          value={updateForm.birthDate}
                          onChange={e => setUpdateForm({...updateForm, birthDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">No. Telepon (WA)</label>
                        <input 
                          type="tel" 
                          required
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          value={updateForm.phone}
                          onChange={e => setUpdateForm({...updateForm, phone: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Golongan Darah</label>
                        <select 
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          value={updateForm.bloodType}
                          onChange={e => setUpdateForm({...updateForm, bloodType: e.target.value as any})}
                        >
                          <option value="-">-</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="AB">AB</option>
                          <option value="O">O</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Shield size={14} /> Data Kependudukan
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">NIK</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          value={updateForm.nik}
                          onChange={e => setUpdateForm({...updateForm, nik: e.target.value})}
                          placeholder="16 digit NIK"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">No. KK</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          value={updateForm.kkNumber}
                          onChange={e => setUpdateForm({...updateForm, kkNumber: e.target.value})}
                          placeholder="16 digit No. KK"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Status Tinggal</label>
                        <select 
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          value={updateForm.residenceType}
                          onChange={e => setUpdateForm({...updateForm, residenceType: e.target.value as any})}
                        >
                          <option value="Tetap">Tetap</option>
                          <option value="Sewa">Sewa</option>
                          <option value="Rumah Keluarga">Rumah Keluarga</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Status Perkawinan</label>
                        <select 
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          value={updateForm.maritalStatus}
                          onChange={e => setUpdateForm({...updateForm, maritalStatus: e.target.value as any})}
                        >
                          <option value="Belum Kawin">Belum Kawin</option>
                          <option value="Kawin">Kawin</option>
                          <option value="Cerai Hidup">Cerai Hidup</option>
                          <option value="Cerai Mati">Cerai Mati</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Agama</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          value={updateForm.religion}
                          onChange={e => setUpdateForm({...updateForm, religion: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Pendidikan Terakhir</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          value={updateForm.education}
                          onChange={e => setUpdateForm({...updateForm, education: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Pekerjaan</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          value={updateForm.job}
                          onChange={e => setUpdateForm({...updateForm, job: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Kewarganegaraan</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          value={updateForm.nationality}
                          onChange={e => setUpdateForm({...updateForm, nationality: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Activity size={14} /> Data Sosial & Ekonomi
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Status BPJS</label>
                        <select 
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          value={updateForm.bpjsStatus}
                          onChange={e => setUpdateForm({...updateForm, bpjsStatus: e.target.value as any})}
                        >
                          <option value="Tidak Ada">Tidak Ada</option>
                          <option value="PPU">PPU (Pekerja Penerima Upah)</option>
                          <option value="PBPU">PBPU (Pekerja Bukan Penerima Upah)</option>
                          <option value="PBI">PBI (Penerima Bantuan Iuran)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Status Ekonomi</label>
                        <select 
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          value={updateForm.economicStatus}
                          onChange={e => setUpdateForm({...updateForm, economicStatus: e.target.value as any})}
                        >
                          <option value="Pra-Sejahtera">Pra-Sejahtera</option>
                          <option value="Sejahtera">Sejahtera</option>
                          <option value="Mampu">Mampu</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Bantuan Sosial (Ceklis jika menerima)</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <label className="flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-indigo-200 transition-colors">
                            <input type="checkbox" checked={updateForm.isPKH} onChange={e => setUpdateForm({...updateForm, isPKH: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-xs font-bold text-slate-700">PKH</span>
                          </label>
                          <label className="flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-indigo-200 transition-colors">
                            <input type="checkbox" checked={updateForm.isBLT} onChange={e => setUpdateForm({...updateForm, isBLT: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-xs font-bold text-slate-700">BLT</span>
                          </label>
                          <label className="flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-indigo-200 transition-colors">
                            <input type="checkbox" checked={updateForm.isBPNT} onChange={e => setUpdateForm({...updateForm, isBPNT: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-xs font-bold text-slate-700">BPNT</span>
                          </label>
                          <label className="flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-indigo-200 transition-colors">
                            <input type="checkbox" checked={updateForm.isBansosLain} onChange={e => setUpdateForm({...updateForm, isBansosLain: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-xs font-bold text-slate-700">Lainnya</span>
                          </label>
                        </div>
                        {updateForm.isBansosLain && (
                          <input 
                            type="text" 
                            className="w-full mt-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            placeholder="Nama Bantuan Lainnya"
                            value={updateForm.bansosLainName}
                            onChange={e => setUpdateForm({...updateForm, bansosLainName: e.target.value})}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Users size={14} /> Demografi Keluarga
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Jumlah Penghuni</label>
                        <input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={updateForm.occupants} onChange={e => setUpdateForm({...updateForm, occupants: parseInt(e.target.value) || 0})} />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Motor (Roda 2)</label>
                        <input 
                          type="number" 
                          min="0"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" 
                          value={updateForm.twoWheelCount ?? 0} 
                          onChange={e => {
                            const w2 = parseInt(e.target.value) || 0;
                            setUpdateForm({
                              ...updateForm, 
                              twoWheelCount: w2, 
                              vehicleCount: w2 + (updateForm.fourWheelCount || 0)
                            });
                          }} 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mobil (Roda 4)</label>
                        <input 
                          type="number" 
                          min="0"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" 
                          value={updateForm.fourWheelCount ?? 0} 
                          onChange={e => {
                            const w4 = parseInt(e.target.value) || 0;
                            setUpdateForm({
                              ...updateForm, 
                              fourWheelCount: w4, 
                              vehicleCount: (updateForm.twoWheelCount || 0) + w4
                            });
                          }} 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ibu Hamil</label>
                        <input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={updateForm.pregnantCount} onChange={e => setUpdateForm({...updateForm, pregnantCount: parseInt(e.target.value) || 0})} />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bayi (0-1th)</label>
                        <input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={updateForm.babyCount} onChange={e => setUpdateForm({...updateForm, babyCount: parseInt(e.target.value) || 0})} />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Balita (1-5th)</label>
                        <input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={updateForm.toddlerCount} onChange={e => setUpdateForm({...updateForm, toddlerCount: parseInt(e.target.value) || 0})} />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Anak-anak</label>
                        <input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={updateForm.childCount} onChange={e => setUpdateForm({...updateForm, childCount: parseInt(e.target.value) || 0})} />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Remaja</label>
                        <input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={updateForm.teenagerCount} onChange={e => setUpdateForm({...updateForm, teenagerCount: parseInt(e.target.value) || 0})} />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Dewasa</label>
                        <input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={updateForm.adultCount} onChange={e => setUpdateForm({...updateForm, adultCount: parseInt(e.target.value) || 0})} />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Lansia</label>
                        <input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={updateForm.elderlyCount} onChange={e => setUpdateForm({...updateForm, elderlyCount: parseInt(e.target.value) || 0})} />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Janda/Duda</label>
                        <input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={updateForm.widowCount} onChange={e => setUpdateForm({...updateForm, widowCount: parseInt(e.target.value) || 0})} />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Users size={14} /> Anggota Keluarga
                      </h4>
                      <Button 
                        type="button" 
                        onClick={addFamilyMember}
                        className="h-7 px-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none shadow-none text-[10px] font-black"
                      >
                        + Tambah Anggota
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {updateForm.familyMembers.length > 0 ? (
                        updateForm.familyMembers.map((member, index) => (
                          <div key={index} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm relative group">
                            <button 
                              type="button"
                              onClick={() => removeFamilyMember(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                            >
                              <X size={12} />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nama Lengkap</label>
                                <input 
                                  type="text" 
                                  required
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                  value={member.name}
                                  onChange={e => updateFamilyMember(index, 'name', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">NIK</label>
                                <input 
                                  type="text" 
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                  value={member.nik || ''}
                                  onChange={e => updateFamilyMember(index, 'nik', e.target.value)}
                                  placeholder="16 digit NIK"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Hubungan</label>
                                <select 
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                  value={member.relation}
                                  onChange={e => updateFamilyMember(index, 'relation', e.target.value)}
                                >
                                  <option value="Istri">Istri</option>
                                  <option value="Anak">Anak</option>
                                  <option value="Orang Tua">Orang Tua</option>
                                  <option value="Famili Lain">Famili Lain</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Jenis Kelamin</label>
                                <select 
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                  value={member.gender}
                                  onChange={e => updateFamilyMember(index, 'gender', e.target.value)}
                                >
                                  <option value="Laki-laki">Laki-laki</option>
                                  <option value="Perempuan">Perempuan</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal Lahir</label>
                                <input 
                                  type="date" 
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                  value={member.birthDate || ''}
                                  onChange={e => updateFamilyMember(index, 'birthDate', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pekerjaan</label>
                                <input 
                                  type="text" 
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                  value={member.job || ''}
                                  onChange={e => updateFamilyMember(index, 'job', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
                          <p className="text-[10px] font-bold text-slate-400">Belum ada anggota keluarga tambahan.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Info size={14} /> Informasi Tambahan
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Alasan Perubahan</label>
                        <textarea 
                          required
                          rows={3}
                          placeholder="Contoh: Penambahan anggota keluarga baru atau koreksi ejaan nama..."
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none"
                          value={updateForm.reason}
                          onChange={e => setUpdateForm({...updateForm, reason: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                  <AlertCircle className="text-amber-500 shrink-0" size={18} />
                  <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                    Data tidak akan langsung berubah. Admin akan memverifikasi pengajuan Anda terlebih dahulu sebelum memperbarui database utama.
                  </p>
                </div>

                <Button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 mt-4">
                  Kirim Permohonan
                </Button>
              </form>
            </Modal>

            {/* Request Detail Modal */}
            <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)} title="Detail Permohonan Update">
              {selectedRequest && (
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        selectedRequest.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        selectedRequest.status === 'Ditolak' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                        'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {selectedRequest.status}
                      </span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                        Diajukan pada {new Date(selectedRequest.createdAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <User size={12} /> Identitas Kepala Keluarga / Penghuni
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-2 bg-white/50 rounded-lg">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Nama Lengkap</p>
                          <p className="text-xs font-black text-slate-800">{selectedRequest.headOfFamily}</p>
                        </div>
                        <div className="p-2 bg-white/50 rounded-lg">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Jenis Kelamin</p>
                          <p className="text-xs font-black text-slate-800">{selectedRequest.gender || '-'}</p>
                        </div>
                        <div className="p-2 bg-white/50 rounded-lg">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">TTL</p>
                          <p className="text-xs font-black text-slate-800">{selectedRequest.birthPlace || '-'}, {selectedRequest.birthDate || '-'}</p>
                        </div>
                        <div className="p-2 bg-white/50 rounded-lg">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Telepon</p>
                          <p className="text-xs font-black text-slate-800">{selectedRequest.phone}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Shield size={12} /> Data Kependudukan
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">NIK</p>
                          <p className="text-xs font-black text-slate-800 font-mono flex items-center justify-between">
                            <span>{formatSensitiveNik(selectedRequest.nik || '', !!showFullNiks[`req-${selectedRequest.id}`])}</span>
                            {selectedRequest.nik && (
                              <button 
                                onClick={() => toggleNikVisibility(`req-${selectedRequest.id}`)}
                                className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                              >
                                {showFullNiks[`req-${selectedRequest.id}`] ? <EyeOff size={12} /> : <Eye size={12} />}
                              </button>
                            )}
                          </p>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">No. KK</p>
                          <p className="text-xs font-black text-slate-800 font-mono flex items-center justify-between">
                            <span>{formatSensitiveNik(selectedRequest.kkNumber || '', !!showFullNiks[`kk-${selectedRequest.id}`])}</span>
                            {selectedRequest.kkNumber && (
                              <button 
                                onClick={() => toggleNikVisibility(`kk-${selectedRequest.id}`)}
                                className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                              >
                                {showFullNiks[`kk-${selectedRequest.id}`] ? <EyeOff size={12} /> : <Eye size={12} />}
                              </button>
                            )}
                          </p>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Agama</p>
                          <p className="text-xs font-black text-slate-800">{selectedRequest.religion || '-'}</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pendidikan</p>
                          <p className="text-xs font-black text-slate-800">{selectedRequest.education || '-'}</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pekerjaan</p>
                          <p className="text-xs font-black text-slate-800">{selectedRequest.job || '-'}</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Status Tinggal</p>
                          <p className="text-xs font-black text-slate-800">{selectedRequest.residenceType || '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Activity size={12} /> Sosial & Ekonomi
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">BPJS</p>
                          <p className="text-xs font-black text-slate-800">{selectedRequest.bpjsStatus || '-'}</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Ekonomi</p>
                          <p className="text-xs font-black text-slate-800">{selectedRequest.economicStatus || '-'}</p>
                        </div>
                        <div className="col-span-2 p-2 bg-white rounded-lg border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Bantuan Sosial</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedRequest.isPKH && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black">PKH</span>}
                            {selectedRequest.isBLT && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black">BLT</span>}
                            {selectedRequest.isBPNT && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black">BPNT</span>}
                            {selectedRequest.isBansosLain && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black">{selectedRequest.bansosLainName || 'Lainnya'}</span>}
                            {!selectedRequest.isPKH && !selectedRequest.isBLT && !selectedRequest.isBPNT && !selectedRequest.isBansosLain && <span className="text-xs font-bold text-slate-400">Tidak ada bantuan</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedRequest.familyMembers && selectedRequest.familyMembers.length > 0 && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Users size={12} /> Anggota Keluarga
                        </h4>
                        <div className="space-y-2">
                          {selectedRequest.familyMembers.map((member, idx) => (
                            <div key={idx} className="p-2 bg-white rounded-lg border border-slate-100">
                              <div className="flex justify-between items-center">
                                <p className="text-xs font-black text-slate-800">{member.name}</p>
                                <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-1.5 py-0.5 rounded">{member.relation}</span>
                              </div>
                              <div className="flex gap-3 mt-1">
                                <p className="text-[9px] font-bold text-slate-400">{member.job || '-'}</p>
                                <p className="text-[9px] font-bold text-slate-400">{member.gender}</p>
                                {member.nik && (
                                  <div className="flex items-center gap-1">
                                    <p className="text-[9px] font-bold text-slate-400 font-mono">NIK: {formatSensitiveNik(member.nik, !!showFullNiks[`req-member-${idx}`])}</p>
                                    <button 
                                      onClick={() => toggleNikVisibility(`req-member-${idx}`)}
                                      className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                    >
                                      {showFullNiks[`req-member-${idx}`] ? <EyeOff size={10} /> : <Eye size={10} />}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Info size={12} /> Alasan Perubahan
                      </h4>
                      <p className="text-xs font-bold text-slate-600 leading-relaxed">{selectedRequest.reason}</p>
                    </div>

                    {selectedRequest.adminNote && (
                      <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                        <h4 className="text-[10px] font-black text-rose-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <AlertCircle size={12} /> Catatan Admin
                        </h4>
                        <p className="text-xs font-bold text-rose-700 leading-relaxed">{selectedRequest.adminNote}</p>
                      </div>
                    )}
                  </div>

                  <Button onClick={() => setSelectedRequest(null)} className="w-full bg-slate-800 hover:bg-slate-900">
                    Tutup Detail
                  </Button>
                </div>
              )}
            </Modal>
          </motion.div>
        )}

        {activeTab === 'guests' && (
          <motion.div 
            key="guests"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-xl font-black text-slate-800">Log Kunjungan Tamu</h3>
              <p className="text-sm text-slate-500 font-medium">Daftar tamu yang melapor berkunjung ke rumah Anda melalui sistem Keamanan RT.</p>
            </div>

            <div className="space-y-4">
              {guestReports.length > 0 ? (
                guestReports.map((guest) => (
                  <Card key={guest.id} className="p-6 bg-white border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-2xl ${guest.status === 'Active' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                        <Users size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black text-slate-800">{guest.guestName}</h4>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                            guest.status === 'Active' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {guest.status === 'Active' ? 'Masih Berkunjung' : 'Sudah Pulang'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(guest.arrivalDate).toLocaleDateString('id-ID')}</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {guest.stayDuration}</span>
                          <span className="flex items-center gap-1"><Info size={12} /> {guest.relationship}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dilaporkan Pada</p>
                      <p className="text-xs font-bold text-slate-700">{new Date(guest.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' })} WITA</p>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4">
                    <History size={32} />
                  </div>
                  <h4 className="font-black text-slate-800 mb-1">Belum Ada Data Tamu</h4>
                  <p className="text-xs text-slate-400 font-medium">Tidak ada riwayat tamu yang melapor berkunjung ke rumah Anda.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
        {activeTab === 'reports' && (
          <motion.div 
            key="reports"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800">Laporan Masalah</h3>
                <p className="text-sm text-slate-500 font-medium">Laporkan masalah keamanan, kebersihan, atau fasilitas di lingkungan.</p>
              </div>
              <Button onClick={() => setIsReportModalOpen(true)} className="bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-100">
                <AlertTriangle size={18} className="mr-2" /> Buat Laporan
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {reports.length > 0 ? (
                reports.map((report) => (
                  <Card 
                    key={report.id} 
                    className="p-6 bg-white border-slate-100 shadow-sm flex items-center justify-between group hover:border-rose-200 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setSelectedReportDetail(report)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-2xl ${
                        report.status === 'Selesai' ? 'bg-emerald-50 text-emerald-600' :
                        report.status === 'Diproses' ? 'bg-indigo-50 text-indigo-600' :
                        'bg-rose-50 text-rose-600'
                      }`}>
                        {report.status === 'Selesai' ? <CheckCircle size={24} /> : 
                         report.status === 'Diproses' ? <Clock size={24} /> : 
                         <AlertCircle size={24} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black text-slate-800">Laporan {report.type}</h4>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                            report.status === 'Selesai' ? 'bg-emerald-100 text-emerald-600' :
                            report.status === 'Diproses' ? 'bg-indigo-100 text-indigo-600' :
                            'bg-rose-100 text-rose-600'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium line-clamp-1">{report.description}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                          Diajukan: {new Date(report.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-rose-500 transition-colors" />
                  </Card>
                ))
              ) : (
                <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <AlertTriangle size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Belum ada laporan</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'points' && (
          <motion.div 
            key="points"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 text-left"
          >
            {/* Header Citizen Score */}
            <div className={`p-8 md:p-10 rounded-[2.5rem] bg-gradient-to-br ${citizenTier.color} shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}>
              <div className="space-y-3 relative z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-widest">
                  <Sparkles size={14} /> {citizenTier.badge}
                </div>
                <h3 className="text-3xl md:text-4xl font-black tracking-tight">{citizenTier.name}</h3>
                <p className="text-xs md:text-sm font-semibold opacity-90 max-w-lg">
                  Apresiasi keaktifan dan ketertiban administrasi untuk Rumah Blok {currentHouse?.block}-{currentHouse?.number} ({currentHouse?.headOfFamily}).
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-center shrink-0 w-full md:w-auto relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Total Skor Keaktifan</p>
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="text-4xl md:text-5xl font-black tracking-tight">{currentPoints}</span>
                  <span className="text-sm font-bold opacity-80">Poin</span>
                </div>
                <div className="mt-2 text-[10px] font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full inline-block">
                  Peringkat ke-#{currentRank} di RT 02
                </div>
              </div>
            </div>

            {/* Rincian Poin & Cara Mendapatkan Poin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 md:p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={20} className="text-amber-500" />
                  <h4 className="text-base font-black text-slate-800">Rincian Perolehan Poin Rumah Anda</h4>
                </div>
                
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">✓</span>
                      <div>
                        <p className="font-black text-slate-800">Registrasi KK Aktif</p>
                        <p className="text-[10px] text-slate-400">Data terdaftar di sistem RT</p>
                      </div>
                    </div>
                    <span className="font-black text-emerald-600">+50 Poin</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-xl ${isAllPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} flex items-center justify-center font-black`}>
                        {isAllPaid ? '✓' : '•'}
                      </span>
                      <div>
                        <p className="font-black text-slate-800">Disiplin Iuran ({currentMonth})</p>
                        <p className="text-[10px] text-slate-400">{isAllPaid ? 'Lunas sebelum tgl 20' : 'Belum lunas'}</p>
                      </div>
                    </div>
                    <span className={`font-black ${isAllPaid ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {isAllPaid ? '+50 Poin' : '+0 Poin'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">✓</span>
                      <div>
                        <p className="font-black text-slate-800">Jumlah Penghuni ({currentHouse?.occupants || 1} Jiwa)</p>
                        <p className="text-[10px] text-slate-400">10 poin per jiwa terdata</p>
                      </div>
                    </div>
                    <span className="font-black text-emerald-600">+{(currentHouse?.occupants || 1) * 10} Poin</span>
                  </div>

                  {currentHouse?.rondaPoints ? (
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-black">✓</span>
                        <div>
                          <p className="font-black text-slate-800">Kehadiran Siskamling / Ronda</p>
                          <p className="text-[10px] text-slate-400">Presensi pos jaga malam</p>
                        </div>
                      </div>
                      <span className="font-black text-emerald-600">+{currentHouse.rondaPoints} Poin</span>
                    </div>
                  ) : null}

                  {currentHouse?.isVerified ? (
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">✓</span>
                        <div>
                          <p className="font-black text-slate-800">Verifikasi NIK Lengkap</p>
                          <p className="text-[10px] text-slate-400">Data kependudukan tervalidasi</p>
                        </div>
                      </div>
                      <span className="font-black text-emerald-600">+30 Poin</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Leaderboard Peringkat Warga Teladan RT */}
              <div className="p-6 md:p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Trophy size={20} className="text-amber-500" />
                    <h4 className="text-base font-black text-slate-800">Top 10 Warga Teladan RT 02</h4>
                  </div>
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl">Live Peringkat</span>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar text-xs">
                  {allHousePoints.slice(0, 10).map((item, idx) => {
                    const isMe = item.house.id === selectedHouseId;
                    const rank = idx + 1;
                    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

                    return (
                      <div 
                        key={item.house.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                          isMe 
                            ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm' 
                            : 'bg-slate-50/70 border-slate-100 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-xl bg-white border border-slate-200/80 font-black text-xs flex items-center justify-center shadow-2xs">
                            {medal}
                          </span>
                          <div>
                            <p className="font-black text-slate-800">
                              {item.house.headOfFamily} {isMe && <span className="text-[9px] font-black text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-md ml-1">Rumah Anda</span>}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400">Blok {item.house.block}-{item.house.number}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-black text-slate-900 bg-white border border-slate-200/70 px-2.5 py-1 rounded-xl shadow-2xs">
                            {item.points} Pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'skills' && (
          <motion.div 
            key="skills"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 text-left"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Wrench size={18} />
                  </span>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Direktori Jasa &amp; Keahlian Warga RT 02</h3>
                </div>
                <p className="text-xs text-slate-500 font-medium">Temukan tukang, teknisi, guru les, atau katering dari tetangga sendiri di lingkungan kita.</p>
              </div>
              <Button 
                onClick={() => {
                  setSkillForm({
                    category: 'Pertukangan & Bangunan',
                    title: '',
                    description: '',
                    phone: currentHouse?.phone || '',
                    rateInfo: ''
                  });
                  setIsAddSkillModalOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 cursor-pointer"
              >
                <Plus size={16} className="mr-1.5" /> Promosikan Jasa / Keahlian
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {communitySkills.length > 0 ? (
                communitySkills.map((item) => (
                  <Card key={item.id} className="p-6 bg-white border-slate-100 shadow-sm hover:border-indigo-200 transition-all flex flex-col justify-between group">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-xl text-[9px] font-black uppercase tracking-wider border border-indigo-100">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          Rumah: Blok {item.houseId}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-black text-slate-900 text-base group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                        <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">{item.description}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Penyedia Jasa</p>
                        <p className="text-xs font-bold text-slate-800">{item.providerName}</p>
                        {item.rateInfo && (
                          <p className="text-[11px] font-semibold text-emerald-600 mt-1">💰 {item.rateInfo}</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          const waPhone = (item.phone || '6285961194621').replace(/\D/g, '').replace(/^0/, '62');
                          const msg = `Halo Bpk/Ibu ${item.providerName} (Blok ${item.houseId}), saya tetangga di RT 02 ingin menanyakan tentang jasa "${item.title}". Apakah sedang tersedia?`;
                          window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20"
                      >
                        <Phone size={14} /> Hubungi via WhatsApp
                      </button>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-16 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-3 shadow-xs">
                    <Wrench size={32} />
                  </div>
                  <h4 className="font-black text-slate-700 text-sm mb-1">Belum Ada Daftar Jasa Warga</h4>
                  <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mb-4">Jadilah yang pertama mempromosikan keahlian pertukangan, servis, atau katering Anda!</p>
                  <Button 
                    onClick={() => setIsAddSkillModalOpen(true)}
                    className="bg-indigo-600 text-white"
                  >
                    <Plus size={14} className="mr-1.5" /> Tambah Jasa Saya
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'outages' && (
          <motion.div 
            key="outages"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 text-left"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <Zap size={22} />
                </span>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Papan Informasi Pemadaman PLN &amp; Air Bersih</h3>
                  <p className="text-xs text-slate-500 font-medium">Informasi resmi pemeliharaan jaringan listrik PLN dan perbaikan pipa saluran air bersih RT 02.</p>
                </div>
              </div>
              <button
                onClick={() => setIsOutageModalOpen(true)}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <AlertTriangle size={14} />
                <span>Lapor Gangguan &amp; Posko</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {utilityOutages.length > 0 ? (
                utilityOutages.map((outage) => (
                  <Card 
                    key={outage.id} 
                    className={`p-6 bg-white border-2 rounded-[2rem] shadow-sm flex flex-col justify-between ${
                      outage.status === 'Ongoing' ? 'border-amber-400 ring-4 ring-amber-50' : 'border-slate-100'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                            outage.type === 'PLN' ? 'bg-amber-100 text-amber-800' :
                            outage.type === 'PDAM' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {outage.type === 'PLN' ? <Zap size={12} /> : <Droplets size={12} />} {outage.type}
                          </span>

                          {outage.impactSeverity && (
                            <span className={`px-2.5 py-0.5 rounded-lg text-[8.5px] font-black uppercase tracking-widest ${
                              outage.impactSeverity === 'Kritis' ? 'bg-rose-100 text-rose-700' :
                              outage.impactSeverity === 'Sedang' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'
                            }`}>
                              Dampak: {outage.impactSeverity}
                            </span>
                          )}
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-lg text-[8.5px] font-black uppercase tracking-widest ${
                          outage.status === 'Ongoing' ? 'bg-rose-50 text-rose-600 animate-pulse' :
                          outage.status === 'Scheduled' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {outage.status === 'Ongoing' ? '⚠️ Sedang Berlangsung' : outage.status === 'Scheduled' ? '🗓️ Terjadwal' : '✓ Normal / Selesai'}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-black text-slate-900 text-base">{outage.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400 mt-1">
                          {outage.officialRefNumber && <span>📄 No: {outage.officialRefNumber}</span>}
                          {outage.feederName && <span>🔌 {outage.feederName}</span>}
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1.5">{outage.description}</p>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1.5 text-xs border border-slate-100">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Tanggal &amp; Waktu:</span>
                          <span className="font-bold text-slate-700">
                            {outage.date ? `${new Date(outage.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • ` : ''}
                            {outage.startTime} s.d {outage.endTime}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Wilayah Terdampak:</span>
                          <span className="font-black text-slate-700">{outage.affectedBlocks?.join(', ') || 'Semua Blok'}</span>
                        </div>
                        {outage.contactCenter && (
                          <div className="flex justify-between border-t border-slate-200/50 pt-1 mt-1">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Call Center:</span>
                            <span className="font-bold text-indigo-600">{outage.contactCenter}</span>
                          </div>
                        )}
                      </div>

                      {outage.emergencyNotes && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2">
                          <Info size={14} className="text-amber-600 shrink-0" />
                          <span>{outage.emergencyNotes}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-16 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-3 shadow-xs">
                    <CheckCircle size={32} />
                  </div>
                  <h4 className="font-black text-slate-800 text-sm mb-1">Kondisi Jaringan Listrik &amp; Air Normal</h4>
                  <p className="text-xs text-slate-400 font-medium">Tidak ada jadwal pemadaman listrik PLN atau perbaikan air pipa yang tercatat saat ini.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Tambah Jasa & Keahlian Warga */}
      <Modal isOpen={isAddSkillModalOpen} onClose={() => setIsAddSkillModalOpen(false)} title="Promosikan Jasa &amp; Keahlian Warga">
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!skillForm.title || !skillForm.description || !skillForm.phone) {
            return toast.error('Mohon lengkapi judul jasa, deskripsi, dan nomor WA.');
          }

          try {
            await addReportToDb({
              type: 'Keamanan' as any,
              reporterName: currentHouse?.headOfFamily || 'Warga',
              reporterHouseId: selectedHouseId,
              date: new Date().toISOString(),
              description: `[PROMOSI JASA] ${skillForm.category}: ${skillForm.title} - ${skillForm.description} (WA: ${skillForm.phone}, Tarif: ${skillForm.rateInfo || '-'})`,
              status: 'Diproses'
            });

            toast.success('Promosi jasa Anda telah dikirim ke Pengurus RT untuk verifikasi tayang!');
            setIsAddSkillModalOpen(false);
          } catch (error) {
            toast.error('Gagal mengirim data jasa.');
          }
        }} className="space-y-4 text-left">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Kategori Layanan / Jasa</label>
            <select
              value={skillForm.category}
              onChange={e => setSkillForm({...skillForm, category: e.target.value as any})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
            >
              <option value="Pertukangan & Bangunan">Pertukangan &amp; Bangunan</option>
              <option value="Elektronik & Kelistrikan">Elektronik &amp; Kelistrikan (AC, Kulkas, Pompa Air)</option>
              <option value="Pendidikan & Les">Pendidikan &amp; Les Privat Anak</option>
              <option value="Katering & Kuliner">Katering &amp; Kuliner Rumahan</option>
              <option value="Kecantikan & Jahit">Kecantikan &amp; Jahit Baju</option>
              <option value="Otomotif & Transportasi">Otomotif &amp; Jasa Antar / Angkut</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Judul / Nama Jasa</label>
            <input 
              type="text" 
              required
              value={skillForm.title}
              onChange={e => setSkillForm({...skillForm, title: e.target.value})}
              placeholder="Contoh: Servis AC & Cuci AC Bersih"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Rincian Keahlian &amp; Pengalaman</label>
            <textarea 
              required
              rows={3}
              value={skillForm.description}
              onChange={e => setSkillForm({...skillForm, description: e.target.value})}
              placeholder="Jelaskan jenis pekerjaan yang bisa dibantu, garansi, atau ketersediaan waktu..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Nomor WhatsApp</label>
              <input 
                type="text" 
                required
                value={skillForm.phone}
                onChange={e => setSkillForm({...skillForm, phone: e.target.value})}
                placeholder="0812xxxxxxxx"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Perkiraan Biaya / Tarif</label>
              <input 
                type="text" 
                value={skillForm.rateInfo}
                onChange={e => setSkillForm({...skillForm, rateInfo: e.target.value})}
                placeholder="Contoh: Mulai Rp 50.000 / Nego"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <Button type="submit" className="w-full py-3.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-500/20 mt-2">
            Simpan &amp; Publikasikan Jasa
          </Button>
        </form>
      </Modal>

      {/* Iuran Detail Modal */}
      <Modal isOpen={isIuranModalOpen} onClose={() => setIsIuranModalOpen(false)} title="Rincian & Status Tagihan Iuran Warga" maxWidth="max-w-xl">
        <div className="p-6 space-y-5">
          {/* Header Card Status Pelunasan */}
          {isAllPaid ? (
            <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-5 sm:p-6 rounded-3xl text-white shadow-xl shadow-emerald-500/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                    <CheckCircle2 size={13} className="text-emerald-200" />
                    <span>Status: Lunas Terbayar</span>
                  </div>
                  <p className="text-xs text-emerald-100 font-semibold">Periode {currentMonth} • Blok {currentHouse?.block}-{currentHouse?.number}</p>
                  <h3 className="text-3xl font-black mt-1">Rp 0</h3>
                  <p className="text-[11px] text-emerald-100/90 mt-1.5 font-medium leading-relaxed">
                    Semua kewajiban iuran lingkungan bulan ini telah terverifikasi lunas. Terima kasih atas partisipasi aktif Bapak/Ibu!
                  </p>
                </div>
                <div className="hidden sm:flex flex-col items-center justify-center p-3.5 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20">
                  <ShieldCheck size={36} className="text-white" />
                  <span className="text-[9px] font-black uppercase tracking-wider mt-1 text-emerald-100">Terverifikasi</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 rounded-3xl text-white shadow-xl shadow-indigo-500/10 relative overflow-hidden border border-indigo-900/50">
              <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                    <Clock size={13} />
                    <span>Menunggu Pembayaran</span>
                  </div>
                  <p className="text-xs text-indigo-200 font-semibold">Periode {currentMonth} • Blok {currentHouse?.block}-{currentHouse?.number}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <h3 className="text-3xl font-black tracking-tight">Rp {totalRemainingFee.toLocaleString('id-ID')}</h3>
                    {totalRemainingFee < totalFee && (
                      <span className="text-xs text-slate-400 line-through">Rp {totalFee.toLocaleString('id-ID')}</span>
                    )}
                  </div>
                  <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-bold">
                    <AlertCircle size={12} />
                    <span>Jatuh Tempo: Tgl 20 {currentMonth}</span>
                  </div>
                </div>
                <div className="hidden sm:flex flex-col items-center justify-center p-3.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                  <Wallet size={36} className="text-indigo-400" />
                  <span className="text-[9px] font-black uppercase tracking-wider mt-1 text-slate-300">Tagihan Aktif</span>
                </div>
              </div>
            </div>
          )}

          {/* Rincian Komponen Iuran Sesuai Aturan Terbaru */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1">
              Rincian Item &amp; Regulasi Lingkungan
            </h4>

            {/* Komponen Retribusi Sampah TPS3R */}
            <div className="p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors rounded-2xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl mt-0.5">
                  <Trash2 size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-slate-800">Retribusi Sampah TPS3R</span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-bold">
                      Kategori: {currentHouseWasteTier}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Armada TPS3R Huntap Tondo 2 • Pengangkutan sampah terjadwal
                  </p>
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/50">
                <span className="text-sm font-black text-slate-900">Rp {sampahFee.toLocaleString('id-ID')}</span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mt-1 ${
                  isPaidSampah ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {isPaidSampah ? 'Lunas Terbayar' : 'Belum Bayar'}
                </span>
              </div>
            </div>

            {/* Komponen Air Bersih PDAM Kota Palu */}
            <div className="p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors rounded-2xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-sky-100 text-sky-700 rounded-xl mt-0.5">
                  <Droplets size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-slate-800">Air Bersih ({WATER_PROVIDER_NAME})</span>
                    <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-md text-[10px] font-bold">
                      Sistem Meter Mandiri
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {airFee > 0 
                      ? 'Iuran pemeliharaan pipa / pengelolaan air lingkungan RT' 
                      : 'Resmi dikelola PDAM Kota Palu (Tarif Rp 35.000 / 10 m³). Pembayaran langsung via PDAM / loket mitra.'}
                  </p>
                  {currentWaterReading ? (
                    <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 bg-sky-50 border border-sky-100 rounded text-[10px] font-bold text-sky-800">
                      <CheckCircle2 size={11} className="text-sky-600" />
                      <span>Meteran Terlapor: {currentWaterReading.currentReading} m³ (Pakai: {currentWaterReading.usage} m³)</span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1">
                      💡 Catat meter air mandiri tiap akhir bulan via menu Catat Meter PDAM di dashboard.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/50">
                <span className="text-sm font-black text-slate-900">
                  {airFee > 0 ? `Rp ${airFee.toLocaleString('id-ID')}` : 'Mandiri'}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mt-1 ${
                  airFee === 0 
                    ? 'bg-sky-100 text-sky-700' 
                    : isPaidAir 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-amber-100 text-amber-700'
                }`}>
                  {airFee === 0 ? 'Loket PDAM' : isPaidAir ? 'Lunas Terbayar' : 'Belum Bayar'}
                </span>
              </div>
            </div>
          </div>

          {/* Tata Cara Pembayaran Kas RT 002 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet size={14} className="text-slate-500" /> Tata Cara &amp; Metode Pembayaran
              </h4>
              <span className="text-[10px] font-black px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full uppercase tracking-wider">
                Pembayaran Tunai (Cash)
              </span>
            </div>

            {/* Opsi Tunai ke Bendahara */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-3.5">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-600/20 shrink-0 mt-0.5">
                <Wallet size={20} />
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-black text-emerald-950 uppercase tracking-wide flex items-center gap-2">
                  <span>Pembayaran Tunai ke Bendahara RT 002</span>
                </h5>
                <p className="text-xs text-emerald-900/90 leading-relaxed font-medium">
                  Iuran bulanan diserahkan langsung secara tunai kepada <strong>Bendahara RT 002</strong> atau <strong>Ketua RT</strong> di Sekretariat / Pos Ronda RT 002 Huntap Tondo 2.
                </p>
              </div>
            </div>

            {/* Pemberitahuan Rekening Bank */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-slate-200/70 text-slate-600 rounded-xl shrink-0 mt-0.5">
                <Info size={16} />
              </div>
              <div className="space-y-0.5 text-xs text-slate-600">
                <p className="font-bold text-slate-800">Informasi Rekening Bank Kas RT</p>
                <p className="text-[11.5px] leading-relaxed">
                  Saat ini rekening kas resmi RT 002 belum tersedia / belum dibuka. Seluruh transaksi iuran lingkungan dikelola secara tunai dan dibukukan langsung ke sistem pencatatan kas RT 002.
                </p>
              </div>
            </div>

            {/* Petunjuk Koordinasi */}
            <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/70 text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-black text-[11px] text-amber-950 uppercase tracking-wide">
                <Phone size={13} className="text-amber-700" />
                <span>Koordinasi Penyerahan &amp; Konfirmasi Pembayaran</span>
              </div>
              <p className="text-[11.5px] text-amber-900/90 space-y-1 font-medium leading-relaxed">
                Untuk janjian penyerahan iuran atau konfirmasi setelah pembayaran tunai dilakukan, silakan hubungi <strong>Bendahara RT 002</strong> via WhatsApp agar status di dashboard segera diperbarui menjadi Lunas.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Button onClick={() => setIsIuranModalOpen(false)} variant="outline" className="sm:w-24 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider">
              Tutup
            </Button>
            {isAllPaid && (
              <Button
                type="button"
                onClick={handleDownloadReceipt}
                className="py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Receipt size={15} />
                <span>Kwitansi PDF</span>
              </Button>
            )}
            <Button
              type="button"
              onClick={() => window.print()}
              variant="outline"
              className="sm:w-32 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider border-slate-200 hover:bg-slate-100 flex items-center justify-center gap-2"
            >
              <Printer size={15} />
              <span>Cetak Bukti</span>
            </Button>
            <Button 
              onClick={() => {
                const message = `Halo Pengurus / Bendahara RT 002 Huntap Tondo 2,

Saya ingin konfirmasi / koordinasi pembayaran iuran lingkungan:
• Periode: ${currentMonth}
• Hunian: Blok ${currentHouse?.block}-${currentHouse?.number}
• Nama Warga: ${currentHouse?.residentName || 'Warga'}
• Retribusi Sampah TPS3R (${currentHouseWasteTier}): Rp ${sampahFee.toLocaleString('id-ID')}
${airFee > 0 ? `• Iuran Air: Rp ${airFee.toLocaleString('id-ID')}\n` : ''}• Metode Pembayaran: Tunai (Cash)
• Nominal: Rp ${(totalRemainingFee > 0 ? totalRemainingFee : totalFee).toLocaleString('id-ID')}
• Status: ${isAllPaid ? 'Sudah Lunas Terbayar' : 'Ingin Menyerahkan Iuran / Konfirmasi'}

Mohon informasi waktu penyerahan atau bantuan verifikasi pencatatan status iuran. Terima kasih!`;
                window.open(`https://wa.me/6285961194621?text=${encodeURIComponent(message)}`, '_blank');
              }}
              className={`flex-1 py-3.5 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 ${
                isAllPaid 
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' 
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
              }`}
            >
              <Send size={15} />
              <span>{isAllPaid ? 'Hubungi Bendahara RT (WA)' : 'Konfirmasi / Janjian Bayar (WA)'}</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Report Issue Modal */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Buat Laporan Masalah Baru" maxWidth="max-w-xl">
        <div className="p-6">
          <form onSubmit={handleSubmitReport} className="space-y-6">
            <div className="space-y-3">
              <label className="block text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Kategori Masalah <span className="text-rose-500">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'Keamanan', title: 'Keamanan', desc: 'Sengketa, gatal, maling', icon: Shield, color: 'text-rose-600', activeBg: 'bg-rose-50 border-rose-500' },
                  { id: 'Kebersihan', title: 'Kebersihan', desc: 'Sampah liar, got mampet', icon: Trash2, color: 'text-emerald-600', activeBg: 'bg-emerald-50 border-emerald-500' },
                  { id: 'Fasilitas', title: 'Fasilitas', desc: 'Lampu mati, aspal berlubang', icon: Wrench, color: 'text-blue-600', activeBg: 'bg-blue-50 border-blue-500' },
                  { id: 'Sosial', title: 'Sosial', desc: 'Keributan, keramaian', icon: Users, color: 'text-amber-600', activeBg: 'bg-amber-50 border-amber-500' },
                  { id: 'Lainnya', title: 'Lainnya', desc: 'Aspirasi & masalah lainnya', icon: AlertTriangle, color: 'text-slate-600', activeBg: 'bg-slate-100 border-slate-400' },
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = reportForm.type === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setReportForm({...reportForm, type: item.id as any})}
                      className={`
                        p-3 rounded-xl border text-left flex gap-3 transition-all duration-200 cursor-pointer w-full
                        ${isSelected 
                          ? `${item.activeBg} border border-rose-500 shadow-sm text-slate-900 ring-2 ring-rose-500/10` 
                          : 'bg-slate-50 hover:bg-slate-100/70 text-slate-600 border-slate-200'
                        }
                      `}
                    >
                      <div className={`p-2 bg-white rounded-lg shadow-xs self-start shrink-0 ${item.color} transition-all`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-wide">{item.title}</p>
                        <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5 leading-normal">{item.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi & Kronologi Masalah <span className="text-rose-500">*</span></label>
              <textarea 
                rows={4}
                placeholder="Ceritakan kronologi masalah secara jelas, detail, dan apa saja yang berdampak..."
                className="w-full px-4.5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all resize-none shadow-xs placeholder:font-medium leading-relaxed"
                value={reportForm.description}
                onChange={e => setReportForm({...reportForm, description: e.target.value})}
                required
              />
            </div>

            {/* Note box */}
            <div className="p-3 bg-rose-50/50 border border-rose-100/70 rounded-xl flex gap-3.5">
              <div className="p-2 bg-white rounded-lg shadow-xs self-start text-rose-500">
                <Info size={14} />
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Laporan ini akan langsung dikirimkan ke database RT 02 atas nama Anda selaku warga resmi yang terdaftar secara sah di sistem siber kependudukan.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 py-4.5 rounded-xl text-xs font-black uppercase tracking-widest"
                onClick={() => setIsReportModalOpen(false)}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmittingReport}
                className="flex-[2] py-4.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-200/50 hover:shadow-rose-300 transition-all"
              >
                {isSubmittingReport ? 'Mengirim...' : (
                  <span className="flex items-center justify-center gap-2">
                    <Send size={14} /> Kirim Laporan Resmi
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Report Detail Modal */}
      <Modal isOpen={!!selectedReportDetail} onClose={() => setSelectedReportDetail(null)} title="Detail Laporan">
        {selectedReportDetail && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Laporan</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    selectedReportDetail.status === 'Selesai' ? 'bg-emerald-500' :
                    selectedReportDetail.status === 'Diproses' ? 'bg-indigo-500' :
                    'bg-rose-500'
                  }`} />
                  <span className="text-sm font-black text-slate-800">{selectedReportDetail.status}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kategori</p>
                <span className="text-sm font-black text-slate-800">{selectedReportDetail.type}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Isi Laporan</p>
              <div className="p-4 bg-white border border-slate-100 rounded-2xl text-sm font-medium text-slate-600 leading-relaxed">
                {selectedReportDetail.description}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal Laporan</p>
                <p className="text-sm font-bold text-slate-800">
                  {new Date(selectedReportDetail.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Laporan</p>
                <p className="text-sm font-bold text-slate-800">#{selectedReportDetail.id.slice(-8)}</p>
              </div>
            </div>

            <Button onClick={() => setSelectedReportDetail(null)} className="w-full py-4 bg-slate-100 text-slate-600 hover:bg-slate-200 border-none rounded-2xl text-xs font-black uppercase tracking-widest">
              Tutup
            </Button>
          </div>
        )}
      </Modal>

      {/* MODAL CATAT METER AIR MANDIRI */}
      {isWaterModalOpen && (
        <Modal
          isOpen={isWaterModalOpen}
          onClose={() => setIsWaterModalOpen(false)}
          title="Catat Meter Air Mandiri Bulan Ini"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSubmitWaterMeter} className="space-y-4 text-left">
            {/* Header Card: PDAM & House Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 p-4 text-white shadow-lg shadow-blue-500/15">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-inner">
                    <Droplets className="w-6 h-6 text-sky-200" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-200">Mandiri Warga</span>
                      <span className="bg-white/20 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded">RT 002</span>
                    </div>
                    <h4 className="text-xl font-black tracking-tight text-white">
                      Rumah Blok {currentHouse?.block}-{currentHouse?.number}
                    </h4>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-sky-200 tracking-wider block">Pengelola Resmi</span>
                  <span className="inline-flex items-center gap-1.5 bg-white text-blue-900 text-xs font-black px-2.5 py-1 rounded-xl shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {waterUtilityConfig.providerName || 'PDAM Kota Palu'}
                  </span>
                </div>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-white/20 flex items-center justify-between text-xs text-sky-100">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-200" />
                  Periode: <strong className="text-white">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</strong>
                </span>
                <span className="text-[11px] font-semibold bg-black/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/10">
                  Paket Kuota Dasar: {waterUtilityConfig.baseQuotaM3 || 10} m³
                </span>
              </div>
            </div>

            {/* Dual Meter Inputs */}
            <div className="grid grid-cols-2 gap-3">
              {/* Meter Lalu */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Meter Bulan Lalu
                  </label>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                    Tercatat
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    readOnly
                    disabled
                    value={previousReadingNumber}
                    className="w-full pl-3.5 pr-9 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-base font-bold font-mono text-slate-600 outline-none cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    m³
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Stand meteran lalu</p>
              </div>

              {/* Meter Terkini */}
              <div className="p-3.5 bg-blue-50/60 rounded-2xl border-2 border-blue-400/80 shadow-sm shadow-blue-500/5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-blue-700">
                    Meter Terkini <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-600 text-white animate-pulse">
                    Input
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min={previousReadingNumber}
                    required
                    placeholder={`≥ ${previousReadingNumber}`}
                    value={waterInputReading}
                    onChange={(e) => setWaterInputReading(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full pl-3.5 pr-9 py-2.5 bg-white border-2 border-blue-500 rounded-xl text-base font-black font-mono text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none shadow-inner"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-blue-600">
                    m³
                  </span>
                </div>
                <p className="text-[10px] text-blue-600/80 mt-1">Digit angka fisik kran</p>
              </div>
            </div>

            {/* Live Calculation Preview - High-End Fintech Breakdown */}
            {waterInputReading !== '' && Number(waterInputReading) >= previousReadingNumber && (() => {
              const usage = Math.max(0, Number(waterInputReading) - previousReadingNumber);
              const preview = calculateWaterUtilityBill(usage, waterUtilityConfig);
              const quota = waterUtilityConfig.baseQuotaM3 || 10;
              const isWithinQuota = usage <= quota;
              const progressPercent = Math.min(100, Math.round((usage / quota) * 100));

              return (
                <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white p-4 shadow-xl border border-slate-700/80 space-y-3">
                  {/* Top: Net Volume & Status Pill */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-sky-400 flex items-center justify-center border border-blue-500/30">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block">Estimasi Pemakaian Bersih</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-black font-mono text-white">{usage}</span>
                          <span className="text-xs font-bold text-slate-400">m³</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {waterUtilityConfig.billingMode === 'pdam' && (
                        isWithinQuota ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Dalam Kuota Dasar (≤ 10 m³)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full">
                            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                            +{preview.excessUsage} m³ Kelebihan
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Visual Quota Gauge (PDAM) */}
                  {waterUtilityConfig.billingMode === 'pdam' && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">
                          Kuota Paket: <strong className="text-white">{usage}</strong> / {quota} m³
                        </span>
                        <span className={isWithinQuota ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                          {isWithinQuota ? `${progressPercent}% kuota dasar` : `100% + ${preview.excessUsage} m³ kelebihan`}
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex p-0.5 border border-slate-700/50">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${isWithinQuota ? 'bg-emerald-500' : 'bg-emerald-400'}`}
                          style={{ width: `${Math.min(100, (Math.min(usage, quota) / quota) * 100)}%` }}
                        />
                        {preview.excessUsage > 0 && (
                          <div 
                            className="h-full rounded-full bg-amber-500 transition-all duration-300 ml-1"
                            style={{ width: `${Math.min(100, (preview.excessUsage / quota) * 100)}%` }}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Itemized Calculation */}
                  <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
                    {waterUtilityConfig.billingMode === 'pdam' ? (
                      <>
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                            Paket Dasar PDAM (s/d {waterUtilityConfig.baseQuotaM3 || 10} m³)
                          </span>
                          <span className="font-mono font-bold text-white">
                            Rp {(preview.baseFee).toLocaleString('id-ID')}
                          </span>
                        </div>

                        {preview.excessUsage > 0 && (
                          <div className="flex justify-between items-center text-amber-300">
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              Kelebihan ({preview.excessUsage} m³ × Rp {waterUtilityConfig.ratePerM3}):
                            </span>
                            <span className="font-mono font-bold">
                              + Rp {preview.excessFee.toLocaleString('id-ID')}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Tarif Kubikasi ({usage} m³ × Rp {waterUtilityConfig.ratePerM3}):</span>
                        <span className="font-mono font-bold text-white">
                          Rp {(usage * waterUtilityConfig.ratePerM3).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}

                    {waterUtilityConfig.maintenanceFee > 0 && (
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Beban Admin / Pemeliharaan:
                        </span>
                        <span className="font-mono font-bold text-white">
                          + Rp {waterUtilityConfig.maintenanceFee.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Total Tagihan Result */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between bg-slate-950/50 -mx-4 -mb-4 p-3.5 px-4 rounded-b-2xl">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Estimasi Tagihan Anda
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Sesuai tarif resmi {waterUtilityConfig.providerName || 'PDAM Kota Palu'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
                        Rp {preview.totalAmount.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Upload Foto Meteran Fisik */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-600" />
                Foto Bukti Angka Meteran Fisik (Opsional / Disarankan)
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleWaterPhotoUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {waterPhoto && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 max-h-48">
                    <img src={waterPhoto} alt="Preview Meter" className="w-full h-48 object-contain" />
                    <button
                      type="button"
                      onClick={() => setWaterPhoto('')}
                      className="absolute top-2 right-2 bg-rose-600 text-white p-1 rounded-full text-xs shadow-md hover:bg-rose-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">
                Foto akan otomatis dikompresi di browser Anda agar hemat kuota internet.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsWaterModalOpen(false)}
                className="rounded-xl px-4 py-2.5 text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingWater || waterInputReading === ''}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {isSubmittingWater ? 'Menyimpan Catatan...' : 'Kirim Catatan Meter'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Lapor & Pantau Utilitas Huntap */}
      <UtilityOutageTrackerModal 
        isOpen={isOutageModalOpen}
        onClose={() => setIsOutageModalOpen(false)}
        outages={utilityOutages}
      />
    </div>
  );
};
