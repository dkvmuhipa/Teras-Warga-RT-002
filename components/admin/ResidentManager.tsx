import React, { useState, useEffect, useMemo } from 'react';
import { 
  getIndonesianMonthYear, 
  generateMonthOptions, 
  isMonthMatch,
  calculateAge
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
import { PopulationReportManager } from './PopulationReportManager';
import { UpdateRequestManager } from './UpdateRequestManager';
import { GuestManager } from './GuestManager';
import { HealthManagement } from './HealthManagement';
import { OfficialManagement } from './OfficialManagement';
import { 
  Search, Filter, Grid, List, UserPlus, Download, Upload, 
  Trash2, Edit2, MoreHorizontal, CheckCircle, XCircle, AlertCircle, Droplets, Trash,
  Users, Home, X, Phone, Shield, Calendar, MapPin, Activity,
  ChevronRight, CreditCard, Mail, User, DollarSign, LayoutList, FileText, Printer,
  PieChart as PieChartIcon, ChevronDown, Settings, MoreVertical, FileClock, FileEdit,
  ShieldAlert, Briefcase
} from 'lucide-react';
import { House, Report, Official, CashFlow, PdfConfig, PaymentStatus, ResidentRegistration, Bill, Role } from '../../types';
import { HouseMap } from '../HouseMap';
import { 
  generateResidentReportPDF, 
  generateIuranReceiptPDF,
  generatePBBReportPDF,
  generateResidentStatsReportPDF,
  generateBillReportPDF
} from '../../services/pdfService';
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
  addPopulationReportToDb,
  updatePopulationReportToDb,
  deletePopulationReportFromDb,
  markPopulationLogsAsGenerated,
  unmarkPopulationLogsAsGenerated,
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
  populationReports: any[];
  setPopulationReports: (reports: any[]) => void;
  populationLogs: any[];
  setPopulationLogs: (logs: any[]) => void;
  updateRequests: any[];
  initialViewMode?: 'grid' | 'table' | 'map' | 'iuran' | 'registrations' | 'analytics' | 'mutations' | 'requests' | 'health' | 'guests' | 'officials';
}

type FilterStatus = 'all' | 'paid' | 'unpaid' | 'occupied' | 'empty' | 'business';

export const ResidentManager: React.FC<ResidentManagerProps> = ({ 
  role,
  houses, reports, cashFlow, officials, pdfConfig, iuranPayments, bills, residentRegistrations, guestReports, settings,
  populationReports, setPopulationReports, populationLogs, setPopulationLogs, updateRequests,
  initialViewMode = 'grid'
}) => {
  const confirm = useConfirm();
  const prompt = usePrompt();
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'map' | 'iuran' | 'registrations' | 'analytics' | 'mutations' | 'requests' | 'health' | 'guests' | 'officials'>('grid');
  
  useEffect(() => {
    if (initialViewMode) {
      if (initialViewMode as string === 'residents') {
        setViewMode('grid');
      } else {
        setViewMode(initialViewMode as any);
      }
    }
  }, [initialViewMode]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);
  const [selectedHouseForBills, setSelectedHouseForBills] = useState<House | null>(null);
  const [filterStatus, setFilterStatus] = useState<any>('all');
  const [filterResidenceType, setFilterResidenceType] = useState<string>('all');
  const [filterBlock, setFilterBlock] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'block'>('block');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedResident, setSelectedResident] = useState<House | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Excel Import Preview States
  const [isExcelPreviewOpen, setIsExcelPreviewOpen] = useState(false);
  const [excelPreviewData, setExcelPreviewData] = useState<any[]>([]);
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewStats, setPreviewStats] = useState({ add: 0, update: 0, invalid: 0 });
  const [previewFilterTab, setPreviewFilterTab] = useState<'all' | 'add' | 'update' | 'invalid'>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [targetMonths, setTargetMonths] = useState<string[]>([]);
  
  // Custom Export States
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');
  const [exportTarget, setExportTarget] = useState<'all' | 'filtered'>('all');
  const [selectedExportCols, setSelectedExportCols] = useState<string[]>([
    'block', 'number', 'headOfFamily', 'phone', 'status', 'residenceType', 'occupants', 'isVerified'
  ]);
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
    isInitialData: false, 
    pbbStatus: 'Belum Diambil',
    pbbYear: new Date().getFullYear().toString(),
    generateMutationLog: true,
    familyMembers: [] as { id?: string; name: string; relation: 'Suami' | 'Istri' | 'Anak' | 'Menantu' | 'Cucu' | 'Orang Tua' | 'Mertua' | 'Saudara' | 'Keponakan' | 'Kakek/Nenek' | 'Pembantu' | 'Famili Lain'; nik?: string; birthDate?: string; gender?: 'Laki-laki' | 'Perempuan'; job?: string }[],
    useManualDemographics: false,
    accessCode: ''
  });

  // Auto calculate demographics based on family members
  useEffect(() => {
    // Collect all residents to check ages
    const residents = [];
    
    // Add Head of Family
    if (formData.birthDate) {
      residents.push({
        age: calculateAge(formData.birthDate),
        gender: formData.gender,
        maritalStatus: formData.maritalStatus
      });
    }

    // Add Family Members
    formData.familyMembers.forEach(m => {
      if (m.birthDate) {
        residents.push({
          age: calculateAge(m.birthDate),
          gender: m.gender || 'Laki-laki'
        });
      }
    });

    if (formData.useManualDemographics) {
      const manualOccupants = (formData.babyCount || 0) + 
                             (formData.toddlerCount || 0) + 
                             (formData.childCount || 0) + 
                             (formData.teenagerCount || 0) + 
                             (formData.adultCount || 0) + 
                             (formData.elderlyCount || 0);
      
      if (manualOccupants !== formData.occupants) {
        setFormData(prev => ({ ...prev, occupants: manualOccupants }));
      }
      return;
    }

    if (residents.length > 0 || formData.familyMembers.length >= 0) {
      const counts = {
        babyCount: residents.filter(r => r.age < 1).length,
        toddlerCount: residents.filter(r => r.age >= 1 && r.age <= 5).length,
        childCount: residents.filter(r => r.age > 5 && r.age <= 12).length,
        teenagerCount: residents.filter(r => r.age > 12 && r.age <= 18).length,
        adultCount: residents.filter(r => r.age > 18 && r.age <= 55).length,
        elderlyCount: residents.filter(r => r.age > 55).length,
        widowCount: residents.filter(r => r.maritalStatus === 'Janda' || r.maritalStatus === 'Duda').length,
        occupants: 1 + formData.familyMembers.length
      };

      // Check if any count is different from current formData to avoid infinite loop
      const hasChanged = 
        counts.babyCount !== formData.babyCount ||
        counts.toddlerCount !== formData.toddlerCount ||
        counts.childCount !== formData.childCount ||
        counts.teenagerCount !== formData.teenagerCount ||
        counts.adultCount !== formData.adultCount ||
        counts.elderlyCount !== formData.elderlyCount ||
        counts.widowCount !== formData.widowCount ||
        counts.occupants !== formData.occupants;

      if (hasChanged) {
        setFormData(prev => ({
          ...prev,
          ...counts
        }));
      }
    }
  }, [
    formData.birthDate, 
    formData.familyMembers, 
    formData.maritalStatus, 
    formData.useManualDemographics,
    formData.babyCount,
    formData.toddlerCount,
    formData.childCount,
    formData.teenagerCount,
    formData.adultCount,
    formData.elderlyCount
  ]);

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

  const handlePerformExport = async () => {
    setIsGenerating(true);
    const resolvedHouses = exportTarget === 'all' ? houses : filteredHouses;
    try {
      if (exportFormat === 'excel') {
        await generateProfessionalExcel(resolvedHouses, selectedExportCols);
        toast.success(`Berhasil mengunduh Excel berisi ${selectedExportCols.length} kolom untuk ${resolvedHouses.length} warga!`);
      } else {
        await generateResidentReportPDF(resolvedHouses, pdfConfig, selectedExportCols);
        toast.success(`Berhasil mencetak PDF berisi ${selectedExportCols.length} kolom untuk ${resolvedHouses.length} warga!`);
      }
      setIsExportModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengekspor data warga.');
    } finally {
      setIsGenerating(false);
    }
  };

  const FIELD_LABELS: Record<string, string> = {
    headOfFamily: 'Kepala Keluarga',
    status: 'Status Hunian',
    residenceType: 'Kepenghunian',
    occupants: 'Jumlah Jiwa',
    phone: 'Kontak WhatsApp',
    ownerName: 'Nama Pemilik',
    ownerPhone: 'WA Pemilik',
    vehicleCount: 'Jumlah Kendaraan',
    pregnantCount: 'Jumlah Ibu Hamil',
    babyCount: 'Jumlah Bayi (<1 thn)',
    toddlerCount: 'Jumlah Balita (1-5 thn)',
    childCount: 'Jumlah Anak (6-12 thn)',
    teenagerCount: 'Jumlah Remaja (13-18 thn)',
    adultCount: 'Jumlah Dewasa (19-55 thn)',
    elderlyCount: 'Jumlah Lansia (>55 thn)',
    widowCount: 'Jumlah Janda/Duda',
    isBPNT: 'Penerima BPNT',
    isDisability: 'Ada Disabilitas',
    disabilityCount: 'Jumlah Disabilitas',
    isOrphan: 'Ada Anak Yatim/Piatu',
    orphanCount: 'Jumlah Anak Yatim/Piatu',
    economicStatus: 'Status Ekonomi',
    paymentStatusAir: 'Status Bayar Air',
    paymentStatusSampah: 'Status Bayar Sampah',
    education: 'Pendidikan',
    jobCategory: 'Pekerjaan',
    religion: 'Agama',
    gender: 'Jenis Kelamin',
    birthDate: 'Tanggal Lahir'
  };

  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const parsedData = await parseExcelFile(file);
      const previewRows: any[] = [];
      let addCount = 0;
      let updateCount = 0;
      let invalidCount = 0;

      for (const houseData of parsedData) {
        const errors: string[] = [];
        const warnings: string[] = [];
        const changes: { field: string; label: string; from: any; to: any }[] = [];
        let rowStatus: 'add' | 'update' | 'invalid' = 'add';

        // Basic validation
        if (!houseData.block || !houseData.number) {
          errors.push('Informasi Blok & Nomor rumah wajib diisi.');
          rowStatus = 'invalid';
        }

        const block = houseData.block || '';
        const number = houseData.number || '';
        const headOfFamily = houseData.headOfFamily || '-';

        // Find existing house
        let existingHouse: House | undefined = undefined;
        if (block && number) {
          existingHouse = houses.find(
            h => h.block.toLowerCase() === block.toLowerCase() && 
                 h.number.toLowerCase() === number.toLowerCase()
          );
        }

        if (rowStatus !== 'invalid') {
          if (existingHouse) {
            rowStatus = 'update';
            // Compare fields to build proposed changes
            const updates: any = { ...houseData };
            // Don't overwrite headOfFamily if it's empty in Excel
            if (!houseData.headOfFamily || houseData.headOfFamily === '-') {
              delete updates.headOfFamily;
            }

            for (const key in updates) {
              if (key === 'block' || key === 'number') continue;
              const newValue = updates[key];
              const oldValue = (existingHouse as any)[key];

              if (newValue !== undefined && newValue !== oldValue) {
                // If it's a numeric field, skip if basically the same value
                if (typeof oldValue === 'number' && Number(newValue) === oldValue) continue;
                
                changes.push({
                  field: key,
                  label: FIELD_LABELS[key] || key,
                  from: oldValue !== undefined ? oldValue : 'Kosong',
                  to: newValue !== undefined ? newValue : 'Kosong'
                });
              }
            }
          } else {
            rowStatus = 'add';
            // Validation warnings for additions
            if (headOfFamily === '-') {
              warnings.push('Nama kepala keluarga kosong, otomatis diisi "-"');
            }
          }
        }

        if (rowStatus === 'add') addCount++;
        else if (rowStatus === 'update') updateCount++;
        else if (rowStatus === 'invalid') invalidCount++;

        previewRows.push({
          block,
          number,
          headOfFamily,
          status: rowStatus,
          errors,
          warnings,
          changes,
          parsedData: houseData,
          existingHouse
        });
      }

      setExcelPreviewData(previewRows);
      setPreviewStats({ add: addCount, update: updateCount, invalid: invalidCount });
      setPreviewFileName(file.name);
      setPreviewFilterTab('all');
      setIsExcelPreviewOpen(true);
    } catch (error) {
      console.error(error);
      toast.error('Gagal membaca & memparsing file Excel.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsUploading(false);
    }
  };

  const handlePerformImportPreview = async () => {
    setIsUploading(true);
    let addedCount = 0;
    let updatedCount = 0;
    let failCount = 0;

    const updatesToApply: any[] = [];
    const addsToApply: any[] = [];

    // Filter out rows with status = 'invalid'
    const validRows = excelPreviewData.filter(row => row.status !== 'invalid');

    for (const previewItem of validRows) {
      const houseData = previewItem.parsedData;
      try {
        if (previewItem.status === 'update' && previewItem.existingHouse) {
          const updates: any = { ...houseData };
          if (!houseData.headOfFamily || houseData.headOfFamily === '-') {
            delete updates.headOfFamily;
          }

          // Check if there are actual changes
          if (previewItem.changes.length > 0) {
            updatesToApply.push({ id: previewItem.existingHouse.id, ...updates });
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
            occupants: houseData.occupants !== undefined ? houseData.occupants : 1,
            vehicleCount: houseData.vehicleCount !== undefined ? houseData.vehicleCount : 0,
            pregnantCount: houseData.pregnantCount !== undefined ? houseData.pregnantCount : 0,
            babyCount: houseData.babyCount !== undefined ? houseData.babyCount : 0,
            toddlerCount: houseData.toddlerCount !== undefined ? houseData.toddlerCount : 0,
            teenagerCount: houseData.teenagerCount !== undefined ? houseData.teenagerCount : 0,
            adultCount: houseData.adultCount !== undefined ? houseData.adultCount : 0,
            elderlyCount: houseData.elderlyCount !== undefined ? houseData.elderlyCount : 0,
            childCount: houseData.childCount !== undefined ? houseData.childCount : 0,
            widowCount: houseData.widowCount !== undefined ? houseData.widowCount : 0,
            isBPNT: houseData.isBPNT || false,
            isDisability: houseData.isDisability || false,
            disabilityCount: houseData.disabilityCount !== undefined ? houseData.disabilityCount : 0,
            isOrphan: houseData.isOrphan || false,
            orphanCount: houseData.orphanCount !== undefined ? houseData.orphanCount : 0,
            economicStatus: houseData.economicStatus || 'Sejahtera'
          });
        }
      } catch (err) {
        console.error('Error preparing item:', err);
        failCount++;
      }
    }

    try {
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

      await logAction('Import Excel', `Berhasil mengimport data warga (Tambah: ${addedCount}, Update: ${updatedCount})`);
      setIsExcelPreviewOpen(false);
      excelPreviewData.splice(0, excelPreviewData.length);
      setExcelPreviewData([]);
      toast.success(`Import data Excel selesai!`, {
        description: `Warga baru ditambah: ${addedCount} • Data diupdate: ${updatedCount} • Lewat/Format salah: ${failCount}`
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "houses");
      toast.error('Gagal memproses data import Excel.');
    } finally {
      setIsUploading(false);
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

  const handleBulkChangeResidenceType = async (type: 'Tetap' | 'Sewa' | 'Rumah Keluarga') => {
    if (selectedIds.size === 0) return;
    const isConfirmed = await confirm({
      title: 'Ubah Kepenghunian Massal',
      message: `Apakah Anda yakin ingin mengubah status kepenghunian ${selectedIds.size} warga terpilih menjadi "${type}" secara sekaligus?`,
      confirmLabel: 'Ubah Status',
    });
    if (isConfirmed) {
      try {
          const updates = Array.from(selectedIds).map(id => ({ id, residenceType: type }));
          await batchUpdateHouses(updates);
          await logAction('Ubah Kepenghunian Massal', `Ubah status kepenghunian ${selectedIds.size} warga terpilih menjadi ${type}`);
          toast.success(`Status kepenghunian terpilih berhasil diubah menjadi ${type}.`);
          setSelectedIds(new Set());
      } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, "houses");
          toast.error('Gagal mengubah status kepenghunian warga.');
      }
    }
  };

  const handleBulkChangeStatus = async (status: 'Occupied' | 'Empty' | 'Business' | 'Visiting') => {
    if (selectedIds.size === 0) return;
    const label = status === 'Occupied' ? 'Dihuni' : status === 'Empty' ? 'Kosong' : status === 'Business' ? 'Tempat Usaha' : 'Mengunjungi';
    const isConfirmed = await confirm({
      title: 'Ubah Status Hunian Massal',
      message: `Apakah Anda yakin ingin mengubah status hunian ${selectedIds.size} warga terpilih menjadi "${label}" secara sekaligus?`,
      confirmLabel: 'Ubah Status',
    });
    if (isConfirmed) {
      try {
          const updates = Array.from(selectedIds).map(id => ({ id, status }));
          await batchUpdateHouses(updates);
          await logAction('Ubah Status Hunian Massal', `Ubah status hunian ${selectedIds.size} warga terpilih menjadi ${label}`);
          toast.success(`Status hunian terpilih berhasil diubah menjadi ${label}.`);
          setSelectedIds(new Set());
      } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, "houses");
          toast.error('Gagal mengubah status hunian warga.');
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
      isInitialData: false,
      pbbStatus: 'Belum Diambil',
      pbbYear: new Date().getFullYear().toString(),
      generateMutationLog: true,
      familyMembers: [],
      useManualDemographics: false,
      accessCode: ''
    });
    setEditingHouseId(null);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payHouse) return;

    const currentMonths = targetMonths;
    if (currentMonths.length === 0) {
      toast.error('Pilih setidaknya satu bulan untuk pembayaran.');
      return;
    }

    const isConfirmed = await confirm({
      title: 'Konfirmasi Pembayaran',
      message: `Simpan pembayaran iuran untuk ${payHouse.block}-${payHouse.number} senilai total Rp ${parseInt(payAmount).toLocaleString()}?`,
      confirmLabel: 'Simpan',
      cancelLabel: 'Batal'
    });

    if (!isConfirmed) return;

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

      await logAction('Bayar Iuran', `Pembayaran iuran ${payType} untuk ${payHouse.block}-${payHouse.number} senilai total Rp ${totalAmount} (${currentMonths.length} bulan)`);
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
    setPayerName(house.headOfFamily || '');
    const arrears = getArrearsForHouse(house);
    if (arrears.length > 0) {
      setTargetMonths([arrears[0]]);
    } else {
      setTargetMonths([getIndonesianMonthYear(new Date())]);
    }
    setIsPayModalOpen(true);
    toast.info(`Membuka pembayaran untuk Blok ${house.block}-${house.number}`);
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
      isInitialData: false,
      pbbStatus: house.pbbStatus || 'Belum Diambil',
      pbbYear: house.pbbYear || new Date().getFullYear().toString(),
      generateMutationLog: false,
      familyMembers: (house.familyMembers || []).map(m => ({ ...m, id: m.id || Math.random().toString(36).substr(2, 9) })),
      useManualDemographics: house.useManualDemographics || false,
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
          description: data.isInitialData ? 'Registrasi Awal (Admin)' : 'Warga Baru (Input Admin)',
          isGenerated: data.isInitialData, // If it's initial data, mark as already generated so it doesn't show in mutation reports
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
          
          if (data.generateMutationLog && (newOccupants > oldOccupants || newFamilyCount > oldFamilyCount || data.headOfFamily !== oldHouse.headOfFamily)) {
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
              isGenerated: data.isInitialData, // Mark as generated if initial data
              description: data.isInitialData 
                ? 'Registrasi Awal (Update Data)'
                : (isNewHead 
                  ? 'Pergantian Kepala Keluarga / Warga Baru'
                  : (isBirth 
                    ? `Kelahiran ${newBabyCount - oldBabyCount} bayi baru di keluarga` 
                    : `Penambahan ${diff} anggota keluarga baru`)),
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
  const filteredHouses = useMemo(() => {
    return houses.filter(h => {
      const searchLower = debouncedSearchTerm.toLowerCase();
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
      else if (filterStatus === 'visiting') matchesStatus = h.status?.toLowerCase() === 'visiting';
      else if (filterStatus === 'verified') matchesStatus = h.isVerified === true;
      else if (filterStatus === 'unverified') matchesStatus = !h.isVerified;
      else if (filterStatus === 'arrears') matchesStatus = (h.status === 'Occupied' || h.status === 'Visiting') && getArrearsForHouse(h).length > 0;
      else if (filterStatus === 'pbb_taken') matchesStatus = h.pbbStatus === 'Sudah Diambil';
      else if (filterStatus === 'pbb_not_taken') matchesStatus = h.pbbStatus !== 'Sudah Diambil' && h.pbbStatus !== undefined && (h.status === 'Occupied' || h.status === 'Visiting');
      else if (filterStatus === 'bansos') matchesStatus = !!(h.isPKH || h.isBLT || h.isBPNT || h.isBansosLain);
      else if (filterStatus === 'disability') matchesStatus = !!(h.isDisability || h.isOrphan);

      let matchesResidenceType = true;
      if (filterResidenceType !== 'all') {
        matchesResidenceType = (h.residenceType || 'Tetap') === filterResidenceType;
      }

      let matchesBlock = true;
      if (filterBlock !== 'all') {
        matchesBlock = h.block === filterBlock;
      }

      return matchesSearch && matchesStatus && matchesResidenceType && matchesBlock;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.headOfFamily.localeCompare(b.headOfFamily);
      const blockCompare = a.block.localeCompare(b.block, undefined, { numeric: true });
      if (blockCompare !== 0) return blockCompare;
      return a.number.localeCompare(b.number, undefined, { numeric: true });
    });
  }, [houses, debouncedSearchTerm, filterStatus, filterResidenceType, filterBlock, sortBy, selectedMonth, getPaymentStatus, getArrearsForHouse]);

  // Stats
  const totalResidents = houses.filter(h => h.status === 'Occupied').reduce((acc, h) => acc + Math.max(h.occupants || 1, 1 + (h.familyMembers?.length || 0)), 0);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <motion.div variants={itemVariants} className="w-full md:w-auto">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            Data Warga
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse hidden md:block"></div>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Administrasi kependudukan &amp; sistem pemantauan hunian RT 02
          </p>
        </motion.div>
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
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

              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkChangeResidenceType(e.target.value as any);
                      e.target.value = ""; // Reset value
                    }
                  }}
                  className="px-4 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-200 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer shadow-sm outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>🏠 Status Kepenghunian</option>
                  <option value="Tetap" className="bg-white text-slate-850 font-bold">🏠 Tetap (Milik)</option>
                  <option value="Sewa" className="bg-white text-slate-850 font-bold">🔑 Sewa (Sewa/Kontrak)</option>
                  <option value="Rumah Keluarga" className="bg-white text-slate-850 font-bold">👨‍👩‍👦 Keluarga</option>
                </select>
              </div>

              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkChangeStatus(e.target.value as any);
                      e.target.value = ""; // Reset value
                    }
                  }}
                  className="px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-200 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer shadow-sm outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>🧹 Status Hunian</option>
                  <option value="Occupied" className="bg-white text-slate-850 font-bold">🏠 Dihuni</option>
                  <option value="Empty" className="bg-white text-slate-850 font-bold">📭 Kosong</option>
                  <option value="Business" className="bg-white text-slate-850 font-bold">🏢 Tempat Usaha</option>
                  <option value="Visiting" className="bg-white text-slate-850 font-bold">🧹 Mengunjungi</option>
                </select>
              </div>
            </div>
          )}
          
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-95 border border-indigo-500/30 shrink-0"
          >
            <UserPlus size={15} />
            <span>Tambah Warga</span>
          </button>

          <button 
            onClick={() => {
              setExportFormat('pdf');
              setExportTarget('filtered');
              setIsExportModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 rounded-2xl font-bold text-xs transition-all shadow-sm active:scale-95 shrink-0 whitespace-nowrap"
          >
            <Printer size={15} className="text-indigo-600 shrink-0" />
            <span className="whitespace-nowrap">Cetak PDF</span>
          </button>

          <button 
            onClick={() => {
              setExportFormat('excel');
              setExportTarget('filtered');
              setIsExportModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 rounded-2xl font-bold text-xs transition-all shadow-sm active:scale-95 shrink-0"
          >
            <Download size={15} className="text-emerald-600" />
            <span>Ekspor Excel</span>
          </button>
          
          <div className="relative shrink-0">
            <button 
              onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 bg-white border rounded-2xl font-bold text-xs transition-all shadow-sm active:scale-95 ${
                isActionMenuOpen 
                  ? 'border-indigo-500 text-indigo-600 ring-4 ring-indigo-500/5' 
                  : 'border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Settings size={15} className={isActionMenuOpen ? 'animate-spin-slow text-indigo-600' : 'text-slate-400'} />
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
                      onClick={() => { 
                        handleDownloadTemplate(); 
                        setIsActionMenuOpen(false); 
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-white hover:text-indigo-600 hover:shadow-sm rounded-2xl transition-all"
                    >
                      <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl">
                        <FileText size={14} />
                      </div>
                      <span>Unduh Template Excel</span>
                    </button>
                    
                    <button 
                      onClick={() => { 
                        setExportTarget('all');
                        setIsExportModalOpen(true);
                        setIsActionMenuOpen(false); 
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-white hover:text-emerald-600 hover:shadow-sm rounded-2xl transition-all"
                    >
                      <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl">
                        <Download size={14} />
                      </div>
                      <span>Ekspor Data (Semua Warga)</span>
                    </button>
                    
                    <button 
                      onClick={() => { 
                        setExportTarget('filtered');
                        setIsExportModalOpen(true);
                        setIsActionMenuOpen(false); 
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-white hover:text-indigo-600 hover:shadow-sm rounded-2xl transition-all"
                      disabled={filteredHouses.length === 0}
                    >
                      <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl">
                        <Download size={14} />
                      </div>
                      <span>Ekspor Data (Filter Aktif)</span>
                    </button>
                    <div className="h-px bg-slate-100 mx-3 my-2"></div>
                    <div className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.25em]">Laporan PBB</div>
                    
                    <button 
                      onClick={() => { 
                        const year = new Date().getFullYear().toString();
                        generatePBBReportPDF(filteredHouses, year, pdfConfig); 
                        setIsActionMenuOpen(false); 
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-white hover:text-amber-600 hover:shadow-sm rounded-2xl transition-all"
                    >
                      <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
                        <Printer size={14} />
                      </div>
                      <span>Cetak PBB (Filter Aktif)</span>
                    </button>

                    <button 
                      onClick={() => { 
                        const year = new Date().getFullYear().toString();
                        const takenOnly = houses.filter(h => h.status === 'Occupied' && h.pbbStatus === 'Sudah Diambil');
                        generatePBBReportPDF(takenOnly, year, pdfConfig); 
                        setIsActionMenuOpen(false); 
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-slate-600 hover:bg-white hover:text-emerald-600 hover:shadow-sm rounded-2xl transition-all pl-10"
                    >
                      <span>PBB Sudah Diambil</span>
                    </button>

                    <button 
                      onClick={() => { 
                        const year = new Date().getFullYear().toString();
                        const notTakenOnly = houses.filter(h => h.status === 'Occupied' && h.pbbStatus !== 'Sudah Diambil');
                        generatePBBReportPDF(notTakenOnly, year, pdfConfig); 
                        setIsActionMenuOpen(false); 
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-slate-600 hover:bg-white hover:text-rose-600 hover:shadow-sm rounded-2xl transition-all pl-10"
                    >
                      <span>PBB Belum Diambil</span>
                    </button>

                    <div className="h-px bg-slate-100 mx-3 my-2"></div>
                    <div className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.25em]">Laporan Iuran</div>

                    <button 
                      onClick={() => { 
                        generateBillReportPDF(houses, iuranPayments, 'Air', selectedMonth, pdfConfig); 
                        setIsActionMenuOpen(false); 
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-white hover:text-blue-600 hover:shadow-sm rounded-2xl transition-all"
                    >
                      <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                        <Droplets size={14} />
                      </div>
                      <span>Laporan Iuran Air</span>
                    </button>

                    <button 
                      onClick={() => { 
                        generateBillReportPDF(houses, iuranPayments, 'Sampah', selectedMonth, pdfConfig); 
                        setIsActionMenuOpen(false); 
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-white hover:text-orange-600 hover:shadow-sm rounded-2xl transition-all"
                    >
                      <div className="p-2 bg-orange-50 text-orange-500 rounded-xl">
                        <Trash size={14} />
                      </div>
                      <span>Laporan Iuran Sampah</span>
                    </button>
                    <button 
                      onClick={() => { 
                        generateResidentStatsReportPDF(houses, pdfConfig); 
                        setIsActionMenuOpen(false); 
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-white hover:text-indigo-600 hover:shadow-sm rounded-2xl transition-all"
                    >
                      <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl">
                        <Activity size={14} />
                      </div>
                      <span>Cetak Statistik Warga</span>
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
        filterResidenceType={filterResidenceType}
        setFilterResidenceType={setFilterResidenceType}
        filterBlock={filterBlock}
        setFilterBlock={setFilterBlock}
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
            <DemographicAnalytics houses={houses} cashFlow={cashFlow} reports={reports} pdfConfig={pdfConfig} />
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
            handleUpdateHouse={updateHouseData}
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
        ) : viewMode === 'mutations' ? (
           <PopulationReportManager 
              reports={populationReports} 
              onAddReport={async (r) => {
                try {
                  await addPopulationReportToDb({ ...r, createdAt: new Date().toISOString() });
                  await markPopulationLogsAsGenerated(r.month);
                  toast.success(`Laporan ${r.month} berhasil disimpan.`);
                } catch (error) {
                  handleFirestoreError(error, OperationType.CREATE, "populationReports");
                }
              }} 
              onUpdateReport={async (id, r) => {
                try {
                  await updatePopulationReportToDb(id, r);
                } catch (error) {
                  handleFirestoreError(error, OperationType.UPDATE, `populationReports/${id}`);
                }
              }}
              onDeleteReport={async (id) => {
                const isConfirmed = await confirm({
                  title: 'Hapus Laporan',
                  message: 'Apakah Anda yakin?',
                  confirmLabel: 'Hapus',
                  isDanger: true
                });

                if (isConfirmed) {
                  try {
                    const reportToDelete = populationReports.find(r => r.id === id);
                    if (reportToDelete) await unmarkPopulationLogsAsGenerated(reportToDelete.month);
                    await deletePopulationReportFromDb(id);
                    toast.success('Laporan dihapus.');
                  } catch (error) {
                    handleFirestoreError(error, OperationType.DELETE, `populationReports/${id}`);
                  }
                }
              }} 
              populationLogs={populationLogs} 
              setPopulationLogs={setPopulationLogs} 
              houses={houses} 
              embedded={true}
            />
        ) : viewMode === 'requests' ? (
           <UpdateRequestManager requests={updateRequests} houses={houses} embedded={true} />
        ) : viewMode === 'health' ? (
           <HealthManagement houses={houses} />
        ) : viewMode === 'guests' ? (
           <GuestManager guestReports={guestReports} pdfConfig={pdfConfig} />
        ) : viewMode === 'officials' ? (
           <OfficialManagement officials={officials} houses={houses} />
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
            handleUpdateHouse={updateHouseData}
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

      {/* Customizable Export Modal */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden p-8 flex flex-col my-8"
            >
              {/* Close Button */}
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Download size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800">Kustomisasi Ekspor Data</h3>
                  <p className="text-slate-500 text-sm">Pilih format, lingkup data, dan kolom yang ingin Anda tampilkan.</p>
                </div>
              </div>

              <hr className="border-slate-100 my-4" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">1. Format Dokumen</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setExportFormat('excel')}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border text-center transition-all ${
                          exportFormat === 'excel'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-emerald-500 text-xl font-bold">EXCEL</div>
                        <span className="text-[10px] font-bold">Spreadsheet (.xlsx)</span>
                      </button>
                      <button
                        onClick={() => setExportFormat('pdf')}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border text-center transition-all ${
                          exportFormat === 'pdf'
                            ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-rose-600 text-xl font-bold">PDF</div>
                        <span className="text-[10px] font-bold">Laporan (.pdf)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">2. Lingkup Data</label>
                    <div className="space-y-2">
                      <button
                        onClick={() => setExportTarget('all')}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                          exportTarget === 'all'
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-950 font-bold'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="text-xs">Semua Warga</div>
                          <div className="text-[10px] text-slate-500 font-normal">Seluruh data yang terdaftar ({houses.length} baris)</div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${exportTarget === 'all' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                          {exportTarget === 'all' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </button>

                      <button
                        onClick={() => setExportTarget('filtered')}
                        disabled={filteredHouses.length === 0}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                          exportTarget === 'filtered'
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-950 font-bold'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50'
                        }`}
                      >
                        <div>
                          <div className="text-xs">Filter Aktif</div>
                          <div className="text-[10px] text-slate-500 font-normal font-sans">Sesuai filter pencarian ({filteredHouses.length} baris)</div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${exportTarget === 'filtered' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                          {exportTarget === 'filtered' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 flex flex-col border border-slate-100 rounded-3xl bg-slate-50/50 p-5">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                    <label className="block text-xs font-black text-slate-650 uppercase tracking-wider">3. Pilih Kolom Untuk Diekspor</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedExportCols(['block', 'number', 'headOfFamily', 'phone', 'status', 'residenceType', 'occupants', 'isVerified'])}
                        className="text-[10px] uppercase font-black text-indigo-600 hover:text-indigo-800"
                      >
                        Bawaan
                      </button>
                      <span className="text-slate-300 text-xs">|</span>
                      <button 
                        onClick={() => setSelectedExportCols([
                          'block', 'number', 'headOfFamily', 'phone', 'ownerName', 'ownerPhone',
                          'status', 'residenceType', 'gender', 'birthDate', 'religion',
                          'occupants', 'education', 'jobCategory', 'economicStatus', 'isVerified', 'accessCode'
                        ])}
                        className="text-[10px] uppercase font-black text-indigo-600 hover:text-indigo-800"
                      >
                        Semua
                      </button>
                      <span className="text-slate-300 text-xs">|</span>
                      <button 
                        onClick={() => setSelectedExportCols(['block', 'number'])}
                        className="text-[10px] uppercase font-black text-rose-600 hover:text-rose-800"
                      >
                        Kosongkan
                      </button>
                    </div>
                  </div>

                  <div className="overflow-y-auto max-h-[250px] pr-2 space-y-4 font-sans">
                    {[
                      { name: 'Dasar', items: [
                        { id: 'block', label: 'Blok' },
                        { id: 'number', label: 'No Rumah' },
                        { id: 'headOfFamily', label: 'Kepala Keluarga' },
                        { id: 'status', label: 'Status Hunian' },
                        { id: 'residenceType', label: 'Status Kepenghunian' }
                      ]},
                      { name: 'Kontak', items: [
                        { id: 'phone', label: 'No Telepon' },
                        { id: 'ownerName', label: 'Pemilik Rumah' },
                        { id: 'ownerPhone', label: 'Kontak Pemilik' }
                      ]},
                      { name: 'Demografi', items: [
                        { id: 'gender', label: 'Jenis Kelamin' },
                        { id: 'birthDate', label: 'Tgl Lahir' },
                        { id: 'religion', label: 'Agama' },
                        { id: 'occupants', label: 'Jumlah Jiwa' }
                      ]},
                      { name: 'Pelengkap', items: [
                        { id: 'education', label: 'Pendidikan' },
                        { id: 'jobCategory', label: 'Pekerjaan' },
                        { id: 'economicStatus', label: 'Status Ekonomi' }
                      ]},
                      { name: 'Sistem', items: [
                        { id: 'isVerified', label: 'Status Verifikasi' },
                        { id: 'accessCode', label: 'KODE AKSES (PIN)' }
                      ]}
                    ].map((group) => {
                      return (
                        <div key={group.name} className="space-y-1.5">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{group.name}</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {group.items.map((col) => {
                              const isChecked = selectedExportCols.includes(col.id);
                              const isMandatory = ['block', 'number'].includes(col.id);
                              return (
                                <button
                                  key={col.id}
                                  onClick={() => {
                                    if (isMandatory) return;
                                    if (isChecked) {
                                      setSelectedExportCols(selectedExportCols.filter(c => c !== col.id));
                                    } else {
                                      setSelectedExportCols([...selectedExportCols, col.id]);
                                    }
                                  }}
                                  className={`flex items-center gap-2 px-3 py-2 text-xs rounded-xl border text-left transition-all ${
                                    isChecked
                                      ? 'bg-white border-indigo-200 text-slate-800 shadow-sm font-semibold'
                                      : 'bg-slate-100/55 border-slate-200 text-slate-500 hover:bg-slate-150'
                                  }`}
                                >
                                  <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] text-white ${
                                    isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'
                                  }`}>
                                    {isChecked && '✓'}
                                  </div>
                                  <span className="truncate">{col.label} {isMandatory && <span className="text-rose-450 font-normal">*</span>}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <div className="text-[11px] text-slate-400 max-w-sm">
                  {exportFormat === 'pdf' ? (
                    <span className="flex items-center gap-1 text-amber-600">
                      <ShieldAlert size={12} className="shrink-0" />
                      Orientasi PDF diatur landscape A4 dengan skala lebar serasi.
                    </span>
                  ) : (
                    <span className="text-slate-500 font-sans">
                      Excel akan disusun secara optimal dengan pewarnaan visual modern.
                    </span>
                  )}
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setIsExportModalOpen(false)}
                    className="flex-1 sm:flex-initial px-6 py-3 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-55 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handlePerformExport}
                    disabled={isGenerating || selectedExportCols.length === 0}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-indigo-600/20 transition-all ${
                      isGenerating ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-600/30'
                    }`}
                  >
                    {isGenerating ? 'Memproses...' : 'Ekspor Laporan'}
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Excel Instant Validation & Preview Modal */}
      <AnimatePresence>
        {isExcelPreviewOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-5xl bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden p-8 flex flex-col my-8 h-[90vh] max-h-[800px]"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setIsExcelPreviewOpen(false);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>

              {/* Title & Description */}
              <div className="flex items-center gap-3 mb-2 shrink-0">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800">Validasi & Preview Instan Sebelum Import</h3>
                  <p className="text-slate-500 text-sm">Menampilkan data hasil analisa file <span className="font-semibold text-slate-700">{previewFileName}</span></p>
                </div>
              </div>

              <hr className="border-slate-100 my-4 shrink-0" />

              {/* Statistics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 shrink-0">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Total Baris</span>
                  <p className="text-2xl font-black text-slate-800 mt-1">{excelPreviewData.length}</p>
                </div>
                <div className="bg-indigo-50/55 rounded-2xl p-4 border border-indigo-50">
                  <span className="text-[10px] font-black tracking-widest text-indigo-500 uppercase">Warga Baru (Tambah)</span>
                  <p className="text-2xl font-black text-indigo-650 mt-1">+{previewStats.add}</p>
                </div>
                <div className="bg-amber-50/55 rounded-2xl p-4 border border-amber-50">
                  <span className="text-[10px] font-black tracking-widest text-amber-500 uppercase">Perbarui Data</span>
                  <p className="text-2xl font-black text-amber-650 mt-1">↺ {previewStats.update}</p>
                </div>
                <div className="bg-rose-50/55 rounded-2xl p-4 border border-rose-50">
                  <span className="text-[10px] font-black tracking-widest text-rose-500 uppercase">Format Salah</span>
                  <p className="text-2xl font-black text-rose-650 mt-1">{previewStats.invalid}</p>
                </div>
              </div>

              {/* Filter Tabs inside preview */}
              <div className="flex items-center justify-between gap-4 mb-4 shrink-0">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                  {(['all', 'add', 'update', 'invalid'] as const).map((tab) => {
                    const label = tab === 'all' ? 'Semua' : tab === 'add' ? 'Akan Ditambah' : tab === 'update' ? 'Akan Diperbarui' : 'Format Salah';
                    const count = tab === 'all' ? excelPreviewData.length : tab === 'add' ? previewStats.add : tab === 'update' ? previewStats.update : previewStats.invalid;
                    const isActive = previewFilterTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setPreviewFilterTab(tab)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                          isActive
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/40'
                        }`}
                      >
                        {label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scrollable table of preview data */}
              <div className="flex-1 overflow-auto border border-slate-100 rounded-2xl bg-slate-50/35">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-100/80 sticky top-0 border-b border-slate-200">
                      <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Blok</th>
                      <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">No Rumah</th>
                      <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kepala Keluarga</th>
                      <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-40 text-center">Rencana Aksi</th>
                      <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Perubahan / Pesan Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {excelPreviewData
                      .filter(item => {
                        if (previewFilterTab === 'all') return true;
                        return item.status === previewFilterTab;
                      })
                      .map((item, idx) => {
                        return (
                          <tr key={idx} className="hover:bg-slate-100/35 transition-colors">
                            <td className="px-5 py-4 text-xs font-black text-slate-800 uppercase">
                              {item.block || (
                                <span className="text-rose-500 font-bold italic text-[11px]">Kosong</span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-xs font-black text-slate-800">
                              {item.number || (
                                <span className="text-rose-500 font-bold italic text-[11px]">Kosong</span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-xs font-medium text-slate-650">
                              {item.headOfFamily}
                            </td>
                            <td className="px-5 py-4 text-center">
                              {item.status === 'add' && (
                                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-150 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                  🆕 Baru
                                </span>
                              )}
                              {item.status === 'update' && (
                                <span className="inline-block px-3 py-1 bg-amber-50 text-amber-700 border border-amber-150 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                  🔄 Update
                                </span>
                              )}
                              {item.status === 'invalid' && (
                                <span className="inline-block px-3 py-1 bg-rose-50 text-rose-700 border border-rose-150 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                  ❌ Lewati
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-xs">
                              {item.status === 'invalid' && (
                                <div className="space-y-1">
                                  {item.errors.map((err: string, i: number) => (
                                    <div key={i} className="text-rose-600 font-black flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                                      {err}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {item.status === 'add' && (
                                <div className="text-slate-400">
                                  {item.warnings.length > 0 ? (
                                    <div className="space-y-1">
                                      {item.warnings.map((warn: string, i: number) => (
                                        <div key={i} className="text-amber-600 font-bold flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                          {warn}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-indigo-500 font-bold font-sans">Rumah baru akan ditambahkan ke sistem</span>
                                  )}
                                </div>
                              )}
                              {item.status === 'update' && (
                                <div className="space-y-1">
                                  {item.changes.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-1 text-[11px] font-sans">
                                      {item.changes.map((change: any, i: number) => (
                                        <div key={i} className="text-slate-600 flex items-center flex-wrap gap-x-1.5">
                                          <span className="font-bold text-slate-800">{change.label}:</span>
                                          <span className="line-through text-slate-400">{change.from !== undefined ? String(change.from) : 'Kosong'}</span>
                                          <span className="text-slate-400">➔</span>
                                          <span className="text-indigo-600 font-bold">{String(change.to)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic font-sans">Data sama dengan yang ada di sistem (tidak diupdate)</span>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    {excelPreviewData.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-slate-400 font-medium font-sans">
                          Tidak ada data yang tersedia untuk divalidasi.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Warning footer message if any invalids exist */}
              {previewStats.invalid > 0 && (
                <div className="mt-4 p-3.5 bg-rose-50 text-rose-700 rounded-2xl flex items-center gap-2 border border-rose-100 shrink-0">
                  <AlertCircle size={16} className="shrink-0" />
                  <p className="text-xs font-semibold">Terdapat <span className="font-black">{previewStats.invalid}</span> baris dengan kesalahan format. Baris-baris ini akan dilewati secara otomatis untuk mencegah kerusakan data.</p>
                </div>
              )}

              {/* Confirm & Process Panel */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 shrink-0">
                <div className="text-[11px] text-slate-400 font-sans max-w-lg">
                  Pastikan seluruh data hasil parsing di atas telah sesuai sebelum menyimpannya ke database warga RT 02.
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setIsExcelPreviewOpen(false);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    disabled={isUploading}
                    className="flex-1 sm:flex-initial px-6 py-3 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-55 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handlePerformImportPreview}
                    disabled={isUploading || (previewStats.add === 0 && previewStats.update === 0)}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all ${
                      isUploading 
                        ? 'bg-indigo-400 cursor-not-allowed shadow-none' 
                        : (previewStats.add === 0 && previewStats.update === 0)
                          ? 'bg-slate-300 cursor-not-allowed shadow-none text-slate-400'
                          : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-600/30'
                    }`}
                  >
                    {isUploading ? 'Menyimpan...' : `Konfirmasi & Import (${previewStats.add + previewStats.update} Data)`}
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
