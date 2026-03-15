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
import { batchUpdateHouses, deleteHouseFromDb, updateHouseData, addHouse, generateAllAccessCodes, addTransactionToDb, addIuranPaymentToDb, deleteIuranPaymentFromDb, updateResidentRegistrationInDb, deleteResidentRegistrationFromDb, updateIuranPaymentInDb, formatHouseId, addBillToDb, updateBillInDb } from '../../services/databaseService';
import { generateExcelTemplate, parseExcelFile, generateProfessionalExcel } from '../../services/excelService';
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
  const { 
    selectedMonth, 
    setSelectedMonth, 
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
    religion: '',
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
      religion: '',
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
      religion: house.religion || '',
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
            onClose={() => setIsPayModalOpen(false)}
            payHouse={payHouse}
            payType={payType}
            setPayType={setPayType}
            payAmount={payAmount}
            setPayAmount={setPayAmount}
            payDate={payDate}
            setPayDate={setPayDate}
            handleSavePayment={handleSavePayment}
            getIndonesianMonthYear={getIndonesianMonthYear}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditPaymentModalOpen && editingPayment && (
          <EditPaymentModal 
            isOpen={isEditPaymentModalOpen}
            onClose={() => setIsEditPaymentModalOpen(false)}
            editingPayment={editingPayment}
            payType={payType}
            setPayType={setPayType}
            payAmount={payAmount}
            setPayAmount={setPayAmount}
            payDate={payDate}
            setPayDate={setPayDate}
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
            openDetail={openDetail}
            handleOpenEdit={handleOpenEdit}
            handleDelete={handleDelete}
            setSelectedHouseForBills={setSelectedHouseForBills}
            openPayModal={openPayModal}
          />
        ) : viewMode === 'iuran' ? (
          <ResidentIuranManager 
            houses={houses}
            generateIuranReceiptPDF={generateIuranReceiptPDF}
            pdfConfig={pdfConfig}
            deleteIuranPaymentFromDb={deleteIuranPaymentFromDb}
            setEditingPayment={setEditingPayment}
            setPayType={setPayType}
            setPayAmount={setPayAmount}
            setPayDate={setPayDate}
            setIsEditPaymentModalOpen={setIsEditPaymentModalOpen}
          />
        ) : viewMode === 'registrations' ? (
          <ResidentRegistrationList 
            residentRegistrations={residentRegistrations}
            updateResidentRegistrationInDb={updateResidentRegistrationInDb}
            addHouse={addHouse}
          />
        ) : viewMode === 'table' ? (
          <ResidentTableView 
            filteredHouses={filteredHouses}
            selectedIds={selectedIds}
            handleSelectAll={handleSelectAll}
            handleSelectOne={handleSelectOne}
            openDetail={openDetail}
            handleOpenEdit={handleOpenEdit}
            handleDelete={handleDelete}
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
