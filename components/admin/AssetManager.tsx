import React, { useState } from 'react';
import { Package, Plus, Edit2, Trash2, Box, CheckCircle2, History, User, Calendar, Clock, CheckCircle, Trash, Filter, Wrench, DollarSign, ClipboardList } from 'lucide-react';
import { motion } from 'motion/react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AssetBorrowManager } from './AssetBorrowManager';
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

      {/* Add/Edit Asset Modal */}
      <Modal isOpen={isInvModalOpen} onClose={() => setIsInvModalOpen(false)} title={editingInvId ? "Edit Aset" : "Tambah Aset Baru"}>
        <form onSubmit={handleSaveInventory} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700">Nama Aset</label>
            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={invName} onChange={e => setInvName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700">Kategori</label>
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={invCategory} onChange={e => setInvCategory(e.target.value as any)}>
                   {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                 </select>
             </div>
             <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700">Kondisi</label>
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={invCondition} onChange={e => setInvCondition(e.target.value as any)}>
                   <option value="Baik">Baik</option>
                   <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                   <option value="Rusak">Rusak</option>
                 </select>
             </div>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700">Jumlah Total</label>
            <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={invTotal} onChange={e => setInvTotal(e.target.value)} />
          </div>
          <Button type="submit" className="w-full py-3 mt-2">{editingInvId ? 'Simpan Perubahan' : 'Simpan Aset'}</Button>
        </form>
      </Modal>

      {/* Borrow Modal */}
      <Modal isOpen={isBorrowModalOpen} onClose={() => setIsBorrowModalOpen(false)} title={`Pinjamkan: ${selectedAsset?.name}`}>
        <form onSubmit={handleBorrow} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700">Nama Peminjam</label>
            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={borrowerName} onChange={e => setBorrowerName(e.target.value)} placeholder="Nama lengkap warga..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700">Jumlah Pinjam</label>
                <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={borrowAmount} onChange={e => setBorrowAmount(e.target.value)} min="1" max={selectedAsset?.total} />
             </div>
             <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700">Tanggal Pinjam</label>
                <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={borrowDate} onChange={e => setBorrowDate(e.target.value)} />
             </div>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700">Estimasi Pengembalian (Opsional)</label>
            <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
          </div>
          <Button type="submit" className="w-full py-3 mt-2">Konfirmasi Pinjaman</Button>
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
