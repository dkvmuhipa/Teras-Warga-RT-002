import React, { useState, useEffect } from 'react';
import { Plus, Search, Heart, Activity, User, Calendar, Trash2, Edit2, TrendingUp, TrendingDown, Scale, Ruler, Thermometer, Droplets } from 'lucide-react';
import { HealthRecord, House } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { 
  subscribeToHealthRecords, 
  addHealthRecordToDb, 
  updateHealthRecordInDb, 
  deleteHealthRecordFromDb 
} from '../../services/databaseService';
import { motion, AnimatePresence } from 'motion/react';

interface HealthManagementProps {
  houses: House[];
}

export const HealthManagement: React.FC<HealthManagementProps> = ({ houses }) => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<HealthRecord['category'] | 'All'>('All');
  
  const [form, setForm] = useState({
    residentName: '',
    houseId: '',
    category: 'Balita' as HealthRecord['category'],
    date: new Date().toISOString().slice(0, 10),
    weight: undefined as number | undefined,
    height: undefined as number | undefined,
    bloodPressure: '',
    heartRate: undefined as number | undefined,
    temperature: undefined as number | undefined,
    notes: '',
    officerName: ''
  });

  useEffect(() => {
    const unsubscribe = subscribeToHealthRecords(setRecords);
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRecordId) {
        await updateHealthRecordInDb(editingRecordId, form);
      } else {
        await addHealthRecordToDb(form);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan data kesehatan.');
    }
  };

  const resetForm = () => {
    setForm({
      residentName: '',
      houseId: '',
      category: 'Balita',
      date: new Date().toISOString().slice(0, 10),
      weight: undefined,
      height: undefined,
      bloodPressure: '',
      heartRate: undefined,
      temperature: undefined,
      notes: '',
      officerName: ''
    });
    setEditingRecordId(null);
  };

  const openEdit = (record: HealthRecord) => {
    setEditingRecordId(record.id);
    setForm({
      residentName: record.residentName,
      houseId: record.houseId,
      category: record.category,
      date: record.date.slice(0, 10),
      weight: record.weight,
      height: record.height,
      bloodPressure: record.bloodPressure || '',
      heartRate: record.heartRate,
      temperature: record.temperature,
      notes: record.notes || '',
      officerName: record.officerName
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus data kesehatan ini?')) {
      await deleteHealthRecordFromDb(id);
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.houseId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories: HealthRecord['category'][] = ['Bayi', 'Balita', 'Ibu Hamil', 'Lansia'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Monitoring Kesehatan & Posyandu</h2>
          <p className="text-slate-500 text-sm font-medium">Pantau kesehatan warga secara berkala untuk lingkungan yang lebih sehat.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200">
          <Plus size={18} className="mr-2" /> Tambah Data
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Cari nama warga atau blok..." 
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
          <button 
            onClick={() => setSelectedCategory('All')}
            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              selectedCategory === 'All' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Semua
          </button>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedCategory === cat ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredRecords.map((record) => (
            <motion.div
              key={record.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl shadow-sm ${
                    record.category === 'Bayi' || record.category === 'Balita' ? 'bg-blue-50 text-blue-600' :
                    record.category === 'Ibu Hamil' ? 'bg-rose-50 text-rose-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    <Heart size={20} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(record)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(record.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-black text-slate-800 leading-tight group-hover:text-emerald-600 transition-colors">{record.residentName}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Blok {record.houseId} • {record.category}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {record.weight && (
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Scale size={10} /> Berat
                      </p>
                      <p className="text-sm font-black text-slate-700">{record.weight} kg</p>
                    </div>
                  )}
                  {record.height && (
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Ruler size={10} /> Tinggi
                      </p>
                      <p className="text-sm font-black text-slate-700">{record.height} cm</p>
                    </div>
                  )}
                  {record.bloodPressure && (
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Activity size={10} /> Tensi
                      </p>
                      <p className="text-sm font-black text-slate-700">{record.bloodPressure}</p>
                    </div>
                  )}
                  {record.temperature && (
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Thermometer size={10} /> Suhu
                      </p>
                      <p className="text-sm font-black text-slate-700">{record.temperature} °C</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-50 space-y-2">
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                    <Calendar size={14} className="text-emerald-500" />
                    {new Date(record.date).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                    <User size={14} className="text-emerald-500" />
                    Petugas: {record.officerName}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Form Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRecordId ? "Edit Data Kesehatan" : "Tambah Data Kesehatan"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Nama Warga</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                value={form.residentName}
                onChange={e => setForm({...form, residentName: e.target.value})}
                placeholder="Nama lengkap"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Blok Rumah</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                value={form.houseId}
                onChange={e => setForm({...form, houseId: e.target.value})}
                placeholder="Contoh: C10-08"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Kategori</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value as HealthRecord['category']})}
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Tanggal Pemeriksaan</label>
              <input 
                type="date" 
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                value={form.date}
                onChange={e => setForm({...form, date: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Berat (kg)</label>
              <input 
                type="number" 
                step="0.1"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                value={form.weight || ''}
                onChange={e => setForm({...form, weight: e.target.value ? parseFloat(e.target.value) : undefined})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Tinggi (cm)</label>
              <input 
                type="number" 
                step="0.1"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                value={form.height || ''}
                onChange={e => setForm({...form, height: e.target.value ? parseFloat(e.target.value) : undefined})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Suhu (°C)</label>
              <input 
                type="number" 
                step="0.1"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                value={form.temperature || ''}
                onChange={e => setForm({...form, temperature: e.target.value ? parseFloat(e.target.value) : undefined})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Tensi Darah</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                value={form.bloodPressure}
                onChange={e => setForm({...form, bloodPressure: e.target.value})}
                placeholder="Contoh: 120/80"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Nama Petugas</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                value={form.officerName}
                onChange={e => setForm({...form, officerName: e.target.value})}
                placeholder="Nama petugas pemeriksa"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Catatan Tambahan</label>
            <textarea 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all min-h-[80px]"
              value={form.notes}
              onChange={e => setForm({...form, notes: e.target.value})}
              placeholder="Keterangan tambahan..."
            />
          </div>

          <Button type="submit" className="w-full py-4 shadow-xl shadow-emerald-200 mt-4 bg-emerald-600 hover:bg-emerald-700">
            {editingRecordId ? 'Simpan Perubahan' : 'Simpan Data'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
