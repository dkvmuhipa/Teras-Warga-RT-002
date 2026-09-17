import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, AlertTriangle, Download, Search, 
  Sparkles, Edit3, Filter, RefreshCw,
  Droplets, Trash2, CheckSquare, XCircle, Info
} from 'lucide-react';
import { House, STBMRecord } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Card';
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<STBMRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Subscribe to real-time STBM records
  useEffect(() => {
    const unsub = subscribeToSTBMRecords((records) => {
      setStbmRecords(records);
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

  // Merge houses with STBM data (ensuring every occupied / registered house has a record representation)
  const allMergedRecords: STBMRecord[] = useMemo(() => {
    // Sort houses naturally
    const sortedHouses = [...houses].sort((a, b) => naturalSortBlockAndNumber(a.block, a.number, b.block, b.number));

    return sortedHouses.map(h => {
      const existing = stbmMap.get(h.id);
      if (existing) {
        // Return existing, but update headOfFamily and occupants if changed in house
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
        hasHealthyLatrine: true,    // Huntap standar PUPR memiliki jamban leher angsa sehat
        isBABS: false,               // Tidak buang air besar sembarangan
        hasCTPS: true,              // Sarana CTPS ada
        safeWaterAndFood: true,      // PAMM-RT aman
        wasteManagement: true,       // Terlayani TPS3R Tondo 2
        liquidWasteManagement: true, // Saluran pembuangan air limbah (SPAL) tertutup Huntap
        hasCleanWaterAccess: true,   // Terhubung jaringan PDAM
        hasSTBMTriggering: true,     // Sudah dipicu/sosialisasi STBM
        needsFollowUp: false,
        problemType: '',
        notes: '',
        updatedAt: new Date().toISOString()
      };
    });
  }, [houses, stbmMap]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return allMergedRecords.filter(rec => {
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
  }, [allMergedRecords, selectedBlock, filterFollowUp, searchQuery]);

  // Unique Blocks for filter pills
  const availableBlocks = useMemo(() => {
    const set = new Set<string>();
    houses.forEach(h => {
      if (h.block) set.add(h.block);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [houses]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = allMergedRecords.length;
    if (total === 0) return { total: 0, latrine: 0, noBABS: 0, ctps: 0, food: 0, waste: 0, liquid: 0, water: 0, followUp: 0 };
    
    let latrine = 0;
    let noBABS = 0;
    let ctps = 0;
    let food = 0;
    let waste = 0;
    let liquid = 0;
    let water = 0;
    let followUp = 0;

    allMergedRecords.forEach(r => {
      if (r.hasHealthyLatrine) latrine++;
      if (!r.isBABS) noBABS++;
      if (r.hasCTPS) ctps++;
      if (r.safeWaterAndFood) food++;
      if (r.wasteManagement) waste++;
      if (r.liquidWasteManagement) liquid++;
      if (r.hasCleanWaterAccess) water++;
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
      followUp
    };
  }, [allMergedRecords]);

  // Quick toggle a single boolean property on a record
  const handleQuickToggle = async (rec: STBMRecord, field: keyof STBMRecord) => {
    const currentValue = !!rec[field];
    const updated: STBMRecord = {
      ...rec,
      [field]: !currentValue,
      updatedAt: new Date().toISOString()
    };

    // If setting isBABS to true, automatically set needsFollowUp to true
    if (field === 'isBABS' && !currentValue === true) {
      updated.needsFollowUp = true;
    }
    // If setting hasHealthyLatrine to false, automatically set needsFollowUp to true
    if (field === 'hasHealthyLatrine' && !currentValue === false) {
      updated.needsFollowUp = true;
    }

    try {
      await saveSTBMRecord(updated);
      toast.success(`Kavling ${rec.block}-${rec.number} diperbarui.`);
    } catch {
      toast.error('Gagal memperbarui data.');
    }
  };

  // Mass Auto-Fill with Huntap Standard
  const handleAutoFillHuntap = async () => {
    const isConfirmed = await confirm({
      title: 'Setel Standar Sanitasi Huntap Tondo 2?',
      message: 'Tindakan ini akan menerapkan profil sanitasi baku kawasan Huntap Tondo 2 untuk semua kavling:\n• Jamban Sehat Biotank Modern (Ya)\n• Bebas BABS (Tidak)\n• Sarana CTPS (Ya)\n• Air Minum & Makanan Aman PAMM-RT (Ya)\n• Pengelolaan Sampah Kawasan Mandiri TPS3R (Ya)\n• Saluran Air Limbah Terpusat SPALDT (Ya)\n• Jaringan Air Bersih SPAM / PDAM (Ya)\n• Sosialisasi STBM (Ya)\n\nCatatan masalah khusus yang sudah tercatat sebelumnya tidak akan terhapus.',
      confirmLabel: 'Ya, Terapkan Standar Huntap',
      isDanger: false
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
        needsFollowUp: rec.problemType ? true : false,
        updatedAt: new Date().toISOString()
      }));

      await batchSaveSTBMRecords(recordsToSave);
      toast.success('Berhasil menerapkan standar sanitasi Huntap untuk seluruh rumah!');
    } catch (err) {
      toast.error('Terjadi kesalahan saat menyimpan data standar.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Modal Record Form
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
      toast.success(`Data STBM Kavling ${editingRecord.block}-${editingRecord.number} berhasil disimpan.`);
    } catch {
      toast.error('Gagal menyimpan data.');
    } finally {
      setIsSaving(false);
    }
  };

  // Export to Excel (Matches 100% official format)
  const handleExportExcel = async () => {
    try {
      toast.info('Menyiapkan file Excel formulir resmi STBM...');
      await exportSTBMReportExcel(allMergedRecords);
      toast.success('File Excel formulir 5 Pilar STBM berhasil diunduh.');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengekspor file Excel.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide uppercase">
              <CheckSquare className="w-3.5 h-3.5" />
              Dinas Kesehatan & Kelurahan Tondo
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Pendataan 5 Pilar STBM
            </h1>
            <p className="text-emerald-100 text-sm max-w-2xl leading-relaxed">
              Formulir pendataan Rumah Tangga Sanitasi Total Berbasis Masyarakat (STBM) untuk RT 002/RW 015 Huntap Tondo 2. Pemantauan stop BABS, cuci tangan pakai sabun, PAMM-RT, pemilahan sampah, dan pengolahan limbah cair.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleAutoFillHuntap}
              disabled={isSaving}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-md text-xs sm:text-sm font-semibold shadow-sm flex items-center gap-2 py-2.5"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Setel Standar Huntap
            </Button>

            <Button
              onClick={handleExportExcel}
              className="bg-white hover:bg-emerald-50 text-emerald-800 text-xs sm:text-sm font-bold shadow-lg flex items-center gap-2 py-2.5"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              Unduh Excel Resmi (14 Kolom)
            </Button>
          </div>
        </div>
      </div>

      {/* Profil Sanitasi Kawasan Huntap Tondo 2 */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200/80 rounded-2xl p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-600 text-white rounded-xl mt-0.5 shadow-sm">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                Profil Infrastruktur Sanitasi Kawasan Huntap Tondo 2
              </h4>
              <span className="text-[10px] font-semibold bg-emerald-200/70 text-emerald-900 px-2.5 py-0.5 rounded-full">
                Standar KemenPUPR & Dinkes
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kawasan Huntap Tondo 2 dirancang dengan sistem sanitasi modern terintegrasi yang menjadi acuan pengisian formulir 5 Pilar STBM:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100 shadow-xs">
                <div className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Biotank (Jamban Sehat)
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  Tangki septik modern individual/kelompok dengan biofiltrasi higienis standar PUPR.
                </div>
              </div>

              <div className="bg-white/90 p-2.5 rounded-xl border border-teal-100 shadow-xs">
                <div className="text-[11px] font-bold text-teal-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  SPALDT (Limbah Cair)
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  Sistem Pengolahan Air Limbah Domestik Terpusat pipa tertutup ramah lingkungan.
                </div>
              </div>

              <div className="bg-white/90 p-2.5 rounded-xl border border-sky-100 shadow-xs">
                <div className="text-[11px] font-bold text-sky-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                  SPAM (Air Bersih PDAM)
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  Sistem Penyediaan Air Minum perpipaan untuk kebutuhan MCK dan sanitasi warga.
                </div>
              </div>

              <div className="bg-white/90 p-2.5 rounded-xl border border-amber-100 shadow-xs">
                <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  TPS3R (Kelola Sampah)
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  Infrastruktur persampahan kawasan mandiri (Reuse, Reduce, Recycle).
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="p-3 border-emerald-100 bg-white shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-slate-500">Total KK</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{stats.total}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">Rumah Terdata</div>
        </Card>

        <Card className="p-3 border-emerald-100 bg-emerald-50/40 shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-emerald-800">1. Jamban Sehat</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{stats.latrine}%</div>
          <div className="text-[10px] text-slate-500 mt-1">Pilar 1 Akses</div>
        </Card>

        <Card className="p-3 border-emerald-100 bg-emerald-50/40 shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-emerald-800">Bebas BABS</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{stats.noBABS}%</div>
          <div className="text-[10px] text-slate-500 mt-1">0% Buang Bebas</div>
        </Card>

        <Card className="p-3 border-emerald-100 bg-emerald-50/40 shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-emerald-800">2. Cuci Tangan</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{stats.ctps}%</div>
          <div className="text-[10px] text-slate-500 mt-1">Pilar 2 CTPS</div>
        </Card>

        <Card className="p-3 border-emerald-100 bg-emerald-50/40 shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-emerald-800">3. Air & Makanan</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{stats.food}%</div>
          <div className="text-[10px] text-slate-500 mt-1">Pilar 3 PAMM-RT</div>
        </Card>

        <Card className="p-3 border-emerald-100 bg-emerald-50/40 shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-emerald-800">4. Kelola Sampah</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{stats.waste}%</div>
          <div className="text-[10px] text-slate-500 mt-1">Pilar 4 TPS3R</div>
        </Card>

        <Card className="p-3 border-emerald-100 bg-emerald-50/40 shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-emerald-800">5. Kelola SPAL</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{stats.liquid}%</div>
          <div className="text-[10px] text-slate-500 mt-1">Pilar 5 Limbah</div>
        </Card>

        <Card className={`p-3 shadow-sm flex flex-col justify-between ${stats.followUp > 0 ? 'border-rose-200 bg-rose-50/50' : 'border-slate-200 bg-white'}`}>
          <div className="text-[11px] font-semibold text-rose-700">Tindak Lanjut</div>
          <div className={`text-xl font-bold mt-1 ${stats.followUp > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {stats.followUp} KK
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{stats.followUp > 0 ? 'Perlu Perhatian' : 'Semua Tuntas'}</div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 border-slate-200 shadow-sm bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Blok:
            </span>
            <button
              onClick={() => setSelectedBlock('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedBlock === 'all'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua
            </button>
            {availableBlocks.map(blk => (
              <button
                key={blk}
                onClick={() => setSelectedBlock(blk)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedBlock === blk
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {blk}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Status Follow-up */}
            <select
              value={filterFollowUp}
              onChange={(e) => setFilterFollowUp(e.target.value as any)}
              aria-label="Filter status tindak lanjut STBM"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Status</option>
              <option value="needs">⚠️ Perlu Tindak Lanjut Saja</option>
              <option value="ok">✅ Sanitasi Memenuhi Syarat</option>
            </select>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari KK / Kavling / Masalah..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Interactive 14-Column Table */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-bold text-sm text-slate-800">
              Formulir Pendataan 14 Kolom Standar Dinas
            </h3>
            <span className="text-xs text-slate-400">({filteredRecords.length} Rumah Ditampilkan)</span>
          </div>
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Klik saklar <span className="text-emerald-700 font-semibold">Ya / Tidak</span> pada tabel untuk merubah data secara instan
          </div>
        </div>

        <div className="overflow-x-auto max-h-[650px] relative">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-20 bg-[#C6E0B4] text-slate-900 font-bold border-b border-slate-300">
              <tr>
                <th className="py-3 px-2 text-center border-r border-slate-300/80 w-10">No.</th>
                <th className="py-3 px-3 border-r border-slate-300/80 min-w-[180px]">Nama Kepala Keluarga</th>
                <th className="py-3 px-2 text-center border-r border-slate-300/80 w-14">Jml KK</th>
                <th className="py-3 px-2 text-center border-r border-slate-300/80 min-w-[90px]" title="Pilar 1: Akses Jamban Sehat">Jamban Sehat</th>
                <th className="py-3 px-2 text-center border-r border-slate-300/80 min-w-[75px]" title="Buang Air Besar Sembarangan">BABS</th>
                <th className="py-3 px-2 text-center border-r border-slate-300/80 min-w-[75px]" title="Pilar 2: Cuci Tangan Pakai Sabun">CTPS</th>
                <th className="py-3 px-2 text-center border-r border-slate-300/80 min-w-[95px]" title="Pilar 3: Air Minum & Makanan Aman">Air & Makanan</th>
                <th className="py-3 px-2 text-center border-r border-slate-300/80 min-w-[90px]" title="Pilar 4: Pilah Sampah">Pilah Sampah</th>
                <th className="py-3 px-2 text-center border-r border-slate-300/80 min-w-[90px]" title="Pilar 5: Kelola Limbah SPAL">Kelola Limbah</th>
                <th className="py-3 px-2 text-center border-r border-slate-300/80 min-w-[85px]">Air Bersih</th>
                <th className="py-3 px-2 text-center border-r border-slate-300/80 min-w-[80px]">Pemicuan</th>
                <th className="py-3 px-2 text-center border-r border-slate-300/80 min-w-[85px]">Tindak Lanjut</th>
                <th className="py-3 px-3 border-r border-slate-300/80 min-w-[140px]">Jenis Masalah</th>
                <th className="py-3 px-3 min-w-[120px] text-center">Ket. & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400 font-medium">
                    Tidak ada data rumah yang sesuai filter atau pencarian.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const hasIssue = rec.needsFollowUp || rec.isBABS || !rec.hasHealthyLatrine;
                  return (
                    <tr 
                      key={rec.houseId} 
                      className={`hover:bg-slate-50/80 transition-colors ${hasIssue ? 'bg-rose-50/30' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                    >
                      <td className="py-2.5 px-2 text-center font-semibold text-slate-500 border-r border-slate-200">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-3 border-r border-slate-200 font-medium text-slate-800">
                        <div className="flex items-center justify-between gap-1">
                          <div className="truncate">
                            <span className="font-bold text-emerald-900">
                              {rec.headOfFamily ? rec.headOfFamily.toUpperCase() : '(Kosong/Belum Terdata)'}
                            </span>
                            <div className="text-[10px] text-slate-500 font-normal">
                              Kavling: <span className="font-semibold text-slate-700">{rec.block}-{rec.number}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-center border-r border-slate-200 text-slate-700 font-semibold">
                        {rec.occupants || 0}
                      </td>

                      {/* 4. Jamban Sehat */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-200">
                        <button
                          onClick={() => handleQuickToggle(rec, 'hasHealthyLatrine')}
                          title="Klik untuk mengubah"
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-transform active:scale-95 ${
                            rec.hasHealthyLatrine
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {rec.hasHealthyLatrine ? 'Ya' : 'Tidak'}
                        </button>
                      </td>

                      {/* 5. BABS */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-200">
                        <button
                          onClick={() => handleQuickToggle(rec, 'isBABS')}
                          title="Klik untuk mengubah"
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-transform active:scale-95 ${
                            rec.isBABS
                              ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          }`}
                        >
                          {rec.isBABS ? 'Ya' : 'Tidak'}
                        </button>
                      </td>

                      {/* 6. CTPS */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-200">
                        <button
                          onClick={() => handleQuickToggle(rec, 'hasCTPS')}
                          title="Klik untuk mengubah"
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-transform active:scale-95 ${
                            rec.hasCTPS
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {rec.hasCTPS ? 'Ya' : 'Tidak'}
                        </button>
                      </td>

                      {/* 7. Air & Makanan */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-200">
                        <button
                          onClick={() => handleQuickToggle(rec, 'safeWaterAndFood')}
                          title="Klik untuk mengubah"
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-transform active:scale-95 ${
                            rec.safeWaterAndFood
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {rec.safeWaterAndFood ? 'Ya' : 'Tidak'}
                        </button>
                      </td>

                      {/* 8. Pilah Sampah */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-200">
                        <button
                          onClick={() => handleQuickToggle(rec, 'wasteManagement')}
                          title="Klik untuk mengubah"
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-transform active:scale-95 ${
                            rec.wasteManagement
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {rec.wasteManagement ? 'Ya' : 'Tidak'}
                        </button>
                      </td>

                      {/* 9. Kelola Limbah */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-200">
                        <button
                          onClick={() => handleQuickToggle(rec, 'liquidWasteManagement')}
                          title="Klik untuk mengubah"
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-transform active:scale-95 ${
                            rec.liquidWasteManagement
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {rec.liquidWasteManagement ? 'Ya' : 'Tidak'}
                        </button>
                      </td>

                      {/* 10. Akses Air Bersih */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-200">
                        <button
                          onClick={() => handleQuickToggle(rec, 'hasCleanWaterAccess')}
                          title="Klik untuk mengubah"
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-transform active:scale-95 ${
                            rec.hasCleanWaterAccess
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {rec.hasCleanWaterAccess ? 'Ya' : 'Tidak'}
                        </button>
                      </td>

                      {/* 11. Pemicuan */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-200">
                        <button
                          onClick={() => handleQuickToggle(rec, 'hasSTBMTriggering')}
                          title="Klik untuk mengubah"
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-transform active:scale-95 ${
                            rec.hasSTBMTriggering
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {rec.hasSTBMTriggering ? 'Ya' : 'Tidak'}
                        </button>
                      </td>

                      {/* 12. Tindak Lanjut */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-200">
                        <button
                          onClick={() => handleQuickToggle(rec, 'needsFollowUp')}
                          title="Klik untuk mengubah"
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-transform active:scale-95 ${
                            rec.needsFollowUp
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {rec.needsFollowUp ? 'Ya' : 'Tidak'}
                        </button>
                      </td>

                      {/* 13. Jenis Masalah */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700">
                        {rec.problemType ? (
                          <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                            {rec.problemType}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* 14. Ket & Aksi */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {rec.notes && (
                            <span className="text-[11px] text-slate-500 truncate max-w-[80px]" title={rec.notes}>
                              {rec.notes}
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingRecord(rec);
                              setIsEditModalOpen(true);
                            }}
                            className="h-7 px-2.5 text-[11px] text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Detail
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Edit Detail Record */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRecord(null);
        }}
        title={`Edit Data STBM - Kavling ${editingRecord?.block}-${editingRecord?.number}`}
      >
        {editingRecord && (
          <form onSubmit={handleSaveModalRecord} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900">{editingRecord.headOfFamily || '(Kosong)'}</span>
                <span className="text-slate-500 ml-2">Blok {editingRecord.block} No {editingRecord.number}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-600 font-medium">Jml Penghuni:</label>
                <input
                  type="number"
                  min="0"
                  value={editingRecord.occupants}
                  onChange={(e) => setEditingRecord({ ...editingRecord, occupants: parseInt(e.target.value) || 0 })}
                  className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-center text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-lg hover:bg-slate-100/70 cursor-pointer">
                <span className="font-medium text-slate-700">1. Akses Jamban Sehat</span>
                <input
                  type="checkbox"
                  checked={editingRecord.hasHealthyLatrine}
                  onChange={(e) => setEditingRecord({ ...editingRecord, hasHealthyLatrine: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-lg hover:bg-slate-100/70 cursor-pointer">
                <div>
                  <span className="font-medium text-slate-700">BABS (Buang Sembarangan)</span>
                  <p className="text-[10px] text-slate-400">Harus "Tidak" agar bebas BABS</p>
                </div>
                <input
                  type="checkbox"
                  checked={editingRecord.isBABS}
                  onChange={(e) => setEditingRecord({ ...editingRecord, isBABS: e.target.checked })}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-lg hover:bg-slate-100/70 cursor-pointer">
                <span className="font-medium text-slate-700">2. Cuci Tangan Pakai Sabun (CTPS)</span>
                <input
                  type="checkbox"
                  checked={editingRecord.hasCTPS}
                  onChange={(e) => setEditingRecord({ ...editingRecord, hasCTPS: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-lg hover:bg-slate-100/70 cursor-pointer">
                <span className="font-medium text-slate-700">3. Pengelolaan Air Minum & Makanan Aman</span>
                <input
                  type="checkbox"
                  checked={editingRecord.safeWaterAndFood}
                  onChange={(e) => setEditingRecord({ ...editingRecord, safeWaterAndFood: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-lg hover:bg-slate-100/70 cursor-pointer">
                <span className="font-medium text-slate-700">4. Pilah/Kelola Sampah (TPS3R)</span>
                <input
                  type="checkbox"
                  checked={editingRecord.wasteManagement}
                  onChange={(e) => setEditingRecord({ ...editingRecord, wasteManagement: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-lg hover:bg-slate-100/70 cursor-pointer">
                <span className="font-medium text-slate-700">5. Kelola Limbah Cair (SPAL)</span>
                <input
                  type="checkbox"
                  checked={editingRecord.liquidWasteManagement}
                  onChange={(e) => setEditingRecord({ ...editingRecord, liquidWasteManagement: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-lg hover:bg-slate-100/70 cursor-pointer">
                <span className="font-medium text-slate-700">Akses Air Bersih (PDAM)</span>
                <input
                  type="checkbox"
                  checked={editingRecord.hasCleanWaterAccess}
                  onChange={(e) => setEditingRecord({ ...editingRecord, hasCleanWaterAccess: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-lg hover:bg-slate-100/70 cursor-pointer">
                <span className="font-medium text-slate-700">Pemicuan / Sosialisasi STBM</span>
                <input
                  type="checkbox"
                  checked={editingRecord.hasSTBMTriggering}
                  onChange={(e) => setEditingRecord({ ...editingRecord, hasSTBMTriggering: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>
            </div>

            {/* Perlu Tindak Lanjut Toggle */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-900 text-xs">Perlu Tindak Lanjut Khusus?</span>
                <p className="text-[11px] text-amber-700">Tandai jika ada masalah sanitasi yang perlu intervensi RT / Puskesmas</p>
              </div>
              <input
                type="checkbox"
                checked={editingRecord.needsFollowUp}
                onChange={(e) => setEditingRecord({ ...editingRecord, needsFollowUp: e.target.checked })}
                className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
              />
            </div>

            {/* Jenis Masalah */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Jenis Masalah (Jika Ada)</label>
              <input
                type="text"
                value={editingRecord.problemType || ''}
                onChange={(e) => setEditingRecord({ ...editingRecord, problemType: e.target.value })}
                placeholder="Contoh: Tangki septik penuh, Aliran PDAM sering mati, dll."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {['Biotank penuh / meluap', 'Pipa SPALDT tersumbat/bocor', 'Bak kontrol rusak', 'Aliran SPAM/PDAM macet', 'Belum pilah sampah organik/anorganik'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setEditingRecord({ ...editingRecord, problemType: preset, needsFollowUp: true })}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px]"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Keterangan */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Keterangan Tambahan (Ket.)</label>
              <textarea
                rows={2}
                value={editingRecord.notes || ''}
                onChange={(e) => setEditingRecord({ ...editingRecord, notes: e.target.value })}
                placeholder="Keterangan tambahan untuk formulir laporan STBM..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingRecord(null);
                }}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Data STBM'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
