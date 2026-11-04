import React, { useState, useEffect, useMemo } from 'react';
import { 
  Gift, HeartHandshake, Package, Calendar, Users, CheckCircle2, 
  Clock, Search, Plus, Filter, Download, Printer, ArrowLeft,
  Share2, Eye, Edit2, Trash2, X, RefreshCw, AlertTriangle, 
  Building2, CheckSquare, ChevronRight, Phone, ArrowRight, UserCheck, 
  Info, Sparkles, Check, Send, AlertCircle, DollarSign, ShoppingBag,
  CreditCard, Tag, ArrowUpRight
} from 'lucide-react';
import { SocialAidItem, SocialAidRecipient, House, PdfConfig } from '../../types';
import { 
  subscribeToSocialAid, 
  addSocialAidToDb, 
  updateSocialAidInDb, 
  deleteSocialAidFromDb,
  updateRecipientPaymentAndReceipt 
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
  
  // Navigation View State: 'list' | 'detail' | 'form' (FULL VIEW - NO POPUP)
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'form'>('list');
  const [selectedAidId, setSelectedAidId] = useState<string | null>(null);
  const [editingAidId, setEditingAidId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'gratis' | 'tebus_murah'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'pending' | 'received' | 'unpaid' | 'paid'>('all');
  const [recipientSearchQuery, setRecipientSearchQuery] = useState('');

  // Form State for Create / Edit Program
  const [formProgramType, setFormProgramType] = useState<'gratis' | 'tebus_murah'>('gratis');
  const [formPackagePrice, setFormPackagePrice] = useState<number>(35000);
  const [formMarketPrice, setFormMarketPrice] = useState<number>(85000);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<typeof CATEGORIES[number]>('Beras');
  const [formSource, setFormSource] = useState('Kelurahan Tondo / Bapanas');
  const [formTotalQuota, setFormTotalQuota] = useState(25);
  const [formUnit, setFormUnit] = useState('Karung 10kg');
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
    
    // Total subsidized revenue from Sembako Murah
    const totalTebusRevenue = aidPrograms.reduce((acc, a) => {
      if (a.programType !== 'tebus_murah' || !a.packagePrice) return acc;
      const paidRecipients = (a.recipients || []).filter(r => r.paymentStatus === 'Lunas');
      return acc + (paidRecipients.length * a.packagePrice);
    }, 0);

    return {
      totalPrograms,
      totalQuotaAll,
      totalDistributedAll,
      pendingHandover,
      completionRate,
      totalTebusRevenue
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
      else if (statusFilter === 'gratis') matchStatus = (a.programType || 'gratis') === 'gratis';
      else if (statusFilter === 'tebus_murah') matchStatus = a.programType === 'tebus_murah';

      return matchSearch && matchStatus;
    });
  }, [aidPrograms, searchQuery, statusFilter]);

  // Handlers for Views
  const handleOpenCreateForm = () => {
    setEditingAidId(null);
    setFormProgramType('gratis');
    setFormPackagePrice(35000);
    setFormMarketPrice(85000);
    setFormTitle('');
    setFormCategory('Beras');
    setFormSource('Kelurahan Tondo / Bapanas');
    setFormTotalQuota(25);
    setFormUnit('Karung 10kg');
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
    setFormProgramType(aid.programType || 'gratis');
    setFormPackagePrice(aid.packagePrice || 35000);
    setFormMarketPrice(aid.marketPrice || 85000);
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
          paymentStatus: existing?.paymentStatus || (formProgramType === 'tebus_murah' ? 'Belum Bayar' : 'Gratis'),
          paidAmount: existing?.paidAmount || (formProgramType === 'tebus_murah' ? formPackagePrice : 0),
          paymentMethod: existing?.paymentMethod || 'Tunai',
          paidAt: existing?.paidAt,
          notes: existing?.notes
        };
      });

      const payload: Partial<SocialAidItem> = {
        title: formTitle.trim(),
        category: formCategory,
        source: formSource.trim(),
        programType: formProgramType,
        packagePrice: formProgramType === 'tebus_murah' ? Number(formPackagePrice) || 0 : 0,
        marketPrice: formProgramType === 'tebus_murah' ? Number(formMarketPrice) || 0 : 0,
        totalQuota: formTotalQuota || recipients.length,
        unit: formUnit.trim() || 'Paket',
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
        toast.success('Program bantuan sosial berhasil diterbitkan!');
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
      message: `Apakah Anda yakin ingin menghapus arsip agenda bantuan "${aid.title}"? Seluruh daftar tanda terima penerima akan ikut terhapus.`,
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
      await updateRecipientPaymentAndReceipt(currentAid.id, recipient.houseId, {
        status: isReceived ? 'Diterima' : 'Menunggu',
        receivedBy: isReceived ? (customName?.trim() || recipient.headOfFamily) : undefined,
      });
      setInlineHandoverHouseId(null);
      setInlineHandoverName('');
      toast.success(isReceived ? `Tanda terima ${recipient.headOfFamily} tercatat!` : `Status ${recipient.headOfFamily} dikembalikan ke Menunggu.`);
    } catch (err: any) {
      toast.error('Gagal memperbarui status: ' + err.message);
    }
  };

  // Update Payment Status for Sembako Murah
  const handleUpdatePaymentStatus = async (recipient: SocialAidRecipient, newPaymentStatus: 'Lunas' | 'Belum Bayar' | 'Gratis', method?: 'Tunai' | 'QRIS') => {
    if (!currentAid) return;
    try {
      await updateRecipientPaymentAndReceipt(currentAid.id, recipient.houseId, {
        paymentStatus: newPaymentStatus,
        paymentMethod: method || recipient.paymentMethod || 'Tunai',
        paidAmount: newPaymentStatus === 'Lunas' ? (currentAid.packagePrice || 0) : 0
      });
      toast.success(`Pembayaran ${recipient.headOfFamily} diperbarui: ${newPaymentStatus}`);
    } catch (err: any) {
      toast.error('Gagal memperbarui status bayar: ' + err.message);
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

    const isTebusMurah = currentAid.programType === 'tebus_murah';
    const priceInfo = isTebusMurah 
      ? `\n*Biaya Tebus Subsidi:* Rp ${(currentAid.packagePrice || 0).toLocaleString('id-ID')} / ${currentAid.unit || 'paket'}\n*Status Bayar:* ${r.paymentStatus === 'Lunas' ? 'Sudah Lunas' : 'Menunggu Pembayaran di Posko'}\n`
      : '\n*Biaya:* GRATIS (Bantuan Penuh)\n';

    const message = `Halo Bapak/Ibu *${r.headOfFamily}* (${cleanHouse}), salam hangat dari Pengurus RT 002 / RW 020 Huntap Tondo 2.

Menginformasikan bahwa program *${currentAid.title}* (*${currentAid.unit}*) dari *${currentAid.source}* telah siap disalurkan dan dapat diambil di Posko / Rumah Ketua RT 002 (${dateFormatted}).
${priceInfo}
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
    const isTebus = currentAid.programType === 'tebus_murah';
    const headers = isTebus 
      ? ['No', 'Blok-Nomor', 'Nama Kepala Keluarga', 'Nomor WA', 'Kategori', 'Status Terima', 'Tanggal Serah', 'Nama Pengambil', 'Status Bayar', 'Metode Bayar', 'Nominal Bayar']
      : ['No', 'Blok-Nomor', 'Nama Kepala Keluarga', 'Nomor WA', 'Kategori', 'Status Terima', 'Tanggal Serah', 'Nama Pengambil'];

    const rows = currentAid.recipients.map((r, idx) => {
      const tag = r.isPKH ? 'PKH' : r.isBLT ? 'BLT' : r.isBPNT ? 'BPNT' : r.isPraSejahtera ? 'Pra-Sejahtera' : 'Umum';
      const baseRow = [
        idx + 1,
        `"${r.block}-${String(r.number).padStart(2, '0')}"`,
        `"${r.headOfFamily.replace(/"/g, '""')}"`,
        `"${r.phone || '-'}"`,
        `"${tag}"`,
        `"${r.status}"`,
        `"${r.receivedAt ? new Date(r.receivedAt).toLocaleDateString('id-ID') : '-'}"`,
        `"${(r.receivedBy || '-').replace(/"/g, '""')}"`
      ];

      if (isTebus) {
        baseRow.push(
          `"${r.paymentStatus || 'Belum Bayar'}"`,
          `"${r.paymentMethod || '-'}"`,
          `"${r.paidAmount || 0}"`
        );
      }
      return baseRow;
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
      else if (recipientFilter === 'unpaid') matchFilter = r.paymentStatus === 'Belum Bayar';
      else if (recipientFilter === 'paid') matchFilter = r.paymentStatus === 'Lunas' || r.paymentStatus === 'Gratis';

      return matchSearch && matchFilter;
    });
  }, [currentAid, recipientSearchQuery, recipientFilter]);

  // Calculation for current aid in detail view
  const currentAidStats = useMemo(() => {
    if (!currentAid || !currentAid.recipients) return { total: 0, received: 0, pct: 0, paid: 0, unpaid: 0, waived: 0, totalRevenue: 0 };
    const total = currentAid.recipients.length;
    const received = currentAid.recipients.filter(r => r.status === 'Diterima').length;
    const pct = total > 0 ? Math.round((received / total) * 100) : 0;
    const paid = currentAid.recipients.filter(r => r.paymentStatus === 'Lunas').length;
    const waived = currentAid.recipients.filter(r => r.paymentStatus === 'Gratis').length;
    const unpaid = currentAid.recipients.filter(r => !r.paymentStatus || r.paymentStatus === 'Belum Bayar').length;
    const totalRevenue = paid * (currentAid.packagePrice || 0);

    return { total, received, pct, paid, unpaid, waived, totalRevenue };
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
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {editingAidId ? 'Edit Agenda Penyaluran Bantuan' : 'Buat Agenda Penyaluran Bantuan Baru'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Daftarkan program bantuan beras Bulog, santunan sembako, atau pasar sembako murah bersubsidi untuk warga RT 002.
            </p>
          </div>

          <form onSubmit={handleSaveProgram} className="space-y-7">
            {/* 1. SELEKTOR JENIS PROGRAM (GRATIS vs TEBUS MURAH) */}
            <div className="space-y-2.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Jenis Program Bantuan <span className="text-rose-500">*</span>
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label 
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-colors flex items-start gap-3.5 ${
                    formProgramType === 'gratis' 
                      ? 'border-amber-500 bg-amber-50/50 shadow-2xs' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="programType" 
                    value="gratis" 
                    checked={formProgramType === 'gratis'}
                    onChange={() => setFormProgramType('gratis')}
                    className="mt-1 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Gift size={16} className="text-amber-600" />
                      <strong className="text-xs sm:text-sm text-slate-900 font-extrabold">Bansos Cuma-Cuma (Gratis)</strong>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Bantuan pangan 100% gratis tanpa biaya tebus (misal: Beras CPP Bulog, BLT Kemensos, santunan dhuafa Baznas).
                    </p>
                  </div>
                </label>

                <label 
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-colors flex items-start gap-3.5 ${
                    formProgramType === 'tebus_murah' 
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-2xs' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="programType" 
                    value="tebus_murah" 
                    checked={formProgramType === 'tebus_murah'}
                    onChange={() => setFormProgramType('tebus_murah')}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={16} className="text-emerald-600" />
                      <strong className="text-xs sm:text-sm text-slate-900 font-extrabold">Sembako Murah (Tebus Murah)</strong>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Paket sembako bersubsidi di mana warga menebus dengan harga terjangkau. Dilengkapi pencatatan kas &amp; status pelunasan.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* JIKA TEBUS MURAH: INPUT BIAYA TEBUS & HARGA PASAR */}
            {formProgramType === 'tebus_murah' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                  <DollarSign size={15} className="text-emerald-700" />
                  <span>Pengaturan Harga Tebus Sembako Bersubsidi</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Biaya Tebus per Paket (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                      <input 
                        type="number"
                        min="0"
                        step="1000"
                        required
                        value={formPackagePrice}
                        onChange={e => setFormPackagePrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs font-bold font-mono border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
                        placeholder="Contoh: 35000"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">Biaya yang dibayarkan warga saat mengambil paket.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Estimasi Nilai Pasar Normal (Rp) <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                      <input 
                        type="number"
                        min="0"
                        step="1000"
                        value={formMarketPrice}
                        onChange={e => setFormMarketPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
                        placeholder="Contoh: 85000"
                      />
                    </div>
                    {formMarketPrice > formPackagePrice && (
                      <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                        Warga menghemat Rp {(formMarketPrice - formPackagePrice).toLocaleString('id-ID')} ({Math.round(((formMarketPrice - formPackagePrice) / formMarketPrice) * 100)}% subsidi)!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. INFORMASI DETAIL PROGRAM */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Agenda / Program Bantuan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={formProgramType === 'tebus_murah' ? 'Contoh: Tebus Murah Minyak & Gula Pasir Menjelang Ramadhan' : 'Contoh: Beras CPP Cadangan Pangan Pemerintah Tahap II (10kg)'}
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm font-medium border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    placeholder="Contoh: Kelurahan Tondo / Bapanas / Kas RT 02"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan Paket</label>
                  <input
                    type="text"
                    placeholder="Karung 10kg / Paket Dus / Liter"
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

            {/* 3. PEMILIHAN KELUARGA PENERIMA MANFAAT (FULL WIDTH CHECKBOX GRID) */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
                    Pilih Warga Penerima Manfaat ({selectedHouseIds.length} KK Terpilih)
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Centang KK yang berhak mendapatkan kuota paket bantuan / tebus murah tahap ini.
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

            {/* 4. CATATAN TAMBAHAN */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan &amp; Syarat Pengambilan</label>
              <textarea
                rows={3}
                placeholder="Contoh: Wajib bawa KTP asli, lokasi pembagian di Pos Ronda Blok C10 pukul 09.00 WITA. Bagi yang berhalangan hadir dapat diwakilkan anggota keluarga dalam 1 KK..."
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
    const isTebus = currentAid.programType === 'tebus_murah';

    return (
      <div className="space-y-6 text-left w-full pb-16">
        {/* Navigation & Header */}
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
                <span className={`px-2.5 py-1 text-xs font-black uppercase rounded-lg border ${
                  isTebus 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {isTebus ? 'Sembako Murah (Tebus Subsidi)' : 'Bansos Cuma-Cuma (Gratis)'}
                </span>

                <span className="px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg">
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
                  <span>Sumber: <strong className="text-slate-800">{currentAid.source}</strong></span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar size={13} className="text-slate-400" />
                  <span>Tanggal Penyaluran: <strong className="text-slate-800">{currentAid.distributionDate ? new Date(currentAid.distributionDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</strong></span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Package size={13} className="text-slate-400" />
                  <span>Total Kuota: <strong className="text-slate-800">{currentAid.totalQuota} {currentAid.unit}</strong></span>
                </span>
              </div>

              {currentAid.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 mt-2">
                  <strong className="text-slate-800">Catatan Khusus:</strong> {currentAid.notes}
                </div>
              )}
            </div>

            {/* Quick Progress Dial */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shrink-0 text-center min-w-[180px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Progres Serah Terima</span>
              <div className="text-3xl font-black font-mono tabular-nums text-indigo-600 mt-1">
                {currentAidStats.received} <span className="text-sm font-semibold text-slate-400">/ {currentAidStats.total} KK</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
                <div 
                  className={`h-full transition-colors duration-500 ${currentAidStats.pct === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                  style={{ width: `${currentAidStats.pct}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Sembako Murah Financial Summary Banner (If applicable) */}
          {isTebus && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">Biaya Tebus per Paket</span>
                <div className="text-lg sm:text-xl font-black font-mono text-emerald-900 mt-0.5">
                  Rp {(currentAid.packagePrice || 0).toLocaleString('id-ID')}
                </div>
                {currentAid.marketPrice ? (
                  <span className="text-[10px] text-emerald-700">Pasaran: Rp {currentAid.marketPrice.toLocaleString('id-ID')}</span>
                ) : null}
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">Total Kas Terkumpul</span>
                <div className="text-lg sm:text-xl font-black font-mono text-emerald-900 mt-0.5">
                  Rp {currentAidStats.totalRevenue.toLocaleString('id-ID')}
                </div>
                <span className="text-[10px] text-emerald-700">{currentAidStats.paid} KK telah membayar</span>
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">Belum Lunas Bayar</span>
                <div className="text-lg sm:text-xl font-black font-mono text-rose-600 mt-0.5">
                  {currentAidStats.unpaid} KK
                </div>
                <span className="text-[10px] text-slate-500">Menunggu pembayaran</span>
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">Gratis Khusus Dhuafa</span>
                <div className="text-lg sm:text-xl font-black font-mono text-indigo-700 mt-0.5">
                  {currentAidStats.waived} KK
                </div>
                <span className="text-[10px] text-slate-500">Bebas biaya tebus</span>
              </div>
            </div>
          )}

          {/* Recipient Checklist Workspace (Full Width Table) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <UserCheck size={18} className="text-emerald-600" />
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Daftar Warga Penerima ({currentAid.recipients?.length || 0} KK)
                </h3>
              </div>

              {/* Filters for Recipients inside this program */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[220px]">
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
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${recipientFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setRecipientFilter('pending')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${recipientFilter === 'pending' ? 'bg-white text-amber-800 shadow-2xs' : 'text-slate-500'}`}
                  >
                    Belum Ambil
                  </button>
                  <button
                    onClick={() => setRecipientFilter('received')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${recipientFilter === 'received' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500'}`}
                  >
                    Sudah Diterima
                  </button>
                  {isTebus && (
                    <>
                      <button
                        onClick={() => setRecipientFilter('unpaid')}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${recipientFilter === 'unpaid' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-500'}`}
                      >
                        Belum Bayar
                      </button>
                      <button
                        onClick={() => setRecipientFilter('paid')}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${recipientFilter === 'paid' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'}`}
                      >
                        Lunas Bayar
                      </button>
                    </>
                  )}
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
                      <th className="py-3 px-3.5 w-32">Kategori</th>
                      {isTebus && <th className="py-3 px-3.5 w-44">Status Bayar</th>}
                      <th className="py-3 px-3.5 w-52">Serah Terima</th>
                      <th className="py-3 px-3.5 w-36 text-center">Aksi WA &amp; Status</th>
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

                          {/* Kolom Status Bayar khusus Sembako Murah */}
                          {isTebus && (
                            <td className="py-3 px-3.5">
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={r.paymentStatus || 'Belum Bayar'}
                                  onChange={(e) => handleUpdatePaymentStatus(r, e.target.value as any)}
                                  className={`px-2 py-1 text-[11px] font-bold rounded-lg border cursor-pointer ${
                                    r.paymentStatus === 'Lunas'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : r.paymentStatus === 'Gratis'
                                      ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                      : 'bg-rose-50 text-rose-800 border-rose-300'
                                  }`}
                                >
                                  <option value="Belum Bayar">❌ Belum Bayar</option>
                                  <option value="Lunas">✅ Lunas (Tunai)</option>
                                  <option value="Gratis">🎁 Gratis (Dhuafa)</option>
                                </select>
                              </div>
                            </td>
                          )}

                          {/* Kolom Status Serah Terima */}
                          <td className="py-3 px-3.5">
                            {isInlineEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  placeholder="Nama pengambil..."
                                  value={inlineHandoverName}
                                  onChange={e => setInlineHandoverName(e.target.value)}
                                  className="px-2 py-1 text-xs border border-emerald-400 rounded-lg focus:outline-none bg-white w-32"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleToggleHandover(r, true, inlineHandoverName)}
                                  className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 cursor-pointer"
                                  title="Simpan Serah Terima"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => setInlineHandoverHouseId(null)}
                                  className="p-1 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 cursor-pointer"
                                  title="Batal"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : isReceived ? (
                              <div>
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold text-xs">
                                  <Check size={13} className="stroke-[3]" />
                                  <span>Diterima</span>
                                </span>
                                <p className="text-[10px] text-slate-500 truncate max-w-[170px]" title={r.receivedBy || r.headOfFamily}>
                                  Oleh: <strong className="text-slate-800">{r.receivedBy || r.headOfFamily}</strong>
                                </p>
                                {r.receivedAt && (
                                  <p className="text-[9px] text-slate-400 font-mono">
                                    {new Date(r.receivedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WITA
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-600 font-medium text-xs">
                                <Clock size={12} />
                                <span>Belum Diambil</span>
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
                                  title="Kirim Panggilan Pengambilan via WhatsApp"
                                >
                                  <Phone size={13} />
                                </button>
                              )}

                              {isReceived ? (
                                <button
                                  onClick={() => handleToggleHandover(r, false)}
                                  className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                                  title="Kembalikan ke status Menunggu"
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
                                  <span>Tandai</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredRecipients.length === 0 && (
                      <tr>
                        <td colSpan={isTebus ? 7 : 6} className="py-8 text-center text-slate-400 text-xs">
                          Tidak ada warga penerima yang cocok dengan filter.
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
  // VIEW MODE: LIST (FULL VIEW - DIRECTORY OF ALL AID PROGRAMS)
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
              Penyaluran Bantuan &amp; Sembako Warga
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Manajemen komprehensif program bantuan sosial cuma-cuma (Beras Bulog, BLT, PKH) dan pasar sembako murah bersubsidi warga. Dilengkapi bukti tanda terima digital &amp; berita acara resmi RT 02.
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
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Kas Tebus Murah</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-emerald-700">
            Rp {metrics.totalTebusRevenue.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Dana masuk subsidi sembako</p>
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
              onClick={() => setStatusFilter('gratis')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 ${statusFilter === 'gratis' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Bansos Gratis
            </button>
            <button
              onClick={() => setStatusFilter('tebus_murah')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 ${statusFilter === 'tebus_murah' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Sembako Murah
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari program bantuan / sumber..."
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
          const isTebus = aid.programType === 'tebus_murah';

          return (
            <div
              key={aid.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/90 hover:border-amber-300 shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Header Tag & Menu */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                      isTebus 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {isTebus ? 'Sembako Murah' : 'Bansos Gratis'}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {aid.category}
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

                {/* Subsidized Price Tag (if Tebus Murah) */}
                {isTebus && (
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-800 font-bold uppercase">Harga Tebus Subsidi:</span>
                      <div className="text-sm font-black font-mono text-emerald-900">
                        Rp {(aid.packagePrice || 0).toLocaleString('id-ID')} <span className="text-[10px] font-normal text-slate-500">/ {aid.unit || 'paket'}</span>
                      </div>
                    </div>
                    {aid.marketPrice && aid.marketPrice > (aid.packagePrice || 0) && (
                      <span className="text-[10px] font-extrabold bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded-md">
                        Hemat {Math.round(((aid.marketPrice - (aid.packagePrice || 0)) / aid.marketPrice) * 100)}%
                      </span>
                    )}
                  </div>
                )}

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
                Mulai catat program bantuan pangan gratis (Beras Bulog/BLT) atau pasar sembako murah bersubsidi warga dengan mengklik tombol di atas.
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
