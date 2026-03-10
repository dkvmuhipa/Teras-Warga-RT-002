import React, { useState } from 'react';
import { Package, Plus, Edit2, Trash2, Box, CheckCircle2, History, User, Calendar, Clock, CheckCircle, Trash } from 'lucide-react';
import { motion } from 'motion/react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { InventoryItem } from '../../types';
import { addInventoryToDb, updateInventoryInDb, deleteInventoryFromDb, addInventoryLogToDb, updateInventoryLogStatus, deleteInventoryLogFromDb } from '../../services/databaseService';

interface AssetManagerProps {
  inventory: InventoryItem[];
  inventoryLogs: any[];
}

export const AssetManager: React.FC<AssetManagerProps> = ({ inventory, inventoryLogs }) => {
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<InventoryItem | null>(null);
  
  const [editingInvId, setEditingInvId] = useState<string | null>(null);
  const [invName, setInvName] = useState('');
  const [invTotal, setInvTotal] = useState('');
  const [invCondition, setInvCondition] = useState<'Baik' | 'Perlu Perbaikan' | 'Rusak'>('Baik');

  // Borrow Form State
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('1');
  const [borrowDate, setBorrowDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState('');

  const resetInvForm = () => {
    setInvName(''); setInvTotal(''); setInvCondition('Baik'); setEditingInvId(null);
  };

  const resetBorrowForm = () => {
    setBorrowerName(''); setBorrowAmount('1'); setBorrowDate(new Date().toISOString().split('T')[0]); setReturnDate(''); setSelectedAsset(null);
  };

  const handleEditInventory = (item: InventoryItem) => {
    setEditingInvId(item.id);
    setInvName(item.name);
    setInvTotal(item.total.toString());
    setInvCondition(item.condition);
    setIsInvModalOpen(true);
  };

  const handleSaveInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: invName,
      total: parseInt(invTotal),
      available: parseInt(invTotal), // Simplified logic
      condition: invCondition
    };

    if (editingInvId) await updateInventoryInDb(editingInvId, data);
    else await addInventoryToDb(data);

    setIsInvModalOpen(false);
    resetInvForm();
  };

  const handleDeleteInventory = async (id: string) => {
    if (window.confirm('Hapus barang inventaris ini?')) {
      await deleteInventoryFromDb(id);
    }
  };

  const handleBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

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
  };

  const handleReturn = async (id: string) => {
    if (window.confirm('Tandai barang sudah dikembalikan?')) {
      await updateInventoryLogStatus(id, 'Returned');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Aset & Inventaris</h2>
          <p className="text-slate-500 font-medium mt-1">Kelola aset dan perlengkapan RT 002.</p>
        </div>
        <Button onClick={() => { resetInvForm(); setIsInvModalOpen(true); }}>
          <Plus size={16} /> Tambah Aset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inventory.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <Box size={24} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEditInventory(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDeleteInventory(item.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
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
                      <button onClick={() => deleteInventoryLogFromDb(log.id)} className="text-slate-300 hover:text-rose-600 transition-colors">
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
            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={invName} onChange={e => setInvName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700">Jumlah Total</label>
                <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={invTotal} onChange={e => setInvTotal(e.target.value)} required />
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
          <Button type="submit" className="w-full py-3 mt-2">{editingInvId ? 'Simpan Perubahan' : 'Simpan Aset'}</Button>
        </form>
      </Modal>

      {/* Borrow Modal */}
      <Modal isOpen={isBorrowModalOpen} onClose={() => setIsBorrowModalOpen(false)} title={`Pinjamkan: ${selectedAsset?.name}`}>
        <form onSubmit={handleBorrow} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700">Nama Peminjam</label>
            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={borrowerName} onChange={e => setBorrowerName(e.target.value)} required placeholder="Nama lengkap warga..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700">Jumlah Pinjam</label>
                <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={borrowAmount} onChange={e => setBorrowAmount(e.target.value)} required min="1" max={selectedAsset?.total} />
             </div>
             <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700">Tanggal Pinjam</label>
                <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={borrowDate} onChange={e => setBorrowDate(e.target.value)} required />
             </div>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700">Estimasi Pengembalian (Opsional)</label>
            <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
          </div>
          <Button type="submit" className="w-full py-3 mt-2">Konfirmasi Pinjaman</Button>
        </form>
      </Modal>
    </motion.div>
  );
};
