import React, { useState } from 'react';
import { Shield, Package, Plus, Edit2, Trash2, Users, CheckCircle2, AlertTriangle, Box, Calendar, UserCheck, ArrowRight } from 'lucide-react';
import { RondaSchedule, InventoryItem, RondaCheckLog } from '../../types';
import { motion } from 'motion/react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { addInventoryToDb, updateInventoryInDb, deleteInventoryFromDb, updateRondaSchedule } from '../../services/databaseService';

interface FacilityManagerProps {
  ronda: RondaSchedule[];
  inventory: InventoryItem[];
  rondaLogs: RondaCheckLog[];
}

export const FacilityManager: React.FC<FacilityManagerProps> = ({ ronda, inventory, rondaLogs }) => {
  // Ronda State
  const [isRondaModalOpen, setIsRondaModalOpen] = useState(false);
  const [editingRonda, setEditingRonda] = useState<RondaSchedule | null>(null);
  const [rondaMembersInput, setRondaMembersInput] = useState('');

  // Inventory State
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);
  const [editingInvId, setEditingInvId] = useState<string | null>(null);
  const [invName, setInvName] = useState('');
  const [invTotal, setInvTotal] = useState('');
  const [invCondition, setInvCondition] = useState<'Baik' | 'Perlu Perbaikan' | 'Rusak'>('Baik');

  const handleEditRonda = (schedule: RondaSchedule) => {
    setEditingRonda(schedule);
    setRondaMembersInput(schedule.members.join(', '));
    setIsRondaModalOpen(true);
  };

  const handleSaveRonda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRonda || !editingRonda.id) return;
    
    const members = rondaMembersInput.split(',').map(m => m.trim()).filter(m => m !== '');
    await updateRondaSchedule(editingRonda.id, members);
    setIsRondaModalOpen(false);
  };

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
    if (confirm('Hapus barang inventaris ini?')) await deleteInventoryFromDb(id);
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
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Fasilitas & Keamanan</h2>
          <p className="text-slate-500 font-medium mt-1">Kelola jadwal ronda malam dan inventaris aset RT 002.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { resetInvForm(); setIsInvModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus size={16} /> Tambah Inventaris
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ronda Section */}
        <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Jadwal Ronda</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Siskamling Mingguan</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {ronda.map((r) => (
                <div key={r.id || r.day} className="flex justify-between items-center p-5 bg-slate-50/50 border border-slate-100 rounded-3xl hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all group/item">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-sm font-black text-indigo-600 shadow-sm group-hover/item:scale-110 transition-transform">
                      {r.day.substring(0, 3)}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-base">{r.day}</h4>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">
                        <Users size={12} /> {r.members.length} Personil
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleEditRonda(r)}
                    className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Ronda Logs Section */}
        <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group lg:col-span-2">
           <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                  <UserCheck size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Log Siskamling Digital</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Riwayat Absensi & Laporan Ronda</p>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4 rounded-tl-2xl">Waktu</th>
                    <th className="px-6 py-4">Petugas</th>
                    <th className="px-6 py-4">Lokasi</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 rounded-tr-2xl">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rondaLogs.length > 0 ? (
                    rondaLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-600">
                          {new Date(log.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">{log.officerName}</td>
                        <td className="px-6 py-4 text-slate-500">
                           <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                              Pos Utama
                           </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            log.status === 'Aman' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 italic">"{log.note || '-'}"</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-bold italic">
                        Belum ada data log siskamling.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
        </motion.div>

        {/* Inventory Section */}
        <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Inventaris Aset</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aset & Perlengkapan RT</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {inventory.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-5 bg-slate-50/50 border border-slate-100 rounded-3xl hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all group/item">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover/item:scale-110 transition-transform">
                      <Box size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-base">{item.name}</h4>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">
                        <CheckCircle2 size={12} /> {item.total} Unit Tersedia
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      item.condition === 'Baik' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      item.condition === 'Rusak' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                      'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {item.condition}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <button onClick={() => handleEditInventory(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteInventory(item.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {inventory.length === 0 && (
                <div className="text-center py-12 px-8 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4 shadow-sm">
                    <Package size={32} />
                  </div>
                  <p className="text-slate-400 font-bold text-sm">Belum ada data inventaris.</p>
                  <button onClick={() => { resetInvForm(); setIsInvModalOpen(true); }} className="mt-4 text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Tambah Sekarang</button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Ronda Modal */}
      <Modal isOpen={isRondaModalOpen} onClose={() => setIsRondaModalOpen(false)} title={`Edit Jadwal Ronda: ${editingRonda?.day}`}>
        <form onSubmit={handleSaveRonda} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700">Petugas Ronda (Pisahkan dengan koma)</label>
            <textarea 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all h-32"
              value={rondaMembersInput}
              onChange={e => setRondaMembersInput(e.target.value)}
              placeholder="Contoh: Budi, Anto, Joko..."
            />
            <p className="text-[10px] text-slate-400 mt-1.5">*Masukkan nama warga yang bertugas pada hari ini.</p>
          </div>
          <Button type="submit" className="w-full py-3">Simpan Jadwal</Button>
        </form>
      </Modal>

      {/* Inventory Modal */}
      <Modal isOpen={isInvModalOpen} onClose={() => setIsInvModalOpen(false)} title={editingInvId ? "Edit Barang" : "Tambah Barang Baru"}>
        <form onSubmit={handleSaveInventory} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700">Nama Barang</label>
            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={invName} onChange={e => setInvName(e.target.value)} required placeholder="Contoh: Tenda..." />
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
          <Button type="submit" className="w-full py-3 mt-2">{editingInvId ? 'Simpan Perubahan' : 'Simpan Barang'}</Button>
        </form>
      </Modal>
    </motion.div>
  );
};
