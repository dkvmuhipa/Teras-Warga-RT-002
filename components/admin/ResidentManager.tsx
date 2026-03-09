import React, { useState, useEffect } from 'react';
import { BillDetailModal } from './BillDetailModal';
import { ResidentAnalytics } from './ResidentAnalytics';
import { ResidentCard } from './ResidentCard';
import { 
  Search, Filter, Grid, List, UserPlus, Download, Upload, 
  Trash2, Edit2, MoreHorizontal, CheckCircle, XCircle, AlertCircle,
  Users, Home, X, Phone, Shield, Calendar, MapPin, Activity,
  ChevronRight, CreditCard, Mail, User, DollarSign, LayoutList
} from 'lucide-react';
import { House, Report, Official, PdfConfig, PaymentStatus, ResidentRegistration } from '../../types';
import { HouseMap } from '../HouseMap';
import { generateResidentReportPDF } from '../../services/pdfService';
import { batchUpdateHouses, deleteHouseFromDb, updateHouseData, addHouse, generateAllAccessCodes, addTransactionToDb, addIuranPaymentToDb, deleteIuranPaymentFromDb, updateResidentRegistrationInDb, deleteResidentRegistrationFromDb } from '../../services/databaseService';
import { generateExcelTemplate, parseExcelFile, generateProfessionalExcel } from '../../services/excelService';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'motion/react';

interface ResidentManagerProps {
  houses: House[];
  bills: any[];
  reports: Report[];
  officials: Official[];
  pdfConfig: PdfConfig;
  iuranPayments: any[];
  residentRegistrations: ResidentRegistration[];
}

type FilterStatus = 'all' | 'paid' | 'unpaid' | 'occupied' | 'empty' | 'business';

export const ResidentManager: React.FC<ResidentManagerProps> = ({ 
  houses, bills, reports, officials, pdfConfig, iuranPayments, residentRegistrations 
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'map' | 'iuran' | 'registrations'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHouseForBills, setSelectedHouseForBills] = useState<House | null>(null);
  const [filterStatus, setFilterStatus] = useState<any>('all');
  const [sortBy, setSortBy] = useState<'name' | 'block'>('block');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedResident, setSelectedResident] = useState<House | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payHouse, setPayHouse] = useState<House | null>(null);
  const [payType, setPayType] = useState<'Air' | 'Sampah' | 'Both'>('Both');
  const [payAmount, setPayAmount] = useState('10000');

  useEffect(() => {
    if (payType === 'Both') setPayAmount('20000');
    else setPayAmount('10000');
  }, [payType]);
  const [editingHouseId, setEditingHouseId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    headOfFamily: '',
    ownerName: '', // NEW: Nama Pemilik
    block: '',
    number: '',
    phone: '',
    status: 'Occupied',
    residenceType: 'Tetap', // Default to Tetap (Pemilik)
    paymentStatusAir: PaymentStatus.UNPAID,
    paymentStatusSampah: PaymentStatus.UNPAID,
    occupants: 1,
    education: '',
    jobCategory: '',
    vehicleCount: 0,
    pregnantCount: 0,
    babyCount: 0,
    toddlerCount: 0,
    elderlyCount: 0,
    widowCount: 0,
    familyMembers: [] as { name: string; relation: 'Istri' | 'Anak' | 'Orang Tua' | 'Famili Lain'; nik?: string; birthDate?: string }[],
    accessCode: ''
  });

  const handleGenerateAllPins = async () => {
    if (window.confirm('Apakah Anda yakin ingin meng-generate PIN untuk semua warga yang belum memiliki PIN?')) {
        setIsGenerating(true);
        try {
            const count = await generateAllAccessCodes(houses);
            if (count > 0) {
              alert(`PIN berhasil di-generate untuk ${count} warga yang belum memiliki PIN.`);
            } else {
              alert('Semua data warga sudah memiliki PIN. Tidak ada PIN baru yang di-generate.');
            }
        } catch (e) {
            console.error(e);
            alert('Gagal meng-generate PIN.');
        } finally {
            setIsGenerating(false);
        }
    }
  };

  const handleCleanupPlaceholders = async () => {
    if (window.confirm('Aksi ini akan mengubah status semua data dengan nama default "Warga [Blok]-[Nomor]" menjadi "Kosong" (Empty) dan mengosongkan detail data mereka. Lanjutkan?')) {
        setIsGenerating(true);
        try {
            const updates = houses
                .filter(h => {
                    // Check for exact match or case-insensitive match
                    const exactMatch = h.headOfFamily === `Warga ${h.block}-${h.number}`;
                    const caseInsensitiveMatch = h.headOfFamily.toLowerCase() === `warga ${h.block}-${h.number}`.toLowerCase();
                    
                    // Check for leading zero variations (e.g. "02" vs "2")
                    const num = parseInt(h.number);
                    const paddedNum = num < 10 ? `0${num}` : `${num}`;
                    const unpaddedNum = `${num}`;
                    
                    const matchPadded = h.headOfFamily.toLowerCase() === `warga ${h.block}-${paddedNum}`.toLowerCase();
                    const matchUnpadded = h.headOfFamily.toLowerCase() === `warga ${h.block}-${unpaddedNum}`.toLowerCase();
                    
                    // Check for variations with spaces (e.g. "Warga C5 - 02")
                    const matchWithSpaces = h.headOfFamily.toLowerCase().replace(/\s+/g, '') === `warga${h.block}-${paddedNum}`.toLowerCase();
                    const matchWithSpacesUnpadded = h.headOfFamily.toLowerCase().replace(/\s+/g, '') === `warga${h.block}-${unpaddedNum}`.toLowerCase();

                    // Check for "Warga Blok [Block] No [Number]" pattern
                    const matchVerbose = h.headOfFamily.toLowerCase() === `warga blok ${h.block} no ${paddedNum}`.toLowerCase() ||
                                         h.headOfFamily.toLowerCase() === `warga blok ${h.block} no ${unpaddedNum}`.toLowerCase();

                    // Check for "Rumah [Block]-[Number]" pattern (from previous resets)
                    const matchRumah = h.headOfFamily.toLowerCase() === `rumah ${h.block}-${paddedNum}`.toLowerCase() ||
                                       h.headOfFamily.toLowerCase() === `rumah ${h.block}-${unpaddedNum}`.toLowerCase();

                    return exactMatch || caseInsensitiveMatch || matchPadded || matchUnpadded || matchWithSpaces || matchWithSpacesUnpadded || matchVerbose || matchRumah;
                })
                .map(h => ({
                    id: h.id,
                    status: 'Empty',
                    headOfFamily: '', // Empty the name as requested
                    phone: '',
                    occupants: 0,
                    familyMembers: [],
                    paymentStatus: PaymentStatus.UNPAID
                }));

            if (updates.length === 0) {
                alert('Tidak ada data warga default yang ditemukan.');
                return;
            }

            await batchUpdateHouses(updates);
            alert(`Berhasil mereset ${updates.length} data rumah menjadi status Kosong.`);
        } catch (e) {
            console.error(e);
            alert('Gagal melakukan cleanup data.');
        } finally {
            setIsGenerating(false);
        }
    }
  };

  const handleDownloadTemplate = () => {
    generateExcelTemplate();
  };

  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (window.confirm('Apakah Anda yakin ingin mengupload data ini? Data yang sudah ada di sistem (berdasarkan Blok dan Nomor) akan diupdate dengan data dari file Excel ini.')) {
      setIsUploading(true);
      try {
        const parsedData = await parseExcelFile(file);
        
        let addedCount = 0;
        let updatedCount = 0;
        let failCount = 0;
        
        const updatesToApply: any[] = [];
        const addsToApply: any[] = [];

        for (const houseData of parsedData) {
          try {
            // Basic validation
            if (!houseData.block || !houseData.number) {
              console.warn('Skipping invalid row:', houseData);
              failCount++;
              continue;
            }

            // Check for existing block and number
            const existingHouse = houses.find(
              h => h.block.toLowerCase() === houseData.block?.toLowerCase() && 
                   h.number.toLowerCase() === houseData.number?.toLowerCase()
            );

            if (existingHouse) {
              // Update existing house
              const updates: any = { ...houseData };
              
              // Don't overwrite headOfFamily if it's empty in Excel
              if (!houseData.headOfFamily || houseData.headOfFamily === '-') {
                delete updates.headOfFamily;
              }

              // Check if there are actual changes
              let hasChanges = false;
              for (const key in updates) {
                if (key === 'block' || key === 'number') continue;
                
                const newValue = updates[key];
                const oldValue = (existingHouse as any)[key];
                
                if (newValue !== oldValue) {
                  hasChanges = true;
                  break;
                }
              }

              if (hasChanges) {
                updatesToApply.push({ id: existingHouse.id, ...updates });
              }
            } else {
              // Add new house
              addsToApply.push({
                ...houseData,
                headOfFamily: houseData.headOfFamily || '-',
                location: { x: 0, y: 0 },
                familyMembers: [],
                paymentStatusAir: houseData.paymentStatusAir || PaymentStatus.UNPAID,
                paymentStatusSampah: houseData.paymentStatusSampah || PaymentStatus.UNPAID,
                status: houseData.status || 'Occupied',
                occupants: houseData.occupants || 1,
                vehicleCount: houseData.vehicleCount || 0,
                pregnantCount: houseData.pregnantCount || 0,
                babyCount: houseData.babyCount || 0,
                toddlerCount: houseData.toddlerCount || 0,
                elderlyCount: houseData.elderlyCount || 0
              });
            }
          } catch (err) {
            console.error('Error processing house:', err);
            failCount++;
          }
        }

        // Apply updates in batch
        if (updatesToApply.length > 0) {
            await batchUpdateHouses(updatesToApply);
            updatedCount += updatesToApply.length;
        }

        // Apply additions
        for (const add of addsToApply) {
            await addHouse(add);
            addedCount++;
        }

        alert(`Upload selesai.\nData Baru Ditambahkan: ${addedCount}\nData Diperbarui: ${updatedCount}\nGagal/Format Salah: ${failCount}\nData Tidak Berubah: ${parsedData.length - addedCount - updatedCount - failCount}`);
      } catch (error) {
        console.error('Excel Parse Error:', error);
        alert('Gagal memproses file Excel.');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } else {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBulkVerify = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Apakah Anda yakin ingin memverifikasi ${selectedIds.size} warga terpilih?`)) {
        try {
            const updates = Array.from(selectedIds).map(id => ({ id, isVerified: true }));
            await batchUpdateHouses(updates);
            alert('Warga terpilih berhasil diverifikasi.');
            setSelectedIds(new Set());
        } catch (e) {
            console.error(e);
            alert('Gagal memverifikasi warga.');
        }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`PERINGATAN: Apakah Anda yakin ingin MENGHAPUS PERMANEN ${selectedIds.size} warga terpilih?`)) {
        try {
            for (const id of Array.from(selectedIds)) {
                await deleteHouseFromDb(id);
            }
            alert('Warga terpilih berhasil dihapus.');
            setSelectedIds(new Set());
        } catch (e) {
            console.error(e);
            alert('Gagal menghapus warga terpilih.');
        }
    }
  };

  const resetForm = () => {
    setFormData({
      headOfFamily: '',
      ownerName: '', // NEW: Reset ownerName
      block: '',
      number: '',
      phone: '',
      status: 'Occupied',
      residenceType: 'Tetap',
      paymentStatusAir: PaymentStatus.UNPAID,
      paymentStatusSampah: PaymentStatus.UNPAID,
      occupants: 1,
      education: '',
      jobCategory: '',
      vehicleCount: 0,
      pregnantCount: 0,
      babyCount: 0,
      toddlerCount: 0,
      elderlyCount: 0,
      widowCount: 0,
      familyMembers: [],
      accessCode: ''
    });
    setEditingHouseId(null);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payHouse) return;

    const updates: any = {};
    if (payType === 'Air' || payType === 'Both') updates.paymentStatusAir = PaymentStatus.PAID;
    if (payType === 'Sampah' || payType === 'Both') updates.paymentStatusSampah = PaymentStatus.PAID;

    try {
      await updateHouseData(payHouse.id, updates);
      
      // Record iuran payment separately
      await addIuranPaymentToDb({
        houseId: payHouse.id,
        headOfFamily: payHouse.headOfFamily,
        block: payHouse.block,
        number: payHouse.number,
        amount: parseInt(payAmount),
        type: payType,
        date: new Date().toISOString(),
        month: new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })
      });

      alert('Status iuran berhasil diperbarui dan dicatat!');
      setIsPayModalOpen(false);
      setPayHouse(null);
    } catch (error) {
      console.error(error);
      alert('Gagal memperbarui status iuran.');
    }
  };

  const openPayModal = (house: House) => {
    setPayHouse(house);
    setIsPayModalOpen(true);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (house: House) => {
    setEditingHouseId(house.id);
    setFormData({
      headOfFamily: house.headOfFamily,
      ownerName: house.ownerName || '', // NEW: Populate ownerName
      block: house.block,
      number: house.number,
      phone: house.phone || '',
      status: house.status,
      residenceType: house.residenceType || 'Tetap',
      paymentStatusAir: house.paymentStatusAir || PaymentStatus.UNPAID,
      paymentStatusSampah: house.paymentStatusSampah || PaymentStatus.UNPAID,
      occupants: house.occupants || 1,
      education: house.education || '',
      jobCategory: house.jobCategory || '',
      vehicleCount: house.vehicleCount || 0,
      pregnantCount: house.pregnantCount || 0,
      babyCount: house.babyCount || 0,
      toddlerCount: house.toddlerCount || 0,
      elderlyCount: house.elderlyCount || 0,
      widowCount: house.widowCount || 0,
      familyMembers: house.familyMembers || [],
      accessCode: house.accessCode || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        location: { x: 0, y: 0 } // Default location, map editor handles this separately
      };

      if (editingHouseId) {
        await updateHouseData(editingHouseId, data);
        if (selectedResident?.id === editingHouseId) {
            setSelectedResident({ ...selectedResident, ...data } as House);
        }
      } else {
        await addHouse(data);
      }
      setIsModalOpen(false);
      resetForm();
      alert('Data warga berhasil disimpan!');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan data warga.');
    }
  };

  // Filter Logic
  const filteredHouses = houses.filter(h => {
    const matchesSearch = h.headOfFamily.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          h.block.toLowerCase().includes(searchTerm.toLowerCase());
    
    const houseBills = bills.filter(b => b.houseId === h.id);
    const isFullyPaid = houseBills.length > 0 && houseBills.every(b => b.total === 0);
    const paymentStatus = isFullyPaid ? PaymentStatus.PAID : PaymentStatus.PENDING;

    let matchesStatus = true;
    if (filterStatus === 'paid') matchesStatus = paymentStatus === PaymentStatus.PAID;
    else if (filterStatus === 'unpaid') matchesStatus = paymentStatus === PaymentStatus.PENDING;
    else if (filterStatus === 'occupied') matchesStatus = h.status?.toLowerCase() === 'occupied';
    else if (filterStatus === 'empty') matchesStatus = h.status?.toLowerCase() === 'empty';
    else if (filterStatus === 'business') matchesStatus = h.status?.toLowerCase() === 'business';

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.headOfFamily.localeCompare(b.headOfFamily);
    return (a.block + a.number).localeCompare(b.block + b.number);
  });

  // Stats
  const totalResidents = houses.filter(h => h.status === 'Occupied').reduce((acc, h) => acc + (h.occupants || 0), 0);
  const occupiedHouses = houses.filter(h => h.status === 'Occupied').length;
  const emptyHouses = houses.filter(h => h.status === 'Empty').length;

  // Bulk Actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredHouses.map(h => h.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data warga ini?')) {
      await deleteHouseFromDb(id);
      if (selectedResident?.id === id) {
        setIsDrawerOpen(false);
        setSelectedResident(null);
      }
    }
  };

  const openDetail = (house: House) => {
    setSelectedResident(house);
    setIsDrawerOpen(true);
  };

  const selectedResidentBills = bills.filter(b => b.houseId === selectedResident?.id);
  const isFullyPaid = selectedResidentBills.length > 0 && selectedResidentBills.every(b => b.total === 0);

  const maskData = (data: string | undefined) => {
    if (!data) return '-';
    return data.replace(/.(?=.{4})/g, '*');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 relative"
    >
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Data Warga</h2>
          <p className="text-slate-500 font-medium mt-1">Kelola data kependudukan dan status hunian RT 002.</p>
        </div>
        <div className="flex gap-3">
          {selectedIds.size > 0 && (
            <>
              <button 
                onClick={handleBulkVerify}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl hover:bg-emerald-100 font-bold text-sm transition-all shadow-sm"
              >
                <CheckCircle size={18} /> Verifikasi Terpilih
              </button>
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl hover:bg-rose-100 font-bold text-sm transition-all shadow-sm"
              >
                <Trash2 size={18} /> Hapus Terpilih
              </button>
            </>
          )}
          <button 
            onClick={handleGenerateAllPins}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl hover:bg-amber-100 font-bold text-sm transition-all shadow-sm"
            disabled={isGenerating}
          >
            {isGenerating ? 'Sedang Generate...' : 'Generate PIN Massal'}
          </button>
          <button 
            onClick={handleCleanupPlaceholders}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl hover:bg-rose-100 font-bold text-sm transition-all shadow-sm"
            disabled={isGenerating}
          >
            <Trash2 size={18} /> Reset Warga Default
          </button>
          <button 
            onClick={() => generateProfessionalExcel(houses)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 font-bold text-sm transition-all shadow-lg shadow-emerald-600/20"
          >
            <Download size={18} /> Export Excel
          </button>
          
          {/* Import/Export Excel Actions */}
          <div className="flex gap-2">
            <button 
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 font-bold text-sm transition-all shadow-sm"
              title="Download Template Excel"
            >
              <LayoutList size={18} /> Template
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 font-bold text-sm transition-all shadow-sm"
              disabled={isUploading}
              title="Upload Data Excel"
            >
              <Upload size={18} /> {isUploading ? 'Uploading...' : 'Import Excel'}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleUploadExcel} 
              accept=".xlsx,.xls" 
              className="hidden" 
            />
          </div>

          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all"
          >
            <UserPlus size={18} /> Tambah Warga
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <ResidentAnalytics houses={houses} />
      
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <input 
          type="text" 
          placeholder="Cari warga..." 
          className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
            <option value="all">Semua Status</option>
            <option value="paid">Lunas</option>
            <option value="unpaid">Belum Lunas</option>
            <option value="occupied">Dihuni</option>
            <option value="empty">Kosong</option>
            <option value="business">Usaha</option>
        </select>
        <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
            <option value="block">Urutkan Blok</option>
            <option value="name">Urutkan Nama</option>
        </select>
        <div className="flex gap-2">
            <button onClick={() => setViewMode('grid')} className={`p-3 rounded-xl ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}><Users size={18}/></button>
            <button onClick={() => setViewMode('table')} className={`p-3 rounded-xl ${viewMode === 'table' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`} title="Tabel"><LayoutList size={18}/></button>
            <button onClick={() => setViewMode('map')} className={`p-3 rounded-xl ${viewMode === 'map' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`} title="Peta"><MapPin size={18}/></button>
            <button onClick={() => setViewMode('iuran')} className={`p-3 rounded-xl ${viewMode === 'iuran' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`} title="Laporan Iuran"><DollarSign size={18}/></button>
            <div className="relative">
              <button onClick={() => setViewMode('registrations')} className={`p-3 rounded-xl ${viewMode === 'registrations' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`} title="Pendaftaran Baru">
                <UserPlus size={18}/>
                {residentRegistrations.filter(r => r.approvalStatus === 'Pending').length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {residentRegistrations.filter(r => r.approvalStatus === 'Pending').length}
                  </span>
                )}
              </button>
            </div>
        </div>
      </div>

      <AnimatePresence>
        {isPayModalOpen && payHouse && (
          <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title={`Bayar Iuran: ${payHouse.headOfFamily}`}>
            <form onSubmit={handleSavePayment} className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Rumah</p>
                <p className="text-sm font-black text-slate-800">Blok {payHouse.block} No. {payHouse.number}</p>
                <p className="text-[10px] text-amber-600 font-bold mt-2 italic">* Pencatatan status iuran saja (Dana disetor ke OP Air/TPS3R)</p>
              </div>

              <div>
                <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Jenis Iuran</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={payType}
                  onChange={e => setPayType(e.target.value as any)}
                >
                  <option value="Both">Iuran Sampah & Air</option>
                  <option value="Sampah">Iuran Sampah Saja</option>
                  <option value="Air">Iuran Air Saja</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Nominal Pembayaran (Rp)</label>
                <input 
                  type="number"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  required
                />
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100">
                  Simpan Status Iuran
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedHouseForBills && (
          <BillDetailModal 
            house={selectedHouseForBills} 
            bills={bills} 
            onClose={() => setSelectedHouseForBills(null)} 
          />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 rounded-[2rem] shadow-lg shadow-blue-600/20 flex items-center gap-5 group hover:scale-[1.02] transition-transform relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="p-4 bg-white/20 text-white rounded-2xl backdrop-blur-sm border border-white/20">
            <Users size={24} />
          </div>
          <div className="relative z-10 text-white">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Warga</p>
            <h3 className="text-2xl font-black">{totalResidents} <span className="text-xs font-bold opacity-60">Jiwa</span></h3>
          </div>
        </motion.div>

        {[
          { icon: Home, label: 'Rumah Dihuni', value: occupiedHouses, unit: 'Unit', color: 'emerald' },
          { icon: Shield, label: 'Rumah Kosong', value: emptyHouses, unit: 'Unit', color: 'slate' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            variants={itemVariants}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-xl hover:shadow-slate-200/50 transition-all"
          >
            <div className={`p-4 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900">{stat.value} <span className="text-xs font-bold text-slate-400">{stat.unit}</span></h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters & Search */}
      <motion.div variants={itemVariants} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama, blok, atau nomor..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl shrink-0 border border-slate-200/50">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Grid size={20}/>
            </button>
            <button 
              onClick={() => setViewMode('table')} 
              className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List size={20}/>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <Filter size={18} className="text-slate-400 shrink-0" />
            <select 
              className="bg-transparent border-none text-sm font-bold text-slate-700 outline-none cursor-pointer pr-4"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="paid">Lunas</option>
              <option value="unpaid">Belum Lunas</option>
              <option value="occupied">Dihuni</option>
              <option value="empty">Kosong</option>
              <option value="business">Usaha</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Content View */}
      <motion.div variants={itemVariants}>
        {viewMode === 'grid' ? (
          <div className="space-y-8">
            {Object.entries(filteredHouses.reduce((acc, house) => {
              if (!acc[house.block]) acc[house.block] = [];
              acc[house.block].push(house);
              return acc;
            }, {} as Record<string, typeof filteredHouses>)).sort(([a], [b]) => a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'})).map(([block, houses]) => (
              <div key={block} className="space-y-4 p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-1.5 h-8 bg-indigo-500 rounded-full"></div>
                  <h3 className="text-xl font-black text-slate-800">Blok {block}</h3>
                  <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">{houses.length} Rumah</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {houses.map((house) => (
                    <ResidentCard 
                      key={house.id}
                      house={house}
                      bills={bills}
                      onOpenDetail={openDetail}
                      onOpenEdit={handleOpenEdit}
                      onDelete={handleDelete}
                      onOpenBills={setSelectedHouseForBills}
                      onOpenPay={openPayModal}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'iuran' ? (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-800">Laporan Iuran Warga (OP Air & Sampah)</h3>
                <div className="flex flex-wrap gap-3 mt-3">
                  <div className="px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total Iuran Air</p>
                    <p className="text-sm font-black text-blue-700">
                      Rp {iuranPayments.filter(p => p.type === 'Air' || p.type === 'Both').reduce((acc, curr) => {
                        return acc + (curr.type === 'Both' ? curr.amount / 2 : curr.amount);
                      }, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Total Iuran Sampah</p>
                    <p className="text-sm font-black text-emerald-700">
                      Rp {iuranPayments.filter(p => p.type === 'Sampah' || p.type === 'Both').reduce((acc, curr) => {
                        return acc + (curr.type === 'Both' ? curr.amount / 2 : curr.amount);
                      }, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</p>
                    <p className="text-sm font-black text-slate-700">
                      Rp {iuranPayments.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const csv = [
                      ['Tanggal', 'Nama', 'Rumah', 'Jenis', 'Nominal'].join(','),
                      ...iuranPayments.map(p => [
                        new Date(p.date).toLocaleDateString('id-ID'),
                        p.headOfFamily,
                        `${p.block}-${p.number}`,
                        p.type,
                        p.amount
                      ].join(','))
                    ].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Laporan_Iuran_${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all"
                >
                  <Download size={14} /> Ekspor CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="p-4 text-left font-black text-slate-600">Tanggal</th>
                    <th className="p-4 text-left font-black text-slate-600">Nama Warga</th>
                    <th className="p-4 text-left font-black text-slate-600">Rumah</th>
                    <th className="p-4 text-left font-black text-slate-600">Jenis Iuran</th>
                    <th className="p-4 text-right font-black text-slate-600">Nominal</th>
                    <th className="p-4 text-center font-black text-slate-600">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {iuranPayments.length > 0 ? (
                    iuranPayments.map((payment) => (
                      <tr key={payment.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 text-slate-500 font-medium">{new Date(payment.date).toLocaleDateString('id-ID')}</td>
                        <td className="p-4 font-bold text-slate-800">{payment.headOfFamily}</td>
                        <td className="p-4 font-mono font-black text-slate-600">{payment.block}-{payment.number}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            payment.type === 'Both' ? 'bg-indigo-50 text-indigo-600' :
                            payment.type === 'Air' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {payment.type === 'Both' ? 'Air & Sampah' : payment.type === 'Air' ? 'Air Saja' : 'Sampah Saja'}
                          </span>
                        </td>
                        <td className="p-4 text-right font-black text-slate-800">Rp {payment.amount.toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => {
                              if(window.confirm('Hapus catatan pembayaran ini?')) {
                                deleteIuranPaymentFromDb(payment.id);
                              }
                            }}
                            className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400 font-bold italic">Belum ada catatan pembayaran iuran.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : viewMode === 'registrations' ? (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="mb-8">
              <h3 className="text-xl font-black text-slate-800">Permohonan Warga Baru</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                {residentRegistrations.filter(r => r.approvalStatus === 'Pending').length} Menunggu Persetujuan
              </p>
            </div>

            <div className="space-y-4">
              {residentRegistrations.length > 0 ? (
                residentRegistrations.map((reg) => (
                  <div key={reg.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                        <User size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-800">{reg.headOfFamily}</h4>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            reg.approvalStatus === 'Pending' ? 'bg-amber-100 text-amber-600' :
                            reg.approvalStatus === 'Approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                          }`}>
                            {reg.approvalStatus}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 mt-1">
                          Blok {reg.block} No. {reg.number} • {reg.residenceType} • {reg.occupants} Jiwa
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(reg.date).toLocaleString('id-ID')}</p>
                        <div className="flex gap-2 mt-2">
                          {reg.ktpUrl && (
                            <a href={reg.ktpUrl} target="_blank" rel="noreferrer" className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all">Lihat KTP</a>
                          )}
                          {reg.kkUrl && (
                            <a href={reg.kkUrl} target="_blank" rel="noreferrer" className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">Lihat KK</a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <a 
                        href={`https://wa.me/${reg.phone.replace(/^0/, '62')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Phone size={14} /> Hubungi
                      </a>
                      
                      {reg.approvalStatus === 'Pending' && (
                        <>
                          <button 
                            onClick={async () => {
                              if(window.confirm('Tolak pendaftaran ini?')) {
                                await updateResidentRegistrationInDb(reg.id, { approvalStatus: 'Rejected' });
                              }
                            }}
                            className="flex-1 md:flex-none px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs hover:bg-rose-100 transition-all"
                          >
                            Tolak
                          </button>
                          <button 
                            onClick={async () => {
                              if(window.confirm('Setujui pendaftaran ini? Data akan otomatis masuk ke daftar warga.')) {
                                try {
                                  // 1. Add to houses
                                  await addHouse({
                                    headOfFamily: reg.headOfFamily,
                                    ownerName: reg.ownerName || reg.headOfFamily,
                                    block: reg.block,
                                    number: reg.number,
                                    phone: reg.phone,
                                    status: reg.status,
                                    residenceType: reg.residenceType,
                                    occupants: reg.occupants,
                                    education: reg.education,
                                    jobCategory: reg.jobCategory,
                                    vehicleCount: reg.vehicleCount,
                                    pregnantCount: reg.pregnantCount,
                                    babyCount: reg.babyCount,
                                    toddlerCount: reg.toddlerCount,
                                    teenagerCount: reg.teenagerCount,
                                    elderlyCount: reg.elderlyCount,
                                    widowCount: reg.widowCount,
                                    ktpUrl: reg.ktpUrl,
                                    kkUrl: reg.kkUrl,
                                    familyMembers: reg.familyMembers || [],
                                    paymentStatusAir: PaymentStatus.PENDING,
                                    paymentStatusSampah: PaymentStatus.PENDING,
                                    isVerified: true
                                  });
                                  
                                  // 2. Update registration status
                                  await updateResidentRegistrationInDb(reg.id, { approvalStatus: 'Approved' });
                                  
                                  alert('Pendaftaran disetujui dan data warga telah ditambahkan!');
                                } catch (error) {
                                  console.error(error);
                                  alert('Gagal menyetujui pendaftaran.');
                                }
                              }
                            }}
                            className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                          >
                            Setujui
                          </button>
                        </>
                      )}

                      {reg.approvalStatus !== 'Pending' && (
                        <button 
                          onClick={async () => {
                            if(window.confirm('Hapus riwayat pendaftaran ini?')) {
                              await deleteResidentRegistrationFromDb(reg.id);
                            }
                          }}
                          className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus size={32} />
                  </div>
                  <p className="text-slate-400 font-bold italic">Belum ada permohonan pendaftaran warga baru.</p>
                </div>
              )}
            </div>
          </div>
        ) : viewMode === 'table' ? (
          <div className="space-y-8">
            {Object.entries(filteredHouses.reduce((acc, house) => {
              if (!acc[house.block]) acc[house.block] = [];
              acc[house.block].push(house);
              return acc;
            }, {} as Record<string, typeof filteredHouses>)).sort(([a], [b]) => a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'})).map(([block, houses]) => (
              <div key={block} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="bg-slate-50 p-4 border-b border-slate-100 font-black text-slate-700">Blok {block}</div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size === filteredHouses.length && filteredHouses.length > 0} /></th>
                      <th className="p-4 text-left font-black text-slate-600">Nama</th>
                      <th className="p-4 text-left font-black text-slate-600">Nomor</th>
                      <th className="p-4 text-left font-black text-slate-600">Telepon</th>
                      <th className="p-4 text-left font-black text-slate-600">Penghuni</th>
                      <th className="p-4 text-left font-black text-slate-600">Status</th>
                      <th className="p-4 text-left font-black text-slate-600">Sampah</th>
                      <th className="p-4 text-left font-black text-slate-600">Air</th>
                      <th className="p-4 text-right font-black text-slate-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {houses.map((house) => {
                      const houseBills = bills.filter(b => b.houseId === house.id);
                      const isFullyPaid = houseBills.length > 0 && houseBills.every(b => b.total === 0);
                      const paymentStatus = isFullyPaid ? PaymentStatus.PAID : PaymentStatus.PENDING;
                      return (
                        <tr key={house.id} className="border-t border-slate-100">
                          <td className="p-4"><input type="checkbox" checked={selectedIds.has(house.id)} onChange={() => handleSelectOne(house.id)} /></td>
                          <td className="p-4 font-bold">{house.headOfFamily}</td>
                          <td className="p-4 font-mono font-black">{house.number}</td>
                          <td className="p-4 text-slate-600">{house.phone || '-'}</td>
                          <td className="p-4 text-slate-600">{house.occupants}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              house.status === 'Occupied' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                              house.status === 'Empty' ? 'bg-slate-100 text-slate-500 border-slate-200' : 
                              'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              {house.status === 'Occupied' ? 'Dihuni' : house.status === 'Empty' ? 'Kosong' : 'Usaha'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border w-fit ${
                              house.paymentStatusSampah === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                              'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>
                              {house.paymentStatusSampah === PaymentStatus.PAID ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                              {house.paymentStatusSampah === PaymentStatus.PAID ? 'Lunas' : 'Belum'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border w-fit ${
                              house.paymentStatusAir === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                              'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>
                              {house.paymentStatusAir === PaymentStatus.PAID ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                              {house.paymentStatusAir === PaymentStatus.PAID ? 'Lunas' : 'Belum'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => openDetail(house)} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100" title="Detail Warga"><User size={16}/></button>
                              <button onClick={() => openPayModal(house)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100" title="Bayar Iuran"><DollarSign size={16}/></button>
                              <button onClick={() => setSelectedHouseForBills(house)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100" title="Riwayat Tagihan"><LayoutList size={16}/></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <HouseMap 
              houses={filteredHouses} 
              isAdmin={true} 
              reports={reports} 
              officials={officials}
              onEditHouse={(h) => openDetail(h)}
            />
          </div>
        )}
      </motion.div>

      {/* Resident Detail Drawer */}
      <AnimatePresence>
        {isDrawerOpen && selectedResident && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setIsDrawerOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto custom-scrollbar"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Detail Warga</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Informasi Lengkap Keluarga</p>
                  </div>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-3 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-2xl transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Profile Header */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 text-center mb-10 text-white relative overflow-hidden shadow-xl shadow-indigo-600/20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="relative z-10">
                    <div className="w-28 h-28 mx-auto bg-white/20 backdrop-blur-md text-white rounded-[2rem] flex items-center justify-center text-4xl font-black mb-6 border-4 border-white/30 shadow-2xl">
                      {selectedResident.headOfFamily.charAt(0)}
                    </div>
                    <h2 className="text-3xl font-black mb-2">{selectedResident.headOfFamily}</h2>
                    <p className="text-indigo-100/80 font-bold uppercase tracking-widest text-[10px]">Kepala Keluarga</p>
                    
                    {selectedResident.ownerName && selectedResident.ownerName !== selectedResident.headOfFamily && (
                      <div className="mt-2 px-3 py-1 bg-white/10 rounded-lg inline-block">
                        <p className="text-[10px] font-bold text-white/90 uppercase tracking-widest">Pemilik: {selectedResident.ownerName}</p>
                      </div>
                    )}

                    <div className="flex justify-center gap-3 mt-8">
                      <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-xs font-black uppercase tracking-widest">
                        Blok {selectedResident.block}-{selectedResident.number}
                      </div>
                      <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-xs font-black uppercase tracking-widest">
                        {selectedResident.status === 'Occupied' ? 'Dihuni' : selectedResident.status === 'Empty' ? 'Kosong' : 'Usaha'}
                      </div>
                      {selectedResident.status === 'Occupied' && (
                        <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-xs font-black uppercase tracking-widest">
                          {selectedResident.residenceType === 'Kontrak' ? 'Kontrak' : selectedResident.residenceType === 'Kost' ? 'Kost' : 'Pemilik'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Sections */}
                <div className="grid grid-cols-1 gap-8">
                  <section>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Informasi Kontak</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-3xl group hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                        <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                          <Phone size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Telepon / WA</p>
                          <p className="text-base font-bold text-slate-800">{selectedResident.phone || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-3xl group hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                        <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Alamat</p>
                          <p className="text-base font-bold text-slate-800">Blok {selectedResident.block} No. {selectedResident.number}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Status Keuangan</h4>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                      <div className={`absolute top-0 right-0 w-2 h-full ${isFullyPaid ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <CreditCard size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">Iuran Bulanan</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Otomatis</p>
                          </div>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          isFullyPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {isFullyPaid ? PaymentStatus.PAID : PaymentStatus.PENDING}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openPayModal(selectedResident)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                        >
                          <DollarSign size={16} /> Bayar Iuran
                        </button>
                        <button 
                          onClick={() => { setIsDrawerOpen(false); setSelectedHouseForBills(selectedResident); }}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                        >
                          <LayoutList size={16} /> Riwayat
                        </button>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Demografi & Kerentanan</h4>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pendidikan</p>
                        <p className="text-sm font-bold text-slate-800">{selectedResident.education || '-'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pekerjaan</p>
                        <p className="text-sm font-bold text-slate-800">{selectedResident.jobCategory || '-'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Kendaraan</p>
                        <p className="text-sm font-bold text-slate-800">{selectedResident.vehicleCount || 0} Unit</p>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Penghuni</p>
                        <p className="text-sm font-bold text-slate-800">{selectedResident.occupants || 0} Orang</p>
                      </div>
                    </div>
                    
                    {((selectedResident.pregnantCount || 0) > 0 || (selectedResident.babyCount || 0) > 0 || (selectedResident.toddlerCount || 0) > 0 || (selectedResident.elderlyCount || 0) > 0 || (selectedResident.widowCount || 0) > 0) && (
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-3xl">
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none mb-3">Kelompok Rentan</p>
                        <div className="flex flex-wrap gap-2">
                          {(selectedResident.pregnantCount || 0) > 0 && <span className="px-3 py-1 bg-white text-rose-600 rounded-full text-xs font-bold shadow-sm">{selectedResident.pregnantCount} Ibu Hamil</span>}
                          {(selectedResident.babyCount || 0) > 0 && <span className="px-3 py-1 bg-white text-rose-600 rounded-full text-xs font-bold shadow-sm">{selectedResident.babyCount} Bayi</span>}
                          {(selectedResident.toddlerCount || 0) > 0 && <span className="px-3 py-1 bg-white text-rose-600 rounded-full text-xs font-bold shadow-sm">{selectedResident.toddlerCount} Balita</span>}
                          {(selectedResident.elderlyCount || 0) > 0 && <span className="px-3 py-1 bg-white text-rose-600 rounded-full text-xs font-bold shadow-sm">{selectedResident.elderlyCount} Lansia</span>}
                          {(selectedResident.widowCount || 0) > 0 && <span className="px-3 py-1 bg-white text-rose-600 rounded-full text-xs font-bold shadow-sm">{selectedResident.widowCount} Janda</span>}
                        </div>
                      </div>
                    )}
                  </section>

                  <section>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Anggota Keluarga</h4>
                    {selectedResident.familyMembers && selectedResident.familyMembers.length > 0 ? (
                      <div className="space-y-3">
                        {selectedResident.familyMembers.map((member, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                              <p className="font-bold text-slate-800">{member.name}</p>
                              <p className="text-xs text-slate-500">{member.relation} • {member.birthDate ? new Date(member.birthDate).toLocaleDateString('id-ID') : '-'}</p>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded border border-slate-200">
                              {member.nik || 'No NIK'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-50/50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                          <Users size={32} />
                        </div>
                        <p className="text-sm font-bold text-slate-400">Belum ada data anggota keluarga</p>
                        <button onClick={() => { setIsDrawerOpen(false); handleOpenEdit(selectedResident); }} className="mt-4 text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Tambah Anggota</button>
                      </div>
                    )}
                  </section>
                </div>

                {/* Actions Footer */}
                <div className="mt-12 pt-8 border-t border-slate-100 flex gap-4">
                  <button 
                    onClick={() => { setIsDrawerOpen(false); handleOpenEdit(selectedResident); }}
                    className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all shadow-sm"
                  >
                    Edit Data
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedResident.id)}
                    className="flex-1 py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-black text-sm hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                  >
                    Hapus Warga
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingHouseId ? "Edit Data Warga" : "Tambah Warga Baru"}>
        <form onSubmit={handleSaveHouse} className="space-y-6">
          {/* Section 1: Informasi Utama */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 border-b border-indigo-100 pb-2">
              <User size={14} /> Informasi Utama
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700">Kepala Keluarga (Penghuni)</label>
                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.headOfFamily} onChange={e => setFormData({...formData, headOfFamily: e.target.value})} required placeholder="Nama Lengkap..." />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700">Nama Pemilik Rumah</label>
                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} placeholder="Nama Pemilik (Opsional)" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700">Blok</label>
                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.block} onChange={e => setFormData({...formData, block: e.target.value})} required placeholder="A" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700">Nomor</label>
                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} required placeholder="12" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700">Telepon / WA</label>
                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="08..." />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700">PIN Akses (Access Code)</label>
                <div className="flex gap-2">
                  <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.accessCode} onChange={e => setFormData({...formData, accessCode: e.target.value})} placeholder="Masukkan PIN..." />
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, accessCode: Math.floor(100000 + Math.random() * 900000).toString()})}
                    className="px-4 py-3 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-100 font-bold text-sm transition-all shadow-sm whitespace-nowrap"
                    title="Generate PIN Acak"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Status & Kepemilikan */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 border-b border-indigo-100 pb-2">
              <Home size={14} /> Status & Kepemilikan
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700">Status Hunian</label>
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                  <option value="Occupied">Dihuni</option>
                  <option value="Empty">Kosong</option>
                  <option value="Business">Usaha</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700">Status Kepemilikan</label>
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.residenceType} onChange={e => setFormData({...formData, residenceType: e.target.value as any})}>
                  <option value="Tetap">Pemilik (Tetap)</option>
                  <option value="Kontrak">Kontrak</option>
                  <option value="Kost">Kost</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700">Jumlah Penghuni</label>
                <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.occupants} onChange={e => setFormData({...formData, occupants: parseInt(e.target.value)})} min={1} />
              </div>
            </div>
          </div>

          {/* Section 3: Data Demografi & Kerentanan */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 border-b border-indigo-100 pb-2">
              <Activity size={14} /> Demografi & Kerentanan
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700">Pendidikan Terakhir</label>
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})}>
                  <option value="">Pilih...</option>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA/SMK">SMA/SMK</option>
                  <option value="D3">D3</option>
                  <option value="S1">S1</option>
                  <option value="S2">S2</option>
                  <option value="S3">S3</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700">Kategori Pekerjaan</label>
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.jobCategory} onChange={e => setFormData({...formData, jobCategory: e.target.value})}>
                  <option value="">Pilih...</option>
                  <option value="PNS">PNS / TNI / Polri</option>
                  <option value="Pegawai Swasta">Pegawai Swasta</option>
                  <option value="Wiraswasta">Wiraswasta / Pengusaha</option>
                  <option value="Freelance">Pekerja Lepas / Freelance</option>
                  <option value="Pensiunan">Pensiunan</option>
                  <option value="Tidak Bekerja">Tidak / Belum Bekerja</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700">Jumlah Kendaraan</label>
                <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.vehicleCount} onChange={e => setFormData({...formData, vehicleCount: parseInt(e.target.value)})} min={0} />
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold mb-3 text-slate-700">Kelompok Rentan (Jumlah Jiwa)</label>
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <label className="block text-[10px] font-bold mb-1 text-slate-500 uppercase tracking-wider">Ibu Hamil</label>
                  <input type="number" className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.pregnantCount} onChange={e => setFormData({...formData, pregnantCount: parseInt(e.target.value) || 0})} min={0} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1 text-slate-500 uppercase tracking-wider">Bayi</label>
                  <input type="number" className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.babyCount} onChange={e => setFormData({...formData, babyCount: parseInt(e.target.value) || 0})} min={0} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1 text-slate-500 uppercase tracking-wider">Balita</label>
                  <input type="number" className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.toddlerCount} onChange={e => setFormData({...formData, toddlerCount: parseInt(e.target.value) || 0})} min={0} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1 text-slate-500 uppercase tracking-wider">Lansia</label>
                  <input type="number" className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.elderlyCount} onChange={e => setFormData({...formData, elderlyCount: parseInt(e.target.value) || 0})} min={0} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1 text-slate-500 uppercase tracking-wider">Janda</label>
                  <input type="number" className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.widowCount} onChange={e => setFormData({...formData, widowCount: parseInt(e.target.value) || 0})} min={0} />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Anggota Keluarga */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-indigo-100 pb-2">
              <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                <Users size={14} /> Anggota Keluarga
              </h3>
              <button 
                type="button"
                onClick={() => setFormData({
                  ...formData, 
                  familyMembers: [...formData.familyMembers, { name: '', relation: 'Anak', nik: '', birthDate: '' }]
                })}
                className="text-xs font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
              >
                <UserPlus size={14} /> Tambah
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.familyMembers.map((member, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 relative group transition-all hover:border-indigo-200 hover:shadow-sm">
                  <button 
                    type="button"
                    onClick={() => {
                      const newMembers = [...formData.familyMembers];
                      newMembers.splice(idx, 1);
                      setFormData({...formData, familyMembers: newMembers});
                    }}
                    className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded-md shadow-sm border border-slate-100"
                  >
                    <X size={14} />
                  </button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold mb-1 text-slate-500 uppercase tracking-wider">Nama Lengkap</label>
                      <input 
                        placeholder="Nama Lengkap" 
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={member.name}
                        onChange={e => {
                          const newMembers = [...formData.familyMembers];
                          newMembers[idx].name = e.target.value;
                          setFormData({...formData, familyMembers: newMembers});
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold mb-1 text-slate-500 uppercase tracking-wider">Hubungan</label>
                      <select 
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={member.relation}
                        onChange={e => {
                          const newMembers = [...formData.familyMembers];
                          newMembers[idx].relation = e.target.value as any;
                          setFormData({...formData, familyMembers: newMembers});
                        }}
                      >
                        <option value="Istri">Istri</option>
                        <option value="Anak">Anak</option>
                        <option value="Orang Tua">Orang Tua</option>
                        <option value="Famili Lain">Famili Lain</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold mb-1 text-slate-500 uppercase tracking-wider">NIK (Opsional)</label>
                      <input 
                        placeholder="NIK" 
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={member.nik || ''}
                        onChange={e => {
                          const newMembers = [...formData.familyMembers];
                          newMembers[idx].nik = e.target.value;
                          setFormData({...formData, familyMembers: newMembers});
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold mb-1 text-slate-500 uppercase tracking-wider">Tanggal Lahir</label>
                      <input 
                        type="date"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={member.birthDate || ''}
                        onChange={e => {
                          const newMembers = [...formData.familyMembers];
                          newMembers[idx].birthDate = e.target.value;
                          setFormData({...formData, familyMembers: newMembers});
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {formData.familyMembers.length === 0 && (
                <div className="text-center p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <Users size={24} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-slate-400 font-bold">Belum ada anggota keluarga ditambahkan.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-slate-100">
            <Button type="submit" className="w-full py-4 text-sm font-black shadow-lg shadow-indigo-500/20">
              {editingHouseId ? 'Simpan Perubahan' : 'Tambah Warga'}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};
