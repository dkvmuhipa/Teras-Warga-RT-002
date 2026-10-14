import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { 
  Plus, FileText, BarChart3, Clock, Download, RefreshCw, Printer 
} from 'lucide-react';

import { PopulationReport, PopulationChangeLog, House, PdfConfig } from '../../types';
import { useConfirm } from '../../context/ConfirmContext';
import { generatePopulationReportExcel, generateMutationReportExcel } from '../../services/excelService';
import { generateMutationReportPDF } from '../../services/pdfService';
import { 
  addPopulationLogToDb, 
  updatePopulationLogToDb, 
  deletePopulationLogFromDb, 
  updateHouseData, 
  logAction, 
  markAllLogsBeforeDateAsGenerated, 
  deletePopulationReportFromDb, 
  addPopulationReportToDb 
} from '../../services/databaseService';

import { PopulationLiveStats, PopulationReportFormData, PopulationLogFormData } from './population-report/types';
import { PopulationOverviewTab } from './population-report/PopulationOverviewTab';
import { PopulationReportsTab } from './population-report/PopulationReportsTab';
import { PopulationLogsTab } from './population-report/PopulationLogsTab';
import { PopulationReportModal } from './population-report/PopulationReportModal';
import { PopulationLogModal } from './population-report/PopulationLogModal';
import { PopulationLogDetailModal } from './population-report/PopulationLogDetailModal';

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
  reports, 
  onAddReport, 
  onUpdateReport, 
  onDeleteReport, 
  populationLogs, 
  houses, 
  pdfConfig,
}) => {
  const confirm = useConfirm();

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'logs'>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<PopulationChangeLog | null>(null);

  // Loading States
  const [isGeneratingLogs, setIsGeneratingLogs] = useState(false);

  // Editing States
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  // Sub-Tab Filters & View Modes
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [reportYearFilter, setReportYearFilter] = useState<string>('All');
  const [reportSearchTerm, setReportSearchTerm] = useState<string>('');

  const [logViewMode, setLogViewMode] = useState<'table' | 'timeline'>('table');
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

  // Form Data States
  const [formData, setFormData] = useState<PopulationReportFormData>({
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
    executiveSummary: '',
    securityOverview: '',
    activities: []
  });

  const [logFormData, setLogFormData] = useState<PopulationLogFormData>({
    type: 'Newcomer',
    name: '',
    phone: '',
    houseId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    documentUrl: '',
    verificationStatus: 'Approved',
    approvalNotes: '',
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

  // Action: Sync All Residents
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
          const vulnerability: string[] = [];
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
            isGenerated: false,
            details: {
              previousAddress: '-',
              reasonForMoving: 'Registrasi Warga',
              familyCount: house.occupants || 1,
              familyMembers: house.familyMembers || [],
              residenceType: (house.residenceType as any) || 'Tetap',
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
                residenceType: (house.residenceType as any) || 'Tetap',
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

  // Action: Auto Generate All Year Reports
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
      for (const report of reports) {
        if (report.id) {
          await deletePopulationReportFromDb(report.id);
        }
      }

      let currentTotal = 0;
      let currentMale = 0;
      let currentFemale = 0;
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
      let currentSeasonal = 0;
      let currentSeasonalMale = 0;
      let currentSeasonalFemale = 0;

      houses.forEach(house => {
        if (house.status === 'Occupied') {
          const occupantsCount = Math.max(house.occupants || 1, 1 + (house.familyMembers?.length || 0));
          const isSeasonal = house.residenceType === 'Sewa' || house.residenceType === 'Rumah Keluarga' || (house.status as any) === 'Visiting';
          if (isSeasonal) currentSeasonal += occupantsCount;

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

          const isHoFFemale = house.gender === 'Perempuan' || (house.gender as string) === 'Wanita';
          const isHoFMale = !isHoFFemale;

          if (house.familyMembers && house.familyMembers.length > 0) {
            currentMale += isHoFMale ? 1 : 0;
            if (isSeasonal && isHoFMale) currentSeasonalMale++;
            currentFemale += isHoFFemale ? 1 : 0;
            if (isSeasonal && isHoFFemale) currentSeasonalFemale++;

            house.familyMembers.forEach(mem => {
              const mGender = mem.gender || 'Laki-laki';
              if (mGender === 'Laki-laki') {
                currentMale++;
                if (isSeasonal) currentSeasonalMale++;
              } else if (mGender === 'Perempuan') {
                currentFemale++;
                if (isSeasonal) currentSeasonalFemale++;
              }
            });

            const registeredCount = 1 + house.familyMembers.length;
            if (occupantsCount > registeredCount) {
              const diff = occupantsCount - registeredCount;
              const maleDiff = Math.ceil(diff / 2);
              const femaleDiff = Math.floor(diff / 2);
              currentMale += maleDiff;
              currentFemale += femaleDiff;
              if (isSeasonal) {
                currentSeasonalMale += maleDiff;
                currentSeasonalFemale += femaleDiff;
              }
            }
          } else {
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
              const maleDiff = Math.ceil(diff / 2);
              const femaleDiff = Math.floor(diff / 2);
              currentMale += maleDiff;
              currentFemale += femaleDiff;
              if (isSeasonal) {
                currentSeasonalMale += maleDiff;
                currentSeasonalFemale += femaleDiff;
              }
            }
          }
        }
      });

      const currentMonthNum = new Date().getMonth() + 1;
      const monthlyReports: any[] = [];

      for (let m = 1; m <= currentMonthNum; m++) {
        const monthStr = `2026-${String(m).padStart(2, '0')}`;
        const endOfMonthDateStr = `${monthStr}-31`;

        let monthMale = 0;
        let monthFemale = 0;
        let monthSeasonal = 0;
        let monthSeasonalMale = 0;
        let monthSeasonalFemale = 0;
        let monthPregnant = 0;
        let monthBaby = 0;
        let monthToddler = 0;
        let monthChild = 0;
        let monthTeenager = 0;
        let monthAdult = 0;
        let monthElderly = 0;
        let monthWidow = 0;
        let monthDisability = 0;
        let monthOrphan = 0;

        if (m === currentMonthNum) {
          monthMale = currentMale;
          monthFemale = currentFemale;
          monthPregnant = currentPregnant;
          monthBaby = currentBaby;
          monthToddler = currentToddler;
          monthChild = currentChild;
          monthTeenager = currentTeenager;
          monthAdult = currentAdult;
          monthElderly = currentElderly;
          monthWidow = currentWidow;
          monthDisability = currentDisability;
          monthOrphan = currentOrphan;
          monthSeasonal = currentSeasonal;
          monthSeasonalMale = currentSeasonalMale;
          monthSeasonalFemale = currentSeasonalFemale;
        } else {
          houses.forEach(house => {
            if (house.status === 'Occupied') {
              const jDate = house.joiningDate ? house.joiningDate.split('T')[0] : '2000-01-01';
              if (jDate <= endOfMonthDateStr) {
                const occupantsCount = Math.max(house.occupants || 1, 1 + (house.familyMembers?.length || 0));
                const isSeasonal = house.residenceType === 'Sewa' || house.residenceType === 'Rumah Keluarga' || (house.status as any) === 'Visiting';
                if (isSeasonal) monthSeasonal += occupantsCount;

                monthPregnant += house.pregnantCount || 0;
                monthBaby += house.babyCount || 0;
                monthToddler += house.toddlerCount || 0;
                monthChild += house.childCount || 0;
                monthTeenager += house.teenagerCount || 0;
                monthAdult += house.adultCount || 0;
                monthElderly += house.elderlyCount || 0;
                monthWidow += house.widowCount || 0;
                monthDisability += house.disabilityCount || 0;
                monthOrphan += house.orphanCount || 0;

                const isHoFFemale = house.gender === 'Perempuan' || (house.gender as string) === 'Wanita';
                const isHoFMale = !isHoFFemale;

                if (house.familyMembers && house.familyMembers.length > 0) {
                  monthMale += isHoFMale ? 1 : 0;
                  if (isSeasonal && isHoFMale) monthSeasonalMale++;
                  monthFemale += isHoFFemale ? 1 : 0;
                  if (isSeasonal && isHoFFemale) monthSeasonalFemale++;

                  house.familyMembers.forEach(mem => {
                    const mGender = mem.gender || 'Laki-laki';
                    if (mGender === 'Laki-laki') {
                      monthMale++;
                      if (isSeasonal) monthSeasonalMale++;
                    } else if (mGender === 'Perempuan') {
                      monthFemale++;
                      if (isSeasonal) monthSeasonalFemale++;
                    }
                  });

                  const registeredCount = 1 + house.familyMembers.length;
                  if (occupantsCount > registeredCount) {
                    const diff = occupantsCount - registeredCount;
                    const maleDiff = Math.ceil(diff / 2);
                    const femaleDiff = Math.floor(diff / 2);
                    monthMale += maleDiff;
                    monthFemale += femaleDiff;
                    if (isSeasonal) {
                      monthSeasonalMale += maleDiff;
                      monthSeasonalFemale += femaleDiff;
                    }
                  }
                } else {
                  const headGender = house.gender || 'Laki-laki';
                  const headMale = headGender === 'Laki-laki' ? 1 : 0;
                  const headFemale = headGender === 'Perempuan' ? 1 : 0;

                  monthMale += headMale;
                  monthFemale += headFemale;
                  if (isSeasonal) {
                    if (headMale) monthSeasonalMale++;
                    if (headFemale) monthSeasonalFemale++;
                  }

                  if (occupantsCount > 1) {
                    const diff = occupantsCount - 1;
                    const maleDiff = Math.ceil(diff / 2);
                    const femaleDiff = Math.floor(diff / 2);
                    monthMale += maleDiff;
                    monthFemale += femaleDiff;
                    if (isSeasonal) {
                      monthSeasonalMale += maleDiff;
                      monthSeasonalFemale += femaleDiff;
                    }
                  }
                }
              }
            }
          });
        }

        const logsThisMonth = populationLogs.filter(log => log.date.startsWith(monthStr));
        const birthCount = logsThisMonth.filter(l => l.type === 'Birth').length;
        const deathCount = logsThisMonth.filter(l => l.type === 'Death').length;
        const newcomerCount = logsThisMonth.filter(l => l.type === 'Newcomer').reduce((sum, log) => sum + (log.details?.familyCount || 1), 0);
        const movedOutCount = logsThisMonth.filter(l => l.type === 'MovedOut').reduce((sum, log) => sum + (log.details?.familyCount || 1), 0);

        monthlyReports.push({
          month: monthStr,
          year: 2026,
          birthCount,
          deathCount,
          newcomerCount,
          movedOutCount,
          maleCount: monthMale,
          femaleCount: monthFemale,
          pregnantCount: monthPregnant,
          babyCount: monthBaby,
          toddlerCount: monthToddler,
          childCount: monthChild,
          teenagerCount: monthTeenager,
          adultCount: monthAdult,
          elderlyCount: monthElderly,
          widowCount: monthWidow,
          disabilityCount: monthDisability,
          orphanCount: monthOrphan,
          seasonalCount: monthSeasonal,
          seasonalMaleCount: monthSeasonalMale,
          seasonalFemaleCount: monthSeasonalFemale,
          createdAt: new Date().toISOString()
        });
      }

      const currentMonthIndex = currentMonthNum - 1;
      let netPriorMutations = 0;
      for (let i = 0; i < currentMonthIndex; i++) {
        const rep = monthlyReports[i];
        netPriorMutations += (rep.birthCount + rep.newcomerCount - rep.movedOutCount - rep.deathCount);
      }
      
      const currentReport = monthlyReports[currentMonthIndex];
      const netCurrentMutation = currentReport.birthCount + currentReport.newcomerCount - currentReport.movedOutCount - currentReport.deathCount;
      const baseJanInitial = Math.max(0, currentTotal - (netPriorMutations + netCurrentMutation));

      let runningPop = baseJanInitial;
      for (let i = 0; i <= currentMonthIndex; i++) {
        const rep = monthlyReports[i];
        rep.initialPopulation = runningPop;
        const netMut = rep.birthCount + rep.newcomerCount - rep.movedOutCount - rep.deathCount;
        runningPop = Math.max(0, runningPop + netMut);
      }

      for (const rep of monthlyReports) {
        await addPopulationReportToDb(rep);
      }

      toast.success('Berhasil meng-generate seluruh laporan bulanan 2026 secara akurat sesuai data warga riil!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal meng-generate laporan.');
    } finally {
      setIsGeneratingLogs(false);
    }
  };

  // Action: Bulk Mark Logs Processed
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

  // Action: Generate From Log
  const handleGenerateFromLog = async () => {
    if (isGeneratingLogs) return;
    setIsGeneratingLogs(true);
    
    try {
      const targetMonth = formData.month;
      const missingLogs: any[] = [];
      for (const house of houses) {
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
          const newcomerLogs = [
            ...populationLogs.filter(l => l.type === 'Newcomer' && l.houseId === house.id),
            ...missingLogs.filter(l => l.type === 'Newcomer' && l.houseId === house.id)
          ];
          const movedOutLogs = [
            ...populationLogs.filter(l => l.type === 'MovedOut' && l.houseId === house.id),
            ...missingLogs.filter(l => l.type === 'MovedOut' && l.houseId === house.id)
          ];
          
          if (newcomerLogs.length > movedOutLogs.length) {
            const latestNewcomer = newcomerLogs.sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
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
          const isSeasonal = house.residenceType === 'Sewa' || house.residenceType === 'Rumah Keluarga' || (house.status as any) === 'Visiting';
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
          
          const isHoFFemale = house.gender === 'Perempuan' || (house.gender as string) === 'Wanita';
          const isHoFMale = !isHoFFemale;

          if (house.familyMembers && house.familyMembers.length > 0) {
            currentMale += isHoFMale ? 1 : 0;
            if (isSeasonal && isHoFMale) currentSeasonalMale++;
            
            currentFemale += isHoFFemale ? 1 : 0;
            if (isSeasonal && isHoFFemale) currentSeasonalFemale++;

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

      const initialPopulation = currentTotal - (newcomerCount + birthCount) + (movedOutCount + deathCount);

      setFormData(prev => ({
        ...prev,
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

  // Action: Edit Report
  const handleEditReport = (report: PopulationReport) => {
    const { id, createdAt, ...data } = report;
    setFormData(data);
    setEditingReportId(id);
    setIsModalOpen(true);
  };

  // Action: Submit Monthly Report Form
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

  // Action: Submit Add/Edit Mutation Log
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

    // Auto Update House Data (ONLY IF APPROVED)
    const isApproved = logData.verificationStatus === 'Approved';
    if (autoUpdateHouse && logFormData.houseId && isApproved) {
      const house = houses.find(h => h.id === logFormData.houseId);
      if (house) {
        let updates: any = {};
        const currentHistory = house.occupancyHistory || [];
        
        if (logFormData.type === 'Newcomer') {
          const newHistoryRecord = {
            id: `occ_${Date.now()}`,
            headOfFamily: logFormData.name,
            startDate: logFormData.date,
            occupantCount: logFormData.details.familyCount || 1,
            status: 'Active' as const,
            residenceType: logFormData.details.residenceType || 'Tetap'
          };

          updates = {
            headOfFamily: logFormData.name,
            phone: logFormData.phone,
            occupants: logFormData.details.familyCount,
            status: 'Occupied',
            residenceType: logFormData.details.residenceType,
            religion: logFormData.details.religion,
            occupancyHistory: [...currentHistory.map(h => ({ ...h, status: 'Moved Out' as const, endDate: logFormData.date })), newHistoryRecord],
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
            occupancyHistory: currentHistory.map(h => ({
              ...h,
              status: 'Moved Out' as const,
              endDate: h.endDate || logFormData.date
            })),
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
          };
        }

        if (Object.keys(updates).length > 0) {
          await updateHouseData(house.id, updates);
        }
      }
    }

    // Auto Aggregate Monthly Report
    if (isApproved && reports.length > 0) {
      const currentMonthStr = logFormData.date.slice(0, 7);
      const targetReport = reports.find(r => r.month === currentMonthStr);
      if (targetReport) {
        const reportUpdates: Partial<PopulationReport> = {};
        if (logFormData.type === 'Newcomer') reportUpdates.newcomerCount = (targetReport.newcomerCount || 0) + (logFormData.details.familyCount || 1);
        else if (logFormData.type === 'MovedOut') reportUpdates.movedOutCount = (targetReport.movedOutCount || 0) + 1;
        else if (logFormData.type === 'Birth') reportUpdates.birthCount = (targetReport.birthCount || 0) + 1;
        else if (logFormData.type === 'Death') reportUpdates.deathCount = (targetReport.deathCount || 0) + 1;

        if (Object.keys(reportUpdates).length > 0) {
          onUpdateReport(targetReport.id, reportUpdates);
        }
      }
    }

    setIsLogModalOpen(false);
    setEditingLogId(null);
    setLogFormData({
      type: 'Newcomer',
      name: '',
      phone: '',
      houseId: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      documentUrl: '',
      verificationStatus: 'Approved',
      approvalNotes: '',
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

  // Bulk Actions
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

  // Memoized Chart & Stats
  const chartData = useMemo(() => {
    return [...reports].sort((a, b) => (a.month || '').localeCompare(b.month || '')).map(r => ({
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

  // LIVE STATS (from houses)
  const liveStats: PopulationLiveStats = useMemo(() => {
    let totalSoul = 0;
    let totalMale = 0;
    let totalFemale = 0;
    let totalTetap = 0;
    let tetapMale = 0;
    let tetapFemale = 0;
    let totalMusiman = 0;
    let musimanMale = 0;
    let musimanFemale = 0;
    let housesTetap = 0;
    let housesMusiman = 0;
    let housesFemaleHoF = 0;
    let housesMaleHoF = 0;
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
        const soul = Math.max(h.occupants || 1, 1 + (h.familyMembers?.length || 0));
        totalSoul += soul;

        let houseMale = 0;
        let houseFemale = 0;

        if (h.gender === 'Perempuan' || (h.gender as string) === 'Wanita') {
          houseFemale += 1;
          housesFemaleHoF += 1;
        } else {
          houseMale += 1;
          housesMaleHoF += 1;
        }

        if (h.familyMembers && h.familyMembers.length > 0) {
          h.familyMembers.forEach(m => {
            if (m.gender === 'Perempuan' || (m.gender as string) === 'Wanita') {
              houseFemale += 1;
            } else {
              houseMale += 1;
            }
          });
        } else if (soul > 1) {
          const remaining = soul - 1;
          const femaleEstimated = Math.floor(remaining / 2);
          const maleEstimated = remaining - femaleEstimated;
          houseFemale += femaleEstimated;
          houseMale += maleEstimated;
        }

        totalMale += houseMale;
        totalFemale += houseFemale;
        
        const isMusiman = h.residenceType === 'Sewa' || h.residenceType === 'Rumah Keluarga' || (h.status as any) === 'Visiting';
        if (isMusiman) {
          totalMusiman += soul;
          musimanMale += houseMale;
          musimanFemale += houseFemale;
          housesMusiman += 1;
        } else {
          totalTetap += soul;
          tetapMale += houseMale;
          tetapFemale += houseFemale;
          housesTetap += 1;
        }

        totalPregnant += h.pregnantCount || 0;
        totalBaby += h.babyCount || 0;
        totalToddler += h.toddlerCount || 0;
        totalChild += h.childCount || 0;
        totalTeenager += h.teenagerCount || 0;
        totalAdult += h.adultCount || 0;
        totalElderly += h.elderlyCount || 0;
        totalWidow += h.widowCount || 0;
        totalDisability += h.disabilityCount || 0;
        totalOrphan += h.orphanCount || 0;
      }
    });

    const vulnerableTotal = totalPregnant + totalBaby + totalToddler + totalElderly + totalDisability + totalWidow + totalOrphan;

    return {
      totalSoul,
      totalMale,
      totalFemale,
      totalTetap,
      tetapMale,
      tetapFemale,
      totalMusiman,
      musimanMale,
      musimanFemale,
      housesTetap,
      housesMusiman,
      housesFemaleHoF,
      housesMaleHoF,
      vulnerableTotal,
      totalPregnant,
      totalBaby,
      totalToddler,
      totalChild,
      totalTeenager,
      totalAdult,
      totalElderly,
      totalWidow,
      totalDisability,
      totalOrphan
    };
  }, [houses]);

  const latestReport = reports[reports.length - 1];

  const filteredLogsForExport = useMemo(() => {
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
      if (startDateFilter) matchesDate = matchesDate && log.date >= startDateFilter;
      if (endDateFilter) matchesDate = matchesDate && log.date <= endDateFilter;
      
      return matchesSearch && matchesFilter && matchesStatus && matchesVerification && matchesDate;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [populationLogs, logSearchTerm, logTypeFilter, logStatusFilter, verificationFilter, startDateFilter, endDateFilter]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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
                className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                {tab.label}
              </button>
            );
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
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <Download size={14} className="text-indigo-600" /> Ekspor Excel
              </button>
            )}
            
            {activeTab === 'reports' && (
              <>
                <button 
                  onClick={handleGenerateFromLog} 
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100/60 transition-all shadow-xs active:scale-95 cursor-pointer"
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
                      executiveSummary: '',
                      securityOverview: '',
                      activities: []
                    });
                    setEditingReportId(null);
                    setIsModalOpen(true);
                  }} 
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/10 transition-all active:scale-95 cursor-pointer"
                >
                  <Plus size={14} /> Tambah Laporan Manual
                </button>
              </>
            )}

            {activeTab === 'logs' && (
              <>
                <button 
                  onClick={() => generateMutationReportExcel(filteredLogsForExport)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                  title="Unduh Laporan Mutasi format Excel"
                >
                  <Download size={14} /> Ekspor Excel
                </button>
                <button 
                  onClick={() => generateMutationReportPDF(latestReport || reports[0], filteredLogsForExport, pdfConfig)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                  title="Unduh Laporan Mutasi format PDF"
                >
                  <Printer size={14} /> Ekspor PDF
                </button>
                <button 
                  onClick={handleSyncAllResidents}
                  className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-all shadow-xs active:scale-95 cursor-pointer"
                  title="Sinkronkan data warga saat ini ke log"
                >
                  <RefreshCw size={14} className="text-indigo-600" /> Sinkron
                </button>
                <button 
                  onClick={handleBulkMarkLogsProcessed}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all active:scale-95 cursor-pointer"
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
                      documentUrl: '',
                      verificationStatus: 'Approved',
                      approvalNotes: '',
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
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10 active:scale-95 cursor-pointer"
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
          <PopulationOverviewTab 
            liveStats={liveStats}
            latestReport={latestReport}
            chartData={chartData}
          />
        )}

        {activeTab === 'reports' && (
          <PopulationReportsTab 
            reports={reports}
            populationLogs={populationLogs}
            reportSearchTerm={reportSearchTerm}
            setReportSearchTerm={setReportSearchTerm}
            reportYearFilter={reportYearFilter}
            setReportYearFilter={setReportYearFilter}
            viewMode={viewMode}
            setViewMode={setViewMode}
            formatIndonesianMonthYear={formatIndonesianMonthYear}
            onEditReport={handleEditReport}
            onDeleteReport={onDeleteReport}
            onAutoGenerateAllYearReports={handleAutoGenerateAllYearReports}
            isGeneratingLogs={isGeneratingLogs}
            pdfConfig={pdfConfig}
          />
        )}

        {activeTab === 'logs' && (
          <PopulationLogsTab 
            populationLogs={populationLogs}
            houses={houses}
            currentMonthLogStats={currentMonthLogStats}
            logViewMode={logViewMode}
            setLogViewMode={setLogViewMode}
            logSearchTerm={logSearchTerm}
            setLogSearchTerm={setLogSearchTerm}
            logTypeFilter={logTypeFilter}
            setLogTypeFilter={setLogTypeFilter}
            verificationFilter={verificationFilter}
            setVerificationFilter={setVerificationFilter}
            startDateFilter={startDateFilter}
            setStartDateFilter={setStartDateFilter}
            endDateFilter={endDateFilter}
            setEndDateFilter={setEndDateFilter}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            logStatusFilter={logStatusFilter}
            setLogStatusFilter={setLogStatusFilter}
            selectedLogIds={selectedLogIds}
            setSelectedLogIds={setSelectedLogIds}
            onBulkVerifyStatus={handleBulkVerifyStatus}
            onBulkMarkGenerated={handleBulkMarkGenerated}
            onBulkDelete={handleBulkDelete}
            onSelectLogForDetail={(log) => setSelectedLogForDetail(log)}
            pdfConfig={pdfConfig}
          />
        )}
      </AnimatePresence>

      {/* Modals */}
      <PopulationReportModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        reports={reports}
        onAutoCalculateCurrentMonth={handleGenerateFromLog}
        isGeneratingLogs={isGeneratingLogs}
      />

      <PopulationLogModal 
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSubmit={handleAddLog}
        logFormData={logFormData}
        setLogFormData={setLogFormData}
        editingLogId={editingLogId}
        autoUpdateHouse={autoUpdateHouse}
        setAutoUpdateHouse={setAutoUpdateHouse}
      />

      <PopulationLogDetailModal 
        selectedLog={selectedLogForDetail}
        onClose={() => setSelectedLogForDetail(null)}
        pdfConfig={pdfConfig}
      />
    </motion.div>
  );
};
