import React, { useState, useEffect, useMemo } from 'react';
import { 
  Gift, Package, Calendar, Users, CheckCircle2, 
  Clock, Search, Plus, Filter, Download, Printer, ArrowLeft,
  Share2, Eye, Edit2, Trash2, X, RefreshCw, AlertTriangle, 
  Building2, CheckSquare, ChevronRight, Phone, ArrowRight, UserCheck, 
  Info, Sparkles, Check, Send, AlertCircle, ShoppingBag
} from 'lucide-react';
import { SocialAidItem, SocialAidRecipient, House, PdfConfig } from '../../types';
import { 
  subscribeToSocialAid, 
  addSocialAidToDb, 
  updateSocialAidInDb, 
  deleteSocialAidFromDb,
  toggleRecipientReceiptStatus 
} from '../../services/databaseService';
import { generateSocialAidHandoverPDF } from '../../services/pdfService';
import { openWhatsApp } from '../../services/whatsappService';
import { toast } from 'sonner';
import { useConfirm } from '../../context/ConfirmContext';
import { motion, AnimatePresence } from 'motion/react';

interface SocialAidManagerProps {
  houses: House[];
  pdfConfig?: PdfConfig;
}

const CATEGORIES = [
  'Sembako Murah Pemda',
  'Beras Pangan Bulog',
  'BLT / Bantuan Tunai',
  'Nutrisi Balita & Lansia',
  'Bantuan CSR & Donatur',
  'Lainnya'
] as const;

export const SocialAidManager: React.FC<SocialAidManagerProps> = ({ houses, pdfConfig }) => {
  const confirm = useConfirm();
  const [aidPrograms, setAidPrograms] = useState<SocialAidItem[]>([]);
  
  // Navigation View State: 'list' | 'detail' | 'form' (FULL VIEW - NO POPUP)
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'form'>('list');
  const [selectedAidId, setSelectedAidId] = useState<string | null>(null);
  const [editingAidId, setEditingAidId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'sembako' | 'beras'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'pending' | 'received'>('all');
  const [recipientSearchQuery, setRecipientSearchQuery] = useState('');

  // Form State for Create / Edit Program
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<typeof CATEGORIES[number]>('Sembako Murah Pemda');
  const [formSource, setFormSource] = useState('Dinas Perdagangan Kota Palu / Kelurahan Tondo');
  const [formTotalQuota, setFormTotalQuota] = useState(25);
  const [formUnit, setFormUnit] = useState('Paket Sembako');
  const [formDistributionDate, setFormDistributionDate] = useState(new Date().toISOString().slice(0, 10));
  const [formNotes, setFormNotes] = useState('');
  const [selectedHouseIds, setSelectedHouseIds] = useState<string[]>([]);
  const [blockFilter, setBlockFilter] = useState('all');

  // Inline recipient handover input state
  const [inlineHandoverHouseId, setInlineHandoverHouseId] = useState<string | null>(null);
  const [inlineHandoverName, setInlineHandoverName] = useState('');

  // Real-time subscription
  useEffect(() => {
    const unsub = subscribeToSocialAid(setAidPrograms);
    return () => unsub();
  }, []);

  // Sorted occupied houses with natural block & number ordering
  const sortedHouses = useMemo(() => {
    return [...houses]
      .filter(h => h.status === 'Occupied')
      .sort((a, b) => {
        const parseCode = (str?: string) => {
          const match = (str || '').match(/([a-zA-Z]+)(\d+)/);
          if (match) return { letter: match[1], num: parseInt(match[2], 10) };
          return { letter: str || '', num: 0 };
        };
        const blockA = parseCode(a.block);
        const blockB = parseCode(b.block);
        if (blockA.letter !== blockB.letter) return blockA.letter.localeCompare(blockB.letter);
        if (blockA.num !== blockB.num) return blockA.num - blockB.num;
        return (a.number || 0) - (b.number || 0);
      });
  }, [houses]);

  // Current selected program
  const currentAid = useMemo(() => {
    if (!selectedAidId) return null;
    return aidPrograms.find(a => a.id === selectedAidId) || null;
  }, [aidPrograms, selectedAidId]);

  // Executive Metrics
  const metrics = useMemo(() => {
    const totalPrograms = aidPrograms.length;
    const totalQuotaAll = aidPrograms.reduce((acc, a) => acc + (a.totalQuota || (a.recipients?.length || 0)), 0);
    const totalDistributedAll = aidPrograms.reduce((acc, a) => {
      const received = (a.recipients || []).filter(r => r.status === 'Diterima').length;
      return acc + received;
    }, 0);
    const pendingHandover = Math.max(0, totalQuotaAll - totalDistributedAll);
    const completionRate = totalQuotaAll > 0 ? Math.round((totalDistributedAll / totalQuotaAll) * 100) : 0;

    return {
      totalPrograms,
      totalQuotaAll,
      totalDistributedAll,
      pendingHandover,
      completionRate
    };
  }, [aidPrograms]);

  // Filtered Programs List
  const filteredPrograms = useMemo(() => {
    return aidPrograms.filter(a => {
      const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isCompleted = a.status === 'Selesai' || (a.recipients && a.recipients.length > 0 && a.recipients.every(r => r.status === 'Diterima'));
      
      let matchStatus = true;
      if (statusFilter === 'active') matchStatus = !isCompleted;
      else if (statusFilter === 'completed') matchStatus = isCompleted;
      else if (statusFilter === 'sembako') matchStatus = a.category.toLowerCase().includes('sembako');
      else if (statusFilter === 'beras') matchStatus = a.category.toLowerCase().includes('beras');

      return matchSearch && matchStatus;
    });
  }, [aidPrograms, searchQuery, statusFilter]);

  // Handlers for Views
  const handleOpenCreateForm = () => {
    setEditingAidId(null);
    setFormTitle('');
    setFormCategory('Sembako Murah Pemda');
    setFormSource('Dinas Perdagangan Kota Palu / Kelurahan Tondo');
    setFormTotalQuota(25);
    setFormUnit('Paket Sembako');
    setFormDistributionDate(new Date().toISOString().slice(0, 10));
    setFormNotes('');
    
    // Auto-select vulnerable households as initial recommendation
    const recommendedHouses = sortedHouses
      .filter(h => h.isPKH || h.isBLT || h.isBPNT || h.economicStatus === 'Pra-Sejahtera' || h.isBansosLain)
      .map(h => h.id);
    setSelectedHouseIds(recommendedHouses);
    setViewMode('form');
  };

  const handleOpenEditForm = (aid: SocialAidItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingAidId(aid.id);
    setFormTitle(aid.title);
    setFormCategory(aid.category as any);
    setFormSource(aid.source);
    setFormTotalQuota(aid.totalQuota);
    setFormUnit(aid.unit || 'Paket');
    setFormDistributionDate(aid.distributionDate ? aid.distributionDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setFormNotes(aid.notes || '');
    setSelectedHouseIds((aid.recipients || []).map(r => r.houseId));
    setViewMode('form');
  };

  const handleOpenDetail = (aidId: string) => {
    setSelectedAidId(aidId);
    setRecipientFilter('all');
    setRecipientSearchQuery('');
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setInlineHandoverHouseId(null);
  };

  // Submit Create or Edit Program
  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Nama program bantuan harus diisi.');
      return;
    }
    if (selectedHouseIds.length === 0) {
      toast.error('Pilih minimal 1 kepala keluarga penerima bantuan.');
      return;
    }

    try {
      // Map selected house ids to recipient records
      const existingRecipientsMap = new Map<string, SocialAidRecipient>();
      if (editingAidId && currentAid?.recipients) {
        currentAid.recipients.forEach(r => existingRecipientsMap.set(r.houseId, r));
      }

      const recipients: SocialAidRecipient[] = selectedHouseIds.map(hId => {
        const house = sortedHouses.find(h => h.id === hId);
        const existing = existingRecipientsMap.get(hId);

        return {
          houseId: hId,
          headOfFamily: house?.headOfFamily || existing?.headOfFamily || 'Warga RT 02',
          block: house?.block || existing?.block || 'C',
          number: house?.number || existing?.number || 0,
          phone: house?.phone || existing?.phone || '',
          isPraSejahtera: house?.economicStatus === 'Pra-Sejahtera' || existing?.isPraSejahtera,
          isPKH: house?.isPKH || existing?.isPKH,
          isBLT: house?.isBLT || existing?.isBLT,
          isBPNT: house?.isBPNT || existing?.isBPNT,
          status: existing?.status || 'Menunggu',
          receivedAt: existing?.receivedAt,
          receivedBy: existing?.receivedBy,
          notes: existing?.notes
        };
      });

      const payload: Partial<SocialAidItem> = {
        title: formTitle.trim(),
        category: formCategory,
        source: formSource.trim(),
        totalQuota: formTotalQuota || recipients.length,
        unit: formUnit.trim() || 'Paket Sembako',
        distributionDate: formDistributionDate,
        notes: formNotes.trim(),
        recipients,
        status: editingAidId && currentAid ? currentAid.status : 'Berjalan'
      };

      if (editingAidId) {
        await updateSocialAidInDb(editingAidId, payload);
        toast.success('Program bantuan berhasil diperbarui!');
        setSelectedAidId(editingAidId);
        setViewMode('detail');
      } else {
        const newId = await addSocialAidToDb(payload);
        toast.success('Program bantuan / sembako murah berhasil diterbitkan!');
        setSelectedAidId(newId);
        setViewMode('detail');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal menyimpan program bantuan: ' + (err.message || 'Error Firestore'));
    }
  };

  // Delete Program
  const handleDeleteProgram = async (aid: SocialAidItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const isConfirmed = await confirm({
      title: 'Hapus Program Bantuan',
      message: `Apakah Anda yakin ingin menghapus agenda "${aid.title}"? Seluruh daftar tanda terima penerima akan ikut terhapus.`,
      confirmLabel: 'Hapus Agenda',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await deleteSocialAidFromDb(aid.id);
        toast.success('Program bantuan sosial berhasil dihapus.');
        if (selectedAidId === aid.id) {
          setSelectedAidId(null);
          setViewMode('list');
        }
      } catch (err: any) {
        toast.error('Gagal menghapus program bantuan: ' + err.message);
      }
    }
  };

  // Toggle Handover Status Directly
  const handleToggleHandover = async (recipient: SocialAidRecipient, isReceived: boolean, customName?: string) => {
    if (!currentAid) return;
    try {
      await toggleRecipientReceiptStatus(
        currentAid.id,
        recipient.houseId,
        isReceived,
        customName?.trim() || recipient.headOfFamily
      );
      setInlineHandoverHouseId(null);
      setInlineHandoverName('');
      toast.success(isReceived ? `Tanda terima ${recipient.headOfFamily} berhasil dicatat!` : `Status ${recipient.headOfFamily} dikembalikan ke Menunggu.`);
    } catch (err: any) {
      toast.error('Gagal memperbarui status: ' + err.message);
    }
  };

  // Send WhatsApp Reminder
  const handleSendPickupReminder = (r: SocialAidRecipient, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentAid) return;
    const cleanHouse = `Blok ${r.block}-${String(r.number).padStart(2, '0')}`;
    const dateFormatted = currentAid.distributionDate 
      ? new Date(currentAid.distributionDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
      : 'hari ini';

    const message = `Halo Bapak/Ibu *${r.headOfFamily}* (${cleanHouse}), salam hangat dari Pengurus RT 002 / RW 020 Huntap Tondo 2.

Menginformasikan bahwa program *${currentAid.title}* (*${currentAid.unit}*) dari *${currentAid.source}* telah siap disalurkan dan dapat diambil di Posko / Rumah Ketua RT 002 (${dateFormatted}).

Mohon membawa KTP / Kartu Keluarga fisik saat pengambilan di posko RT. Jika berhalangan hadir dan diwakilkan oleh anggota keluarga lain dalam 1 KK, mohon konfirmasi terlebih dahulu ke pengurus RT.

Terima kasih atas kerja samanya.
_Pengurus RT 002 Huntap Tondo 2_`;

    const success = openWhatsApp(r.phone, message);
    if (!success) {
      toast.error(`Nomor WhatsApp warga ${r.headOfFamily} tidak valid atau belum terdaftar`);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!currentAid || !currentAid.recipients || currentAid.recipients.length === 0) {
      toast.error('Tidak ada data penerima untuk diekspor');
      return;
    }
    const headers = ['No', 'Blok-Nomor', 'Nama Kepala Keluarga', 'Nomor WA', 'Kategori', 'Status Terima', 'Tanggal Serah', 'Nama Pengambil'];

    const rows = currentAid.recipients.map((r, idx) => {
      const tag = r.isPKH ? 'PKH' : r.isBLT ? 'BLT' : r.isBPNT ? 'BPNT' : r.isPraSejahtera ? 'Pra-Sejahtera' : 'Umum';
      return [
        idx + 1,
        `"${r.block}-${String(r.number).padStart(2, '0')}"`,
        `"${r.headOfFamily.replace(/"/g, '""')}"`,
        `"${r.phone || '-'}"`,
        `"${tag}"`,
        `"${r.status}"`,
        `"${r.receivedAt ? new Date(r.receivedAt).toLocaleDateString('id-ID') : '-'}"`,
        `"${(r.receivedBy || '-').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap-bantuan-${currentAid.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Rekap daftar penerima berhasil diunduh (CSV)!');
  };

  // Recipient filtering inside Detail View
  const filteredRecipients = useMemo(() => {
    if (!currentAid?.recipients) return [];
    return currentAid.recipients.filter(r => {
      const houseLabel = `c${r.block}${r.number}`.toLowerCase();
      const matchSearch = r.headOfFamily.toLowerCase().includes(recipientSearchQuery.toLowerCase()) ||
        houseLabel.includes(recipientSearchQuery.toLowerCase()) ||
        (r.block && r.block.toLowerCase().includes(recipientSearchQuery.toLowerCase()));

      let matchFilter = true;
      if (recipientFilter === 'pending') matchFilter = r.status === 'Menunggu';
      else if (recipientFilter === 'received') matchFilter = r.status === 'Diterima';

      return matchSearch && matchFilter;
    });
  }, [currentAid, recipientSearchQuery, recipientFilter]);

  // Calculation for current aid in detail view
  const currentAidStats = useMemo(() => {
    if (!currentAid || !currentAid.recipients) return { total: 0, received: 0, pending: 0, pct: 0 };
    const total = currentAid.recipients.length;
    const received = currentAid.recipients.filter(r => r.status === 'Diterima').length;
    const pending = Math.max(0, total - received);
    const pct = total > 0 ? Math.round((received / total) * 100) : 0;

    return { total, received, pending, pct };
  }, [currentAid]);

  // =========================================================================
  // VIEW MODE: FORM (FULL VIEW - CREATE / EDIT)
  // =========================================================================
  if (viewMode === 'form') {
    return (
      <div className="space-y-6 text-left max-w-5xl mx-auto pb-12">
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBackToList}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Daftar Program</span>
          </button>
          
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {editingAidId ? 'Edit Program' : 'Form Program Baru'}
          </span>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-7">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {editingAidId ? 'Edit Agenda Penyaluran Bantuan' : 'Buat Agenda Bantuan / Sembako Murah'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pencatatan program sembako murah pemerintah setempat, beras Bulog, atau bantuan donatur untuk warga RT 002.
            </p>
          </div>

          <form onSubmit={handleSaveProgram} className="space-y-6">
            {/* 1. INFORMASI PROGRAM */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Agenda / Program Bantuan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Operasi Pasar Sembako Murah Dinas Perdagangan Kota Palu"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm font-medium border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Program</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Instansi / Lembaga Penyelenggara</label>
                  <input
                    type="text"
                    placeholder="Contoh: Dinas Perindag Kota Palu / Kelurahan Tondo"
                    value={formSource}
                    onChange={e => setFormSource(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Kuota Paket</label>
                  <input
                    type="number"
                    min="1"
                    value={formTotalQuota}
                    onChange={e => setFormTotalQuota(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan Komoditas</label>
                  <input
                    type="text"
                    placeholder="Paket Sembako / Karung 10kg / Kupon"
                    value={formUnit}
                    onChange={e => setFormUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Pembagian</label>
                  <input
                    type="date"
                    value={formDistributionDate}
                    onChange={e => setFormDistributionDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. PEMILIHAN KELUARGA PENERIMA MANFAAT (FULL WIDTH CHECKBOX GRID) */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
                    Pilih Warga Penerima Manfaat ({selectedHouseIds.length} KK Terpilih)
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Centang KK yang berhak mendapatkan alokasi paket bantuan tahap ini.
                  </p>
                </div>

                {/* Quick Select Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const vuln = sortedHouses
                        .filter(h => h.isPKH || h.isBLT || h.isBPNT || h.economicStatus === 'Pra-Sejahtera' || h.isBansosLain)
                        .map(h => h.id);
                      setSelectedHouseIds(vuln);
                      toast.info(`${vuln.length} KK Prasejahtera & Penerima Bansos otomatis dicentang.`);
                    }}
                    className="px-3 py-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Pilih Pra-Sejahtera / PKH ({sortedHouses.filter(h => h.isPKH || h.isBLT || h.isBPNT || h.economicStatus === 'Pra-Sejahtera' || h.isBansosLain).length} KK)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedHouseIds(sortedHouses.map(h => h.id))}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                  >
                    Pilih Semua ({sortedHouses.length} KK)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedHouseIds([])}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Filter per Blok */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar">
                <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0 mr-1">Filter Blok:</span>
                {['all', 'C5', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12'].map(blk => (
                  <button
                    key={blk}
                    type="button"
                    onClick={() => setBlockFilter(blk)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer shrink-0 ${
                      blockFilter === blk 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {blk === 'all' ? 'Semua Blok' : `Blok ${blk}`}
                  </button>
                ))}
              </div>

              {/* Household Checkbox Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
                {sortedHouses
                  .filter(h => blockFilter === 'all' || h.block === blockFilter)
                  .map(house => {
                    const isChecked = selectedHouseIds.includes(house.id);
                    const tag = house.isPKH ? 'PKH' : house.isBLT ? 'BLT' : house.isBPNT ? 'BPNT' : house.economicStatus === 'Pra-Sejahtera' ? 'Pra-Sejahtera' : null;

                    return (
                      <label
                        key={house.id}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                          isChecked 
                            ? 'bg-amber-50/80 border-amber-300 text-slate-900 font-bold shadow-2xs' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedHouseIds(prev => [...prev, house.id]);
                            } else {
                              setSelectedHouseIds(prev => prev.filter(id => id !== house.id));
                            }
                          }}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                        />
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                          {house.block}-{String(house.number).padStart(2, '0')}
                        </span>
                        <span className="truncate flex-1 font-medium">{house.headOfFamily}</span>
                        {tag && (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                            {tag}
                          </span>
                        )}
                      </label>
                    );
                  })}
              </div>
            </div>

            {/* 3. CATATAN TAMBAHAN */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan &amp; Syarat Pengambilan</label>
              <textarea
                rows={3}
                placeholder="Contoh: Wajib bawa KTP asli & Kartu Keluarga. Lokasi pembagian di Pos Ronda Blok C10 pukul 09.00 WITA. Kupon telah dibagikan oleh staf kelurahan..."
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                className="w-full px-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Submit & Cancel Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-5 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-black rounded-2xl transition-colors cursor-pointer shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                <Check size={16} className="stroke-[3]" />
                <span>{editingAidId ? 'Simpan Perubahan Program' : 'Terbitkan Program Bantuan'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE: DETAIL (FULL VIEW - PROGRAM DETAIL & RECIPIENTS CHECKLIST)
  // =========================================================================
  if (viewMode === 'detail' && currentAid) {
    return (
      <div className="space-y-6 text-left w-full pb-16">
        {/* Navigation & Action Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={handleBackToList}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer w-fit"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Daftar Program</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => generateSocialAidHandoverPDF(currentAid, pdfConfig)}
              className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Cetak Berita Acara & Daftar Tanda Terima PDF"
            >
              <Printer size={14} />
              <span>Cetak Berita Acara (PDF)</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Ekspor ke format Excel / CSV"
            >
              <Download size={14} />
              <span>Ekspor CSV</span>
            </button>

            <button
              onClick={(e) => handleOpenEditForm(currentAid, e)}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit2 size={13} />
              <span>Edit Program</span>
            </button>

            <button
              onClick={(e) => handleDeleteProgram(currentAid, e)}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Hapus</span>
            </button>
          </div>
        </div>

        {/* Program Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-extrabold uppercase rounded-lg border bg-amber-50 text-amber-700 border-amber-200">
                  {currentAid.category}
                </span>

                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                  currentAidStats.pct === 100 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {currentAidStats.pct === 100 ? 'Selesai 100%' : `${currentAidStats.pct}% Tersalurkan`}
                </span>
              </div>

              <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {currentAid.title}
              </h1>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 font-medium pt-1">
                <span className="flex items-center gap-1">
                  <Building2 size={13} className="text-slate-400" />
                  <span>Penyelenggara / Sumber: <strong className="text-slate-800">{currentAid.source}</strong></span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar size={13} className="text-slate-400" />
                  <span>Tanggal Pembagian: <strong className="text-slate-800">{currentAid.distributionDate ? new Date(currentAid.distributionDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</strong></span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Package size={13} className="text-slate-400" />
                  <span>Total Kuota: <strong className="text-slate-800">{currentAid.totalQuota} {currentAid.unit}</strong></span>
                </span>
              </div>

              {currentAid.notes && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 mt-2">
                  <strong className="text-slate-800">Catatan / Ketentuan Khusus:</strong> {currentAid.notes}
                </div>
              )}
            </div>

            {/* Quick Progress Dial */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shrink-0 text-center min-w-[200px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Progres Penyaluran Warga</span>
              <div className="text-3xl font-black font-mono tabular-nums text-indigo-600 mt-1">
                {currentAidStats.received} <span className="text-sm font-semibold text-slate-400">/ {currentAidStats.total} KK</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
                <div 
                  className={`h-full transition-colors duration-500 ${currentAidStats.pct === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                  style={{ width: `${currentAidStats.pct}%` }} 
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                {currentAidStats.pending} paket menunggu diambil
              </p>
            </div>
          </div>

          {/* Recipient Checklist Workspace (Full Width Table) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <UserCheck size={18} className="text-emerald-600" />
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Daftar Warga Penerima Bantuan ({currentAid.recipients?.length || 0} KK)
                </h3>
              </div>

              {/* Filters for Recipients inside this program */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[240px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama KK / kavling..."
                    value={recipientSearchQuery}
                    onChange={e => setRecipientSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 bg-white"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setRecipientFilter('all')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${recipientFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
                  >
                    Semua ({currentAidStats.total})
                  </button>
                  <button
                    onClick={() => setRecipientFilter('pending')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${recipientFilter === 'pending' ? 'bg-white text-amber-800 shadow-2xs' : 'text-slate-500'}`}
                  >
                    Belum Diambil ({currentAidStats.pending})
                  </button>
                  <button
                    onClick={() => setRecipientFilter('received')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${recipientFilter === 'received' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500'}`}
                  >
                    Sudah Diterima ({currentAidStats.received})
                  </button>
                </div>
              </div>
            </div>

            {/* Recipient Full Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-extrabold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3.5 w-12 text-center">No</th>
                      <th className="py-3 px-3.5 w-28">Kavling</th>
                      <th className="py-3 px-3.5">Kepala Keluarga</th>
                      <th className="py-3 px-3.5 w-36">Kategori Warga</th>
                      <th className="py-3 px-3.5 w-60">Status Serah Terima</th>
                      <th className="py-3 px-3.5 w-40 text-center">Aksi &amp; WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecipients.map((r, idx) => {
                      const isReceived = r.status === 'Diterima';
                      const tag = r.isPKH ? 'PKH' : r.isBLT ? 'BLT' : r.isBPNT ? 'BPNT' : r.isPraSejahtera ? 'Pra-Sejahtera' : 'Umum';
                      const isInlineEditing = inlineHandoverHouseId === r.houseId;

                      return (
                        <tr 
                          key={`${r.houseId}-${idx}`} 
                          className={`transition-colors ${isReceived ? 'bg-emerald-50/20' : 'bg-white hover:bg-slate-50/70'}`}
                        >
                          <td className="py-3 px-3.5 text-center font-bold text-slate-400 font-mono">
                            {idx + 1}
                          </td>

                          <td className="py-3 px-3.5 font-bold font-mono text-indigo-700">
                            <span className="bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                              {r.block}-{String(r.number).padStart(2, '0')}
                            </span>
                          </td>

                          <td className="py-3 px-3.5 font-bold text-slate-900">
                            <div>{r.headOfFamily}</div>
                            {r.phone && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{r.phone}</div>}
                          </td>

                          <td className="py-3 px-3.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                              r.isPKH || r.isBLT || r.isPraSejahtera
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {tag}
                            </span>
                          </td>

                          {/* Kolom Status Serah Terima */}
                          <td className="py-3 px-3.5">
                            {isInlineEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  placeholder="Nama pengambil..."
                                  value={inlineHandoverName}
                                  onChange={e => setInlineHandoverName(e.target.value)}
                                  className="px-2.5 py-1 text-xs border border-emerald-400 rounded-lg focus:outline-none bg-white w-36 font-medium"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleToggleHandover(r, true, inlineHandoverName)}
                                  className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 cursor-pointer shadow-2xs"
                                  title="Simpan Serah Terima"
                                >
                                  <Check size={14} className="stroke-[3]" />
                                </button>
                                <button
                                  onClick={() => setInlineHandoverHouseId(null)}
                                  className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 cursor-pointer"
                                  title="Batal"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : isReceived ? (
                              <div>
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold text-xs">
                                  <Check size={13} className="stroke-[3]" />
                                  <span>Telah Diterima</span>
                                </span>
                                <p className="text-[11px] text-slate-600 truncate max-w-[200px]" title={r.receivedBy || r.headOfFamily}>
                                  Oleh: <strong className="text-slate-900">{r.receivedBy || r.headOfFamily}</strong>
                                </p>
                                {r.receivedAt && (
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    {new Date(r.receivedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WITA
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-600 font-medium text-xs">
                                <Clock size={12} />
                                <span>Belum Diambil di Posko</span>
                              </span>
                            )}
                          </td>

                          {/* Kolom Aksi WA & Tandai */}
                          <td className="py-3 px-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {!isReceived && (
                                <button
                                  onClick={(e) => handleSendPickupReminder(r, e)}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
                                  title="Kirim Pemberitahuan Pengambilan via WhatsApp"
                                >
                                  <Phone size={13} />
                                </button>
                              )}

                              {isReceived ? (
                                <button
                                  onClick={() => handleToggleHandover(r, false)}
                                  className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                                  title="Kembalikan ke status Belum Diambil"
                                >
                                  Batal
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setInlineHandoverHouseId(r.houseId);
                                    setInlineHandoverName(r.headOfFamily);
                                  }}
                                  className="px-3 py-1 text-[11px] font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <CheckSquare size={13} />
                                  <span>Tandai Terima</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredRecipients.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                          Tidak ada warga penerima yang cocok dengan filter pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE: LIST (FULL VIEW - DIRECTORY OF ALL AID & SEMBAKO PROGRAMS)
  // =========================================================================
  return (
    <div className="space-y-6 text-left w-full pb-16">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 rounded-3xl md:rounded-[2.5rem] p-6 sm:p-8 text-white relative overflow-hidden shadow-sm border border-slate-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-amber-500/10 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Gift size={13} className="text-amber-400" />
              <span>Logistik &amp; Penyaluran Sembako RT 02</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Penyaluran Bantuan &amp; Sembako Murah Warga
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Manajemen logistik bantuan pangan beras Bulog, operasi sembako murah pemerintah setempat (Disperindag/Kelurahan), BLT, dan santunan warga. Dilengkapi bukti serah terima digital &amp; berita acara resmi RT 02.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenCreateForm}
              className="px-5 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-colors cursor-pointer active:scale-95"
            >
              <Plus size={16} className="stroke-[3]" />
              <span>Buat Program Bantuan Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Executive Metrics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Total Program</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900">{metrics.totalPrograms}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Program sosial tercatat</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Total Kuota RT</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Gift size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-indigo-600">{metrics.totalQuotaAll}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Total paket / karung bantuan</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Tersalurkan ke Warga</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-emerald-600">{metrics.totalDistributedAll}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">{metrics.completionRate}% telah diserahkan</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Menunggu Diambil</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-rose-600">{metrics.pendingHandover}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Sisa paket di posko RT 02</p>
        </div>
      </div>

      {/* 3. Search & Category Filter Pills */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Semua ({aidPrograms.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 ${statusFilter === 'active' ? 'bg-white text-amber-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Sedang Berjalan
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 ${statusFilter === 'completed' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Selesai 100%
            </button>
            <button
              onClick={() => setStatusFilter('sembako')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 ${statusFilter === 'sembako' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Sembako Murah Pemda
            </button>
            <button
              onClick={() => setStatusFilter('beras')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 ${statusFilter === 'beras' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Beras Bulog
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari agenda bantuan / sumber..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 bg-white"
            />
          </div>
        </div>
      </div>

      {/* 4. Full Width Grid of Aid Programs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrograms.map(aid => {
          const totalRecipients = aid.recipients?.length || 0;
          const receivedCount = (aid.recipients || []).filter(r => r.status === 'Diterima').length;
          const progressPct = totalRecipients > 0 ? Math.round((receivedCount / totalRecipients) * 100) : 0;
          const isDone = receivedCount === totalRecipients && totalRecipients > 0;

          return (
            <div
              key={aid.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/90 hover:border-amber-300 shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Header Tag & Menu */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                      {aid.category}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                      isDone 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isDone ? 'Selesai 100%' : `${progressPct}% Tersalurkan`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleOpenEditForm(aid, e)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Program"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteProgram(aid, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Program"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-amber-800 transition-colors line-clamp-2">
                    {aid.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <Building2 size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">Sumber: <strong className="text-slate-700">{aid.source}</strong></span>
                  </p>
                </div>

                {/* Meta details */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-50">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400" />
                    <span>{aid.distributionDate ? new Date(aid.distributionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</span>
                  </span>
                  <span className="font-bold text-slate-700">
                    {aid.totalQuota} {aid.unit}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold font-mono tabular-nums">
                    <span className="text-slate-500">Penyaluran:</span>
                    <span className={isDone ? 'text-emerald-700' : 'text-slate-900'}>
                      {receivedCount} / {totalRecipients} {aid.unit || 'Paket'} ({progressPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-colors duration-500 ${isDone ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button: Open Full Detail */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleOpenDetail(aid.id)}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs group-hover:bg-amber-600"
                >
                  <span>Buka Detail &amp; Serah Terima</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredPrograms.length === 0 && (
          <div className="col-span-full bg-white rounded-3xl p-12 border border-slate-200/90 text-center space-y-3 shadow-2xs my-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Gift size={26} />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-800">Belum Ada Program Bantuan Tercatat</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Mulai catat program sembako murah pemerintah setempat, beras Bulog, atau bantuan warga dengan mengklik tombol di atas.
              </p>
            </div>
            <button
              onClick={handleOpenCreateForm}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              <Plus size={14} />
              <span>Buat Program Baru</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
