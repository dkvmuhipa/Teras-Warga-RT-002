import React, { useState, useEffect } from 'react';
import { 
  getIndonesianMonthYear, 
  generateMonthOptions, 
  isMonthMatch 
} from '../../src/utils/dateUtils';
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
  PieChart as PieChartIcon, ChevronDown, Settings, MoreVertical
} from 'lucide-react';
import { House, Report, Official, CashFlow, PdfConfig, PaymentStatus, ResidentRegistration, Bill, Role } from '../../types';
import { HouseMap } from '../HouseMap';
import { generateResidentReportPDF, generateIuranReceiptPDF } from '../../services/pdfService';
import { 
  batchUpdateHouses, 
  deleteHouseFromDb, 
  updateHouseData, 
  addHouse, 
  generateAllAccessCodes, 
  addTransactionToDb, 
  addIuranPaymentToDb, 
  deleteIuranPaymentFromDb, 
  updateResidentRegistrationInDb, 
  deleteResidentRegistrationFromDb, 
  updateIuranPaymentInDb, 
  formatHouseId, 
  addBillToDb, 
  updateBillInDb, 
  updateGuestReportInDb,
  addPopulationLogToDb, 
  logAction,
  handleFirestoreError,
  OperationType
} from '../../services/databaseService';
import { generateExcelTemplate, parseExcelFile, generateProfessionalExcel } from '../../services/excelService';
import { sendWhatsAppViaGateway } from '../../services/whatsappService';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useConfirm, usePrompt } from '../../context/ConfirmContext';

interface ResidentManagerProps {
  role: Role;
  houses: House[];
  reports: Report[];
  cashFlow: CashFlow[];
  officials: Official[];
  pdfConfig: PdfConfig;
  iuranPayments: any[];
  bills: Bill[];
  residentRegistrations: ResidentRegistration[];
  guestReports: any[];
  settings: any;
}

type FilterStatus = 'all' | 'paid' | 'unpaid' | 'occupied' | 'empty' | 'business';

export const ResidentManager: React.FC<ResidentManagerProps> = ({ 
  role,
  houses, reports, cashFlow, officials, pdfConfig, iuranPayments, bills, residentRegistrations, guestReports, settings
}) => {
  const confirm = useConfirm();
  const prompt = usePrompt();
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'map' | 'iuran' | 'registrations' | 'analytics'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHouseForBills, setSelectedHouseForBills] = useState<House | null>(null);
  const [filterStatus, setFilterStatus] = useState<any>('all');
  const [sortBy, setSortBy] = useState<'name' | 'block'>('block');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedResident, setSelectedResident] = useState<House | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [targetMonths, setTargetMonths] = useState<string[]>([]);
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
    const isConfirmed = await confirm({
      title: 'Generate PIN Warga',
      message: 'Apakah Anda yakin ingin meng-generate PIN untuk semua warga yang belum memiliki PIN? Ini akan memudahkan warga untuk login ke aplikasi.',
      confirmLabel: 'Generate PIN'
    });

    if (isConfirmed) {
      setIsGenerating(true);
      try {
          const count = await generateAllAccessCodes(houses);
          if (count > 0) {
            toast.success(`PIN berhasil di-generate untuk ${count} warga yang belum memiliki PIN.`);
          } else {
            toast.info('Semua data warga sudah memiliki PIN. Tidak ada PIN baru yang di-generate.');
          }
      } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, "houses");
          toast.error('Gagal meng-generate PIN.');
      } finally {
          setIsGenerating(false);
      }
    }
  };

  const handleCleanupPlaceholders = async () => {
    const isConfirmed = await confirm({
        title: 'Bersihkan Data Default',
        message: 'Aksi ini akan mengubah status semua data dengan nama default "Warga [Blok]-[Nomor]" menjadi "Kosong" (Empty) dan mengosongkan detail data mereka. Apakah Anda yakin ingin melanjutkan?',
        confirmLabel: 'Ya, Bersihkan',
        isDanger: true
    });

    if (isConfirmed) {
        const verification = await prompt({
            title: 'Konfirmasi Keamanan',
            message: 'Ketik "BERSIHKAN" untuk mengonfirmasi pembersihan data warga default:',
            confirmLabel: 'Bersihkan Sekarang',
            placeholder: 'BERSIHKAN',
            isDanger: true
        });

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
            handleFirestoreError(e, OperationType.UPDATE, "houses");
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

    const isConfirmed = await confirm({
      title: 'Import Data Excel',
      message: 'Apakah Anda yakin ingin mengupload data ini? Data yang sudah ada di sistem (berdasarkan Blok dan Nomor) akan diupdate dengan data dari file Excel ini.',
      confirmLabel: 'Upload & Update',
      confirmIcon: <Upload size={18} />
    });

    if (isConfirmed) {
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
            handleFirestoreError(err, OperationType.WRITE, "houses");
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
        handleFirestoreError(error, OperationType.WRITE, "houses");
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
    const isConfirmed = await confirm({
      title: 'Verifikasi Massal',
      message: `Apakah Anda yakin ingin memverifikasi ${selectedIds.size} warga terpilih secara sekaligus?`,
      confirmLabel: 'Verifikasi',
    });
    if (isConfirmed) {
      try {
          const updates = Array.from(selectedIds).map(id => ({ id, isVerified: true }));
          await batchUpdateHouses(updates);
          await logAction('Verifikasi Massal', `Verifikasi ${selectedIds.size} warga terpilih`);
          toast.success('Warga terpilih berhasil diverifikasi.');
          setSelectedIds(new Set());
      } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, "houses");
          toast.error('Gagal memverifikasi warga.');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const isConfirmed = await confirm({
      title: 'Hapus Massal Warga',
      message: `PERINGATAN: Apakah Anda yakin ingin MENGHAPUS PERMANEN ${selectedIds.size} warga terpilih? Tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: 'Hapus Semua',
      isDanger: true,
    });
    if (isConfirmed) {
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
            await logAction('Hapus Massal Warga', `Hapus ${selectedIds.size} data warga terpilih`);
            toast.success('Warga terpilih berhasil dihapus.');
            setSelectedIds(new Set());
        } catch (e) {
            handleFirestoreError(e, OperationType.DELETE, "houses");
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

    const currentMonths = targetMonths;
    if (currentMonths.length === 0) return;

    try {
      const totalAmount = parseInt(payAmount) || 0;
      const amountPerMonth = Math.floor(totalAmount / currentMonths.length);
      const isCurrentMonthInSelection = currentMonths.some(m => isMonthMatch(getIndonesianMonthYear(new Date()), m));

      // 1. Update House document if current month is included
      if (isCurrentMonthInSelection) {
        const updates: any = {};
        if (payType === 'Air' || payType === 'Both') updates.paymentStatusAir = PaymentStatus.PAID;
        if (payType === 'Sampah' || payType === 'Both') updates.paymentStatusSampah = PaymentStatus.PAID;
        updates.paymentDate = payDate;
        await updateHouseData(payHouse.id, updates);
      }

      // 2. Loop through months and record payments
      for (const monthStr of currentMonths) {
        // Record iuran payment
        await addIuranPaymentToDb({
          houseId: payHouse.id,
          headOfFamily: payHouse.headOfFamily,
          block: payHouse.block,
          number: payHouse.number,
          amount: amountPerMonth,
          type: payType,
          date: new Date(payDate).toISOString(),
          month: monthStr,
          notes: payNotes + (currentMonths.length > 1 ? ` (Pembayaran Paket ${currentMonths.length} Bulan)` : ""),
          payerName: payerName || payHouse.headOfFamily
        });

        // Sync with Bills
        const existingBill = bills.find(b => b.houseId === payHouse.id && b.month === monthStr);
        const newItems = [];
        if (payType === 'Air' || payType === 'Both') {
          newItems.push({
            id: Math.random().toString(36).substr(2, 9),
            name: 'Iuran Air',
            amount: payType === 'Both' ? amountPerMonth / 2 : amountPerMonth,
            manager: 'RT 02',
            status: 'Paid' as const,
            paymentDate: new Date(payDate).toISOString()
          });
        }
        if (payType === 'Sampah' || payType === 'Both') {
          newItems.push({
            id: Math.random().toString(36).substr(2, 9),
            name: 'Iuran Sampah',
            amount: payType === 'Both' ? amountPerMonth / 2 : amountPerMonth,
            manager: 'RT 02',
            status: 'Paid' as const,
            paymentDate: new Date(payDate).toISOString()
          });
        }

        if (existingBill) {
          const updatedItems = [...existingBill.items];
          newItems.forEach(newItem => {
            const idx = updatedItems.findIndex(item => item.name === newItem.name);
            if (idx > -1) updatedItems[idx] = { ...updatedItems[idx], status: 'Paid', paymentDate: new Date(payDate).toISOString() };
            else updatedItems.push(newItem);
          });
          await updateBillInDb(existingBill.id, {
            items: updatedItems,
            total: updatedItems.reduce((acc, curr) => acc + (curr.status === 'Paid' ? 0 : curr.amount), 0)
          });
        } else {
          await addBillToDb({
            houseId: payHouse.id,
            month: monthStr,
            dueDate: new Date(new Date(payDate).getFullYear(), new Date(payDate).getMonth(), 20).toISOString().split('T')[0],
            items: newItems,
            total: 0
          });
        }
      }

      toast.success(`Berhasil merekam pembayaran untuk ${currentMonths.length} bulan!`);
      setIsPayModalOpen(false);
      setPayHouse(null);
      setTargetMonths([]);
      setPayNotes('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "iuranPayments");
      toast.error('Gagal memproses pembayaran massal.');
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
      handleFirestoreError(error, OperationType.UPDATE, "iuranPayments");
      toast.error('Gagal memperbarui catatan pembayaran.');
    }
  };

  const openPayModal = (house: House) => {
    setPayHouse(house);
    const arrears = getArrearsForHouse(house);
    if (arrears.length > 0) {
      setTargetMonths([arrears[0]]);
    } else {
      setTargetMonths([getIndonesianMonthYear(new Date())]);
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
      const oldHouse = editingHouseId ? houses.find(h => h.id === editingHouseId) : null;
      const houseId = formatHouseId(`${formData.block}-${formData.number}`);
      const data = {
        ...formData,
        id: houseId,
        location: oldHouse?.location || { x: 0, y: 0 },
        // Use the joiningDate from formData which can be modified by the user
        joiningDate: formData.joiningDate || (oldHouse?.joiningDate || new Date().toISOString())
      };

      if (editingHouseId) {
        // If ID changed (block or number changed), migrate related data
        if (editingHouseId !== houseId) {
          // 1. Migrate iuranPayments
          const housePayments = iuranPayments.filter(p => p.houseId === editingHouseId);
          for (const p of housePayments) {
            await updateIuranPaymentInDb(p.id, { 
              houseId: houseId,
              block: formData.block,
              number: formData.number
            });
          }

          // 2. Migrate bills
          const houseBills = bills.filter(b => b.houseId === editingHouseId);
          for (const b of houseBills) {
            await updateBillInDb(b.id, { houseId: houseId });
          }

          // 3. Migrate guestReports
          const houseGuests = guestReports.filter(g => g.residentHouseId === editingHouseId);
          for (const g of houseGuests) {
            await updateGuestReportInDb(g.id, { residentHouseId: houseId });
          }

          // 4. Delete old house
          await deleteHouseFromDb(editingHouseId);
        }
        await addHouse(data); // Using addHouse because it handles setDoc with ID
        await logAction('Update Warga', `Update data warga di rumah ${houseId}`);
        if (selectedResident?.id === editingHouseId) {
            setSelectedResident({ ...selectedResident, ...data, id: houseId } as House);
        }
      } else {
        await addHouse(data);
        await logAction('Tambah Warga', `Tambah data warga baru di rumah ${houseId}`);
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
          description: 'Registrasi Awal (Admin)',
          details: {
            previousAddress: '-',
            reasonForMoving: 'Registrasi Awal',
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
        } else if (oldHouse.status === 'Occupied' && data.status === 'Occupied') {
          // 4. Case: Addition of family members (including births)
          const oldOccupants = oldHouse.occupants || 1;
          const newOccupants = data.occupants || 1;
          const oldFamilyCount = oldHouse.familyMembers?.length || 0;
          const newFamilyCount = data.familyMembers?.length || 0;
          
          if (newOccupants > oldOccupants || newFamilyCount > oldFamilyCount || data.headOfFamily !== oldHouse.headOfFamily) {
            const isNewHead = data.headOfFamily !== oldHouse.headOfFamily;
            const diff = Math.max(newOccupants - oldOccupants, newFamilyCount - oldFamilyCount, 0);
            const oldBabyCount = oldHouse.babyCount || 0;
            const newBabyCount = data.babyCount || 0;
            const isBirth = newBabyCount > oldBabyCount;

            await addPopulationLogToDb({
              id: Date.now().toString(),
              type: isNewHead ? 'Newcomer' : (isBirth ? 'Birth' : 'Newcomer'),
              name: data.headOfFamily,
              phone: data.phone,
              houseId: data.id,
              date: logDate,
              description: isNewHead 
                ? 'Pergantian Kepala Keluarga / Warga Baru'
                : (isBirth 
                  ? `Kelahiran ${newBabyCount - oldBabyCount} bayi baru di keluarga` 
                  : `Penambahan ${diff} anggota keluarga baru`),
              details: {
                previousAddress: isBirth ? 'Lahir di RT 02' : '-',
                reasonForMoving: isNewHead ? 'Pindahan / Ganti KK' : (isBirth ? 'Kelahiran' : 'Penambahan Anggota Keluarga'),
                familyCount: isNewHead ? (data.occupants || 1) : diff,
                familyMembers: data.familyMembers || [],
                residenceType: data.residenceType || 'Tetap',
                religion: data.religion || '-',
                vulnerability: vulnerability,
                kkNumber: data.kkNumber || '-',
                jobCategory: data.jobCategory || '-',
                education: data.education || '-',
                // For Birth specific fields in details
                gender: isBirth ? 'Laki-laki/Perempuan' : undefined,
                motherName: isBirth ? data.headOfFamily : undefined // Placeholder or logic to find mother
              }
            });
          }
        }
      }

      setIsModalOpen(false);
      resetForm();
      toast.success('Data warga berhasil disimpan!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "houses");
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
    else if (filterStatus === 'verified') matchesStatus = h.isVerified === true;
    else if (filterStatus === 'unverified') matchesStatus = !h.isVerified;
    else if (filterStatus === 'arrears') matchesStatus = h.status === 'Occupied' && getArrearsForHouse(h).length > 0;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.headOfFamily.localeCompare(b.headOfFamily);
    const blockCompare = a.block.localeCompare(b.block);
    if (blockCompare !== 0) return blockCompare;
    return a.number.localeCompare(b.number, undefined, { numeric: true });
  });

  // Stats
  const totalResidents = houses.filter(h => h.status === 'Occupied').reduce((acc, h) => acc + (h.occupants || 0), 0);
  const occupiedHouses = houses.filter(h => h.status === 'Occupied').length;
  const emptyHouses = houses.filter(h => h.status === 'Empty').length;
  const verifiedCount = houses.filter(h => h.isVerified).length;

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
    const houseToDelete = houses.find(h => h.id === id);
    const isConfirmed = await confirm({
      title: 'Hapus Data Warga',
      message: `Apakah Anda yakin ingin menghapus data warga di ${houseToDelete?.block}-${houseToDelete?.number} (${houseToDelete?.headOfFamily || 'Kosong'})? Tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: 'Hapus Permanen',
      isDanger: true,
    });
    if (isConfirmed) {
      try {
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
          handleFirestoreError(error, OperationType.DELETE, "houses");
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
    
    const defaultMsg = `Halo Bapak/Ibu ${house.headOfFamily}, ada informasi dari pengurus RT 02...`;
    const message = await prompt({
      title: `Kirim WhatsApp ke ${house.headOfFamily}`,
      message: 'Masukkan pesan yang ingin dikirim:',
      initialValue: defaultMsg,
      placeholder: 'Tulis pesan di sini...'
    });
    
    if (message) {
      try {
        const result = await sendWhatsAppViaGateway(house.phone, message);
        if (result?.success) {
          toast.success(`Pesan berhasil dikirim ke ${house.headOfFamily}`);
        } else {
          toast.error(`Gagal mengirim pesan: ${result?.error || 'Terjadi kesalahan'}`);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, "whatsapp");
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 md:gap-8 mb-4">
        <motion.div variants={itemVariants} className="w-full lg:w-auto">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Data Warga
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse hidden md:block"></div>
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-semibold mt-1 tracking-wide">
            Administrasi kependudukan & sistem pemantauan hunian RT 02
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
              <button 
                onClick={handleBulkVerify}
                className="group flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95"
              >
                <CheckCircle size={14} className="group-hover:scale-110 transition-transform" /> 
                <span>Sahkan ({selectedIds.size})</span>
              </button>
              <button 
                onClick={handleBulkDelete}
                className="group flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl hover:bg-rose-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95"
              >
                <Trash2 size={14} className="group-hover:scale-110 transition-transform" /> 
                <span>Hapus</span>
              </button>
            </div>
          )}
          
          <div className="relative">
            <button 
              onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
              className={`flex items-center gap-2 px-5 py-2.5 bg-white border rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95 ${
                isActionMenuOpen 
                  ? 'border-indigo-500 text-indigo-600 ring-4 ring-indigo-500/5' 
                  : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Settings size={14} className={isActionMenuOpen ? 'animate-spin-slow' : 'text-slate-400'} />
              <span>Manajemen Data</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isActionMenuOpen ? 'rotate-180 text-indigo-500' : ''}`} />
            </button>

            {isActionMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsActionMenuOpen(false)}></div>
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 mt-3 w-64 bg-white/90 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl z-20 overflow-hidden ring-1 ring-black/5"
                >
                  <div className="p-3 space-y-1.5">
                    <div className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.25em]">Aksi Massal</div>
                    <button 
                      onClick={() => { handleGenerateAllPins(); setIsActionMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-white hover:text-indigo-600 hover:shadow-sm rounded-2xl transition-all"
                      disabled={isGenerating}
                    >
                      <div className="p-2 bg-amber-50 text-amber-500 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                        <Shield size={14} />
                      </div>
                      <span>{isGenerating ? 'Memproses...' : 'Otokit PIN'}</span>
                    </button>
                    <button 
                      onClick={() => { handleCleanupPlaceholders(); setIsActionMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-white hover:text-rose-600 hover:shadow-sm rounded-2xl transition-all"
                    >
                      <div className="p-2 bg-rose-50 text-rose-500 rounded-xl group-hover:bg-rose-500 group-hover:text-white transition-colors">
                        <Trash2 size={14} />
                      </div>
                      <span>Reset Awal</span>
                    </button>
                    
                    <div className="h-px bg-slate-100 mx-3 my-2"></div>
                    <div className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.25em]">Impor & Ekspor</div>
                    
                    <button 
                      onClick={() => { generateProfessionalExcel(houses); setIsActionMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-white hover:text-emerald-600 hover:shadow-sm rounded-2xl transition-all"
                    >
                      <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl">
                        <Download size={14} />
                      </div>
                      <span>Unduh Excel</span>
                    </button>
                    <button 
                      onClick={() => { fileInputRef.current?.click(); setIsActionMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-white hover:text-indigo-600 hover:shadow-sm rounded-2xl transition-all"
                      disabled={isUploading}
                    >
                      <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl">
                        <Upload size={14} />
                      </div>
                      <span>Unggah Data</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </div>

          <button 
            onClick={handleOpenAdd}
            className="group relative flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 active:scale-95"
          >
            <UserPlus size={16} className="group-hover:scale-110 transition-transform" />
            <span>Tambah Warga Baru</span>
            <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUploadExcel} 
            accept=".xlsx,.xls" 
            className="hidden" 
          />
        </motion.div>
      </div>

      {/* Stats Cards */}
      <ResidentStats 
        totalResidents={totalResidents}
        occupiedHouses={occupiedHouses}
        emptyHouses={emptyHouses}
        verifiedCount={verifiedCount}
        itemVariants={itemVariants}
      />
      
      {/* Controls */}
      <ResidentControls 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
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
              setTargetMonths([]);
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
            targetMonths={targetMonths}
            setTargetMonths={setTargetMonths}
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
            openPayModal={openPayModal}
            onSendWhatsApp={handleSendWhatsApp}
          />
        ) : viewMode === 'registrations' ? (
          <ResidentRegistrationList 
            residentRegistrations={residentRegistrations}
            searchTerm={searchTerm}
            updateResidentRegistrationInDb={updateResidentRegistrationInDb}
            addHouse={addHouse}
            addPopulationLogToDb={addPopulationLogToDb}
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
        role={role}
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
