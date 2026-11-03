import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, FileText, CheckCircle2, XCircle, AlertCircle, 
  Search, Filter, Download, Printer, Edit3, Sliders, Calendar, 
  Building2, Sparkles, RefreshCw, Check, X, Layers, ShieldCheck, 
  ArrowUpDown, ExternalLink, Info, CheckCheck, Landmark
} from 'lucide-react';
import { House, PdfConfig } from '../../types';
import { Modal } from '../ui/Modal';
import { toast } from 'sonner';
import { updateHouseData } from '../../services/databaseService';
import { naturalSortBlockAndNumber, exportPBBReportExcel } from '../../services/excelService';
import { generatePBBReportPDF, generatePBBRecapPDF, PBBRecapPrintOptions } from '../../services/pdfService';
import { useConfirm } from '../../context/ConfirmContext';

interface PBBManagerProps {
  houses: House[];
  pdfConfig?: PdfConfig;
}

export const PBBManager: React.FC<PBBManagerProps> = ({ houses = [], pdfConfig }) => {
  const confirm = useConfirm();

  // Selected Tax Year
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBlock, setFilterBlock] = useState('ALL');
  const [filterProofAtRt, setFilterProofAtRt] = useState<'ALL' | 'Ada di RT' | 'Belum Ada'>('ALL');
  const [filterPayment, setFilterPayment] = useState<'ALL' | 'Lunas' | 'Belum Lunas'>('ALL');
  const [filterSpptAtRt, setFilterSpptAtRt] = useState<'ALL' | 'Ada di RT' | 'Belum Ada'>('ALL');
  const [filterTaken, setFilterTaken] = useState<'ALL' | 'Sudah Diambil' | 'Belum Diambil'>('ALL');

  // Sorting
  const [sortBy, setSortBy] = useState<'unit' | 'name' | 'nop' | 'status'>('unit');
  const [sortAsc, setSortAsc] = useState(true);

  // Modals
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printColumns, setPrintColumns] = useState({
    unit: true,
    headOfFamily: true,
    nop: true,
    taxpayerName: true,
    proofAtRt: true,
    paymentStatus: true,
    paidDate: true,
    spptAtRt: true,
    takenStatus: true,
    signatureCol: false,
    notes: false
  });
  const [printOrientation, setPrintOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [printShowStatsBar, setPrintShowStatsBar] = useState(true);
  const [printGroupByBlock, setPrintGroupByBlock] = useState(true);
  const [printShowSignature, setPrintShowSignature] = useState(true);
  const [printFilterScope, setPrintFilterScope] = useState<'filtered' | 'all'>('filtered');

  const handleExecutePrint = () => {
    const targetHouses = printFilterScope === 'filtered' ? filteredHouses : houses;
    if (targetHouses.length === 0) {
      toast.error('Tidak ada data warga yang akan dicetak.');
      return;
    }

    const options: PBBRecapPrintOptions = {
      orientation: printOrientation,
      columns: printColumns,
      showStatsBar: printShowStatsBar,
      groupByBlock: printGroupByBlock,
      showSignatureBlock: printShowSignature
    };

    setIsPrintModalOpen(false);
    toast.promise(generatePBBRecapPDF(targetHouses, selectedYear, pdfConfig, options), {
      loading: 'Menyusun laporan PDF Rekapitulasi sesuai pengaturan...',
      success: 'Laporan Rekapitulasi PBB PDF siap diunduh!',
      error: 'Gagal mencetak PDF'
    });
  };
  const [isSaving, setIsSaving] = useState(false);

  // Edit Form State
  const [formData, setFormData] = useState({
    pbbNop: '',
    pbbTaxpayerName: '',
    pbbProofAtRt: 'Belum Ada' as 'Ada di RT' | 'Belum Ada',
    pbbPaymentStatus: 'Belum Lunas' as 'Lunas' | 'Belum Lunas',
    pbbPaidDate: '',
    pbbAmount: 0,
    pbbSpptAtRt: 'Belum Ada' as 'Ada di RT' | 'Belum Ada',
    pbbStatus: 'Belum Diambil' as 'Sudah Diambil' | 'Belum Diambil',
    pbbPaymentProofUrl: '',
    pbbNotes: '',
    pbbYear: currentYear
  });

  // Batch Form State
  const [batchBlock, setBatchBlock] = useState('ALL');
  const [batchAction, setBatchAction] = useState<'proof_in_rt' | 'sppt_in_rt' | 'mark_paid' | 'mark_taken'>('proof_in_rt');

  // Blocks Set
  const blocks = useMemo(() => {
    const set = new Set<string>();
    houses.forEach(h => { if (h.block) set.add(h.block); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [houses]);

  // Global Statistics
  const stats = useMemo(() => {
    const total = houses.length;
    const proofAtRt = houses.filter(h => h.pbbProofAtRt === 'Ada di RT').length;
    const paid = houses.filter(h => h.pbbPaymentStatus === 'Lunas').length;
    const unpaid = total - paid;
    const spptAtRt = houses.filter(h => h.pbbSpptAtRt === 'Ada di RT').length;
    const taken = houses.filter(h => h.pbbStatus === 'Sudah Diambil').length;
    const withNop = houses.filter(h => !!h.pbbNop && h.pbbNop.trim().length > 0).length;
    const totalAmount = houses.reduce((acc, h) => acc + (h.pbbAmount || 0), 0);
    const paidAmount = houses.filter(h => h.pbbPaymentStatus === 'Lunas').reduce((acc, h) => acc + (h.pbbAmount || 0), 0);

    const pctPaid = total > 0 ? Math.round((paid / total) * 100) : 0;
    const pctProof = total > 0 ? Math.round((proofAtRt / total) * 100) : 0;
    const pctSppt = total > 0 ? Math.round((spptAtRt / total) * 100) : 0;
    const pctTaken = total > 0 ? Math.round((taken / total) * 100) : 0;

    return {
      total, proofAtRt, paid, unpaid, spptAtRt, taken, withNop,
      totalAmount, paidAmount, pctPaid, pctProof, pctSppt, pctTaken
    };
  }, [houses]);

  // Filtered & Sorted Houses
  const filteredHouses = useMemo(() => {
    let result = [...houses];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(h => 
        (h.block && h.block.toLowerCase().includes(q)) ||
        (h.number && h.number.toLowerCase().includes(q)) ||
        (`${h.block}-${h.number}`.toLowerCase().includes(q)) ||
        (h.headOfFamily && h.headOfFamily.toLowerCase().includes(q)) ||
        (h.pbbNop && h.pbbNop.toLowerCase().includes(q)) ||
        (h.pbbTaxpayerName && h.pbbTaxpayerName.toLowerCase().includes(q)) ||
        (h.pbbNotes && h.pbbNotes.toLowerCase().includes(q))
      );
    }

    // Filter Block
    if (filterBlock !== 'ALL') {
      result = result.filter(h => h.block === filterBlock);
    }

    // Filter Bukti di RT
    if (filterProofAtRt !== 'ALL') {
      result = result.filter(h => (h.pbbProofAtRt || 'Belum Ada') === filterProofAtRt);
    }

    // Filter Payment Status
    if (filterPayment !== 'ALL') {
      result = result.filter(h => (h.pbbPaymentStatus || 'Belum Lunas') === filterPayment);
    }

    // Filter SPPT Fisik di RT
    if (filterSpptAtRt !== 'ALL') {
      result = result.filter(h => (h.pbbSpptAtRt || 'Belum Ada') === filterSpptAtRt);
    }

    // Filter Pengambilan Warga
    if (filterTaken !== 'ALL') {
      result = result.filter(h => (h.pbbStatus || 'Belum Diambil') === filterTaken);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'unit') {
        const diff = naturalSortBlockAndNumber(a.block, a.number, b.block, b.number);
        return sortAsc ? diff : -diff;
      }
      if (sortBy === 'name') {
        const nameA = a.headOfFamily || '';
        const nameB = b.headOfFamily || '';
        return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (sortBy === 'nop') {
        const nopA = a.pbbNop || '';
        const nopB = b.pbbNop || '';
        return sortAsc ? nopA.localeCompare(nopB) : nopB.localeCompare(nopA);
      }
      if (sortBy === 'status') {
        const statA = a.pbbPaymentStatus === 'Lunas' ? 1 : 0;
        const statB = b.pbbPaymentStatus === 'Lunas' ? 1 : 0;
        return sortAsc ? statB - statA : statA - statB;
      }
      return 0;
    });

    return result;
  }, [houses, searchQuery, filterBlock, filterProofAtRt, filterPayment, filterSpptAtRt, filterTaken, sortBy, sortAsc]);

  // 1-Click Toggle: Bukti PBB di Tangan RT
  const handleToggleProofAtRt = async (house: House, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const current = house.pbbProofAtRt === 'Ada di RT';
    const nextStatus = current ? 'Belum Ada' : 'Ada di RT';

    try {
      await updateHouseData(house.id, {
        pbbProofAtRt: nextStatus,
        pbbYear: selectedYear
      });
      toast.success(`Unit ${house.block}-${house.number}: Bukti PBB ditandai ${nextStatus}`);
    } catch {
      toast.error('Gagal memperbarui status bukti PBB');
    }
  };

  // 1-Click Toggle: Status Pembayaran Lunas
  const handleTogglePaymentStatus = async (house: House, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const current = house.pbbPaymentStatus === 'Lunas';
    const nextStatus = current ? 'Belum Lunas' : 'Lunas';
    const paidDate = nextStatus === 'Lunas' ? (house.pbbPaidDate || new Date().toISOString().split('T')[0]) : '';

    try {
      await updateHouseData(house.id, {
        pbbPaymentStatus: nextStatus,
        pbbPaidDate: paidDate,
        pbbYear: selectedYear
      });
      toast.success(`Unit ${house.block}-${house.number}: Pembayaran PBB ${nextStatus}`);
    } catch {
      toast.error('Gagal memperbarui status pembayaran PBB');
    }
  };

  // 1-Click Toggle: Lembar SPPT Fisik Masuk RT
  const handleToggleSpptAtRt = async (house: House, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const current = house.pbbSpptAtRt === 'Ada di RT';
    const nextStatus = current ? 'Belum Ada' : 'Ada di RT';

    try {
      await updateHouseData(house.id, {
        pbbSpptAtRt: nextStatus,
        pbbYear: selectedYear
      });
      toast.success(`Unit ${house.block}-${house.number}: Lembar SPPT fisik ${nextStatus}`);
    } catch {
      toast.error('Gagal memperbarui status SPPT di RT');
    }
  };

  // 1-Click Toggle: Status Pengambilan oleh Warga
  const handleToggleTaken = async (house: House, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const current = house.pbbStatus === 'Sudah Diambil';
    const nextStatus = current ? 'Belum Diambil' : 'Sudah Diambil';

    try {
      await updateHouseData(house.id, {
        pbbStatus: nextStatus,
        pbbYear: selectedYear
      });
      toast.success(`Unit ${house.block}-${house.number}: Pengambilan SPPT ${nextStatus}`);
    } catch {
      toast.error('Gagal memperbarui status pengambilan SPPT');
    }
  };

  // Open Edit Detail Modal
  const handleOpenDetailModal = (house: House) => {
    setSelectedHouse(house);
    setFormData({
      pbbNop: house.pbbNop || '',
      pbbTaxpayerName: house.pbbTaxpayerName || house.headOfFamily || '',
      pbbProofAtRt: house.pbbProofAtRt || 'Belum Ada',
      pbbPaymentStatus: house.pbbPaymentStatus || 'Belum Lunas',
      pbbPaidDate: house.pbbPaidDate || '',
      pbbAmount: house.pbbAmount || 0,
      pbbSpptAtRt: house.pbbSpptAtRt || 'Belum Ada',
      pbbStatus: house.pbbStatus || 'Belum Diambil',
      pbbPaymentProofUrl: house.pbbPaymentProofUrl || '',
      pbbNotes: house.pbbNotes || '',
      pbbYear: house.pbbYear || selectedYear
    });
    setIsDetailModalOpen(true);
  };

  // Save Detail Form
  const handleSaveDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHouse) return;

    setIsSaving(true);
    try {
      await updateHouseData(selectedHouse.id, {
        pbbNop: formData.pbbNop.trim(),
        pbbTaxpayerName: formData.pbbTaxpayerName.trim(),
        pbbProofAtRt: formData.pbbProofAtRt,
        pbbPaymentStatus: formData.pbbPaymentStatus,
        pbbPaidDate: formData.pbbPaidDate,
        pbbAmount: Number(formData.pbbAmount) || 0,
        pbbSpptAtRt: formData.pbbSpptAtRt,
        pbbStatus: formData.pbbStatus,
        pbbPaymentProofUrl: formData.pbbPaymentProofUrl.trim(),
        pbbNotes: formData.pbbNotes.trim(),
        pbbYear: selectedYear
      });
      toast.success(`Data PBB Unit ${selectedHouse.block}-${selectedHouse.number} berhasil diperbarui!`);
      setIsDetailModalOpen(false);
      setSelectedHouse(null);
    } catch {
      toast.error('Gagal menyimpan data PBB');
    } finally {
      setIsSaving(false);
    }
  };

  // Execute Batch Update
  const handleExecuteBatch = async () => {
    const targetHouses = batchBlock === 'ALL' 
      ? houses 
      : houses.filter(h => h.block === batchBlock);

    if (targetHouses.length === 0) {
      toast.error('Tidak ada unit rumah yang terpilih untuk blok ini.');
      return;
    }

    const actionLabels: Record<string, string> = {
      proof_in_rt: 'Tandai Bukti PBB Ada di Tangan RT',
      sppt_in_rt: 'Tandai Lembar Fisik SPPT Ada di RT',
      mark_paid: 'Tandai Pembayaran Lunas',
      mark_taken: 'Tandai SPPT Sudah Diambil Warga'
    };

    const isConfirmed = await confirm({
      title: 'Konfirmasi Aksi Massal PBB',
      message: `Apakah Anda yakin ingin menerapkan aksi "${actionLabels[batchAction]}" pada ${targetHouses.length} unit rumah di ${batchBlock === 'ALL' ? 'Semua Blok' : `Blok ${batchBlock}`}?`,
      confirmLabel: 'Ya, Terapkan Sekarang',
      isDanger: false
    });

    if (!isConfirmed) return;

    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      for (const h of targetHouses) {
        const updatePayload: Partial<House> = { pbbYear: selectedYear };
        if (batchAction === 'proof_in_rt') updatePayload.pbbProofAtRt = 'Ada di RT';
        if (batchAction === 'sppt_in_rt') updatePayload.pbbSpptAtRt = 'Ada di RT';
        if (batchAction === 'mark_paid') {
          updatePayload.pbbPaymentStatus = 'Lunas';
          if (!h.pbbPaidDate) updatePayload.pbbPaidDate = today;
        }
        if (batchAction === 'mark_taken') updatePayload.pbbStatus = 'Sudah Diambil';

        await updateHouseData(h.id, updatePayload);
      }
      toast.success(`Berhasil memperbarui ${targetHouses.length} unit secara massal!`);
      setIsBatchModalOpen(false);
    } catch {
      toast.error('Terjadi kesalahan saat memproses update massal.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterBlock('ALL');
    setFilterProofAtRt('ALL');
    setFilterPayment('ALL');
    setFilterSpptAtRt('ALL');
    setFilterTaken('ALL');
  };

  const isFilterActive = searchQuery || filterBlock !== 'ALL' || filterProofAtRt !== 'ALL' || filterPayment !== 'ALL' || filterSpptAtRt !== 'ALL' || filterTaken !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Top Banner & Context */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-100/40 via-teal-50/20 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-2xs">
                <Landmark size={20} className="stroke-[2.2]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                  Pendataan SPPT Pajak Bumi & Bangunan (PBB)
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/60">
                    Tahun {selectedYear}
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Monitoring bukti fisik PBB di tangan RT, verifikasi pelunasan warga, dan administrasi penyerahan SPPT.
                </p>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Year Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
              <Calendar size={13} className="text-slate-400" />
              <span>Tahun Pajak:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent font-semibold text-slate-900 outline-none cursor-pointer"
              >
                {[2026, 2025, 2024, 2023].map(y => (
                  <option key={y} value={y.toString()}>{y}</option>
                ))}
              </select>
            </div>

            {/* Batch Action Button */}
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs active:scale-95 cursor-pointer"
            >
              <Layers size={13} />
              <span>Aksi Massal</span>
            </button>

            {/* Export Excel */}
            <button
              onClick={() => {
                toast.promise(exportPBBReportExcel(filteredHouses, selectedYear), {
                  loading: 'Menyiapkan file Excel...',
                  success: 'Laporan Excel PBB berhasil diunduh!',
                  error: 'Gagal mengunduh Excel PBB'
                });
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs shadow-2xs active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet size={13} />
              <span>Export Excel</span>
            </button>

            {/* Print PDF Recap */}
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs shadow-2xs active:scale-95 cursor-pointer"
              title="Atur Kolom & Cetak Laporan Rekapitulasi PDF"
            >
              <Printer size={13} />
              <span>Cetak Rekap PDF</span>
            </button>

            {/* Print Tanda Terima Pengambilan SPPT */}
            <button
              onClick={() => {
                toast.promise(generatePBBReportPDF(filteredHouses, selectedYear, pdfConfig), {
                  loading: 'Menyusun formulir tanda terima...',
                  success: 'Tanda Terima Pengambilan SPPT siap diunduh!',
                  error: 'Gagal mencetak PDF'
                });
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors shadow-3xs active:scale-95 cursor-pointer"
              title="Cetak Formulir Tanda Tangan Tanda Terima Pengambilan SPPT"
            >
              <FileText size={13} className="text-slate-500" />
              <span>Formulir Tanda Terima</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards / Realisasi PBB */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Total Unit Objek Pajak */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-500">Total objek</span>
            <span className="text-[11px] font-mono tabular-nums text-slate-400">100%</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 font-mono tabular-nums tracking-tight">{stats.total}</div>
          <p className="text-[11px] text-slate-500 font-normal mt-1">
            {stats.withNop} unit ber-NOP ({stats.total > 0 ? Math.round((stats.withNop / stats.total) * 100) : 0}%)
          </p>
        </div>

        {/* Bukti di Tangan RT */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-600">Bukti di tangan RT</span>
            <span className="text-[11px] font-mono tabular-nums font-semibold text-sky-700">{stats.pctProof}%</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 font-mono tabular-nums tracking-tight">
            {stats.proofAtRt} <span className="text-xs font-normal text-slate-400">/ {stats.total}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1 mt-2 overflow-hidden">
            <div className="bg-sky-600 h-full rounded-full transition-colors duration-300" style={{ width: `${stats.pctProof}%` }} />
          </div>
        </div>

        {/* Status Pelunasan Warga */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-600">Realisasi pelunasan</span>
            <span className="text-[11px] font-mono tabular-nums font-semibold text-emerald-700">{stats.pctPaid}%</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 font-mono tabular-nums tracking-tight">
            {stats.paid} <span className="text-xs font-normal text-slate-400">/ {stats.total}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1 mt-2 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full transition-colors duration-300" style={{ width: `${stats.pctPaid}%` }} />
          </div>
        </div>

        {/* Fisik SPPT di RT */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-600">Lembar SPPT di RT</span>
            <span className="text-[11px] font-mono tabular-nums text-slate-400">arsip</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 font-mono tabular-nums tracking-tight">
            {stats.spptAtRt} <span className="text-xs font-normal text-slate-400">unit</span>
          </div>
          <p className="text-[11px] text-slate-500 font-normal mt-1">
            {stats.total - stats.spptAtRt} unit belum masuk RT
          </p>
        </div>

        {/* SPPT Diambil Warga */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-600">SPPT diambil warga</span>
            <span className="text-[11px] font-mono tabular-nums font-semibold text-slate-700">{stats.pctTaken}%</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900 font-mono tabular-nums tracking-tight">
            {stats.taken} <span className="text-xs font-normal text-slate-400">unit</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1 mt-2 overflow-hidden">
            <div className="bg-slate-700 h-full rounded-full transition-colors duration-300" style={{ width: `${stats.pctTaken}%` }} />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari unit (misal C10-01), nama warga, NOP, atau nama di SPPT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Quick Filter Counts */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 shrink-0">
            <span>Menampilkan <strong>{filteredHouses.length}</strong> dari {houses.length} unit</span>
            {isFilterActive && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 transition-colors"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2 border-t border-slate-100">
          {/* Filter Blok */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Blok Wilayah</label>
            <select
              value={filterBlock}
              onChange={(e) => setFilterBlock(e.target.value)}
              className="w-full bg-slate-50 text-slate-700 font-bold text-xs rounded-xl px-2.5 py-1.5 border border-slate-200 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300"
            >
              <option value="ALL">Semua Blok ({blocks.length})</option>
              {blocks.map(b => (
                <option key={b} value={b}>Blok {b}</option>
              ))}
            </select>
          </div>

          {/* Filter Bukti di RT */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bukti di RT</label>
            <select
              value={filterProofAtRt}
              onChange={(e) => setFilterProofAtRt(e.target.value as any)}
              className="w-full bg-slate-50 text-slate-700 font-bold text-xs rounded-xl px-2.5 py-1.5 border border-slate-200 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300"
            >
              <option value="ALL">Semua Status Bukti</option>
              <option value="Ada di RT">✓ Ada di RT</option>
              <option value="Belum Ada">✗ Belum Ada di RT</option>
            </select>
          </div>

          {/* Filter Status Pembayaran */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Pembayaran</label>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value as any)}
              className="w-full bg-slate-50 text-slate-700 font-bold text-xs rounded-xl px-2.5 py-1.5 border border-slate-200 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300"
            >
              <option value="ALL">Semua Status Bayar</option>
              <option value="Lunas">✓ Lunas</option>
              <option value="Belum Lunas">✕ Belum Lunas</option>
            </select>
          </div>

          {/* Filter SPPT di RT */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lembar SPPT di RT</label>
            <select
              value={filterSpptAtRt}
              onChange={(e) => setFilterSpptAtRt(e.target.value as any)}
              className="w-full bg-slate-50 text-slate-700 font-bold text-xs rounded-xl px-2.5 py-1.5 border border-slate-200 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300"
            >
              <option value="ALL">Semua SPPT di RT</option>
              <option value="Ada di RT">Ada di RT</option>
              <option value="Belum Ada">Belum Ada</option>
            </select>
          </div>

          {/* Filter Pengambilan Warga */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pengambilan Warga</label>
            <select
              value={filterTaken}
              onChange={(e) => setFilterTaken(e.target.value as any)}
              className="w-full bg-slate-50 text-slate-700 font-bold text-xs rounded-xl px-2.5 py-1.5 border border-slate-200 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300"
            >
              <option value="ALL">Semua Status Ambil</option>
              <option value="Sudah Diambil">Sudah Diambil</option>
              <option value="Belum Diambil">Belum Diambil</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-900 text-white text-xs font-semibold">
                <th className="py-3 px-4 text-center w-12 font-medium text-slate-400">No</th>
                <th 
                  onClick={() => { setSortBy('unit'); setSortAsc(!sortAsc); }}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Unit / kavling</span>
                    <ArrowUpDown size={12} className="text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => { setSortBy('name'); setSortAsc(!sortAsc); }}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Kepala keluarga</span>
                    <ArrowUpDown size={12} className="text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => { setSortBy('nop'); setSortAsc(!sortAsc); }}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>NOP &amp; nama SPPT</span>
                    <ArrowUpDown size={12} className="text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Bukti di RT</th>
                <th 
                  onClick={() => { setSortBy('status'); setSortAsc(!sortAsc); }}
                  className="py-3 px-4 text-center cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Status bayar</span>
                    <ArrowUpDown size={12} className="text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">SPPT di RT</th>
                <th className="py-3 px-4 text-center">Ambil warga</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr></thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredHouses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={24} className="text-slate-300" />
                      <p className="font-bold text-slate-600">Tidak ada data unit yang sesuai filter</p>
                      <button
                        onClick={handleResetFilters}
                        className="text-xs font-bold text-emerald-600 hover:underline"
                      >
                        Reset semua filter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredHouses.map((house, idx) => {
                  const hasProof = house.pbbProofAtRt === 'Ada di RT';
                  const isPaid = house.pbbPaymentStatus === 'Lunas';
                  const spptInRt = house.pbbSpptAtRt === 'Ada di RT';
                  const isTaken = house.pbbStatus === 'Sudah Diambil';

                  return (
                    <tr 
                      key={house.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* No */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Unit / Blok */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md font-mono tabular-nums text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200/80">
                            {house.block}-{house.number}
                          </span>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            house.residenceType === 'Sewa'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {house.residenceType || 'Tetap'}
                          </span>
                        </div>
                      </td>

                      {/* Nama Kepala Keluarga */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{house.headOfFamily || 'Warga'}</span>
                        </div>
                        {house.phone && (
                          <span className="text-[10px] text-slate-400 font-mono">{house.phone}</span>
                        )}
                      </td>

                      {/* NOP & Nama di SPPT */}
                      <td className="py-3.5 px-4">
                        {house.pbbNop ? (
                          <div>
                            <span className="font-mono font-bold text-xs text-indigo-900 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100">
                              {house.pbbNop}
                            </span>
                            {house.pbbTaxpayerName && house.pbbTaxpayerName !== house.headOfFamily && (
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                a.n {house.pbbTaxpayerName}
                              </p>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenDetailModal(house)}
                            className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 border border-dashed border-slate-300 hover:border-indigo-400 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            + Isi NOP
                          </button>
                        )}
                      </td>

                      {/* Bukti PBB di RT (Primary Toggle) */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={(e) => handleToggleProofAtRt(house, e)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors duration-150 transition-colors duration-150 cursor-pointer ${
                            hasProof
                              ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                              : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600'
                          }`}
                          title={`Klik untuk mengubah status bukti PBB di RT (Saat ini: ${hasProof ? 'Ada di RT' : 'Belum Ada'})`}
                        >
                          {hasProof ? (
                            <>
                              <CheckCircle2 size={13} className="text-sky-600 stroke-[2.5]" />
                              <span>Ada di RT</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={13} className="text-slate-400 stroke-[2]" />
                              <span>Belum Ada</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Status Pembayaran (Secondary Toggle) */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={(e) => handleTogglePaymentStatus(house, e)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors duration-150 transition-colors duration-150 cursor-pointer ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                          title={`Klik untuk mengubah status pembayaran PBB (Saat ini: ${isPaid ? 'Lunas' : 'Belum Lunas'})`}
                        >
                          {isPaid ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span>Lunas</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              <span>Belum</span>
                            </>
                          )}
                        </button>
                        {isPaid && house.pbbPaidDate && (
                          <div className="text-[9px] text-emerald-600 font-mono font-bold mt-0.5">
                            {house.pbbPaidDate}
                          </div>
                        )}
                      </td>

                      {/* Lembar SPPT di RT */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={(e) => handleToggleSpptAtRt(house, e)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors active:scale-95 cursor-pointer ${
                            spptInRt
                              ? 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                              : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                          }`}
                          title={`Status lembar fisik SPPT di pengurus RT: ${spptInRt ? 'Ada di RT' : 'Belum Ada'}`}
                        >
                          <span>{spptInRt ? '✓ Ada di RT' : 'Belum Ada'}</span>
                        </button>
                      </td>

                      {/* Pengambilan Warga */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={(e) => handleToggleTaken(house, e)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors active:scale-95 cursor-pointer ${
                            isTaken
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                          title={`Status fisik SPPT diambil oleh warga: ${isTaken ? 'Sudah Diambil' : 'Belum Diambil'}`}
                        >
                          <span>{isTaken ? '✓ Diambil' : 'Belum'}</span>
                        </button>
                      </td>

                      {/* Aksi Edit Detail */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleOpenDetailModal(house)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Detail Objek PBB"
                        >
                          <Edit3 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL: Edit Data Objek PBB */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedHouse ? `Detail Objek PBB: Blok ${selectedHouse.block}-${selectedHouse.number}` : 'Detail Objek PBB'}
        maxWidth="max-w-2xl"
      >
        {selectedHouse && (
          <form onSubmit={handleSaveDetail} className="space-y-4">
            {/* Resident Info Summary */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Kepala Keluarga / Penghuni</span>
                <p className="font-extrabold text-slate-900 text-sm">{selectedHouse.headOfFamily || 'Warga'}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Unit / Kavling</span>
                <p className="font-semibold text-slate-900 text-sm font-mono">{selectedHouse.block}-{selectedHouse.number}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* NOP */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Objek Pajak (NOP)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 72.71.010.001.002-0003.0"
                  value={formData.pbbNop}
                  onChange={(e) => setFormData({ ...formData, pbbNop: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs font-mono font-bold rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">18 Digit NOP tertera pada lembar SPPT PBB.</p>
              </div>

              {/* Nama Wajib Pajak di SPPT */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Wajib Pajak pada SPPT
                </label>
                <input
                  type="text"
                  placeholder="Nama pemilik/WP tertera di surat..."
                  value={formData.pbbTaxpayerName}
                  onChange={(e) => setFormData({ ...formData, pbbTaxpayerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs font-semibold rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Bisa berbeda jika belum balik nama dari developer/pemilik lama.</p>
              </div>
            </div>

            {/* Core Status Section: Bukti di RT & Status Bayar */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>Pencatatan Administrasi &amp; Bukti PBB di RT</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bukti PBB di Tangan RT */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Bukti PBB Sudah di Tangan RT?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pbbProofAtRt: 'Ada di RT' })}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                        formData.pbbProofAtRt === 'Ada di RT'
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Check size={13} />
                      <span>Ada di RT</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pbbProofAtRt: 'Belum Ada' })}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                        formData.pbbProofAtRt === 'Belum Ada'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <X size={13} />
                      <span>Belum Ada</span>
                    </button>
                  </div>
                </div>

                {/* Status Pembayaran */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Status Pembayaran PBB
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ 
                        ...formData, 
                        pbbPaymentStatus: 'Lunas',
                        pbbPaidDate: formData.pbbPaidDate || new Date().toISOString().split('T')[0]
                      })}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                        formData.pbbPaymentStatus === 'Lunas'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle2 size={13} />
                      <span>Lunas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pbbPaymentStatus: 'Belum Lunas' })}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                        formData.pbbPaymentStatus === 'Belum Lunas'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <XCircle size={13} />
                      <span>Belum Lunas</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tanggal Bayar & Nominal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-emerald-100/60">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Pelunasan
                  </label>
                  <input
                    type="date"
                    value={formData.pbbPaidDate}
                    onChange={(e) => setFormData({ ...formData, pbbPaidDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white text-xs font-semibold rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nominal Tagihan PBB (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="Contoh: 150000"
                    value={formData.pbbAmount || ''}
                    onChange={(e) => setFormData({ ...formData, pbbAmount: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white text-xs font-mono font-bold rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Status Fisik SPPT & Pengambilan Warga */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lembar SPPT Fisik di Pengurus RT
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, pbbSpptAtRt: 'Ada di RT' })}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      formData.pbbSpptAtRt === 'Ada di RT'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Ada di RT
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, pbbSpptAtRt: 'Belum Ada' })}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      formData.pbbSpptAtRt === 'Belum Ada'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Belum Ada
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pengambilan Lembar oleh Warga
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, pbbStatus: 'Sudah Diambil' })}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      formData.pbbStatus === 'Sudah Diambil'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Sudah Diambil
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, pbbStatus: 'Belum Diambil' })}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      formData.pbbStatus === 'Belum Diambil'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Belum Diambil
                  </button>
                </div>
              </div>
            </div>

            {/* Bukti Bayar / Foto Struk URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Link / URL Foto Bukti Pembayaran (Opsional)
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/... atau URL bukti transfer"
                value={formData.pbbPaymentProofUrl}
                onChange={(e) => setFormData({ ...formData, pbbPaymentProofUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs font-mono rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Catatan Khusus */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Khusus PBB
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Tanah kosong belum dibangun, sertifikat ganda, SPPT dititip ke tetangga..."
                value={formData.pbbNotes}
                onChange={(e) => setFormData({ ...formData, pbbNotes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs font-medium rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-colors shadow-xs shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Data PBB'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* BATCH MODAL: Aksi Massal */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title="Aksi Massal Pendataan PBB"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Perbarui status PBB untuk banyak unit sekaligus berdasarkan Blok wilayah (misal saat lembar SPPT dari Kelurahan tiba atau saat verifikasi kolektif).
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Blok Target</label>
            <select
              value={batchBlock}
              onChange={(e) => setBatchBlock(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 font-bold text-xs rounded-xl px-3 py-2 border border-slate-200 outline-none"
            >
              <option value="ALL">Semua Blok ({houses.length} unit)</option>
              {blocks.map(b => (
                <option key={b} value={b}>
                  Blok {b} ({houses.filter(h => h.block === b).length} unit)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Aksi yang Ingin Diterapkan</label>
            <div className="space-y-2">
              {[
                { id: 'proof_in_rt', label: 'Tandai Bukti PBB Ada di Tangan RT', desc: 'Set status pbbProofAtRt = "Ada di RT"' },
                { id: 'sppt_in_rt', label: 'Tandai Lembar SPPT Fisik Masuk ke RT', desc: 'Set status pbbSpptAtRt = "Ada di RT"' },
                { id: 'mark_paid', label: 'Tandai Status Pembayaran Lunas', desc: 'Set status pbbPaymentStatus = "Lunas" (Tgl bayar hari ini)' },
                { id: 'mark_taken', label: 'Tandai Lembar SPPT Sudah Diambil Warga', desc: 'Set status pbbStatus = "Sudah Diambil"' },
              ].map(opt => (
                <label 
                  key={opt.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    batchAction === opt.id 
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="batchAction"
                    checked={batchAction === opt.id}
                    onChange={() => setBatchAction(opt.id as any)}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-extrabold block">{opt.label}</span>
                    <span className="text-[11px] text-slate-500 font-normal">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExecuteBatch}
              disabled={isSaving}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl transition-colors shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Memproses...' : 'Terapkan Aksi Massal'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Pengaturan Cetak Rekapitulasi PDF */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Pengaturan Cetak Rekapitulasi PBB"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-slate-700">
          {/* Header description with badge */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
              <Printer size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Kustomisasi Dokumen Rekapitulasi SPPT PBB Tahun {selectedYear}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pilih kolom tabel yang ingin dicetak, orientasi kertas, dan opsi kelengkapan administrasi kop surat resmi.
              </p>
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700">Pilihan Cepat (Preset):</span>
              <button 
                type="button"
                onClick={() => setPrintColumns({
                  unit: true, headOfFamily: true, nop: true, taxpayerName: true,
                  proofAtRt: true, paymentStatus: true, paidDate: true, spptAtRt: true,
                  takenStatus: true, signatureCol: true, notes: true
                })}
                className="text-[11px] text-indigo-600 hover:text-indigo-700 font-bold hover:underline cursor-pointer"
              >
                Centang Semua Kolom
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPrintColumns({
                    unit: true, headOfFamily: true, nop: true, taxpayerName: true,
                    proofAtRt: true, paymentStatus: true, paidDate: true, spptAtRt: true,
                    takenStatus: true, signatureCol: false, notes: false
                  });
                  setPrintOrientation('landscape');
                }}
                className="p-2.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">1. Standar Lengkap</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Semua data operasional PBB (Lanskap)</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrintColumns({
                    unit: true, headOfFamily: true, nop: true, taxpayerName: false,
                    proofAtRt: false, paymentStatus: true, paidDate: false, spptAtRt: true,
                    takenStatus: true, signatureCol: true, notes: false
                  });
                  setPrintOrientation('landscape');
                }}
                className="p-2.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">2. Lembar Tanda Terima</p>
                <p className="text-[10px] text-slate-400 mt-0.5">+ Kolom paraf penyerahan warga</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrintColumns({
                    unit: true, headOfFamily: true, nop: true, taxpayerName: false,
                    proofAtRt: true, paymentStatus: true, paidDate: true, spptAtRt: false,
                    takenStatus: false, signatureCol: false, notes: false
                  });
                  setPrintOrientation('portrait');
                }}
                className="p-2.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">3. Rekap Pelunasan</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Fokus bukti setor pajak (Potret)</p>
              </button>
            </div>
          </div>

          {/* Kolom Tabel yang Ditampilkan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Kolom Tabel yang Dimunculkan:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'unit', label: 'Unit / Blok Rumah', locked: true },
                { id: 'headOfFamily', label: 'Nama Kepala Keluarga' },
                { id: 'nop', label: 'Nomor Objek Pajak (NOP)' },
                { id: 'taxpayerName', label: 'Nama WP di Lembar SPPT' },
                { id: 'proofAtRt', label: 'Bukti PBB di Tangan RT' },
                { id: 'paymentStatus', label: 'Status Pelunasan (Lunas/Belum)' },
                { id: 'paidDate', label: 'Tanggal Pelunasan' },
                { id: 'spptAtRt', label: 'Lembar SPPT di RT' },
                { id: 'takenStatus', label: 'Pengambilan oleh Warga' },
                { id: 'signatureCol', label: 'Kolom Paraf / Tanda Tangan' },
                { id: 'notes', label: 'Catatan / Keterangan' }
              ].map(col => {
                const isChecked = col.locked ? true : (printColumns as any)[col.id];
                return (
                  <label 
                    key={col.id} 
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium cursor-pointer transition-colors select-none ${
                      isChecked 
                        ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900 font-bold' 
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <input 
                      type="checkbox"
                      disabled={col.locked}
                      checked={isChecked}
                      onChange={(e) => {
                        if (!col.locked) {
                          setPrintColumns(prev => ({ ...prev, [col.id]: e.target.checked }));
                        }
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span className="truncate">{col.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Layout & Pengaturan Dokumen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            {/* Orientasi Kertas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Orientasi Kertas:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPrintOrientation('landscape')}
                  className={`p-2 rounded-xl border text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    printOrientation === 'landscape'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-3.5 h-2.5 border-2 border-current rounded-xs inline-block" />
                  <span>Lanskap (Mendatar)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintOrientation('portrait')}
                  className={`p-2 rounded-xl border text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    printOrientation === 'portrait'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2.5 h-3.5 border-2 border-current rounded-xs inline-block" />
                  <span>Potret (Tegak)</span>
                </button>
              </div>
            </div>

            {/* Cakupan Data */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Cakupan Data yang Dicetak:
              </label>
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="printFilterScope"
                    checked={printFilterScope === 'filtered'}
                    onChange={() => setPrintFilterScope('filtered')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Data filter aktif saat ini (<strong>{filteredHouses.length}</strong> unit)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="printFilterScope"
                    checked={printFilterScope === 'all'}
                    onChange={() => setPrintFilterScope('all')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Seluruh data rumah RT (<strong>{houses.length}</strong> unit)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Elemen Pendukung Laporan */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Elemen Pendukung:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={printShowStatsBar}
                  onChange={(e) => setPrintShowStatsBar(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Ringkasan Statistik (KPI)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={printGroupByBlock}
                  onChange={(e) => setPrintGroupByBlock(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Grup per Blok Wilayah</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={printShowSignature}
                  onChange={(e) => setPrintShowSignature(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Tanda Tangan &amp; Cap RT</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExecutePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-2xs active:scale-95 cursor-pointer"
            >
              <Printer size={14} />
              <span>Cetak &amp; Unduh PDF</span>
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
