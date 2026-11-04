import React, { useState, useEffect, useMemo } from 'react';
import { 
  Gift, HeartHandshake, Package, Calendar, Users, CheckCircle2, 
  Clock, Search, Plus, Filter, Download, Printer, ExternalLink, 
  Share2, Eye, Edit2, Trash2, X, RefreshCw, AlertTriangle, 
  Building2, CheckSquare, ChevronRight, Phone, ArrowRight, UserCheck, 
  Info, Sparkles, Check, Send, AlertCircle
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
import { Modal } from '../ui/Modal';
import { toast } from 'sonner';
import { useConfirm } from '../../context/ConfirmContext';
import { motion, AnimatePresence } from 'motion/react';

interface SocialAidManagerProps {
  houses: House[];
  pdfConfig?: PdfConfig;
}

const CATEGORIES = [
  'Beras', 
  'Sembako', 
  'BLT / Uang Tunai', 
  'Nutrisi Balita & Lansia', 
  'Kesehatan & Sanitasi', 
  'Lainnya'
] as const;

export const SocialAidManager: React.FC<SocialAidManagerProps> = ({ houses, pdfConfig }) => {
  const confirm = useConfirm();
  const [aidPrograms, setAidPrograms] = useState<SocialAidItem[]>([]);
  const [selectedAidId, setSelectedAidId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [activeRecipientForHandover, setActiveRecipientForHandover] = useState<SocialAidRecipient | null>(null);
  const [handoverNameInput, setHandoverNameInput] = useState('');
  const [editingAidId, setEditingAidId] = useState<string | null>(null);

  // Form State for Create / Edit Program
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<typeof CATEGORIES[number]>('Beras');
  const [formSource, setFormSource] = useState('Kelurahan Tondo / Bapanas');
  const [formTotalQuota, setFormTotalQuota] = useState(25);
  const [formUnit, setFormUnit] = useState('Karung 10kg');
  const [formDistributionDate, setFormDistributionDate] = useState(new Date().toISOString().slice(0, 10));
  const [formNotes, setFormNotes] = useState('');
  const [selectedHouseIds, setSelectedHouseIds] = useState<string[]>([]);
  const [blockFilter, setBlockFilter] = useState('all');

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
    if (!selectedAidId && aidPrograms.length > 0) {
      return aidPrograms[0];
    }
    return aidPrograms.find(a => a.id === selectedAidId) || aidPrograms[0] || null;
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
      const matchStatus = 
        statusFilter === 'all' ? true :
        statusFilter === 'completed' ? isCompleted : !isCompleted;

      return matchSearch && matchStatus;
    });
  }, [aidPrograms, searchQuery, statusFilter]);

  // Helper to open create modal with prefilled vulnerable households
  const handleOpenCreateModal = () => {
    setEditingAidId(null);
    setFormTitle('');
    setFormCategory('Beras');
    setFormSource('Kelurahan Tondo / Bapanas');
    setFormUnit('Karung 10kg');
    setFormDistributionDate(new Date().toISOString().slice(0, 10));
    setFormNotes('');
    
    // Auto recommend vulnerable households (PKH, BLT, BPNT, Pra-Sejahtera)
    const recommended = sortedHouses
      .filter(h => h.isPKH || h.isBLT || h.isBPNT || h.economicStatus === 'Pra-Sejahtera' || h.isBansosLain)
      .map(h => h.id);
    
    setSelectedHouseIds(recommended);
    setFormTotalQuota(recommended.length || 20);
    setIsCreateModalOpen(true);
  };

  // Helper to open edit modal
  const handleOpenEditModal = (aid: SocialAidItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingAidId(aid.id);
    setFormTitle(aid.title);
    setFormCategory(aid.category);
    setFormSource(aid.source);
    setFormTotalQuota(aid.totalQuota);
    setFormUnit(aid.unit);
    setFormDistributionDate(aid.distributionDate || new Date().toISOString().slice(0, 10));
    setFormNotes(aid.notes || '');
    setSelectedHouseIds((aid.recipients || []).map(r => r.houseId));
    setIsCreateModalOpen(true);
  };

  // Save Program (Create or Update)
  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Judul program bantuan tidak boleh kosong');
      return;
    }
    if (selectedHouseIds.length === 0) {
      toast.error('Pilih minimal satu keluarga penerima manfaat');
      return;
    }

    // Map selected house ids to SocialAidRecipient objects
    const recipients: SocialAidRecipient[] = selectedHouseIds.map(hid => {
      const house = sortedHouses.find(h => h.id === hid);
      const prevRec = editingAidId 
        ? currentAid?.recipients.find(r => r.houseId === hid)
        : undefined;

      return {
        houseId: hid,
        headOfFamily: house?.headOfFamily || 'Kepala Keluarga',
        block: house?.block || 'C',
        number: house?.number || 1,
        phone: house?.phone || '',
        isPraSejahtera: house?.economicStatus === 'Pra-Sejahtera',
        isPKH: house?.isPKH,
        isBLT: house?.isBLT,
        isBPNT: house?.isBPNT,
        status: prevRec?.status || 'Menunggu',
        receivedAt: prevRec?.receivedAt,
        receivedBy: prevRec?.receivedBy,
        notes: prevRec?.notes
      };
    });

    const payload: Partial<SocialAidItem> = {
      title: formTitle.trim(),
      category: formCategory,
      source: formSource.trim(),
      totalQuota: Number(formTotalQuota) || recipients.length,
      unit: formUnit.trim(),
      distributionDate: formDistributionDate,
      notes: formNotes.trim(),
      recipients,
      status: recipients.every(r => r.status === 'Diterima') ? 'Selesai' : 'Berjalan'
    };

    try {
      if (editingAidId) {
        await updateSocialAidInDb(editingAidId, payload);
        toast.success('Program bantuan berhasil diperbarui!');
      } else {
        const newId = await addSocialAidToDb(payload);
        setSelectedAidId(newId);
        toast.success('Program bantuan baru berhasil dibuat!');
      }
      setIsCreateModalOpen(false);
    } catch (error) {
      toast.error('Gagal menyimpan program bantuan');
    }
  };

  // Delete Program
  const handleDeleteProgram = async (aid: SocialAidItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const confirmed = await confirm({
      title: 'Hapus Agenda Bantuan?',
      message: `Apakah Anda yakin ingin menghapus arsip penyaluran "${aid.title}"? Seluruh daftar penerima pada agenda ini akan dihapus secara permanen.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      isDestructive: true
    });
    if (!confirmed) return;

    try {
      await deleteSocialAidFromDb(aid.id);
      if (selectedAidId === aid.id) {
        setSelectedAidId(null);
      }
      toast.success('Arsip program bantuan berhasil dihapus.');
    } catch (e) {
      toast.error('Gagal menghapus program bantuan.');
    }
  };

  // Handover Toggle Action
  const handleOpenHandoverModal = (r: SocialAidRecipient) => {
    setActiveRecipientForHandover(r);
    setHandoverNameInput(r.receivedBy || r.headOfFamily);
    setIsHandoverModalOpen(true);
  };

  const handleConfirmHandover = async (isReceived: boolean) => {
    if (!currentAid || !activeRecipientForHandover) return;
    try {
      await toggleRecipientReceiptStatus(
        currentAid.id,
        activeRecipientForHandover.houseId,
        isReceived,
        isReceived ? handoverNameInput.trim() || activeRecipientForHandover.headOfFamily : undefined
      );
      toast.success(isReceived 
        ? `Bantuan berhasil diserahkan ke ${handoverNameInput || activeRecipientForHandover.headOfFamily}` 
        : `Status penyerahan dibatalkan.`
      );
      setIsHandoverModalOpen(false);
    } catch (e) {
      toast.error('Gagal memperbarui status penyerahan');
    }
  };

  // WhatsApp Pickup Reminder
  const handleSendPickupReminder = (r: SocialAidRecipient, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentAid) return;
    const cleanHouse = `Blok ${r.block}-${String(r.number).padStart(2, '0')}`;
    const dateFormatted = currentAid.distributionDate 
      ? new Date(currentAid.distributionDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
      : 'hari ini';

    const message = `Halo Bapak/Ibu *${r.headOfFamily}* (${cleanHouse}), salam hangat dari Pengurus RT 002 / RW 020 Huntap Tondo 2.

Menginformasikan bahwa bantuan sosial *${currentAid.title}* (*${currentAid.unit}*) dari *${currentAid.source}* telah siap disalurkan dan dapat diambil di Posko / Rumah Ketua RT 002 (${dateFormatted}).

Mohon membawa KTP / Kartu Keluarga fisik saat pengambilan. Jika diwakilkan oleh anggota keluarga lain, mohon konfirmasi terlebih dahulu ke pengurus RT.

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
    const headers = ['No', 'Blok-Nomor', 'Nama Kepala Keluarga', 'Nomor WA', 'Kategori', 'Status', 'Tanggal Serah', 'Nama Penerima'];
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
    link.setAttribute('download', `rekap-bansos-${currentAid.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Rekap daftar penerima berhasil diunduh (CSV)!');
  };

  return (
    <div className="space-y-6 text-left">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 rounded-3xl md:rounded-[2.5rem] p-6 sm:p-8 text-white relative overflow-hidden shadow-sm border border-slate-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-amber-500/10 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Gift size={13} className="text-amber-400" />
              <span>Logistik &amp; Bantuan Sosial RT 02</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Penyaluran Bantuan &amp; Sembako Warga
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Pencatatan resmi program bantuan pangan (Bulog), sembako, santunan dhuafa, dan BLT. Dilengkapi checklist tanda terima digital untuk menjamin transparansi serta pemerataan yang adil tanpa kecemburuan sosial.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-colors cursor-pointer active:scale-95"
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
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Kuota Diterima RT</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Gift size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-indigo-600">{metrics.totalQuotaAll}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Total paket / karung bantuan</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Telah Diserahkan</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-emerald-600">{metrics.totalDistributedAll}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">{metrics.completionRate}% tersalurkan ke warga</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Menunggu Ambil</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-rose-600">{metrics.pendingHandover}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Sisa paket di posko RT 02</p>
        </div>
      </div>

      {/* 3. Main Workspace: Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List of Programs (col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                <Gift size={16} className="text-amber-600" />
                <span>Daftar Agenda Bantuan</span>
              </h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 rounded-md text-slate-600">
                {filteredPrograms.length} Agenda
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Semua
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${statusFilter === 'active' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Sedang Berjalan
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${statusFilter === 'completed' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Selesai
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari program bantuan / sumber..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredPrograms.map(aid => {
              const isSelected = currentAid?.id === aid.id;
              const totalRecipients = aid.recipients?.length || 0;
              const receivedCount = (aid.recipients || []).filter(r => r.status === 'Diterima').length;
              const progressPct = totalRecipients > 0 ? Math.round((receivedCount / totalRecipients) * 100) : 0;
              const isDone = receivedCount === totalRecipients && totalRecipients > 0;

              return (
                <div
                  key={aid.id}
                  onClick={() => setSelectedAidId(aid.id)}
                  className={`p-4 rounded-2xl border transition-colors cursor-pointer text-left relative overflow-hidden group ${
                    isSelected
                      ? 'bg-amber-50/50 border-amber-400 shadow-xs'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
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
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                        {aid.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleOpenEditModal(aid, e)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                        title="Edit Program"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteProgram(aid, e)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                        title="Hapus Program"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1 mb-3">
                    <p className="flex items-center gap-1">
                      <Building2 size={12} className="text-slate-400" />
                      <span>Sumber: <strong className="text-slate-700">{aid.source}</strong></span>
                    </p>
                    <p className="flex items-center gap-1">
                      <Calendar size={12} className="text-slate-400" />
                      <span>Tanggal: <strong className="text-slate-700">{aid.distributionDate ? new Date(aid.distributionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</strong></span>
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold font-mono tabular-nums">
                      <span className="text-slate-500">Progres Serah Terima:</span>
                      <span className="text-slate-900">{receivedCount} / {totalRecipients} {aid.unit || 'Paket'}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-colors duration-500 ${isDone ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredPrograms.length === 0 && (
              <div className="bg-white rounded-2xl p-8 border border-slate-200/90 text-center space-y-3 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Gift size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Belum Ada Program Bantuan</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Klik tombol di atas untuk mencatat program bantuan sembako, beras, atau santunan baru.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Program Detail & Recipient Checklist (col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          {currentAid ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5 text-left">
              {/* Program Overview Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-md bg-amber-50 text-amber-700 border border-amber-200/60">
                      {currentAid.category}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Penyaluran RT 002
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    {currentAid.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Sumber: <strong className="text-slate-800">{currentAid.source}</strong> • Kuota: <strong className="text-slate-800">{currentAid.totalQuota} {currentAid.unit}</strong>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => generateSocialAidHandoverPDF(currentAid, pdfConfig)}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Cetak Berita Acara & Daftar Tanda Terima PDF"
                  >
                    <Printer size={13} />
                    <span>Cetak Berita Acara (PDF)</span>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Ekspor ke format Excel / CSV"
                  >
                    <Download size={13} />
                    <span>Ekspor CSV</span>
                  </button>
                </div>
              </div>

              {/* Recipients Checklist Workspace */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <UserCheck size={16} className="text-emerald-600" />
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                      Daftar Warga Penerima Manfaat ({currentAid.recipients?.length || 0} KK)
                    </h4>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {currentAid.recipients.filter(r => r.status === 'Diterima').length} dari {currentAid.recipients.length} Lunas Terima
                  </span>
                </div>

                {/* Recipient Rows */}
                <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden max-h-[500px] overflow-y-auto">
                  {currentAid.recipients.map((r, idx) => {
                    const isReceived = r.status === 'Diterima';
                    const houseLabel = `Blok ${r.block}-${String(r.number).padStart(2, '0')}`;
                    const tag = r.isPKH ? 'PKH' : r.isBLT ? 'BLT' : r.isBPNT ? 'BPNT' : r.isPraSejahtera ? 'Pra-Sejahtera' : null;

                    return (
                      <div 
                        key={`${r.houseId}-${idx}`}
                        className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                          isReceived ? 'bg-emerald-50/20' : 'bg-white hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                            isReceived ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                                {houseLabel}
                              </span>
                              <strong className="text-xs sm:text-sm text-slate-900">{r.headOfFamily}</strong>
                              {tag && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 uppercase">
                                  {tag}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                              {isReceived ? (
                                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                  <Check size={12} className="stroke-[3]" />
                                  Diterima oleh: <strong>{r.receivedBy || r.headOfFamily}</strong> ({r.receivedAt ? new Date(r.receivedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA' : 'Tercatat'})
                                </span>
                              ) : (
                                <span className="text-amber-600 font-medium flex items-center gap-1">
                                  <Clock size={12} /> Belum diambil di posko RT
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Row Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          {/* Send WhatsApp notification button if not yet received */}
                          {!isReceived && (
                            <button
                              onClick={(e) => handleSendPickupReminder(r, e)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Kirim Pesan WhatsApp Siap Ambil"
                            >
                              <Phone size={12} />
                              <span className="hidden sm:inline">Panggil WA</span>
                            </button>
                          )}

                          {/* Toggle Handover Status Button */}
                          <button
                            onClick={() => handleOpenHandoverModal(r)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                              isReceived
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            <CheckSquare size={13} />
                            <span>{isReceived ? 'Ubah Penerima' : 'Tandai Diterima'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-3 shadow-2xs">
              <Gift size={32} className="mx-auto text-slate-300" />
              <p className="text-slate-500 text-sm">Pilih salah satu agenda bantuan di sebelah kiri untuk melihat daftar penerima &amp; serah terima.</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. MODAL: Buat / Edit Program Bantuan */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingAidId ? 'Edit Program Bantuan Sosial' : 'Buat Program Penyaluran Bantuan Baru'}
      >
        <form onSubmit={handleSaveProgram} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Program Bantuan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Beras CPP Cadangan Pangan Bulog Tahap II (10kg)"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Bantuan</label>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Sumber / Instansi Pemberi</label>
              <input
                type="text"
                placeholder="Contoh: Kelurahan Tondo / Bapanas"
                value={formSource}
                onChange={e => setFormSource(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Satuan Paket</label>
              <input
                type="text"
                placeholder="Karung 10kg / Paket Dus"
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

          {/* Household Selection Workspace */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-800">
                  Pilih Keluarga Penerima Manfaat ({selectedHouseIds.length} Terpilih)
                </label>
                <p className="text-[11px] text-slate-400">Centang KK yang berhak mendapatkan bantuan tahap ini.</p>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const vuln = sortedHouses
                      .filter(h => h.isPKH || h.isBLT || h.isBPNT || h.economicStatus === 'Pra-Sejahtera' || h.isBansosLain)
                      .map(h => h.id);
                    setSelectedHouseIds(vuln);
                    toast.info(`${vuln.length} KK Prasejahtera & Penerima Bansos otomatis dicentang.`);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                >
                  Pilih Pra-Sejahtera / PKH
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedHouseIds(sortedHouses.map(h => h.id))}
                  className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Pilih Semua ({sortedHouses.length} KK)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedHouseIds([])}
                  className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Filter by Block */}
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Blok:</span>
              {['all', 'C5', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12'].map(blk => (
                <button
                  key={blk}
                  type="button"
                  onClick={() => setBlockFilter(blk)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                    blockFilter === blk 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {blk === 'all' ? 'Semua' : blk}
                </button>
              ))}
            </div>

            {/* Household Checkbox Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-2.5 bg-slate-50/50">
              {sortedHouses
                .filter(h => blockFilter === 'all' || h.block === blockFilter)
                .map(house => {
                  const isChecked = selectedHouseIds.includes(house.id);
                  const tag = house.isPKH ? 'PKH' : house.isBLT ? 'BLT' : house.isBPNT ? 'BPNT' : house.economicStatus === 'Pra-Sejahtera' ? 'Pra-Sejahtera' : null;

                  return (
                    <label
                      key={house.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked 
                          ? 'bg-amber-50/80 border-amber-300 text-slate-900 font-bold' 
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
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="font-mono text-indigo-700 shrink-0">
                        {house.block}-{String(house.number).padStart(2, '0')}
                      </span>
                      <span className="truncate flex-1">{house.headOfFamily}</span>
                      {tag && (
                        <span className="text-[9px] font-extrabold uppercase px-1 rounded bg-amber-100 text-amber-800 shrink-0">
                          {tag}
                        </span>
                      )}
                    </label>
                  );
                })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
            <textarea
              rows={2}
              placeholder="Contoh: Wajib bawa KTP asli, lokasi pembagian di Pos Ronda Blok C10..."
              value={formNotes}
              onChange={e => setFormNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl transition-colors cursor-pointer shadow-md shadow-amber-500/20"
            >
              {editingAidId ? 'Simpan Perubahan' : 'Buat Program Bantuan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. MODAL: Konfirmasi Serah Terima / Ubah Pengambil */}
      <Modal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
        title="Tanda Terima Bantuan Sosial"
      >
        {activeRecipientForHandover && (
          <div className="space-y-4 text-left">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold font-mono text-indigo-700 uppercase bg-indigo-50 px-2 py-0.5 rounded">
                Blok {activeRecipientForHandover.block}-{String(activeRecipientForHandover.number).padStart(2, '0')}
              </span>
              <h4 className="text-sm font-extrabold text-slate-900">{activeRecipientForHandover.headOfFamily}</h4>
              <p className="text-xs text-slate-500">
                Program: <strong className="text-slate-800">{currentAid?.title}</strong> ({currentAid?.unit})
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Penerima / Yang Mengambil di Posko <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Nama orang yang mengambil bantuan..."
                value={handoverNameInput}
                onChange={e => setHandoverNameInput(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Bisa diisi nama Kepala Keluarga bersangkutan atau anggota keluarga yang mewakili (istri/anak).
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2.5">
              {activeRecipientForHandover.status === 'Diterima' ? (
                <button
                  type="button"
                  onClick={() => handleConfirmHandover(false)}
                  className="px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                >
                  Batalkan Penerimaan (Kembalikan ke Menunggu)
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsHandoverModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmHandover(true)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition-colors cursor-pointer shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                >
                  <Check size={14} className="stroke-[3]" />
                  <span>Konfirmasi Serah Terima</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
