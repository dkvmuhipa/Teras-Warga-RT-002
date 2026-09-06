import React, { useState } from 'react';
import { Package, Plus, Edit2, Trash2, Box, CheckCircle2, History, User, Calendar, Clock, CheckCircle, Trash, Filter, Wrench, DollarSign, ClipboardList, ShieldCheck, Tag, Sparkles, Building2, Phone, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { InventoryItem, MaintenanceLog } from '../../types';
import { addInventoryToDb, updateInventoryInDb, deleteInventoryFromDb, addInventoryLogToDb, updateInventoryLogStatus, deleteInventoryLogFromDb, handleFirestoreError, OperationType } from '../../services/databaseService';
import { toast } from 'sonner';
import { useConfirm } from '../../context/ConfirmContext';

interface AssetManagerProps {
  inventory: InventoryItem[];
  inventoryLogs: any[];
}

const CATEGORIES = ['Perlengkapan Acara', 'Alat Kebersihan', 'Keamanan', 'Peralatan Tukang', 'Lainnya'] as const;

export const AssetManager: React.FC<AssetManagerProps> = ({ inventory, inventoryLogs }) => {
  const confirm = useConfirm();
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<InventoryItem | null>(null);
  
  const [editingInvId, setEditingInvId] = useState<string | null>(null);
  const [invName, setInvName] = useState('');
  const [invTotal, setInvTotal] = useState('');
  const [invCondition, setInvCondition] = useState<'Baik' | 'Perlu Perbaikan' | 'Rusak'>('Baik');
  const [invCategory, setInvCategory] = useState<typeof CATEGORIES[number]>('Lainnya');

  // Borrow Form State
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('1');
  const [borrowDate, setBorrowDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState('');

  // Maintenance Form State
  const [maintenanceDesc, setMaintenanceDesc] = useState('');
  const [maintenanceCost, setMaintenanceCost] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [maintenanceBy, setMaintenanceBy] = useState('');

  const [activeCategory, setActiveCategory] = useState<string>('Semua');

  const resetInvForm = () => {
    setInvName(''); setInvTotal(''); setInvCondition('Baik'); setInvCategory('Lainnya'); setEditingInvId(null);
  };

  const resetBorrowForm = () => {
    setBorrowerName(''); setBorrowAmount('1'); setBorrowDate(new Date().toISOString().split('T')[0]); setReturnDate(''); setSelectedAsset(null);
  };

  const resetMaintenanceForm = () => {
    setMaintenanceDesc(''); setMaintenanceCost(''); setMaintenanceDate(new Date().toISOString().split('T')[0]); setMaintenanceBy('');
  };

  const handleEditInventory = (item: InventoryItem) => {
    setEditingInvId(item.id);
    setInvName(item.name);
    setInvTotal(item.total.toString());
    setInvCondition(item.condition);
    setInvCategory(item.category || 'Lainnya');
    setIsInvModalOpen(true);
  };

  const handleSaveInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: invName,
        total: parseInt(invTotal),
        available: parseInt(invTotal), // Simplified logic
        condition: invCondition,
        category: invCategory
      };

      if (editingInvId) await updateInventoryInDb(editingInvId, data);
      else await addInventoryToDb(data);

      setIsInvModalOpen(false);
      resetInvForm();
      toast.success(editingInvId ? 'Aset berhasil diperbarui!' : 'Aset berhasil ditambahkan!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan aset.');
    }
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    try {
      const newLog: MaintenanceLog = {
        id: crypto.randomUUID(),
        date: maintenanceDate,
        description: maintenanceDesc,
        cost: maintenanceCost ? parseInt(maintenanceCost) : undefined,
        performedBy: maintenanceBy
      };

      const updatedHistory = [...(selectedAsset.maintenanceHistory || []), newLog];
      
      await updateInventoryInDb(selectedAsset.id, {
        maintenanceHistory: updatedHistory
      });

      setIsMaintenanceModalOpen(false);
      resetMaintenanceForm();
      toast.success('Riwayat perawatan berhasil ditambahkan!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `inventory/${selectedAsset.id}`);
      toast.error('Gagal menyimpan riwayat perawatan.');
    }
  };

  const handleDeleteInventory = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Barang',
      message: 'Apakah Anda yakin ingin menghapus barang inventaris ini?',
      confirmLabel: 'Hapus',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await deleteInventoryFromDb(id);
        toast.success('Aset berhasil dihapus.');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `inventory/${id}`);
        toast.error('Gagal menghapus aset.');
      }
    }
  };

  const handleBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    try {
      const log = {
        assetId: selectedAsset.id,
        assetName: selectedAsset.name,
        borrowerName,
        amount: parseInt(borrowAmount),
        date: borrowDate,
        expectedReturnDate: returnDate,
        status: 'Borrowed'
      };

      await addInventoryLogToDb(log);
      setIsBorrowModalOpen(false);
      resetBorrowForm();
      toast.success('Peminjaman berhasil dicatat!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "inventoryLogs");
      toast.error('Gagal mencatat peminjaman.');
    }
  };

  const handleReturn = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Konfirmasi Pengembalian',
      message: 'Tandai barang sudah dikembalikan?',
      confirmLabel: 'Sudah Kembali',
    });

    if (isConfirmed) {
      try {
        await updateInventoryLogStatus(id, 'Returned');
        toast.success('Barang telah dikembalikan.');
      } catch (error) {
        console.error(error);
        toast.error('Gagal memproses pengembalian.');
      }
    }
  };

  const handleDeleteLog = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Riwayat',
      message: 'Apakah Anda yakin ingin menghapus riwayat peminjaman ini?',
      confirmLabel: 'Hapus',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await deleteInventoryLogFromDb(id);
        toast.success('Riwayat berhasil dihapus.');
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus riwayat.');
      }
    }
  };

  const totalAssets = inventory.length;
  const goodAssets = inventory.filter(i => i.condition === 'Baik').length;
  const activeBorrows = inventoryLogs.filter(l => l.status === 'Borrowed').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Aset & Inventaris</h2>
          <p className="text-slate-500 font-medium mt-1">Kelola aset, peminjaman barang warga, dan pencatatan kondisi perlengkapan RT 02.</p>
        </div>
        <Button onClick={() => { resetInvForm(); setIsInvModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95">
          <Plus size={16} className="mr-1.5" /> Tambah Aset
        </Button>
      </div>

      {/* Asset Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-50 via-white to-indigo-50/30 p-6 rounded-[2rem] border border-indigo-100/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-indigo-500 font-extrabold uppercase tracking-widest">Aset Terdaftar</p>
            <p className="text-3xl font-black text-indigo-950 leading-none">{totalAssets} <span className="text-xs font-bold text-indigo-500">Kategori</span></p>
            <p className="text-[11px] text-indigo-600 font-medium">Jumlah total jenis barang inventaris RT</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-600">
            <Package size={24} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 p-6 rounded-[2rem] border border-emerald-100/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-widest">Kondisi Prima (Baik)</p>
            <p className="text-3xl font-black text-emerald-950 leading-none">
              {totalAssets > 0 ? Math.round((goodAssets / totalAssets) * 100) : 100}%
            </p>
            <p className="text-[11px] text-emerald-600/90 font-medium">{goodAssets} dari {totalAssets} barang berstatus BAIK</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50/30 p-6 rounded-[2rem] border border-amber-100/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest">Sedang Dipinjam</p>
            <p className="text-3xl font-black text-amber-950 leading-none">{activeBorrows} <span className="text-xs font-bold text-amber-500">Warga</span></p>
            <p className="text-[11px] text-amber-600 font-medium">Log peminjaman aktif belum dikembalikan</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-600">
            <ClipboardList size={24} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['Semua', ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inventory
          .filter(item => activeCategory === 'Semua' || item.category === activeCategory)
          .map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <Box size={24} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setSelectedAsset(item); setIsMaintenanceModalOpen(true); }} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all" title="Riwayat Perawatan">
                  <Wrench size={16} />
                </button>
                <button onClick={() => handleEditInventory(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDeleteInventory(item.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="mb-1">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{item.category || 'Lainnya'}</span>
            </div>
            <h4 className="font-black text-slate-800 text-lg">{item.name}</h4>
            <div className="flex items-center gap-2 mt-2 text-slate-500 text-sm font-bold">
              <CheckCircle2 size={16} className="text-emerald-500" /> {item.total} Unit Tersedia
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                item.condition === 'Baik' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                item.condition === 'Rusak' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                {item.condition}
              </span>
              <button 
                onClick={() => { setSelectedAsset(item); setIsBorrowModalOpen(true); }}
                className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest"
              >
                Pinjamkan
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Borrowing History */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mt-12">
        <div className="p-8 border-b border-slate-50 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <History size={20} />
          </div>
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Riwayat Peminjaman</h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.15em] border-b border-slate-100">
                <th className="px-8 py-5">Barang</th>
                <th className="px-8 py-5">Peminjam</th>
                <th className="px-8 py-5">Tgl Pinjam</th>
                <th className="px-8 py-5">Estimasi Kembali</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {inventoryLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-5 font-bold text-slate-800">{log.assetName} ({log.amount})</td>
                  <td className="px-8 py-5 font-medium text-slate-600">{log.borrowerName}</td>
                  <td className="px-8 py-5 text-slate-500">{new Date(log.date).toLocaleDateString('id-ID')}</td>
                  <td className="px-8 py-5 text-slate-500">{log.expectedReturnDate ? new Date(log.expectedReturnDate).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                      log.status === 'Borrowed' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {log.status === 'Borrowed' ? 'Dipinjam' : 'Kembali'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex justify-center gap-2">
                      {log.status === 'Borrowed' && (
                        <button onClick={() => handleReturn(log.id)} className="text-emerald-600 hover:text-emerald-700 font-bold text-xs">Kembali</button>
                      )}
                      <button onClick={() => handleDeleteLog(log.id)} className="text-slate-300 hover:text-rose-600 transition-colors">
                        <Trash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {inventoryLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-medium italic">Belum ada riwayat peminjaman.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit Aset Widescreen 2-Kolom RT 002 / RW 020 */}
      <Modal 
        isOpen={isInvModalOpen} 
        onClose={() => setIsInvModalOpen(false)} 
        title={editingInvId ? "Edit Aset Inventaris RT 002 / RW 020" : "Tambah Aset Inventaris Baru RT 002 / RW 020"}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSaveInventory} className="space-y-5">
          {/* Header Identitas Resmi RT 002 / RW 020 */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-cyan-50 via-slate-50 to-cyan-50/30 border border-cyan-100/80 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                <Box size={16} />
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-800 tracking-tight leading-tight">
                  Buku Induk Aset & Fasilitas Inventaris RT 002 / RW 020
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Kelurahan Tondo, Kecamatan Mantikulore, Kota Palu
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-100/80 text-cyan-700 px-3 py-1 rounded-lg border border-cyan-200">
              Registrasi Aset Lingkungan
            </span>
          </div>

          {/* Quick Preset Barang Umum RT */}
          <div className="space-y-1.5 p-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Sparkles size={12} className="text-cyan-600" />
              Pilihan Cepat Barang Umum RT (1-Klik Isi)
            </p>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {[
                { name: 'Tenda Lipat 3x3 Meter', cat: 'Perlengkapan Acara', qty: '2' },
                { name: 'Kursi Plastik Napolly', cat: 'Perlengkapan Acara', qty: '50' },
                { name: 'Sound Portable + Mic Wireless', cat: 'Perlengkapan Acara', qty: '1' },
                { name: 'Mesin Potong Rumput Gendong', cat: 'Alat Kebersihan', qty: '1' },
                { name: 'Gerobak Sorong Artco', cat: 'Alat Kebersihan', qty: '2' },
                { name: 'Rompi & Senter Ronda Cas', cat: 'Keamanan', qty: '4' },
                { name: 'Tangga Lipat Aluminium 3M', cat: 'Peralatan Tukang', qty: '1' }
              ].map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setInvName(preset.name);
                    setInvCategory(preset.cat as any);
                    setInvTotal(preset.qty);
                    setInvCondition('Baik');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-300 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-black transition-all active:scale-95"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Kolom Kiri: Form Input Aset (7 Kolom) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Nama Aset / Barang *
                </label>
                <input 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all" 
                  value={invName} 
                  onChange={e => setInvName(e.target.value)} 
                  placeholder="Contoh: Tenda Acara 3x3, Kursi Plastik..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Kategori Aset *
                  </label>
                  <select 
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all cursor-pointer" 
                    value={invCategory} 
                    onChange={e => setInvCategory(e.target.value as any)}
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Kondisi Barang *
                  </label>
                  <select 
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all cursor-pointer" 
                    value={invCondition} 
                    onChange={e => setInvCondition(e.target.value as any)}
                  >
                    <option value="Baik">🟢 Baik (Siap Digunakan)</option>
                    <option value="Perlu Perbaikan">🟡 Perlu Perbaikan / Servis</option>
                    <option value="Rusak">🔴 Rusak (Tidak Siap Pakai)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Jumlah Total Unit *
                </label>
                <input 
                  type="number" 
                  min="1"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all" 
                  value={invTotal} 
                  onChange={e => setInvTotal(e.target.value)} 
                  placeholder="Jumlah unit..."
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-[10px] text-slate-500 space-y-1">
                <p className="font-bold text-slate-700 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-cyan-600" />
                  Penyimpanan & Hak Pakai
                </p>
                <p>Aset ini dialokasikan untuk kepentingan seluruh warga RT 002 / RW 020 Kelurahan Tondo dan wajib dicatat peminjamannya saat digunakan.</p>
              </div>
            </div>

            {/* Kolom Kanan: Live Asset Card Preview (5 Kolom) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Box size={13} className="text-cyan-600" />
                  Pratinjau Kartu Aset RT
                </span>
                <span className="text-[9px] font-black text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200/60 uppercase">
                  Inventaris
                </span>
              </div>

              <div className="bg-gradient-to-b from-white to-slate-50 border border-slate-200/90 rounded-3xl p-5 shadow-xl shadow-slate-200/50 space-y-3.5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    invCondition === 'Baik' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : invCondition === 'Perlu Perbaikan'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {invCondition}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 font-bold">RT 002 / RW 020</span>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest">{invCategory}</p>
                  <h4 className="text-lg font-black text-slate-900 leading-snug">
                    {invName || 'Nama Aset Baru'}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div className="p-2.5 bg-slate-100/70 rounded-xl">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Aset</p>
                    <p className="text-base font-black text-slate-800">{invTotal || '0'} Unit</p>
                  </div>
                  <div className="p-2.5 bg-cyan-50/70 rounded-xl border border-cyan-100">
                    <p className="text-[9px] font-bold text-cyan-600 uppercase tracking-wider">Lokasi Simpan</p>
                    <p className="text-[11px] font-black text-cyan-900 mt-0.5">Pos Kamling RT 02</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-medium">
                  <span>Status: Siap Registrasi</span>
                  <span className="font-mono">AST-RT002-TONDO</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" className="flex-1 py-3 rounded-2xl text-xs font-bold" onClick={() => setIsInvModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" className="flex-[2] py-3 rounded-2xl text-xs font-black shadow-lg bg-cyan-600 hover:bg-cyan-700 shadow-cyan-600/25 text-white">
              {editingInvId ? 'Simpan Perubahan Aset' : 'Daftarkan Aset ke Inventaris'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Pinjam Aset Widescreen 2-Kolom RT 002 / RW 020 */}
      <Modal 
        isOpen={isBorrowModalOpen} 
        onClose={() => setIsBorrowModalOpen(false)} 
        title={`Peminjaman Aset Fasilitas: ${selectedAsset?.name}`}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleBorrow} className="space-y-5">
          {/* Header Pinjam */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                <ClipboardList size={16} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 leading-tight">
                  Formulir Peminjaman Sarana RT 002 / RW 020
                </p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  Barang: {selectedAsset?.name} (Stok Siap: {selectedAsset?.available} Unit)
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg border border-indigo-200">
              Wajib Lapor RT
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Input Pinjam (7 Kolom) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Nama Warga Peminjam *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input 
                    required
                    className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" 
                    value={borrowerName} 
                    onChange={e => setBorrowerName(e.target.value)} 
                    placeholder="Nama lengkap warga / Kepala Keluarga..." 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Jumlah Unit Pinjam *
                  </label>
                  <input 
                    type="number" 
                    required
                    min="1" 
                    max={selectedAsset?.available || selectedAsset?.total || 1}
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" 
                    value={borrowAmount} 
                    onChange={e => setBorrowAmount(e.target.value)} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Tanggal Mulai Pinjam *
                  </label>
                  <input 
                    type="date" 
                    required
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all cursor-pointer" 
                    value={borrowDate} 
                    onChange={e => setBorrowDate(e.target.value)} 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Estimasi Pengembalian (Opsional)
                </label>
                <input 
                  type="date" 
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all cursor-pointer" 
                  value={returnDate} 
                  onChange={e => setReturnDate(e.target.value)} 
                />
              </div>

              {/* Ketentuan Peminjaman */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-[10px] text-amber-900 space-y-1">
                <p className="font-black flex items-center gap-1 text-amber-800">
                  <AlertTriangle size={12} />
                  Tata Tertib Peminjaman Sarana RT 002 / RW 020
                </p>
                <p>Barang wajib dirawat dengan baik dan dikembalikan dalam kondisi bersih seperti semula ke pos kamling / pengurus inventaris.</p>
              </div>
            </div>

            {/* Kolom Kanan: Pratinjau Surat Pinjam (5 Kolom) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FileText size={13} className="text-indigo-600" />
                  Pratinjau Bukti Peminjaman
                </span>
                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60 uppercase">
                  Log Peminjaman
                </span>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xl shadow-slate-200/50 space-y-3 relative text-xs">
                <div className="text-center pb-2 border-b border-dashed border-slate-200">
                  <p className="text-[10px] font-black text-slate-800 uppercase">BUKTI PINJAM SARANA RT 002</p>
                  <p className="text-[9px] text-slate-400">RW 020 Kelurahan Tondo, Palu</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Barang</span>
                    <span className="font-bold text-slate-800 text-right">{selectedAsset?.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Jumlah</span>
                    <span className="font-bold text-indigo-600">{borrowAmount} Unit</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Peminjam</span>
                    <span className="font-bold text-slate-800">{borrowerName || 'Warga RT 002'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Mulai Pinjam</span>
                    <span className="font-bold text-slate-800">{borrowDate}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Batas Kembali</span>
                    <span className="font-bold text-slate-800">{returnDate || 'Belum Ditentukan'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Dicatat Pengurus
                  </span>
                  <span className="font-mono">LOG-AST-RT02</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" className="flex-1 py-3 rounded-2xl text-xs font-bold" onClick={() => setIsBorrowModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" className="flex-[2] py-3 rounded-2xl text-xs font-black shadow-lg bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25 text-white">
              Konfirmasi & Catat Peminjaman
            </Button>
          </div>
        </form>
      </Modal>
      {/* Maintenance Modal */}
      <Modal isOpen={isMaintenanceModalOpen} onClose={() => setIsMaintenanceModalOpen(false)} title={`Perawatan Aset: ${selectedAsset?.name}`}>
        <div className="space-y-6">
          {/* Add Maintenance Form */}
          <form onSubmit={handleAddMaintenance} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
            <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Plus size={14} className="text-indigo-600" /> Tambah Riwayat Baru
            </h5>
            <div>
              <label className="block text-[10px] font-bold mb-1 text-slate-500 uppercase">Deskripsi Perbaikan</label>
              <textarea 
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" 
                value={maintenanceDesc} 
                onChange={e => setMaintenanceDesc(e.target.value)} 
                placeholder="Contoh: Ganti oli, perbaikan kabel, dll..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold mb-1 text-slate-500 uppercase">Biaya (Rp)</label>
                <input 
                  type="number" 
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" 
                  value={maintenanceCost} 
                  onChange={e => setMaintenanceCost(e.target.value)} 
                  placeholder="Opsional"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold mb-1 text-slate-500 uppercase">Tanggal</label>
                <input 
                  type="date" 
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" 
                  value={maintenanceDate} 
                  onChange={e => setMaintenanceDate(e.target.value)} 
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold mb-1 text-slate-500 uppercase">Oleh / Teknisi</label>
              <input 
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" 
                value={maintenanceBy} 
                onChange={e => setMaintenanceBy(e.target.value)} 
                placeholder="Nama teknisi atau toko..."
              />
            </div>
            <Button type="submit" className="w-full py-2.5 text-xs">Simpan Riwayat</Button>
          </form>

          {/* Maintenance List */}
          <div className="space-y-3">
            <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <ClipboardList size={14} className="text-indigo-600" /> Riwayat Sebelumnya
            </h5>
            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {selectedAsset?.maintenanceHistory?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log) => (
                <div key={log.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {log.cost && (
                      <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                        <DollarSign size={10} /> {log.cost.toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-800 mb-1">{log.description}</p>
                  {log.performedBy && (
                    <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                      <User size={10} /> {log.performedBy}
                    </p>
                  )}
                </div>
              ))}
              {(!selectedAsset?.maintenanceHistory || selectedAsset.maintenanceHistory.length === 0) && (
                <div className="py-8 text-center text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Belum ada riwayat perawatan.
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};
