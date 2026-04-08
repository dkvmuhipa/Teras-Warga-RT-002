import React, { useState } from 'react';
import { Search, Filter, Download, Plus, Calendar, FileText, CheckCircle, XCircle, AlertCircle, Trash2, Edit2 } from 'lucide-react';
import { House, PbbRecord } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { addPbbRecordToDb, updatePbbRecordInDb, deletePbbRecordFromDb, logAction, handleFirestoreError, OperationType } from '../../services/databaseService';
import { toast } from 'sonner';

interface PbbManagerProps {
  houses: House[];
  pbbRecords: PbbRecord[];
}

export const PbbManager: React.FC<PbbManagerProps> = ({ houses, pbbRecords }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState<'All' | 'Paid' | 'Unpaid'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [selectedHouseId, setSelectedHouseId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'Paid' | 'Unpaid'>('Unpaid');
  const [nop, setNop] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredRecords = pbbRecords.filter(record => {
    const house = houses.find(h => h.id === record.houseId);
    const houseName = house ? house.headOfFamily.toLowerCase() : '';
    const houseId = record.houseId.toLowerCase();
    const matchSearch = houseName.includes(searchTerm.toLowerCase()) || houseId.includes(searchTerm.toLowerCase()) || (record.nop || '').includes(searchTerm);
    const matchYear = record.year === selectedYear;
    const matchStatus = filterStatus === 'All' || record.status === filterStatus;
    return matchSearch && matchYear && matchStatus;
  });

  const resetForm = () => {
    setSelectedHouseId('');
    setYear(new Date().getFullYear());
    setAmount('');
    setStatus('Unpaid');
    setNop('');
    setNotes('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      houseId: selectedHouseId,
      year,
      amount: parseInt(amount),
      status,
      nop,
      notes,
      paymentDate: status === 'Paid' ? paymentDate : undefined
    };

    try {
      if (editingId) {
        await updatePbbRecordInDb(editingId, data);
        await logAction('Update PBB', `Update data PBB ${year} untuk rumah ${selectedHouseId}`);
        toast.success('Data PBB berhasil diperbarui!');
      } else {
        await addPbbRecordToDb(data);
        await logAction('Tambah PBB', `Tambah data PBB ${year} untuk rumah ${selectedHouseId}`);
        toast.success('Data PBB berhasil ditambahkan!');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, "pbbRecords");
      toast.error('Gagal menyimpan data PBB.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus data PBB ini?')) {
      try {
        await deletePbbRecordFromDb(id);
        await logAction('Hapus PBB', `Hapus data PBB ID: ${id}`);
        toast.success('Data PBB berhasil dihapus.');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `pbbRecords/${id}`);
        toast.error('Gagal menghapus data PBB.');
      }
    }
  };

  const openEdit = (record: PbbRecord) => {
    setEditingId(record.id);
    setSelectedHouseId(record.houseId);
    setYear(record.year);
    setAmount(record.amount.toString());
    setStatus(record.status);
    setNop(record.nop || '');
    setNotes(record.notes || '');
    setPaymentDate(record.paymentDate || new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen PBB</h2>
          <p className="text-sm text-slate-500 font-medium">Pantau dan kelola pembayaran Pajak Bumi dan Bangunan warga.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus size={16} /> Catat PBB
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Cari warga atau NOP..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
          <Calendar size={14} className="text-slate-400" />
          <select 
            className="bg-transparent border-none text-xs font-bold text-slate-600 outline-none w-full"
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
          >
            {years.map(y => <option key={y} value={y}>Tahun {y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
          <Filter size={14} className="text-slate-400" />
          <select 
            className="bg-transparent border-none text-xs font-bold text-slate-600 outline-none w-full"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
          >
            <option value="All">Semua Status</option>
            <option value="Paid">Lunas</option>
            <option value="Unpaid">Belum Lunas</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Warga / Rumah</th>
                <th className="px-6 py-4">NOP</th>
                <th className="px-6 py-4">Tahun</th>
                <th className="px-6 py-4 text-right">Nominal</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.map(record => {
                const house = houses.find(h => h.id === record.houseId);
                return (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-black text-slate-800">{house?.headOfFamily || 'Warga Tidak Ditemukan'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{record.houseId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{record.nop || '-'}</td>
                    <td className="px-6 py-4 font-bold text-slate-600">{record.year}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-800">Rp {record.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        record.status === 'Paid' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {record.status === 'Paid' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                        {record.status === 'Paid' ? 'Lunas' : 'Belum Lunas'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openEdit(record)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(record.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4">
                      <FileText size={32} />
                    </div>
                    <p className="text-slate-400 font-bold">Tidak ada data PBB ditemukan.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Data PBB" : "Catat Pembayaran PBB"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700">Pilih Rumah</label>
            <select 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
              value={selectedHouseId}
              onChange={e => setSelectedHouseId(e.target.value)}
            >
              <option value="">-- Pilih Rumah --</option>
              {houses.filter(h => h.status === 'Occupied').sort((a, b) => a.id.localeCompare(b.id)).map(h => (
                <option key={h.id} value={h.id}>{h.id} - {h.headOfFamily}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-700">Tahun Pajak</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                value={year}
                onChange={e => setYear(parseInt(e.target.value))}
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-700">Nominal (Rp)</label>
              <input 
                type="number" 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700">NOP (Nomor Objek Pajak)</label>
            <input 
              type="text" 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
              value={nop}
              onChange={e => setNop(e.target.value)}
              placeholder="Contoh: 32.73.010..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-700">Status Pembayaran</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                value={status}
                onChange={e => setStatus(e.target.value as any)}
              >
                <option value="Unpaid">Belum Lunas</option>
                <option value="Paid">Lunas</option>
              </select>
            </div>
            {status === 'Paid' && (
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700">Tanggal Bayar</label>
                <input 
                  type="date" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700">Catatan</label>
            <textarea 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 min-h-[80px]"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Tambahkan catatan jika perlu..."
            />
          </div>

          <Button type="submit" className="w-full py-3 mt-2">
            {editingId ? 'Simpan Perubahan' : 'Simpan Data PBB'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
