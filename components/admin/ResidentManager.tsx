import React, { useState, useEffect } from 'react';
import { BillDetailModal } from './BillDetailModal';
import { ResidentAnalytics } from './ResidentAnalytics';
import { ResidentCard } from './ResidentCard';
import { DemographicAnalytics } from './DemographicAnalytics';
import { 
  Search, Filter, Grid, List, UserPlus, Download, Upload, 
  Trash2, Edit2, MoreHorizontal, CheckCircle, XCircle, AlertCircle,
  Users, Home, X, Phone, Shield, Calendar, MapPin, Activity,
  ChevronRight, CreditCard, Mail, User, DollarSign, LayoutList, FileText, Printer,
  PieChart as PieChartIcon
} from 'lucide-react';
import { House, Report, Official, CashFlow, PdfConfig, PaymentStatus, ResidentRegistration, Bill } from '../../types';
import { HouseMap } from '../HouseMap';
import { generateResidentReportPDF, generateIuranReceiptPDF } from '../../services/pdfService';
import { batchUpdateHouses, deleteHouseFromDb, updateHouseData, addHouse, generateAllAccessCodes, addTransactionToDb, addIuranPaymentToDb, deleteIuranPaymentFromDb, updateResidentRegistrationInDb, deleteResidentRegistrationFromDb, updateIuranPaymentInDb, formatHouseId, addBillToDb, updateBillInDb } from '../../services/databaseService';
import { generateExcelTemplate, parseExcelFile, generateProfessionalExcel } from '../../services/excelService';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'motion/react';

interface ResidentManagerProps {
  houses: House[];
  reports: Report[];
  cashFlow: CashFlow[];
  officials: Official[];
  pdfConfig: PdfConfig;
  iuranPayments: any[];
  bills: Bill[];
  residentRegistrations: ResidentRegistration[];
}

type FilterStatus = 'all' | 'paid' | 'unpaid' | 'occupied' | 'empty' | 'business';

export const ResidentManager: React.FC<ResidentManagerProps> = ({ 
  houses, reports, cashFlow, officials, pdfConfig, iuranPayments, bills, residentRegistrations 
}) => {
  const getIndonesianMonthYear = (date: Date) => {
    const monthsId = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${monthsId[date.getMonth()]} ${date.getFullYear()}`;
  };

  const isMonthMatch = (monthA: string, monthB: string) => {
    if (!monthA || !monthB) return false;
    const cleanA = monthA.trim().toLowerCase();
    const cleanB = monthB.trim().toLowerCase();
    if (cleanA === cleanB) return true;

    const monthsId = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
    const monthsEn = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

    // Helper to normalize month string (e.g. "January 2026" -> index 0, year 2026)
    const normalize = (m: string) => {
      const parts = m.trim().toLowerCase().split(/\s+/);
      if (parts.length < 1) return null;
      
      const name = parts[0];
      // Year is optional, if missing we just compare month index
      const year = parts.length > 1 ? parts[1] : null;
      
      let index = monthsId.indexOf(name);
      if (index === -1) index = monthsEn.indexOf(name);
      
      if (index === -1) return null;
      return year ? `${index}-${year}` : `${index}`;
    };

    const normA = normalize(cleanA);
    const normB = normalize(cleanB);
    
    if (!normA || !normB) return false;

    // If both have years, compare both. If one is missing year, compare only month index.
    if (normA.includes('-') && normB.includes('-')) {
      return normA === normB;
    }
    
    const indexA = normA.split('-')[0];
    const indexB = normB.split('-')[0];
    return indexA === indexB;
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
  const [selectedMonth, setSelectedMonth] = useState(getIndonesianMonthYear(new Date()));
  const [payHouse, setPayHouse] = useState<House | null>(null);

  const getPaymentStatus = (house: House, type: 'Air' | 'Sampah') => {
    const houseId = house.id;
    const payment = iuranPayments.find(p => {
      const idMatch = String(p.houseId) === String(houseId) || 
                      String(p.houseId) === `${house.block}-${house.number}` ||
                      (p.block === house.block && p.number === house.number);
      return idMatch && isMonthMatch(p.month, selectedMonth) && (p.type === type || p.type === 'Both');
    });
    
    if (payment) return PaymentStatus.PAID;

    // Fallback to house record if it's the current month or matches paymentDate
    const isCurrentMonth = isMonthMatch(getIndonesianMonthYear(new Date()), selectedMonth);
    const isDateMatch = house.paymentDate && isMonthMatch(getIndonesianMonthYear(new Date(house.paymentDate)), selectedMonth);
    
    if (isCurrentMonth || isDateMatch) {
      if (type === 'Air' && house.paymentStatusAir === PaymentStatus.PAID) return PaymentStatus.PAID;
      if (type === 'Sampah' && house.paymentStatusSampah === PaymentStatus.PAID) return PaymentStatus.PAID;
    }
    
    return PaymentStatus.PENDING;
  };
  const [payType, setPayType] = useState<'Air' | 'Sampah' | 'Both'>('Both');
  const [payAmount, setPayAmount] = useState('10000');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);

  // Calculate Iuran Summary for the selected month
  const currentMonthPayments = iuranPayments.filter(p => isMonthMatch(p.month, selectedMonth));
  const totalCollected = currentMonthPayments.reduce((acc, p) => acc + p.amount, 0);
  const occupiedHousesList = houses.filter(h => h.status === 'Occupied');
  const paidHousesCount = new Set(currentMonthPayments.map(p => p.houseId)).size;
  const participationRate = occupiedHousesList.length > 0 ? Math.round((paidHousesCount / occupiedHousesList.length) * 100) : 0;
  const unpaidHousesCount = occupiedHousesList.length - paidHousesCount;
  const estimatedReceivables = unpaidHousesCount * 20000;

  // Arrears Calculation Logic
  const getArrearsForHouse = (house: House) => {
    const houseId = house.id;
    const monthsId = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth(); // 0-indexed
    
    const arrears: string[] = [];
    for (let i = 0; i < currentMonthIndex; i++) {
      const monthStrId = `${monthsId[i]} ${currentYear}`;
      
      const hasPaid = iuranPayments.some(p => {
        const idMatch = String(p.houseId) === String(houseId) || 
                        String(p.houseId) === `${house.block}-${house.number}` ||
                        (p.block === house.block && p.number === house.number);
        return idMatch && isMonthMatch(p.month, monthStrId);
      });
      
      // Also check if the house record itself has a payment date for this month
      const houseRecordPaid = house.paymentDate && 
                             isMonthMatch(getIndonesianMonthYear(new Date(house.paymentDate)), monthStrId) &&
                             house.paymentStatusAir === PaymentStatus.PAID &&
                             house.paymentStatusSampah === PaymentStatus.PAID;

      if (!hasPaid && !houseRecordPaid) {
        arrears.push(monthStrId);
      }
    }
    return arrears;
  };

  const totalArrearsMonths = occupiedHousesList.reduce((acc, h) => acc + getArrearsForHouse(h).length, 0);
  const totalArrearsAmount = totalArrearsMonths * 20000;

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
    block: '',
    number: '',
    phone: '',
    status: 'Occupied',
    residenceType: 'Tetap', // Default to Tetap (Pemilik)
    paymentStatusAir: PaymentStatus.UNPAID,
    paymentStatusSampah: PaymentStatus.UNPAID,
    occupants: 1,
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
    isBansosLain: false,
    bansosLainName: '',
    familyMembers: [] as { id?: string; name: string; relation: 'Istri' | 'Anak' | 'Orang Tua' | 'Famili Lain'; nik?: string; birthDate?: string; gender?: 'Laki-laki' | 'Perempuan'; job?: string }[],
    accessCode: ''
  });

  const handleGenerateAllPins = async () => {
    if (window.confirm('Apakah Anda yakin ingin meng-generate PIN untuk semua warga yang belum memiliki PIN?')) {
        setIsGenerating(true);
        try {
            const count = await generateAllAccessCodes(houses);
            if (count > 0) {
              alert(`PIN berhasil di-generate untuk ${count} warga yang belum memiliki PIN.`);
            } else {
              alert('Semua data warga sudah memiliki PIN. Tidak ada PIN baru yang di-generate.');
            }
        } catch (e) {
            console.error(e);
            alert('Gagal meng-generate PIN.');
        } finally {
            setIsGenerating(false);
        }
    }
  };

  const handleCleanupPlaceholders = async () => {
    if (window.confirm('Aksi ini akan mengubah status semua data dengan nama default "Warga [Blok]-[Nomor]" menjadi "Kosong" (Empty) dan mengosongkan detail data mereka. Lanjutkan?')) {
        const verification = window.prompt('Ketik "BERSIHKAN" untuk mengonfirmasi pembersihan data warga default:');
        if (verification !== 'BERSIHKAN') {
            if (verification !== null) alert('Verifikasi gagal. Kata kunci tidak cocok.');
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
                alert('Tidak ada data warga default yang ditemukan.');
                return;
            }

            await batchUpdateHouses(updates);
            alert(`Berhasil mereset ${updates.length} data rumah menjadi status Kosong.`);
        } catch (e) {
            console.error(e);
            alert('Gagal melakukan cleanup data.');
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
                elderlyCount: houseData.elderlyCount || 0
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

        alert(`Upload selesai.\nData Baru Ditambahkan: ${addedCount}\nData Diperbarui: ${updatedCount}\nGagal/Format Salah: ${failCount}\nData Tidak Berubah: ${parsedData.length - addedCount - updatedCount - failCount}`);
      } catch (error) {
        console.error('Excel Parse Error:', error);
        alert('Gagal memproses file Excel.');
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
            alert('Warga terpilih berhasil diverifikasi.');
            setSelectedIds(new Set());
        } catch (e) {
            console.error(e);
            alert('Gagal memverifikasi warga.');
        }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`PERINGATAN: Apakah Anda yakin ingin MENGHAPUS PERMANEN ${selectedIds.size} warga terpilih?`)) {
        try {
            for (const id of Array.from(selectedIds)) {
                await deleteHouseFromDb(id);
            }
            alert('Warga terpilih berhasil dihapus.');
            setSelectedIds(new Set());
        } catch (e) {
            console.error(e);
            alert('Gagal menghapus warga terpilih.');
        }
    }
  };

  const resetForm = () => {
    setFormData({
      headOfFamily: '',
      gender: 'Laki-laki',
      birthDate: '',
      ownerName: '', // NEW: Reset ownerName
      block: '',
      number: '',
      phone: '',
      status: 'Occupied',
      residenceType: 'Tetap',
      paymentStatusAir: PaymentStatus.UNPAID,
      paymentStatusSampah: PaymentStatus.UNPAID,
      occupants: 1,
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
      isBansosLain: false,
      bansosLainName: '',
      familyMembers: [],
      accessCode: ''
    });
    setEditingHouseId(null);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payHouse) return;

    const paymentDateObj = new Date(payDate);
    const currentMonth = getIndonesianMonthYear(paymentDateObj);
    
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
      alert(`Pembayaran iuran ${duplicatePayment.type === 'Both' ? 'Air & Sampah' : duplicatePayment.type} untuk bulan ${currentMonth} sudah tercatat pada tanggal ${new Date(duplicatePayment.date).toLocaleDateString('id-ID')}.`);
      return;
    }

    const updates: any = {};
    if (payType === 'Air' || payType === 'Both') updates.paymentStatusAir = PaymentStatus.PAID;
    if (payType === 'Sampah' || payType === 'Both') updates.paymentStatusSampah = PaymentStatus.PAID;
    updates.paymentDate = payDate;

    try {
      await updateHouseData(payHouse.id, updates);
      
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
        month: paymentMonth
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

      alert('Status iuran berhasil diperbarui dan dicatat di riwayat tagihan!');
      setIsPayModalOpen(false);
      setPayHouse(null);
    } catch (error) {
      console.error(error);
      alert('Gagal memperbarui status iuran.');
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
        month: getIndonesianMonthYear(new Date(payDate))
      });

      alert('Catatan pembayaran berhasil diperbarui!');
      setIsEditPaymentModalOpen(false);
      setEditingPayment(null);
    } catch (error) {
      console.error(error);
      alert('Gagal memperbarui catatan pembayaran.');
    }
  };

  const openPayModal = (house: House) => {
    setPayHouse(house);
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
      block: house.block,
      number: house.number,
      phone: house.phone || '',
      status: house.status,
      residenceType: house.residenceType || 'Tetap',
      paymentStatusAir: house.paymentStatusAir || PaymentStatus.UNPAID,
      paymentStatusSampah: house.paymentStatusSampah || PaymentStatus.UNPAID,
      occupants: house.occupants || 1,
      education: house.education || '',
      jobCategory: house.jobCategory || '',
      vehicleCount: house.vehicleCount || 0,
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
      isBansosLain: house.isBansosLain || false,
      bansosLainName: house.bansosLainName || '',
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
        location: { x: 0, y: 0 } // Default location, map editor handles this separately
      };

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
      setIsModalOpen(false);
      resetForm();
      alert('Data warga berhasil disimpan!');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan data warga.');
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
      (h.phone && h.phone.toLowerCase().includes(searchLower));
    
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
      await deleteHouseFromDb(id);
      if (selectedResident?.id === id) {
        setIsDrawerOpen(false);
        setSelectedResident(null);
      }
    }
  };

  const openDetail = (house: House) => {
    setSelectedResident(house);
    setIsDrawerOpen(true);
  };

  const selectedResidentBills: any[] = [];
  const isFullyPaid = selectedResidentBills.length > 0 && selectedResidentBills.every(b => b.total === 0);

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
      <ResidentAnalytics houses={houses} />
      
      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-3 bg-white p-3 md:p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Cari nama, pemilik, blok, nomor, atau telepon..." 
            className="w-full pl-10 pr-4 py-2 md:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 sm:flex flex-wrap gap-2">
          <div className="flex items-center gap-2 px-3 bg-slate-50 border border-slate-200 rounded-xl">
            <Calendar size={14} className="text-slate-400" />
            <select 
              className="bg-transparent py-2 md:py-2.5 text-[9px] sm:text-[10px] md:text-xs font-bold outline-none w-full" 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)}
            >
              {Array.from({ length: 12 }).map((_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const m = getIndonesianMonthYear(d);
                return <option key={m} value={m}>{m}</option>;
              })}
            </select>
          </div>
          
          <select className="flex-1 p-2 md:p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[9px] sm:text-[10px] md:text-xs font-bold outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
              <option value="all">Semua Status</option>
              <option value="paid">Lunas</option>
              <option value="unpaid">Belum Lunas</option>
              <option value="occupied">Dihuni</option>
              <option value="empty">Kosong</option>
              <option value="business">Usaha</option>
          </select>

          <select className="flex-1 p-2 md:p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[9px] sm:text-[10px] md:text-xs font-bold outline-none sm:w-40" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
              <option value="block">Urutkan Blok</option>
              <option value="name">Urutkan Nama</option>
          </select>

          <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 col-span-2 sm:col-span-1 justify-center overflow-x-auto no-scrollbar">
              <button onClick={() => setViewMode('grid')} className={`flex-1 sm:flex-none p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><Users size={16} className="md:w-[18px] md:h-[18px]"/></button>
              <button onClick={() => setViewMode('table')} className={`flex-1 sm:flex-none p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Tabel"><LayoutList size={16} className="md:w-[18px] md:h-[18px]"/></button>
              <button onClick={() => setViewMode('map')} className={`flex-1 sm:flex-none p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Peta"><MapPin size={16} className="md:w-[18px] md:h-[18px]"/></button>
              <button onClick={() => setViewMode('iuran')} className={`flex-1 sm:flex-none p-2 rounded-lg transition-all ${viewMode === 'iuran' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Laporan Iuran"><DollarSign size={16} className="md:w-[18px] md:h-[18px]"/></button>
              <div className="relative flex-1 sm:flex-none">
                <button onClick={() => setViewMode('registrations')} className={`w-full p-2 rounded-lg transition-all ${viewMode === 'registrations' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Pendaftaran Baru">
                  <UserPlus size={16} className="mx-auto md:w-[18px] md:h-[18px]"/>
                  {residentRegistrations.filter(r => r.approvalStatus === 'Pending').length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 md:w-4 md:h-4 bg-rose-500 text-white text-[7px] md:text-[8px] font-black rounded-full flex items-center justify-center border border-white">
                      {residentRegistrations.filter(r => r.approvalStatus === 'Pending').length}
                    </span>
                  )}
                </button>
              </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isPayModalOpen && payHouse && (
          <Modal key="payment-modal" isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title={`Bayar Iuran: ${payHouse.headOfFamily}`}>
            <form onSubmit={handleSavePayment} className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Rumah</p>
                <p className="text-sm font-black text-slate-800">Blok {payHouse.block} No. {payHouse.number}</p>
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Periode Iuran</p>
                  <p className="text-sm font-black text-indigo-600">
                    {getIndonesianMonthYear(new Date(payDate))}
                  </p>
                </div>
                <p className="text-[10px] text-amber-600 font-bold mt-2 italic">* Pencatatan status iuran saja (Dana disetor ke OP Air/TPS3R)</p>
              </div>

              <div>
                <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Jenis Iuran</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={payType}
                  onChange={e => setPayType(e.target.value as any)}
                >
                  <option value="Both">Iuran Sampah & Air</option>
                  <option value="Sampah">Iuran Sampah Saja</option>
                  <option value="Air">Iuran Air Saja</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Nominal Pembayaran (Rp)</label>
                <input 
                  type="number"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Tanggal Pembayaran</label>
                <input 
                  type="date"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                  required
                />
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100">
                  Simpan Status Iuran
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditPaymentModalOpen && editingPayment && (
          <Modal key="edit-payment-modal" isOpen={isEditPaymentModalOpen} onClose={() => setIsEditPaymentModalOpen(false)} title={`Edit Catatan Iuran: ${editingPayment.headOfFamily}`}>
            <form onSubmit={handleUpdatePayment} className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Rumah</p>
                <p className="text-sm font-black text-slate-800">Blok {editingPayment.block} No. {editingPayment.number}</p>
              </div>

              <div>
                <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Jenis Iuran</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={payType}
                  onChange={e => setPayType(e.target.value as any)}
                >
                  <option value="Both">Iuran Sampah & Air</option>
                  <option value="Sampah">Iuran Sampah Saja</option>
                  <option value="Air">Iuran Air Saja</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Nominal Pembayaran (Rp)</label>
                <input 
                  type="number"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Tanggal Pembayaran</label>
                <input 
                  type="date"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                  required
                />
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </Modal>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-lg shadow-blue-600/20 flex items-center gap-3 md:gap-5 group hover:scale-[1.02] transition-transform relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="p-3 md:p-4 bg-white/20 text-white rounded-xl md:rounded-2xl backdrop-blur-sm border border-white/20">
            <Users size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="relative z-10 text-white">
            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-80">Total Warga</p>
            <h3 className="text-xl md:text-2xl font-black">{totalResidents} <span className="text-[10px] md:text-xs font-bold opacity-60">Jiwa</span></h3>
          </div>
        </motion.div>

        {[
          { icon: Home, label: 'Rumah Dihuni', value: occupiedHouses, unit: 'Unit', color: 'emerald' },
          { icon: Shield, label: 'Rumah Kosong', value: emptyHouses, unit: 'Unit', color: 'slate' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            variants={itemVariants}
            className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-3 md:gap-5 group hover:shadow-xl hover:shadow-slate-200/50 transition-all"
          >
            <div className={`p-3 md:p-4 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform`}>
              <stat.icon size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-xl md:text-2xl font-black text-slate-900">{stat.value} <span className="text-[10px] md:text-xs font-bold text-slate-400">{stat.unit}</span></h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters & Search */}
      <motion.div variants={itemVariants} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama, pemilik, blok, nomor, atau telepon..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl shrink-0 border border-slate-200/50">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Tampilan Grid"
            >
              <Grid size={20}/>
            </button>
            <button 
              onClick={() => setViewMode('table')} 
              className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Tampilan Tabel"
            >
              <List size={20}/>
            </button>
            <button 
              onClick={() => setViewMode('analytics')} 
              className={`p-2 rounded-xl transition-all ${viewMode === 'analytics' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Analitik Demografi"
            >
              <PieChartIcon size={20}/>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <Filter size={18} className="text-slate-400 shrink-0" />
            <select 
              className="bg-transparent border-none text-sm font-bold text-slate-700 outline-none cursor-pointer pr-4"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="paid">Lunas</option>
              <option value="unpaid">Belum Lunas</option>
              <option value="occupied">Dihuni</option>
              <option value="empty">Kosong</option>
              <option value="business">Usaha</option>
              <option value="arrears">Ada Tunggakan</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Content View */}
      <motion.div variants={itemVariants}>
        {viewMode === 'analytics' ? (
          <div className="space-y-6 animate-fade-in">
            <ResidentAnalytics houses={houses} />
            <DemographicAnalytics houses={houses} cashFlow={cashFlow} reports={reports} />
          </div>
        ) : viewMode === 'grid' ? (
          <div className="space-y-8">
            {Object.entries(filteredHouses.reduce((acc, house) => {
              if (!acc[house.block]) acc[house.block] = [];
              acc[house.block].push(house);
              return acc;
            }, {} as Record<string, typeof filteredHouses>)).sort(([a], [b]) => a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'})).map(([block, houses]) => (
              <div key={block} className="space-y-4 p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-1.5 h-8 bg-indigo-500 rounded-full"></div>
                  <h3 className="text-xl font-black text-slate-800">Blok {block}</h3>
                  <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">{houses.length} Rumah</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {houses.map((house) => (
                    <ResidentCard 
                      key={house.id}
                      house={house}
                      bills={[]}
                      onOpenDetail={openDetail}
                      onOpenEdit={handleOpenEdit}
                      onDelete={handleDelete}
                      onOpenBills={setSelectedHouseForBills}
                      onOpenPay={openPayModal}
                      dynamicStatusAir={getPaymentStatus(house, 'Air')}
                      dynamicStatusSampah={getPaymentStatus(house, 'Sampah')}
                      arrears={house.status === 'Occupied' ? getArrearsForHouse(house) : []}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'iuran' ? (
            <div className="space-y-6">
              {/* Financial Summary Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                    <DollarSign size={48} className="text-emerald-600" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Terkumpul</p>
                  <h4 className="text-2xl font-black text-slate-800">Rp {totalCollected.toLocaleString()}</h4>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-md border border-emerald-100">
                      {selectedMonth}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                    <Activity size={48} className="text-indigo-600" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Partisipasi Warga</p>
                  <h4 className="text-2xl font-black text-slate-800">{participationRate}%</h4>
                  <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full transition-all duration-1000" 
                      style={{ width: `${participationRate}%` }}
                    ></div>
                  </div>
                  <p className="mt-2 text-[10px] font-bold text-slate-400">{paidHousesCount} dari {occupiedHousesList.length} Rumah Dihuni</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                    <AlertCircle size={48} className="text-rose-600" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Belum Bayar</p>
                  <h4 className="text-2xl font-black text-rose-600">{unpaidHousesCount} <span className="text-sm text-slate-400 font-bold">Rumah</span></h4>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-md border border-rose-100">
                      Bulan Ini
                    </span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                    <CreditCard size={48} className="text-amber-600" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Estimasi Piutang</p>
                  <h4 className="text-2xl font-black text-slate-800">Rp {estimatedReceivables.toLocaleString()}</h4>
                  <p className="mt-4 text-[10px] font-bold text-slate-400 italic">Bulan Ini</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm relative overflow-hidden group ring-2 ring-rose-500/5">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                    <AlertCircle size={48} className="text-rose-600" />
                  </div>
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-1">Total Tunggakan</p>
                  <h4 className="text-2xl font-black text-rose-600">Rp {totalArrearsAmount.toLocaleString()}</h4>
                  <p className="mt-4 text-[10px] font-bold text-rose-400 italic">Dari {totalArrearsMonths} Bulan Unpaid</p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Rincian Transaksi Iuran</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1">Daftar pembayaran yang masuk untuk periode {selectedMonth}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        const unpaidHouses = occupiedHousesList.filter(h => !currentMonthPayments.some(p => 
                          String(p.houseId) === String(h.id) || 
                          String(p.houseId) === `${h.block}-${h.number}` ||
                          (p.block === h.block && p.number === h.number)
                        ));
                        const text = `*DAFTAR WARGA BELUM BAYAR IURAN*\n*Periode:* ${selectedMonth}\n\n` + 
                          unpaidHouses.map((h, i) => {
                            const arrears = getArrearsForHouse(h);
                            const arrearsText = arrears.length > 0 ? ` (+ Tunggakan ${arrears.length} bln)` : '';
                            return `${i+1}. Blok ${h.block}-${h.number} (${h.headOfFamily})${arrearsText}`;
                          }).join('\n') +
                          `\n\nMohon segera melakukan pembayaran. Terima kasih.`;
                        navigator.clipboard.writeText(text);
                        alert('Daftar warga belum bayar berhasil disalin ke clipboard!');
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-100 transition-all"
                    >
                      <Mail size={16} /> Salin Daftar Belum Bayar
                    </button>
                    <button 
                      onClick={() => {
                        const csv = [
                          ['Tanggal', 'Nama', 'Rumah', 'Jenis', 'Nominal'].join(','),
                          ...currentMonthPayments.map(p => [
                            new Date(p.date).toLocaleDateString('id-ID'),
                            p.headOfFamily,
                            `${p.block}-${p.number}`,
                            p.type,
                            p.amount
                          ].join(','))
                        ].join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Laporan_Iuran_${selectedMonth.replace(/\s+/g, '_')}.csv`;
                        a.click();
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                    >
                      <Download size={16} /> Ekspor Laporan
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="p-3 md:p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Tanggal</th>
                        <th className="p-3 md:p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Nama Warga</th>
                        <th className="p-3 md:p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Rumah</th>
                        <th className="p-3 md:p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px] hidden sm:table-cell">Jenis Iuran</th>
                        <th className="p-3 md:p-4 text-right font-black text-slate-600 uppercase tracking-widest text-[10px]">Nominal</th>
                        <th className="p-3 md:p-4 text-center font-black text-slate-600 uppercase tracking-widest text-[10px]">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentMonthPayments.length > 0 ? (
                        currentMonthPayments.map((payment) => (
                          <tr key={payment.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                            <td className="p-3 md:p-4 text-slate-500 font-medium text-xs md:text-sm">{new Date(payment.date).toLocaleDateString('id-ID')}</td>
                            <td className="p-3 md:p-4 font-bold text-slate-800 text-xs md:text-sm">{payment.headOfFamily}</td>
                            <td className="p-3 md:p-4 font-mono font-black text-slate-600 text-xs md:text-sm">{payment.block}-{payment.number}</td>
                            <td className="p-3 md:p-4 hidden sm:table-cell">
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                payment.type === 'Both' ? 'bg-indigo-50 text-indigo-600' :
                                payment.type === 'Air' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                {payment.type === 'Both' ? 'Air & Sampah' : payment.type === 'Air' ? 'Air Saja' : 'Sampah Saja'}
                              </span>
                            </td>
                            <td className="p-3 md:p-4 text-right font-black text-slate-800 text-xs md:text-sm">Rp {payment.amount.toLocaleString()}</td>
                            <td className="p-3 md:p-4 text-center">
                              <div className="flex items-center justify-center gap-1 md:gap-2">
                                <button 
                                  onClick={() => generateIuranReceiptPDF(payment, pdfConfig)}
                                  className="p-1.5 md:p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                  title="Cetak Kwitansi"
                                >
                                  <Printer size={14} />
                                </button>
                                <button 
                                  onClick={() => {
                                    setEditingPayment(payment);
                                    setPayType(payment.type);
                                    setPayAmount(payment.amount.toString());
                                    setPayDate(new Date(payment.date).toISOString().split('T')[0]);
                                    setIsEditPaymentModalOpen(true);
                                  }}
                                  className="p-1.5 md:p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                                  title="Edit Catatan"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button 
                                  onClick={async () => {
                                    if(window.confirm('Hapus catatan pembayaran ini?')) {
                                      await deleteIuranPaymentFromDb(payment.id);
                                    }
                                  }}
                                  className="p-1.5 md:p-2 text-slate-300 hover:text-rose-600 transition-colors"
                                  title="Hapus Catatan"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr key="no-payments">
                          <td colSpan={6} className="p-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                                <DollarSign size={32} />
                              </div>
                              <p className="text-slate-400 font-bold italic">Belum ada catatan pembayaran iuran untuk periode {selectedMonth}.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
        ) : viewMode === 'registrations' ? (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="mb-8">
              <h3 className="text-xl font-black text-slate-800">Permohonan Warga Baru</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                {residentRegistrations.filter(r => r.approvalStatus === 'Pending').length} Menunggu Persetujuan
              </p>
            </div>

            <div className="space-y-4">
              {residentRegistrations.length > 0 ? (
                residentRegistrations.map((reg) => (
                  <div key={reg.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                        <User size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-800">{reg.headOfFamily}</h4>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            reg.approvalStatus === 'Pending' ? 'bg-amber-100 text-amber-600' :
                            reg.approvalStatus === 'Approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                          }`}>
                            {reg.approvalStatus}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 mt-1">
                          Blok {reg.block} No. {reg.number} • {reg.residenceType} • {reg.occupants} Jiwa
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(reg.date).toLocaleString('id-ID')}</p>
                        <div className="flex gap-2 mt-2">
                          {reg.ktpUrl && (
                            <a href={reg.ktpUrl} target="_blank" rel="noreferrer" className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all">Lihat KTP</a>
                          )}
                          {reg.kkUrl && (
                            <a href={reg.kkUrl} target="_blank" rel="noreferrer" className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">Lihat KK</a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <a 
                        href={`https://wa.me/${reg.phone.replace(/^0/, '62')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Phone size={14} /> Hubungi
                      </a>
                      
                      {reg.approvalStatus === 'Pending' && (
                        <>
                          <button 
                            onClick={async () => {
                              if(window.confirm('Tolak pendaftaran ini?')) {
                                await updateResidentRegistrationInDb(reg.id, { approvalStatus: 'Rejected' });
                              }
                            }}
                            className="flex-1 md:flex-none px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs hover:bg-rose-100 transition-all"
                          >
                            Tolak
                          </button>
                          <button 
                            onClick={async () => {
                              if(window.confirm('Setujui pendaftaran ini? Data akan otomatis masuk ke daftar warga.')) {
                                try {
                                  // 1. Add to houses
                                  await addHouse({
                                    headOfFamily: reg.headOfFamily,
                                    gender: reg.gender,
                                    birthDate: reg.birthDate,
                                    ownerName: reg.ownerName || reg.headOfFamily,
                                    block: reg.block,
                                    number: reg.number,
                                    phone: reg.phone,
                                    status: reg.status,
                                    residenceType: reg.residenceType,
                                    occupants: reg.occupants,
                                    education: reg.education,
                                    jobCategory: reg.jobCategory,
                                    vehicleCount: reg.vehicleCount,
                                    pregnantCount: reg.pregnantCount,
                                    babyCount: reg.babyCount,
                                    toddlerCount: reg.toddlerCount,
                                    teenagerCount: reg.teenagerCount,
                                    adultCount: reg.adultCount,
                                    elderlyCount: reg.elderlyCount,
                                    widowCount: reg.widowCount,
                                    ktpUrl: reg.ktpUrl,
                                    kkUrl: reg.kkUrl,
                                    familyMembers: reg.familyMembers || [],
                                    paymentStatusAir: PaymentStatus.PENDING,
                                    paymentStatusSampah: PaymentStatus.PENDING,
                                    isVerified: true
                                  });
                                  
                                  // 2. Update registration status
                                  await updateResidentRegistrationInDb(reg.id, { approvalStatus: 'Approved' });
                                  
                                  alert('Pendaftaran disetujui dan data warga telah ditambahkan!');
                                } catch (error) {
                                  console.error(error);
                                  alert('Gagal menyetujui pendaftaran.');
                                }
                              }
                            }}
                            className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                          >
                            Setujui
                          </button>
                        </>
                      )}

                      {reg.approvalStatus !== 'Pending' && (
                        <button 
                          onClick={async () => {
                            if(window.confirm('Hapus riwayat pendaftaran ini?')) {
                              await deleteResidentRegistrationFromDb(reg.id);
                            }
                          }}
                          className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div key="no-registrations" className="py-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus size={32} />
                  </div>
                  <p className="text-slate-400 font-bold italic">Belum ada permohonan pendaftaran warga baru.</p>
                </div>
              )}
            </div>
          </div>
        ) : viewMode === 'table' ? (
          <div className="space-y-8">
            {Object.entries(filteredHouses.reduce((acc, house) => {
              if (!acc[house.block]) acc[house.block] = [];
              acc[house.block].push(house);
              return acc;
            }, {} as Record<string, typeof filteredHouses>)).sort(([a], [b]) => a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'})).map(([block, houses]) => (
          <div key={block} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm min-w-[1000px]">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="p-4 w-10"><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size === filteredHouses.length && filteredHouses.length > 0} /></th>
                    <th className="p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Nama</th>
                    <th className="p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">No</th>
                    <th className="p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Telepon</th>
                    <th className="p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Jiwa</th>
                    <th className="p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Status</th>
                    <th className="p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Sampah</th>
                    <th className="p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Air</th>
                    <th className="p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Tunggakan</th>
                    <th className="p-4 text-right font-black text-slate-600 uppercase tracking-widest text-[10px]">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {houses.map((house) => {
                    const statusSampah = getPaymentStatus(house, 'Sampah');
                    const statusAir = getPaymentStatus(house, 'Air');
                    const arrears = getArrearsForHouse(house);

                    return (
                      <tr key={house.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="p-4"><input type="checkbox" checked={selectedIds.has(house.id)} onChange={() => handleSelectOne(house.id)} /></td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{house.headOfFamily}</div>
                          {house.ownerName && house.ownerName !== house.headOfFamily && (
                            <div className="text-[10px] text-slate-400 font-medium italic">Pemilik: {house.ownerName}</div>
                          )}
                        </td>
                        <td className="p-4 font-mono font-black text-slate-600">{house.number}</td>
                        <td className="p-4 text-slate-500">{house.phone || '-'}</td>
                        <td className="p-4 text-slate-500">{house.occupants || 0}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            house.status === 'Occupied' ? 'bg-emerald-50 text-emerald-600' : 
                            house.status === 'Empty' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {house.status === 'Occupied' ? 'Dihuni' : house.status === 'Empty' ? 'Kosong' : 'Usaha'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            statusSampah === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {statusSampah === PaymentStatus.PAID ? <CheckCircle size={10}/> : <XCircle size={10}/>}
                            {statusSampah === PaymentStatus.PAID ? 'Lunas' : 'Belum'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            statusAir === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {statusAir === PaymentStatus.PAID ? <CheckCircle size={10}/> : <XCircle size={10}/>}
                            {statusAir === PaymentStatus.PAID ? 'Lunas' : 'Belum'}
                          </span>
                        </td>
                        <td className="p-4">
                          {arrears.length > 0 ? (
                            <span className="text-rose-600 font-black text-[10px]">{arrears.length} Bln</span>
                          ) : (
                            <span className="text-emerald-600 font-black text-[10px]">Nihil</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openDetail(house)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><ChevronRight size={16}/></button>
                            <button onClick={() => handleOpenEdit(house)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"><Edit2 size={16}/></button>
                            <button onClick={() => handleDelete(house.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={16}/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
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
        {isDrawerOpen && selectedResident && (
          <div key="drawer-overlay" className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setIsDrawerOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto custom-scrollbar"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Detail Warga</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Informasi Lengkap Keluarga</p>
                  </div>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-3 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-2xl transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Profile Header */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 text-center mb-10 text-white relative overflow-hidden shadow-xl shadow-indigo-600/20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="relative z-10">
                    <div className="w-28 h-28 mx-auto bg-white/20 backdrop-blur-md text-white rounded-[2rem] flex items-center justify-center text-4xl font-black mb-6 border-4 border-white/30 shadow-2xl">
                      {selectedResident.headOfFamily.charAt(0)}
                    </div>
                    <h2 className="text-3xl font-black mb-2">{selectedResident.headOfFamily}</h2>
                    <p className="text-indigo-100/80 font-bold uppercase tracking-widest text-[10px]">Kepala Keluarga</p>
                    
                    {selectedResident.ownerName && selectedResident.ownerName !== selectedResident.headOfFamily && (
                      <div className="mt-2 px-3 py-1 bg-white/10 rounded-lg inline-block">
                        <p className="text-[10px] font-bold text-white/90 uppercase tracking-widest">Pemilik: {selectedResident.ownerName}</p>
                      </div>
                    )}

                    <div className="flex justify-center gap-3 mt-8">
                      <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-xs font-black uppercase tracking-widest">
                        Blok {selectedResident.block}-{selectedResident.number}
                      </div>
                      <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-xs font-black uppercase tracking-widest">
                        {selectedResident.status === 'Occupied' ? 'Dihuni' : selectedResident.status === 'Empty' ? 'Kosong' : 'Usaha'}
                      </div>
                      {selectedResident.status === 'Occupied' && (
                        <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-xs font-black uppercase tracking-widest">
                          {selectedResident.residenceType === 'Kontrak' ? 'Kontrak' : selectedResident.residenceType === 'Kost' ? 'Kost' : 'Pemilik'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Sections */}
                <div className="grid grid-cols-1 gap-8">
                  <section>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Informasi Kontak</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-3xl group hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                        <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                          <Phone size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Telepon / WA</p>
                          <p className="text-base font-bold text-slate-800">{selectedResident.phone || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-3xl group hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                        <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Alamat</p>
                          <p className="text-base font-bold text-slate-800">Blok {selectedResident.block} No. {selectedResident.number}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {(selectedResident.ktpUrl || selectedResident.kkUrl) && (
                    <section>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Dokumen Kependudukan</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedResident.ktpUrl && (
                          <a 
                            href={selectedResident.ktpUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-3xl hover:bg-indigo-100 transition-all group"
                          >
                            <div className="p-2 bg-white text-indigo-600 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                              <FileText size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-indigo-900">Foto KTP</p>
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Lihat Dokumen</p>
                            </div>
                          </a>
                        )}
                        {selectedResident.kkUrl && (
                          <a 
                            href={selectedResident.kkUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-3xl hover:bg-emerald-100 transition-all group"
                          >
                            <div className="p-2 bg-white text-emerald-600 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                              <FileText size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-emerald-900">Foto KK</p>
                              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Lihat Dokumen</p>
                            </div>
                          </a>
                        )}
                      </div>
                    </section>
                  )}

                  <section>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Status Keuangan</h4>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                      <div className={`absolute top-0 right-0 w-2 h-full ${isFullyPaid ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <CreditCard size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">Iuran Bulanan</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Otomatis</p>
                          </div>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          isFullyPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {isFullyPaid ? PaymentStatus.PAID : PaymentStatus.PENDING}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openPayModal(selectedResident)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                        >
                          <DollarSign size={16} /> Bayar Iuran
                        </button>
                        <button 
                          onClick={() => { setIsDrawerOpen(false); setSelectedHouseForBills(selectedResident); }}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                        >
                          <LayoutList size={16} /> Riwayat
                        </button>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Demografi & Kerentanan</h4>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Jenis Kelamin</p>
                        <p className="text-sm font-bold text-slate-800">{selectedResident.gender || '-'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tanggal Lahir</p>
                        <p className="text-sm font-bold text-slate-800">{selectedResident.birthDate ? new Date(selectedResident.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pendidikan</p>
                        <p className="text-sm font-bold text-slate-800">{selectedResident.education || '-'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pekerjaan</p>
                        <p className="text-sm font-bold text-slate-800">{selectedResident.jobCategory || '-'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Kendaraan</p>
                        <p className="text-sm font-bold text-slate-800">{selectedResident.vehicleCount || 0} Unit</p>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Penghuni</p>
                        <p className="text-sm font-bold text-slate-800">{selectedResident.occupants || 0} Orang</p>
                      </div>
                    </div>
                    
                    {((selectedResident.pregnantCount || 0) > 0 || (selectedResident.babyCount || 0) > 0 || (selectedResident.toddlerCount || 0) > 0 || (selectedResident.childCount || 0) > 0 || (selectedResident.teenagerCount || 0) > 0 || (selectedResident.adultCount || 0) > 0 || (selectedResident.elderlyCount || 0) > 0 || (selectedResident.widowCount || 0) > 0) && (
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-3xl">
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none mb-3">Kelompok Rentan</p>
                        <div className="flex flex-wrap gap-2">
                          {(selectedResident.pregnantCount || 0) > 0 && <span className="px-3 py-1 bg-white text-rose-600 rounded-full text-xs font-bold shadow-sm">{selectedResident.pregnantCount} Ibu Hamil</span>}
                          {(selectedResident.babyCount || 0) > 0 && <span className="px-3 py-1 bg-white text-cyan-600 rounded-full text-xs font-bold shadow-sm">{selectedResident.babyCount} Bayi</span>}
                          {(selectedResident.toddlerCount || 0) > 0 && <span className="px-3 py-1 bg-white text-orange-600 rounded-full text-xs font-bold shadow-sm">{selectedResident.toddlerCount} Balita</span>}
                          {(selectedResident.childCount || 0) > 0 && <span className="px-3 py-1 bg-white text-blue-600 rounded-full text-xs font-bold shadow-sm">{selectedResident.childCount} Anak</span>}
                          {(selectedResident.teenagerCount || 0) > 0 && <span className="px-3 py-1 bg-white text-indigo-600 rounded-full text-xs font-bold shadow-sm">{selectedResident.teenagerCount} Remaja</span>}
                          {(selectedResident.adultCount || 0) > 0 && <span className="px-3 py-1 bg-white text-emerald-600 rounded-full text-xs font-bold shadow-sm">{selectedResident.adultCount} Dewasa</span>}
                          {(selectedResident.elderlyCount || 0) > 0 && <span className="px-3 py-1 bg-white text-purple-600 rounded-full text-xs font-bold shadow-sm">{selectedResident.elderlyCount} Lansia</span>}
                          {(selectedResident.widowCount || 0) > 0 && <span className="px-3 py-1 bg-white text-slate-600 rounded-full text-xs font-bold shadow-sm">{selectedResident.widowCount} Janda</span>}
                        </div>
                      </div>
                    )}

                    {(selectedResident.isPKH || selectedResident.isBLT || selectedResident.isBansosLain) && (
                      <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">Penerima Bantuan Sosial</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedResident.isPKH && <span className="px-3 py-1 bg-white text-indigo-600 rounded-full text-xs font-bold shadow-sm">PKH</span>}
                          {selectedResident.isBLT && <span className="px-3 py-1 bg-white text-indigo-600 rounded-full text-xs font-bold shadow-sm">BLT</span>}
                          {selectedResident.isBansosLain && (
                            <span className="px-3 py-1 bg-white text-indigo-600 rounded-full text-xs font-bold shadow-sm">
                              {selectedResident.bansosLainName || 'Bansos Lainnya'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </section>

                  <section>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Anggota Keluarga</h4>
                    {selectedResident.familyMembers && selectedResident.familyMembers.length > 0 ? (
                      <div className="space-y-3">
                        {selectedResident.familyMembers.map((member, idx) => (
                          <div key={member.id || idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                              <p className="font-bold text-slate-800">{member.name}</p>
                              <p className="text-xs text-slate-500">{member.relation} • {member.birthDate ? new Date(member.birthDate).toLocaleDateString('id-ID') : '-'}</p>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded border border-slate-200">
                              {member.nik || 'No NIK'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-50/50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                          <Users size={32} />
                        </div>
                        <p className="text-sm font-bold text-slate-400">Belum ada data anggota keluarga</p>
                        <button onClick={() => { setIsDrawerOpen(false); handleOpenEdit(selectedResident); }} className="mt-4 text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Tambah Anggota</button>
                      </div>
                    )}
                  </section>
                </div>

                {/* Actions Footer */}
                <div className="mt-12 pt-8 border-t border-slate-100 flex gap-4">
                  <button 
                    onClick={() => { setIsDrawerOpen(false); handleOpenEdit(selectedResident); }}
                    className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all shadow-sm"
                  >
                    Edit Data
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedResident.id)}
                    className="flex-1 py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-black text-sm hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                  >
                    Hapus Warga
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal (Tabbed Interface) */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingHouseId ? "Edit Data Warga" : "Tambah Warga Baru"} maxWidth="max-w-7xl">
        <form onSubmit={handleSaveHouse} className="space-y-8">
          {/* Tab Navigation */}
          <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200">
            <button 
              type="button"
              onClick={() => setActiveFormTab('basic')}
              className={`flex-1 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeFormTab === 'basic' ? 'bg-white text-indigo-600 shadow-md shadow-indigo-500/10' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <div className={`p-1.5 rounded-lg ${activeFormTab === 'basic' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                <Home size={14} />
              </div>
              1. Informasi Dasar
            </button>
            <button 
              type="button"
              onClick={() => setActiveFormTab('demographics')}
              className={`flex-1 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeFormTab === 'demographics' ? 'bg-white text-indigo-600 shadow-md shadow-indigo-500/10' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <div className={`p-1.5 rounded-lg ${activeFormTab === 'demographics' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                <Activity size={14} />
              </div>
              2. Demografi & Bantuan
            </button>
            <button 
              type="button"
              onClick={() => setActiveFormTab('family')}
              className={`flex-1 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeFormTab === 'family' ? 'bg-white text-indigo-600 shadow-md shadow-indigo-500/10' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <div className={`p-1.5 rounded-lg ${activeFormTab === 'family' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                <Users size={14} />
              </div>
              3. Anggota Keluarga
            </button>
          </div>
          <div className="min-h-[500px]">
            <AnimatePresence mode="wait">
              {activeFormTab === 'basic' && (
                <motion.div 
                  key="basic"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-10"
                >
                  {/* Section 1: Informasi Utama */}
                  <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-3 border-b border-indigo-100 pb-4">
                      <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                        <User size={18} />
                      </div>
                      Informasi Utama
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Kepala Keluarga (Penghuni)</label>
                        <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.headOfFamily} onChange={e => setFormData({...formData, headOfFamily: e.target.value})} required placeholder="Nama Lengkap..." />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Jenis Kelamin</label>
                        <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})}>
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Tanggal Lahir</label>
                        <input type="date" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Nama Pemilik Rumah</label>
                        <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} placeholder="Nama Pemilik (Kosongkan jika sama dengan KK)" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Blok</label>
                        <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.block} onChange={e => setFormData({...formData, block: e.target.value})} required placeholder="A" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Nomor</label>
                        <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} required placeholder="12" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-10">
                    {/* Section 2: Status & Kepemilikan */}
                    <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                      <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-3 border-b border-indigo-100 pb-4">
                        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                          <Home size={18} />
                        </div>
                        Status & Kepemilikan
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Status Hunian</label>
                          <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                            <option value="Occupied">Dihuni</option>
                            <option value="Empty">Kosong</option>
                            <option value="Business">Usaha</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Status Kepemilikan</label>
                          <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.residenceType} onChange={e => setFormData({...formData, residenceType: e.target.value as any})}>
                            <option value="Tetap">Pemilik (Tetap)</option>
                            <option value="Kontrak">Kontrak</option>
                            <option value="Kost">Kost</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Jumlah Penghuni (Total Jiwa)</label>
                          <input type="number" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.occupants} onChange={e => setFormData({...formData, occupants: parseInt(e.target.value) || 0})} min={1} />
                        </div>
                      </div>
                    </div>

                    {/* Section: Kontak & Keamanan */}
                    <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                      <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-3 border-b border-indigo-100 pb-4">
                        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                          <Phone size={18} />
                        </div>
                        Kontak & Keamanan
                      </h3>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Telepon / WA</label>
                          <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="08..." />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">PIN Akses (Access Code)</label>
                          <div className="flex gap-3">
                            <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.accessCode} onChange={e => setFormData({...formData, accessCode: e.target.value})} placeholder="Masukkan PIN..." />
                            <button 
                              type="button"
                              onClick={() => setFormData({...formData, accessCode: Math.floor(100000 + Math.random() * 900000).toString()})}
                              className="px-6 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 whitespace-nowrap"
                            >
                              Generate
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeFormTab === 'demographics' && (
                <motion.div 
                  key="demographics"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Section 3: Data Demografi */}
                    <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                      <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-3 border-b border-indigo-100 pb-4">
                        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                          <Activity size={18} />
                        </div>
                        Demografi & Pekerjaan
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Pendidikan Terakhir</label>
                          <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})}>
                            <option value="">Pilih...</option>
                            <option value="SD">SD</option>
                            <option value="SMP">SMP</option>
                            <option value="SMA/SMK">SMA/SMK</option>
                            <option value="D3">D3</option>
                            <option value="S1">S1</option>
                            <option value="S2">S2</option>
                            <option value="S3">S3</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Kategori Pekerjaan</label>
                          <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.jobCategory} onChange={e => setFormData({...formData, jobCategory: e.target.value})}>
                            <option value="">Pilih...</option>
                            <option value="PNS">PNS / TNI / Polri</option>
                            <option value="Pegawai Swasta">Pegawai Swasta</option>
                            <option value="Wiraswasta">Wiraswasta / Pengusaha</option>
                            <option value="Freelance">Pekerja Lepas / Freelance</option>
                            <option value="Pensiunan">Pensiunan</option>
                            <option value="Tidak Bekerja">Tidak / Belum Bekerja</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Jumlah Kendaraan</label>
                          <input type="number" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.vehicleCount} onChange={e => setFormData({...formData, vehicleCount: parseInt(e.target.value) || 0})} min={0} />
                        </div>
                      </div>
                    </div>

                    {/* Section: Bantuan Sosial */}
                    <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                      <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-3 border-b border-indigo-100 pb-4">
                        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                          <DollarSign size={18} />
                        </div>
                        Bantuan Sosial
                      </h3>
                      <div className="space-y-4">
                        <label className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:bg-indigo-50 transition-all group">
                          <input 
                            type="checkbox" 
                            className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            checked={formData.isPKH}
                            onChange={e => setFormData({...formData, isPKH: e.target.checked})}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-700 group-hover:text-indigo-600">Program Keluarga Harapan (PKH)</span>
                            <span className="text-[10px] text-slate-400 font-bold">Bantuan sosial bersyarat untuk keluarga miskin</span>
                          </div>
                        </label>
                        <label className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:bg-indigo-50 transition-all group">
                          <input 
                            type="checkbox" 
                            className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            checked={formData.isBLT}
                            onChange={e => setFormData({...formData, isBLT: e.target.checked})}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-700 group-hover:text-indigo-600">Bantuan Langsung Tunai (BLT)</span>
                            <span className="text-[10px] text-slate-400 font-bold">Bantuan tunai langsung dari pemerintah</span>
                          </div>
                        </label>
                        <div className="space-y-4">
                          <label className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:bg-indigo-50 transition-all group">
                            <input 
                              type="checkbox" 
                              className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              checked={formData.isBansosLain}
                              onChange={e => setFormData({...formData, isBansosLain: e.target.checked})}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-700 group-hover:text-indigo-600">Bantuan Lainnya</span>
                              <span className="text-[10px] text-slate-400 font-bold">Sebutkan jenis bantuan sosial lainnya</span>
                            </div>
                          </label>
                          {formData.isBansosLain && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <input 
                                placeholder="Sebutkan jenis bantuan..."
                                className="w-full p-4 bg-white border border-indigo-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                                value={formData.bansosLainName}
                                onChange={e => setFormData({...formData, bansosLainName: e.target.value})}
                              />
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section: Kelompok Rentan */}
                  <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-3 border-b border-indigo-100 pb-4 mb-8">
                      <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                        <Users size={18} />
                      </div>
                      Rincian Kelompok Rentan
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6">
                      {[
                        { label: 'Hamil', key: 'pregnantCount' },
                        { label: 'Bayi', key: 'babyCount' },
                        { label: 'Balita', key: 'toddlerCount' },
                        { label: 'Anak', key: 'childCount' },
                        { label: 'Remaja', key: 'teenagerCount' },
                        { label: 'Dewasa', key: 'adultCount' },
                        { label: 'Lansia', key: 'elderlyCount' },
                        { label: 'Janda', key: 'widowCount' },
                      ].map((item) => (
                        <div key={item.key} className="space-y-3">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">{item.label}</label>
                          <input 
                            type="number" 
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-black text-center focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" 
                            value={formData[item.key as keyof typeof formData] as number} 
                            onChange={e => setFormData({...formData, [item.key]: parseInt(e.target.value) || 0})} 
                            min={0} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeFormTab === 'family' && (
                <motion.div 
                  key="family"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/20">
                        <Users size={24} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Daftar Anggota Keluarga</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{formData.familyMembers.length} Orang Terdaftar</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setFormData({
                        ...formData, 
                        familyMembers: [...formData.familyMembers, { id: Math.random().toString(36).substr(2, 9), name: '', relation: 'Anak', nik: '', birthDate: '', gender: 'Laki-laki' }]
                      })}
                      className="text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-3 px-8 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 uppercase tracking-widest active:scale-95"
                    >
                      <UserPlus size={18} /> Tambah Anggota
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {formData.familyMembers.map((member, idx) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={member.id || idx} 
                        className="p-8 bg-white rounded-[2.5rem] border border-slate-200 space-y-6 relative group transition-all hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-500/10"
                      >
                        <button 
                          type="button"
                          onClick={() => {
                            const newMembers = [...formData.familyMembers];
                            newMembers.splice(idx, 1);
                            setFormData({...formData, familyMembers: newMembers});
                          }}
                          className="absolute top-6 right-6 text-slate-300 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 rounded-xl"
                        >
                          <X size={20} />
                        </button>
                        
                        <div className="space-y-5">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Lengkap</label>
                            <input 
                              placeholder="Nama Lengkap" 
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                              value={member.name}
                              onChange={e => {
                                const newMembers = [...formData.familyMembers];
                                newMembers[idx].name = e.target.value;
                                setFormData({...formData, familyMembers: newMembers});
                              }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Jenis Kelamin</label>
                              <select 
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                value={member.gender || 'Laki-laki'}
                                onChange={e => {
                                  const newMembers = [...formData.familyMembers];
                                  newMembers[idx].gender = e.target.value as any;
                                  setFormData({...formData, familyMembers: newMembers});
                                }}
                              >
                                <option value="Laki-laki">Laki-laki</option>
                                <option value="Perempuan">Perempuan</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hubungan</label>
                              <select 
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                value={member.relation}
                                onChange={e => {
                                  const newMembers = [...formData.familyMembers];
                                  newMembers[idx].relation = e.target.value as any;
                                  setFormData({...formData, familyMembers: newMembers});
                                }}
                              >
                                <option value="Istri">Istri</option>
                                <option value="Anak">Anak</option>
                                <option value="Orang Tua">Orang Tua</option>
                                <option value="Famili Lain">Famili Lain</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">NIK</label>
                              <input 
                                placeholder="NIK" 
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                value={member.nik || ''}
                                onChange={e => {
                                  const newMembers = [...formData.familyMembers];
                                  newMembers[idx].nik = e.target.value;
                                  setFormData({...formData, familyMembers: newMembers});
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tgl Lahir</label>
                              <input 
                                type="date"
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                value={member.birthDate || ''}
                                onChange={e => {
                                  const newMembers = [...formData.familyMembers];
                                  newMembers[idx].birthDate = e.target.value;
                                  setFormData({...formData, familyMembers: newMembers});
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {formData.familyMembers.length === 0 && (
                      <div className="md:col-span-2 xl:col-span-3 text-center p-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[3rem]">
                        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto mb-8 shadow-sm">
                          <Users size={48} />
                        </div>
                        <h4 className="text-lg font-black text-slate-400 uppercase tracking-widest">Belum Ada Anggota</h4>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Klik tombol di atas untuk menambahkan anggota keluarga</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="pt-10 border-t border-slate-100 flex justify-between items-center">
            <div className="flex gap-4">
              {activeFormTab !== 'basic' && (
                <button 
                  type="button"
                  onClick={() => {
                    if (activeFormTab === 'demographics') setActiveFormTab('basic');
                    if (activeFormTab === 'family') setActiveFormTab('demographics');
                  }}
                  className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Kembali
                </button>
              )}
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-8 py-4 text-xs font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest"
              >
                Batal
              </button>
            </div>

            <div className="flex gap-4">
              {activeFormTab !== 'family' ? (
                <button 
                  type="button"
                  onClick={() => {
                    if (activeFormTab === 'basic') setActiveFormTab('demographics');
                    if (activeFormTab === 'demographics') setActiveFormTab('family');
                  }}
                  className="px-10 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-3"
                >
                  Lanjut <ChevronRight size={16} />
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="px-16 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3"
                >
                  <CheckCircle size={20} /> {editingHouseId ? 'Simpan Perubahan' : 'Simpan Data'}
                </button>
              )}
            </div>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};
