import React, { useState, useMemo } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  Edit2, 
  Trash2, 
  MessageCircle, 
  User, 
  MapPin, 
  AlertCircle, 
  Eye, 
  Phone, 
  Users, 
  FileText, 
  MoreVertical, 
  CreditCard,
  Building,
  Check,
  ChevronDown,
  ArrowUpDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  Hash,
  Coins,
  Search,
  CheckCircle2,
  Home,
  ClipboardCheck,
  Sparkles,
  Layers,
  CheckSquare
} from 'lucide-react';
import { House, PaymentStatus } from '../../../types';
import { useFinancial } from '../../../context/FinancialContext';
// PDF service loaded on-demand for optimized bundle performance
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { isValidWhatsAppNumber } from '../../../services/whatsappService';
import { useTenant } from '../../../context/TenantContext';

interface ResidentTableViewProps {
  filteredHouses: House[];
  selectedMonth: string;
  selectedIds: Set<string>;
  handleSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectOne: (id: string) => void;
  openDetail: (house: House) => void;
  handleOpenEdit: (house: House) => void;
  handleDelete: (id: string) => void;
  onSendWhatsApp?: (house: House) => void;
  handleUpdateHouse: (id: string, data: Partial<House>) => Promise<void>;
}

export const ResidentTableView: React.FC<ResidentTableViewProps> = ({
  filteredHouses,
  selectedMonth,
  selectedIds,
  handleSelectAll,
  handleSelectOne,
  openDetail,
  handleOpenEdit,
  handleDelete,
  onSendWhatsApp,
  handleUpdateHouse,
}) => {
  const { getPaymentStatus, getArrearsForHouse } = useFinancial();
  const { currentTenant } = useTenant();

  const handlePrintResidentCard = async (house: House) => {
    try {
      toast.info('Menyiapkan Kartu Warga Digital PDF...');
      const { generateResidentCardPDF } = await import('../../../services/pdfService');
      await generateResidentCardPDF(house);
    } catch (err) {
      console.error('Error generating resident card PDF:', err);
      toast.error('Gagal mencetak kartu warga.');
    }
  };

  // State: Sensus Cepat BPBD vs Tampilan Standar
  const [isBPBDMode, setIsBPBDMode] = useState(false);

  const [sortField, setSortField] = useState<'number' | 'headOfFamily' | 'occupants' | 'arrears' | 'pbbStatus' | 'residenceType' | 'status' | 'certificateStatus' | 'buildingCondition'>('number');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set());

  // Metrics summary for BPBD mode
  const bpbdStats = useMemo(() => {
    const total = filteredHouses.length;
    let certified = 0;
    let inProcess = 0;
    let uncertified = 0;
    let structuralMod = 0;
    let goodCond = 0;
    let abandoned = 0;
    let disrepair = 0;

    filteredHouses.forEach(h => {
      if (h.certificateStatus === 'Ya') certified++;
      else if (h.certificateStatus === 'Dalam Proses') inProcess++;
      else uncertified++;

      if (h.hasStructuralModification) structuralMod++;

      if (h.buildingCondition === 'Terlantar') abandoned++;
      else if (h.buildingCondition === 'Tidak Terawat') disrepair++;
      else goodCond++;
    });

    return { total, certified, inProcess, uncertified, structuralMod, goodCond, abandoned, disrepair };
  }, [filteredHouses]);

  // Bulk update handler for selected rows in BPBD mode
  const handleBulkUpdateBPBD = async (updates: Partial<House>) => {
    const count = selectedIds.size;
    if (count === 0) {
      toast.warning('Pilih minimal satu unit rumah terlebih dahulu.');
      return;
    }
    toast.info(`Memperbarui ${count} unit terpilih...`);
    try {
      await Promise.all(
        Array.from(selectedIds).map(id => handleUpdateHouse(id, updates))
      );
      toast.success(`Berhasil memperbarui ${count} unit terpilih!`);
    } catch (err) {
      console.error('Error bulk updating BPBD:', err);
      toast.error('Gagal memperbarui beberapa unit.');
    }
  };

  const toggleBlock = (block: string) => {
    setCollapsedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(block)) next.delete(block);
      else next.add(block);
      return next;
    });
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
      toast.info(`Urutan diubah (${sortDirection === 'asc' ? 'Z-A / Descending' : 'A-Z / Ascending'})`);
    } else {
      setSortField(field);
      setSortDirection('asc');
      toast.info(`Urut berdasarkan: ${field}`);
    }
  };

  // Group by block
  const groupedHouses = filteredHouses.reduce((acc, house) => {
    const blockKey = house.block || (house.id && house.id.includes('-') ? house.id.split('-')[0] : 'Lainnya');
    if (!acc[blockKey]) acc[blockKey] = [];
    acc[blockKey].push(house);
    return acc;
  }, {} as Record<string, House[]>);

  const sortedBlocks = Object.entries(groupedHouses).sort(([a], [b]) => 
    (a || '').localeCompare(b || '', undefined, { numeric: true, sensitivity: 'base' })
  );

  const renderSortIcon = (field: typeof sortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={11} className="text-slate-350 ml-1 inline-block opacity-40 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp size={11} className="text-indigo-600 ml-1 inline-block stroke-[3]" />
      : <ChevronDown size={11} className="text-indigo-600 ml-1 inline-block stroke-[3]" />;
  };

  // Empty State if no houses match filter
  if (filteredHouses.length === 0) {
    return (
      <div className="py-16 px-6 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-xs animate-fade-in">
        <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-2xs">
          <Search size={26} strokeWidth={2.2} />
        </div>
        <h4 className="text-base font-bold text-slate-800">Tidak Ada Data Warga Ditemukan</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
          Tidak ada hunian atau warga yang sesuai dengan kata kunci pencarian atau filter yang sedang aktif.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Mode Switcher: Tampilan Standar vs Mode Sensus Cepat BPBD */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
            isBPBDMode 
              ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-600 shadow-sm' 
              : 'bg-indigo-50 text-indigo-600 border-indigo-100'
          }`}>
            {isBPBDMode ? <ClipboardCheck size={20} className="stroke-[2.5]" /> : <Layers size={20} className="stroke-[2.5]" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-slate-800 tracking-tight">
                {isBPBDMode ? 'Mode Sensus Cepat BPBD & Huntap' : 'Tabel Manajemen Data Warga'}
              </h4>
              {isBPBDMode && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                  SENSUS AKTIF
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {isBPBDMode 
                ? 'Verifikasi langsung Sertifikat BPN, Kondisi Fisik, Perubahan Bentuk, & SK Huntap dalam 1 klik tanpa modal' 
                : 'Tampilan standar untuk administrasi kependudukan, kontak, dan iuran warga bulanan'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setIsBPBDMode(false);
                toast.info('Beralih ke Tampilan Standar (Iuran & Administrasi)');
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                !isBPBDMode 
                  ? 'bg-white text-indigo-700 shadow-xs font-extrabold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Home size={13} />
              <span>Standar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsBPBDMode(true);
                toast.success('Mode Sensus Cepat BPBD & Huntap diaktifkan!');
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                isBPBDMode 
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs font-extrabold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ClipboardCheck size={13} />
              <span>Sensus BPBD</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. BPBD Live Verification Progress Strip (When in BPBD Mode) */}
      {isBPBDMode && (
        <div className="p-4 bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-50/90 border border-amber-200/90 rounded-2xl shadow-xs space-y-3 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold text-amber-950">
              <Sparkles size={14} className="text-amber-600 shrink-0" />
              <span>Progres Sensus BPBD &amp; Fisik Huntap RT 02 (Total {bpbdStats.total} Unit Terfilter)</span>
            </div>
            <span className="text-[10px] font-semibold text-amber-800">
              💡 Ubah status langsung pada tombol di tabel, data otomatis tersimpan ke server.
            </span>
          </div>

          {/* Metric Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <div className="bg-white/90 border border-emerald-200 p-2.5 rounded-xl shadow-2xs">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Sertifikat (Ya)</span>
              <span className="text-sm font-extrabold text-emerald-700 font-mono tabular-nums">{bpbdStats.certified} Unit</span>
            </div>
            <div className="bg-white/90 border border-amber-200 p-2.5 rounded-xl shadow-2xs">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Dalam Proses</span>
              <span className="text-sm font-extrabold text-amber-700 font-mono tabular-nums">{bpbdStats.inProcess} Unit</span>
            </div>
            <div className="bg-white/90 border border-slate-200 p-2.5 rounded-xl shadow-2xs">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Belum Sertifikat</span>
              <span className="text-sm font-extrabold text-slate-700 font-mono tabular-nums">{bpbdStats.uncertified} Unit</span>
            </div>
            <div className="bg-white/90 border border-emerald-200 p-2.5 rounded-xl shadow-2xs">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Kondisi Baik</span>
              <span className="text-sm font-extrabold text-emerald-700 font-mono tabular-nums">{bpbdStats.goodCond} Unit</span>
            </div>
            <div className="bg-white/90 border border-rose-200 p-2.5 rounded-xl shadow-2xs">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Terlantar/Tdk Rawat</span>
              <span className="text-sm font-extrabold text-rose-700 font-mono tabular-nums">{bpbdStats.abandoned + bpbdStats.disrepair} Unit</span>
            </div>
            <div className="bg-white/90 border border-violet-200 p-2.5 rounded-xl shadow-2xs">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Renovasi Fisik</span>
              <span className="text-sm font-extrabold text-violet-700 font-mono tabular-nums">{bpbdStats.structuralMod} Unit</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Floating Bulk Action Toolbar for BPBD Sensus */}
      {isBPBDMode && selectedIds.size > 0 && (
        <div className="sticky top-4 z-30 p-3.5 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckSquare size={16} className="text-amber-400 shrink-0" />
            <span className="text-xs font-bold">
              {selectedIds.size} unit dipilih untuk pembaruan massal BPBD:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Set Certificate */}
            <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-[10px]">
              <span className="text-slate-400 font-bold px-1.5 uppercase tracking-wider">Sertifikat:</span>
              <button
                type="button"
                onClick={() => handleBulkUpdateBPBD({ certificateStatus: 'Ya' })}
                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold transition-colors cursor-pointer"
              >
                ✓ Ya
              </button>
              <button
                type="button"
                onClick={() => handleBulkUpdateBPBD({ certificateStatus: 'Dalam Proses' })}
                className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 font-bold transition-colors cursor-pointer"
              >
                ⏳ Proses
              </button>
              <button
                type="button"
                onClick={() => handleBulkUpdateBPBD({ certificateStatus: 'Tidak' })}
                className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold transition-colors cursor-pointer"
              >
                ✕ Belum
              </button>
            </div>

            {/* Set Condition */}
            <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-[10px]">
              <span className="text-slate-400 font-bold px-1.5 uppercase tracking-wider">Kondisi:</span>
              <button
                type="button"
                onClick={() => handleBulkUpdateBPBD({ buildingCondition: 'Baik' })}
                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold transition-colors cursor-pointer"
              >
                Baik
              </button>
              <button
                type="button"
                onClick={() => handleBulkUpdateBPBD({ buildingCondition: 'Terlantar' })}
                className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 font-bold transition-colors cursor-pointer"
              >
                Terlantar
              </button>
              <button
                type="button"
                onClick={() => handleBulkUpdateBPBD({ buildingCondition: 'Tidak Terawat' })}
                className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 font-bold transition-colors cursor-pointer"
              >
                Tdk Terawat
              </button>
            </div>

            {/* Set Renovation */}
            <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-[10px]">
              <span className="text-slate-400 font-bold px-1.5 uppercase tracking-wider">Renovasi:</span>
              <button
                type="button"
                onClick={() => handleBulkUpdateBPBD({ hasStructuralModification: true })}
                className="px-2 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 font-bold transition-colors cursor-pointer"
              >
                ✓ Renovasi
              </button>
              <button
                type="button"
                onClick={() => handleBulkUpdateBPBD({ hasStructuralModification: false })}
                className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold transition-colors cursor-pointer"
              >
                ✕ Standar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic & Interactive Modern Quick Sort Pill-tray for ALL Devices */}
      <div className="bg-slate-50/50 backdrop-blur-md rounded-2xl border border-slate-150 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-50 border border-indigo-100/65 rounded-xl flex items-center justify-center text-indigo-605 shadow-sm shrink-0">
            <ArrowUpDown size={14} className="stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Urutan Data Aktif</h4>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide">
              {isBPBDMode ? 'Urutkan data sensus BPBD berdasarkan parameter kunci' : 'Klik kolom tabel atau pilih opsi cepat ini untuk mengurutkan warga'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {(isBPBDMode ? [
            { id: 'number', label: 'No. Unit' },
            { id: 'headOfFamily', label: 'Penghuni' },
            { id: 'certificateStatus', label: 'Sertifikat' },
            { id: 'buildingCondition', label: 'Kondisi' },
            { id: 'residenceType', label: 'Status Hak' },
            { id: 'status', label: 'Hunian' },
          ] : [
            { id: 'number', label: 'No. Rumah' },
            { id: 'headOfFamily', label: 'Nama Warga' },
            { id: 'occupants', label: 'Jiwa/Huni' },
            { id: 'arrears', label: 'Tunggakan' },
            { id: 'status', label: 'Hunian' },
          ]).map(field => {
            const isCurrent = sortField === field.id;
            return (
              <button
                key={field.id}
                type="button"
                onClick={() => handleSort(field.id as any)}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-3.5 rounded-xl text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider transition-colors border ${
                  isCurrent 
                    ? isBPBDMode 
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-700 shadow-sm shadow-2xs' 
                      : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-650 shadow-sm shadow-2xs' 
                    : 'bg-white hover:bg-slate-50 text-slate-550 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{field.label}</span>
                {isCurrent && (
                  sortDirection === 'asc' ? <ChevronUp size={11} className="stroke-[3]" /> : <ChevronDown size={11} className="stroke-[3]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {sortedBlocks.map(([block, houses]) => {
        // Sort houses inside this block based on selected fields
        const sortedHouses = [...houses].sort((a, b) => {
          let valA: any = '';
          let valB: any = '';

          if (sortField === 'headOfFamily') {
            valA = a.headOfFamily || '';
            valB = b.headOfFamily || '';
          } else if (sortField === 'number') {
            valA = a.number || '';
            valB = b.number || '';
          } else if (sortField === 'occupants') {
            valA = a.occupants || 0;
            valB = b.occupants || 0;
          } else if (sortField === 'arrears') {
            valA = getArrearsForHouse(a).length;
            valB = getArrearsForHouse(b).length;
          } else if (sortField === 'pbbStatus') {
            valA = a.pbbStatus || '';
            valB = b.pbbStatus || '';
          } else if (sortField === 'residenceType') {
            valA = a.residenceType || '';
            valB = b.residenceType || '';
          } else if (sortField === 'status') {
            valA = a.status || '';
            valB = b.status || '';
          } else if (sortField === 'certificateStatus') {
            valA = a.certificateStatus || 'Tidak';
            valB = b.certificateStatus || 'Tidak';
          } else if (sortField === 'buildingCondition') {
            valA = a.buildingCondition || 'Baik';
            valB = b.buildingCondition || 'Baik';
          }

          if (typeof valA === 'string' && typeof valB === 'string') {
            return sortDirection === 'asc' 
              ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
              : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
          } else {
            return sortDirection === 'asc' 
              ? (valA > valB ? 1 : valA < valB ? -1 : 0)
              : (valB > valA ? 1 : valB < valA ? -1 : 0);
          }
        });

        return (
          <div key={block} className="bg-white rounded-[2rem] border border-slate-150 shadow-[0_5px_25px_rgba(235,240,245,0.45)] overflow-hidden transition-colors duration-300">
            {/* Section Block Header */}
            <div 
              onClick={() => toggleBlock(block)}
              className="bg-slate-50/80 hover:bg-slate-50 border-b border-slate-150 px-5 sm:px-6 py-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between cursor-pointer select-none group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                  <MapPin size={16} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                    <span>Blok Wilayah:</span>
                    <span className="font-semibold text-indigo-700 bg-indigo-50/80 px-2.5 py-0.5 rounded-lg border border-indigo-100/40">Blok {block}</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Sektor Manajemen Rukun Tetangga 02</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100/40 rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-3xs font-mono tabular-nums">
                  <Building size={11} />
                  <span>{houses.length} Rumah</span>
                </span>
                <span className="px-2.5 py-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center gap-1 shadow-3xs font-mono tabular-nums">
                  <Home size={11} className="text-emerald-600" />
                  <span>{houses.filter(h => h.status === 'Occupied').length} Dihuni</span>
                </span>
                <button 
                  type="button" 
                  className="p-1 hover:bg-slate-200/60 rounded-lg text-slate-500 transition-colors ml-1"
                  aria-label={collapsedBlocks.has(block) ? 'Buka blok' : 'Tutup blok'}
                >
                  {collapsedBlocks.has(block) ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
              </div>
            </div>

            {!collapsedBlocks.has(block) && (
              <>
            {/* 1. DESKTOP VIEW - Elegant structured heavy-duty table */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar max-h-[75vh] relative">
              <table className="w-full text-left border-collapse min-w-full">
                <thead className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-md shadow-2xs border-b border-slate-200/80 text-[10px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                  {isBPBDMode ? (
                    <tr className="border-b border-amber-200/80 bg-amber-50/95 backdrop-blur-md text-amber-900">
                      <th className="px-3 py-3.5 w-10 text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded-lg border-amber-300 text-amber-600 focus:ring-amber-500/20 focus:ring-offset-0 cursor-pointer"
                          onChange={handleSelectAll} 
                          checked={selectedIds.size === filteredHouses.length && filteredHouses.length > 0} 
                        />
                      </th>
                      <th className="px-3 py-3.5 w-24 group cursor-pointer hover:bg-amber-100/40 transition-colors" onClick={() => handleSort('number')}>
                        <div className="flex items-center gap-1 font-bold">
                          <span>Unit Kavling</span>
                          {renderSortIcon('number')}
                        </div>
                      </th>
                      <th className="px-3 py-3.5 group cursor-pointer hover:bg-amber-100/40 transition-colors" onClick={() => handleSort('headOfFamily')}>
                        <div className="flex items-center gap-1 font-bold">
                          <span>Nama Penghuni / Kepala Keluarga</span>
                          {renderSortIcon('headOfFamily')}
                        </div>
                      </th>
                      <th className="px-3 py-3.5 w-44 font-bold">Pemilik SK Huntap</th>
                      <th className="px-3 py-3.5 w-36 font-bold">Hubungan SK</th>
                      <th className="px-3 py-3.5 w-48 text-center group cursor-pointer hover:bg-amber-100/40 transition-colors font-bold" onClick={() => handleSort('certificateStatus')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Sertifikat BPN/BPBD</span>
                          {renderSortIcon('certificateStatus')}
                        </div>
                      </th>
                      <th className="px-3 py-3.5 w-44 text-center group cursor-pointer hover:bg-amber-100/40 transition-colors font-bold" onClick={() => handleSort('buildingCondition')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Kondisi Fisik</span>
                          {renderSortIcon('buildingCondition')}
                        </div>
                      </th>
                      <th className="px-3 py-3.5 w-32 text-center font-bold">Bentuk Bangunan</th>
                      <th className="px-3 py-3.5 w-48 font-bold">Catatan / Tindak Lanjut</th>
                      <th className="px-3 py-3.5 w-24 text-right font-bold">Aksi</th>
                    </tr>
                  ) : (
                    <tr className="border-b border-slate-200/80 bg-slate-50/95 backdrop-blur-md">
                      <th className="px-3 py-3.5 w-10 text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500/20 focus:ring-offset-0 cursor-pointer"
                          onChange={handleSelectAll} 
                          checked={selectedIds.size === filteredHouses.length && filteredHouses.length > 0} 
                        />
                      </th>
                      <th className="px-3 py-3.5 group cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => handleSort('headOfFamily')}>
                        <div className="flex items-center gap-1">
                          <span>Nama Kepala Keluarga / Pemilik</span>
                          {renderSortIcon('headOfFamily')}
                        </div>
                      </th>
                      <th className="px-3 py-3.5 w-24 group cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => handleSort('number')}>
                        <div className="flex items-center gap-1">
                          <span>No. Rumah</span>
                          {renderSortIcon('number')}
                        </div>
                      </th>
                      <th className="px-3 py-3.5">Kontak WhatsApp</th>
                      <th className="px-3 py-3.5 w-16 text-center cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => handleSort('occupants')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Jiwa</span>
                          {renderSortIcon('occupants')}
                        </div>
                      </th>
                      <th className="px-3 py-3.5 w-28 group cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => handleSort('pbbStatus')}>
                        <div className="flex items-center gap-1">
                          <span>SPPT PBB</span>
                          {renderSortIcon('pbbStatus')}
                        </div>
                      </th>
                      <th className="px-3 py-3.5 w-32 group cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => handleSort('residenceType')}>
                        <div className="flex items-center gap-1">
                          <span>Jenis Hak</span>
                          {renderSortIcon('residenceType')}
                        </div>
                      </th>
                      <th className="px-3 py-3.5 w-24 group cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => handleSort('status')}>
                        <div className="flex items-center gap-1">
                          <span>Status</span>
                          {renderSortIcon('status')}
                        </div>
                      </th>
                      <th className="px-3 py-3.5 w-24 text-center font-semibold">S. Sampah</th>
                      <th className="px-3 py-3.5 w-24 text-center font-semibold">S. Air</th>
                      <th className="px-3 py-3.5 w-24 text-center group cursor-pointer hover:bg-slate-50/50 transition-colors font-semibold" onClick={() => handleSort('arrears')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Tunggakan</span>
                          {renderSortIcon('arrears')}
                        </div>
                      </th>
                      <th className="px-3 py-3.5 w-28 text-right font-semibold">Aksi Panel</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
                  {sortedHouses.map((house) => {
                    const statusSampah = getPaymentStatus(house, 'Sampah', selectedMonth);
                    const statusAir = getPaymentStatus(house, 'Air', selectedMonth);
                    const arrears = getArrearsForHouse(house);
                    const isSelected = selectedIds.has(house.id);

                    if (isBPBDMode) {
                      return (
                        <tr 
                          key={house.id} 
                          className={`transition-colors duration-150 group ${
                            isSelected 
                              ? 'bg-amber-50/50 hover:bg-amber-50/70 border-l-4 border-l-amber-600' 
                              : 'hover:bg-amber-50/25'
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="px-3 py-3 text-center">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded-lg border-slate-350 text-amber-600 focus:ring-amber-500/20 focus:ring-offset-0 cursor-pointer transition-colors"
                              checked={isSelected} 
                              onChange={() => handleSelectOne(house.id)} 
                            />
                          </td>

                          {/* Unit Kavling (Blok - No) */}
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-mono font-extrabold text-amber-950 bg-amber-100/70 border border-amber-200/90 px-2.5 py-0.5 rounded-lg text-xs w-fit shadow-3xs">
                                {house.block || '-'}-{house.number || '-'}
                              </span>
                              <span className={`text-[9px] font-bold mt-1 uppercase w-fit px-1.5 py-0.2 rounded border ${
                                house.status === 'Empty' 
                                  ? 'bg-slate-100 text-slate-500 border-slate-200' 
                                  : house.status === 'Business' 
                                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {house.status === 'Empty' ? 'Kosong' : house.status === 'Business' ? 'Usaha' : 'Dihuni'}
                              </span>
                            </div>
                          </td>

                          {/* Penghuni / Kepala Keluarga */}
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2.5 max-w-[240px]">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border uppercase shadow-3xs ${
                                house.status === 'Occupied' 
                                  ? 'bg-amber-50 text-amber-800 border-amber-200' 
                                  : 'bg-slate-50 text-slate-400 border-slate-200'
                              }`}>
                                {house.headOfFamily ? house.headOfFamily.charAt(0) : <User size={13} />}
                              </div>
                              <div className="truncate">
                                <span className="font-extrabold text-slate-800 text-xs truncate block" title={house.headOfFamily || 'KOSONG'}>
                                  {house.headOfFamily || 'RUMAH KOSONG'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                  <span>{house.residenceType || 'Tetap'}</span>
                                  <span>•</span>
                                  <span>{house.occupants || (house.status === 'Empty' ? 0 : 1)} Jiwa</span>
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Pemilik SK Huntap */}
                          <td className="px-3 py-3">
                            <div className="flex flex-col gap-1 max-w-[170px]">
                              <span className="font-bold text-slate-800 text-xs truncate" title={house.ownerName || '-'}>
                                {house.ownerName && house.ownerName.trim() !== '' && house.ownerName !== '-' 
                                  ? house.ownerName 
                                  : (house.residenceType === 'Tetap' ? house.headOfFamily : '- Belum Terdata -')}
                              </span>
                              {(!house.ownerName || house.ownerName === '-' || house.ownerName === house.headOfFamily) && house.headOfFamily && house.status !== 'Empty' && (
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await handleUpdateHouse(house.id, { ownerName: house.headOfFamily });
                                    toast.success(`Pemilik SK No. ${house.number} diset: ${house.headOfFamily}`);
                                  }}
                                  className="text-[9px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded w-fit transition-colors cursor-pointer"
                                  title="Gunakan nama kepala keluarga saat ini sebagai pemilik SK"
                                >
                                  = Sama dgn KK
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Hubungan SK (Dropdown) */}
                          <td className="px-3 py-3">
                            <div className="relative w-32">
                              <select
                                value={house.ownerRelationship || (house.residenceType === 'Tetap' ? 'Diri Sendiri' : house.residenceType === 'Sewa' ? 'Penyewa' : '')}
                                onChange={async (e) => {
                                  const val = e.target.value;
                                  await handleUpdateHouse(house.id, { ownerRelationship: val });
                                  toast.success(`Hubungan No. ${house.number}: ${val}`);
                                }}
                                className="w-full appearance-none bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 pr-6 text-[10px] font-bold text-slate-700 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200 transition-colors cursor-pointer shadow-3xs"
                              >
                                <option value="">-- Hubungan --</option>
                                <option value="Diri Sendiri">Diri Sendiri</option>
                                <option value="Istri">Istri</option>
                                <option value="Suami">Suami</option>
                                <option value="Anak">Anak</option>
                                <option value="Penyewa">Penyewa</option>
                                <option value="Pembeli">Pembeli</option>
                                <option value="Saudara / Kerabat">Kerabat</option>
                                <option value="Penjaga Rumah">Penjaga</option>
                                <option value="Lainnya">Lainnya</option>
                              </select>
                              <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 stroke-[2.5]" />
                            </div>
                          </td>

                          {/* Sertifikat BPN/BPBD (3-segment pill) */}
                          <td className="px-3 py-3 text-center">
                            <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200 shadow-3xs">
                              {[
                                { id: 'Ya', label: 'Ya', activeClass: 'bg-emerald-600 text-white shadow-2xs font-extrabold' },
                                { id: 'Dalam Proses', label: 'Proses', activeClass: 'bg-amber-600 text-white shadow-2xs font-extrabold' },
                                { id: 'Tidak', label: 'Belum', activeClass: 'bg-slate-800 text-white shadow-2xs font-extrabold' }
                              ].map(st => {
                                const isCurrent = (house.certificateStatus || 'Tidak') === st.id;
                                return (
                                  <button
                                    key={st.id}
                                    type="button"
                                    onClick={async () => {
                                      if (isCurrent) return;
                                      await handleUpdateHouse(house.id, { certificateStatus: st.id as any });
                                      toast.success(`Sertifikat No. ${house.number}: ${st.label}`);
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                      isCurrent 
                                        ? st.activeClass 
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                                    }`}
                                  >
                                    {st.label}
                                  </button>
                                );
                              })}
                            </div>
                          </td>

                          {/* Kondisi Fisik Bangunan (3-segment pill) */}
                          <td className="px-3 py-3 text-center">
                            <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200 shadow-3xs">
                              {[
                                { id: 'Baik', label: 'Baik', activeClass: 'bg-emerald-600 text-white shadow-2xs font-extrabold' },
                                { id: 'Terlantar', label: 'Terlantar', activeClass: 'bg-amber-600 text-white shadow-2xs font-extrabold' },
                                { id: 'Tidak Terawat', label: 'Rusak', activeClass: 'bg-rose-600 text-white shadow-2xs font-extrabold' }
                              ].map(cond => {
                                const isCurrent = (house.buildingCondition || 'Baik') === cond.id;
                                return (
                                  <button
                                    key={cond.id}
                                    type="button"
                                    onClick={async () => {
                                      if (isCurrent) return;
                                      await handleUpdateHouse(house.id, { buildingCondition: cond.id as any });
                                      toast.success(`Kondisi No. ${house.number}: ${cond.label}`);
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                      isCurrent 
                                        ? cond.activeClass 
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                                    }`}
                                  >
                                    {cond.label}
                                  </button>
                                );
                              })}
                            </div>
                          </td>

                          {/* Bentuk Fisik Bangunan (Toggle pill) */}
                          <td className="px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={async () => {
                                const nextVal = !house.hasStructuralModification;
                                await handleUpdateHouse(house.id, { hasStructuralModification: nextVal });
                                toast.success(`Bentuk Bangunan No. ${house.number}: ${nextVal ? 'Renovasi Struktural' : 'Standar Huntap'}`);
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer shadow-3xs ${
                                house.hasStructuralModification 
                                  ? 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' 
                                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-white'
                              }`}
                            >
                              {house.hasStructuralModification ? '🔨 Renovasi' : '📐 Standar'}
                            </button>
                          </td>

                          {/* Catatan / Tindak Lanjut Inline Input */}
                          <td className="px-3 py-3">
                            <input
                              type="text"
                              defaultValue={house.specialNotes || ''}
                              onBlur={async (e) => {
                                const val = e.target.value.trim();
                                if (val !== (house.specialNotes || '')) {
                                  await handleUpdateHouse(house.id, { specialNotes: val });
                                  toast.success(`Catatan No. ${house.number} disimpan.`);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur();
                                }
                              }}
                              placeholder="Ketik catatan BPBD..."
                              className="w-44 px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded-lg outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200 transition-colors shadow-3xs"
                            />
                          </td>

                          {/* Aksi Cepat */}
                          <td className="px-3 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => openDetail(house)} 
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-150 rounded-lg transition-colors shadow-3xs"
                                title="Lihat Profil Lengkap"
                              >
                                <Eye size={13} className="stroke-[2.5]" />
                              </button>
                              <button 
                                onClick={() => handleOpenEdit(house)} 
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-slate-150 rounded-lg transition-colors shadow-3xs"
                                title="Buka Form Edit Warga"
                              >
                                <Edit2 size={13} className="stroke-[2.5]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr 
                        key={house.id} 
                        className={`transition-colors duration-150 group ${
                          isSelected 
                            ? 'bg-indigo-50/30 hover:bg-indigo-50/45 border-l-4 border-l-indigo-600' 
                            : 'hover:bg-slate-50/40'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-5 py-4.5 text-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded-lg border-slate-350 text-indigo-600 focus:ring-indigo-500/20 focus:ring-offset-0 cursor-pointer transition-colors"
                            checked={isSelected} 
                            onChange={() => handleSelectOne(house.id)} 
                          />
                        </td>

                        {/* Citizen Name & Verification Quick-Action */}
                        <td className="px-5 py-4.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-xs shrink-0 border uppercase shadow-3xs transition-transform group-hover:scale-105 ${
                              house.status === 'Occupied' 
                                ? 'bg-gradient-to-br from-indigo-50 to-indigo-100/40 text-indigo-600 border-indigo-100' 
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}>
                              {house.headOfFamily ? house.headOfFamily.charAt(0) : <User size={13} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 max-w-[220px]">
                                <span className="font-extrabold text-slate-800 text-sm truncate">{house.headOfFamily || 'KOSONG (KOSONGAN)'}</span>
                                
                                {/* Dynamic Interactive Official Verification Shield Badge */}
                                {house.isVerified ? (
                                  <button 
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await handleUpdateHouse(house.id, { isVerified: false });
                                      toast.info(`Status verifikasi ${house.headOfFamily || 'Rumah'} dinonaktifkan.`);
                                    }}
                                    className="text-blue-600 hover:text-rose-600 transition-colors focus:outline-none focus:scale-110 active:scale-95 shrink-0"
                                    title="Telah Terverifikasi RT 02 (Klik untuk batalkan verifikasi)"
                                  >
                                    <ShieldCheck size={14} className="fill-blue-50 stroke-blue-600 stroke-[2.5]" />
                                  </button>
                                ) : (
                                  <button 
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await handleUpdateHouse(house.id, { isVerified: true });
                                      toast.success(`Warga ${house.headOfFamily || 'Rumah'} terverifikasi resmi!`);
                                    }}
                                    className="text-slate-300 hover:text-emerald-600 transition-colors focus:outline-none focus:scale-110 active:scale-95 shrink-0"
                                    title="Belum Diverifikasi RT (Klik untuk verifikasi resmi instan)"
                                  >
                                    <ShieldAlert size={14} className="stroke-[2.5]" />
                                  </button>
                                )}
                              </div>
                              {house.ownerName && house.ownerName !== house.headOfFamily && (
                                <p className="text-[10px] font-bold text-slate-450 truncate mt-0.5 tracking-wide uppercase">
                                  PEMILIK: <span className="text-slate-500 font-extrabold">{house.ownerName}</span>
                                </p>
                              )}
                              {(house.hasBusiness || house.businessName) && (
                                <p className="text-[10px] font-bold text-amber-700 truncate mt-0.5 tracking-wide flex items-center gap-1">
                                  <span>🏪</span>
                                  <span>{house.businessName || 'Usaha / UMKM'}</span>
                                </p>
                              )}
                              {house.status === 'Occupied' && (
                                <div className="mt-0.5 flex flex-wrap items-center gap-1">
                                  <span 
                                    className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                                      (house.ktpStatus === 'Sesuai Domisili' || (!house.ktpStatus && house.addressKtp && (house.addressKtp.toLowerCase().includes('tondo') || house.addressKtp.toLowerCase().includes('pue lombe'))))
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                                        : 'bg-amber-50 text-amber-700 border-amber-200/70'
                                    }`}
                                    title={house.addressKtp ? `Alamat KTP: ${house.addressKtp}` : `Status KTP: ${house.ktpStatus || 'Belum Terdata'}`}
                                  >
                                    <span>🪪</span>
                                    <span>{(house.ktpStatus === 'Sesuai Domisili' || (!house.ktpStatus && house.addressKtp && (house.addressKtp.toLowerCase().includes('tondo') || house.addressKtp.toLowerCase().includes('pue lombe')))) ? (currentTenant ? `KTP RT ${currentTenant.rt}` : 'KTP Lokal') : 'KTP Luar'}</span>
                                  </span>

                                  {/* BPBD Huntap Certificate Status Quick Indicator & Toggle */}
                                  <button
                                    type="button"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      const nextCert = house.certificateStatus === 'Ya' ? 'Tidak' : 'Ya';
                                      await handleUpdateHouse(house.id, { certificateStatus: nextCert });
                                      toast.success(`Sertifikat BPBD No. ${house.number}: ${nextCert === 'Ya' ? 'Bersertifikat' : 'Belum Bersertifikat'}`);
                                    }}
                                    className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded border transition-colors hover:opacity-80 active:scale-95 ${
                                      house.certificateStatus === 'Ya'
                                        ? 'bg-teal-50 text-teal-700 border-teal-200'
                                        : 'bg-amber-50/90 text-amber-800 border-amber-200'
                                    }`}
                                    title={`Status Sertifikat BPBD: ${house.certificateStatus === 'Ya' ? 'Bersertifikat (Klik untuk ubah)' : 'Belum Bersertifikat (Klik untuk ubah)'}`}
                                  >
                                    <span>{house.certificateStatus === 'Ya' ? '📜' : '⚠️'}</span>
                                    <span>{house.certificateStatus === 'Ya' ? 'Sertifikat' : 'Belum Sertifikat'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* House Number */}
                        <td className="px-5 py-4.5">
                          <span className="font-mono font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg text-xs shadow-3xs">
                            No. {house.number}
                          </span>
                        </td>

                        {/* Telephone / WhatsApp contact */}
                        <td className="px-5 py-4.5">
                          {isValidWhatsAppNumber(house.phone) ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-700 font-bold tracking-wide">{house.phone}</span>
                              {onSendWhatsApp && (
                                <button 
                                  onClick={() => onSendWhatsApp(house)} 
                                  className="p-1 px-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 rounded-lg border border-emerald-100/40 transition-colors flex items-center gap-0.5 active:scale-90"
                                  title="Kirim Pesan WhatsApp"
                                >
                                  <MessageCircle size={13} className="stroke-[2.5]" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 hover:text-slate-400 transition-colors italic text-[11px] font-normal cursor-help" title="Gunakan tombol edit di kanan untuk mengisi no. HP warga">- Belum Ada HP -</span>
                          )}
                        </td>

                        {/* Occupants Account (Jiwa) */}
                        <td className="px-5 py-4.5 text-center">
                          <div className="inline-flex items-center justify-center gap-1 text-slate-700 font-semibold bg-slate-50 border border-slate-205 w-11 h-6 rounded-lg shadow-3xs">
                            <Users size={11} className="text-indigo-500 stroke-[2.5]" />
                            <span className="text-[10px]">{house.occupants || 0}</span>
                          </div>
                        </td>

                        {/* PBB status quick change */}
                        <td className="px-5 py-4.5">
                          <button 
                            onClick={() => {
                              const newStatus = house.pbbStatus === 'Sudah Diambil' ? 'Belum Diambil' : 'Sudah Diambil';
                              const year = house.pbbYear || new Date().getFullYear().toString();
                              handleUpdateHouse(house.id, { pbbStatus: newStatus, pbbYear: year });
                              toast.success(`Administrasi SPPT PBB No. ${house.number} diubah ke: ${newStatus}`);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold border transition-colors active:scale-95 shadow-3xs hover:-translate-y-0.5 ${
                              house.pbbStatus === 'Sudah Diambil' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/55' 
                                : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/55'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${house.pbbStatus === 'Sudah Diambil' ? 'bg-emerald-500 ' : 'bg-amber-500'}`} />
                            <span>{house.pbbStatus === 'Sudah Diambil' ? 'Diambil' : 'Belum'}</span>
                          </button>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {house.pbbProofAtRt === 'Ada di RT' && (
                              <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 border border-sky-100" title="Bukti PBB sudah ada di tangan RT">Bukti RT</span>
                            )}
                            {house.pbbPaymentStatus === 'Lunas' && (
                              <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-100" title="Pembayaran PBB Lunas">Lunas</span>
                            )}
                          </div>
                        </td>

                        {/* Ownership Type */}
                        <td className="px-5 py-4.5">
                          <div className="relative inline-block w-28">
                            <select
                              value={house.residenceType || 'Tetap'}
                              onChange={(e) => {
                                const newType = e.target.value as any;
                                const updates: any = { residenceType: newType };
                                const existingSk = (house.ownerName && house.ownerName.trim() !== '' && house.ownerName !== '-')
                                  ? house.ownerName.trim()
                                  : house.headOfFamily;
                                if (existingSk && (!house.ownerName || house.ownerName === '-')) {
                                  updates.ownerName = existingSk;
                                }
                                if (newType === 'Sewa' && (!house.ownerRelationship || house.ownerRelationship === 'Diri Sendiri')) {
                                  updates.ownerRelationship = 'Penyewa';
                                } else if (newType === 'Rumah Keluarga' && (!house.ownerRelationship || house.ownerRelationship === 'Diri Sendiri' || house.ownerRelationship === 'Penyewa')) {
                                  updates.ownerRelationship = 'Saudara / Kerabat';
                                } else if (newType === 'Tetap' && house.ownerRelationship === 'Penyewa') {
                                  updates.ownerRelationship = 'Diri Sendiri';
                                }
                                handleUpdateHouse(house.id, updates);
                                toast.info(`Status Kepenghunian No. ${house.number} diubah ke ${newType} (Pemilik SK: ${existingSk || '-'})`);
                              }}
                              className="appearance-none w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-[10px] rounded-xl px-2.5 py-1.5 pr-6 border border-slate-200 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-colors shadow-3xs"
                            >
                              <option value="Tetap">🏡 Tetap/Pribadi</option>
                              <option value="Sewa">🔑 Sewa/Kontrak</option>
                              <option value="Rumah Keluarga">👨‍👩‍👦 Keluarga</option>
                            </select>
                            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 stroke-[2.5]" />
                          </div>
                        </td>

                        {/* Occupancy Status */}
                        <td className="px-5 py-4.5">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold border uppercase tracking-wider shadow-4xs ${
                            house.status === 'Occupied' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                            house.status === 'Empty' ? 'bg-slate-50 text-slate-505 border-slate-200' : 
                            house.status === 'Business' ? 'bg-purple-50 text-purple-700 border-purple-150' :
                            'bg-sky-50 text-sky-700 border-sky-150'
                          }`}>
                            {house.status === 'Occupied' ? 'Dihuni' : 
                             house.status === 'Empty' ? 'Kosong' : 
                             house.status === 'Business' ? 'Usaha' : 'Visit'}
                          </span>
                        </td>

                        {/* Waste Fee (Sampah) */}
                        <td className="px-5 py-4.5 text-center">
                          <div className="flex justify-center">
                            <PaymentIndicator status={statusSampah} service="Sampah" />
                          </div>
                        </td>

                        {/* Water Fee (Air) */}
                        <td className="px-5 py-4.5 text-center">
                          <div className="flex justify-center">
                            <PaymentIndicator status={statusAir} service="Air" />
                          </div>
                        </td>

                        {/* Total Arrears (Tunggakan) */}
                        <td className="px-5 py-4.5 text-center">
                          <div className="flex justify-center">
                            {arrears.length > 0 ? (
                              <span className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-100 text-rose-650 text-[10px] font-semibold rounded-xl shadow-4xs">
                                <Coins size={10} />
                                <span>{arrears.length} Bulan</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 border border-emerald-100/50 text-emerald-605 bg-emerald-50/20 text-[9px] font-semibold uppercase tracking-widest rounded-lg">Lunas</span>
                            )}
                          </div>
                        </td>

                        {/* Administrative Actions Panel */}
                        <td className="px-5 py-4.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => handlePrintResidentCard(house)} 
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition-colors rounded-lg shadow-3xs"
                              title="Cetak Kartu Warga Digital RT 02 (PDF)"
                            >
                              <FileText size={14} className="stroke-[2.5] text-emerald-600" />
                            </button>
                            <button 
                              onClick={() => openDetail(house)} 
                              className="p-1.5 text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-150 transition-colors rounded-lg shadow-3xs"
                              title="Tampilkan Info Profile Detail"
                            >
                              <Eye size={14} className="stroke-[2.5]" />
                            </button>
                            <button 
                              onClick={() => handleOpenEdit(house)} 
                              className="p-1.5 text-slate-400 hover:text-amber-655 hover:bg-amber-50 border border-slate-100 hover:border-amber-150 transition-colors rounded-lg shadow-3xs"
                              title="Edit Biodata Rumah"
                            >
                              <Edit2 size={13} className="stroke-[2.5]" />
                            </button>
                            <button 
                              onClick={() => handleDelete(house.id)} 
                              className="p-1.5 text-slate-400 hover:text-rose-650 hover:bg-rose-50 border border-slate-100 hover:border-rose-150 transition-colors rounded-lg shadow-3xs"
                              title="Hapus Data Hunian"
                            >
                              <Trash2 size={13} className="stroke-[2.5]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 2. MOBILE VIEW - Optimized High-Fidelity Bento Cards (No overflow, responsive layout) */}
            <div className="md:hidden divide-y divide-slate-100 bg-slate-50/20">
              {sortedHouses.map((house) => {
                const statusSampah = getPaymentStatus(house, 'Sampah', selectedMonth);
                const statusAir = getPaymentStatus(house, 'Air', selectedMonth);
                const arrears = getArrearsForHouse(house);
                const isSelected = selectedIds.has(house.id);

                return (
                  <div 
                    key={house.id} 
                    className={`p-4 transition-colors duration-150 space-y-4 ${
                      isSelected ? 'bg-indigo-50/30 border-l-4 border-l-indigo-500' : 'bg-white hover:bg-slate-50/30'
                    }`}
                  >
                    
                    {/* Card Section 1: Main Identifier & Selector */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 w-full max-w-[80%]">
                        {/* Selector checkbox */}
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500/10 cursor-pointer shrink-0 mt-0.5"
                          checked={isSelected} 
                          onChange={() => handleSelectOne(house.id)} 
                        />
                        
                        {/* Avatar Image Initials / Icon */}
                        <div className="flex items-center gap-2.5 truncate w-full">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-xs shrink-0 border uppercase shadow-3xs ${
                            house.status === 'Occupied' 
                              ? 'bg-gradient-to-br from-indigo-50 to-indigo-100/35 text-indigo-600 border-indigo-100' 
                              : 'bg-slate-55 text-slate-400 border-slate-200'
                          }`}>
                            {house.headOfFamily ? house.headOfFamily.charAt(0) : <User size={13} />}
                          </div>
                          <div className="truncate w-[75%]">
                            <div className="flex items-center gap-1">
                              <h4 className="font-extrabold text-slate-800 text-sm truncate leading-tight">{house.headOfFamily || 'RUMAH KOSONG'}</h4>
                              {house.isVerified ? (
                                <ShieldCheck size={14} className="fill-blue-50 stroke-blue-600 stroke-[2.5] shrink-0" />
                              ) : (
                                <ShieldAlert size={14} className="stroke-slate-300 stroke-[2] shrink-0" />
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="font-mono text-[9px] font-semibold text-indigo-750 bg-indigo-50/80 border border-indigo-100/20 px-1.5 py-0.5 rounded shadow-3xs leading-none">
                                NO. {house.number}
                              </span>
                              {house.occupants ? (
                                <span className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5 leading-none">
                                  <Users size={10} className="text-slate-400" /> {house.occupants} Jiwa
                                </span>
                              ) : null}
                            </div>
                            {/* Mobile BPBD Indicator */}
                            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const nextCert = house.certificateStatus === 'Ya' ? 'Tidak' : 'Ya';
                                  await handleUpdateHouse(house.id, { certificateStatus: nextCert });
                                  toast.success(`Sertifikat BPBD No. ${house.number}: ${nextCert === 'Ya' ? 'Bersertifikat' : 'Belum Bersertifikat'}`);
                                }}
                                className={`inline-flex items-center gap-1 text-[8.5px] font-bold px-1.5 py-0.5 rounded border transition-colors ${
                                  house.certificateStatus === 'Ya'
                                    ? 'bg-teal-50 text-teal-700 border-teal-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                <span>{house.certificateStatus === 'Ya' ? '📜' : '⚠️'}</span>
                                <span>{house.certificateStatus === 'Ya' ? 'Sertifikat BPBD' : 'Belum Sertifikat'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Occupancy state tag */}
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-semibold border uppercase tracking-wider shrink-0 shadow-3xs ${
                        house.status === 'Occupied' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                        house.status === 'Empty' ? 'bg-slate-50 text-slate-450 border-slate-205' : 
                        house.status === 'Business' ? 'bg-purple-50 text-purple-700 border-purple-150' :
                        'bg-sky-50 text-sky-700 border-sky-150'
                      }`}>
                        {house.status === 'Occupied' ? 'Huni' : 
                         house.status === 'Empty' ? 'Kosong' : 
                         house.status === 'Business' ? 'Usaha' : 'Visit'}
                      </span>
                    </div>

                    {/* Card Section 2 & 3: Conditional BPBD Sensus vs Standard Financial & PBB */}
                    {isBPBDMode ? (
                      /* Mobile BPBD Sensus Quick Controls */
                      <div className="flex flex-col gap-2.5 bg-amber-50/40 p-3 rounded-xl border border-amber-200/60 shadow-3xs">
                        {/* Row 1: Pemilik SK Huntap & Hubungan */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-[10px] font-bold text-amber-900">
                            <span className="flex items-center gap-1 font-extrabold text-amber-800 uppercase tracking-wider text-[9px]">
                              <Shield size={10} className="text-amber-600" /> Pemilik SK Huntap:
                            </span>
                            {house.headOfFamily && house.headOfFamily !== '-' && house.ownerName !== house.headOfFamily && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateHouse(house.id, { ownerName: house.headOfFamily, ownerRelationship: 'Diri Sendiri' });
                                  toast.success(`Pemilik SK disinkronkan ke KK: ${house.headOfFamily}`);
                                }}
                                className="text-[9px] font-bold text-amber-700 hover:text-amber-900 bg-white/80 hover:bg-white px-2 py-0.5 rounded-md border border-amber-200 transition-colors shadow-3xs"
                              >
                                = Sama dgn KK
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-12 gap-1.5">
                            <input
                              type="text"
                              defaultValue={house.ownerName || ''}
                              placeholder={house.headOfFamily || 'Nama pemilik SK...'}
                              onBlur={(e) => {
                                const val = e.target.value.trim();
                                if (val !== (house.ownerName || '')) {
                                  handleUpdateHouse(house.id, { ownerName: val });
                                  toast.success(`Pemilik SK unit ${house.number} diperbarui`);
                                }
                              }}
                              className="col-span-7 bg-white border border-amber-200 focus:border-amber-400 text-slate-800 text-[10.5px] font-bold rounded-lg px-2 py-1 outline-none shadow-3xs"
                            />
                            <div className="col-span-5 relative">
                              <select
                                value={house.ownerRelationship || (house.residenceType === 'Tetap' ? 'Diri Sendiri' : 'Penyewa')}
                                onChange={(e) => {
                                  const val = e.target.value as any;
                                  handleUpdateHouse(house.id, { ownerRelationship: val });
                                  toast.success(`Hubungan SK unit ${house.number}: ${val}`);
                                }}
                                className="w-full appearance-none bg-white border border-amber-200 text-slate-700 text-[9.5px] font-semibold rounded-lg px-2 py-1 pr-5 outline-none cursor-pointer shadow-3xs"
                              >
                                <option value="Diri Sendiri">Diri Sendiri</option>
                                <option value="Istri">Istri</option>
                                <option value="Suami">Suami</option>
                                <option value="Anak">Anak</option>
                                <option value="Penyewa">Penyewa</option>
                                <option value="Pembeli (Alih Hak)">Pembeli</option>
                                <option value="Saudara / Kerabat">Kerabat</option>
                                <option value="Penjaga Rumah">Penjaga</option>
                                <option value="Lainnya">Lainnya</option>
                              </select>
                              <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-amber-500" />
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Sertifikat BPBD & Kondisi Fisik */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/50">
                          {/* Sertifikat 3-segment pill */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-600">Sertifikat:</span>
                            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-3xs">
                              {(['Ya', 'Dalam Proses', 'Belum'] as const).map((opt) => {
                                const current = house.certificateStatus || 'Belum';
                                const active = (opt === 'Dalam Proses' && current === 'Dalam Proses') ||
                                               (opt === 'Ya' && current === 'Ya') ||
                                               (opt === 'Belum' && (current === 'Belum' || current === 'Tidak'));
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => {
                                      handleUpdateHouse(house.id, { certificateStatus: opt });
                                      toast.success(`Sertifikat No. ${house.number}: ${opt}`);
                                    }}
                                    className={`flex-1 py-1 rounded text-[9px] font-extrabold transition-all ${
                                      active
                                        ? opt === 'Ya'
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : opt === 'Dalam Proses'
                                          ? 'bg-amber-500 text-white shadow-xs'
                                          : 'bg-rose-500 text-white shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    {opt === 'Dalam Proses' ? 'Proses' : opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Kondisi Fisik 3-segment pill */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-600">Kondisi Fisik:</span>
                            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-3xs">
                              {(['Baik', 'Terlantar', 'Tidak Terawat'] as const).map((opt) => {
                                const current = house.buildingCondition || (house.status === 'Empty' ? 'Tidak Terawat' : 'Baik');
                                const active = current === opt;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => {
                                      handleUpdateHouse(house.id, { buildingCondition: opt });
                                      toast.success(`Kondisi No. ${house.number}: ${opt}`);
                                    }}
                                    className={`flex-1 py-1 rounded text-[9px] font-extrabold transition-all ${
                                      active
                                        ? opt === 'Baik'
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : opt === 'Terlantar'
                                          ? 'bg-amber-500 text-white shadow-xs'
                                          : 'bg-rose-500 text-white shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    {opt === 'Tidak Terawat' ? 'Rusak' : opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Row 3: Renovasi toggle & quick note */}
                        <div className="grid grid-cols-12 gap-2 pt-1 border-t border-amber-200/50 items-center">
                          <button
                            type="button"
                            onClick={() => {
                              const next = !house.hasStructuralModification;
                              handleUpdateHouse(house.id, { hasStructuralModification: next });
                              toast.info(`Bentuk unit ${house.number}: ${next ? 'Renovasi / Tambah Ruang' : 'Standar Asli'}`);
                            }}
                            className={`col-span-4 py-1.5 px-2 rounded-lg text-[9.5px] font-bold border transition-colors shadow-3xs flex items-center justify-center gap-1 ${
                              house.hasStructuralModification
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            <span>{house.hasStructuralModification ? '🔨 Renovasi' : '📐 Standar'}</span>
                          </button>
                          <div className="col-span-8">
                            <input
                              type="text"
                              defaultValue={house.specialNotes || ''}
                              placeholder="Catatan verifikasi sensus..."
                              onBlur={(e) => {
                                const val = e.target.value.trim();
                                if (val !== (house.specialNotes || '')) {
                                  handleUpdateHouse(house.id, { specialNotes: val });
                                  toast.success(`Catatan sensus No. ${house.number} tersimpan`);
                                }
                              }}
                              className="w-full bg-white border border-amber-200 focus:border-amber-400 text-slate-700 text-[10px] rounded-lg px-2 py-1 outline-none shadow-3xs"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Card Section 2: Financial statuses & quick parameters */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-50/60 p-3 rounded-xl border border-slate-150 shadow-3xs">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 pr-1.5 my-0.5">
                            <span className="flex items-center gap-1 font-semibold text-slate-400 uppercase tracking-wide"><Coins size={10} /> Iuran Sampah:</span>
                            <PaymentIndicator status={statusSampah} service="Sampah" />
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 pl-2 my-0.5 border-l border-slate-200">
                            <span className="flex items-center gap-1 font-semibold text-slate-400 uppercase tracking-wide"><Coins size={10} /> Air Bersih:</span>
                            <PaymentIndicator status={statusAir} service="Air" />
                          </div>
                          
                          <div className="col-span-2 pt-2 border-t border-dashed border-slate-200/80 flex items-center justify-between text-[10px] font-bold text-slate-550">
                            <span className="font-extrabold uppercase tracking-wide">Tunggakan Iuran:</span>
                            {arrears.length > 0 ? (
                              <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-605 font-extrabold rounded-lg flex items-center gap-1">
                                <Coins size={9} />
                                <span>{arrears.length} Bulan</span>
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-semibold uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle2 size={11} /> LUNAS
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Section 3: Document Status Settings & Verification quick triggers */}
                        <div className="flex flex-col gap-2 pt-1">
                          <div className="flex items-center gap-2">
                            {/* SPPT toggle */}
                            <button 
                              onClick={() => {
                                const newStatus = house.pbbStatus === 'Sudah Diambil' ? 'Belum Diambil' : 'Sudah Diambil';
                                const year = house.pbbYear || new Date().getFullYear().toString();
                                handleUpdateHouse(house.id, { pbbStatus: newStatus, pbbYear: year });
                                toast.success(`Administrasi SPPT PBB No. ${house.number} diubah ke: ${newStatus}`);
                              }}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-semibold border transition-colors shadow-3xs ${
                                house.pbbStatus === 'Sudah Diambil' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                  : 'bg-amber-50 text-amber-700 border-amber-150'
                              }`}
                            >
                              <FileText size={11} className="stroke-[2.5]" />
                              <span>PBB: {house.pbbStatus === 'Sudah Diambil' ? 'Diambil' : 'Belum Ditagih'}</span>
                            </button>

                            {/* Kepemilikan Selector */}
                            <div className="flex-1 relative">
                              <select
                                value={house.residenceType || 'Tetap'}
                                onChange={(e) => {
                                  const newType = e.target.value as any;
                                  const updates: any = { residenceType: newType };
                                  const existingSk = (house.ownerName && house.ownerName.trim() !== '' && house.ownerName !== '-')
                                    ? house.ownerName.trim()
                                    : house.headOfFamily;
                                  if (existingSk && (!house.ownerName || house.ownerName === '-')) {
                                    updates.ownerName = existingSk;
                                  }
                                  if (newType === 'Sewa' && (!house.ownerRelationship || house.ownerRelationship === 'Diri Sendiri')) {
                                    updates.ownerRelationship = 'Penyewa';
                                  } else if (newType === 'Rumah Keluarga' && (!house.ownerRelationship || house.ownerRelationship === 'Diri Sendiri' || house.ownerRelationship === 'Penyewa')) {
                                    updates.ownerRelationship = 'Saudara / Kerabat';
                                  } else if (newType === 'Tetap' && house.ownerRelationship === 'Penyewa') {
                                    updates.ownerRelationship = 'Diri Sendiri';
                                  }
                                  handleUpdateHouse(house.id, updates);
                                  toast.info(`Status Kepenghunian diset ke ${newType} (Pemilik SK: ${existingSk || '-'})`);
                                }}
                                className="w-full appearance-none bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-[10px] rounded-xl px-2.5 py-2 pr-6 outline-none cursor-pointer shadow-3xs"
                              >
                                <option value="Tetap">🏡 Pribadi</option>
                                <option value="Sewa">🔑 Sewa</option>
                                <option value="Rumah Keluarga">👨‍👩‍👦 Keluarga</option>
                              </select>
                              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 stroke-[2.5]" />
                            </div>
                          </div>

                          {/* Mobile quick-verify command node */}
                          <button 
                            onClick={async () => {
                              const nextState = !house.isVerified;
                              await handleUpdateHouse(house.id, { isVerified: nextState });
                              if (nextState) {
                                toast.success(`Warga ${house.headOfFamily || 'Rumah'} berhasil diverifikasi resmi!`);
                              } else {
                                toast.info(`Status verifikasi ${house.headOfFamily || 'Rumah'} dibatalkan.`);
                              }
                            }}
                            className={`w-full py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-wider border transition-colors flex items-center justify-center gap-1.5 shadow-3xs ${
                              house.isVerified 
                                ? 'bg-blue-50/50 text-blue-700 border-blue-200/50 hover:bg-blue-105' 
                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {house.isVerified ? (
                              <>
                                <ShieldCheck size={11} className="text-blue-600 fill-blue-50 stroke-[2.5]" />
                                <span>Terverifikasi RT02 (Klik Batalkan)</span>
                              </>
                            ) : (
                              <>
                                <ShieldAlert size={11} className="text-slate-400 stroke-[2]" />
                                <span>Klik untuk Verifikasi Resmi RT</span>
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}

                    {/* Card Section 4: Contact & Operations Panel */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="text-[10px] font-mono font-bold text-slate-500 flex items-center gap-1">
                        {isValidWhatsAppNumber(house.phone) ? (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Phone size={11} className="text-indigo-500" />
                            <span className="font-mono tabular-nums">{house.phone}</span>
                          </div>
                        ) : (
                          <span className="italic text-slate-400 font-sans font-medium text-[9px]">- Tidak ada no. HP -</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isValidWhatsAppNumber(house.phone) && onSendWhatsApp && (
                          <button 
                            onClick={() => onSendWhatsApp(house)}
                            className="min-h-[38px] min-w-[38px] p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl flex items-center justify-center shadow-3xs active:scale-95 touch-manipulation cursor-pointer"
                            title="WhatsApp Pemohon"
                            aria-label="Kirim pesan WhatsApp"
                          >
                            <MessageCircle size={15} className="stroke-[2.5]" />
                          </button>
                        )}
                        <button 
                          onClick={() => openDetail(house)}
                          className="min-h-[38px] px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/70 rounded-xl flex items-center justify-center gap-1 text-xs font-bold shadow-3xs active:scale-95 touch-manipulation cursor-pointer"
                        >
                          <Eye size={13} className="stroke-[2.5]" />
                          <span>Profil</span>
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(house)}
                          className="min-h-[38px] min-w-[38px] p-2 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center shadow-3xs active:scale-95 touch-manipulation cursor-pointer"
                          title="Edit Hunian"
                          aria-label="Edit data hunian"
                        >
                          <Edit2 size={13} className="stroke-[2.5]" />
                        </button>
                        <button 
                          onClick={() => handleDelete(house.id)}
                          className="min-h-[38px] min-w-[38px] p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/70 rounded-xl flex items-center justify-center shadow-3xs active:scale-95 touch-manipulation cursor-pointer"
                          title="Hapus"
                          aria-label="Hapus data hunian"
                        >
                          <Trash2 size={13} className="stroke-[2.5]" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface PaymentIndicatorProps {
  status: PaymentStatus;
  service: 'Sampah' | 'Air';
}

const PaymentIndicator: React.FC<PaymentIndicatorProps> = ({ status, service }) => {
  const isPaid = status === PaymentStatus.PAID;
  
  if (service === 'Sampah') {
    return (
      <div className={`inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-lg border leading-none text-[9.5px] font-semibold transition-colors ${
        isPaid 
          ? 'bg-emerald-50/80 text-emerald-700 border-emerald-100 shadow-3xs' 
          : 'bg-rose-50/80 text-rose-650 border-rose-100'
      }`}>
        {isPaid ? <Check size={10} className="stroke-[3]" /> : <XCircle size={10} className="stroke-[2.5]" />}
        <span>{isPaid ? 'Lunas' : 'Belum'}</span>
      </div>
    );
  } else {
    return (
      <div className={`inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-lg border leading-none text-[9.5px] font-semibold transition-colors ${
        isPaid 
          ? 'bg-sky-50/80 text-sky-700 border-sky-100 shadow-3xs' 
          : 'bg-rose-50/80 text-rose-650 border-rose-100'
      }`}>
        {isPaid ? <Check size={10} className="stroke-[3]" /> : <XCircle size={10} className="stroke-[2.5]" />}
        <span>{isPaid ? 'Lunas' : 'Belum'}</span>
      </div>
    );
  }
};
