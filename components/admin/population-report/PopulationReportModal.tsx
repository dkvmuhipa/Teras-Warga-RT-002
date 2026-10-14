import React from 'react';
import { 
  FileText, Calendar, RefreshCw, Sparkles, TrendingUp, 
  Users, Baby, Activity, ArrowRight, Accessibility, Heart, 
  Clock, User, Plus, Trash2 
} from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { PopulationReport } from '../../../types';
import { PopulationReportFormData } from './types';

interface PopulationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: PopulationReportFormData;
  setFormData: React.Dispatch<React.SetStateAction<PopulationReportFormData>>;
  reports: PopulationReport[];
  onAutoCalculateCurrentMonth: () => void;
  isGeneratingLogs: boolean;
}

export const PopulationReportModal: React.FC<PopulationReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  reports,
  onAutoCalculateCurrentMonth,
  isGeneratingLogs,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Laporan Bulanan" maxWidth="max-w-4xl">
      <form onSubmit={onSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
        {/* Header Info */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-3xl text-white shadow-lg shadow-indigo-600/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Formulir Laporan Bulanan</h3>
              <p className="text-indigo-100 text-xs font-medium opacity-80">Silakan lengkapi data kependudukan periode ini.</p>
            </div>
          </div>
        </div>

        {/* Periode Section */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={14} /> Periode Laporan
            </h4>
            <button
              type="button"
              onClick={onAutoCalculateCurrentMonth}
              disabled={isGeneratingLogs}
              className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Hitung otomatis seluruh data demografi & mutasi untuk bulan ini"
            >
              <RefreshCw size={13} className={isGeneratingLogs ? "animate-spin" : ""} />
              Auto-Kalkulasi Bulan Ini
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Pilih Bulan & Tahun (YYYY-MM)</label>
              <div className="relative">
                <input 
                  type="month" 
                  value={formData.month} 
                  onChange={e => {
                    const newMonth = e.target.value;
                    const year = newMonth ? parseInt(newMonth.split('-')[0]) : new Date().getFullYear();
                    
                    // Auto-sync initial population from previous month's final population
                    const sorted = [...(reports || [])].sort((a, b) => (a.month || '').localeCompare(b.month || ''));
                    const prevRep = sorted.filter(r => (r.month || '') < newMonth).pop();
                    const autoInitial = prevRep ? (prevRep.initialPopulation + prevRep.birthCount + prevRep.newcomerCount - prevRep.movedOutCount - (prevRep.deathCount || 0)) : formData.initialPopulation;

                    setFormData(prev => ({ ...prev, month: newMonth, year, initialPopulation: autoInitial }));
                  }} 
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer" 
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Tahun</label>
              <input 
                type="number" 
                value={formData.year} 
                onChange={e => setFormData({...formData, year: parseInt(e.target.value) || new Date().getFullYear()})} 
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
              />
            </div>
          </div>
        </div>

        {/* Live Mathematical Formula Banner */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-blue-500/10 p-4 rounded-2xl border border-indigo-200/60 text-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-indigo-900">
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" /> Live Formula Matematika Demografi
            </span>
            <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[9px] font-black">Validasi Otomatis</span>
          </div>
          <p className="text-xs font-mono font-bold text-slate-700 leading-relaxed pt-1">
            <span className="text-slate-900 font-extrabold">{formData.initialPopulation}</span> (Awal) + <span className="text-emerald-600 font-extrabold">{formData.birthCount}</span> (Lahir) + <span className="text-blue-600 font-extrabold">{formData.newcomerCount}</span> (Datang) - <span className="text-rose-600 font-extrabold">{formData.deathCount || 0}</span> (Mati) - <span className="text-amber-600 font-extrabold">{formData.movedOutCount}</span> (Keluar) = <span className="text-indigo-700 font-black text-sm bg-white px-2 py-0.5 rounded-lg border border-indigo-200 shadow-xs">{formData.initialPopulation + formData.birthCount + formData.newcomerCount - formData.movedOutCount - (formData.deathCount || 0)} Jiwa (Akhir)</span>
          </p>
        </div>

        {/* Data Utama Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-5 shadow-sm">
          <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={14} /> Angka Perubahan & Mutasi per Gender (L/P)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Penduduk Awal Bulan dengan Gender */}
            <div className="col-span-full bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Penduduk Awal Bulan (Total)</label>
                <span className="text-xs font-black text-slate-700">{formData.initialPopulation} Jiwa</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400"><Users size={18} /></div>
                <input 
                  type="number" 
                  value={formData.initialPopulation} 
                  onChange={e => setFormData({...formData, initialPopulation: parseInt(e.target.value) || 0})} 
                  className="w-24 p-2 bg-white border border-slate-200 rounded-xl text-base font-black text-slate-800 outline-none" 
                />
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div className="bg-white p-2 rounded-xl border border-slate-200 flex items-center gap-2">
                    <span className="text-[10px] font-black text-blue-600 uppercase">L:</span>
                    <input type="number" value={formData.initialMaleCount || 0} onChange={e => setFormData({...formData, initialMaleCount: parseInt(e.target.value) || 0})} className="w-full bg-transparent font-bold text-slate-800 text-xs outline-none" placeholder="0" />
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 flex items-center gap-2">
                    <span className="text-[10px] font-black text-pink-600 uppercase">P:</span>
                    <input type="number" value={formData.initialFemaleCount || 0} onChange={e => setFormData({...formData, initialFemaleCount: parseInt(e.target.value) || 0})} className="w-full bg-transparent font-bold text-slate-800 text-xs outline-none" placeholder="0" />
                  </div>
                </div>
              </div>
            </div>

            {/* Kelahiran & Pendatang (Masuk) */}
            <div className="space-y-4">
              <div className="p-4.5 bg-emerald-50/60 rounded-3xl border border-emerald-200/80 space-y-3 shadow-xs">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Baby size={14} /> Kelahiran (+)
                  </label>
                  <span className="text-xs font-black text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">+{formData.birthCount} Jiwa</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-emerald-200/80">
                    <span className="text-[10px] font-black text-slate-400 uppercase w-12 shrink-0">Total:</span>
                    <input type="number" value={formData.birthCount} onChange={e => setFormData({...formData, birthCount: parseInt(e.target.value) || 0})} className="w-full bg-transparent text-sm font-black text-emerald-800 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded-xl border border-blue-200/80 flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-blue-600 shrink-0">L:</span>
                      <input type="number" value={formData.birthMaleCount || 0} onChange={e => setFormData({...formData, birthMaleCount: parseInt(e.target.value) || 0})} className="w-full bg-transparent font-bold text-xs outline-none text-slate-800" placeholder="0" />
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-pink-200/80 flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-pink-600 shrink-0">P:</span>
                      <input type="number" value={formData.birthFemaleCount || 0} onChange={e => setFormData({...formData, birthFemaleCount: parseInt(e.target.value) || 0})} className="w-full bg-transparent font-bold text-xs outline-none text-slate-800" placeholder="0" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4.5 bg-blue-50/60 rounded-3xl border border-blue-200/80 space-y-3 shadow-xs">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={14} /> Pendatang Masuk (+)
                  </label>
                  <span className="text-xs font-black text-blue-700 bg-white px-2 py-0.5 rounded-lg border border-blue-200 shadow-2xs">+{formData.newcomerCount} Jiwa</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-blue-200/80">
                    <span className="text-[10px] font-black text-slate-400 uppercase w-12 shrink-0">Total:</span>
                    <input type="number" value={formData.newcomerCount} onChange={e => setFormData({...formData, newcomerCount: parseInt(e.target.value) || 0})} className="w-full bg-transparent text-sm font-black text-blue-800 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded-xl border border-blue-200/80 flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-blue-600 shrink-0">L:</span>
                      <input type="number" value={formData.newcomerMaleCount || 0} onChange={e => setFormData({...formData, newcomerMaleCount: parseInt(e.target.value) || 0})} className="w-full bg-transparent font-bold text-xs outline-none text-slate-800" placeholder="0" />
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-pink-200/80 flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-pink-600 shrink-0">P:</span>
                      <input type="number" value={formData.newcomerFemaleCount || 0} onChange={e => setFormData({...formData, newcomerFemaleCount: parseInt(e.target.value) || 0})} className="w-full bg-transparent font-bold text-xs outline-none text-slate-800" placeholder="0" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kematian & Pindah Keluar */}
            <div className="space-y-4">
              <div className="p-4.5 bg-rose-50/60 rounded-3xl border border-rose-200/80 space-y-3 shadow-xs">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity size={14} /> Kematian (-)
                  </label>
                  <span className="text-xs font-black text-rose-700 bg-white px-2 py-0.5 rounded-lg border border-rose-200 shadow-2xs">-{formData.deathCount || 0} Jiwa</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-rose-200/80">
                    <span className="text-[10px] font-black text-slate-400 uppercase w-12 shrink-0">Total:</span>
                    <input type="number" value={formData.deathCount} onChange={e => setFormData({...formData, deathCount: parseInt(e.target.value) || 0})} className="w-full bg-transparent text-sm font-black text-rose-800 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded-xl border border-blue-200/80 flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-blue-600 shrink-0">L:</span>
                      <input type="number" value={formData.deathMaleCount || 0} onChange={e => setFormData({...formData, deathMaleCount: parseInt(e.target.value) || 0})} className="w-full bg-transparent font-bold text-xs outline-none text-slate-800" placeholder="0" />
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-pink-200/80 flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-pink-600 shrink-0">P:</span>
                      <input type="number" value={formData.deathFemaleCount || 0} onChange={e => setFormData({...formData, deathFemaleCount: parseInt(e.target.value) || 0})} className="w-full bg-transparent font-bold text-xs outline-none text-slate-800" placeholder="0" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4.5 bg-amber-50/60 rounded-3xl border border-amber-200/80 space-y-3 shadow-xs">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowRight size={14} /> Pindah Keluar (-)
                  </label>
                  <span className="text-xs font-black text-amber-700 bg-white px-2 py-0.5 rounded-lg border border-amber-200 shadow-2xs">-{formData.movedOutCount} Jiwa</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-amber-200/80">
                    <span className="text-[10px] font-black text-slate-400 uppercase w-12 shrink-0">Total:</span>
                    <input type="number" value={formData.movedOutCount} onChange={e => setFormData({...formData, movedOutCount: parseInt(e.target.value) || 0})} className="w-full bg-transparent text-sm font-black text-amber-800 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded-xl border border-blue-200/80 flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-blue-600 shrink-0">L:</span>
                      <input type="number" value={formData.movedOutMaleCount || 0} onChange={e => setFormData({...formData, movedOutMaleCount: parseInt(e.target.value) || 0})} className="w-full bg-transparent font-bold text-xs outline-none text-slate-800" placeholder="0" />
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-pink-200/80 flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-pink-600 shrink-0">P:</span>
                      <input type="number" value={formData.movedOutFemaleCount || 0} onChange={e => setFormData({...formData, movedOutFemaleCount: parseInt(e.target.value) || 0})} className="w-full bg-transparent font-bold text-xs outline-none text-slate-800" placeholder="0" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Demografi Section */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
          <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
            <Accessibility size={14} /> Demografi Akhir Bulan
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Laki-laki</label>
              <input type="number" value={formData.maleCount} onChange={e => setFormData({...formData, maleCount: parseInt(e.target.value)})} className="w-full bg-transparent text-lg font-black text-slate-800 outline-none" />
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Perempuan</label>
              <input type="number" value={formData.femaleCount} onChange={e => setFormData({...formData, femaleCount: parseInt(e.target.value)})} className="w-full bg-transparent text-lg font-black text-slate-800 outline-none" />
            </div>
          </div>
        </div>

        {/* Musiman Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-4 shadow-sm">
          <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
            <Clock size={14} /> Warga Musiman / Sewa
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Total</label>
              <input type="number" value={formData.seasonalCount} onChange={e => setFormData({...formData, seasonalCount: parseInt(e.target.value)})} className="w-full bg-transparent font-bold text-slate-800 outline-none" />
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Laki-laki</label>
              <input type="number" value={formData.seasonalMaleCount} onChange={e => setFormData({...formData, seasonalMaleCount: parseInt(e.target.value)})} className="w-full bg-transparent font-bold text-slate-800 outline-none" />
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Perempuan</label>
              <input type="number" value={formData.seasonalFemaleCount} onChange={e => setFormData({...formData, seasonalFemaleCount: parseInt(e.target.value)})} className="w-full bg-transparent font-bold text-slate-800 outline-none" />
            </div>
          </div>
        </div>

        {/* Kelompok Rentan Section */}
        <div className="bg-rose-50/30 p-6 rounded-[2rem] border border-rose-100 space-y-4">
          <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
            <Heart size={14} /> Kelompok Rentan & Prioritas
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Hamil', key: 'pregnantCount', icon: <Activity size={12}/> },
              { label: 'Bayi', key: 'babyCount', icon: <Baby size={12}/> },
              { label: 'Balita', key: 'toddlerCount', icon: <Baby size={12}/> },
              { label: 'Anak', key: 'childCount', icon: <User size={12}/> },
              { label: 'Remaja', key: 'teenagerCount', icon: <User size={12}/> },
              { label: 'Dewasa', key: 'adultCount', icon: <User size={12}/> },
              { label: 'Lansia', key: 'elderlyCount', icon: <Accessibility size={12}/> },
              { label: 'Janda', key: 'widowCount', icon: <Heart size={12}/> },
              { label: 'Disabilitas', key: 'disabilityCount', icon: <Accessibility size={12}/> },
              { label: 'Yatim/Piatu', key: 'orphanCount', icon: <User size={12}/> }
            ].map(field => (
              <div key={field.key} className="bg-white p-3 rounded-2xl border border-rose-100 shadow-sm">
                <div className="flex items-center gap-1.5 mb-1 text-rose-400">
                  {field.icon}
                  <label className="block text-[9px] font-black uppercase tracking-tighter">{field.label}</label>
                </div>
                <input 
                  type="number" 
                  value={(formData as any)[field.key]} 
                  onChange={e => setFormData({...formData, [field.key]: parseInt(e.target.value) || 0})} 
                  className="w-full bg-transparent text-sm font-black text-slate-800 outline-none" 
                />
              </div>
            ))}
          </div>
        </div>

        {/* Uraian Kegiatan & Lokasi Kegiatan RT Bulanan */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200/80 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} /> Uraian Kegiatan & Peristiwa RT Bulan Ini
              </h4>
              <p className="text-xs text-slate-500 font-medium">Catatan agenda yang telah terlaksana untuk dilampirkan pada laporan resmi</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const newAct = {
                  id: `act-${Date.now()}`,
                  title: '',
                  date: formData.month ? `${formData.month}-01` : new Date().toISOString().split('T')[0],
                  location: 'Pos Ronda / Lingkungan RT 02',
                  description: '',
                  category: 'Kerja Bakti' as const,
                  picName: 'Pengurus RT 02'
                };
                setFormData({
                  ...formData,
                  activities: [...(formData.activities || []), newAct]
                });
              }}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={13} /> Tambah Kegiatan
            </button>
          </div>

          {formData.activities && formData.activities.length > 0 ? (
            <div className="space-y-3">
              {formData.activities.map((act, index) => (
                <div key={act.id || index} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3 relative">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[9px] font-mono font-black uppercase tracking-wider">
                      Kegiatan #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formData.activities?.filter((_, i) => i !== index);
                        setFormData({ ...formData, activities: updated });
                      }}
                      className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Kegiatan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Nama Kegiatan</label>
                      <input
                        type="text"
                        required
                        placeholder="mis: Kerja Bakti Lingkungan, Rapat Warga"
                        value={act.title}
                        onChange={e => {
                          const updated = [...(formData.activities || [])];
                          updated[index].title = e.target.value;
                          setFormData({ ...formData, activities: updated });
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Kategori Kegiatan</label>
                      <select
                        value={act.category || 'Kerja Bakti'}
                        onChange={e => {
                          const updated = [...(formData.activities || [])];
                          updated[index].category = e.target.value as any;
                          setFormData({ ...formData, activities: updated });
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="Kerja Bakti">Kerja Bakti</option>
                        <option value="Rapat">Rapat Warga</option>
                        <option value="Posyandu/Kesehatan">Posyandu / Kesehatan</option>
                        <option value="Sosial/Keagamaan">Sosial / Keagamaan</option>
                        <option value="Keamanan/Ronda">Keamanan / Ronda</option>
                        <option value="Pembangunan/Fasum">Pembangunan / Fasum</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Tanggal Pelaksanaan</label>
                      <input
                        type="date"
                        value={act.date}
                        onChange={e => {
                          const updated = [...(formData.activities || [])];
                          updated[index].date = e.target.value;
                          setFormData({ ...formData, activities: updated });
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Lokasi Kegiatan</label>
                      <input
                        type="text"
                        required
                        placeholder="mis: Pos Ronda RT 02 / Lapangan Fasum"
                        value={act.location}
                        onChange={e => {
                          const updated = [...(formData.activities || [])];
                          updated[index].location = e.target.value;
                          setFormData({ ...formData, activities: updated });
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Uraian / Hasil / Catatan Kegiatan</label>
                    <textarea
                      rows={2}
                      placeholder="mis: Pembersihan selokan Blok A-D, dihadiri 35 KK, situasi aman dan lancar."
                      value={act.description}
                      onChange={e => {
                        const updated = [...(formData.activities || [])];
                        updated[index].description = e.target.value;
                        setFormData({ ...formData, activities: updated });
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
              Belum ada rincian kegiatan yang ditambahkan untuk periode bulan ini. Klik <b>"Tambah Kegiatan"</b> di atas.
            </div>
          )}
        </div>

        {/* Summary Card */}
        <div className="bg-slate-900 p-6 rounded-[2rem] text-white">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kalkulasi Akhir</p>
            <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold">Otomatis</div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-black">
                {formData.initialPopulation + formData.birthCount + formData.newcomerCount - formData.movedOutCount - (formData.deathCount || 0)}
                <span className="text-sm font-bold text-slate-400 ml-2">Jiwa</span>
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">Total penduduk yang akan dilaporkan</p>
            </div>
            <TrendingUp className="text-emerald-500 mb-2" size={32} />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all cursor-pointer"
          >
            Batal
          </button>
          <button 
            type="submit" 
            className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
          >
            Simpan Laporan
          </button>
        </div>
      </form>
    </Modal>
  );
};
