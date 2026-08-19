import React, { useState, useEffect } from 'react';
import { Box, Calendar, Plus, Search, Filter, Trash2, CheckCircle, Clock, AlertTriangle, User, Home, PackageCheck, Send } from 'lucide-react';
import { House, InventoryItem, AssetBorrowRequest } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Card';
import { toast } from 'sonner';
import { 
  subscribeToAssetBorrowRequests, 
  addAssetBorrowRequestToDb, 
  updateAssetBorrowRequestInDb, 
  deleteAssetBorrowRequestFromDb 
} from '../../services/databaseService';
import { motion, AnimatePresence } from 'motion/react';
import { useConfirm } from '../../context/ConfirmContext';

interface AssetBorrowManagerProps {
  houses: House[];
  inventory: InventoryItem[];
}

export const AssetBorrowManager: React.FC<AssetBorrowManagerProps> = ({ houses, inventory }) => {
  const confirm = useConfirm();
  const [requests, setRequests] = useState<AssetBorrowRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [form, setForm] = useState({
    houseId: '',
    borrowerName: '',
    borrowerPhone: '',
    itemName: '',
    quantity: 1,
    borrowDate: new Date().toISOString().split('T')[0],
    returnDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    purpose: '',
    notes: ''
  });

  useEffect(() => {
    const unsub = subscribeToAssetBorrowRequests(setRequests);
    return () => unsub();
  }, []);

  const handleHouseChange = (houseId: string) => {
    const house = houses.find(h => h.id === houseId);
    setForm(prev => ({
      ...prev,
      houseId,
      borrowerName: house ? house.headOfFamily : '',
      borrowerPhone: house ? house.phone || '' : ''
    }));
  };

  const handleSaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.houseId || !form.itemName || form.quantity <= 0) {
      toast.error('Silakan lengkapi data peminjaman.');
      return;
    }

    try {
      await addAssetBorrowRequestToDb({
        ...form,
        status: 'Menunggu'
      });

      setIsAddModalOpen(false);
      setForm({
        houseId: '',
        borrowerName: '',
        borrowerPhone: '',
        itemName: '',
        quantity: 1,
        borrowDate: new Date().toISOString().split('T')[0],
        returnDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        purpose: '',
        notes: ''
      });
      toast.success('Pengajuan peminjaman barang berhasil dibuat!');
    } catch (error) {
      toast.error('Gagal membuat pengajuan.');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'Menunggu' | 'Disetujui' | 'Dipinjam' | 'Dikembalikan' | 'Ditolak') => {
    try {
      await updateAssetBorrowRequestInDb(id, { status: newStatus });
      toast.success(`Status peminjaman diperbarui ke ${newStatus}`);
    } catch (error) {
      toast.error('Gagal memperbarui status.');
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Permohonan',
      message: 'Apakah Anda yakin ingin menghapus data peminjaman barang ini?',
      confirmLabel: 'Hapus',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await deleteAssetBorrowRequestFromDb(id);
        toast.success('Data peminjaman dihapus.');
      } catch (error) {
        toast.error('Gagal menghapus data.');
      }
    }
  };

  const getHouseLabel = (id: string) => {
    const house = houses.find(h => h.id === id);
    return house ? `${house.block}-${house.number}` : id;
  };

  const filteredRequests = requests.filter(r => {
    const houseLabel = getHouseLabel(r.houseId);
    const search = searchQuery.toLowerCase();
    const matchesSearch = r.itemName.toLowerCase().includes(search) || 
                          r.borrowerName.toLowerCase().includes(search) ||
                          houseLabel.toLowerCase().includes(search) ||
                          (r.purpose || '').toLowerCase().includes(search);
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalDipinjam = requests.filter(r => r.status === 'Dipinjam').length;
  const totalMenunggu = requests.filter(r => r.status === 'Menunggu').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 md:p-8 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-mono font-black uppercase tracking-widest mb-2 inline-block">
            📦 LAYANAN INVENTARIS RT 02
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Peminjaman Aset & Barang RT</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Pengajuan peminjaman barang publik milik RT (Tenda, Kursi, Sound System, Terpal, Mesin Rumput).
          </p>
        </div>

        <Button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 text-xs py-3.5 px-6 rounded-2xl font-black uppercase tracking-wider">
          <Plus size={16} className="mr-2" /> Ajukan Pinjam Barang
        </Button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-0.5">SEDANG DIPINJAM</p>
            <p className="text-2xl font-black text-slate-900">{totalDipinjam} <span className="text-xs font-bold text-slate-400">Barang</span></p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <Box size={24} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-0.5">MENUNGGU ACC</p>
            <p className="text-2xl font-black text-slate-900">{totalMenunggu} <span className="text-xs font-bold text-slate-400">Pengajuan</span></p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-0.5">TOTAL PENGAJUAN</p>
            <p className="text-2xl font-black text-slate-900">{requests.length} <span className="text-xs font-bold text-slate-400">Sesi</span></p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <PackageCheck size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Cari barang, nama peminjam, atau nomor rumah..." 
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 border border-slate-200/60 rounded-2xl overflow-x-auto no-scrollbar">
          {(['All', 'Menunggu', 'Disetujui', 'Dipinjam', 'Dikembalikan'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                statusFilter === st 
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80' 
                : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {st === 'All' ? 'Semua Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-200/80">
                <th className="px-6 py-4 text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Nama Barang & Jumlah</th>
                <th className="px-6 py-4 text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Peminjam & Rumah</th>
                <th className="px-6 py-4 text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Jadwal Pinjam - Kembali</th>
                <th className="px-6 py-4 text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest text-right">Aksi & Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-900 leading-none mb-1">{req.itemName}</p>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-mono font-black uppercase">
                      Jumlah: {req.quantity} unit
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-900 leading-none mb-1">{req.borrowerName || '-'}</p>
                    <p className="text-[10px] font-mono text-emerald-600 font-bold">Blok {getHouseLabel(req.houseId)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-800">{new Date(req.borrowDate).toLocaleDateString('id-ID')} - {new Date(req.returnDate).toLocaleDateString('id-ID')}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Tujuan: {req.purpose || '-'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-xl text-[9px] font-mono font-black uppercase tracking-widest border ${
                      req.status === 'Dikembalikan' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : req.status === 'Dipinjam'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : req.status === 'Disetujui'
                        ? 'bg-teal-50 text-teal-700 border-teal-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {req.status === 'Menunggu' && (
                        <button 
                          onClick={() => handleUpdateStatus(req.id, 'Disetujui')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          ACC
                        </button>
                      )}
                      {req.status === 'Disetujui' && (
                        <button 
                          onClick={() => handleUpdateStatus(req.id, 'Dipinjam')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          Serahkan
                        </button>
                      )}
                      {req.status === 'Dipinjam' && (
                        <button 
                          onClick={() => handleUpdateStatus(req.id, 'Dikembalikan')}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          Kembali
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(req.id)}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Hapus Data"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-3 border border-slate-100">
                      <Box size={32} />
                    </div>
                    <p className="text-slate-400 font-bold text-sm">Tidak ada data peminjaman barang ditemukan.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Borrow Request */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Ajukan Peminjaman Inventaris RT">
        <form onSubmit={handleSaveRequest} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Pilih Rumah / Warga</label>
            <select 
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
              value={form.houseId}
              onChange={e => handleHouseChange(e.target.value)}
            >
              <option value="">-- Pilih Rumah Warga --</option>
              {houses.filter(h => h.status === 'Occupied').map(h => (
                <option key={h.id} value={h.id}>Blok {h.block}-{h.number} • {h.headOfFamily}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Nama Barang Inventaris</label>
              <input 
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                value={form.itemName}
                onChange={e => setForm({...form, itemName: e.target.value})}
                placeholder="Tenda Lipat / Sound System"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Jumlah Unit</label>
              <input 
                type="number"
                min="1"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                value={form.quantity}
                onChange={e => setForm({...form, quantity: parseInt(e.target.value) || 1})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Tanggal Pinjam</label>
              <input 
                type="date"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                value={form.borrowDate}
                onChange={e => setForm({...form, borrowDate: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Tanggal Pengembalian</label>
              <input 
                type="date"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                value={form.returnDate}
                onChange={e => setForm({...form, returnDate: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-1.5">Tujuan / Keperluan Pinjam</label>
            <textarea 
              rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all resize-none"
              value={form.purpose}
              onChange={e => setForm({...form, purpose: e.target.value})}
              placeholder="Acara Syukuran Keluarga / Kerja Bakti Warga..."
            />
          </div>

          <Button type="submit" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 mt-2">
            Kirim Permohonan Peminjaman
          </Button>
        </form>
      </Modal>
    </div>
  );
};
