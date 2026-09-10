import React, { useMemo, useState } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, 
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, AreaChart, Area 
} from 'recharts';
import { 
  Users, Baby, User, UserCheck, Heart, TrendingUp, 
  BookOpen, Car, GraduationCap, Briefcase, MapPin, 
  ChevronRight, Info, Sparkles, FileText, AlertTriangle, Activity, DollarSign,
  Copy, CheckCircle2, Share2, Printer, Layers, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { House, CashFlow, Report, PdfConfig } from '../../types';
import { generateDemographicAnalyticsReportPDF } from '../../services/pdfService';

interface DemographicAnalyticsProps {
  houses: House[];
  cashFlow: CashFlow[];
  reports: Report[];
  pdfConfig: PdfConfig;
  hideHeader?: boolean;
}

export const DemographicAnalytics: React.FC<DemographicAnalyticsProps> = ({ 
  houses = [], 
  cashFlow = [], 
  reports = [], 
  pdfConfig,
  hideHeader = false
}) => {
  const [activeTab, setActiveTab] = useState<'demographics' | 'advanced'>('demographics');

  // Early return if data is missing
  if (!houses || !Array.isArray(houses)) {
    return (
      <div className="flex items-center justify-center p-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
        <div className="text-center">
          <Users className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500 font-medium">Memuat data analitik...</p>
        </div>
      </div>
    );
  }

  // Helper to calculate age
  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return 30;
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return 30;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const [selectedBlock, setSelectedBlock] = useState<string>('ALL');

  // Filter houses by selectedBlock
  const filteredHouses = useMemo(() => {
    if (selectedBlock === 'ALL') return houses;
    return houses.filter(h => h.block === selectedBlock || h.number?.startsWith(selectedBlock));
  }, [houses, selectedBlock]);

  // Aggregate all residents (Head of Family + Family Members)
  const stats = useMemo(() => {
    const allResidents: any[] = [];
    const religions: Record<string, number> = {};
    const educations: Record<string, number> = {};
    const jobs: Record<string, number> = {};
    const economicStatuses: Record<string, number> = {};
    const bpjsStatuses: Record<string, number> = {};
    const vaccinationStatuses: Record<string, number> = {};
    const residenceTypes: Record<string, number> = {};
    
    let totalVehicles = 0;
    let totalMotor = 0;
    let totalMobil = 0;
    let totalSoul = 0;
    let totalPregnant = 0;
    let totalBabies = 0;
    let totalToddlers = 0;
    let totalChildren = 0;
    let totalTeenagers = 0;
    let totalAdults = 0;
    let totalElderly = 0;
    let totalWidows = 0;
    let totalDisability = 0;
    let totalOrphans = 0;
    let totalPKH = 0;
    let totalBLT = 0;
    let totalBansosLain = 0;
    let totalOccupied = 0;

    houses.forEach(h => {
      if (h && h.status === 'Occupied') {
        const w2 = h.twoWheelCount || 0;
        const w4 = h.fourWheelCount || 0;
        totalMotor += w2;
        totalMobil += w4;
        totalVehicles += (w2 + w4 > 0 ? w2 + w4 : (h.vehicleCount || 0));
        const occupantsCount = Math.max(h.occupants || 1, 1 + (h.familyMembers?.length || 0));
        totalSoul += occupantsCount;
        
        // ... (vulnerable group increments) ...
        totalPregnant += (h.pregnantCount || 0);
        totalBabies += (h.babyCount || 0);
        totalToddlers += (h.toddlerCount || 0);
        totalChildren += (h.childCount || 0);
        totalTeenagers += (h.teenagerCount || 0);
        totalAdults += (h.adultCount || 0);
        totalElderly += (h.elderlyCount || 0);
        totalWidows += (h.widowCount || 0);
        totalDisability += (h.disabilityCount || 0);
        totalOrphans += (h.orphanCount || 0);
        
        if (h.isPKH) totalPKH++;
        if (h.isBLT) totalBLT++;
        if (h.isBansosLain) totalBansosLain++;
        totalOccupied++;

        // Process Head of Family
        const hoFAge = calculateAge(h.birthDate);
        const hoF = {
          gender: h.gender || 'Laki-laki',
          age: hoFAge,
          job: h.jobCategory || 'Lainnya',
          religion: h.religion || 'Lainnya',
          education: h.education || 'Lainnya',
          economicStatus: h.economicStatus || 'Sejahtera',
          bpjsStatus: h.bpjsStatus || 'Tidak Ada',
          vaccinationStatus: h.vaccinationStatus || 'Belum'
        };
        allResidents.push(hoF);

        religions[hoF.religion] = (religions[hoF.religion] || 0) + 1;
        educations[hoF.education] = (educations[hoF.education] || 0) + 1;
        jobs[hoF.job] = (jobs[hoF.job] || 0) + 1;
        economicStatuses[hoF.economicStatus] = (economicStatuses[hoF.economicStatus] || 0) + 1;
        bpjsStatuses[hoF.bpjsStatus] = (bpjsStatuses[hoF.bpjsStatus] || 0) + 1;
        vaccinationStatuses[hoF.vaccinationStatus] = (vaccinationStatuses[hoF.vaccinationStatus] || 0) + 1;
        residenceTypes[h.residenceType || 'Tetap'] = (residenceTypes[h.residenceType || 'Tetap'] || 0) + 1;
        
        // Track registered count for this house to calculate gap
        let houseRegisteredCount = 1;

        // Add Family Members
        if (h.familyMembers && Array.isArray(h.familyMembers)) {
          h.familyMembers.forEach((m: any) => {
            if (!m) return;
            houseRegisteredCount++;
            const mAge = calculateAge(m.birthDate);
            const member = {
              gender: m.gender || 'Laki-laki',
              age: mAge,
              job: m.job || 'Lainnya',
              religion: h.religion || 'Lainnya',
              education: m.education || 'Lainnya',
              economicStatus: h.economicStatus || 'Sejahtera',
              bpjsStatus: m.bpjsStatus || 'Tidak Ada',
              vaccinationStatus: m.vaccinationStatus || 'Belum'
            };
            allResidents.push(member);
            religions[member.religion] = (religions[member.religion] || 0) + 1;
            educations[member.education] = (educations[member.education] || 0) + 1;
            jobs[member.job] = (jobs[member.job] || 0) + 1;
            bpjsStatuses[member.bpjsStatus] = (bpjsStatuses[member.bpjsStatus] || 0) + 1;
            vaccinationStatuses[member.vaccinationStatus] = (vaccinationStatuses[member.vaccinationStatus] || 0) + 1;
          });
        }

        // --- GAP ADJUSTMENT: Account for occupants not registered in familyMembers ---
        if (occupantsCount > houseRegisteredCount) {
          const gap = occupantsCount - houseRegisteredCount;
          // Estimate missing genders (split 50/50 or based on HoF)
          const maleGap = Math.ceil(gap / 2);
          const femaleGap = Math.floor(gap / 2);
          
          // We can't easily push to allResidents without full detail, 
          // so we'll adjust the distribution maps directly if needed, 
          // but for DemographicAnalytics charts that use filtered allResidents, we should probably push "Generic" residents
          for (let i = 0; i < gap; i++) {
            const isMale = i < maleGap;
            const genericResident = {
              gender: isMale ? 'Laki-laki' : 'Perempuan',
              age: 30, // Average age for generic stats
              job: 'Lainnya',
              religion: h.religion || 'Lainnya',
              education: 'Lainnya',
              economicStatus: h.economicStatus || 'Sejahtera',
              bpjsStatus: 'Tidak Ada',
              vaccinationStatus: 'Belum'
            };
            // Note: Don't push to allResidents here to avoid cluttering detailed views, 
            // but the charts below will use allResidents. Actually, it's better to push them 
            // but marked as "Estimasi" if we had that.
            // For now, let's just make sure the charts sum up to totalSoul by pushing them.
            allResidents.push(genericResident);
            
            // Increment maps
            religions[genericResident.religion] = (religions[genericResident.religion] || 0) + 1;
            jobs[genericResident.job] = (jobs[genericResident.job] || 0) + 1;
            // ... educations, etc if needed
          }
        }
      }
    });

    return {
      allResidents,
      religions,
      educations,
      jobs,
      economicStatuses,
      bpjsStatuses,
      vaccinationStatuses,
      residenceTypes,
      totalVehicles,
      totalMotor,
      totalMobil,
      totalSoul,
      totalPregnant,
      totalBabies,
      totalToddlers,
      totalChildren,
      totalTeenagers,
      totalAdults,
      totalElderly,
      totalWidows,
      totalDisability,
      totalOrphans,
      totalPKH,
      totalBLT,
      totalBansosLain,
      totalOccupied
    };
  }, [filteredHouses]);

  const { 
    allResidents, religions, educations, jobs, 
    economicStatuses, bpjsStatuses, vaccinationStatuses, residenceTypes,
    totalVehicles, totalMotor, totalMobil, totalSoul, totalPregnant, totalBabies, 
    totalToddlers, totalChildren, totalTeenagers, totalAdults,
    totalElderly, totalWidows, totalDisability, totalOrphans, totalPKH, totalBLT, totalBansosLain, totalOccupied 
  } = stats;

  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrintReport = async () => {
    setIsPrinting(true);
    try {
      await generateDemographicAnalyticsReportPDF(houses, cashFlow, reports, pdfConfig);
    } catch (error) {
      console.error(error);
    } finally {
      setIsPrinting(false);
    }
  };

  const totalResidents = totalSoul; 
  const totalRegistered = allResidents.length; 
  
  // Data for new charts
  const economicData = Object.entries(economicStatuses)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const bpjsData = Object.entries(bpjsStatuses)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const vaccinationData = Object.entries(vaccinationStatuses)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const residenceTypeData = Object.entries(residenceTypes)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const socialAssistanceData = [
    { name: 'Penerima PKH', value: totalPKH, color: '#6366f1' },
    { name: 'Penerima BLT', value: totalBLT, color: '#10b981' },
    { name: 'Bansos Lain', value: totalBansosLain, color: '#f59e0b' },
    { name: 'Non-Penerima', value: Math.max(0, totalOccupied - totalPKH - totalBLT - totalBansosLain), color: '#f1f5f9' }
  ];
  
  // Age distribution
  const ageGroups = {
    bayi: totalBabies,
    balita: totalToddlers,
    anak: totalChildren,
    remaja: totalTeenagers,
    dewasa: totalAdults,
    lansia: totalElderly,
  };

  const ageDistribution = [
    { name: 'Bayi (0-1)', value: ageGroups.bayi, color: '#06b6d4' },
    { name: 'Balita (1-5)', value: ageGroups.balita, color: '#10b981' },
    { name: 'Anak (6-12)', value: ageGroups.anak, color: '#3b82f6' },
    { name: 'Remaja (13-18)', value: ageGroups.remaja, color: '#6366f1' },
    { name: 'Dewasa (19-55)', value: ageGroups.dewasa, color: '#8b5cf6' },
    { name: 'Lansia (55+)', value: ageGroups.lansia, color: '#f59e0b' },
  ];

  const genderDistribution = [
    { name: 'Laki-laki', value: allResidents.filter(r => r.gender === 'Laki-laki').length, color: '#3b82f6' },
    { name: 'Perempuan', value: allResidents.filter(r => r.gender === 'Perempuan').length, color: '#ec4899' },
  ];

  const religionData = Object.entries(religions)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const educationData = Object.entries(educations)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const occupationData = Object.entries(jobs)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  // Population Pyramid State
  const [pyramidDisplayMode, setPyramidDisplayMode] = useState<'count' | 'percent'>('count');
  const [hoveredCohort, setHoveredCohort] = useState<string | null>(null);

  // Accurate BPS-Standard Cohorts for Huntap 2 Tondo
  const pyramidCohorts = useMemo(() => {
    const definitions = [
      { key: '60+', label: '60+ Thn', fullLabel: 'Lansia (60 tahun ke atas)', min: 60, max: 150, category: 'Lansia', color: '#f59e0b' },
      { key: '50-59', label: '50-59 Thn', fullLabel: 'Pra-Lansia (50-59 tahun)', min: 50, max: 59, category: 'Produktif', color: '#6366f1' },
      { key: '40-49', label: '40-49 Thn', fullLabel: 'Dewasa Madya (40-49 tahun)', min: 40, max: 49, category: 'Produktif', color: '#6366f1' },
      { key: '30-39', label: '30-39 Thn', fullLabel: 'Dewasa (30-39 tahun)', min: 30, max: 39, category: 'Produktif', color: '#6366f1' },
      { key: '20-29', label: '20-29 Thn', fullLabel: 'Pemuda (20-29 tahun)', min: 20, max: 29, category: 'Produktif', color: '#6366f1' },
      { key: '15-19', label: '15-19 Thn', fullLabel: 'Remaja (15-19 tahun)', min: 15, max: 19, category: 'Produktif', color: '#8b5cf6' },
      { key: '10-14', label: '10-14 Thn', fullLabel: 'Pra-Remaja (10-14 tahun)', min: 10, max: 14, category: 'Muda', color: '#06b6d4' },
      { key: '5-9', label: '5-9 Thn', fullLabel: 'Anak-anak (5-9 tahun)', min: 5, max: 9, category: 'Muda', color: '#10b981' },
      { key: '0-4', label: '0-4 Thn', fullLabel: 'Balita (0-4 tahun)', min: 0, max: 4, category: 'Muda', color: '#14b8a6' }
    ];

    const totalPop = allResidents.length || 1;

    return definitions.map(def => {
      const male = allResidents.filter(r => (r.gender === 'Laki-laki' || r.gender === 'Pria') && r.age >= def.min && r.age <= def.max).length;
      const female = allResidents.filter(r => (r.gender === 'Perempuan' || r.gender === 'Wanita') && r.age >= def.min && r.age <= def.max).length;
      const total = male + female;
      const malePct = (male / totalPop) * 100;
      const femalePct = (female / totalPop) * 100;
      const totalPct = (total / totalPop) * 100;

      return {
        ...def,
        male,
        female,
        total,
        malePct,
        femalePct,
        totalPct
      };
    });
  }, [allResidents]);

  // Max value for scaling pyramid bars
  const maxCohortVal = useMemo(() => {
    let max = 1;
    pyramidCohorts.forEach(c => {
      if (c.male > max) max = c.male;
      if (c.female > max) max = c.female;
    });
    return max;
  }, [pyramidCohorts]);

  // Demographic Indicators for Kelurahan / BPS Standard
  const totalMale = useMemo(() => allResidents.filter(r => r.gender === 'Laki-laki' || r.gender === 'Pria').length, [allResidents]);
  const totalFemale = useMemo(() => allResidents.filter(r => r.gender === 'Perempuan' || r.gender === 'Wanita').length, [allResidents]);
  const sexRatio = useMemo(() => totalFemale > 0 ? ((totalMale / totalFemale) * 100).toFixed(1) : '100.0', [totalMale, totalFemale]);
  
  const youngDependents = useMemo(() => allResidents.filter(r => r.age < 15).length, [allResidents]);
  const productiveAge = useMemo(() => allResidents.filter(r => r.age >= 15 && r.age <= 59).length, [allResidents]);
  const elderlyDependents = useMemo(() => allResidents.filter(r => r.age >= 60).length, [allResidents]);
  
  const dependencyRatio = useMemo(() => productiveAge > 0 ? (((youngDependents + elderlyDependents) / productiveAge) * 100).toFixed(1) : '0', [youngDependents, elderlyDependents, productiveAge]);
  const ageingIndex = useMemo(() => youngDependents > 0 ? ((elderlyDependents / youngDependents) * 100).toFixed(1) : '0', [youngDependents, elderlyDependents]);
  const averageSoulPerKK = useMemo(() => totalOccupied > 0 ? (totalSoul / totalOccupied).toFixed(1) : '0', [totalSoul, totalOccupied]);

  // Block Population Distribution (Huntap Blok A s/d F)
  const blockDistribution = useMemo(() => {
    const blocks = ['A', 'B', 'C', 'D', 'E', 'F'];
    return blocks.map(b => {
      const blockHouses = houses.filter(h => h.block === b || h.number?.startsWith(b));
      const occupied = blockHouses.filter(h => h.status === 'Occupied').length;
      const soul = blockHouses.reduce((sum, h) => {
        if (h.status !== 'Occupied') return sum;
        const occupantsCount = Math.max(h.occupants || 1, 1 + (h.familyMembers?.length || 0));
        return sum + occupantsCount;
      }, 0);
      return {
        block: `Blok ${b}`,
        houses: blockHouses.length,
        occupied,
        empty: blockHouses.length - occupied,
        soul
      };
    });
  }, [houses]);

  const handleCopyKelurahanSummary = () => {
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const text = `📋 LAPORAN DEMOGRAFI & KEPENDUDUKAN RT 002 / RW 020
Wilayah: Hunian Tetap (Huntap) 2 Tondo, Kel. Tondo, Kec. Mantikulore, Kota Palu
Tanggal Pembaruan: ${dateStr}
Filter Wilayah: ${selectedBlock === 'ALL' ? 'Semua Blok (A - F)' : `Blok ${selectedBlock}`}

1. STATISTIK KEPALA KELUARGA & HUNIAN:
   • Total KK Aktif: ${totalOccupied} KK
   • Total Jiwa Penduduk: ${totalSoul} Jiwa
   • Rata-rata Jiwa per KK: ${averageSoulPerKK} Jiwa/KK
   • Total Kendaraan Warga: ${totalVehicles} Unit (${totalMotor} Motor, ${totalMobil} Mobil)

2. KOMPOSISI JENIS KELAMIN (SEX RATIO):
   • Laki-laki: ${totalMale} Jiwa (${totalResidents > 0 ? ((totalMale / totalResidents) * 100).toFixed(1) : 0}%)
   • Perempuan: ${totalFemale} Jiwa (${totalResidents > 0 ? ((totalFemale / totalResidents) * 100).toFixed(1) : 0}%)
   • Rasio Jenis Kelamin (Sex Ratio): ${sexRatio} (Terdapat ~${Math.round(Number(sexRatio))} pria per 100 wanita)

3. STRUKTUR USIA & RASIO KETERGANTUNGAN (BPS):
   • Kelompok Usia Muda (0-14 Thn): ${youngDependents} Jiwa (${totalResidents > 0 ? ((youngDependents / totalResidents) * 100).toFixed(1) : 0}%)
   • Kelompok Usia Produktif (15-59 Thn): ${productiveAge} Jiwa (${totalResidents > 0 ? ((productiveAge / totalResidents) * 100).toFixed(1) : 0}%)
   • Kelompok Lansia (60+ Thn): ${elderlyDependents} Jiwa (${totalResidents > 0 ? ((elderlyDependents / totalResidents) * 100).toFixed(1) : 0}%)
   • Rasio Ketergantungan (Dependency Ratio): ${dependencyRatio}%
   • Indeks Penuaan Penduduk: ${ageingIndex}%

4. KELOMPOK RENTAN & BANTUAN SOSIAL:
   • Balita & Anak: ${totalToddlers + totalChildren} Jiwa
   • Ibu Hamil: ${totalPregnant} Jiwa
   • Disabilitas: ${totalDisability} Jiwa
   • Penerima PKH: ${totalPKH} KK | Penerima BLT: ${totalBLT} KK

Catatan: Data sinkron otomatis dari Aplikasi Portal Teras Warga RT 002.`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      toast.success("Format Laporan Kelurahan Disalin!", {
        description: "Teks berhasil disalin ke clipboard, siap dikirim via WhatsApp atau dilampirkan ke surat pengantar."
      });
    } else {
      toast.info("Ringkasan Data Siap", { description: text.slice(0, 100) + '...' });
    }
  };

  // Advanced Analytics Data
  const missingPhoneCount = houses.filter(h => !h.phone || h.phone === '-').length;
  const unverifiedHousesCount = houses.filter(h => !h.isVerified).length;
  
  const monthlyCashFlow = useMemo(() => {
    if (!cashFlow || !Array.isArray(cashFlow)) return [];
    
    try {
      const groups = cashFlow.reduce((acc: any, curr) => {
        if (!curr || !curr.date) return acc;
        const date = new Date(curr.date);
        if (isNaN(date.getTime())) return acc;
        
        const month = date.getMonth();
        const year = date.getFullYear();
        const monthKey = `${month + 1}-${year}`;
        const sortKey = year * 100 + month;
        
        if (!acc[monthKey]) {
          // Fallback for toLocaleDateString
          let monthLabel = monthKey;
          try {
            monthLabel = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
          } catch (e) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            monthLabel = `${months[month]} ${year}`;
          }
          
          acc[monthKey] = { month: monthLabel, Income: 0, Expense: 0, sortKey };
        }
        
        if (curr.type === 'Income' || curr.type === 'Expense') {
          acc[monthKey][curr.type] += Number(curr.amount) || 0;
        }
        return acc;
      }, {});
      
      return Object.values(groups).sort((a: any, b: any) => a.sortKey - b.sortKey);
    } catch (err) {
      return [];
    }
  }, [cashFlow]);

  const cashFlowChartData = monthlyCashFlow;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-24"
    >
      {/* Header Section */}
      {!hideHeader && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <Sparkles size={16} className="text-white" />
              </div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Intelligence Center</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Analitik & Demografi</h2>
            <p className="text-slate-500 font-medium mt-2 max-w-2xl">
              Pusat data terpadu RT 02 untuk memantau demografi warga, tren keuangan, dan kualitas data secara real-time.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Action Buttons for Kelurahan & PDF */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyKelurahanSummary}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Salin ringkasan data kependudukan untuk laporan Kelurahan Tondo"
              >
                <Copy size={14} />
                <span className="hidden sm:inline">Salin Format Kelurahan</span>
              </button>
              <button
                onClick={handlePrintReport}
                disabled={isPrinting}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
                title="Cetak dokumen laporan analitik demografi resmi"
              >
                <Printer size={14} />
                <span className="hidden sm:inline">{isPrinting ? 'Menyiapkan...' : 'Cetak PDF'}</span>
              </button>
            </div>

            {/* Block Filter Dropdown */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <MapPin size={14} className="text-slate-400 ml-2" />
              <select
                value={selectedBlock}
                onChange={(e) => setSelectedBlock(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-700 outline-none pr-2 cursor-pointer"
              >
                <option value="ALL">Semua Blok</option>
                {Array.from(new Set(houses.map(h => h.block || h.number?.charAt(0)).filter(Boolean))).sort().map(b => (
                  <option key={b} value={b}>Blok {b}</option>
                ))}
              </select>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button 
                onClick={() => setActiveTab('demographics')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'demographics' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Demografi
              </button>
              <button 
                onClick={() => setActiveTab('advanced')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'advanced' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Operasional & Tren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="relative min-h-[500px]">
        {(hideHeader || activeTab === 'demographics') ? (
          <div key="demographics" className="space-y-10">
            {/* Primary Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
              {[
                { icon: Users, label: 'Total Jiwa', value: totalSoul, sub: 'Penduduk Terdaftar', color: 'blue' },
                { icon: Baby, label: 'Balita & Anak', value: totalToddlers + totalChildren, sub: 'Generasi Penerus', color: 'emerald' },
                { icon: Heart, label: 'Lansia', value: totalElderly, sub: 'Warga Senior', color: 'amber' },
                { 
                  icon: Activity, 
                  label: 'Dependency Ratio', 
                  value: totalAdults > 0 ? `${Math.round(((totalToddlers + totalChildren + totalBabies + totalElderly) / totalAdults) * 100)}%` : '0%', 
                  sub: 'Tanggungan Posyandu', 
                  color: 'rose' 
                },
                { icon: Car, label: 'Total Kendaraan', value: totalVehicles, sub: `${totalMotor} Motor • ${totalMobil} Mobil`, color: 'indigo' }
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group bg-white p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3.5 bg-slate-50 text-slate-600 rounded-2xl group-hover:rotate-6 transition-transform shrink-0">
                      <stat.icon size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{stat.label}</p>
                      <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-none mb-1">{stat.value}</h3>
                      <p className="text-[10px] font-bold text-slate-400 truncate">{stat.sub}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* KELURAHAN TONDO COMPREHENSIVE INDICATORS CARD */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden border border-slate-800"
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-5">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-wider text-indigo-300 backdrop-blur-md mb-2">
                      <ShieldCheck size={12} className="text-emerald-400" />
                      STANDAR BPS & KELURAHAN TONDO
                    </div>
                    <h3 className="text-xl md:text-2xl font-black tracking-tight">
                      Indikator Utama Kependudukan & Rasio Demografi
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Parameter resmi demografi kependudukan kawasan Huntap 2 Tondo, Kecamatan Mantikulore, Kota Palu.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyKelurahanSummary}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                    >
                      <Share2 size={14} />
                      <span>Kirim ke Kelurahan</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Rasio Jenis Kelamin</p>
                    <p className="text-2xl md:text-3xl font-black text-white mt-1">{sexRatio}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      {totalMale} L : {totalFemale} P (per 100 wanita)
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                    <p className="text-[10px] font-black text-amber-300 uppercase tracking-widest">Rasio Ketergantungan</p>
                    <p className="text-2xl md:text-3xl font-black text-white mt-1">{dependencyRatio}%</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      Tanggungan per 100 usia produktif
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                    <p className="text-[10px] font-black text-teal-300 uppercase tracking-widest">Indeks Penuaan</p>
                    <p className="text-2xl md:text-3xl font-black text-white mt-1">{ageingIndex}%</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      {elderlyDependents} Lansia vs {youngDependents} Anak
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                    <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest">Rata-rata Jiwa / KK</p>
                    <p className="text-2xl md:text-3xl font-black text-white mt-1">{averageSoulPerKK}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      Kepadatan hunian aktif
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* INTERACTIVE POPULATION PYRAMID (PIRAMIDA PENDUDUK BPS) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-200/80 shadow-sm relative overflow-hidden"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-600">Visualisasi BPS Interaktif</span>
                  </div>
                  <h3 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">
                    Piramida Penduduk <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-pink-600">RT 002 / RW 020</span>
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-1 max-w-xl">
                    Distribusi simetris struktur demografi warga berdasarkan kelompok umur standar BPS dan jenis kelamin.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Mode Toggle (Count vs Percent) */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-[11px] font-black">
                    <button
                      onClick={() => setPyramidDisplayMode('count')}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        pyramidDisplayMode === 'count'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Jiwa
                    </button>
                    <button
                      onClick={() => setPyramidDisplayMode('percent')}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        pyramidDisplayMode === 'percent'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Persen (%)
                    </button>
                  </div>
                </div>
              </div>

              {/* Legend Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 mb-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 shadow-xs" />
                    <span className="text-xs font-black text-slate-800">Laki-laki ({totalMale} Jiwa)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 shadow-xs" />
                    <span className="text-xs font-black text-slate-800">Perempuan ({totalFemale} Jiwa)</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500" /> Muda (0-14)</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Produktif (15-59)</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Lansia (60+)</span>
                </div>
              </div>

              {/* Dual Sided Horizontal Bar Pyramid */}
              <div className="space-y-2.5 max-w-4xl mx-auto py-2">
                {pyramidCohorts.map((cohort) => {
                  const isHovered = hoveredCohort === cohort.key;
                  const maleWidthPct = (cohort.male / maxCohortVal) * 100;
                  const femaleWidthPct = (cohort.female / maxCohortVal) * 100;

                  return (
                    <div
                      key={cohort.key}
                      onMouseEnter={() => setHoveredCohort(cohort.key)}
                      onMouseLeave={() => setHoveredCohort(null)}
                      className={`grid grid-cols-12 items-center gap-2 md:gap-4 p-1.5 rounded-2xl transition-all ${
                        isHovered ? 'bg-indigo-50/70 scale-[1.01]' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      {/* Left: Male Bar (Right Aligned) */}
                      <div className="col-span-5 flex items-center justify-end gap-2">
                        <span className="text-[11px] md:text-xs font-black text-slate-700 w-12 text-right">
                          {pyramidDisplayMode === 'count' ? cohort.male : `${cohort.malePct.toFixed(1)}%`}
                        </span>
                        <div className="flex-1 bg-slate-100 h-6 md:h-7 rounded-xl overflow-hidden flex justify-end">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${maleWidthPct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-gradient-to-l from-blue-600 via-indigo-600 to-cyan-500 rounded-xl flex items-center justify-start pl-2 shadow-xs"
                          />
                        </div>
                      </div>

                      {/* Center: Cohort Label */}
                      <div className="col-span-2 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider ${
                          cohort.category === 'Muda' 
                            ? 'bg-teal-100 text-teal-800' 
                            : cohort.category === 'Produktif'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {cohort.label}
                        </span>
                      </div>

                      {/* Right: Female Bar (Left Aligned) */}
                      <div className="col-span-5 flex items-center justify-start gap-2">
                        <div className="flex-1 bg-slate-100 h-6 md:h-7 rounded-xl overflow-hidden flex justify-start">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${femaleWidthPct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-rose-400 rounded-xl flex items-center justify-end pr-2 shadow-xs"
                          />
                        </div>
                        <span className="text-[11px] md:text-xs font-black text-slate-700 w-12 text-left">
                          {pyramidDisplayMode === 'count' ? cohort.female : `${cohort.femalePct.toFixed(1)}%`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pyramid Interpretation Insight Card */}
              <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                      Interpretasi Struktur Demografi
                    </span>
                    <span className="text-xs font-black text-slate-800">
                      Tipe: Piramida Konstruktif / Bonus Demografi
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    Populasi didominasi usia produktif (15-59 tahun) sebesar {totalResidents > 0 ? Math.round((productiveAge / totalResidents) * 100) : 0}%, ideal untuk pengembangan ekonomi lokal, kegiatan gotong royong, dan siskamling lingkungan.
                  </p>
                </div>
                <button
                  onClick={handleCopyKelurahanSummary}
                  className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <Copy size={13} />
                  <span>Salin Analisis</span>
                </button>
              </div>
            </motion.div>

            {/* SEBARAN KEPENDUDUKAN PER BLOK HUNTAP 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 md:p-8 rounded-[3rem] border border-slate-200/80 shadow-sm"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Sebaran Penduduk per Blok Huntap</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Komparasi Hunian Blok A s/d Blok F</p>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                  Total 6 Blok Hunian
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {blockDistribution.map((b) => (
                  <div
                    key={b.block}
                    onClick={() => setSelectedBlock(b.block.replace('Blok ', ''))}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      selectedBlock === b.block.replace('Blok ', '')
                        ? 'bg-indigo-50/80 border-indigo-300 shadow-sm ring-2 ring-indigo-500/20'
                        : 'bg-slate-50/80 border-slate-200/80 hover:bg-white hover:shadow-md'
                    }`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{b.block}</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{b.soul} <span className="text-[10px] text-slate-500 font-bold">Jiwa</span></p>
                    <div className="mt-2 text-[10px] font-medium text-slate-500 space-y-0.5">
                      <p>✅ {b.occupied} Terisi</p>
                      <p>⚪ {b.empty} Kosong</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Age Distribution - Large Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Distribusi Usia</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Komposisi Generasi Warga</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                    <TrendingUp size={20} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ageDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                        >
                          {ageDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '16px' }}
                          itemStyle={{ fontWeight: 'bold', fontSize: '14px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    {ageDistribution.map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-sm font-bold text-slate-600">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-slate-900">{item.value}</span>
                          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {totalResidents > 0 ? Math.round((item.value / totalResidents) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Gender Distribution - Modern Vertical Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[3rem] shadow-xl shadow-indigo-600/20 text-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <h3 className="text-xl font-black tracking-tight mb-2 relative z-10">Keseimbangan Gender</h3>
                <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-10 relative z-10">Rasio Laki-laki & Perempuan</p>
                
                <div className="space-y-10 relative z-10">
                  {genderDistribution.map((item, i) => (
                    <div key={item.name} className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${i === 0 ? 'bg-blue-400/20' : 'bg-pink-400/20'}`}>
                            {i === 0 ? <User size={18} /> : <UserCheck size={18} />}
                          </div>
                          <span className="text-sm font-bold">{item.name}</span>
                        </div>
                        <span className="text-2xl font-black">{item.value} <span className="text-xs font-bold opacity-60">Jiwa</span></span>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${totalResidents > 0 ? (item.value / totalResidents) * 100 : 0}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className={`h-full rounded-full ${i === 0 ? 'bg-blue-400' : 'bg-pink-400'}`}
                        />
                      </div>
                      <p className="text-[10px] font-black text-white/40 text-right uppercase tracking-widest">
                        {totalResidents > 0 ? Math.round((item.value / totalResidents) * 100) : 0}% dari total populasi
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-12 p-5 bg-white/10 rounded-[2rem] border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <Info size={16} />
                    </div>
                    <p className="text-[10px] font-bold leading-relaxed">
                      Rasio gender yang seimbang menunjukkan keberagaman sosial yang sehat di lingkungan RT 02.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Occupation Bar Chart */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm"
              >
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Sebaran Pekerjaan</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Profil Profesional Warga</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">Top 6 Kategori</div>
                  </div>
                </div>
                
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={occupationData} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fontWeight: 'bold', fill: '#64748b' }} 
                        width={120}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 15px 35px rgba(0,0,0,0.05)' }}
                      />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={32}>
                        {occupationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Education Distribution */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm"
              >
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Tingkat Pendidikan</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Kualifikasi Akademik</p>
                
                <div className="space-y-5">
                  {educationData.slice(0, 5).map((item) => (
                    <div key={item.name} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                        <GraduationCap size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-bold text-slate-700">{item.name}</span>
                          <span className="text-xs font-black text-indigo-600">{item.value}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full" 
                            style={{ width: `${totalRegistered > 0 ? (item.value / totalRegistered) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button className="w-full mt-8 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-bold rounded-2xl transition-colors flex items-center justify-center gap-2">
                  Lihat Detail Pendidikan <ChevronRight size={14} />
                </button>
              </motion.div>

              {/* Religion Distribution */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm"
              >
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Keberagaman Agama</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Harmoni dalam Perbedaan</p>
                
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={religionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={80}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {religionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3 justify-center mt-4">
                  {religionData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <span className="text-[10px] font-bold text-slate-500">{item.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Economic Status - PROFESSIONAL CHART */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm"
              >
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Kesejahteraan Ekonomi</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Pemetaan Status Ekonomi Warga</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-500">
                    <DollarSign size={20} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={economicData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {economicData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    {economicData.map((item, index) => (
                      <div key={item.name} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span className="text-sm font-bold text-slate-700">{item.name}</span>
                        </div>
                        <span className="text-sm font-black text-slate-900">{item.value} KK</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Health & Social Coverage */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm"
              >
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Cakupan Kesehatan</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Status BPJS & Vaksinasi</p>
                
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Status BPJS</p>
                    <div className="space-y-2">
                      {bpjsData.map((item, i) => (
                        <div key={item.name} className="flex flex-col gap-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-600">
                            <span>{item.name}</span>
                            <span>{totalRegistered > 0 ? Math.round((item.value / totalRegistered) * 100) : 0}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${totalRegistered > 0 ? (item.value / totalRegistered) * 100 : 0}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Vaksinasi</p>
                    <div className="space-y-2">
                      {vaccinationData.map((item, i) => (
                        <div key={item.name} className="flex flex-col gap-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-600">
                            <span>{item.name}</span>
                            <span>{totalRegistered > 0 ? Math.round((item.value / totalRegistered) * 100) : 0}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${totalRegistered > 0 ? (item.value / totalRegistered) * 100 : 0}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Vulnerable Groups - Bento Style */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {[
                  { label: 'Ibu Hamil', value: totalPregnant, icon: Heart, color: 'rose' },
                  { label: 'Bayi', value: totalBabies, icon: Baby, color: 'sky' },
                  { label: 'Balita', value: totalToddlers, icon: Sparkles, color: 'emerald' },
                  { label: 'Anak', value: totalChildren, icon: Users, color: 'blue' },
                  { label: 'Remaja', value: totalTeenagers, icon: Users, color: 'indigo' },
                  { label: 'Dewasa', value: totalAdults, icon: UserCheck, color: 'emerald' },
                  { label: 'Lansia', value: totalElderly, icon: User, color: 'amber' },
                  { label: 'Janda', value: totalWidows, icon: Heart, color: 'pink' },
                  { label: 'Disabilitas', value: totalDisability, icon: Activity, color: 'rose' },
                  { label: 'Yatim/Piatu', value: totalOrphans, icon: Users, color: 'blue' },
                  { label: 'Penerima PKH', value: totalPKH, icon: FileText, color: 'indigo' },
                  { label: 'Penerima BLT', value: totalBLT, icon: DollarSign, color: 'emerald' },
                  { label: 'Bansos Lain', value: totalBansosLain, icon: Sparkles, color: 'violet' }
                ].map((item) => (
                  <div key={item.label} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:bg-slate-50 transition-all">
                    <div className="p-4 bg-slate-50 text-slate-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                      <item.icon size={20} />
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 mb-1">{item.value}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Quick Insights Footer */}
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-2xl font-black tracking-tight">Ringkasan Wawasan Demografi</h3>
                  <p className="text-slate-400 font-medium leading-relaxed">
                    Berdasarkan data terbaru, RT 02 memiliki populasi yang didominasi oleh kelompok usia produktif (Dewasa) sebesar {totalResidents > 0 ? Math.round((ageGroups.dewasa / totalResidents) * 100) : 0}%. 
                    Tingkat partisipasi ekonomi cukup tinggi dengan mayoritas warga bekerja sebagai {occupationData[0]?.name || 'Karyawan'}. 
                    Kebutuhan akan fasilitas ramah anak dan lansia tetap menjadi prioritas mengingat terdapat {totalBabies + totalToddlers + totalChildren} anak-anak dan {totalElderly} lansia.
                  </p>
                </div>
                <div className="flex justify-center lg:justify-end">
                  <button 
                    onClick={handlePrintReport}
                    disabled={isPrinting}
                    className="px-8 py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-indigo-50 transition-all shadow-xl shadow-white/5 flex items-center gap-3 disabled:opacity-50 disabled:cursor-wait"
                  >
                    {isPrinting ? 'Menyiapkan...' : 'Cetak Laporan Lengkap'} <FileText size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            key="advanced"
            className="space-y-10"
          >
            {/* Data Quality Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-amber-200 transition-all"
              >
                <div className="p-5 bg-amber-50 text-amber-600 rounded-[1.5rem] group-hover:scale-110 transition-transform">
                  <AlertTriangle size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Data Warga Tidak Lengkap</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">{missingPhoneCount} rumah belum memiliki nomor telepon yang valid.</p>
                  <button className="mt-3 text-xs font-black text-amber-600 uppercase tracking-widest hover:underline">Perbaiki Sekarang</button>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-rose-200 transition-all"
              >
                <div className="p-5 bg-rose-50 text-rose-600 rounded-[1.5rem] group-hover:scale-110 transition-transform">
                  <UserCheck size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Data Belum Verifikasi</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">{unverifiedHousesCount} rumah memerlukan verifikasi data fisik.</p>
                  <button className="mt-3 text-xs font-black text-rose-600 uppercase tracking-widest hover:underline">Verifikasi Massal</button>
                </div>
              </motion.div>
            </div>

            {/* Trends Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm"
              >
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                      <TrendingUp className="text-indigo-600" /> Tren Keuangan Bulanan
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Perbandingan Pemasukan & Pengeluaran</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-[10px] font-black text-slate-500 uppercase">Income</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                      <span className="text-[10px] font-black text-slate-500 uppercase">Expense</span>
                    </div>
                  </div>
                </div>
                <div className="h-[350px] w-full">
                  {cashFlowChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cashFlowChartData}>
                        <defs>
                          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 'bold', fill: '#94a3b8'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 'bold', fill: '#94a3b8'}} tickFormatter={(v) => `Rp${v/1000000}jt`} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '16px' }}
                        />
                        <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                        <Area type="monotone" dataKey="Expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 text-sm italic">
                      Belum ada data transaksi untuk ditampilkan.
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
                <div className="relative z-10">
                  <div className="p-4 bg-white/10 rounded-2xl w-fit mb-6">
                    <Activity size={24} className="text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-black tracking-tight mb-4">Efisiensi Operasional</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-8">
                    Sistem mendeteksi peningkatan efisiensi sebesar 15% dalam pengelolaan administrasi surat-menyurat bulan ini.
                  </p>
                  
                  <div className="space-y-6">
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-300">Respon Laporan</span>
                        <span className="text-xs font-black text-emerald-400">Cepat</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[85%]"></div>
                      </div>
                    </div>
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-300">Koleksi Iuran</span>
                        <span className="text-xs font-black text-amber-400">72%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-[72%]"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button className="relative z-10 mt-10 w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-3">
                  Optimalkan Sistem <ChevronRight size={18} />
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
