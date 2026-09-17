import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CheckCircle2, AlertTriangle, Download, Search, 
  Sparkles, Edit3, Filter, RefreshCw,
  Droplets, Trash2, CheckSquare, XCircle, Info,
  ShieldCheck, Waves, Recycle, Users, Building2,
  ChevronDown, ChevronUp, Printer, FileSpreadsheet,
  X, Check, Flame, ArrowRight, BarChart3, ListFilter,
  CheckCheck
} from 'lucide-react';
import { House, STBMRecord } from '../../types';
import { Modal } from '../ui/Modal';
import { toast } from 'sonner';
import { 
  subscribeToSTBMRecords, 
  saveSTBMRecord, 
  batchSaveSTBMRecords 
} from '../../services/databaseService';
import { exportSTBMReportExcel, naturalSortBlockAndNumber } from '../../services/excelService';
import { useConfirm } from '../../context/ConfirmContext';

interface STBMManagerProps {
  houses: House[];
}

export const STBMManager: React.FC<STBMManagerProps> = ({ houses }) => {
  const confirm = useConfirm();
  const [stbmRecords, setStbmRecords] = useState<STBMRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<string>('all');
  const [filterFollowUp, setFilterFollowUp] = useState<'all' | 'needs' | 'ok'>('all');
  const [activeTab, setActiveTab] = useState<'table' | 'summary' | 'issues'>('table');
  const [showInfraDetails, setShowInfraDetails] = useState(true);
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<STBMRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  // Subscribe to real-time STBM records
  useEffect(() => {
    setSyncStatus('syncing');
    const unsub = subscribeToSTBMRecords((records) => {
      setStbmRecords(records);
      setSyncStatus('synced');
      setLastSyncTime(new Date());
    });
    return () => unsub();
  }, []);

  // Map STBM records by houseId for fast lookup
  const stbmMap = useMemo(() => {
    const map = new Map<string, STBMRecord>();
    stbmRecords.forEach(r => {
      map.set(r.houseId, r);
    });
    return map;
  }, [stbmRecords]);

  // Merge houses with STBM data
  const allMergedRecords: STBMRecord[] = useMemo(() => {
    const sortedHouses = [...houses].sort((a, b) => naturalSortBlockAndNumber(a.block, a.number, b.block, b.number));

    return sortedHouses.map(h => {
      const existing = stbmMap.get(h.id);
      if (existing) {
        return {
          ...existing,
          headOfFamily: existing.headOfFamily || h.headOfFamily || '',
          occupants: existing.occupants || h.occupants || 0,
        };
      }

      // Default STBM template for Huntap Tondo 2
      return {
        id: `stbm_${h.id}`,
        houseId: h.id,
        block: h.block,
        number: h.number,
        headOfFamily: h.headOfFamily || '',
        occupants: h.occupants || 0,
        hasHealthyLatrine: true,    // Huntap standar PUPR memiliki biotank leher angsa
        isBABS: false,               // Tidak buang air besar sembarangan (ODF)
        hasCTPS: true,              // Sarana CTPS ada
        safeWaterAndFood: true,      // PAMM-RT aman
        wasteManagement: true,       // Terlayani TPS3R Tondo 2
        liquidWasteManagement: true, // Saluran pembuangan air limbah (SPALDT) tertutup
        hasCleanWaterAccess: true,   // Terhubung jaringan PDAM
        hasSTBMTriggering: true,     // Sudah dipicu/sosialisasi STBM
        needsFollowUp: false,
        problemType: '',
        notes: '',
        updatedAt: new Date().toISOString()
      };
    });
  }, [houses, stbmMap]);

  // Block counts calculation
  const blockCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allMergedRecords.forEach(r => {
      counts[r.block] = (counts[r.block] || 0) + 1;
    });
    return counts;
  }, [allMergedRecords]);

  // Unique Blocks for filter pills
  const availableBlocks = useMemo(() => {
    const set = new Set<string>();
    houses.forEach(h => {
      if (h.block) set.add(h.block);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [houses]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return allMergedRecords.filter(rec => {
      // Filter tab 'issues'
      if (activeTab === 'issues' && !rec.needsFollowUp && !rec.isBABS && rec.hasHealthyLatrine) {
        return false;
      }

      // Filter Block
      if (selectedBlock !== 'all' && rec.block.toLowerCase() !== selectedBlock.toLowerCase()) {
        return false;
      }
      // Filter Follow Up
      if (filterFollowUp === 'needs' && !rec.needsFollowUp) return false;
      if (filterFollowUp === 'ok' && rec.needsFollowUp) return false;

      // Filter Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const blockNum = `${rec.block}-${rec.number}`.toLowerCase();
        const head = (rec.headOfFamily || '').toLowerCase();
        const prob = (rec.problemType || '').toLowerCase();
        const notes = (rec.notes || '').toLowerCase();
        return blockNum.includes(q) || head.includes(q) || prob.includes(q) || notes.includes(q);
      }
      return true;
    });
  }, [allMergedRecords, selectedBlock, filterFollowUp, searchQuery, activeTab]);

  // Pagination slice
  const paginatedRecords = useMemo(() => {
    if (pageSize === -1) return filteredRecords;
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const totalPages = pageSize === -1 ? 1 : Math.ceil(filteredRecords.length / pageSize);

  // Overall Statistics calculation
  const stats = useMemo(() => {
    const total = allMergedRecords.length;
    if (total === 0) return { total: 0, latrine: 0, noBABS: 0, ctps: 0, food: 0, waste: 0, liquid: 0, water: 0, triggering: 0, followUp: 0 };
    
    let latrine = 0;
    let noBABS = 0;
    let ctps = 0;
    let food = 0;
    let waste = 0;
    let liquid = 0;
    let water = 0;
    let triggering = 0;
    let followUp = 0;

    allMergedRecords.forEach(r => {
      if (r.hasHealthyLatrine) latrine++;
      if (!r.isBABS) noBABS++;
      if (r.hasCTPS) ctps++;
      if (r.safeWaterAndFood) food++;
      if (r.wasteManagement) waste++;
      if (r.liquidWasteManagement) liquid++;
      if (r.hasCleanWaterAccess) water++;
      if (r.hasSTBMTriggering) triggering++;
      if (r.needsFollowUp) followUp++;
    });

    return {
      total,
      latrine: Math.round((latrine / total) * 100),
      noBABS: Math.round((noBABS / total) * 100),
      ctps: Math.round((ctps / total) * 100),
      food: Math.round((food / total) * 100),
      waste: Math.round((waste / total) * 100),
      liquid: Math.round((liquid / total) * 100),
      water: Math.round((water / total) * 100),
      triggering: Math.round((triggering / total) * 100),
      followUp
    };
  }, [allMergedRecords]);

  // Aggregate stats per block for Tab 2
  const blockAggregates = useMemo(() => {
    return availableBlocks.map(blk => {
      const recordsInBlock = allMergedRecords.filter(r => r.block === blk);
      const total = recordsInBlock.length;
      if (total === 0) return null;

      const latrine = recordsInBlock.filter(r => r.hasHealthyLatrine).length;
      const noBabs = recordsInBlock.filter(r => !r.isBABS).length;
      const ctps = recordsInBlock.filter(r => r.hasCTPS).length;
      const food = recordsInBlock.filter(r => r.safeWaterAndFood).length;
      const waste = recordsInBlock.filter(r => r.wasteManagement).length;
      const liquid = recordsInBlock.filter(r => r.liquidWasteManagement).length;
      const water = recordsInBlock.filter(r => r.hasCleanWaterAccess).length;
      const followUp = recordsInBlock.filter(r => r.needsFollowUp).length;

      const avgCompliance = Math.round(
        ((latrine + noBabs + ctps + food + waste + liquid + water) / (total * 7)) * 100
      );

      return {
        block: blk,
        total,
        latrinePct: Math.round((latrine / total) * 100),
        noBabsPct: Math.round((noBabs / total) * 100),
        ctpsPct: Math.round((ctps / total) * 100),
        foodPct: Math.round((food / total) * 100),
        wastePct: Math.round((waste / total) * 100),
        liquidPct: Math.round((liquid / total) * 100),
        waterPct: Math.round((water / total) * 100),
        followUp,
        avgCompliance
      };
    }).filter(Boolean) as Array<{
      block: string;
      total: number;
      latrinePct: number;
      noBabsPct: number;
      ctpsPct: number;
      foodPct: number;
      wastePct: number;
      liquidPct: number;
      waterPct: number;
      followUp: number;
      avgCompliance: number;
    }>;
  }, [allMergedRecords, availableBlocks]);

  // Quick Toggle Handler
  const handleQuickToggle = async (rec: STBMRecord, field: keyof STBMRecord) => {
    const currentValue = !!rec[field];
    const updated: STBMRecord = {
      ...rec,
      [field]: !currentValue,
      updatedAt: new Date().toISOString()
    };

    // Auto-clear or auto-set followUp if toggle is BABS or latrine
    if (field === 'isBABS' && !currentValue === true) {
      updated.needsFollowUp = true;
      if (!updated.problemType) updated.problemType = 'Terindikasi BABS (Buang Air Sembarangan)';
    } else if (field === 'hasHealthyLatrine' && !currentValue === false) {
      updated.needsFollowUp = true;
      if (!updated.problemType) updated.problemType = 'Jamban sehat rusak / tidak berfungsi';
    }

    try {
      await saveSTBMRecord(updated);
      toast.success(`${rec.block}-${rec.number}: Perubahan disimpan.`, { duration: 1500 });
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui status.');
    }
  };

  // Mass Reset / Auto-Fill to Baku Huntap Standard
  const handleAutoFillHuntap = async () => {
    const isConfirmed = await confirm({
      title: 'Setel Profil Sanitasi Standar Huntap Tondo 2?',
      message: 'Tindakan ini akan menerapkan profil sanitasi baku kawasan Huntap Tondo 2 untuk semua 129 kavling:\n• Jamban Sehat Biotank Modern (Ya)\n• Bebas BABS / ODF 100% (Tidak)\n• Sarana CTPS (Ya)\n• Air Minum & Makanan Aman PAMM-RT (Ya)\n• Pengelolaan Sampah Kawasan Mandiri TPS3R (Ya)\n• Saluran Air Limbah Terpusat SPALDT (Ya)\n• Jaringan Air Bersih SPAM / PDAM (Ya)\n• Sosialisasi STBM (Ya)\n\nCatatan masalah khusus yang telah dicatat sebelumnya tetap aman.',
      confirmText: 'Ya, Terapkan Standar Kawasan',
      cancelText: 'Batal',
      type: 'warning'
    });

    if (!isConfirmed) return;

    setIsSaving(true);
    try {
      const recordsToSave: STBMRecord[] = allMergedRecords.map(rec => ({
        ...rec,
        hasHealthyLatrine: true,
        isBABS: false,
        hasCTPS: true,
        safeWaterAndFood: true,
        wasteManagement: true,
        liquidWasteManagement: true,
        hasCleanWaterAccess: true,
        hasSTBMTriggering: true,
        updatedAt: new Date().toISOString()
      }));

      await batchSaveSTBMRecords(recordsToSave);
      toast.success('Profil sanitasi standar Huntap Tondo 2 berhasil diterapkan ke seluruh kavling!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal menerapkan profil sanitasi standar.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Record from Modal
  const handleSaveModalRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    setIsSaving(true);
    try {
      await saveSTBMRecord({
        ...editingRecord,
        updatedAt: new Date().toISOString()
      });
      setIsEditModalOpen(false);
      setEditingRecord(null);
      toast.success(`Data STBM Kavling ${editingRecord.block}-${editingRecord.number} berhasil diperbarui.`);
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan data STBM.');
    } finally {
      setIsSaving(false);
    }
  };

  // Export Excel
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      toast.info('Menyiapkan berkas formulir resmi 14 kolom STBM...');
      await exportSTBMReportExcel(allMergedRecords);
      toast.success('Berkas Excel formulir 5 Pilar STBM berhasil diunduh.');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengekspor file Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. EXECUTIVE HEADER BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-emerald-900/60">
        {/* Ambient Decorative Lighting */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[11px] font-bold tracking-wide uppercase backdrop-blur-md">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                Dinas Kesehatan Kota Palu & Kelurahan Tondo
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-slate-200 border border-white/15 rounded-full text-[11px] font-semibold backdrop-blur-md">
                RT 002 / RW 020 Huntap Tondo 2
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {syncStatus === 'syncing' ? 'Menyinkronkan...' : 'Cloud Firestore Aktif'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Pendataan 5 Pilar STBM</span>
              <span className="text-xs font-black px-2.5 py-1 bg-emerald-500 text-slate-950 rounded-lg uppercase tracking-wider">
                100% ODF
              </span>
            </h1>

            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Instrumen pengawasan sanitasi lingkungan berbasis masyarakat merujuk <strong>Permenkes No. 3 Tahun 2014</strong>. 
              Memantau status Stop BABS, Cuci Tangan Pakai Sabun, PAMM-RT, pemilahan sampah TPS3R, serta pengolahan air limbah domestik terpusat (SPALDT).
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleAutoFillHuntap}
              disabled={isSaving}
              className="px-4 py-2.5 bg-emerald-800/60 hover:bg-emerald-700/80 text-emerald-100 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer backdrop-blur-md"
              title="Terapkan spesifikasi sanitasi baku Huntap Tondo 2 ke seluruh kavling"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isSaving ? 'Menyimpan...' : 'Setel Standar Huntap'}</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-950" />
              <span>{isExporting ? 'Mengunduh...' : 'Unduh Excel Resmi'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs transition-all active:scale-95 cursor-pointer"
              title="Cetak formulir laporan"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. PROFIL INFRASTRUKTUR SANITASI KAWASAN (COLLAPSIBLE / SLEEK) */}
      <div className="bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-sky-50/80 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-700 text-white rounded-xl shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                Profil Fasilitas Sanitasi Baku Kawasan Huntap Tondo 2
                <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-md hidden sm:inline-block">
                  Standar PUPR & Dinkes
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Infrastruktur sanitasi modern terencana pasca-bencana Kota Palu
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowInfraDetails(!showInfraDetails)}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-emerald-100/60 transition-colors cursor-pointer"
          >
            <span>{showInfraDetails ? 'Sembunyikan' : 'Lihat Spesifikasi'}</span>
            {showInfraDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {showInfraDetails && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-emerald-200/50">
            {/* Pilar 1: Biotank */}
            <div className="bg-white/95 p-3 rounded-xl border border-emerald-200/80 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-extrabold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Biotank (Jamban Sehat)
                </span>
                <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Pilar 1</span>
              </div>
              <p className="text-[10.5px] text-slate-600 leading-relaxed font-medium">
                Tangki septik biofilter higienis standar PUPR pada setiap hunian tetap, mencegah kontaminasi air tanah.
              </p>
            </div>

            {/* Pilar 5: SPALDT */}
            <div className="bg-white/95 p-3 rounded-xl border border-teal-200/80 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-extrabold text-teal-900 flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-teal-600" />
                  SPALDT (Limbah Cair)
                </span>
                <span className="text-[9px] font-black text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">Pilar 5</span>
              </div>
              <p className="text-[10.5px] text-slate-600 leading-relaxed font-medium">
                Sistem perpipaan air limbah domestik terpusat bawah tanah ramah lereng bukit tanpa genangan got terbuka.
              </p>
            </div>

            {/* Akses Air Bersih SPAM */}
            <div className="bg-white/95 p-3 rounded-xl border border-sky-200/80 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-extrabold text-sky-900 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-600" />
                  SPAM (Air Bersih PDAM)
                </span>
                <span className="text-[9px] font-black text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">PAMM-RT</span>
              </div>
              <p className="text-[10.5px] text-slate-600 leading-relaxed font-medium">
                Distribusi air bersih perpipaan terukur untuk kebutuhan minum, memasak, dan sanitasi harian warga.
              </p>
            </div>

            {/* Pilar 4: TPS3R */}
            <div className="bg-white/95 p-3 rounded-xl border border-amber-200/80 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-extrabold text-amber-900 flex items-center gap-1.5">
                  <Recycle className="w-3.5 h-3.5 text-amber-600" />
                  TPS3R (Kelola Sampah)
                </span>
                <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Pilar 4</span>
              </div>
              <p className="text-[10.5px] text-slate-600 leading-relaxed font-medium">
                Fasilitas pemilahan sampah organik & daur ulang mandiri kawasan Huntap Tondo 2 (Reduce, Reuse, Recycle).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. MODERN GLASS KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
        {/* Total KK */}
        <div className="p-3 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total KK</span>
            <Users className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="my-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{stats.total}</span>
          </div>
          <div className="text-[10px] font-bold text-slate-500 truncate">Rumah Terdata</div>
        </div>

        {/* Pilar 1: Jamban Sehat */}
        <div className="p-3 bg-white border border-emerald-200/90 rounded-2xl shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">1. Jamban</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-700">{stats.latrine}%</span>
          </div>
          <div className="w-full bg-emerald-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.latrine}%` }} />
          </div>
        </div>

        {/* Bebas BABS */}
        <div className="p-3 bg-white border border-emerald-200/90 rounded-2xl shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Stop BABS</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-700">{stats.noBABS}%</span>
          </div>
          <div className="w-full bg-emerald-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.noBABS}%` }} />
          </div>
        </div>

        {/* Pilar 2: CTPS */}
        <div className="p-3 bg-white border border-teal-200/90 rounded-2xl shadow-xs flex flex-col justify-between hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-800">2. CTPS</span>
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-teal-700">{stats.ctps}%</span>
          </div>
          <div className="w-full bg-teal-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-teal-500 h-full rounded-full" style={{ width: `${stats.ctps}%` }} />
          </div>
        </div>

        {/* Pilar 3: Air & Makanan */}
        <div className="p-3 bg-white border border-sky-200/90 rounded-2xl shadow-xs flex flex-col justify-between hover:border-sky-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-800">3. PAMM-RT</span>
            <Droplets className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-sky-700">{stats.food}%</span>
          </div>
          <div className="w-full bg-sky-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-sky-500 h-full rounded-full" style={{ width: `${stats.food}%` }} />
          </div>
        </div>

        {/* Pilar 4: Sampah */}
        <div className="p-3 bg-white border border-amber-200/90 rounded-2xl shadow-xs flex flex-col justify-between hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">4. TPS3R</span>
            <Recycle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-amber-700">{stats.waste}%</span>
          </div>
          <div className="w-full bg-amber-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${stats.waste}%` }} />
          </div>
        </div>

        {/* Pilar 5: Limbah SPAL */}
        <div className="p-3 bg-white border border-teal-200/90 rounded-2xl shadow-xs flex flex-col justify-between hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-800">5. SPALDT</span>
            <Waves className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-teal-700">{stats.liquid}%</span>
          </div>
          <div className="w-full bg-teal-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-teal-500 h-full rounded-full" style={{ width: `${stats.liquid}%` }} />
          </div>
        </div>

        {/* Tindak Lanjut */}
        <div className={`p-3 rounded-2xl shadow-xs flex flex-col justify-between transition-colors border ${
          stats.followUp > 0 
            ? 'bg-rose-50/80 border-rose-300 hover:border-rose-400' 
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-black uppercase tracking-wider ${stats.followUp > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
              Perlu TL
            </span>
            <AlertTriangle className={`w-3.5 h-3.5 ${stats.followUp > 0 ? 'text-rose-600' : 'text-slate-300'}`} />
          </div>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className={`text-xl sm:text-2xl font-black ${stats.followUp > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {stats.followUp}
            </span>
            <span className="text-[10px] font-bold text-slate-400">KK</span>
          </div>
          <div className="text-[10px] font-bold text-slate-500 truncate">
            {stats.followUp > 0 ? 'Perlu Intervensi' : 'Semua Terlayani'}
          </div>
        </div>
      </div>

      {/* 4. VIEW TABS (DETAIL 14 KOLOM, REKAP PER BLOK, KAVLING BERMASALAH) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setActiveTab('table')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'table'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare size={14} />
            <span>Formulir 14 Kolom Standar</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full">
              {allMergedRecords.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 size={14} />
            <span>Rekapitulasi per Blok (C5 - C12)</span>
          </button>

          <button
            onClick={() => setActiveTab('issues')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'issues'
                ? 'bg-rose-50 text-rose-700 shadow-xs border border-rose-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle size={14} className={stats.followUp > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'} />
            <span>Kavling Perlu Tindak Lanjut</span>
            {stats.followUp > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-rose-600 text-white rounded-full font-bold">
                {stats.followUp}
              </span>
            )}
          </button>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <RefreshCw size={12} className={syncStatus === 'syncing' ? 'animate-spin text-emerald-600' : ''} />
          <span>Sinkronisasi Terakhir: {lastSyncTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* 5. FILTER & SEARCH TOOLBAR (FOR TABLE & ISSUES VIEW) */}
      {activeTab !== 'summary' && (
        <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Block Pills with House Count */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1 uppercase tracking-wider">
                <Filter className="w-3 h-3" /> Blok:
              </span>
              <button
                onClick={() => { setSelectedBlock('all'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedBlock === 'all'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({allMergedRecords.length})
              </button>
              {availableBlocks.map(blk => (
                <button
                  key={blk}
                  onClick={() => { setSelectedBlock(blk); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedBlock === blk
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {blk} <span className="text-[10px] opacity-75">({blockCounts[blk] || 0})</span>
                </button>
              ))}
            </div>

            {/* Filter Dropdown & Search Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterFollowUp}
                onChange={(e) => { setFilterFollowUp(e.target.value as any); setCurrentPage(1); }}
                aria-label="Filter status tindak lanjut STBM"
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">Semua Status Sanitasi</option>
                <option value="needs">⚠️ Perlu Tindak Lanjut Saja</option>
                <option value="ok">✅ Sanitasi Memenuhi Syarat</option>
              </select>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Cari KK / Kavling / Masalah..."
                  className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT: REKAPITULASI PER BLOK */}
      {activeTab === 'summary' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="text-emerald-600" size={18} />
                Rekapitulasi Kepatuhan 5 Pilar STBM per Blok Kawasan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Statistik agregat persentase pemenuhan sanitasi untuk pelaporan resmi tingkat Kelurahan & Puskesmas Tondo.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
              Wilayah RT 002 / RW 020 (8 Blok Hunian)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3">Blok Kavling</th>
                  <th className="py-3 px-3 text-center">Total Rumah</th>
                  <th className="py-3 px-3 text-center">1. Jamban Sehat</th>
                  <th className="py-3 px-3 text-center">Bebas BABS</th>
                  <th className="py-3 px-3 text-center">2. CTPS</th>
                  <th className="py-3 px-3 text-center">3. Air/PAMM</th>
                  <th className="py-3 px-3 text-center">4. TPS3R</th>
                  <th className="py-3 px-3 text-center">5. SPALDT</th>
                  <th className="py-3 px-3 text-center">Perlu TL</th>
                  <th className="py-3 px-3 text-center">Kepatuhan Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {blockAggregates.map((row) => (
                  <tr key={row.block} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-black text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Blok {row.block}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700">{row.total} KK</td>
                    <td className="py-3 px-3 text-center text-emerald-700 font-bold">{row.latrinePct}%</td>
                    <td className="py-3 px-3 text-center text-emerald-700 font-bold">{row.noBabsPct}%</td>
                    <td className="py-3 px-3 text-center text-teal-700 font-bold">{row.ctpsPct}%</td>
                    <td className="py-3 px-3 text-center text-sky-700 font-bold">{row.foodPct}%</td>
                    <td className="py-3 px-3 text-center text-amber-700 font-bold">{row.wastePct}%</td>
                    <td className="py-3 px-3 text-center text-teal-700 font-bold">{row.liquidPct}%</td>
                    <td className="py-3 px-3 text-center">
                      {row.followUp > 0 ? (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded-md">
                          {row.followUp} KK
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 font-black rounded-lg">
                        <CheckCheck size={12} />
                        {row.avgCompliance}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. TAB CONTENT: 14-COLUMN INTERACTIVE TABLE (WITH STICKY 2 COLUMNS) */}
      {(activeTab === 'table' || activeTab === 'issues') && (
        <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden">
          {/* Table Header Controls */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-bold text-sm text-slate-900">
                Formulir Pendataan 14 Kolom Standar Dinas Kesehatan
              </h3>
              <span className="text-xs text-slate-500 font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                {filteredRecords.length} Rumah Ditampilkan
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-[11px] text-slate-500 hidden sm:inline-block">
                Klik tombol <strong className="text-emerald-700 font-bold">Ya / Tidak</strong> untuk ubah data langsung
              </span>

              {/* Rows Per Page */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Baris:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  aria-label="Jumlah baris per halaman"
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={-1}>Semua ({filteredRecords.length})</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Container with Sticky Column Capability */}
          <div className="overflow-x-auto max-h-[620px] relative">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-30 bg-[#C6E0B4] text-slate-950 font-bold border-b border-slate-300 shadow-xs">
                <tr>
                  {/* Sticky Column 1: No. */}
                  <th className="sticky left-0 z-40 bg-[#C6E0B4] py-3 px-2 text-center border-r border-slate-300/90 w-12 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                    No.
                  </th>

                  {/* Sticky Column 2: Nama KK & Kavling */}
                  <th className="sticky left-12 z-40 bg-[#C6E0B4] py-3 px-3 border-r border-slate-300/90 min-w-[200px] shadow-[4px_0_6px_rgba(0,0,0,0.08)]">
                    Nama Kepala Keluarga
                  </th>

                  {/* Other 12 Columns */}
                  <th className="py-3 px-2 text-center border-r border-slate-300/80 w-16">Jml KK</th>
                  <th className="py-3 px-2 text-center border-r border-slate-300/80 min-w-[95px]" title="Pilar 1: Akses Jamban Sehat Standar PUPR">
                    1. Jamban
                  </th>
                  <th className="py-3 px-2 text-center border-r border-slate-300/80 min-w-[80px]" title="Buang Air Besar Sembarangan (Harus Tidak)">
                    BABS
                  </th>
                  <th className="py-3 px-2 text-center border-r border-slate-300/80 min-w-[85px]" title="Pilar 2: Cuci Tangan Pakai Sabun">
                    2. CTPS
                  </th>
                  <th className="py-3 px-2 text-center border-r border-slate-300/80 min-w-[100px]" title="Pilar 3: Air Minum & Makanan Aman">
                    3. PAMM-RT
                  </th>
                  <th className="py-3 px-2 text-center border-r border-slate-300/80 min-w-[95px]" title="Pilar 4: Pilah Sampah TPS3R">
                    4. TPS3R
                  </th>
                  <th className="py-3 px-2 text-center border-r border-slate-300/80 min-w-[95px]" title="Pilar 5: Kelola Limbah SPALDT">
                    5. SPALDT
                  </th>
                  <th className="py-3 px-2 text-center border-r border-slate-300/80 min-w-[90px]" title="Akses Air Bersih Perpipaan SPAM">
                    Air Bersih
                  </th>
                  <th className="py-3 px-2 text-center border-r border-slate-300/80 min-w-[85px]" title="Sosialisasi / Pemicuan STBM">
                    Pemicuan
                  </th>
                  <th className="py-3 px-2 text-center border-r border-slate-300/80 min-w-[90px]" title="Perlu Tindak Lanjut Perbaikan">
                    Tindak Lanjut
                  </th>
                  <th className="py-3 px-3 border-r border-slate-300/80 min-w-[150px]">Jenis Masalah</th>
                  <th className="py-3 px-3 min-w-[110px] text-center">Ket & Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/90 font-medium">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-16 text-center text-slate-400 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 size={32} className="text-slate-300" />
                        <p className="text-sm font-bold text-slate-600">Tidak ada data rumah yang sesuai filter atau pencarian.</p>
                        <p className="text-xs text-slate-400">Coba atur ulang kata kunci pencarian atau pilih 'Semua Blok'.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((rec, idx) => {
                    const rowNumber = (currentPage - 1) * (pageSize === -1 ? 0 : pageSize) + idx + 1;
                    const hasIssue = rec.needsFollowUp || rec.isBABS || !rec.hasHealthyLatrine;

                    return (
                      <tr 
                        key={rec.houseId} 
                        className={`hover:bg-slate-50 transition-colors group ${
                          hasIssue 
                            ? 'bg-rose-50/40 border-l-4 border-l-rose-500' 
                            : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                        }`}
                      >
                        {/* Sticky Column 1: No. */}
                        <td className={`sticky left-0 z-20 py-2.5 px-2 text-center font-bold text-slate-500 border-r border-slate-200 transition-colors shadow-[2px_0_4px_rgba(0,0,0,0.04)] ${
                          hasIssue ? 'bg-rose-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        }`}>
                          {rowNumber}
                        </td>

                        {/* Sticky Column 2: Nama KK & Kavling */}
                        <td className={`sticky left-12 z-20 py-2.5 px-3 border-r border-slate-200 transition-colors shadow-[4px_0_6px_rgba(0,0,0,0.06)] ${
                          hasIssue ? 'bg-rose-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        }`}>
                          <div className="truncate max-w-[190px]">
                            <span className="font-extrabold text-slate-900 block truncate">
                              {rec.headOfFamily ? rec.headOfFamily.toUpperCase() : '(Belum Terdata / Kosong)'}
                            </span>
                            <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-black">
                                {rec.block}-{rec.number}
                              </span>
                              <span>• Huntap 2</span>
                            </div>
                          </div>
                        </td>

                        {/* Jml KK */}
                        <td className="py-2.5 px-2 text-center border-r border-slate-200 text-slate-700 font-bold">
                          {rec.occupants || 0}
                        </td>

                        {/* 1. Jamban Sehat */}
                        <td className="py-2.5 px-2 text-center border-r border-slate-200">
                          <button
                            onClick={() => handleQuickToggle(rec, 'hasHealthyLatrine')}
                            title="Klik saklar untuk ubah status"
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-90 cursor-pointer shadow-2xs ${
                              rec.hasHealthyLatrine
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            {rec.hasHealthyLatrine ? 'Ya' : 'Tidak'}
                          </button>
                        </td>

                        {/* BABS (Dibalik: 'Tidak' = Baik/ODF) */}
                        <td className="py-2.5 px-2 text-center border-r border-slate-200">
                          <button
                            onClick={() => handleQuickToggle(rec, 'isBABS')}
                            title="Klik saklar untuk ubah status"
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-90 cursor-pointer shadow-2xs ${
                              rec.isBABS
                                ? 'bg-rose-600 text-white hover:bg-rose-700 font-black'
                                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            }`}
                          >
                            {rec.isBABS ? 'Ya ⚠️' : 'Tidak'}
                          </button>
                        </td>

                        {/* 2. CTPS */}
                        <td className="py-2.5 px-2 text-center border-r border-slate-200">
                          <button
                            onClick={() => handleQuickToggle(rec, 'hasCTPS')}
                            title="Klik saklar untuk ubah status"
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-90 cursor-pointer shadow-2xs ${
                              rec.hasCTPS
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            {rec.hasCTPS ? 'Ya' : 'Tidak'}
                          </button>
                        </td>

                        {/* 3. PAMM-RT */}
                        <td className="py-2.5 px-2 text-center border-r border-slate-200">
                          <button
                            onClick={() => handleQuickToggle(rec, 'safeWaterAndFood')}
                            title="Klik saklar untuk ubah status"
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-90 cursor-pointer shadow-2xs ${
                              rec.safeWaterAndFood
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            {rec.safeWaterAndFood ? 'Ya' : 'Tidak'}
                          </button>
                        </td>

                        {/* 4. TPS3R */}
                        <td className="py-2.5 px-2 text-center border-r border-slate-200">
                          <button
                            onClick={() => handleQuickToggle(rec, 'wasteManagement')}
                            title="Klik saklar untuk ubah status"
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-90 cursor-pointer shadow-2xs ${
                              rec.wasteManagement
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            {rec.wasteManagement ? 'Ya' : 'Tidak'}
                          </button>
                        </td>

                        {/* 5. SPALDT */}
                        <td className="py-2.5 px-2 text-center border-r border-slate-200">
                          <button
                            onClick={() => handleQuickToggle(rec, 'liquidWasteManagement')}
                            title="Klik saklar untuk ubah status"
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-90 cursor-pointer shadow-2xs ${
                              rec.liquidWasteManagement
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            {rec.liquidWasteManagement ? 'Ya' : 'Tidak'}
                          </button>
                        </td>

                        {/* Air Bersih */}
                        <td className="py-2.5 px-2 text-center border-r border-slate-200">
                          <button
                            onClick={() => handleQuickToggle(rec, 'hasCleanWaterAccess')}
                            title="Klik saklar untuk ubah status"
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-90 cursor-pointer shadow-2xs ${
                              rec.hasCleanWaterAccess
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            {rec.hasCleanWaterAccess ? 'Ya' : 'Tidak'}
                          </button>
                        </td>

                        {/* Pemicuan */}
                        <td className="py-2.5 px-2 text-center border-r border-slate-200">
                          <button
                            onClick={() => handleQuickToggle(rec, 'hasSTBMTriggering')}
                            title="Klik saklar untuk ubah status"
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-90 cursor-pointer shadow-2xs ${
                              rec.hasSTBMTriggering
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {rec.hasSTBMTriggering ? 'Ya' : 'Tidak'}
                          </button>
                        </td>

                        {/* Tindak Lanjut */}
                        <td className="py-2.5 px-2 text-center border-r border-slate-200">
                          <button
                            onClick={() => handleQuickToggle(rec, 'needsFollowUp')}
                            title="Klik saklar untuk ubah status"
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-90 cursor-pointer shadow-2xs ${
                              rec.needsFollowUp
                                ? 'bg-rose-600 text-white shadow-xs font-black'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {rec.needsFollowUp ? 'Ya ⚠️' : 'Tidak'}
                          </button>
                        </td>

                        {/* Jenis Masalah */}
                        <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700">
                          {rec.problemType ? (
                            <span className="text-rose-700 font-bold bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-md text-[10.5px] block truncate max-w-[140px]" title={rec.problemType}>
                              {rec.problemType}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">-</span>
                          )}
                        </td>

                        {/* Ket & Aksi */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              setEditingRecord(rec);
                              setIsEditModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold transition-all active:scale-95 shadow-2xs cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 text-emerald-700" />
                            <span>Detail</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer & Pagination */}
          {filteredRecords.length > 0 && pageSize !== -1 && (
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/60">
              <div className="text-xs text-slate-500">
                Menampilkan <span className="font-bold text-slate-800">{(currentPage - 1) * pageSize + 1}</span> - <span className="font-bold text-slate-800">{Math.min(currentPage * pageSize, filteredRecords.length)}</span> dari <span className="font-bold text-slate-800">{filteredRecords.length}</span> rumah
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  Sebelumnya
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      currentPage === p
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 8. MODAL EDIT DETAIL DATA STBM */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRecord(null);
        }}
        title={`Formulir STBM - Kavling ${editingRecord?.block}-${editingRecord?.number}`}
      >
        {editingRecord && (
          <form onSubmit={handleSaveModalRecord} className="space-y-4">
            {/* Identity Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 flex flex-wrap justify-between items-center gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">Kavling Hunian Tetap</span>
                <p className="font-extrabold text-base text-slate-900">
                  {editingRecord.headOfFamily || '(Nama Belum Terdata)'}
                </p>
                <p className="text-slate-500 font-medium">
                  Blok {editingRecord.block} No. {editingRecord.number} • RT 002 / RW 020 Huntap Tondo 2
                </p>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <Users size={14} className="text-emerald-700" />
                <label className="text-xs text-slate-600 font-bold">Jiwa / Penghuni:</label>
                <input
                  type="number"
                  min="0"
                  value={editingRecord.occupants}
                  onChange={(e) => setEditingRecord({ ...editingRecord, occupants: parseInt(e.target.value) || 0 })}
                  className="w-14 px-2 py-0.5 bg-slate-50 border border-slate-300 rounded text-center text-xs font-black text-slate-900"
                />
              </div>
            </div>

            {/* Checklist 5 Pilar STBM */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Pemeriksaan 5 Pilar Sanitasi Total (Permenkes 3/2014)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* Pilar 1 */}
                <label className="flex items-start justify-between p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl cursor-pointer transition-colors">
                  <div>
                    <span className="font-bold text-slate-900 block">1. Akses Jamban Sehat</span>
                    <span className="text-[10px] text-slate-500">Leher angsa & biofilter Biotank PUPR</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingRecord.hasHealthyLatrine}
                    onChange={(e) => setEditingRecord({ ...editingRecord, hasHealthyLatrine: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 mt-0.5"
                  />
                </label>

                {/* BABS */}
                <label className="flex items-start justify-between p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl cursor-pointer transition-colors">
                  <div>
                    <span className="font-bold text-slate-900 block">BABS (Buang Sembarangan)</span>
                    <span className="text-[10px] text-slate-500 font-semibold text-emerald-700">Wajib "Tidak" agar status ODF</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingRecord.isBABS}
                    onChange={(e) => setEditingRecord({ ...editingRecord, isBABS: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 mt-0.5"
                  />
                </label>

                {/* Pilar 2 */}
                <label className="flex items-start justify-between p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl cursor-pointer transition-colors">
                  <div>
                    <span className="font-bold text-slate-900 block">2. Cuci Tangan Pakai Sabun</span>
                    <span className="text-[10px] text-slate-500">Sarana air mengalir & sabun CTPS</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingRecord.hasCTPS}
                    onChange={(e) => setEditingRecord({ ...editingRecord, hasCTPS: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 mt-0.5"
                  />
                </label>

                {/* Pilar 3 */}
                <label className="flex items-start justify-between p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl cursor-pointer transition-colors">
                  <div>
                    <span className="font-bold text-slate-900 block">3. Air Minum & Makanan Aman</span>
                    <span className="text-[10px] text-slate-500">PAMM-RT higienis & tertutup</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingRecord.safeWaterAndFood}
                    onChange={(e) => setEditingRecord({ ...editingRecord, safeWaterAndFood: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 mt-0.5"
                  />
                </label>

                {/* Pilar 4 */}
                <label className="flex items-start justify-between p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl cursor-pointer transition-colors">
                  <div>
                    <span className="font-bold text-slate-900 block">4. Pemilahan Sampah (TPS3R)</span>
                    <span className="text-[10px] text-slate-500">Pilah organik/anorganik mandiri</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingRecord.wasteManagement}
                    onChange={(e) => setEditingRecord({ ...editingRecord, wasteManagement: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 mt-0.5"
                  />
                </label>

                {/* Pilar 5 */}
                <label className="flex items-start justify-between p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl cursor-pointer transition-colors">
                  <div>
                    <span className="font-bold text-slate-900 block">5. Saluran Limbah Cair (SPALDT)</span>
                    <span className="text-[10px] text-slate-500">Pipa tertutup terhubung jaringan</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingRecord.liquidWasteManagement}
                    onChange={(e) => setEditingRecord({ ...editingRecord, liquidWasteManagement: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 mt-0.5"
                  />
                </label>

                {/* Akses Air Bersih */}
                <label className="flex items-start justify-between p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl cursor-pointer transition-colors">
                  <div>
                    <span className="font-bold text-slate-900 block">Akses Jaringan Air Bersih (SPAM)</span>
                    <span className="text-[10px] text-slate-500">Kran sambungan PDAM aktif</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingRecord.hasCleanWaterAccess}
                    onChange={(e) => setEditingRecord({ ...editingRecord, hasCleanWaterAccess: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 mt-0.5"
                  />
                </label>

                {/* Pemicuan */}
                <label className="flex items-start justify-between p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl cursor-pointer transition-colors">
                  <div>
                    <span className="font-bold text-slate-900 block">Pemicuan / Sosialisasi STBM</span>
                    <span className="text-[10px] text-slate-500">Sudah diedukasi kader kesehatan</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingRecord.hasSTBMTriggering}
                    onChange={(e) => setEditingRecord({ ...editingRecord, hasSTBMTriggering: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 mt-0.5"
                  />
                </label>
              </div>
            </div>

            {/* Perlu Tindak Lanjut Card */}
            <div className="p-3.5 bg-amber-50/80 border border-amber-300 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-black text-amber-950 text-xs flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-600" />
                  Butuh Tindak Lanjut Khusus / Perbaikan Sarana?
                </span>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Tandai bila memerlukan koordinasi dengan Pengurus RT, Kader, atau Puskesmas.
                </p>
              </div>
              <input
                type="checkbox"
                checked={editingRecord.needsFollowUp}
                onChange={(e) => setEditingRecord({ ...editingRecord, needsFollowUp: e.target.checked })}
                className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
              />
            </div>

            {/* Jenis Masalah & Preset Chips */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">
                Uraian Masalah Sanitasi (Jika Ada)
              </label>
              <input
                type="text"
                value={editingRecord.problemType || ''}
                onChange={(e) => setEditingRecord({ ...editingRecord, problemType: e.target.value })}
                placeholder="Tuliskan kendala sanitasi di kavling ini..."
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  'Biotank penuh / butuh sedot',
                  'Pipa SPALDT tersumbat',
                  'Bak kontrol retak / pecah',
                  'Kran SPAM macet / air kecil',
                  'Belum memilah sampah kering/basah'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setEditingRecord({ ...editingRecord, problemType: preset, needsFollowUp: true })}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10.5px] font-semibold transition-colors cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Catatan / Keterangan Tambahan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">
                Catatan Petugas / Kader RT
              </label>
              <textarea
                rows={2}
                value={editingRecord.notes || ''}
                onChange={(e) => setEditingRecord({ ...editingRecord, notes: e.target.value })}
                placeholder="Catatan tambahan hasil peninjauan lapangan..."
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingRecord(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-700/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Data STBM'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
