import React, { useState, useEffect } from 'react';
import { BillDetailModal } from './BillDetailModal';
import { ResidentAnalytics } from './ResidentAnalytics';
import { ResidentCard } from './ResidentCard';
import { DemographicAnalytics } from './DemographicAnalytics';
import { ResidentTableView } from './resident/ResidentTableView';
import { ResidentGridView } from './resident/ResidentGridView';
import { ResidentIuranManager } from './resident/ResidentIuranManager';
import { ResidentRegistrationList } from './resident/ResidentRegistrationList';
import { ResidentDetailDrawer } from './resident/ResidentDetailDrawer';
import { AddEditResidentModal, PaymentModal, EditPaymentModal } from './resident/ResidentModals';
import { ResidentStats } from './resident/ResidentStats';
import { ResidentControls } from './resident/ResidentControls';
import { useFinancial } from '../../context/FinancialContext';
import { 
  Search, Filter, Grid, List, UserPlus, Download, Upload, 
  Trash2, Edit2, MoreHorizontal, CheckCircle, XCircle, AlertCircle, Droplets,
  Users, Home, X, Phone, Shield, Calendar, MapPin, Activity,
  ChevronRight, CreditCard, Mail, User, DollarSign, LayoutList, FileText, Printer,
  PieChart as PieChartIcon
} from 'lucide-react';
import { House, Report, Official, CashFlow, PdfConfig, PaymentStatus, ResidentRegistration, Bill } from '../../types';
import { HouseMap } from '../HouseMap';
import { generateResidentReportPDF, generateIuranReceiptPDF } from '../../services/pdfService';
import { batchUpdateHouses, deleteHouseFromDb, updateHouseData, addHouse, generateAllAccessCodes, addTransactionToDb, addIuranPaymentToDb, deleteIuranPaymentFromDb, updateResidentRegistrationInDb, deleteResidentRegistrationFromDb, updateIuranPaymentInDb, formatHouseId, addBillToDb, updateBillInDb, addPopulationLogToDb } from '../../services/databaseService';
import { generateExcelTemplate, parseExcelFile, generateProfessionalExcel } from '../../services/excelService';
import { sendWhatsAppViaGateway } from '../../services/whatsappService';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface ResidentManagerProps {
  houses: House[];
  reports: Report[];
  cashFlow: CashFlow[];
  officials: Official[];
  pdfConfig: PdfConfig;
  iuranPayments: any[];
  bills: Bill[];
  residentRegistrations: ResidentRegistration[];
  settings: any;
}

type FilterStatus = 'all' | 'paid' | 'unpaid' | 'occupied' | 'empty' | 'business';

export const ResidentManager: React.FC<ResidentManagerProps> = ({ 
  houses, reports, cashFlow, officials, pdfConfig, iuranPayments, bills, residentRegistrations, settings
}) => {
  const getIndonesianMonthYear = (date: Date) => {
    const monthsId = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${monthsId[date.getMonth()]} ${date.getFullYear()}`;
  };

  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'map' | 'iuran' | 'registrations' | 'analytics'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHouseForBills, setSelectedHouseForBills] = useState<House | null>(null);
  const [filterStatus, setFilterStatus] = useState<any>('all');
  const [sortBy, setSortBy] = useState<'name' | 'block'>('block');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedResident, setSelectedResident] = useState<House | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [targetMonth, setTargetMonth] = useState(getIndonesianMonthYear(new Date()));
  const { 
    selectedMonth, 
    setSelectedMonth, 
    isMonthMatch,
    getPaymentStatus, 
    getArrearsForHouse, 
    summaries
  } = useFinancial();
  const { 
    totalCollected, 
    participationRate, 
    paidHousesCount, 
    unpaidHousesCount, 
    estimatedReceivables, 
    totalArrearsAmount, 
    totalArrearsMonths 
  } = summaries;

  const [payHouse, setPayHouse] = useState<House | null>(null);
  const [payType, setPayType] = useState<'Air' | 'Sampah' | 'Both'>('Both');
  const [payAmount, setPayAmount] = useState('10000');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');
  const [payerName, setPayerName] = useState('');

  const occupiedHousesList = houses.filter(h => h.status === 'Occupied');

  useEffect(() => {
    if (payType === 'Both') setPayAmount('20000');
    else setPayAmount('10000');
  }, [payType]);
  const [editingHouseId, setEditingHouseId] = useState<string | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'demographics' | 'family'>('basic');
  
  // Form State
  const [formData, setFormData] = useState({
    headOfFamily: '',
    gender: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    birthDate: '',
    ownerName: '', // NEW: Nama Pemilik
    ownerPhone: '', // NEW: Kontak Pemilik
    block: '',
    number: '',
    phone: '',
    status: 'Occupied',
    residenceType: 'Tetap', // Default to Tetap (Pemilik)
    paymentStatusAir: PaymentStatus.UNPAID,
    paymentStatusSampah: PaymentStatus.UNPAID,
    occupants: 1,
    nik: '',
    kkNumber: '',
    birthPlace: '',
    maritalStatus: 'Belum Kawin' as any,
    bloodType: '-' as any,
    nationality: 'WNI',
    addressKtp: '',
    bpjsStatus: 'Tidak Ada' as any,
    job: '',
    education: '',
    jobCategory: '',
    vehicleCount: 0,
    pregnantCount: 0,
    babyCount: 0,
    toddlerCount: 0,
    teenagerCount: 0,
    adultCount: 0,
    elderlyCount: 0,
    widowCount: 0,
    childCount: 0,
    isPKH: false,
    isBLT: false,
    isBPNT: false,
    isBansosLain: false,
    bansosLainName: '',
    isDisability: false,
    disabilityCount: 0,
    isOrphan: false,
    orphanCount: 0,
    economicStatus: 'Sejahtera',
    religion: '',
    rondaExempt: false,
    isOutOfTown: false,
    hasGuest: false,
    isIsoman: false,
    vaccinationStatus: 'Belum' as any,
    specialNotes: '',
    housePhotoUrl: '',
    ktpUrl: '',
    kkUrl: '',
    joiningDate: new Date().toISOString().split('T')[0],
    isVerified: true,
    familyMembers: [] as { id?: string; name: string; relation: 'Istri' | 'Anak' | 'Orang Tua' | 'Famili Lain'; nik?: string; birthDate?: string; gender?: 'Laki-laki' | 'Perempuan'; job?: string }[],
    accessCode: ''
  });

  const handleGenerateAllPins = async () => {
    if (window.confirm('Apakah Anda yakin ingin meng-generate PIN untuk semua warga yang belum memiliki PIN?')) {
        setIsGenerating(true);
        try {
            const count = await generateAllAccessCodes(houses);
            if (count > 0) {
              toast.success(`PIN berhasil di-generate untuk ${count} warga yang belum memiliki PIN.`);
            } else {
              toast.info('Semua data warga sudah memiliki PIN. Tidak ada PIN baru yang di-generate.');
            }
        } catch (e) {
            console.error(e);
            toast.error('Gagal meng-generate PIN.');
        } finally {
            setIsGenerating(false);
        }
    }
  };

  const handleCleanupPlaceholders = async () => {
    if (window.confirm('Aksi ini akan mengubah status semua data dengan nama default "Warga [Blok]-[Nomor]" menjadi "Kosong" (Empty) dan mengosongkan detail data mereka. Lanjutkan?')) {
        const verification = window.prompt('Ketik "BERSIHKAN" untuk mengonfirmasi pembersihan data warga default:');
        if (verification !== 'BERSIHKAN') {
            if (verification !== null) toast.error('Verifikasi gagal. Kata kunci tidak cocok.');
            return;
        }
        
        setIsGenerating(true);
        try {
            const updates = houses
                .filter(h => {
                    // Check for exact match or case-insensitive match
                    const exactMatch = h.headOfFamily === `Warga ${h.block}-${h.number}`;
                    const caseInsensitiveMatch = h.headOfFamily.toLowerCase() === `warga ${h.block}-${h.number}`.toLowerCase();
                    
                    // Check for leading zero variations (e.g. "02" vs "2")
                    const num = parseInt(h.number);
                    const paddedNum = num < 10 ? `0${num}` : `${num}`;
                    const unpaddedNum = `${num}`;
                    
                    const matchPadded = h.headOfFamily.toLowerCase() === `warga ${h.block}-${paddedNum}`.toLowerCase();
                    const matchUnpadded = h.headOfFamily.toLowerCase() === `warga ${h.block}-${unpaddedNum}`.toLowerCase();
                    
                    // Check for variations with spaces (e.g. "Warga C5 - 02")
                    const matchWithSpaces = h.headOfFamily.toLowerCase().replace(/\s+/g, '') === `warga${h.block}-${paddedNum}`.toLowerCase();
                    const matchWithSpacesUnpadded = h.headOfFamily.toLowerCase().replace(/\s+/g, '') === `warga${h.block}-${unpaddedNum}`.toLowerCase();
 
                    // Check for "Warga Blok [Block] No [Number]" pattern
                    const matchVerbose = h.headOfFamily.toLowerCase() === `warga blok ${h.block} no ${paddedNum}`.toLowerCase() ||
                                         h.headOfFamily.toLowerCase() === `warga blok ${h.block} no ${unpaddedNum}`.toLowerCase();
 
                    // Check for "Rumah [Block]-[Number]" pattern (from previous resets)
                    const matchRumah = h.headOfFamily.toLowerCase() === `rumah ${h.block}-${paddedNum}`.toLowerCase() ||
                                       h.headOfFamily.toLowerCase() === `rumah ${h.block}-${unpaddedNum}`.toLowerCase();
 
                    return exactMatch || caseInsensitiveMatch || matchPadded || matchUnpadded || matchWithSpaces || matchWithSpacesUnpadded || matchVerbose || matchRumah;
                })
                .map(h => ({
                    id: h.id,
                    status: 'Empty',
                    headOfFamily: '', // Empty the name as requested
                    phone: '',
                    occupants: 0,
                    familyMembers: [],
                    paymentStatus: PaymentStatus.UNPAID
                }));
 
            if (updates.length === 0) {
                toast.info('Tidak ada data warga default yang ditemukan.');
                return;
            }
 
            await batchUpdateHouses(updates);
            toast.success(`Berhasil mereset ${updates.length} data rumah menjadi status Kosong.`);
        } catch (e) {
            console.error(e);
            toast.error('Gagal melakukan cleanup data.');
        } finally {
            setIsGenerating(false);
        }
    }
  };

  const handleDownloadTemplate = () => {
    generateExcelTemplate();
  };

  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (window.confirm('Apakah Anda yakin ingin mengupload data ini? Data yang sudah ada di sistem (berdasarkan Blok dan Nomor) akan diupdate dengan data dari file Excel ini.')) {
      setIsUploading(true);
      try {
        const parsedData = await parseExcelFile(file);
        
        let addedCount = 0;
        let updatedCount = 0;
        let failCount = 0;
        
        const updatesToApply: any[] = [];
        const addsToApply: any[] = [];

        for (const houseData of parsedData) {
          try {
            // Basic validation
            if (!houseData.block || !houseData.number) {
              console.warn('Skipping invalid row:', houseData);
              failCount++;
              continue;
            }

            // Check for existing block and number
            const existingHouse = houses.find(
              h => h.block.toLowerCase() === houseData.block?.toLowerCase() && 
                   h.number.toLowerCase() === houseData.number?.toLowerCase()
            );

            if (existingHouse) {
              // Update existing house
              const updates: any = { ...houseData };
              
              // Don't overwrite headOfFamily if it's empty in Excel
              if (!houseData.headOfFamily || houseData.headOfFamily === '-') {
                delete updates.headOfFamily;
              }

              // Check if there are actual changes
              let hasChanges = false;
              for (const key in updates) {
                if (key === 'block' || key === 'number') continue;
                
                const newValue = updates[key];
                const oldValue = (existingHouse as any)[key];
                
                if (newValue !== oldValue) {
                  hasChanges = true;
                  break;
                }
              }

              if (hasChanges) {
                updatesToApply.push({ id: existingHouse.id, ...updates });
              }
            } else {
              // Add new house
              addsToApply.push({
                ...houseData,
                headOfFamily: houseData.headOfFamily || '-',
                location: { x: 0, y: 0 },
                familyMembers: [],
                paymentStatusAir: houseData.paymentStatusAir || PaymentStatus.UNPAID,
                paymentStatusSampah: houseData.paymentStatusSampah || PaymentStatus.UNPAID,
                status: houseData.status || 'Occupied',
                occupants: houseData.occupants || 1,
                vehicleCount: houseData.vehicleCount || 0,
                pregnantCount: houseData.pregnantCount || 0,
                babyCount: houseData.babyCount || 0,
                toddlerCount: houseData.toddlerCount || 0,
                teenagerCount: houseData.teenagerCount || 0,
                adultCount: houseData.adultCount || 0,
                elderlyCount: houseData.elderlyCount || 0,
                childCount: houseData.childCount || 0,
                widowCount: houseData.widowCount || 0,
                isBPNT: houseData.isBPNT || false,
                isDisability: houseData.isDisability || false,
                disabilityCount: houseData.disabilityCount || 0,
                isOrphan: houseData.isOrphan || false,
                orphanCount: houseData.orphanCount || 0,
                economicStatus: houseData.economicStatus || 'Sejahtera'
              });
            }
          } catch (err) {
            console.error('Error processing house:', err);
            failCount++;
          }
        }

        // Apply updates in batch
        if (updatesToApply.length > 0) {
            await batchUpdateHouses(updatesToApply);
            updatedCount += updatesToApply.length;
        }

        // Apply additions
        for (const add of addsToApply) {
            await addHouse(add);
            addedCount++;
        }

        toast.success(`Upload selesai.`, {
          description: `Data Baru Ditambahkan: ${addedCount}\nData Diperbarui: ${updatedCount}\nGagal/Format Salah: ${failCount}\nData Tidak Berubah: ${parsedData.length - addedCount - updatedCount - failCount}`
        });
      } catch (error) {
        console.error('Excel Parse Error:', error);
        toast.error('Gagal memproses file Excel.');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } else {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBulkVerify = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Apakah Anda yakin ingin memverifikasi ${selectedIds.size} warga terpilih?`)) {
        try {
            const updates = Array.from(selectedIds).map(id => ({ id, isVerified: true }));
            await batchUpdateHouses(updates);
            toast.success('Warga terpilih berhasil diverifikasi.');
            setSelectedIds(new Set());
        } catch (e) {
            console.error(e);
            toast.error('Gagal memverifikasi warga.');
        }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`PERINGATAN: Apakah Anda yakin ingin MENGHAPUS PERMANEN ${selectedIds.size} warga terpilih?`)) {
        try {
            for (const id of Array.from(selectedIds)) {
                const houseToDelete = houses.find(h => h.id === id);
                await deleteHouseFromDb(id);
                
                if (houseToDelete && houseToDelete.status === 'Occupied') {
                  await addPopulationLogToDb({
                    id: Date.now().toString() + Math.random().toString(36).substring(7),
                    type: 'MovedOut',
                    name: houseToDelete.headOfFamily,
                    phone: houseToDelete.phone,
                    houseId: houseToDelete.id,
                    date: new Date().toISOString().split('T')[0],
                    description: 'Data warga dihapus dari sistem (Bulk Delete)',
                    details: {
                      newAddress: '-',
                      reasonForMoving: '-',
                      familyCount: houseToDelete.occupants || 1
                    }
                  });
                }
            }
            toast.success('Warga terpilih berhasil dihapus.');
            setSelectedIds(new Set());
        } catch (e) {
            console.error(e);
            toast.error('Gagal menghapus warga terpilih.');
        }
    }
  };

  const resetForm = () => {
    setFormData({
      headOfFamily: '',
      gender: 'Laki-laki',
      birthDate: '',
      ownerName: '', // NEW: Reset ownerName
      ownerPhone: '', // NEW: Reset ownerPhone
      block: '',
      number: '',
      phone: '',
      status: 'Occupied',
      residenceType: 'Tetap',
      paymentStatusAir: PaymentStatus.UNPAID,
      paymentStatusSampah: PaymentStatus.UNPAID,
      occupants: 1,
      nik: '',
      kkNumber: '',
      birthPlace: '',
      maritalStatus: 'Belum Kawin' as any,
      bloodType: '-' as any,
      nationality: 'WNI',
      addressKtp: '',
      bpjsStatus: 'Tidak Ada' as any,
      job: '',
      education: '',
      jobCategory: '',
      vehicleCount: 0,
      pregnantCount: 0,
      babyCount: 0,
      toddlerCount: 0,
      teenagerCount: 0,
      adultCount: 0,
      elderlyCount: 0,
      widowCount: 0,
      childCount: 0,
      isPKH: false,
      isBLT: false,
      isBPNT: false,
      isBansosLain: false,
      bansosLainName: '',
      isDisability: false,
      disabilityCount: 0,
      isOrphan: false,
      orphanCount: 0,
      economicStatus: 'Sejahtera' as any,
      religion: '',
      rondaExempt: false,
      isOutOfTown: false,
      hasGuest: false,
      isIsoman: false,
      vaccinationStatus: 'Belum' as any,
      specialNotes: '',
      housePhotoUrl: '',
      ktpUrl: '',
      kkUrl: '',
      joiningDate: new Date().toISOString().split('T')[0],
      isVerified: true,
      familyMembers: [],
      accessCode: ''
    });
    setEditingHouseId(null);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payHouse) return;

    const paymentDateObj = new Date(payDate);
    const currentMonth = targetMonth;
    
    // Check for duplicate payment in history for the same month
    const duplicatePayment = iuranPayments.find(p => 
      p.houseId === payHouse.id && 
      isMonthMatch(p.month, currentMonth) &&
      (
        p.type === payType || 
        p.type === 'Both' || 
        payType === 'Both'
      )
    );

    if (duplicatePayment) {
      toast.error(`Pembayaran iuran ${duplicatePayment.type === 'Both' ? 'Air & Sampah' : duplicatePayment.type} untuk bulan ${currentMonth} sudah tercatat pada tanggal ${new Date(duplicatePayment.date).toLocaleDateString('id-ID')}.`);
      return;
    }

    const updates: any = {};
    const isCurrentMonth = isMonthMatch(getIndonesianMonthYear(new Date()), currentMonth);
    
    if (isCurrentMonth) {
      if (payType === 'Air' || payType === 'Both') updates.paymentStatusAir = PaymentStatus.PAID;
      if (payType === 'Sampah' || payType === 'Both') updates.paymentStatusSampah = PaymentStatus.PAID;
      updates.paymentDate = payDate;
    }

    try {
      if (Object.keys(updates).length > 0) {
        await updateHouseData(payHouse.id, updates);
      }
      
      const paymentMonth = currentMonth;
      const paymentDateIso = paymentDateObj.toISOString();
      const amount = parseInt(payAmount) || 0;

      // Record iuran payment separately
      await addIuranPaymentToDb({
        houseId: payHouse.id,
        headOfFamily: payHouse.headOfFamily,
        block: payHouse.block,
        number: payHouse.number,
        amount: amount,
        type: payType,
        date: paymentDateIso,
        month: paymentMonth,
        notes: payNotes,
        payerName: payerName || payHouse.headOfFamily
      });

      // SYNC WITH BILLS COLLECTION
      // Check if a bill already exists for this house and month
      const existingBill = bills.find(b => b.houseId === payHouse.id && b.month === paymentMonth);
      
      const newItems = [];
      if (payType === 'Air' || payType === 'Both') {
        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          name: 'Iuran Air',
          amount: payType === 'Both' ? amount / 2 : amount,
          manager: 'RT 02',
          status: 'Paid' as const,
          paymentDate: paymentDateIso
        });
      }
      if (payType === 'Sampah' || payType === 'Both') {
        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          name: 'Iuran Sampah',
          amount: payType === 'Both' ? amount / 2 : amount,
          manager: 'RT 02',
          status: 'Paid' as const,
          paymentDate: paymentDateIso
        });
      }

      if (existingBill) {
        // Update existing bill items
        const updatedItems = [...existingBill.items];
        newItems.forEach(newItem => {
          const existingItemIndex = updatedItems.findIndex(item => item.name === newItem.name);
          if (existingItemIndex > -1) {
            updatedItems[existingItemIndex] = { ...updatedItems[existingItemIndex], status: 'Paid', paymentDate: paymentDateIso };
          } else {
            updatedItems.push(newItem);
          }
        });

        await updateBillInDb(existingBill.id, {
          items: updatedItems,
          total: updatedItems.reduce((acc, curr) => acc + (curr.status === 'Paid' ? 0 : curr.amount), 0)
        });
      } else {
        // Create new bill
        await addBillToDb({
          houseId: payHouse.id,
          month: paymentMonth,
          dueDate: new Date(new Date(payDate).getFullYear(), new Date(payDate).getMonth(), 20).toISOString().split('T')[0],
          items: newItems,
          total: 0
        });
      }

      toast.success('Status iuran berhasil diperbarui dan dicatat di riwayat tagihan!');
      setIsPayModalOpen(false);
      setPayHouse(null);
      setPayNotes('');
    } catch (error) {
      console.error(error);
      toast.error('Gagal memperbarui status iuran.');
    }
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    try {
      await updateIuranPaymentInDb(editingPayment.id, {
        amount: parseInt(payAmount) || 0,
        type: payType,
        date: new Date(payDate).toISOString(),
        month: getIndonesianMonthYear(new Date(payDate)),
        notes: payNotes,
        payerName: payerName || editingPayment.headOfFamily
      });

      toast.success('Catatan pembayaran berhasil diperbarui!');
      setIsEditPaymentModalOpen(false);
      setEditingPayment(null);
      setPayNotes('');
    } catch (error) {
      console.error(error);
      toast.error('Gagal memperbarui catatan pembayaran.');
    }
  };

  const openPayModal = (house: House) => {
    setPayHouse(house);
    const arrears = getArrearsForHouse(house);
    if (arrears.length > 0) {
      setTargetMonth(arrears[0]);
    } else {
      setTargetMonth(getIndonesianMonthYear(new Date()));
    }
    setIsPayModalOpen(true);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (house: House) => {
    setEditingHouseId(house.id);
    setActiveFormTab('basic');
    setFormData({
      headOfFamily: house.headOfFamily,
      gender: house.gender || 'Laki-laki',
      birthDate: house.birthDate || '',
      ownerName: house.ownerName || '', // NEW: Populate ownerName
      ownerPhone: house.ownerPhone || '', // NEW: Populate ownerPhone
      block: house.block,
      number: house.number,
      phone: house.phone || '',
      status: house.status,
      residenceType: house.residenceType || 'Tetap',
      paymentStatusAir: house.paymentStatusAir || PaymentStatus.UNPAID,
      paymentStatusSampah: house.paymentStatusSampah || PaymentStatus.UNPAID,
      occupants: house.occupants || 1,
      nik: house.nik || '',
      kkNumber: house.kkNumber || '',
      birthPlace: house.birthPlace || '',
      maritalStatus: house.maritalStatus || 'Belum Kawin',
      bloodType: house.bloodType || '-',
      nationality: house.nationality || 'WNI',
      addressKtp: house.addressKtp || '',
      bpjsStatus: house.bpjsStatus || 'Tidak Ada',
      job: house.job || '',
      education: house.education || '',
      jobCategory: house.jobCategory || '',
      vehicleCount: house.vehicleCount || 0,
      rondaExempt: house.rondaExempt || false,
      pregnantCount: house.pregnantCount || 0,
      babyCount: house.babyCount || 0,
      toddlerCount: house.toddlerCount || 0,
      teenagerCount: house.teenagerCount || 0,
      adultCount: house.adultCount || 0,
      elderlyCount: house.elderlyCount || 0,
      widowCount: house.widowCount || 0,
      childCount: house.childCount || 0,
      isPKH: house.isPKH || false,
      isBLT: house.isBLT || false,
      isBPNT: house.isBPNT || false,
      isBansosLain: house.isBansosLain || false,
      bansosLainName: house.bansosLainName || '',
      isDisability: house.isDisability || false,
      disabilityCount: house.disabilityCount || 0,
      isOrphan: house.isOrphan || false,
      orphanCount: house.orphanCount || 0,
      economicStatus: house.economicStatus || 'Sejahtera',
      religion: house.religion || '',
      isOutOfTown: house.isOutOfTown || false,
      hasGuest: house.hasGuest || false,
      isIsoman: house.isIsoman || false,
      vaccinationStatus: house.vaccinationStatus || 'Belum',
      specialNotes: house.specialNotes || '',
      housePhotoUrl: house.housePhotoUrl || '',
      ktpUrl: house.ktpUrl || '',
      kkUrl: house.kkUrl || '',
      joiningDate: house.joiningDate || new Date().toISOString().split('T')[0],
      isVerified: house.isVerified !== undefined ? house.isVerified : true,
      familyMembers: (house.familyMembers || []).map(m => ({ ...m, id: m.id || Math.random().toString(36).substr(2, 9) })),
      accessCode: house.accessCode || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const houseId = formatHouseId(`${formData.block}-${formData.number}`);
      const data = {
        ...formData,
        id: houseId,
        location: { x: 0, y: 0 }, // Default location, map editor handles this separately
        joiningDate: editingHouseId ? (houses.find(h => h.id === editingHouseId)?.joiningDate || new Date().toISOString()) : new Date().toISOString()
      };

      const oldHouse = editingHouseId ? houses.find(h => h.id === editingHouseId) : null;

      if (editingHouseId) {
        // If ID changed (block or number changed), delete old and create new
        if (editingHouseId !== houseId) {
          await deleteHouseFromDb(editingHouseId);
        }
        await addHouse(data); // Using addHouse because it handles setDoc with ID
        if (selectedResident?.id === editingHouseId) {
            setSelectedResident({ ...selectedResident, ...data, id: houseId } as House);
        }
      } else {
        await addHouse(data);
      }

      // --- AUTO GENERATE LOG MUTASI ---
      const logDate = data.joiningDate.split('T')[0];
      
      const vulnerability = [];
      if (data.isPKH) vulnerability.push('PKH');
      if (data.isBLT) vulnerability.push('BLT');
      if (data.isBPNT) vulnerability.push('BPNT');
      if (data.isBansosLain) vulnerability.push(data.bansosLainName || 'Bansos Lainnya');
      if (data.isDisability) vulnerability.push('Disabilitas');
      if (data.isOrphan) vulnerability.push('Yatim/Piatu');
      
      if (!oldHouse && data.status === 'Occupied') {
        // 1. New house added and immediately occupied
        await addPopulationLogToDb({
          id: Date.now().toString(),
          type: 'Newcomer',
          name: data.headOfFamily,
          phone: data.phone,
          houseId: data.id,
          date: logDate,
          description: 'Warga baru ditambahkan melalui Data Warga',
          details: {
            previousAddress: '-',
            reasonForMoving: '-',
            familyCount: data.occupants || 1,
            familyMembers: data.familyMembers || [],
            residenceType: data.residenceType || 'Tetap',
            religion: data.religion || '-',
            vulnerability: vulnerability,
            kkNumber: data.kkNumber || '-',
            jobCategory: data.jobCategory || '-',
            education: data.education || '-'
          }
        });
      } else if (oldHouse) {
        if (oldHouse.status === 'Empty' && data.status === 'Occupied') {
          // 2. House status changed from Empty to Occupied
          await addPopulationLogToDb({
            id: Date.now().toString(),
            type: 'Newcomer',
            name: data.headOfFamily,
            phone: data.phone,
            houseId: data.id,
            date: logDate,
            description: 'Rumah kosong diisi oleh warga baru',
            details: {
              previousAddress: '-',
              reasonForMoving: '-',
              familyCount: data.occupants || 1,
              familyMembers: data.familyMembers || [],
              residenceType: data.residenceType || 'Tetap',
              religion: data.religion || '-',
              vulnerability: vulnerability,
              kkNumber: data.kkNumber || '-',
              jobCategory: data.jobCategory || '-',
              education: data.education || '-'
            }
          });
        } else if (oldHouse.status === 'Occupied' && data.status === 'Empty') {
          // 3. House status changed from Occupied to Empty
          await addPopulationLogToDb({
            id: Date.now().toString(),
            type: 'MovedOut',
            name: oldHouse.headOfFamily,
            phone: oldHouse.phone,
            houseId: data.id,
            date: new Date().toISOString().split('T')[0], // Use current date for moving out
            description: 'Warga pindah keluar (Update Data Warga)',
            details: {
              newAddress: '-',
              reasonForMoving: '-',
              familyCount: oldHouse.occupants || 1
            }
          });
        }
      }

      setIsModalOpen(false);
      resetForm();
      toast.success('Data warga berhasil disimpan!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan data warga.');
    }
  };

  // Filter Logic
  const filteredHouses = houses.filter(h => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      h.headOfFamily.toLowerCase().includes(searchLower) || 
      h.block.toLowerCase().includes(searchLower) ||
      h.number.toLowerCase().includes(searchLower) ||
      (h.ownerName && h.ownerName.toLowerCase().includes(searchLower)) ||
      (h.phone && h.phone.toLowerCase().includes(searchLower)) ||
      (h.familyMembers && h.familyMembers.some(m => m.name.toLowerCase().includes(searchLower)));
    
    const statusSampah = getPaymentStatus(h, 'Sampah');
    const statusAir = getPaymentStatus(h, 'Air');
    const isDuesPaid = statusSampah === PaymentStatus.PAID && statusAir === PaymentStatus.PAID;

    let matchesStatus = true;
    if (filterStatus === 'paid') matchesStatus = isDuesPaid;
    else if (filterStatus === 'unpaid') matchesStatus = !isDuesPaid;
    else if (filterStatus === 'occupied') matchesStatus = h.status?.toLowerCase() === 'occupied';
    else if (filterStatus === 'empty') matchesStatus = h.status?.toLowerCase() === 'empty';
    else if (filterStatus === 'business') matchesStatus = h.status?.toLowerCase() === 'business';
    else if (filterStatus === 'arrears') matchesStatus = h.status === 'Occupied' && getArrearsForHouse(h).length > 0;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.headOfFamily.localeCompare(b.headOfFamily);
    return (a.block + a.number).localeCompare(b.block + b.number);
  });

  // Stats
  const totalResidents = houses.filter(h => h.status === 'Occupied').reduce((acc, h) => acc + (h.occupants || 0), 0);
  const occupiedHouses = houses.filter(h => h.status === 'Occupied').length;
  const emptyHouses = houses.filter(h => h.status === 'Empty').length;

  // Bulk Actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredHouses.map(h => h.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data warga ini?')) {
      try {
        const houseToDelete = houses.find(h => h.id === id);
        await deleteHouseFromDb(id);
        
        if (houseToDelete && houseToDelete.status === 'Occupied') {
          await addPopulationLogToDb({
            id: Date.now().toString(),
            type: 'MovedOut',
            name: houseToDelete.headOfFamily,
            phone: houseToDelete.phone,
            houseId: houseToDelete.id,
            date: new Date().toISOString().split('T')[0],
            description: 'Data warga dihapus dari sistem',
            details: {
              newAddress: '-',
              reasonForMoving: '-',
              familyCount: houseToDelete.occupants || 1
            }
          });
        }

        toast.success('Data warga dihapus.');
        if (selectedResident?.id === id) {
          setIsDrawerOpen(false);
          setSelectedResident(null);
        }
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus data warga.');
      }
    }
  };

  const openDetail = (house: House) => {
    setSelectedResident(house);
    setIsDrawerOpen(true);
  };

  const handleSendWhatsApp = async (house: House) => {
    if (!house.phone) return toast.error('Nomor WhatsApp tidak tersedia.');
    
    const message = window.prompt(`Kirim pesan WhatsApp ke ${house.headOfFamily}:`, `Halo Bapak/Ibu ${house.headOfFamily}, ada informasi dari pengurus RT 02...`);
    
    if (message) {
      try {
        const result = await sendWhatsAppViaGateway(house.phone, message);
        if (result?.success) {
          toast.success(`Pesan berhasil dikirim ke ${house.headOfFamily}`);
        } else {
          toast.error(`Gagal mengirim pesan: ${result?.error || 'Terjadi kesalahan'}`);
        }
      } catch (error) {
        console.error('WA error:', error);
        toast.error('Gagal mengirim pesan WhatsApp via gateway.');
      }
    }
  };

  const maskData = (data: string | undefined) => {
    if (!data) return '-';
    return data.replace(/.(?=.{4})/g, '*');
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
      className="space-y-6 relative"
    >
      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 md:gap-6">
        <div className="w-full lg:w-auto">
          <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">Data Warga</h2>
          <p className="text-[10px] sm:text-xs md:text-sm text-slate-500 font-medium mt-1">Kelola data kependudukan dan status hunian RT 02.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {selectedIds.size > 0 && (
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={handleBulkVerify}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 font-bold text-[9px] sm:text-[10px] md:text-xs transition-all shadow-sm"
              >
                <CheckCircle size={14} className="md:w-4 md:h-4" /> <span>Verifikasi ({selectedIds.size})</span>
              </button>
              <button 
                onClick={handleBulkDelete}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-100 font-bold text-[9px] sm:text-[10px] md:text-xs transition-all shadow-sm"
              >
                <Trash2 size={14} className="md:w-4 md:h-4" /> <span>Hapus</span>
              </button>
            </div>
          )}
          
          <div className="grid grid-cols-2 sm:flex flex-wrap gap-2 w-full lg:w-auto">
            <button 
              onClick={handleGenerateAllPins}
              className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 font-bold text-[9px] sm:text-[10px] md:text-xs transition-all shadow-sm"
              disabled={isGenerating}
            >
              <Shield size={14} className="md:w-4 md:h-4" /> <span className="text-center">{isGenerating ? 'Wait...' : 'PIN Massal'}</span>
            </button>
            <button 
              onClick={handleCleanupPlaceholders}
              className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-100 font-bold text-[9px] sm:text-[10px] md:text-xs transition-all shadow-sm"
              disabled={isGenerating}
            >
              <Trash2 size={14} className="md:w-4 md:h-4" /> <span className="text-center">Reset Default</span>
            </button>
            <button 
              onClick={() => generateProfessionalExcel(houses)}
              className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-[9px] sm:text-[10px] md:text-xs transition-all shadow-lg shadow-emerald-600/20"
            >
              <Download size={14} className="md:w-4 md:h-4" /> Export
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold text-[9px] sm:text-[10px] md:text-xs transition-all shadow-sm"
              disabled={isUploading}
            >
              <Upload size={14} className="md:w-4 md:h-4" /> {isUploading ? '...' : 'Import'}
            </button>
          </div>

          <button 
            onClick={handleOpenAdd}
            className="w-full lg:w-auto flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-xs md:text-sm shadow-lg shadow-indigo-600/20 transition-all"
          >
            <UserPlus size={16} className="md:w-[18px] md:h-[18px]" /> Tambah Warga
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUploadExcel} 
            accept=".xlsx,.xls" 
            className="hidden" 
          />
        </div>
      </div>

      {/* Stats Cards */}
      <ResidentStats 
        totalResidents={totalResidents}
        occupiedHouses={occupiedHouses}
        emptyHouses={emptyHouses}
        itemVariants={itemVariants}
      />
      
      {/* Controls */}
      <ResidentControls 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        getIndonesianMonthYear={getIndonesianMonthYear}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        sortBy={sortBy}
        setSortBy={setSortBy}
        viewMode={viewMode}
        setViewMode={setViewMode}
        residentRegistrations={residentRegistrations}
      />

      <AnimatePresence>
        {isPayModalOpen && payHouse && (
          <PaymentModal 
            isOpen={isPayModalOpen}
            onClose={() => {
              setIsPayModalOpen(false);
              setPayNotes('');
              setPayerName('');
            }}
            payHouse={payHouse}
            payType={payType}
            setPayType={setPayType}
            payAmount={payAmount}
            setPayAmount={setPayAmount}
            payDate={payDate}
            setPayDate={setPayDate}
            payNotes={payNotes}
            setPayNotes={setPayNotes}
            payerName={payerName}
            setPayerName={setPayerName}
            targetMonth={targetMonth}
            setTargetMonth={setTargetMonth}
            handleSavePayment={handleSavePayment}
            getIndonesianMonthYear={getIndonesianMonthYear}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditPaymentModalOpen && editingPayment && (
          <EditPaymentModal 
            isOpen={isEditPaymentModalOpen}
            onClose={() => {
              setIsEditPaymentModalOpen(false);
              setPayNotes('');
              setPayerName('');
            }}
            editingPayment={editingPayment}
            payType={payType}
            setPayType={setPayType}
            payAmount={payAmount}
            setPayAmount={setPayAmount}
            payDate={payDate}
            setPayDate={setPayDate}
            payNotes={payNotes}
            setPayNotes={setPayNotes}
            payerName={payerName}
            setPayerName={setPayerName}
            handleUpdatePayment={handleUpdatePayment}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedHouseForBills && (
          <BillDetailModal 
            key="bill-detail-modal"
            house={selectedHouseForBills} 
            bills={bills} 
            onClose={() => setSelectedHouseForBills(null)} 
          />
        )}
      </AnimatePresence>

      {/* Content View */}
      <motion.div variants={itemVariants}>
        {viewMode === 'analytics' ? (
          <div className="space-y-6 animate-fade-in">
            <ResidentAnalytics houses={houses} />
            <DemographicAnalytics houses={houses} cashFlow={cashFlow} reports={reports} />
          </div>
        ) : viewMode === 'grid' ? (
          <ResidentGridView 
            filteredHouses={filteredHouses}
            selectedMonth={selectedMonth}
            openDetail={openDetail}
            handleOpenEdit={handleOpenEdit}
            handleDelete={handleDelete}
            setSelectedHouseForBills={setSelectedHouseForBills}
            openPayModal={openPayModal}
            onSendWhatsApp={handleSendWhatsApp}
          />
        ) : viewMode === 'iuran' ? (
          <ResidentIuranManager 
            houses={houses}
            searchTerm={searchTerm}
            generateIuranReceiptPDF={generateIuranReceiptPDF}
            pdfConfig={pdfConfig}
            deleteIuranPaymentFromDb={deleteIuranPaymentFromDb}
            setEditingPayment={setEditingPayment}
            setPayType={setPayType}
            setPayAmount={setPayAmount}
            setPayDate={setPayDate}
            setPayNotes={setPayNotes}
            setPayerName={setPayerName}
            setIsEditPaymentModalOpen={setIsEditPaymentModalOpen}
            onSendWhatsApp={handleSendWhatsApp}
          />
        ) : viewMode === 'registrations' ? (
          <ResidentRegistrationList 
            residentRegistrations={residentRegistrations}
            searchTerm={searchTerm}
            updateResidentRegistrationInDb={updateResidentRegistrationInDb}
            addHouse={addHouse}
          />
        ) : viewMode === 'table' ? (
          <ResidentTableView 
            filteredHouses={filteredHouses}
            selectedMonth={selectedMonth}
            selectedIds={selectedIds}
            handleSelectAll={handleSelectAll}
            handleSelectOne={handleSelectOne}
            openDetail={openDetail}
            handleOpenEdit={handleOpenEdit}
            handleDelete={handleDelete}
            onSendWhatsApp={handleSendWhatsApp}
          />
        ) : viewMode === 'map' ? (
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <HouseMap 
          houses={filteredHouses} 
          isAdmin={true} 
          reports={reports} 
          officials={officials}
          iuranPayments={iuranPayments}
          onEditHouse={(h) => openDetail(h)}
        />
      </div>
    ) : (
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
        <p className="text-slate-500 font-bold">Konten Sedang Dimuat...</p>
      </div>
    )}
      </motion.div>

      {/* Resident Detail Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <ResidentDetailDrawer 
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            selectedResident={selectedResident}
            selectedMonth={selectedMonth}
            openPayModal={openPayModal}
            setSelectedHouseForBills={setSelectedHouseForBills}
            handleOpenEdit={handleOpenEdit}
            handleDelete={handleDelete}
          />
        )}
      </AnimatePresence>

      <AddEditResidentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingHouseId={editingHouseId}
        formData={formData}
        setFormData={setFormData}
        handleSaveHouse={handleSaveHouse}
        activeFormTab={activeFormTab}
        setActiveFormTab={setActiveFormTab}
      />
    </motion.div>
  );
};
