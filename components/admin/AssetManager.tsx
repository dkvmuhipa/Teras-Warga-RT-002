import React, { useState } from 'react';
import { Package, Plus, Edit2, Trash2, Box, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { InventoryItem } from '../../types';
import { addInventoryToDb, updateInventoryInDb, deleteInventoryFromDb } from '../../services/databaseService';

interface AssetManagerProps {
  inventory: InventoryItem[];
}

export const AssetManager: React.FC<AssetManagerProps> = ({ inventory }) => {
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);
  const [editingInvId, setEditingInvId] = useState<string | null>(null);
  const [invName, setInvName] = useState('');
  const [invTotal, setInvTotal] = useState('');
  const [invCondition, setInvCondition] = useState<'Baik' | 'Perlu Perbaikan' | 'Rusak'>('Baik');

  const resetInvForm = () => {
    setInvName(''); setInvTotal(''); setInvCondition('Baik'); setEditingInvId(null);
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
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
            <span className={`inline-block mt-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
              item.condition === 'Baik' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
              item.condition === 'Rusak' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
              'bg-amber-50 text-amber-600 border-amber-100'
            }`}>
              {item.condition}
            </span>
          </div>
        ))}
      </div>

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
    </motion.div>
  );
};
