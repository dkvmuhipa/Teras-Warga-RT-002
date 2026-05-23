import React, { useState, useEffect } from 'react';
import { Plus, Search, Heart, Activity, User, Calendar, Trash2, Edit2, TrendingUp, TrendingDown, Scale, Ruler, Thermometer, Droplets, ShieldCheck, Info } from 'lucide-react';
import { HealthRecord, House } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { 
  subscribeToHealthRecords, 
  addHealthRecordToDb, 
  updateHealthRecordInDb, 
  deleteHealthRecordFromDb,
  handleFirestoreError,
  OperationType
} from '../../services/databaseService';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useConfirm } from '../../context/ConfirmContext';

interface HealthManagementProps {
  houses: House[];
}

export const HealthManagement: React.FC<HealthManagementProps> = ({ houses }) => {
  const confirm = useConfirm();
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
    headCircumference: undefined as number | undefined,
    lila: undefined as number | undefined,
    bloodSugar: undefined as number | undefined,
    cholesterol: undefined as number | undefined,
    uricAcid: undefined as number | undefined,
    immunizationType: '',
    vitaminA: false,
    deworming: false,
    complaints: '',
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
        toast.success('Data kesehatan berhasil diperbarui!');
      } else {
        await addHealthRecordToDb(form);
        toast.success('Data kesehatan berhasil disimpan!');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, editingRecordId ? OperationType.UPDATE : OperationType.CREATE, "healthRecords");
      toast.error('Gagal menyimpan data kesehatan.');
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
      headCircumference: undefined,
      lila: undefined,
      bloodSugar: undefined,
      cholesterol: undefined,
      uricAcid: undefined,
      immunizationType: '',
      vitaminA: false,
      deworming: false,
      complaints: '',
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
      headCircumference: record.headCircumference,
      lila: record.lila,
      bloodSugar: record.bloodSugar,
      cholesterol: record.cholesterol,
      uricAcid: record.uricAcid,
      immunizationType: record.immunizationType || '',
      vitaminA: record.vitaminA || false,
      deworming: record.deworming || false,
      complaints: record.complaints || '',
      notes: record.notes || '',
      officerName: record.officerName
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Data Kesehatan',
      message: 'Apakah Anda yakin ingin menghapus data kesehatan ini? Tindakan ini tidak dapat dibatalkan.',
      confirmLabel: 'Hapus',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await deleteHealthRecordFromDb(id);
        toast.success('Data kesehatan berhasil dihapus.');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `healthRecords/${id}`);
        toast.error('Gagal menghapus data kesehatan.');
      }
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.houseId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories: HealthRecord['category'][] = ['Bayi', 'Balita', 'Remaja', 'Dewasa', 'Ibu Hamil', 'Lansia'];

  const stats = {
    total: records.length,
    thisMonth: records.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).length,
    categories: categories.map(cat => ({
      label: cat,
      count: records.filter(r => r.category === cat).length
    }))
  };

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Posyandu <span className="text-emerald-600 italic font-serif">Digital</span></h2>
          <p className="text-slate-500 font-medium max-w-md">Manajemen rekam medis warga untuk pemantauan kesehatan lingkungan yang proaktif.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-slate-950 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-xl shadow-slate-200 transition-all group">
            <Plus size={18} className="mr-2 group-hover:rotate-90 transition-transform" /> Tambah Rekam Medis
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="col-span-2 bg-emerald-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-emerald-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-xl"><Activity size={20} /></div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Bulan Ini</span>
          </div>
          <div>
            <p className="text-4xl font-black tracking-tighter mb-1">{stats.thisMonth}</p>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Pemeriksaan Baru</p>
          </div>
        </div>
        {stats.categories.map((cat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{cat.label}</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{cat.count}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Cari nama warga atau blok rumah..." 
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
            <button 
              onClick={() => setSelectedCategory('All')}
              className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedCategory === 'All' ? 'bg-slate-950 text-white shadow-xl shadow-slate-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
            >
              Semua Kategori
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  selectedCategory === cat ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => (
              <motion.div
                key={record.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/40 transition-all group overflow-hidden flex flex-col"
              >
                <div className="p-8 flex-1">
                  <div className="flex justify-between items-start mb-8">
                    <div className={`p-4 rounded-3xl shadow-inner ${
                      record.category === 'Bayi' || record.category === 'Balita' ? 'bg-blue-50 text-blue-600' :
                      record.category === 'Remaja' ? 'bg-indigo-50 text-indigo-600' :
                      record.category === 'Dewasa' ? 'bg-emerald-50 text-emerald-600' :
                      record.category === 'Ibu Hamil' ? 'bg-rose-50 text-rose-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      <Heart size={24} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(record)} className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(record.id)} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors tracking-tight">{record.residentName}</h3>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-lg">
                        {record.category}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Blok {record.houseId}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {[
                      { label: 'Berat', value: record.weight, unit: 'kg', icon: Scale, color: 'text-blue-500' },
                      { label: 'Tinggi', value: record.height, unit: 'cm', icon: Ruler, color: 'text-emerald-500' },
                      { label: 'LK', value: record.headCircumference, unit: 'cm', icon: Info, color: 'text-blue-400' },
                      { label: 'LILA', value: record.lila, unit: 'cm', icon: Info, color: 'text-orange-400' },
                      { label: 'Tensi', value: record.bloodPressure, unit: '', icon: Activity, color: 'text-rose-500' },
                      { label: 'Suhu', value: record.temperature, unit: '°C', icon: Thermometer, color: 'text-amber-500' },
                    ].filter(item => item.value || item.label === 'Tensi').map((item, i) => (
                      <div key={i} className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 group-hover:bg-white transition-colors">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <item.icon size={12} className={item.color} /> {item.label}
                        </p>
                        <p className="text-lg font-black text-slate-800">{item.value || '--'} <span className="text-[10px] text-slate-400 font-bold">{item.unit}</span></p>
                      </div>
                    ))}
                  </div>

                  {record.notes && (
                    <div className="p-5 bg-emerald-50/50 rounded-[2rem] border border-emerald-100 mb-8">
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">Catatan Medis</p>
                      <p className="text-xs font-medium text-slate-600 leading-relaxed italic">"{record.notes}"</p>
                    </div>
                  )}

                  {record.complaints && (
                    <div className="p-5 bg-amber-50/50 rounded-[2rem] border border-amber-100 mb-8">
                      <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2">Keluhan</p>
                      <p className="text-xs font-medium text-slate-600 leading-relaxed italic">"{record.complaints}"</p>
                    </div>
                  )}

                  {(record.vitaminA || record.deworming || record.immunizationType) && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {record.vitaminA && (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1">
                          <ShieldCheck size={10} /> Vitamin A
                        </span>
                      )}
                      {record.deworming && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1">
                          <ShieldCheck size={10} /> Obat Cacing
                        </span>
                      )}
                      {record.immunizationType && (
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1">
                          <ShieldCheck size={10} /> {record.immunizationType}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                      <User size={14} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Petugas</p>
                      <p className="text-xs font-bold text-slate-700">{record.officerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tanggal</p>
                    <p className="text-xs font-bold text-slate-700">{new Date(record.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
              <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mx-auto mb-8">
                <Activity size={48} />
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Belum Ada Data</h4>
              <p className="text-slate-400 font-medium max-w-xs mx-auto text-sm">Silakan tambah rekam medis baru untuk memulai pemantauan kesehatan warga.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Form Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingRecordId ? "Perbarui Rekam Medis" : "Rekam Medis Baru"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-10 p-1">
          {/* Section: Identitas */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <User size={16} />
              </div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Identitas Pasien</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300"
                    value={form.residentName}
                    onChange={e => setForm({...form, residentName: e.target.value})}
                    placeholder="Nama Sesuai KTP/KIA"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Blok Kediaman</label>
                <div className="relative group">
                  <Activity className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300"
                    value={form.houseId}
                    onChange={e => setForm({...form, houseId: e.target.value})}
                    placeholder="Contoh: C10-08"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Kategori & Tanggal */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Calendar size={16} />
              </div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Waktu & Kategori</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Pemeriksaan</label>
                <div className="relative group">
                  <Heart className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors pointer-events-none" size={18} />
                  <select 
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                    value={form.category}
                    onChange={e => setForm({...form, category: e.target.value as HealthRecord['category']})}
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <TrendingDown size={14} />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Pemeriksaan</label>
                <div className="relative group">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <input 
                    type="date" 
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all"
                    value={form.date}
                    onChange={e => setForm({...form, date: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Data Vital */}
          <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Activity size={120} />
            </div>
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Activity size={16} />
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Data Vital & Fisik</h4>
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">Metrik Medis</span>
            </div>

            <div className="grid grid-cols-3 gap-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Scale size={12} className="text-blue-500" /> Berat (kg)
                </label>
                <input 
                  type="number" 
                  step="0.1"
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all shadow-sm"
                  value={form.weight || ''}
                  onChange={e => setForm({...form, weight: e.target.value ? parseFloat(e.target.value) : undefined})}
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Ruler size={12} className="text-emerald-500" /> Tinggi (cm)
                </label>
                <input 
                  type="number" 
                  step="0.1"
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all shadow-sm"
                  value={form.height || ''}
                  onChange={e => setForm({...form, height: e.target.value ? parseFloat(e.target.value) : undefined})}
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Thermometer size={12} className="text-amber-500" /> Suhu (°C)
                </label>
                <input 
                  type="number" 
                  step="0.1"
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 outline-none transition-all shadow-sm"
                  value={form.temperature || ''}
                  onChange={e => setForm({...form, temperature: e.target.value ? parseFloat(e.target.value) : undefined})}
                  placeholder="36.5"
                />
              </div>
            </div>

            {/* Posyandu & Lansia Specifics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10 pt-4 border-t border-slate-200/50">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Lingkar Kepala (cm)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-blue-500 outline-none transition-all"
                  value={form.headCircumference || ''}
                  onChange={e => setForm({...form, headCircumference: e.target.value ? parseFloat(e.target.value) : undefined})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">LILA (cm)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                  value={form.lila || ''}
                  onChange={e => setForm({...form, lila: e.target.value ? parseFloat(e.target.value) : undefined})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Gula Darah</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-orange-500 outline-none transition-all"
                  value={form.bloodSugar || ''}
                  onChange={e => setForm({...form, bloodSugar: e.target.value ? parseFloat(e.target.value) : undefined})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Kolesterol</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-red-500 outline-none transition-all"
                  value={form.cholesterol || ''}
                  onChange={e => setForm({...form, cholesterol: e.target.value ? parseFloat(e.target.value) : undefined})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Asam Urat</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-yellow-500 outline-none transition-all"
                  value={form.uricAcid || ''}
                  onChange={e => setForm({...form, uricAcid: e.target.value ? parseFloat(e.target.value) : undefined})}
                />
              </div>
              <div className="flex items-end gap-4 pb-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded-lg border-slate-200 text-emerald-600 focus:ring-emerald-500 transition-all"
                    checked={form.vitaminA}
                    onChange={e => setForm({...form, vitaminA: e.target.checked})}
                  />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">Vitamin A</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500 transition-all"
                    checked={form.deworming}
                    onChange={e => setForm({...form, deworming: e.target.checked})}
                  />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Obat Cacing</span>
                </label>
              </div>
            </div>

            <div className="space-y-2 relative z-10">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Jenis Imunisasi (Jika Ada)</label>
              <input 
                type="text" 
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-all shadow-sm"
                value={form.immunizationType}
                onChange={e => setForm({...form, immunizationType: e.target.value})}
                placeholder="Contoh: DPT-HB-Hib 1, Polio 1, dll"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Activity size={12} className="text-rose-500" /> Tensi Darah
                </label>
                <input 
                  type="text" 
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500 outline-none transition-all shadow-sm"
                  value={form.bloodPressure}
                  onChange={e => setForm({...form, bloodPressure: e.target.value})}
                  placeholder="Contoh: 120/80"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <ShieldCheck size={12} className="text-emerald-500" /> Nama Petugas
                </label>
                <input 
                  type="text" 
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all shadow-sm"
                  value={form.officerName}
                  onChange={e => setForm({...form, officerName: e.target.value})}
                  placeholder="Nama Petugas Pemeriksa"
                />
              </div>
            </div>
          </div>

          {/* Section: Catatan */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                <Info size={16} />
              </div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Catatan & Analisis</h4>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keluhan (Lansia/Dewasa)</label>
              <textarea 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-8 focus:ring-amber-500/5 focus:border-amber-500 outline-none transition-all min-h-[80px] placeholder:text-slate-300"
                value={form.complaints}
                onChange={e => setForm({...form, complaints: e.target.value})}
                placeholder="Tuliskan keluhan pasien jika ada..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan Medis / Saran</label>
              <textarea 
                className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-bold focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all min-h-[120px] placeholder:text-slate-300"
                value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
                placeholder="Berikan saran atau catatan perkembangan kesehatan warga secara detail..."
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsModalOpen(false)} 
              className="flex-1 py-5 rounded-2xl border-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50"
            >
              Batalkan
            </Button>
            <Button 
              type="submit" 
              className="flex-[2] py-5 bg-slate-950 hover:bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-slate-200 transition-all active:scale-[0.98]"
            >
              {editingRecordId ? 'Perbarui Data Rekam Medis' : 'Simpan Rekam Medis Baru'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
