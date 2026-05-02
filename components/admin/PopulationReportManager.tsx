import React, { useState, useMemo } from 'react';
import { PopulationReport, PopulationChangeLog, House } from '../../types';
import { generatePopulationReportPDF } from '../../services/pdfService';
import { generatePopulationReportExcel } from '../../services/excelService';
import { addPopulationLogToDb, updatePopulationLogToDb, deletePopulationLogFromDb, updateHouseData, logAction } from '../../services/databaseService';
import { toast } from 'sonner';
import { 
  Plus, FileText, Trash2, TrendingUp, TrendingDown, 
  Users, Baby, Accessibility, Heart, User, 
  Calendar, ArrowRight, Activity, Clock, Filter, Search, MapPin as MapIcon,
  BarChart3, PieChart as PieChartIcon, List, LayoutGrid, Download, Edit2,
  RefreshCw, Filter as FilterIcon
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
}

export const PopulationReportManager: React.FC<PopulationReportManagerProps> = ({ 
  reports, onAddReport, onUpdateReport, onDeleteReport, populationLogs, setPopulationLogs, houses 
}) => {
  const confirm = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState<'All' | 'Newcomer' | 'MovedOut' | 'Birth' | 'Death'>('All');
  const [autoUpdateHouse, setAutoUpdateHouse] = useState(true);
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
    details: {
      previousAddress: '',
      reasonForMoving: '',
      familyCount: 1,
      familyMembers: [] as {name: string, relationship: string, nik?: string}[],
      residenceType: 'Tetap' as 'Tetap' | 'Kontrak' | 'Kost' | 'Rumah Keluarga',
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
      message: 'Sistem akan memeriksa semua warga yang "Menempati" (Occupied) namun belum memiliki catatan di Log Mutasi. Data lama yang sudah ada di sistem (Legacy Data) mungkin akan terdeteksi sebagai Warga Baru jika belum pernah dicatat. Apakah Anda ingin melanjutkan?',
      confirmLabel: 'Sync Semua Data',
      cancelLabel: 'Batal'
    });

    if (!isConfirmed) return;

    let syncCount = 0;
    for (const house of houses) {
      if (house.status === 'Occupied' && house.joiningDate) {
        const hasLog = populationLogs.some(l => l.type === 'Newcomer' && l.houseId === house.id);
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
            description: 'Warga baru ditambahkan melalui Data Warga (Manual Sync)',
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
          await addPopulationLogToDb(newLog);
          syncCount++;
        }
      }
    }
    if (syncCount > 0) {
      toast.success(`Berhasil menyinkronkan ${syncCount} data warga ke log mutasi.`);
    } else {
      toast.info('Semua data warga sudah sinkron dengan log mutasi.');
    }
  };

  const handleGenerateFromLog = async () => {
    const targetMonth = formData.month; // Use the month selected in the form
    
    // Auto-sync missing newcomers and moved out from houses
    const missingLogs: any[] = [];
    for (const house of houses) {
      if (house.status === 'Occupied' && house.joiningDate?.startsWith(targetMonth)) {
        const hasLog = populationLogs.some(l => l.type === 'Newcomer' && l.houseId === house.id);
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
        const newcomerLogs = populationLogs.filter(l => l.type === 'Newcomer' && l.houseId === house.id);
        const movedOutLogs = populationLogs.filter(l => l.type === 'MovedOut' && l.houseId === house.id);
        
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
    const logsThisMonth = allLogs.filter(log => log.date.startsWith(targetMonth));
    
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
        const isSeasonal = house.residenceType === 'Kontrak' || house.residenceType === 'Kost';
        if (isSeasonal) {
          currentSeasonal += house.occupants || 0;
        }

        currentTotal += house.occupants || 0;
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
          house.familyMembers.forEach(m => {
            if (m.gender === 'Laki-laki') {
              currentMale++;
              if (isSeasonal) currentSeasonalMale++;
            }
            else if (m.gender === 'Perempuan') {
              currentFemale++;
              if (isSeasonal) currentSeasonalFemale++;
            }
          });
        } else {
          // Fallback: assume head of family gender or split
          const m = Math.ceil((house.occupants || 0) / 2);
          const f = Math.floor((house.occupants || 0) / 2);
          currentMale += m;
          currentFemale += f;
          if (isSeasonal) {
            currentSeasonalMale += m;
            currentSeasonalFemale += f;
          }
        }
      }
    });

    // Try to find the previous month's report for initial population
    const prevMonthStr = new Date(new Date(targetMonth + '-01').setMonth(new Date(targetMonth + '-01').getMonth() - 1)).toISOString().slice(0, 7);
    const lastMonthReport = reports.find(r => r.month === prevMonthStr);
    
    let initialPopulation = lastMonthReport ? 
      (lastMonthReport.initialPopulation + lastMonthReport.birthCount + lastMonthReport.newcomerCount - lastMonthReport.movedOutCount - (lastMonthReport.deathCount || 0)) : 
      (currentTotal - (newcomerCount - movedOutCount));

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

  const filteredLogs = useMemo(() => {
    return populationLogs.filter(log => {
      const matchesSearch = (log.name || '').toLowerCase().includes(logSearchTerm.toLowerCase()) || 
                           (log.houseId || '').toLowerCase().includes(logSearchTerm.toLowerCase());
      const matchesFilter = logTypeFilter === 'All' || log.type === logTypeFilter;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [populationLogs, logSearchTerm, logTypeFilter]);

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
      className="space-y-8"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Mutasi & Laporan Penduduk</h2>
          <p className="text-slate-500 font-medium mt-1">Kelola log mutasi dan rekapitulasi data kependudukan per periode.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => generatePopulationReportExcel(reports, populationLogs)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            title="Export Excel"
          >
            <Download size={18} className="text-indigo-600" /> Excel
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
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <Plus size={18} /> Tambah Log Mutasi
          </button>
          <button 
            onClick={handleGenerateFromLog} 
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <FileText size={18} className="text-emerald-600" /> Generate Log
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
              });
              setEditingReportId(null);
              setIsModalOpen(true);
            }} 
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus size={18} /> Tambah Laporan
          </button>
        </div>
      </div>

      {/* Quick Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={20} /></div>
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Total Penduduk</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">{totalPopulation} <span className="text-xs font-bold text-slate-400">Jiwa</span></h3>
          <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
            <TrendingUp size={14} /> <span>Update Terakhir</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Heart size={20} /></div>
            <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Kelompok Rentan</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">
            {(latestReport?.pregnantCount || 0) + (latestReport?.babyCount || 0) + (latestReport?.toddlerCount || 0) + (latestReport?.childCount || 0) + (latestReport?.teenagerCount || 0) + (latestReport?.adultCount || 0) + (latestReport?.elderlyCount || 0) + (latestReport?.widowCount || 0)}
            <span className="text-xs font-bold text-slate-400"> Jiwa</span>
          </h3>
          <div className="mt-2 flex items-center gap-1 text-xs font-bold text-slate-500">
            <Activity size={14} /> <span>Prioritas Layanan</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Baby size={20} /></div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Kelahiran</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">+{latestReport?.birthCount || 0} <span className="text-xs font-bold text-slate-400">Bulan Ini</span></h3>
          <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
            <TrendingUp size={14} /> <span>Pertumbuhan Positif</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><ArrowRight size={20} /></div>
            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Mutasi Keluar</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">-{latestReport?.movedOutCount || 0} <span className="text-xs font-bold text-slate-400">Jiwa</span></h3>
          <div className="mt-2 flex items-center gap-1 text-xs font-bold text-amber-600">
            <TrendingDown size={14} /> <span>Pindah Domisili</span>
          </div>
        </motion.div>
      </div>

      {/* Chart Section */}
      <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Tren Pertumbuhan Penduduk</h3>
            <p className="text-xs text-slate-500 font-medium">Visualisasi data 6 bulan terakhir</p>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl border border-slate-100"><BarChart3 size={20} className="text-slate-400" /></div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Reports Table Section */}
      <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Daftar Laporan Bulanan</h3>
            <p className="text-xs text-slate-500 font-medium">Rekapitulasi data kependudukan per periode</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            <button 
              onClick={() => setViewMode('table')} 
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
            >
              <List size={18}/>
            </button>
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
            >
              <LayoutGrid size={18}/>
            </button>
          </div>
        </div>
        
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 text-slate-500 font-bold">
                <tr>
                  <th className="p-6 text-left">Periode</th>
                  <th className="p-6 text-right">Awal</th>
                  <th className="p-6 text-right">Lahir</th>
                  <th className="p-6 text-right">Meninggal</th>
                  <th className="p-6 text-right">Pendatang</th>
                  <th className="p-6 text-right">Pindah</th>
                  <th className="p-6 text-right">Akhir</th>
                  <th className="p-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports && reports.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs">
                          {r.month.split('-')[1]}
                        </div>
                        <div>
                          <p className="font-black text-slate-800">{r.month}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.year}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-right font-bold text-slate-600">{r.initialPopulation}</td>
                    <td className="p-6 text-right">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-bold text-xs">+{r.birthCount}</span>
                    </td>
                    <td className="p-6 text-right">
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg font-bold text-xs">-{r.deathCount || 0}</span>
                    </td>
                    <td className="p-6 text-right">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg font-bold text-xs">+{r.newcomerCount}</span>
                    </td>
                    <td className="p-6 text-right">
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg font-bold text-xs">-{r.movedOutCount}</span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-black text-slate-900 text-base">
                          {r.initialPopulation + r.birthCount + r.newcomerCount - r.movedOutCount - (r.deathCount || 0)}
                        </span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Total Akhir</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEditReport(r)}
                          className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Edit Laporan"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => generatePopulationReportPDF(r)}
                          className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Download PDF"
                        >
                          <Download size={18} />
                        </button>
                        <button 
                          onClick={async () => {
                            const isConfirmed = await confirm({
                              title: 'Hapus Laporan',
                              message: 'Apakah Anda yakin ingin menghapus laporan bulanan ini?',
                              confirmLabel: 'Hapus',
                              isDanger: true
                            });
                            if (isConfirmed) {
                              onDeleteReport(r.id);
                              toast.success('Laporan berhasil dihapus.');
                            }
                          }} 
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map(r => (
              <div key={r.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center font-black text-indigo-600 border border-slate-100">
                      {r.month.split('-')[1]}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800">{r.month}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.year}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditReport(r)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors" title="Edit Laporan"><Edit2 size={16}/></button>
                    <button onClick={() => generatePopulationReportPDF(r)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors" title="Download PDF"><Download size={16}/></button>
                    <button onClick={() => onDeleteReport(r.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Awal</p>
                    <p className="font-bold text-slate-800">{r.initialPopulation}</p>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Akhir</p>
                    <p className="font-black text-indigo-600">{r.initialPopulation + r.birthCount + r.newcomerCount - r.movedOutCount - (r.deathCount || 0)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-between text-[10px] font-bold">
                  <span className="text-emerald-600">Lahir: +{r.birthCount}</span>
                  <span className="text-rose-600">Mati: -{r.deathCount || 0}</span>
                  <span className="text-blue-600">Masuk: +{r.newcomerCount}</span>
                  <span className="text-amber-600">Keluar: -{r.movedOutCount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Mutation Log Section */}
      <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-8 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Activity size={20} /></div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Log Mutasi Warga</h3>
              <p className="text-xs text-slate-500 font-medium">Rekapitulasi perpindahan dan perubahan kependudukan real-time</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative group w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Cari nama atau rumah..."
                value={logSearchTerm}
                onChange={(e) => setLogSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-200 transition-all"
              />
            </div>
            
            <div className="flex gap-2">
              <select 
                value={logTypeFilter}
                onChange={(e) => setLogTypeFilter(e.target.value as any)}
                className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all cursor-pointer"
              >
                <option value="All">Semua Mutasi</option>
                <option value="Newcomer">Warga Baru</option>
                <option value="MovedOut">Pindah Keluar</option>
                <option value="Birth">Kelahiran</option>
                <option value="Death">Kematian</option>
              </select>
              
              <button 
                onClick={handleSyncAllResidents}
                className="flex items-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100 active:scale-95"
                title="Sinkronkan Data"
              >
                <Activity size={16} /> <span className="hidden sm:inline">Sync</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/50 text-slate-500 font-bold">
              <tr>
                <th className="p-6 text-left">Tanggal</th>
                <th className="p-6 text-left">Tipe Mutasi</th>
                <th className="p-6 text-left">Nama Warga</th>
                <th className="p-6 text-left">Rumah</th>
                <th className="p-6 text-left">Keterangan & Detail</th>
                <th className="p-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-6 font-bold text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400" />
                      {new Date(log.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`
                      px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider
                      ${log.type === 'Newcomer' ? 'bg-emerald-50 text-emerald-600' : 
                        log.type === 'MovedOut' ? 'bg-amber-50 text-amber-600' : 
                        log.type === 'Birth' ? 'bg-indigo-50 text-indigo-600' : 
                        'bg-rose-50 text-rose-600'}
                    `}>
                      {log.type === 'Newcomer' ? 'Warga Baru' : 
                       log.type === 'MovedOut' ? 'Pindah Keluar' : 
                       log.type === 'Birth' ? 'Kelahiran' : 'Kematian'}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><User size={14}/></div>
                      <div>
                        <p className="font-black text-slate-800">{log.name}</p>
                        {log.details?.familyCount && log.details.familyCount > 1 && (
                          <p className="text-[9px] text-slate-400 font-bold uppercase">+{log.details.familyCount - 1} Anggota</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold w-fit">
                      {log.houseId}
                    </div>
                  </td>
                  <td className="p-6 max-w-sm">
                    <div className="space-y-2">
                      <p className="text-slate-500 font-medium italic line-clamp-1" title={log.description}>{log.description || '-'}</p>
                      {log.details && (
                        <div className="text-[10px] font-bold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-1 gap-1">
                          {log.type === 'Newcomer' && (
                            <>
                              <div className="flex justify-between border-b border-slate-200/30 pb-1"><span>Asal:</span> <span className="text-blue-600">{log.details.previousAddress}</span></div>
                              <div className="flex justify-between"><span>Alasan:</span> <span className="text-blue-600">{log.details.reasonForMoving}</span></div>
                            </>
                          )}
                          {log.type === 'MovedOut' && (
                            <>
                              <div className="flex justify-between border-b border-slate-200/30 pb-1"><span>Tujuan:</span> <span className="text-amber-600">{log.details.newAddress}</span></div>
                              <div className="flex justify-between"><span>Alasan:</span> <span className="text-amber-600">{log.details.reasonForMoving}</span></div>
                            </>
                          )}
                          {log.type === 'Birth' && (
                            <>
                              <div className="flex justify-between border-b border-slate-200/30 pb-1"><span>Orang Tua:</span> <span className="text-emerald-600">{log.details.fatherName}/{log.details.motherName}</span></div>
                              <div className="flex justify-between"><span>Gender:</span> <span className="text-emerald-600">{log.details.gender}</span></div>
                            </>
                          )}
                          {log.type === 'Death' && (
                            <>
                              <div className="flex justify-between border-b border-slate-200/30 pb-1"><span>Penyebab:</span> <span className="text-rose-600">{log.details.causeOfDeath}</span></div>
                              <div className="flex justify-between"><span>Tempat:</span> <span className="text-rose-600">{log.details.placeOfDeath}</span></div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEditLog(log)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Edit Log"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        title="Hapus Log"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-6 bg-slate-50 rounded-full text-slate-300"><List size={48} /></div>
                      <div>
                        <p className="font-black text-slate-800 text-lg">Tidak ada data mutasi</p>
                        <p className="text-slate-400 font-medium">Belum ada catatan mutasi yang sesuai dengan kriteria pencarian.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

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
            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={14} /> Periode Laporan
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Bulan (YYYY-MM)</label>
                <div className="relative">
                  <input 
                    type="month" 
                    value={formData.month} 
                    onChange={e => setFormData({...formData, month: e.target.value})} 
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Tahun</label>
                <input 
                  type="number" 
                  value={formData.year} 
                  onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} 
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
              <Clock size={14} /> Warga Musiman / Kontrak
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
                      <option value="Rumah Keluarga">Rumah Keluarga</option>
                      <option value="Kontrak">Kontrak</option>
                      <option value="Kost">Kost</option>
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

            <div className="col-span-2">
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

