import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, Users, Calendar, Clock, AlertTriangle, CheckCircle2, Phone, Search, 
  Plus, Filter, Download, Printer, ExternalLink, Share2, Eye, Edit, Trash2, 
  X, RefreshCw, MessageSquare, AlertCircle, ShieldCheck, MapPin, UserCheck, 
  Check, Building, HelpCircle, FileText, Send
} from 'lucide-react';
import { RentalContract, House } from '../../types';
import { subscribeToCollection, addToCollection, updateDocumentInCollection, deleteDocumentFromCollection } from '../../services/databaseService';
import { Modal } from '../ui/Modal';
import { toast } from 'sonner';

export const INITIAL_RENTAL_CONTRACTS: RentalContract[] = [
  {
    id: 'rent-tondo-01',
    houseId: 'C10-05',
    block: 'C10',
    number: '05',
    ownerName: 'Hendra Wijaya',
    ownerPhone: '081245678901',
    ownerAddress: 'Jl. Sam Ratulangi, Palu Barat',
    tenantName: 'Andi Pratama, S.T.',
    tenantPhone: '082198765432',
    tenantNik: '7271012304950002',
    tenantKkNumber: '7271010508190004',
    occupantsCount: 2,
    originCity: 'Kab. Tolitoli',
    workOrStudy: 'Mahasiswa Pascasarjana UNTAD & Wiraswasta',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    rentType: 'Tahunan',
    rentPrice: 12000000,
    depositAmount: 1000000,
    status: 'Aktif',
    verificationStatus: 'Terverifikasi',
    reportedBy: 'Pengurus RT',
    notes: 'Keluarga baru, suami istri. Telah menyerahkan fotokopi KTP dan KK ke pos ronda.',
    createdAt: '2026-01-02T08:00:00.000Z'
  },
  {
    id: 'rent-tondo-02',
    houseId: 'B04-12',
    block: 'B04',
    number: '12',
    ownerName: 'Ibu Hj. Fatimah',
    ownerPhone: '085233445566',
    ownerAddress: 'Huntap Tondo 1 Blok D',
    tenantName: 'Rahmat Hidayat',
    tenantPhone: '081311223344',
    tenantNik: '7371101506880003',
    tenantKkNumber: '7371102001140001',
    occupantsCount: 4,
    originCity: 'Kota Makassar',
    workOrStudy: 'Karyawan Proyek Konstruksi & Keluarga',
    startDate: '2025-10-01',
    endDate: '2026-09-30',
    rentType: 'Tahunan',
    rentPrice: 11000000,
    status: 'Mendekati Habis',
    verificationStatus: 'Terverifikasi',
    reportedBy: 'Pemilik',
    notes: 'Masa sewa tersisa kurang dari 30 hari. Perlu konfirmasi perpanjangan atau pindah.',
    createdAt: '2025-10-01T10:00:00.000Z'
  },
  {
    id: 'rent-tondo-03',
    houseId: 'A02-07',
    block: 'A02',
    number: '07',
    ownerName: 'Bpk. Wahyu Nugroho',
    ownerPhone: '081399887766',
    ownerAddress: 'Jl. Tombolotutu No. 44, Palu',
    tenantName: 'Dimas Satria',
    tenantPhone: '085366778899',
    tenantNik: '7201081402970001',
    occupantsCount: 3,
    originCity: 'Kab. Banggai',
    workOrStudy: 'Staf IT Swasta',
    startDate: '2025-08-15',
    endDate: '2026-08-15',
    rentType: 'Tahunan',
    rentPrice: 10500000,
    status: 'Habis',
    verificationStatus: 'Terverifikasi',
    reportedBy: 'Pengurus RT',
    notes: 'Masa sewa telah jatuh tempo. Pemilik belum memberikan kabar pembaruan kontrak.',
    createdAt: '2025-08-15T09:00:00.000Z'
  },
  {
    id: 'rent-tondo-04',
    houseId: 'C08-02',
    block: 'C08',
    number: '02',
    ownerName: 'Pak Syamsul Bahri',
    ownerPhone: '082233119900',
    ownerAddress: 'Huntap Tondo 2 Blok A01 No. 03',
    tenantName: '-',
    tenantPhone: '-',
    occupantsCount: 0,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    rentType: 'Tahunan',
    status: 'Kosong',
    verificationStatus: 'Terverifikasi',
    reportedBy: 'Pemilik',
    notes: 'Rumah kontrakan siap huni. Sedang ditawarkan sewa.',
    createdAt: '2026-02-01T14:00:00.000Z'
  },
  {
    id: 'rent-tondo-05',
    houseId: 'D03-08',
    block: 'D03',
    number: '08',
    ownerName: 'Ibu Ratna Dewi',
    ownerPhone: '081299001122',
    ownerAddress: 'Jl. Ki Hajar Dewantara, Palu Timur',
    tenantName: 'Fajar Nugraha',
    tenantPhone: '081234556677',
    occupantsCount: 3,
    originCity: 'Kab. Poso',
    workOrStudy: 'Teknisi Telekomunikasi',
    startDate: '2026-09-01',
    endDate: '2027-08-31',
    rentType: 'Tahunan',
    rentPrice: 12500000,
    status: 'Aktif',
    verificationStatus: 'Menunggu Verifikasi',
    reportedBy: 'Penyewa',
    reporterName: 'Fajar Nugraha',
    reporterPhone: '081234556677',
    notes: 'Lapor mandiri via portal Teras Warga. Menunggu pengecekan KTP oleh Ketua RT / Sekretaris.',
    createdAt: '2026-09-02T11:20:00.000Z'
  }
];

interface RentalManagerProps {
  houses?: House[];
}

export const RentalManager: React.FC<RentalManagerProps> = ({ houses = [] }) => {
  const [rentals, setRentals] = useState<RentalContract[]>(INITIAL_RENTAL_CONTRACTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<RentalContract | null>(null);
  const [selectedRentalForWa, setSelectedRentalForWa] = useState<RentalContract | null>(null);
  const [selectedRentalForPrint, setSelectedRentalForPrint] = useState<RentalContract | null>(null);
  const [waRecipientType, setWaRecipientType] = useState<'owner' | 'tenant'>('tenant');
  const [waTemplateType, setWaTemplateType] = useState<'expiring' | 'id_verification' | 'expired_check' | 'custom'>('expiring');
  const [customWaText, setCustomWaText] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<RentalContract>>({
    houseId: '',
    block: 'C10',
    number: '01',
    ownerName: '',
    ownerPhone: '',
    ownerAddress: '',
    tenantName: '',
    tenantPhone: '',
    tenantNik: '',
    tenantKkNumber: '',
    occupantsCount: 1,
    originCity: '',
    workOrStudy: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    rentType: 'Tahunan',
    rentPrice: 0,
    depositAmount: 0,
    status: 'Aktif',
    verificationStatus: 'Terverifikasi',
    notes: ''
  });

  // Real-time subscription to rentalContracts collection
  useEffect(() => {
    const unsub = subscribeToCollection('rentalContracts', (data) => {
      if (data && data.length > 0) {
        setRentals(data as RentalContract[]);
      } else {
        setRentals(INITIAL_RENTAL_CONTRACTS);
      }
    });
    return () => unsub();
  }, []);

  // Compute live dynamic status based on dates
  const calculateEffectiveStatus = (r: RentalContract): 'Aktif' | 'Mendekati Habis' | 'Habis' | 'Kosong' | 'Pindah' => {
    if (r.status === 'Kosong' || r.status === 'Pindah') return r.status;
    if (!r.endDate) return r.status;

    const now = new Date();
    const end = new Date(r.endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Habis';
    if (diffDays <= 30) return 'Mendekati Habis';
    return 'Aktif';
  };

  // KPIs
  const stats = useMemo(() => {
    let totalHouses = rentals.length;
    let activeTenants = 0;
    let totalOccupants = 0;
    let expiringSoon = 0;
    let expired = 0;
    let pendingVerification = 0;
    let vacant = 0;

    rentals.forEach((r) => {
      const effStatus = calculateEffectiveStatus(r);
      if (r.verificationStatus === 'Menunggu Verifikasi') {
        pendingVerification++;
      }
      if (effStatus === 'Kosong') {
        vacant++;
      } else if (effStatus === 'Habis') {
        expired++;
      } else if (effStatus === 'Mendekati Habis') {
        expiringSoon++;
        activeTenants++;
        totalOccupants += Number(r.occupantsCount || 0);
      } else if (effStatus === 'Aktif') {
        activeTenants++;
        totalOccupants += Number(r.occupantsCount || 0);
      }
    });

    return { totalHouses, activeTenants, totalOccupants, expiringSoon, expired, pendingVerification, vacant };
  }, [rentals]);

  // Filtered List
  const filteredRentals = useMemo(() => {
    return rentals.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || (
        r.houseId.toLowerCase().includes(q) ||
        r.tenantName.toLowerCase().includes(q) ||
        r.ownerName.toLowerCase().includes(q) ||
        (r.originCity && r.originCity.toLowerCase().includes(q)) ||
        (r.workOrStudy && r.workOrStudy.toLowerCase().includes(q)) ||
        r.ownerPhone.includes(q) ||
        r.tenantPhone.includes(q)
      );

      if (!matchQuery) return false;

      const effStatus = calculateEffectiveStatus(r);
      if (filterStatus === 'ALL') return true;
      if (filterStatus === 'PENDING') return r.verificationStatus === 'Menunggu Verifikasi';
      if (filterStatus === 'AKTIF') return effStatus === 'Aktif';
      if (filterStatus === 'EXPIRING') return effStatus === 'Mendekati Habis';
      if (filterStatus === 'EXPIRED') return effStatus === 'Habis';
      if (filterStatus === 'KOSONG') return effStatus === 'Kosong';

      return true;
    });
  }, [rentals, searchQuery, filterStatus]);

  // Open Form for Adding New Rental
  const handleOpenAdd = () => {
    setEditingRental(null);
    setFormData({
      houseId: '',
      block: 'C10',
      number: '01',
      ownerName: '',
      ownerPhone: '',
      ownerAddress: '',
      tenantName: '',
      tenantPhone: '',
      tenantNik: '',
      tenantKkNumber: '',
      occupantsCount: 1,
      originCity: '',
      workOrStudy: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      rentType: 'Tahunan',
      rentPrice: 0,
      depositAmount: 0,
      status: 'Aktif',
      verificationStatus: 'Terverifikasi',
      notes: ''
    });
    setIsModalOpen(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (rental: RentalContract) => {
    setEditingRental(rental);
    setFormData({ ...rental });
    setIsModalOpen(true);
  };

  // Save or Update Rental
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.houseId || !formData.ownerName) {
      toast.error('Mohon lengkapi nomor rumah dan nama pemilik.');
      return;
    }

    const payload: Partial<RentalContract> = {
      ...formData,
      houseId: formData.houseId.toUpperCase(),
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingRental) {
        await updateDocumentInCollection('rentalContracts', editingRental.id, payload);
        toast.success('Data rumah sewa berhasil diperbarui!');
      } else {
        payload.id = `rent-${Date.now()}`;
        payload.createdAt = new Date().toISOString();
        await addToCollection('rentalContracts', payload as RentalContract);
        toast.success('Data rumah sewa baru berhasil ditambahkan!');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan data ke database.');
    }
  };

  // Delete Rental
  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus catatan kontrakan ini dari arsip RT?')) return;
    try {
      await deleteDocumentFromCollection('rentalContracts', id);
      toast.success('Catatan rumah sewa telah dihapus.');
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus data.');
    }
  };

  // Verify / Approve self-reported rental
  const handleVerifyStatus = async (rental: RentalContract, status: 'Terverifikasi' | 'Ditolak') => {
    try {
      await updateDocumentInCollection('rentalContracts', rental.id, {
        verificationStatus: status,
        updatedAt: new Date().toISOString()
      });
      toast.success(`Laporan hunian sewa berhasil ditandai: ${status}`);
    } catch (err) {
      toast.error('Gagal memperbarui status verifikasi.');
    }
  };

  // Export to Excel / CSV
  const handleExportCSV = () => {
    if (filteredRentals.length === 0) {
      toast.error('Tidak ada data untuk diekspor.');
      return;
    }

    const headers = [
      'No. Rumah', 'Blok', 'Nomor', 'Nama Pemilik', 'No HP Pemilik', 'Alamat Pemilik',
      'Nama Penyewa', 'No HP Penyewa', 'NIK Penyewa', 'Jumlah Jiwa', 'Asal Daerah',
      'Pekerjaan/Kampus', 'Tgl Mulai Sewa', 'Tgl Akhir Sewa', 'Jenis Sewa', 'Biaya Sewa',
      'Status Kontrak', 'Verifikasi', 'Catatan'
    ];

    const rows = filteredRentals.map((r) => [
      `"${r.houseId}"`,
      `"${r.block}"`,
      `"${r.number}"`,
      `"${r.ownerName}"`,
      `"${r.ownerPhone}"`,
      `"${r.ownerAddress || '-'}"`,
      `"${r.tenantName || '-'}"`,
      `"${r.tenantPhone || '-'}"`,
      `"${r.tenantNik || '-'}"`,
      r.occupantsCount || 0,
      `"${r.originCity || '-'}"`,
      `"${r.workOrStudy || '-'}"`,
      `"${r.startDate}"`,
      `"${r.endDate}"`,
      `"${r.rentType}"`,
      r.rentPrice || 0,
      `"${calculateEffectiveStatus(r)}"`,
      `"${r.verificationStatus}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Rumah_Sewa_RT02_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('File CSV Rekapitulasi Kontrakan berhasil diunduh!');
  };

  // Open WhatsApp Modal
  const handleOpenWaModal = (rental: RentalContract, recipient: 'owner' | 'tenant') => {
    setSelectedRentalForWa(rental);
    setWaRecipientType(recipient);
    setIsWaModalOpen(true);
  };

  // Send WhatsApp message
  const handleSendWa = () => {
    if (!selectedRentalForWa) return;
    const r = selectedRentalForWa;
    const phone = waRecipientType === 'owner' ? r.ownerPhone : r.tenantPhone;

    if (!phone || phone === '-') {
      toast.error(`Nomor WhatsApp ${waRecipientType === 'owner' ? 'Pemilik' : 'Penyewa'} belum tersedia.`);
      return;
    }

    let targetPhone = phone.replace(/[^0-9]/g, '');
    if (targetPhone.startsWith('0')) {
      targetPhone = '62' + targetPhone.substring(1);
    }

    let message = '';
    const formattedEnd = new Date(r.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    if (waRecipientType === 'tenant') {
      if (waTemplateType === 'expiring') {
        message = 
`Halo Bapak/Ibu *${r.tenantName}*, salam hangat dari Pengurus RT 002 / RW 020 Huntap Tondo 2.

Menindaklanjuti tertib administrasi kependudukan dan hunian sewa di lingkungan RT 02, kami menginformasikan bahwa masa sewa rumah Anda di *Blok ${r.houseId}* tercatat akan berakhir pada *${formattedEnd}*.

Mohon kesediaannya untuk mengonfirmasi ke pengurus RT apakah masa kontrak akan diperpanjang atau akan berpindah domisili. Terima kasih atas kerjasamanya menjaga kerukunan dan ketertiban lingkungan TERAS RT 02.

_Ketua RT 002 Huntap Tondo 2_
_Narahubung: +62 859-6119-4621_`;
      } else if (waTemplateType === 'id_verification') {
        message = 
`Halo Bapak/Ibu *${r.tenantName}*, salam hangat dari Pengurus RT 002 / RW 020 Huntap Tondo 2.

Terkait aturan wajib lapor warga sewa/penghuni baru 1x24 jam di rumah *Blok ${r.houseId}*, mohon kesediaannya mengirimkan foto KTP seluruh penghuni dewasa dan Kartu Keluarga (KK) ke kontak pengurus RT ini untuk verifikasi buku induk kependudukan RT 002.

Data Anda terjamin kerahasiaannya dan hanya digunakan untuk keperluan pelayanan warga & keamanan lingkungan. Terima kasih banyak.

_Pengurus RT 002 Huntap Tondo 2_`;
      } else {
        message = customWaText || `Halo Bapak/Ibu ${r.tenantName}, salam dari Pengurus RT 002 Huntap Tondo 2 mengenai rumah di Blok ${r.houseId}.`;
      }
    } else {
      // Owner
      if (waTemplateType === 'expiring' || waTemplateType === 'expired_check') {
        message = 
`Yth. Bapak/Ibu *${r.ownerName}* (Pemilik Rumah Sewa Blok ${r.houseId}), salam dari Pengurus RT 002 Huntap Tondo 2.

Berdasarkan buku registrasi kontrakan RT 002, masa sewa rumah milik Bapak/Ibu yang saat ini ditempati oleh Bapak/Ibu *${r.tenantName}* tercatat jatuh tempo / berakhir pada *${formattedEnd}*.

Mohon konfirmasinya apakah penyewa melanjutkan masa kontrak, atau rumah tersebut akan dikosongkan/berganti penyewa baru. Jika ada pergantian penghuni, mohon ingatkan penyewa baru untuk lapor 1x24 jam ke pengurus RT.

Terima kasih atas sinergi Bapak/Ibu.
_Pengurus RT 002 Huntap Tondo 2_`;
      } else {
        message = customWaText || `Yth. Bapak/Ibu ${r.ownerName}, salam dari Pengurus RT 002 Huntap Tondo 2 mengenai rumah kontrakan di Blok ${r.houseId}.`;
      }
    }

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?phone=${targetPhone}&text=${encoded}`, '_blank');
    setIsWaModalOpen(false);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-indigo-900/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase tracking-widest">
              <Building size={12} className="text-indigo-400" />
              <span>Pengawasan &amp; Registrasi Hunian Sewa</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-serif">
              Buku Registrasi Kontrakan &amp; Rumah Sewa
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Pusat monitoring tertib hunian sewa RT 002 Huntap Tondo 2. Menghubungkan kontak pemilik asli (induk semang) dengan data penyewa aktif, periode masa kontrak, dan verifikasi berkas KTP/KK.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-wider border border-white/10 transition-all cursor-pointer"
            >
              <Download size={15} />
              <span>Ekspor CSV</span>
            </button>

            <button
              onClick={() => {
                setSelectedRentalForPrint(filteredRentals[0] || rentals[0]);
                setIsPrintModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-wider border border-white/10 transition-all cursor-pointer"
            >
              <Printer size={15} />
              <span>Cetak Rekap A4</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Tambah Rumah Sewa</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Rumah Kontrakan</span>
            <span className="text-xl font-black text-white mt-0.5 block">{stats.totalHouses} Unit</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Penyewa Aktif (Total Jiwa)</span>
            <span className="text-xl font-black text-emerald-400 mt-0.5 block">
              {stats.activeTenants} KK ({stats.totalOccupants} Jiwa)
            </span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kontrak Segera Berakhir</span>
            <span className="text-xl font-black text-amber-400 mt-0.5 block">{stats.expiringSoon} Unit</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lapor Mandiri Baru</span>
            <span className={`text-xl font-black mt-0.5 block ${stats.pendingVerification > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
              {stats.pendingVerification} Menunggu
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari rumah sewa (misal: C10-05, nama penyewa, nama pemilik, asal daerah, no WA)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Semua Hunian' },
            { id: 'AKTIF', label: '🟢 Aktif' },
            { id: 'EXPIRING', label: '🟡 Akan Habis' },
            { id: 'EXPIRED', label: '🔴 Jatuh Tempo' },
            { id: 'PENDING', label: '⏳ Lapor Baru' },
            { id: 'KOSONG', label: '⚪ Rumah Kosong' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                filterStatus === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRentals.length > 0 ? (
          filteredRentals.map((r) => {
            const effStatus = calculateEffectiveStatus(r);
            const isPending = r.verificationStatus === 'Menunggu Verifikasi';
            
            return (
              <div
                key={r.id}
                className="bg-white rounded-[2rem] border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Unit & Statuses */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-sm">
                        {r.houseId}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Unit Sewa</span>
                        <h4 className="font-black text-slate-900 text-sm font-serif">
                          Blok {r.block} No. {r.number}
                        </h4>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 justify-end">
                      {isPending && (
                        <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-xl text-[10px] font-black uppercase tracking-wider animate-pulse">
                          Verifikasi RT
                        </span>
                      )}

                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                        effStatus === 'Aktif' ? 'bg-emerald-100 text-emerald-800' :
                        effStatus === 'Mendekati Habis' ? 'bg-amber-100 text-amber-900' :
                        effStatus === 'Habis' ? 'bg-rose-100 text-rose-800' :
                        effStatus === 'Kosong' ? 'bg-slate-100 text-slate-700' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {effStatus}
                      </span>
                    </div>
                  </div>

                  {/* Tenant and Owner Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                    {/* Penyewa */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/80 space-y-1">
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                        <Users size={11} /> Penyewa Aktif:
                      </span>
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {r.tenantName || '(Belum Ada Penyewa)'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {r.occupantsCount ? `${r.occupantsCount} Jiwa Penghuni` : '-'}
                      </p>
                      {r.originCity && (
                        <p className="text-[10px] text-slate-400 font-medium truncate">
                          Asal: {r.originCity}
                        </p>
                      )}
                      {r.workOrStudy && (
                        <p className="text-[10px] text-slate-400 font-medium truncate">
                          {r.workOrStudy}
                        </p>
                      )}
                    </div>

                    {/* Pemilik / Induk Semang */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/80 space-y-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <Home size={11} /> Pemilik (Induk Semang):
                      </span>
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {r.ownerName}
                      </p>
                      <p className="text-[11px] text-slate-600 font-medium truncate">
                        WA: {r.ownerPhone || '-'}
                      </p>
                      {r.ownerAddress && (
                        <p className="text-[10px] text-slate-400 font-medium truncate">
                          Domisili: {r.ownerAddress}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contract Timeline */}
                  <div className="mt-3 p-3 bg-indigo-50/40 rounded-2xl border border-indigo-100/60 flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-indigo-600" />
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Masa Kontrak</span>
                        <span className="font-bold text-slate-800 text-[11px]">
                          {new Date(r.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} s/d {new Date(r.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 bg-white rounded-lg text-indigo-700 border border-indigo-100">
                      {r.rentType}
                    </span>
                  </div>

                  {/* Notes */}
                  {r.notes && (
                    <p className="text-[11px] text-slate-500 mt-2.5 italic bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                      * {r.notes}
                    </p>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-3 border-t border-slate-100 space-y-2 mt-2">
                  {/* Approval Actions for Pending */}
                  {isPending && (
                    <div className="flex items-center justify-between p-2 bg-rose-50 rounded-xl border border-rose-200/80 mb-2">
                      <span className="text-[11px] font-bold text-rose-900">
                        Lapor Mandiri dari Warga
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleVerifyStatus(r, 'Terverifikasi')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => handleVerifyStatus(r, 'Ditolak')}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer"
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* WA Trigger buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenWaModal(r, 'tenant')}
                        disabled={!r.tenantPhone || r.tenantPhone === '-'}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[11px] font-bold transition-all disabled:opacity-40 cursor-pointer"
                        title="Hubungi Penyewa"
                      >
                        <MessageSquare size={12} />
                        <span>WA Penyewa</span>
                      </button>

                      <button
                        onClick={() => handleOpenWaModal(r, 'owner')}
                        disabled={!r.ownerPhone || r.ownerPhone === '-'}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[11px] font-bold transition-all disabled:opacity-40 cursor-pointer"
                        title="Hubungi Pemilik / Induk Semang"
                      >
                        <Phone size={12} />
                        <span>WA Pemilik</span>
                      </button>
                    </div>

                    {/* Edit & Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(r)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                        title="Edit Data Kontrakan"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="Hapus Catatan"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-slate-200">
            <Building size={40} className="text-slate-300 mx-auto mb-3" />
            <h4 className="font-black text-slate-800 text-base">Tidak Ada Data Rumah Sewa</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tidak ditemukan data yang sesuai dengan kata kunci atau filter status sewa saat ini.
            </p>
          </div>
        )}
      </div>

      {/* MODAL: Tambah / Edit Data Kontrakan */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRental ? "Edit Data Rumah Sewa & Kontrakan" : "Tambah Registrasi Rumah Sewa"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 p-1 text-left">
          {/* Section 1: Rumah & Pemilik */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Home size={14} className="text-indigo-600" />
              1. Identitas Rumah &amp; Pemilik Asli (Induk Semang)
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">No. Rumah / Kode *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: C10-05"
                  value={formData.houseId || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const parts = val.split('-');
                    setFormData({
                      ...formData,
                      houseId: val,
                      block: parts[0] || 'C10',
                      number: parts[1] || '01'
                    });
                  }}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 uppercase"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600">Nama Pemilik Rumah *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Pemilik / Induk Semang"
                  value={formData.ownerName || ''}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">No. HP / WA Pemilik *</label>
                <input
                  type="text"
                  required
                  placeholder="0812xxxxxxxx"
                  value={formData.ownerPhone || ''}
                  onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600">Alamat Tempat Tinggal Pemilik</label>
                <input
                  type="text"
                  placeholder="Domisili pemilik jika tinggal di luar RT"
                  value={formData.ownerAddress || ''}
                  onChange={(e) => setFormData({ ...formData, ownerAddress: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Penyewa Aktif */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Users size={14} className="text-emerald-600" />
              2. Data Penyewa Aktif (Penanggung Jawab Hunian)
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Nama Kepala Keluarga Penyewa</label>
                <input
                  type="text"
                  placeholder="Kosongkan jika rumah kosong"
                  value={formData.tenantName || ''}
                  onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">No. HP / WA Penyewa</label>
                <input
                  type="text"
                  placeholder="08xxxxxxxx"
                  value={formData.tenantPhone || ''}
                  onChange={(e) => setFormData({ ...formData, tenantPhone: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">NIK KTP Penyewa</label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="16 Digit NIK KTP"
                  value={formData.tenantNik || ''}
                  onChange={(e) => setFormData({ ...formData, tenantNik: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Jumlah Jiwa Yang Menghuni</label>
                <input
                  type="number"
                  min={0}
                  value={formData.occupantsCount || 0}
                  onChange={(e) => setFormData({ ...formData, occupantsCount: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Kota / Daerah Asal</label>
                <input
                  type="text"
                  placeholder="Contoh: Kab. Tolitoli / Makassar"
                  value={formData.originCity || ''}
                  onChange={(e) => setFormData({ ...formData, originCity: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Pekerjaan / Instansi / Kampus</label>
                <input
                  type="text"
                  placeholder="Contoh: Karyawan BUMN / Mahasiswa UNTAD"
                  value={formData.workOrStudy || ''}
                  onChange={(e) => setFormData({ ...formData, workOrStudy: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Periode & Ketentuan */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Calendar size={14} className="text-amber-600" />
              3. Periode Masa Kontrak &amp; Status
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Tgl Mulai Sewa *</label>
                <input
                  type="date"
                  required
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Tgl Akhir Sewa *</label>
                <input
                  type="date"
                  required
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Periode Pembayaran</label>
                <select
                  value={formData.rentType || 'Tahunan'}
                  onChange={(e: any) => setFormData({ ...formData, rentType: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="Tahunan">Tahunan</option>
                  <option value="Bulanan">Bulanan</option>
                  <option value="Semesteran">Semesteran (6 Bulan)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Status Hunian</label>
                <select
                  value={formData.status || 'Aktif'}
                  onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="Aktif">🟢 Aktif Ditempati</option>
                  <option value="Mendekati Habis">🟡 Mendekati Habis</option>
                  <option value="Habis">🔴 Masa Sewa Habis</option>
                  <option value="Kosong">⚪ Rumah Kontrak Kosong</option>
                  <option value="Pindah">📦 Sudah Pindah Keluar</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600">Catatan Khusus / Perjanjian</label>
                <input
                  type="text"
                  placeholder="Misal: Sudah serah KTP, kunci di pos ronda, dsb."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              Simpan Data Kontrakan
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Kirim WhatsApp Cerdas ke Pemilik / Penyewa */}
      {selectedRentalForWa && (
        <Modal
          isOpen={isWaModalOpen}
          onClose={() => setIsWaModalOpen(false)}
          title={`Kirim Pesan WhatsApp Resmi RT`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 p-1 text-left">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">
                Unit: Blok {selectedRentalForWa.houseId}
              </p>
              <p className="text-slate-600">
                Tujuan: <strong>{waRecipientType === 'owner' ? `Pemilik (${selectedRentalForWa.ownerName})` : `Penyewa (${selectedRentalForWa.tenantName})`}</strong>
              </p>
              <p className="text-slate-500 text-[11px]">
                No. WA: {waRecipientType === 'owner' ? selectedRentalForWa.ownerPhone : selectedRentalForWa.tenantPhone}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Pilih Format Template Pesan:</label>
              <select
                value={waTemplateType}
                onChange={(e: any) => setWaTemplateType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {waRecipientType === 'tenant' ? (
                  <>
                    <option value="expiring">⏳ Pengingat Masa Sewa Segera Berakhir</option>
                    <option value="id_verification">🪪 Permintaan Foto KTP/KK (Wajib Lapor 1x24 Jam)</option>
                    <option value="custom">✏️ Tulis Pesan Kustom Sendiri</option>
                  </>
                ) : (
                  <>
                    <option value="expiring">⏳ Konfirmasi Masa Sewa Penyewa ke Pemilik</option>
                    <option value="custom">✏️ Tulis Pesan Kustom Sendiri</option>
                  </>
                )}
              </select>
            </div>

            {waTemplateType === 'custom' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Isi Pesan Kustom:</label>
                <textarea
                  rows={4}
                  placeholder="Tulis pesan pengurus RT di sini..."
                  value={customWaText}
                  onChange={(e) => setCustomWaText(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 resize-none outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsWaModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSendWa}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md cursor-pointer"
              >
                <Send size={14} />
                <span>Buka di WhatsApp</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Cetak Rekapitulasi Berkas A4 */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Cetak Berkas Rekapitulasi Kontrakan & Rumah Sewa A4"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4 p-1 text-left">
          {/* Printable Document Sheet */}
          <div id="print-canvas-rentals" className="p-8 bg-white border border-slate-300 rounded-2xl shadow-sm text-slate-900 space-y-6 font-serif">
            {/* Kop Surat RT */}
            <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
              <h2 className="text-base sm:text-lg font-black tracking-wider uppercase">
                RUKUN TETANGGA 002 / RUKUN WARGA 020
              </h2>
              <h3 className="text-xs sm:text-sm font-bold tracking-wide uppercase">
                KELURAHAN TONDO • KECAMATAN MANTIKULORE • KOTA PALU
              </h3>
              <p className="text-[11px] text-slate-600 font-sans">
                Kawasan Hunian Tetap (Huntap) Tondo 2, Kode Pos 94119 • Narahubung: +62 859-6119-4621
              </p>
            </div>

            {/* Title */}
            <div className="text-center space-y-1 font-sans">
              <h4 className="text-sm font-black uppercase underline tracking-wider">
                BUKU REGISTRASI &amp; REKAPITULASI HUNIAN SEWA / KONTRAKAN
              </h4>
              <p className="text-xs font-semibold text-slate-600">
                Pembaruan Data: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Table of Rentals */}
            <div className="overflow-x-auto font-sans">
              <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 text-[10px] font-black uppercase tracking-wider">
                    <th className="p-2 border border-slate-300 text-center">No</th>
                    <th className="p-2 border border-slate-300">Unit / Blok</th>
                    <th className="p-2 border border-slate-300">Nama Pemilik</th>
                    <th className="p-2 border border-slate-300">Kontak Pemilik</th>
                    <th className="p-2 border border-slate-300">Nama Penyewa</th>
                    <th className="p-2 border border-slate-300 text-center">Jiwa</th>
                    <th className="p-2 border border-slate-300">Masa Sewa</th>
                    <th className="p-2 border border-slate-300 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRentals.map((r, i) => {
                    const eff = calculateEffectiveStatus(r);
                    return (
                      <tr key={r.id} className="border-b border-slate-200">
                        <td className="p-2 border border-slate-300 text-center">{i + 1}</td>
                        <td className="p-2 border border-slate-300 font-bold">{r.houseId}</td>
                        <td className="p-2 border border-slate-300">{r.ownerName}</td>
                        <td className="p-2 border border-slate-300">{r.ownerPhone}</td>
                        <td className="p-2 border border-slate-300 font-semibold">{r.tenantName || '-'}</td>
                        <td className="p-2 border border-slate-300 text-center">{r.occupantsCount || 0}</td>
                        <td className="p-2 border border-slate-300 text-[10px]">
                          {new Date(r.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: '2y' })} - {new Date(r.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: '2y' })}
                        </td>
                        <td className="p-2 border border-slate-300 text-center">
                          <span className="font-bold text-[10px]">{eff}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Signature Section */}
            <div className="pt-8 grid grid-cols-2 text-center text-xs font-sans gap-8">
              <div className="space-y-16">
                <p>Mengetahui,<br/>Sekretaris RT 002</p>
                <div>
                  <p className="font-bold underline">Sekretariat RT 002</p>
                  <p className="text-[10px] text-slate-500">Kel. Tondo, Kec. Mantikulore</p>
                </div>
              </div>

              <div className="space-y-16">
                <p>Disahkan &amp; Diperiksa Oleh,<br/>Ketua RT 002 / RW 020</p>
                <div>
                  <p className="font-bold underline">Irfan</p>
                  <p className="text-[10px] text-slate-500">Ketua RT 002 Huntap Tondo 2</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md cursor-pointer"
            >
              <Printer size={14} />
              <span>Cetak Sekarang</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
