import React, { useState, useMemo } from 'react';
import { PopulationReport, PopulationChangeLog, House } from '../../types';
import { generatePopulationReportPDF, generateMutationReportPDF, generateSingleMutationCertificatePDF } from '../../services/pdfService';
import { generatePopulationReportExcel } from '../../services/excelService';
import { addPopulationLogToDb, updatePopulationLogToDb, deletePopulationLogFromDb, updateHouseData, logAction, markAllLogsBeforeDateAsGenerated, unmarkAllLogsBeforeDateAsGenerated } from '../../services/databaseService';
import { sendWhatsAppViaGateway } from '../../services/whatsappService';
import { toast } from 'sonner';
import { 
  Plus, FileText, Trash2, TrendingUp, TrendingDown, 
  Users, Baby, Accessibility, Heart, User, 
  Calendar, ArrowRight, Activity, Clock, Filter, Search, MapPin as MapIcon,
  BarChart3, PieChart as PieChartIcon, List, LayoutGrid, Download, Edit2,
  RefreshCw, Filter as FilterIcon, MessageCircle, CheckSquare, Square,
  FileUp, CheckCircle, XCircle, AlertCircle, Printer, ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { motion, AnimatePresence } from 'motion/react';
import { useConfirm } from '../../context/ConfirmContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, Legend 
} from 'recharts';

interface PopulationReportManagerProps {
  reports: PopulationReport[];
  onAddReport: (report: Omit<PopulationReport, 'id' | 'createdAt'>) => void;
  onUpdateReport: (id: string, report: Partial<PopulationReport>) => void;
  onDeleteReport: (id: string) => void;
  populationLogs: PopulationChangeLog[];
  setPopulationLogs: (logs: PopulationChangeLog[]) => void;
  houses: House[];
  pdfConfig?: PdfConfig;
  embedded?: boolean;
}

export const PopulationReportManager: React.FC<PopulationReportManagerProps> = ({ 
  reports, onAddReport, onUpdateReport, onDeleteReport, populationLogs, setPopulationLogs, houses, pdfConfig, embedded = false
}) => {
  const confirm = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isGeneratingLogs, setIsGeneratingLogs] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'logs'>('overview');
  
  // Reports sub-tab filters
  const [reportYearFilter, setReportYearFilter] = useState<string>('All');
  const [reportSearchTerm, setReportSearchTerm] = useState<string>('');

  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState<'All' | 'Newcomer' | 'MovedOut' | 'Birth' | 'Death'>('All');
  const [logStatusFilter, setLogStatusFilter] = useState<'All' | 'Unprocessed' | 'Processed'>('All');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [autoUpdateHouse, setAutoUpdateHouse] = useState(true);

  // Helper formatting for Month Year Indonesian
  const formatIndonesianMonthYear = (monthStr: string) => {
    if (!monthStr) return '-';
    const parts = monthStr.split('-');
    if (parts.length < 2) return monthStr;
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const monthName = monthNames[monthIdx] || parts[1];
    return `${monthName} ${parts[0]}`;
  };
  const [formData, setFormData] = useState<Omit<PopulationReport, 'id' | 'createdAt'>>({
    month: new Date().toISOString().slice(0, 7),
    year: new Date().getFullYear(),
    initialPopulation: 0,
    birthCount: 0,
    deathCount: 0,
    newcomerCount: 0,
    movedOutCount: 0,
    maleCount: 0,
    femaleCount: 0,
    seasonalCount: 0,
    seasonalMaleCount: 0,
    seasonalFemaleCount: 0,
    pregnantCount: 0,
    babyCount: 0,
    toddlerCount: 0,
    teenagerCount: 0,
    adultCount: 0,
    elderlyCount: 0,
    childCount: 0,
    widowCount: 0,
    disabilityCount: 0,
    orphanCount: 0,
  });

  const [logFormData, setLogFormData] = useState({
    type: 'Newcomer' as PopulationChangeLog['type'],
    name: '',
    phone: '',
    houseId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    documentUrl: '',
    verificationStatus: 'Approved' as 'Pending' | 'Approved' | 'Rejected',
    approvalNotes: '',
    details: {
      previousAddress: '',
      reasonForMoving: '',
      familyCount: 1,
      familyMembers: [] as {name: string, relationship: string, nik?: string}[],
      residenceType: 'Tetap' as 'Tetap' | 'Sewa' | 'Rumah Keluarga',
      religion: '',
      vulnerability: [] as string[],
      kkNumber: '',
      jobCategory: '',
      education: '',
      ownerName: '',
      ownerPhone: '',
      newAddress: '',
      fatherName: '',
      motherName: '',
      gender: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
      causeOfDeath: '',
      placeOfDeath: ''
    }
  });

  const handleSyncAllResidents = async () => {
    const isConfirmed = await confirm({
      title: 'Sinkronisasi Data Warga',
      message: 'Sistem akan memeriksa semua rumah berstatus "Menempati" (Occupied) yang belum memiliki catatan di Log Mutasi dan mendaftarkannya sebagai Log Mutasi Warga Baru. Apakah Anda ingin melanjutkan?',
      confirmLabel: 'Sync Semua Data',
      cancelLabel: 'Batal'
    });

    if (!isConfirmed) return;

    let syncCount = 0;
    for (const house of houses) {
      if (house.status === 'Occupied') {
        const hasNewcomerLog = populationLogs.some(l => l.type === 'Newcomer' && l.houseId === house.id);
        if (!hasNewcomerLog && house.joiningDate) {
          const vulnerability = [];
          if (house.isPKH) vulnerability.push('PKH');
          if (house.isBLT) vulnerability.push('BLT');
          if (house.isBPNT) vulnerability.push('BPNT');
          if (house.isBansosLain) vulnerability.push(house.bansosLainName || 'Bansos Lainnya');
          if (house.isDisability) vulnerability.push('Disabilitas');
          if (house.isOrphan) vulnerability.push('Yatim/Piatu');

          const newLog = {
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            type: 'Newcomer' as const,
            name: house.headOfFamily || `Warga Rumah ${house.id}`,
            phone: house.phone || '',
            houseId: house.id,
            date: house.joiningDate.split('T')[0],
            description: 'Warga baru ditambahkan melalui Sync Data Warga',
            isGenerated: false, // Ensure it shows in Log Mutasi list and reports
            details: {
              previousAddress: '-',
              reasonForMoving: 'Registrasi Warga',
              familyCount: house.occupants || 1,
              familyMembers: house.familyMembers || [],
              residenceType: house.residenceType || 'Tetap',
              religion: house.religion || '-',
              vulnerability: vulnerability,
              ownerName: house.ownerName || '',
              ownerPhone: house.ownerPhone || '',
              kkNumber: house.kkNumber || '-',
              jobCategory: house.jobCategory || '-',
              education: house.education || '-'
            }
          };
          await addPopulationLogToDb(newLog);
          syncCount++;
        }

        // Auto Sync Birth Logs if house has babyCount > 0 but no Birth log exists
        const houseBabyCount = house.babyCount || 0;
        const birthLogsCount = populationLogs.filter(l => l.type === 'Birth' && l.houseId === house.id).length;
        if (houseBabyCount > birthLogsCount) {
          const missingBirths = houseBabyCount - birthLogsCount;
          for (let i = 0; i < missingBirths; i++) {
            const birthLog = {
              id: Date.now().toString() + Math.random().toString(36).substring(7) + i,
              type: 'Birth' as const,
              name: house.headOfFamily ? `Kelahiran Bayi (Keluarga ${house.headOfFamily})` : `Kelahiran Bayi Blok ${house.block}-${house.number}`,
              phone: house.phone || '',
              houseId: house.id,
              date: new Date().toISOString().split('T')[0],
              description: 'Catatan Kelahiran Bayi (Auto-Sync dari Data Warga)',
              isGenerated: false,
              details: {
                previousAddress: 'Lahir di RT 02',
                reasonForMoving: 'Kelahiran',
                familyCount: 1,
                residenceType: house.residenceType || 'Tetap',
                religion: house.religion || '-',
                kkNumber: house.kkNumber || '-'
              }
            };
            await addPopulationLogToDb(birthLog);
            syncCount++;
          }
        }
      }
    }
    if (syncCount > 0) {
      toast.success(`Berhasil menyinkronkan ${syncCount} data warga ke log mutasi!`);
    } else {
      toast.info('Semua data rumah berpenghuni sudah memiliki catatan log mutasi.');
    }
  };

  const handleAutoGenerateAllYearReports = async () => {
    const isConfirmed = await confirm({
      title: 'Reset & Auto-Generate Laporan 2026',
      message: 'Sistem akan secara otomatis menghapus laporan lama dan merekapitulasi laporan bulanan dari Januari hingga bulan ini secara bersih dan presisi berdasarkan data aktual RT 02. Lanjutkan?',
      confirmLabel: 'Ya, Generate Semua',
      cancelLabel: 'Batal'
    });

    if (!isConfirmed) return;

    try {
      setIsGeneratingLogs(true);
      // 1. Delete existing reports
      for (const report of reports) {
        await onDeleteReport(report.id);
      }

      // Calculate base actual residents count from occupied houses
      let baseTotal = 0;
      let baseMale = 0;
      let baseFemale = 0;
      let basePregnant = 0;
      let baseBaby = 0;
      let baseToddler = 0;
      let baseChild = 0;
      let baseTeenager = 0;
      let baseAdult = 0;
      let baseElderly = 0;
      let baseWidow = 0;
      let baseDisability = 0;
      let baseOrphan = 0;
      let baseSeasonal = 0;
      let baseSeasonalMale = 0;
      let baseSeasonalFemale = 0;

      houses.forEach(house => {
        if (house.status === 'Occupied') {
          const occupantsCount = Math.max(house.occupants || 1, 1 + (house.familyMembers?.length || 0));
          const isSeasonal = house.residenceType === 'Sewa';
          if (isSeasonal) baseSeasonal += occupantsCount;

          baseTotal += occupantsCount;
          basePregnant += house.pregnantCount || 0;
          baseBaby += house.babyCount || 0;
          baseToddler += house.toddlerCount || 0;
          baseChild += house.childCount || 0;
          baseTeenager += house.teenagerCount || 0;
          baseAdult += house.adultCount || 0;
          baseElderly += house.elderlyCount || 0;
          baseWidow += house.widowCount || 0;
          baseDisability += house.disabilityCount || 0;
          baseOrphan += house.orphanCount || 0;

          if (house.familyMembers && house.familyMembers.length > 0) {
            baseMale += (house.gender === 'Laki-laki' || !house.gender) ? 1 : 0;
            if (isSeasonal && (house.gender === 'Laki-laki' || !house.gender)) baseSeasonalMale++;
            baseFemale += house.gender === 'Perempuan' ? 1 : 0;
            if (isSeasonal && house.gender === 'Perempuan') baseSeasonalFemale++;

            house.familyMembers.forEach(m => {
              const mGender = m.gender || 'Laki-laki';
              if (mGender === 'Laki-laki') {
                baseMale++;
                if (isSeasonal) baseSeasonalMale++;
              } else if (mGender === 'Perempuan') {
                baseFemale++;
                if (isSeasonal) baseSeasonalFemale++;
              }
            });

            const registeredCount = 1 + house.familyMembers.length;
            if (occupantsCount > registeredCount) {
              const diff = occupantsCount - registeredCount;
              const m = Math.ceil(diff / 2);
              const f = Math.floor(diff / 2);
              baseMale += m;
              baseFemale += f;
              if (isSeasonal) {
                baseSeasonalMale += m;
                baseSeasonalFemale += f;
              }
            }
          } else {
            const headGender = house.gender || 'Laki-laki';
            const headMale = headGender === 'Laki-laki' ? 1 : 0;
            const headFemale = headGender === 'Perempuan' ? 1 : 0;

            baseMale += headMale;
            baseFemale += headFemale;
            if (isSeasonal) {
              if (headMale) baseSeasonalMale++;
              if (headFemale) baseSeasonalFemale++;
            }

            if (occupantsCount > 1) {
              const diff = occupantsCount - 1;
              const m = Math.ceil(diff / 2);
              const f = Math.floor(diff / 2);
              baseMale += m;
              baseFemale += f;
              if (isSeasonal) {
                baseSeasonalMale += m;
                baseSeasonalFemale += f;
              }
            }
          }
        }
      });

      const currentMonthNum = new Date().getMonth() + 1; // 1..8
      let runningInitial = baseTotal;

      for (let m = 1; m <= currentMonthNum; m++) {
        const monthStr = `2026-${String(m).padStart(2, '0')}`;
        
        // Find logs for this specific month
        const logsThisMonth = populationLogs.filter(log => log.date.startsWith(monthStr));
        const birthCount = logsThisMonth.filter(l => l.type === 'Birth').length;
        const deathCount = logsThisMonth.filter(l => l.type === 'Death').length;
        const newcomerCount = logsThisMonth.filter(l => l.type === 'Newcomer' && l.date.startsWith(monthStr)).reduce((sum, log) => sum + (log.details?.familyCount || 1), 0);
        const movedOutCount = logsThisMonth.filter(l => l.type === 'MovedOut' && l.date.startsWith(monthStr)).reduce((sum, log) => sum + (log.details?.familyCount || 1), 0);

        const reportData = {
          month: monthStr,
          year: 2026,
          initialPopulation: runningInitial,
          birthCount,
          deathCount,
          newcomerCount,
          movedOutCount,
          maleCount: baseMale,
          femaleCount: baseFemale,
          pregnantCount: basePregnant,
          babyCount: baseBaby,
          toddlerCount: baseToddler,
          childCount: baseChild,
          teenagerCount: baseTeenager,
          adultCount: baseAdult,
          elderlyCount: baseElderly,
          widowCount: baseWidow,
          disabilityCount: baseDisability,
          orphanCount: baseOrphan,
          seasonalCount: baseSeasonal,
          seasonalMaleCount: baseSeasonalMale,
          seasonalFemaleCount: baseSeasonalFemale,
          createdAt: new Date().toISOString()
        };

        await onAddReport(reportData);
        runningInitial = runningInitial + birthCount + newcomerCount - movedOutCount - deathCount;
      }

      toast.success('Berhasil meng-generate seluruh laporan bulanan 2026 secara rapi & presisi!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal meng-generate laporan.');
    } finally {
      setIsGeneratingLogs(false);
    }
  };

  const handleBulkMarkLogsProcessed = async () => {
    const isConfirmed = await confirm({
      title: 'Bersihkan Log Mutasi Lama',
      message: 'Semua log mutasi sebelum tanggal hari ini akan ditandai sebagai "Sudah Diproses". Ini berguna untuk memastikan data lama tidak muncul lagi saat Anda membuat laporan mutasi bulan ini. Lanjutkan?',
      confirmLabel: 'Ya, Bersihkan',
      cancelLabel: 'Batal',
      isDanger: true
    });

    if (!isConfirmed) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const count = await markAllLogsBeforeDateAsGenerated(today);
      if (count > 0) {
        toast.success(`${count} log mutasi lama berhasil ditandai sebagai sudah diproses.`);
      } else {
        toast.info('Tidak ada log mutasi lama yang perlu dibersihkan.');
      }
    } catch (error) {
      toast.error('Gagal membersihkan log lama.');
      console.error(error);
    }
  };

  const handleBulkRestoreLogs = async () => {
    const isConfirmed = await confirm({
      title: 'Pulihkan Log Mutasi',
      message: 'Semua log mutasi yang ditandai sebagai "Sudah Diproses" akan dikembalikan statusnya sehingga bisa muncul kembali di laporan. Lanjutkan?',
      confirmLabel: 'Ya, Pulihkan',
      cancelLabel: 'Batal'
    });

    if (!isConfirmed) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const count = await unmarkAllLogsBeforeDateAsGenerated(today);
      if (count > 0) {
        toast.success(`${count} log mutasi lama berhasil dipulihkan.`);
      } else {
        toast.info('Tidak ada log mutasi yang perlu dipulihkan.');
      }
    } catch (error) {
      toast.error('Gagal memulihkan log.');
      console.error(error);
    }
  };

  const handleGenerateFromLog = async () => {
    if (isGeneratingLogs) return;
    setIsGeneratingLogs(true);
    
    try {
      const targetMonth = formData.month; // Use the month selected in the form
      
      // Auto-sync missing newcomers and moved out from houses
      const missingLogs: any[] = [];
      for (const house of houses) {
        // Only create Newcomer log if house has an EXPLICIT joiningDate in targetMonth (meaning they truly moved in this month)
        if (house.status === 'Occupied' && house.joiningDate && house.joiningDate.startsWith(targetMonth)) {
          const hasLog = populationLogs.some(l => l.type === 'Newcomer' && l.houseId === house.id) ||
                         missingLogs.some(l => l.type === 'Newcomer' && l.houseId === house.id);
          if (!hasLog) {
            const vulnerability = [];
            if (house.isPKH) vulnerability.push('PKH');
            if (house.isBLT) vulnerability.push('BLT');
            if (house.isBPNT) vulnerability.push('BPNT');
            if (house.isBansosLain) vulnerability.push(house.bansosLainName || 'Bansos Lainnya');
            if (house.isDisability) vulnerability.push('Disabilitas');
            if (house.isOrphan) vulnerability.push('Yatim/Piatu');

            const newLog = {
              id: Date.now().toString() + Math.random().toString(36).substring(7),
              type: 'Newcomer' as const,
              name: house.headOfFamily,
              phone: house.phone,
              houseId: house.id,
              date: house.joiningDate.split('T')[0],
              description: 'Warga baru ditambahkan melalui Data Warga (Auto-Sync)',
              isGenerated: false,
              details: {
                previousAddress: '-',
                reasonForMoving: '-',
                familyCount: house.occupants || 1,
                familyMembers: house.familyMembers || [],
                residenceType: house.residenceType || 'Tetap',
                religion: house.religion || '-',
                vulnerability: vulnerability,
                ownerName: house.ownerName || '',
                ownerPhone: house.ownerPhone || '',
                kkNumber: house.kkNumber || '-',
                jobCategory: house.jobCategory || '-',
                education: house.education || '-'
              }
            };
            missingLogs.push(newLog);
            await addPopulationLogToDb(newLog);
          }
        } else if (house.status === 'Empty') {
          // Check if there's a recent newcomer log that doesn't have a corresponding moved out log
          const newcomerLogs = [
            ...populationLogs.filter(l => l.type === 'Newcomer' && l.houseId === house.id),
            ...missingLogs.filter(l => l.type === 'Newcomer' && l.houseId === house.id)
          ];
          const movedOutLogs = [
            ...populationLogs.filter(l => l.type === 'MovedOut' && l.houseId === house.id),
            ...missingLogs.filter(l => l.type === 'MovedOut' && l.houseId === house.id)
          ];
          
          if (newcomerLogs.length > movedOutLogs.length) {
             // Find the latest newcomer log to get the name and details
             const latestNewcomer = newcomerLogs.sort((a, b) => b.date.localeCompare(a.date))[0];
             
             const newLog = {
              id: Date.now().toString() + Math.random().toString(36).substring(7),
              type: 'MovedOut' as const,
              name: latestNewcomer.name || `Warga ${house.block}-${house.number}`,
              phone: latestNewcomer.phone || '',
              houseId: house.id,
              date: new Date().toISOString().split('T')[0],
              description: 'Warga pindah keluar (Auto-Sync)',
              details: {
                newAddress: '-',
                reasonForMoving: '-',
                familyCount: latestNewcomer.details?.familyCount || 1
              }
            };
            missingLogs.push(newLog);
            await addPopulationLogToDb(newLog);
          }
        }
      }

      const allLogs = [...populationLogs, ...missingLogs];
      const logsThisMonth = allLogs.filter(log => log.date.startsWith(targetMonth) && !log.isGenerated);
    
      if (logsThisMonth.length === 0) {
        toast.info(`Dihitung berdasarkan log mutasi bulan ${formatIndonesianMonthYear(targetMonth)}.`);
      } else {
        toast.success(`Berhasil mengkalkulasi ${logsThisMonth.length} log mutasi untuk bulan ${formatIndonesianMonthYear(targetMonth)}!`);
      }
    const birthCount = logsThisMonth.filter(l => l.type === 'Birth').length;
    const deathCount = logsThisMonth.filter(l => l.type === 'Death').length;
    const newcomerCount = logsThisMonth.filter(l => l.type === 'Newcomer').reduce((sum, log) => sum + (log.details?.familyCount || 1), 0);
    const movedOutCount = logsThisMonth.filter(l => l.type === 'MovedOut').reduce((sum, log) => sum + (log.details?.familyCount || 1), 0);

    let currentPregnant = 0;
    let currentBaby = 0;
    let currentToddler = 0;
    let currentChild = 0;
    let currentTeenager = 0;
    let currentAdult = 0;
    let currentElderly = 0;
    let currentWidow = 0;
    let currentDisability = 0;
    let currentOrphan = 0;
    let currentTotal = 0;
    let currentMale = 0;
    let currentFemale = 0;
    let currentSeasonal = 0;
    let currentSeasonalMale = 0;
    let currentSeasonalFemale = 0;

    houses.forEach(house => {
      if (house.status === 'Occupied') {
        const occupantsCount = Math.max(house.occupants || 1, 1 + (house.familyMembers?.length || 0));
        const isSeasonal = house.residenceType === 'Sewa';
        if (isSeasonal) {
          currentSeasonal += occupantsCount;
        }

        currentTotal += occupantsCount;
        currentPregnant += house.pregnantCount || 0;
        currentBaby += house.babyCount || 0;
        currentToddler += house.toddlerCount || 0;
        currentChild += house.childCount || 0;
        currentTeenager += house.teenagerCount || 0;
        currentAdult += house.adultCount || 0;
        currentElderly += house.elderlyCount || 0;
        currentWidow += house.widowCount || 0;
        currentDisability += house.disabilityCount || 0;
        currentOrphan += house.orphanCount || 0;
        
        // Count gender from family members if available, otherwise estimate
        if (house.familyMembers && house.familyMembers.length > 0) {
          // We must count at least the Head of Family
          currentMale += (house.gender === 'Laki-laki' || !house.gender) ? 1 : 0;
          if (isSeasonal && (house.gender === 'Laki-laki' || !house.gender)) currentSeasonalMale++;
          
          currentFemale += house.gender === 'Perempuan' ? 1 : 0;
          if (isSeasonal && house.gender === 'Perempuan') currentSeasonalFemale++;

          house.familyMembers.forEach(m => {
            const mGender = m.gender || 'Laki-laki';
            if (mGender === 'Laki-laki') {
              currentMale++;
              if (isSeasonal) currentSeasonalMale++;
            }
            else if (mGender === 'Perempuan') {
              currentFemale++;
              if (isSeasonal) currentSeasonalFemale++;
            }
          });

          // Adjust if occupants count is higher than registered members
          const registeredCount = 1 + house.familyMembers.length;
          if (occupantsCount > registeredCount) {
             const diff = occupantsCount - registeredCount;
             const m = Math.ceil(diff / 2);
             const f = Math.floor(diff / 2);
             currentMale += m;
             currentFemale += f;
             if (isSeasonal) {
               currentSeasonalMale += m;
               currentSeasonalFemale += f;
             }
          }
        } else {
          // Fallback: assume head of family gender or split
          const headGender = house.gender || 'Laki-laki';
          const headMale = headGender === 'Laki-laki' ? 1 : 0;
          const headFemale = headGender === 'Perempuan' ? 1 : 0;
          
          currentMale += headMale;
          currentFemale += headFemale;
          if (isSeasonal) {
            if (headMale) currentSeasonalMale++;
            if (headFemale) currentSeasonalFemale++;
          }
          
          if (occupantsCount > 1) {
            const diff = occupantsCount - 1;
            const m = Math.ceil(diff / 2);
            const f = Math.floor(diff / 2);
            currentMale += m;
            currentFemale += f;
            if (isSeasonal) {
              currentSeasonalMale += m;
              currentSeasonalFemale += f;
            }
          }
        }
      }
    });

    // Find previous month string in local time format (YYYY-MM)
    const [yearNum, monthNum] = targetMonth.split('-').map(Number);
    const prevYear = monthNum === 1 ? yearNum - 1 : yearNum;
    const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
    const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

    // 1. First priority: Exact previous month report
    let lastMonthReport = reports.find(r => r.month === prevMonthStr);
    
    // 2. Second priority: Latest report strictly before targetMonth if exact previous month report doesn't exist
    if (!lastMonthReport) {
      const priorReports = reports.filter(r => r.month < targetMonth).sort((a, b) => b.month.localeCompare(a.month));
      if (priorReports.length > 0) {
        lastMonthReport = priorReports[0];
      }
    }
    
    let initialPopulation = lastMonthReport ? 
      (lastMonthReport.initialPopulation + lastMonthReport.birthCount + lastMonthReport.newcomerCount - lastMonthReport.movedOutCount - (lastMonthReport.deathCount || 0)) : 
      (currentTotal - newcomerCount - birthCount + movedOutCount + deathCount);

    if (missingLogs.length > 0) {
      toast.success(`Berhasil menyinkronkan ${missingLogs.length} data warga baru ke dalam log mutasi.`);
    }

    setFormData(prev => ({
      ...prev,
      month: targetMonth,
      birthCount,
      deathCount,
      newcomerCount,
      movedOutCount,
      maleCount: currentMale,
      femaleCount: currentFemale,
      pregnantCount: currentPregnant,
      babyCount: currentBaby,
      toddlerCount: currentToddler,
      childCount: currentChild,
      teenagerCount: currentTeenager,
      adultCount: currentAdult,
      elderlyCount: currentElderly,
      widowCount: currentWidow,
      disabilityCount: currentDisability,
      orphanCount: currentOrphan,
      seasonalCount: currentSeasonal,
      seasonalMaleCount: currentSeasonalMale,
      seasonalFemaleCount: currentSeasonalFemale,
      initialPopulation: initialPopulation
    }));
    setEditingReportId(null);
    setIsModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memproses log mutasi.');
    } finally {
      setIsGeneratingLogs(false);
    }
  };

  const handleEditReport = (report: PopulationReport) => {
    const { id, createdAt, ...data } = report;
    setFormData(data);
    setEditingReportId(id);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingReportId) {
      onUpdateReport(editingReportId, formData);
    } else {
      onAddReport(formData);
    }
    setIsModalOpen(false);
    setEditingReportId(null);
  };

  const handleEditLog = (log: PopulationChangeLog) => {
    setLogFormData({
      type: log.type,
      name: log.name || '',
      phone: log.phone || '',
      houseId: log.houseId,
      date: log.date,
      description: log.description || '',
      documentUrl: log.documentUrl || '',
      verificationStatus: log.verificationStatus || 'Approved',
      approvalNotes: log.approvalNotes || '',
      details: {
        previousAddress: log.details?.previousAddress || '',
        reasonForMoving: log.details?.reasonForMoving || '',
        familyCount: log.details?.familyCount || 1,
        familyMembers: log.details?.familyMembers || [],
        residenceType: log.details?.residenceType || 'Tetap',
        religion: log.details?.religion || '',
        vulnerability: log.details?.vulnerability || [],
        kkNumber: log.details?.kkNumber || '',
        jobCategory: log.details?.jobCategory || '',
        education: log.details?.education || '',
        ownerName: log.details?.ownerName || '',
        ownerPhone: log.details?.ownerPhone || '',
        newAddress: log.details?.newAddress || '',
        fatherName: log.details?.fatherName || '',
        motherName: log.details?.motherName || '',
        gender: log.details?.gender || 'Laki-laki',
        causeOfDeath: log.details?.causeOfDeath || '',
        placeOfDeath: log.details?.placeOfDeath || ''
      }
    });
    setEditingLogId(log.id);
    setIsLogModalOpen(true);
  };

  const handleBulkDelete = async () => {
    if (selectedLogIds.length === 0) return;
    const isConfirmed = await confirm({
      title: 'Hapus Log Terpilih',
      message: `Apakah Anda yakin ingin menghapus ${selectedLogIds.length} catatan mutasi terpilih? Data yang dihapus tidak dapat dikembalikan.`,
      confirmLabel: 'Ya, Hapus Massal',
      cancelLabel: 'Batal'
    });
    if (!isConfirmed) return;

    for (const id of selectedLogIds) {
      await deletePopulationLogFromDb(id);
    }
    toast.success(`${selectedLogIds.length} log mutasi berhasil dihapus.`);
    setSelectedLogIds([]);
  };

  const handleBulkMarkGenerated = async (isGen: boolean) => {
    if (selectedLogIds.length === 0) return;
    for (const id of selectedLogIds) {
      await updatePopulationLogToDb(id, { isGenerated: isGen });
    }
    toast.success(`Status ${selectedLogIds.length} log mutasi berhasil diperbarui.`);
    setSelectedLogIds([]);
  };

  const handleBulkVerifyStatus = async (status: 'Approved' | 'Rejected' | 'Pending') => {
    if (selectedLogIds.length === 0) return;
    for (const id of selectedLogIds) {
      await updatePopulationLogToDb(id, { verificationStatus: status });
    }
    toast.success(`Verifikasi ${selectedLogIds.length} log mutasi diubah menjadi '${status}'.`);
    setSelectedLogIds([]);
  };

  const handleSelectAllOnPage = () => {
    const pageIds = paginatedLogs.map(l => l.id);
    const allSelected = pageIds.every(id => selectedLogIds.includes(id));
    if (allSelected) {
      setSelectedLogIds(selectedLogIds.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedLogIds(Array.from(new Set([...selectedLogIds, ...pageIds])));
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const logData = {
      ...logFormData,
      id: editingLogId || Date.now().toString(),
      details: logFormData.type === 'Newcomer' ? {
        previousAddress: logFormData.details.previousAddress,
        reasonForMoving: logFormData.details.reasonForMoving,
        familyCount: logFormData.details.familyCount,
        familyMembers: logFormData.details.familyCount > 1 ? logFormData.details.familyMembers : undefined,
        residenceType: logFormData.details.residenceType,
        religion: logFormData.details.religion,
        vulnerability: logFormData.details.vulnerability,
        kkNumber: logFormData.details.kkNumber,
        jobCategory: logFormData.details.jobCategory,
        education: logFormData.details.education,
        ownerName: logFormData.details.ownerName,
        ownerPhone: logFormData.details.ownerPhone
      } : logFormData.type === 'MovedOut' ? {
        newAddress: logFormData.details.newAddress,
        reasonForMoving: logFormData.details.reasonForMoving,
        familyCount: logFormData.details.familyCount
      } : logFormData.type === 'Birth' ? {
        fatherName: logFormData.details.fatherName,
        motherName: logFormData.details.motherName,
        gender: logFormData.details.gender
      } : {
        causeOfDeath: logFormData.details.causeOfDeath,
        placeOfDeath: logFormData.details.placeOfDeath
      }
    };
    
    if (editingLogId) {
      await updatePopulationLogToDb(editingLogId, logData);
      await logAction('Update Mutasi', `Update data mutasi ${logData.type} untuk ${logData.name}`);
    } else {
      await addPopulationLogToDb(logData);
      await logAction('Tambah Mutasi', `Tambah data mutasi ${logData.type} untuk ${logData.name}`);
    }

    // --- INTEGRATION: Auto Update House Data ---
    if (autoUpdateHouse && logFormData.houseId) {
      const house = houses.find(h => h.id === logFormData.houseId);
      if (house) {
        let updates: any = {};
        
        if (logFormData.type === 'Newcomer') {
          updates = {
            headOfFamily: logFormData.name,
            phone: logFormData.phone,
            occupants: logFormData.details.familyCount,
            status: 'Occupied',
            residenceType: logFormData.details.residenceType,
            religion: logFormData.details.religion,
            // Reset vulnerable counts based on log
            babyCount: logFormData.details.vulnerability.includes('Bayi') ? 1 : 0,
            toddlerCount: logFormData.details.vulnerability.includes('Balita') ? 1 : 0,
            pregnantCount: logFormData.details.vulnerability.includes('Ibu Hamil') ? 1 : 0,
            elderlyCount: logFormData.details.vulnerability.includes('Lansia') ? 1 : 0,
            widowCount: logFormData.details.vulnerability.includes('Janda') ? 1 : 0,
          };
        } else if (logFormData.type === 'MovedOut') {
          updates = {
            status: 'Empty',
            headOfFamily: '-',
            occupants: 0,
            phone: '',
            babyCount: 0,
            toddlerCount: 0,
            pregnantCount: 0,
            elderlyCount: 0,
            widowCount: 0,
          };
        } else if (logFormData.type === 'Birth') {
          updates = {
            occupants: (house.occupants || 0) + 1,
            babyCount: (house.babyCount || 0) + 1
          };
        } else if (logFormData.type === 'Death') {
          updates = {
            occupants: Math.max(0, (house.occupants || 0) - 1),
            // We don't know who died, but we can decrease total
          };
        }

        if (Object.keys(updates).length > 0) {
          await updateHouseData(house.id, updates);
        }
      }
    }

    setIsLogModalOpen(false);
    setEditingLogId(null);
    // Reset log form
    setLogFormData({
      type: 'Newcomer',
      name: '',
      phone: '',
      houseId: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      details: {
        previousAddress: '',
        reasonForMoving: '',
        familyCount: 1,
        familyMembers: [],
        residenceType: 'Tetap',
        religion: '',
        vulnerability: [],
        kkNumber: '',
        jobCategory: '',
        education: '',
        ownerName: '',
        ownerPhone: '',
        newAddress: '',
        fatherName: '',
        motherName: '',
        gender: 'Laki-laki',
        causeOfDeath: '',
        placeOfDeath: ''
      }
    });
  };

  const handleDeleteLog = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Log Mutasi',
      message: 'Apakah Anda yakin ingin menghapus catatan mutasi ini? Data yang sudah dihapus tidak dapat dikembalikan.',
      confirmLabel: 'Hapus',
      isDanger: true
    });

    if (isConfirmed) {
      await deletePopulationLogFromDb(id);
      toast.success('Log mutasi berhasil dihapus.');
    }
  };

  const chartData = useMemo(() => {
    return [...reports].sort((a, b) => a.month.localeCompare(b.month)).map(r => ({
      name: r.month,
      total: r.initialPopulation + r.birthCount + r.newcomerCount - r.movedOutCount - (r.deathCount || 0),
      mutasi: r.birthCount + r.newcomerCount - r.movedOutCount - (r.deathCount || 0)
    })).slice(-6);
  }, [reports]);

  const currentMonthLogStats = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const thisMonthLogs = populationLogs.filter(l => l.date && l.date.startsWith(currentMonth));
    return {
      newcomer: thisMonthLogs.filter(l => l.type === 'Newcomer').length,
      movedOut: thisMonthLogs.filter(l => l.type === 'MovedOut').length,
      birth: thisMonthLogs.filter(l => l.type === 'Birth').length,
      death: thisMonthLogs.filter(l => l.type === 'Death').length,
      pendingVerification: populationLogs.filter(l => l.verificationStatus === 'Pending').length
    };
  }, [populationLogs]);

  const filteredLogs = useMemo(() => {
    return populationLogs.filter(log => {
      const matchesSearch = (log.name || '').toLowerCase().includes(logSearchTerm.toLowerCase()) || 
                           (log.houseId || '').toLowerCase().includes(logSearchTerm.toLowerCase()) ||
                           (log.description || '').toLowerCase().includes(logSearchTerm.toLowerCase());
      const matchesFilter = logTypeFilter === 'All' || log.type === logTypeFilter;
      
      let matchesStatus = true;
      if (logStatusFilter === 'Unprocessed') {
        matchesStatus = !log.isGenerated;
      } else if (logStatusFilter === 'Processed') {
        matchesStatus = !!log.isGenerated;
      }

      let matchesVerification = true;
      if (verificationFilter !== 'All') {
        matchesVerification = (log.verificationStatus || 'Approved') === verificationFilter;
      }

      let matchesDate = true;
      if (startDateFilter) {
        matchesDate = matchesDate && log.date >= startDateFilter;
      }
      if (endDateFilter) {
        matchesDate = matchesDate && log.date <= endDateFilter;
      }
      
      return matchesSearch && matchesFilter && matchesStatus && matchesVerification && matchesDate;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [populationLogs, logSearchTerm, logTypeFilter, logStatusFilter, verificationFilter, startDateFilter, endDateFilter]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  // LIVE STATS (from houses) to match Dashboard/ResidentManager
  const liveStats = useMemo(() => {
    let totalSoul = 0;
    let totalPregnant = 0;
    let totalBaby = 0;
    let totalToddler = 0;
    let totalChild = 0;
    let totalTeenager = 0;
    let totalAdult = 0;
    let totalElderly = 0;
    let totalWidow = 0;
    let totalDisability = 0;
    let totalOrphan = 0;

    houses.forEach(h => {
      if (h.status === 'Occupied') {
        totalSoul += Math.max(h.occupants || 1, 1 + (h.familyMembers?.length || 0));
        totalPregnant += (h.pregnantCount || 0);
        totalBaby += (h.babyCount || 0);
        totalToddler += (h.toddlerCount || 0);
        totalChild += (h.childCount || 0);
        totalTeenager += (h.teenagerCount || 0);
        totalAdult += (h.adultCount || 0);
        totalElderly += (h.elderlyCount || 0);
        totalWidow += (h.widowCount || 0);
        totalDisability += (h.disabilityCount || 0);
        totalOrphan += (h.orphanCount || 0);
      }
    });

    return {
      totalSoul,
      vulnerableTotal: totalPregnant + totalBaby + totalToddler + totalDisability + totalOrphan + totalWidow,
      totalPregnant, totalBaby, totalToddler, totalChild, totalTeenager, totalAdult, totalElderly, totalWidow, totalDisability, totalOrphan
    };
  }, [houses]);

  const latestReport = reports[reports.length - 1];
  const totalPopulation = latestReport ? (latestReport.initialPopulation + latestReport.birthCount + latestReport.newcomerCount - latestReport.movedOutCount - (latestReport.deathCount || 0)) : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xs">
        <div>
          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">Kependudukan RT 02</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">Mutasi & Laporan Penduduk</h2>
          <p className="text-slate-500 text-xs font-semibold mt-1">Sistem rekapitulasi data demografi, arsip laporan bulanan, dan audit log mutasi warga.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50 w-full md:w-auto">
          {[
            { id: 'overview', label: 'Ringkasan', icon: BarChart3 },
            { id: 'reports', label: 'Laporan Bulanan', icon: FileText },
            { id: 'logs', label: 'Log Mutasi', icon: Clock }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${
                  isActive 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Sub-header Context-Aware Action Ribbon */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200/40 rounded-2xl"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {activeTab === 'overview' && 'Modul Ringkasan & Analitik Demografi'}
              {activeTab === 'reports' && 'Modul Arsip Laporan & Rekap Bulanan'}
              {activeTab === 'logs' && 'Modul Riwayat Log Mutasi Warga'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'overview' && (
              <button 
                onClick={() => generatePopulationReportExcel(reports, populationLogs)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs active:scale-95"
              >
                <Download size={14} className="text-indigo-600" /> Ekspor Excel
              </button>
            )}
            
            {activeTab === 'reports' && (
              <>
                <button 
                  onClick={handleGenerateFromLog} 
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100/60 transition-all shadow-xs active:scale-95"
                >
                  <FileText size={14} className="text-emerald-600" /> Generate Log Otomatis
                </button>
                <button 
                  onClick={() => {
                    setFormData({
                      month: new Date().toISOString().slice(0, 7),
                      year: new Date().getFullYear(),
                      initialPopulation: 0,
                      birthCount: 0,
                      deathCount: 0,
                      newcomerCount: 0,
                      movedOutCount: 0,
                      maleCount: 0,
                      femaleCount: 0,
                      seasonalCount: 0,
                      seasonalMaleCount: 0,
                      seasonalFemaleCount: 0,
                      pregnantCount: 0,
                      babyCount: 0,
                      toddlerCount: 0,
                      teenagerCount: 0,
                      adultCount: 0,
                      elderlyCount: 0,
                      childCount: 0,
                      widowCount: 0,
                      disabilityCount: 0,
                      orphanCount: 0,
                    });
                    setEditingReportId(null);
                    setIsModalOpen(true);
                  }} 
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/10 transition-all active:scale-95"
                >
                  <Plus size={14} /> Tambah Laporan Manual
                </button>
              </>
            )}

            {activeTab === 'logs' && (
              <>
                <button 
                  onClick={handleSyncAllResidents}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-all shadow-xs active:scale-95"
                  title="Sinkronkan data warga saat ini ke log"
                >
                  <RefreshCw size={14} className="text-indigo-600 animate-spin-slow" /> Sinkron Data
                </button>
                <button 
                  onClick={handleBulkMarkLogsProcessed}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all active:scale-95"
                  title="Bersihkan Log Lama"
                >
                  <Clock size={14} /> Bersihkan Log Lama
                </button>
                <button 
                  onClick={() => {
                    setLogFormData({
                      type: 'Newcomer',
                      name: '',
                      phone: '',
                      houseId: '',
                      date: new Date().toISOString().split('T')[0],
                      description: '',
                      details: {
                        previousAddress: '',
                        reasonForMoving: '',
                        familyCount: 1,
                        familyMembers: [],
                        residenceType: 'Tetap',
                        religion: '',
                        vulnerability: [],
                        kkNumber: '',
                        jobCategory: '',
                        education: '',
                        ownerName: '',
                        ownerPhone: '',
                        newAddress: '',
                        fatherName: '',
                        motherName: '',
                        gender: 'Laki-laki',
                        causeOfDeath: '',
                        placeOfDeath: ''
                      }
                    });
                    setEditingLogId(null);
                    setIsLogModalOpen(true);
                  }} 
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10 active:scale-95"
                >
                  <Plus size={14} /> Tambah Log Mutasi
                </button>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Primary Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Quick Stats Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={20} /></div>
                  <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Terdaftar</span>
                </div>
                <h3 className="text-3xl font-black text-slate-900">{liveStats.totalSoul} <span className="text-xs font-bold text-slate-400">Jiwa</span></h3>
                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                  <TrendingUp size={12} /> <span>Data Warga Real-time</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Heart size={20} /></div>
                  <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Rentan</span>
                </div>
                <h3 className="text-3xl font-black text-slate-900">{liveStats.vulnerableTotal} <span className="text-xs font-bold text-slate-400">Jiwa</span></h3>
                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-500">
                  <Activity size={12} /> <span>Prioritas Bantuan & Layanan</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Baby size={20} /></div>
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Kelahiran</span>
                </div>
                <h3 className="text-3xl font-black text-slate-900">+{latestReport?.birthCount || 0} <span className="text-xs font-bold text-slate-400">Bulan Ini</span></h3>
                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                  <TrendingUp size={12} /> <span>Pertumbuhan Alami Positif</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><ArrowRight size={20} /></div>
                  <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Mutasi Keluar</span>
                </div>
                <h3 className="text-3xl font-black text-slate-900">-{latestReport?.movedOutCount || 0} <span className="text-xs font-bold text-slate-400">Jiwa</span></h3>
                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-amber-600">
                  <TrendingDown size={12} /> <span>Pindah Domisili Keluar</span>
                </div>
              </div>
            </div>

            {/* Area Chart Section */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Tren Pertumbuhan Penduduk</h3>
                  <p className="text-[11px] text-slate-500 font-semibold">Visualisasi pergeseran total jiwa dalam 6 periode terakhir</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100"><BarChart3 size={18} className="text-slate-400" /></div>
              </div>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 'bold'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgb(0 0 0 / 0.06)' }}
                      itemStyle={{ fontWeight: 'bold', fontSize: 12 }}
                      labelStyle={{ fontWeight: 'bold', color: '#6366f1', marginBottom: 4 }}
                    />
                    <Area type="monotone" dataKey="total" name="Total Penduduk" stroke="#6366f1" strokeWidth={3.5} fillOpacity={1} fill="url(#colorTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Live Demographic Metrics Section */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Accessibility size={18} className="text-indigo-600" /> Distribusi Kelompok Usia & Demografi Terdaftar
                </h3>
                <p className="text-xs text-slate-500 font-semibold">Segmentasi data real-time penghuni aktif wilayah RT 02</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Age demographics */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Segmentasi Usia & Pendidikan Warga</h4>
                  {[
                    { label: 'Bayi & Balita (0-5 tahun)', count: liveStats.totalBaby + liveStats.totalToddler, colorClass: 'bg-emerald-500', dotClass: 'bg-emerald-500' },
                    { label: 'Anak-anak (6-12 tahun)', count: liveStats.totalChild, colorClass: 'bg-blue-500', dotClass: 'bg-blue-500' },
                    { label: 'Remaja (13-18 tahun)', count: liveStats.totalTeenager, colorClass: 'bg-indigo-500', dotClass: 'bg-indigo-500' },
                    { label: 'Dewasa (19-59 tahun)', count: liveStats.totalAdult, colorClass: 'bg-slate-600', dotClass: 'bg-slate-600' },
                    { label: 'Lansia (60+ tahun)', count: liveStats.totalElderly, colorClass: 'bg-amber-500', dotClass: 'bg-amber-500' }
                  ].map((item, idx) => {
                    const pct = liveStats.totalSoul > 0 ? (item.count / liveStats.totalSoul) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-1.5 p-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-700 flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${item.dotClass}`} />
                            {item.label}
                          </span>
                          <span className="text-slate-500 font-black">{item.count} <span className="text-[10px] text-slate-400 font-bold">Jiwa ({pct.toFixed(1)}%)</span></span>
                        </div>
                        <div className="w-full bg-slate-50 h-2.5 rounded-full overflow-hidden border border-slate-150">
                          <div 
                            className={`${item.colorClass} h-full rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Right Column: Key Vulnerabilities & Special Status */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Status Proteksi Sosial & Jaring Pengaman</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Penyandang Disabilitas', count: liveStats.totalDisability, icon: Accessibility, textClass: 'text-rose-600', bgClass: 'bg-rose-50 border-rose-100', badge: 'Disabilitas' },
                      { label: 'Ibu Hamil', count: liveStats.totalPregnant, icon: Heart, textClass: 'text-emerald-600', bgClass: 'bg-emerald-50 border-emerald-100', badge: 'Kesehatan Ibu' },
                      { label: 'Anak Yatim / Piatu', count: liveStats.totalOrphan, icon: User, textClass: 'text-indigo-600', bgClass: 'bg-indigo-50 border-indigo-100', badge: 'Yatim/Piatu' },
                      { label: 'Status Janda / Duda', count: liveStats.totalWidow, icon: Users, textClass: 'text-amber-600', bgClass: 'bg-amber-50 border-amber-100', badge: 'Layanan Sosial' }
                    ].map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div key={idx} className={`flex flex-col justify-between p-4 rounded-2xl border ${item.bgClass} transition-all hover:scale-[1.02]`}>
                          <div className="flex items-center justify-between">
                            <div className={`p-2 bg-white rounded-xl ${item.textClass} shadow-xs`}>
                              <Icon size={16} />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">{item.badge}</span>
                          </div>
                          <div className="mt-4">
                            <h5 className="text-[11px] font-bold text-slate-500 leading-snug">{item.label}</h5>
                            <p className={`text-2xl font-black ${item.textClass} mt-1`}>
                              {item.count} <span className="text-xs font-bold text-slate-400 ml-0.5">Jiwa</span>
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'reports' && (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Quick Stat Cards for Reports */}
            {(() => {
              const currentYearStr = new Date().getFullYear().toString();
              const thisYearReports = (reports || []).filter(r => r.year?.toString() === currentYearStr || r.month?.startsWith(currentYearStr));
              const totalBirthsThisYear = thisYearReports.reduce((acc, r) => acc + (r.birthCount || 0), 0);
              const totalNewcomersThisYear = thisYearReports.reduce((acc, r) => acc + (r.newcomerCount || 0), 0);
              const avgPopulation = reports.length > 0 
                ? Math.round(reports.reduce((acc, r) => acc + (r.initialPopulation + r.birthCount + r.newcomerCount - r.movedOutCount - (r.deathCount || 0)), 0) / reports.length)
                : 0;

              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Arsip Laporan</p>
                      <p className="text-xl font-black text-slate-800">{reports.length} <span className="text-xs font-semibold text-slate-400">Periode</span></p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                      <Baby size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Lahir Thn {currentYearStr}</p>
                      <p className="text-xl font-black text-emerald-600">+{totalBirthsThisYear} <span className="text-xs font-semibold text-emerald-400">Jiwa</span></p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Masuk Thn {currentYearStr}</p>
                      <p className="text-xl font-black text-blue-600">+{totalNewcomersThisYear} <span className="text-xs font-semibold text-blue-400">Jiwa</span></p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                      <Activity size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rata-Rata Jiwa / Bulan</p>
                      <p className="text-xl font-black text-slate-800">{avgPopulation} <span className="text-xs font-semibold text-slate-400">Warga</span></p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Reports Helper Banner */}
            <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent p-5 rounded-3xl border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText size={14} className="text-indigo-600" /> Automasi & Arsip Laporan Bulanan
                </h4>
                <p className="text-slate-600 text-xs font-medium leading-relaxed max-w-2xl">
                  Sistem mendukung generasi laporan otomatis berdasarkan seluruh kegiatan mutasi warga. Tekan <strong>Generate Log Otomatis</strong> untuk mengompilasi rekapitulasi periode terkini secara presisi!
                </p>
              </div>
            </div>

            {/* Filter Bar & Controls */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={reportSearchTerm}
                    onChange={(e) => setReportSearchTerm(e.target.value)}
                    placeholder="Cari bulan (mis: Juni, 2026, 06)..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  />
                  {reportSearchTerm && (
                    <button onClick={() => setReportSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <XCircle size={14} />
                    </button>
                  )}
                </div>

                {/* Filter Tahun */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tahun:</span>
                  <select
                    value={reportYearFilter}
                    onChange={(e) => setReportYearFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="All">Semua Tahun</option>
                    {Array.from(new Set((reports || []).map(r => r.year || (r.month ? parseInt(r.month.split('-')[0]) : null)).filter(Boolean)))
                      .sort((a, b) => (b as number) - (a as number))
                      .map(y => (
                        <option key={y} value={y?.toString()}>{y}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* View Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
                <button 
                  onClick={() => setViewMode('table')} 
                  className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white shadow-xs text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Tampilan Tabel"
                >
                  <List size={16}/>
                </button>
                <button 
                  onClick={() => setViewMode('grid')} 
                  className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-xs text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Tampilan Grid"
                >
                  <LayoutGrid size={16}/>
                </button>
              </div>
            </div>

            {/* Filtered & Sorted Reports List */}
            {(() => {
              // 1. Sort Descending by Month
              let processedReports = [...(reports || [])].sort((a, b) => (b.month || '').localeCompare(a.month || ''));

              // 2. Filter by Year
              if (reportYearFilter !== 'All') {
                processedReports = processedReports.filter(r => (r.year?.toString() === reportYearFilter) || (r.month && r.month.startsWith(reportYearFilter)));
              }

              // 3. Filter by Search Term
              if (reportSearchTerm.trim()) {
                const term = reportSearchTerm.toLowerCase();
                processedReports = processedReports.filter(r => {
                  const indoMonth = formatIndonesianMonthYear(r.month).toLowerCase();
                  return r.month.toLowerCase().includes(term) || indoMonth.includes(term) || (r.year && r.year.toString().includes(term));
                });
              }

              // Duplication Check
              const monthCounts: Record<string, number> = {};
              processedReports.forEach(r => {
                monthCounts[r.month] = (monthCounts[r.month] || 0) + 1;
              });

              return (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/40">
                    <div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight">Daftar Laporan Bulanan</h3>
                      <p className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
                        Menampilkan {processedReports.length} dari {reports.length} Rekapitulasi Berkas Kependudukan
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleAutoGenerateAllYearReports}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                        title="Hapus laporan lama & generate ulang laporan Januari-Agustus secara bersih & presisi"
                      >
                        <RefreshCw size={14} className={isGeneratingLogs ? "animate-spin" : ""} />
                        Reset & Auto-Generate 2026
                      </button>

                      <button
                        type="button"
                        onClick={() => generatePopulationReportExcel(processedReports, populationLogs)}
                        disabled={processedReports.length === 0}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                        title="Unduh Seluruh Rekapitulasi Laporan Bulanan ke dalam 1 File Excel (.xlsx)"
                      >
                        <FileUp size={15} />
                        Export Semua Periode (.xlsx)
                      </button>
                    </div>
                  </div>
                  
                  {viewMode === 'table' ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100">
                          <tr>
                            <th className="p-5 text-left text-xs uppercase tracking-widest text-slate-400">Periode Bulan</th>
                            <th className="p-5 text-right text-xs uppercase tracking-widest text-slate-400">Warga Awal</th>
                            <th className="p-5 text-right text-xs uppercase tracking-widest text-slate-400">Kelahiran</th>
                            <th className="p-5 text-right text-xs uppercase tracking-widest text-slate-400">Kematian</th>
                            <th className="p-5 text-right text-xs uppercase tracking-widest text-slate-400">Masuk</th>
                            <th className="p-5 text-right text-xs uppercase tracking-widest text-slate-400">Keluar</th>
                            <th className="p-5 text-right text-xs uppercase tracking-widest text-slate-400">Warga Akhir</th>
                            <th className="p-5 text-center text-xs uppercase tracking-widest text-slate-400">Aksi & Dokumen</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {processedReports && processedReports.length > 0 ? processedReports.map(r => {
                            const isDuplicate = monthCounts[r.month] > 1;
                            const finalPop = r.initialPopulation + r.birthCount + r.newcomerCount - r.movedOutCount - (r.deathCount || 0);

                            return (
                              <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="p-5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xs border border-indigo-100/50 shadow-2xs">
                                      {r.month.split('-')[1]}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="font-black text-slate-800 text-sm">{formatIndonesianMonthYear(r.month)}</p>
                                        {isDuplicate && (
                                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-bold text-[9px] uppercase tracking-wider inline-flex items-center gap-1" title="Terdapat lebih dari 1 arsip laporan untuk bulan ini">
                                            <AlertCircle size={10} /> Duplikat
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Kode Periode: {r.month}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-5 text-right font-bold text-slate-600">{r.initialPopulation}</td>
                                <td className="p-5 text-right">
                                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-black text-xs inline-block">+{r.birthCount}</span>
                                </td>
                                <td className="p-5 text-right">
                                  <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg font-black text-xs inline-block">-{r.deathCount || 0}</span>
                                </td>
                                <td className="p-5 text-right">
                                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-black text-xs inline-block">+{r.newcomerCount}</span>
                                </td>
                                <td className="p-5 text-right">
                                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg font-black text-xs inline-block">-{r.movedOutCount}</span>
                                </td>
                                <td className="p-5 text-right">
                                  <div className="flex flex-col items-end">
                                    <span className="font-black text-slate-900 text-base">{finalPop}</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Total Jiwa</span>
                                  </div>
                                </td>
                                <td className="p-5 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {/* Edit Button */}
                                    <button 
                                      onClick={() => handleEditReport(r)}
                                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-200/60 transition-all"
                                      title="Edit Laporan"
                                    >
                                      <Edit2 size={15} />
                                    </button>

                                    {/* Download Excel */}
                                    <button 
                                      onClick={() => generatePopulationReportExcel(r, populationLogs)}
                                      className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200/60 rounded-xl transition-all"
                                      title="Download File Excel (.xlsx) Rekapitulasi & Mutasi"
                                    >
                                      <FileUp size={15} className="text-emerald-600" />
                                    </button>

                                    {/* Download PDF Rekap Demografi (Red) */}
                                    <button 
                                      onClick={() => generatePopulationReportPDF(r, pdfConfig)}
                                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/60 rounded-xl transition-all"
                                      title="Download PDF Rekapitulasi Demografi RT"
                                    >
                                      <Download size={15} className="text-rose-500" />
                                    </button>

                                    {/* Download PDF Laporan Mutasi Resmi Kelurahan (Green) */}
                                    <button 
                                      onClick={() => generateMutationReportPDF(r, populationLogs, pdfConfig)}
                                      className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200/60 rounded-xl transition-all"
                                      title="Cetak Laporan Mutasi Bulanan Resmi PDF (Format Kelurahan & Kop Surat)"
                                    >
                                      <FileText size={15} className="text-emerald-600" />
                                    </button>

                                    {/* Delete Button */}
                                    <button 
                                      onClick={async () => {
                                        const isConfirmed = await confirm({
                                          title: 'Hapus Laporan',
                                          message: `Apakah Anda yakin ingin menghapus laporan bulan ${formatIndonesianMonthYear(r.month)}? Log mutasi terkait akan kembali berstatus Belum Dilaporkan.`,
                                          confirmLabel: 'Hapus Laporan',
                                          isDanger: true
                                        });
                                        if (isConfirmed) {
                                          onDeleteReport(r.id);
                                          toast.success('Laporan berhasil dihapus.');
                                        }
                                      }} 
                                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 border border-transparent rounded-xl transition-all"
                                      title="Hapus Laporan"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }) : (
                            <tr>
                              <td colSpan={8} className="p-16 text-center">
                                <div className="flex flex-col items-center gap-3">
                                  <div className="p-4 bg-slate-50 rounded-full text-slate-300"><FileText size={40} /></div>
                                  <div>
                                    <p className="font-black text-slate-800">Tidak Ada Laporan Bulanan</p>
                                    <p className="text-slate-400 text-xs font-semibold mt-1">
                                      {reportSearchTerm || reportYearFilter !== 'All' 
                                        ? 'Tidak ditemukan laporan yang sesuai dengan kata kunci atau filter tahun.'
                                        : 'Gunakan tombol Generate atau Tambah di kanan atas untuk membuat laporan pertama.'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 bg-slate-50/20">
                      {processedReports && processedReports.length > 0 ? processedReports.map(r => {
                        const isDuplicate = monthCounts[r.month] > 1;
                        const finalPop = r.initialPopulation + r.birthCount + r.newcomerCount - r.movedOutCount - (r.deathCount || 0);

                        return (
                          <div key={r.id} className="p-5 bg-white rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all group relative">
                            <div className="flex justify-between items-start mb-5">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-indigo-50 rounded-2xl shadow-2xs flex items-center justify-center font-black text-indigo-600 border border-indigo-100">
                                  {r.month.split('-')[1]}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="font-black text-slate-800 text-sm">{formatIndonesianMonthYear(r.month)}</h4>
                                    {isDuplicate && (
                                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-md font-bold text-[8px] uppercase tracking-wider" title="Duplikat">
                                        Duplikat
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{r.month}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleEditReport(r)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Laporan"><Edit2 size={14}/></button>
                                <button onClick={() => generatePopulationReportExcel(r, populationLogs)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Download Excel"><FileUp size={14} className="text-emerald-600" /></button>
                                <button onClick={() => generatePopulationReportPDF(r, pdfConfig)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Download Rekap PDF"><Download size={14} className="text-rose-500" /></button>
                                <button onClick={() => generateMutationReportPDF(r, populationLogs, pdfConfig)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Cetak PDF Mutasi Kelurahan"><FileText size={14} className="text-emerald-600" /></button>
                                <button 
                                  onClick={async () => {
                                    const isConfirmed = await confirm({
                                      title: 'Hapus Laporan',
                                      message: `Apakah Anda yakin ingin menghapus laporan bulan ${formatIndonesianMonthYear(r.month)}?`,
                                      confirmLabel: 'Hapus',
                                      isDanger: true
                                    });
                                    if (isConfirmed) {
                                      onDeleteReport(r.id);
                                      toast.success('Laporan berhasil dihapus.');
                                    }
                                  }} 
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                                  title="Hapus Laporan"
                                >
                                  <Trash2 size={14}/>
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <div className="bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Awal Bulan</p>
                                <p className="font-black text-slate-800 text-sm">{r.initialPopulation}</p>
                              </div>
                              <div className="bg-indigo-50/40 p-3 rounded-2xl border border-indigo-100">
                                <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1">Akhir Bulan</p>
                                <p className="font-extrabold text-indigo-600 text-sm">{finalPop}</p>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 grid grid-cols-4 text-center text-[10px] font-extrabold">
                              <div>
                                <span className="block text-emerald-600">Lahir</span>
                                <span className="block mt-0.5 font-sans">+{r.birthCount}</span>
                              </div>
                              <div>
                                <span className="block text-rose-600">Wafat</span>
                                <span className="block mt-0.5 font-sans">-{r.deathCount || 0}</span>
                              </div>
                              <div>
                                <span className="block text-blue-600">Masuk</span>
                                <span className="block mt-0.5 font-sans">+{r.newcomerCount}</span>
                              </div>
                              <div>
                                <span className="block text-amber-600">Keluar</span>
                                <span className="block mt-0.5 font-sans">-{r.movedOutCount}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="col-span-full p-12 text-center">
                          <p className="font-black text-slate-700">Tidak ada laporan ditemukan</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Quick Stat Cards Header for Mutasi */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Warga Baru (Bulan Ini)</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">+{currentMonthLogStats.newcomer} <span className="text-xs font-semibold text-slate-400">Jiwa</span></p>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><User size={18} /></div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Pindah Keluar (Bulan Ini)</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">-{currentMonthLogStats.movedOut} <span className="text-xs font-semibold text-slate-400">Jiwa</span></p>
                </div>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><ArrowRight size={18} /></div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Kelahiran (Bulan Ini)</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">+{currentMonthLogStats.birth} <span className="text-xs font-semibold text-slate-400">Jiwa</span></p>
                </div>
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Baby size={18} /></div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider">Kematian (Bulan Ini)</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">-{currentMonthLogStats.death} <span className="text-xs font-semibold text-slate-400">Jiwa</span></p>
                </div>
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><Activity size={18} /></div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between col-span-2 lg:col-span-1">
                <div>
                  <p className="text-[10px] font-black text-purple-600 uppercase tracking-wider">Menunggu Verifikasi</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">{currentMonthLogStats.pendingVerification} <span className="text-xs font-semibold text-slate-400">Dokumen</span></p>
                </div>
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><AlertCircle size={18} /></div>
              </div>
            </div>

            {/* Mutation Log Toolbelt and List */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
              {/* Header & Main Search */}
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-slate-50/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Activity size={18} /></div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">Log Mutasi Warga</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Peristiwa kependudukan real-time, pengolahan & audit trail</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                  <div className="relative group w-full sm:w-56">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                    <input 
                      type="text" 
                      placeholder="Cari nama, rumah, deskripsi..."
                      value={logSearchTerm}
                      onChange={(e) => { setLogSearchTerm(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-sans"
                    />
                  </div>
                  
                  <select 
                    value={logTypeFilter}
                    onChange={(e) => { setLogTypeFilter(e.target.value as any); setCurrentPage(1); }}
                    className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer font-sans"
                  >
                    <option value="All">Semua Jenis Mutasi</option>
                    <option value="Newcomer">Warga Baru</option>
                    <option value="MovedOut">Pindah Keluar</option>
                    <option value="Birth">Kelahiran</option>
                    <option value="Death">Kematian</option>
                  </select>

                  <select 
                    value={verificationFilter}
                    onChange={(e) => { setVerificationFilter(e.target.value as any); setCurrentPage(1); }}
                    className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer font-sans"
                  >
                    <option value="All">Semua Verifikasi</option>
                    <option value="Approved">Disetujui / Sah</option>
                    <option value="Pending">Menunggu Verifikasi</option>
                    <option value="Rejected">Ditolak</option>
                  </select>
                </div>
              </div>

              {/* Extended Filters Bar: Date Range Picker */}
              <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={13} /> Periode Tanggal:
                  </span>
                  <input 
                    type="date" 
                    value={startDateFilter}
                    onChange={e => { setStartDateFilter(e.target.value); setCurrentPage(1); }}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                  />
                  <span className="text-slate-400 font-bold">s/d</span>
                  <input 
                    type="date" 
                    value={endDateFilter}
                    onChange={e => { setEndDateFilter(e.target.value); setCurrentPage(1); }}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                  />
                  {(startDateFilter || endDateFilter) && (
                    <button 
                      onClick={() => { setStartDateFilter(''); setEndDateFilter(''); setCurrentPage(1); }}
                      className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase hover:bg-slate-200 transition-all"
                    >
                      Reset Tanggal
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold">Tampilkan:</span>
                  <select 
                    value={itemsPerPage}
                    onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                  >
                    <option value={10}>10 per hal</option>
                    <option value={25}>25 per hal</option>
                    <option value={50}>50 per hal</option>
                  </select>
                </div>
              </div>

              {/* Status Filter Tabs & Bulk Actions */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/20 flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3">
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
                  {[
                    { id: 'All', label: 'Semua Status', count: populationLogs.length },
                    { id: 'Unprocessed', label: 'Belum Dilaporkan', count: populationLogs.filter(l => !l.isGenerated).length, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                    { id: 'Processed', label: 'Sudah Dilaporkan', count: populationLogs.filter(l => l.isGenerated).length, color: 'text-slate-500 bg-slate-150' }
                  ].map(statusTab => {
                    const isActive = logStatusFilter === statusTab.id;
                    return (
                      <button
                        key={statusTab.id}
                        type="button"
                        onClick={() => { setLogStatusFilter(statusTab.id as any); setCurrentPage(1); }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                          isActive 
                            ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100/50' 
                            : 'text-slate-500 hover:text-slate-850'
                        }`}
                      >
                        {statusTab.label}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                          isActive 
                            ? 'bg-indigo-50 text-indigo-700' 
                            : statusTab.color || 'bg-slate-200/70 text-slate-600'
                        }`}>
                          {statusTab.count}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Bulk Action Toolbar */}
                {selectedLogIds.length > 0 && (
                  <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 p-1.5 rounded-2xl animate-fade-in">
                    <span className="text-[10px] font-black text-indigo-700 px-2 uppercase tracking-wider">
                      {selectedLogIds.length} Terpilih
                    </span>
                    <button 
                      onClick={() => handleBulkVerifyStatus('Approved')}
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded-xl font-bold text-[10px] uppercase flex items-center gap-1 hover:bg-emerald-700 transition-all"
                      title="Setujui Verifikasi Massal"
                    >
                      <CheckCircle size={12} /> Setujui
                    </button>
                    <button 
                      onClick={() => handleBulkMarkGenerated(true)}
                      className="px-2.5 py-1 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase flex items-center gap-1 hover:bg-indigo-700 transition-all"
                      title="Tandai Sudah Lapor"
                    >
                      <RefreshCw size={12} /> Tandai Lapor
                    </button>
                    <button 
                      onClick={handleBulkDelete}
                      className="px-2.5 py-1 bg-rose-600 text-white rounded-xl font-bold text-[10px] uppercase flex items-center gap-1 hover:bg-rose-700 transition-all"
                      title="Hapus Terpilih"
                    >
                      <Trash2 size={12} /> Hapus
                    </button>
                    <button 
                      onClick={() => setSelectedLogIds([])}
                      className="px-2 py-1 text-slate-500 hover:text-slate-700 text-[10px] font-bold"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100">
                    <tr>
                      <th className="p-4 text-center w-10">
                        <button onClick={handleSelectAllOnPage} className="text-slate-400 hover:text-indigo-600">
                          {paginatedLogs.length > 0 && paginatedLogs.every(l => selectedLogIds.includes(l.id)) ? (
                            <CheckSquare size={16} className="text-indigo-600" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </th>
                      <th className="p-4 text-left text-xs uppercase tracking-widest text-slate-400">Tanggal</th>
                      <th className="p-4 text-left text-xs uppercase tracking-widest text-slate-400">Jenis Perubahan</th>
                      <th className="p-4 text-left text-xs uppercase tracking-widest text-slate-400">Nama Warga</th>
                      <th className="p-4 text-left text-xs uppercase tracking-widest text-slate-400">ID Rumah</th>
                      <th className="p-4 text-left text-xs uppercase tracking-widest text-slate-400">Rincian & Berkas</th>
                      <th className="p-4 text-center text-xs uppercase tracking-widest text-slate-400">Verifikasi</th>
                      <th className="p-4 text-center text-xs uppercase tracking-widest text-slate-400">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {paginatedLogs && paginatedLogs.length > 0 ? paginatedLogs.map((log) => {
                      const isSelected = selectedLogIds.includes(log.id);
                      return (
                        <tr key={log.id} className={`hover:bg-slate-50/50 transition-colors group ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => {
                                if (isSelected) setSelectedLogIds(selectedLogIds.filter(i => i !== log.id));
                                else setSelectedLogIds([...selectedLogIds, log.id]);
                              }}
                              className="text-slate-400 hover:text-indigo-600"
                            >
                              {isSelected ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} />}
                            </button>
                          </td>
                          <td className="p-4 font-bold text-slate-600">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-slate-400" />
                              <span className="font-mono text-xs">{new Date(log.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`
                              px-3 py-1 rounded-xl font-black text-[9px] uppercase tracking-wider inline-block
                              ${log.type === 'Newcomer' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 
                                log.type === 'MovedOut' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' : 
                                log.type === 'Birth' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/50' : 
                                'bg-rose-50 text-rose-700 border border-rose-200/50'}
                            `}>
                              {log.type === 'Newcomer' ? '✓ Warga Baru' : 
                               log.type === 'MovedOut' ? '⇄ Pindah Keluar' : 
                               log.type === 'Birth' ? '👶 Kelahiran' : '✝ Kematian'}
                            </span>
                            {log.isGenerated && (
                              <div className="mt-1">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md font-bold text-[8px] uppercase tracking-wider inline-flex items-center gap-1">
                                  <RefreshCw size={8} /> Sudah Lapor
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><User size={14}/></div>
                              <div>
                                <p className="font-extrabold text-slate-800">{log.name}</p>
                                {log.details?.familyCount && log.details.familyCount > 1 && (
                                  <p className="text-[8px] text-slate-400 font-black uppercase tracking-wide">+{log.details.familyCount - 1} Anggota Keluarga</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {(() => {
                              const targetHouse = (houses || []).find(h => h.id === log.houseId);
                              const houseLabel = targetHouse ? `Blok ${targetHouse.block}-${targetHouse.number}` : log.houseId;
                              return (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-mono text-xs font-black w-fit border border-slate-200/50" title={`ID Dokumen: ${log.houseId}`}>
                                  {houseLabel}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="p-4 max-w-xs">
                            <div className="space-y-1.5">
                              <p className="text-slate-600 text-xs font-medium italic line-clamp-1" title={log.description}>{log.description || '-'}</p>
                              
                              {log.details && (
                                <div className="text-[10px] font-bold text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-150 grid grid-cols-1 gap-1">
                                  {log.type === 'Newcomer' && (
                                    <>
                                      <div className="flex justify-between items-center border-b border-slate-200/40 pb-0.5"><span>Asal:</span> <span className="text-blue-600 font-semibold">{log.details.previousAddress}</span></div>
                                      <div className="flex justify-between items-center"><span>Status:</span> <span className="text-slate-700 font-semibold">{log.details.residenceType || 'Tetap'}</span></div>
                                    </>
                                  )}
                                  {log.type === 'MovedOut' && (
                                    <>
                                      <div className="flex justify-between items-center border-b border-slate-200/40 pb-0.5"><span>Tujuan:</span> <span className="text-amber-600 font-semibold">{log.details.newAddress}</span></div>
                                      <div className="flex justify-between items-center"><span>Alasan:</span> <span className="text-slate-700 font-semibold">{log.details.reasonForMoving}</span></div>
                                    </>
                                  )}
                                  {log.type === 'Birth' && (
                                    <>
                                      <div className="flex justify-between items-center border-b border-slate-200/40 pb-0.5"><span>Orang Tua:</span> <span className="text-emerald-600 font-semibold">{log.details.fatherName}/{log.details.motherName}</span></div>
                                      <div className="flex justify-between items-center"><span>Gender:</span> <span className="text-slate-700 font-semibold">{log.details.gender}</span></div>
                                    </>
                                  )}
                                  {log.type === 'Death' && (
                                    <>
                                      <div className="flex justify-between items-center border-b border-slate-200/40 pb-0.5"><span>Penyebab:</span> <span className="text-rose-600 font-semibold">{log.details.causeOfDeath}</span></div>
                                      <div className="flex justify-between items-center"><span>Tempat:</span> <span className="text-slate-700 font-semibold">{log.details.placeOfDeath}</span></div>
                                    </>
                                  )}
                                </div>
                              )}

                              {/* Document Attachment Button */}
                              {log.documentUrl && (
                                <a 
                                  href={log.documentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[9px] font-black uppercase border border-indigo-200/60 hover:bg-indigo-100 transition-all mt-1"
                                >
                                  <FileUp size={11} /> Lihat Berkas / Surat
                                </a>
                              )}
                            </div>
                          </td>

                          {/* Verification Status Badge */}
                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`
                                px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1
                                ${(!log.verificationStatus || log.verificationStatus === 'Approved') ? 'bg-emerald-100 text-emerald-800' :
                                  log.verificationStatus === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}
                              `}>
                                {(!log.verificationStatus || log.verificationStatus === 'Approved') ? <><CheckCircle size={10}/> Disetujui</> :
                                 log.verificationStatus === 'Pending' ? <><AlertCircle size={10}/> Menunggu</> : <><XCircle size={10}/> Ditolak</>}
                              </span>
                            </div>
                          </td>

                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Print Single Certificate PDF */}
                              <button
                                onClick={() => generateSingleMutationCertificatePDF(log, pdfConfig)}
                                className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/50 rounded-lg transition-all"
                                title="Cetak Surat Keterangan / Pengantar Mutasi (PDF)"
                              >
                                <Printer size={14} />
                              </button>

                              {log.phone && log.phone !== '-' && (
                                <button 
                                  onClick={async () => {
                                    const msg = log.type === 'Newcomer' 
                                      ? `Halo ${log.name}, Selamat Datang di Lingkungan RT 02! Kami mengonfirmasi pencatatan domisili warga baru Anda. Jika ada pertanyaan seputar iuran, siskamling, atau administrasi surat, silakan hubungi Pengurus RT.` 
                                      : log.type === 'MovedOut'
                                      ? `Halo ${log.name}, Terima kasih telah menjadi bagian dari keluarga warga RT 02. Catatan kepindahan Anda telah terdaftar secara resmi.`
                                      : `Halo ${log.name}, Pengurus RT 02 mengirimkan salam pesan mengenai data mutasi kependudukan Anda.`;
                                    
                                    const res = await sendWhatsAppViaGateway(log.phone, msg);
                                    if (res?.success) toast.success(`Pesan WhatsApp berhasil dikirim ke ${log.name}`);
                                    else toast.error(`Gagal mengirim WhatsApp: ${res?.error || 'Error'}`);
                                  }}
                                  className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 rounded-lg transition-all"
                                  title="Kirim Pesan WhatsApp Otomatis ke Warga"
                                >
                                  <MessageCircle size={14} />
                                </button>
                              )}
                              <button 
                                onClick={() => handleEditLog(log)}
                                className="p-1.5 text-slate-450 hover:text-indigo-650 hover:bg-slate-100 rounded-lg transition-all"
                                title="Edit Log"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteLog(log.id)}
                                className="p-1.5 text-slate-450 hover:text-rose-650 hover:bg-rose-50 rounded-lg transition-all"
                                title="Hapus Log"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={8} className="p-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-5 bg-slate-50 rounded-full text-slate-300"><Clock size={40} /></div>
                            <div>
                              <p className="font-black text-slate-800 text-base">Tidak ada data mutasi</p>
                              <p className="text-slate-400 text-xs font-semibold mt-1">Belum ada catatan mutasi yang terdaftar pada filter ini.</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredLogs.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <p className="text-slate-500 font-semibold">
                    Menampilkan <span className="font-bold text-slate-800">{((currentPage - 1) * itemsPerPage) + 1}</span> - <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> dari <span className="font-bold text-slate-800">{filteredLogs.length}</span> log mutasi
                  </p>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    
                    <span className="px-3 py-1 font-bold text-slate-700 bg-white border border-slate-200 rounded-xl">
                      {currentPage} / {totalPages}
                    </span>

                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Laporan Bulanan">
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
          {/* Header Info */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-3xl text-white shadow-lg shadow-indigo-600/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Formulir Laporan Bulanan</h3>
                <p className="text-indigo-100 text-xs font-medium opacity-80">Silakan lengkapi data kependudukan periode ini.</p>
              </div>
            </div>
          </div>

          {/* Periode Section */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} /> Periode Laporan
              </h4>
              <button
                type="button"
                onClick={handleGenerateFromLog}
                disabled={isGeneratingLogs}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                title="Hitung otomatis seluruh data demografi & mutasi untuk bulan ini"
              >
                <RefreshCw size={12} className={isGeneratingLogs ? "animate-spin" : ""} />
                Auto-Kalkulasi Bulan Ini
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Pilih Bulan & Tahun (YYYY-MM)</label>
                <div className="relative">
                  <input 
                    type="month" 
                    value={formData.month} 
                    onChange={e => {
                      const newMonth = e.target.value;
                      const year = newMonth ? parseInt(newMonth.split('-')[0]) : new Date().getFullYear();
                      setFormData(prev => ({ ...prev, month: newMonth, year }));
                    }} 
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Tahun</label>
                <input 
                  type="number" 
                  value={formData.year} 
                  onChange={e => setFormData({...formData, year: parseInt(e.target.value) || new Date().getFullYear()})} 
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                />
              </div>
            </div>
          </div>

          {/* Data Utama Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-5 shadow-sm">
            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={14} /> Angka Perubahan & Mutasi
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="col-span-full bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Penduduk Awal Bulan</label>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400"><Users size={18} /></div>
                  <input 
                    type="number" 
                    value={formData.initialPopulation} 
                    onChange={e => setFormData({...formData, initialPopulation: parseInt(e.target.value)})} 
                    className="flex-1 p-2 bg-transparent text-lg font-black text-slate-800 outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <label className="block text-[10px] font-bold text-emerald-600 mb-1.5 uppercase">Kelahiran (+)</label>
                  <input type="number" value={formData.birthCount} onChange={e => setFormData({...formData, birthCount: parseInt(e.target.value)})} className="w-full bg-transparent text-xl font-black text-emerald-700 outline-none" />
                </div>
                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <label className="block text-[10px] font-bold text-blue-600 mb-1.5 uppercase">Pendatang (+)</label>
                  <input type="number" value={formData.newcomerCount} onChange={e => setFormData({...formData, newcomerCount: parseInt(e.target.value)})} className="w-full bg-transparent text-xl font-black text-blue-700 outline-none" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                  <label className="block text-[10px] font-bold text-rose-600 mb-1.5 uppercase">Kematian (-)</label>
                  <input type="number" value={formData.deathCount} onChange={e => setFormData({...formData, deathCount: parseInt(e.target.value)})} className="w-full bg-transparent text-xl font-black text-rose-700 outline-none" />
                </div>
                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                  <label className="block text-[10px] font-bold text-amber-600 mb-1.5 uppercase">Pindah Keluar (-)</label>
                  <input type="number" value={formData.movedOutCount} onChange={e => setFormData({...formData, movedOutCount: parseInt(e.target.value)})} className="w-full bg-transparent text-xl font-black text-amber-700 outline-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Demografi Section */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
              <Accessibility size={14} /> Demografi Akhir Bulan
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Laki-laki</label>
                <input type="number" value={formData.maleCount} onChange={e => setFormData({...formData, maleCount: parseInt(e.target.value)})} className="w-full bg-transparent text-lg font-black text-slate-800 outline-none" />
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Perempuan</label>
                <input type="number" value={formData.femaleCount} onChange={e => setFormData({...formData, femaleCount: parseInt(e.target.value)})} className="w-full bg-transparent text-lg font-black text-slate-800 outline-none" />
              </div>
            </div>
          </div>

          {/* Musiman Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-4 shadow-sm">
            <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} /> Warga Musiman / Sewa
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Total</label>
                <input type="number" value={formData.seasonalCount} onChange={e => setFormData({...formData, seasonalCount: parseInt(e.target.value)})} className="w-full bg-transparent font-bold text-slate-800 outline-none" />
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Laki-laki</label>
                <input type="number" value={formData.seasonalMaleCount} onChange={e => setFormData({...formData, seasonalMaleCount: parseInt(e.target.value)})} className="w-full bg-transparent font-bold text-slate-800 outline-none" />
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Perempuan</label>
                <input type="number" value={formData.seasonalFemaleCount} onChange={e => setFormData({...formData, seasonalFemaleCount: parseInt(e.target.value)})} className="w-full bg-transparent font-bold text-slate-800 outline-none" />
              </div>
            </div>
          </div>

          {/* Kelompok Rentan Section */}
          <div className="bg-rose-50/30 p-6 rounded-[2rem] border border-rose-100 space-y-4">
            <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
              <Heart size={14} /> Kelompok Rentan & Prioritas
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Hamil', key: 'pregnantCount', icon: <Activity size={12}/> },
                { label: 'Bayi', key: 'babyCount', icon: <Baby size={12}/> },
                { label: 'Balita', key: 'toddlerCount', icon: <Baby size={12}/> },
                { label: 'Anak', key: 'childCount', icon: <User size={12}/> },
                { label: 'Remaja', key: 'teenagerCount', icon: <User size={12}/> },
                { label: 'Dewasa', key: 'adultCount', icon: <User size={12}/> },
                { label: 'Lansia', key: 'elderlyCount', icon: <Accessibility size={12}/> },
                { label: 'Janda', key: 'widowCount', icon: <Heart size={12}/> },
                { label: 'Disabilitas', key: 'disabilityCount', icon: <Accessibility size={12}/> },
                { label: 'Yatim/Piatu', key: 'orphanCount', icon: <User size={12}/> }
              ].map(field => (
                <div key={field.key} className="bg-white p-3 rounded-2xl border border-rose-100 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-1 text-rose-400">
                    {field.icon}
                    <label className="block text-[9px] font-black uppercase tracking-tighter">{field.label}</label>
                  </div>
                  <input 
                    type="number" 
                    value={(formData as any)[field.key]} 
                    onChange={e => setFormData({...formData, [field.key]: parseInt(e.target.value) || 0})} 
                    className="w-full bg-transparent text-sm font-black text-slate-800 outline-none" 
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-slate-900 p-6 rounded-[2rem] text-white">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kalkulasi Akhir</p>
              <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold">Otomatis</div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-black">
                  {formData.initialPopulation + formData.birthCount + formData.newcomerCount - formData.movedOutCount - (formData.deathCount || 0)}
                  <span className="text-sm font-bold text-slate-400 ml-2">Jiwa</span>
                </p>
                <p className="text-xs text-slate-500 font-medium mt-1">Total penduduk yang akan dilaporkan</p>
              </div>
              <TrendingUp className="text-emerald-500 mb-2" size={32} />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              Simpan Laporan
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} title="Tambah Log Mutasi Warga" maxWidth="max-w-2xl">
        <form onSubmit={handleAddLog} className="space-y-6 max-h-[85vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
          {/* Header Info */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 rounded-3xl text-white shadow-lg shadow-emerald-600/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <Activity size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Catat Mutasi Penduduk</h3>
                <p className="text-emerald-100 text-xs font-medium opacity-80">Rekam setiap perubahan status warga secara real-time.</p>
              </div>
            </div>
          </div>

          {/* Jenis Mutasi Section */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
              <Filter size={14} /> Jenis Mutasi
            </h4>
            <div className="grid grid-cols-4 gap-3">
              {[
                { id: 'Newcomer', label: 'Masuk', color: 'emerald' },
                { id: 'MovedOut', label: 'Pindah', color: 'amber' },
                { id: 'Birth', label: 'Lahir', color: 'blue' },
                { id: 'Death', label: 'Wafat', color: 'rose' }
              ].map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setLogFormData({ ...logFormData, type: type.id as any })}
                  className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all flex flex-col items-center gap-1 ${
                    logFormData.type === type.id 
                      ? `bg-${type.color}-600 text-white border-${type.color}-600 shadow-md scale-105` 
                      : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Data Identitas Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-5 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} /> Identitas Utama
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="col-span-full">
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Nama Lengkap Warga</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><User size={16} /></div>
                  <input 
                    type="text" 
                    value={logFormData.name} 
                    onChange={e => setLogFormData({ ...logFormData, name: e.target.value })} 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Blok & Nomor Rumah</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><LayoutGrid size={16} /></div>
                  <input 
                    type="text" 
                    value={logFormData.houseId} 
                    onChange={e => setLogFormData({ ...logFormData, houseId: e.target.value.toUpperCase() })} 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                    placeholder="C7-02"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">No. WhatsApp</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><Activity size={16} /></div>
                  <input 
                    type="text" 
                    value={logFormData.phone} 
                    onChange={e => setLogFormData({ ...logFormData, phone: e.target.value })} 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                    placeholder="0812..."
                  />
                </div>
              </div>
              <div className="col-span-full">
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Tanggal Kejadian</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><Calendar size={16} /></div>
                  <input 
                    type="date" 
                    value={logFormData.date} 
                    onChange={e => setLogFormData({ ...logFormData, date: e.target.value })} 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Details Section */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-5">
            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
              <List size={14} /> Detail Informasi Tambahan
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {logFormData.type === 'Newcomer' && (
                <>
                  <div className="col-span-full">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Alamat Asal</label>
                    <input 
                      type="text" 
                      value={logFormData.details.previousAddress} 
                      onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, previousAddress: e.target.value } })} 
                      className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    />
                  </div>
                  {logFormData.details.residenceType !== 'Tetap' && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="col-span-full grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Nama Pemilik Rumah</label>
                        <input 
                          type="text" 
                          value={logFormData.details.ownerName} 
                          onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, ownerName: e.target.value } })} 
                          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Kontak Pemilik Rumah</label>
                        <input 
                          type="text" 
                          value={logFormData.details.ownerPhone} 
                          onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, ownerPhone: e.target.value } })} 
                          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                        />
                      </div>
                    </motion.div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Alasan Pindah</label>
                    <input 
                      type="text" 
                      value={logFormData.details.reasonForMoving} 
                      onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, reasonForMoving: e.target.value } })} 
                      className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Jumlah Anggota Keluarga</label>
                    <input 
                      type="number" 
                      value={logFormData.details.familyCount} 
                      onChange={e => {
                        const count = parseInt(e.target.value) || 1;
                        const newMembers = count > 1 ? Array(count - 1).fill(null).map((_, i) => logFormData.details.familyMembers[i] || { name: '', relationship: '', nik: '' }) : [];
                        setLogFormData({ 
                          ...logFormData, 
                          details: { 
                            ...logFormData.details, 
                            familyCount: count,
                            familyMembers: newMembers
                          } 
                        });
                      }} 
                      className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                      min="1"
                    />
                  </div>
                {logFormData.details.familyCount > 1 && (
                  <div className="col-span-2 space-y-3 p-4 bg-slate-100/50 rounded-2xl border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Biodata Anggota Keluarga Lainnya</p>
                    {logFormData.details.familyMembers.map((member, idx) => (
                      <div key={idx} className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <input 
                          placeholder="Nama Lengkap"
                          className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
                          value={member.name}
                          onChange={e => {
                            const updated = [...logFormData.details.familyMembers];
                            updated[idx].name = e.target.value;
                            setLogFormData({ ...logFormData, details: { ...logFormData.details, familyMembers: updated } });
                          }}
                        />
                        <select 
                          className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
                          value={member.relationship}
                          onChange={e => {
                            const updated = [...logFormData.details.familyMembers];
                            updated[idx].relationship = e.target.value;
                            setLogFormData({ ...logFormData, details: { ...logFormData.details, familyMembers: updated } });
                          }}
                        >
                          <option value="">Hubungan</option>
                          <option value="Istri">Istri</option>
                          <option value="Anak">Anak</option>
                          <option value="Orang Tua">Orang Tua</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Status Hunian</label>
                    <select 
                      value={logFormData.details.residenceType} 
                      onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, residenceType: e.target.value as any } })} 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                    >
                      <option value="Tetap">Tetap</option>
                      <option value="Rumah Keluarga">Rumah Keluarga / Ikut Saudara</option>
                      <option value="Sewa">Sewa / Kontrak</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Agama</label>
                    <select 
                      value={logFormData.details.religion} 
                      onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, religion: e.target.value } })} 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                    >
                      <option value="">Pilih Agama...</option>
                      <option value="Islam">Islam</option>
                      <option value="Kristen">Kristen</option>
                      <option value="Katolik">Katolik</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Budha">Budha</option>
                      <option value="Konghucu">Konghucu</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">No. KK</label>
                    <input 
                      type="text" 
                      value={logFormData.details.kkNumber} 
                      onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, kkNumber: e.target.value } })} 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Pendidikan</label>
                    <select 
                      value={logFormData.details.education} 
                      onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, education: e.target.value } })} 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                    >
                      <option value="">Pilih Pendidikan...</option>
                      <option value="SD">SD</option>
                      <option value="SMP">SMP</option>
                      <option value="SMA/SMK">SMA/SMK</option>
                      <option value="D3">D3</option>
                      <option value="S1">S1</option>
                      <option value="S2">S2</option>
                      <option value="S3">S3</option>
                      <option value="Tidak Sekolah">Tidak Sekolah</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Kategori Pekerjaan</label>
                    <select 
                      value={logFormData.details.jobCategory} 
                      onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, jobCategory: e.target.value } })} 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                    >
                      <option value="">Pilih Pekerjaan...</option>
                      <option value="PNS">PNS</option>
                      <option value="TNI/POLRI">TNI/POLRI</option>
                      <option value="Karyawan Swasta">Karyawan Swasta</option>
                      <option value="Wiraswasta">Wiraswasta</option>
                      <option value="Buruh">Buruh</option>
                      <option value="Petani">Petani</option>
                      <option value="Ibu Rumah Tangga">Ibu Rumah Tangga</option>
                      <option value="Pelajar/Mahasiswa">Pelajar/Mahasiswa</option>
                      <option value="Tidak Bekerja">Tidak Bekerja</option>
                    </select>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Kerentanan (Pilih yang sesuai)</label>
                  <div className="flex flex-wrap gap-2">
                    {['Ibu Hamil', 'Bayi', 'Balita', 'Lansia', 'Disabilitas', 'Janda/Duda'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          const current = logFormData.details.vulnerability || [];
                          const updated = current.includes(v) 
                            ? current.filter(item => item !== v) 
                            : [...current, v];
                          setLogFormData({ ...logFormData, details: { ...logFormData.details, vulnerability: updated } });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all ${
                          (logFormData.details.vulnerability || []).includes(v) 
                            ? 'bg-rose-500 text-white border-rose-500' 
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

              {logFormData.type === 'MovedOut' && (
                <>
                  <div className="col-span-full">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Alamat Tujuan</label>
                    <input 
                      type="text" 
                      value={logFormData.details.newAddress} 
                      onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, newAddress: e.target.value } })} 
                      className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    />
                  </div>
                  <div className="col-span-full">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Alasan Pindah</label>
                    <input 
                      type="text" 
                      value={logFormData.details.reasonForMoving} 
                      onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, reasonForMoving: e.target.value } })} 
                      className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    />
                  </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Jumlah Anggota Pindah</label>
                  <input 
                    type="number" 
                    value={logFormData.details.familyCount} 
                    onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, familyCount: parseInt(e.target.value) || 1 } })} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    min="1"
                  />
                </div>
              </>
            )}

              {logFormData.type === 'Birth' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Nama Ayah</label>
                    <input 
                      type="text" 
                      value={logFormData.details.fatherName} 
                      onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, fatherName: e.target.value } })} 
                      className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Nama Ibu</label>
                    <input 
                      type="text" 
                      value={logFormData.details.motherName} 
                      onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, motherName: e.target.value } })} 
                      className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Jenis Kelamin</label>
                    <select 
                      value={logFormData.details.gender} 
                      onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, gender: e.target.value as any } })} 
                      className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
              </>
            )}

              {logFormData.type === 'Death' && (
                <>
                  <div className="col-span-full">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Penyebab Wafat</label>
                    <input 
                      type="text" 
                      value={logFormData.details.causeOfDeath} 
                      onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, causeOfDeath: e.target.value } })} 
                      className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    />
                  </div>
                  <div className="col-span-full">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Tempat Wafat</label>
                    <input 
                      type="text" 
                      value={logFormData.details.placeOfDeath} 
                      onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, placeOfDeath: e.target.value } })} 
                      className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    />
                  </div>
                </>
              )}

            <div className="col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <FileUp size={14} className="text-indigo-600" /> Link / URL Berkas Pendukung (Surat Pindah / Lahir / Wafat)
                </label>
                <input 
                  type="url" 
                  value={logFormData.documentUrl} 
                  onChange={e => setLogFormData({ ...logFormData, documentUrl: e.target.value })} 
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all font-mono" 
                  placeholder="https://drive.google.com/... atau link foto dokumen"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-600" /> Status Verifikasi Dokumen RT
                </label>
                <select 
                  value={logFormData.verificationStatus} 
                  onChange={e => setLogFormData({ ...logFormData, verificationStatus: e.target.value as any })} 
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all"
                >
                  <option value="Approved">✓ Disetujui / Sah (Lengkap)</option>
                  <option value="Pending">⏳ Menunggu Verifikasi Dokumen</option>
                  <option value="Rejected">✕ Ditolak / Kurang Syarat</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  {logFormData.type === 'Newcomer' ? 'Catatan Kedatangan' : 
                   logFormData.type === 'MovedOut' ? 'Catatan Kepindahan' : 
                   logFormData.type === 'Birth' ? 'Catatan Kelahiran' : 
                   'Catatan Kematian'}
                </label>
                <textarea 
                  value={logFormData.description} 
                  onChange={e => setLogFormData({ ...logFormData, description: e.target.value })} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all min-h-[80px] resize-none" 
                  placeholder={
                    logFormData.type === 'Newcomer' ? 'Cth: Pindah karena tugas kerja...' : 
                    logFormData.type === 'MovedOut' ? 'Cth: Pindah ke luar kota...' : 
                    logFormData.type === 'Birth' ? 'Cth: Lahir normal di RS...' : 
                    'Cth: Meninggal karena sakit...'
                  }
                />
              </div>
            </div>
          </div>

          <div className="my-6 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center gap-3">
            <input 
              type="checkbox" 
              id="autoUpdateHouse"
              checked={autoUpdateHouse}
              onChange={e => setAutoUpdateHouse(e.target.checked)}
              className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="autoUpdateHouse" className="text-xs font-bold text-indigo-700 cursor-pointer">
              Update data rumah otomatis? (Sinkronisasi ke Data Warga)
            </label>
          </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={() => setIsLogModalOpen(false)}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
            >
              Simpan Mutasi
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

