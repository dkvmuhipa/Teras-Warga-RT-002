import React, { useState } from 'react';
import { PopulationReport, PopulationChangeLog, House } from '../../types';
import { Plus, FileText, Trash2, Edit2 } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface PopulationReportManagerProps {
  reports: PopulationReport[];
  onAddReport: (report: Omit<PopulationReport, 'id' | 'createdAt'>) => void;
  onDeleteReport: (id: string) => void;
  populationLogs: PopulationChangeLog[];
  setPopulationLogs: (logs: PopulationChangeLog[]) => void;
  houses: House[];
}

export const PopulationReportManager: React.FC<PopulationReportManagerProps> = ({ reports, onAddReport, onDeleteReport, populationLogs, setPopulationLogs, houses }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<PopulationReport, 'id' | 'createdAt'>>({
    month: new Date().toISOString().slice(0, 7),
    year: new Date().getFullYear(),
    initialPopulation: 0,
    birthCount: 0,
    deathCount: 0,
    newcomerCount: 0,
    movedOutCount: 0,
    maleCount: 0,
    femaleCount: 0,
    seasonalCount: 0,
    seasonalMaleCount: 0,
    seasonalFemaleCount: 0,
    pregnantCount: 0,
    babyCount: 0,
    toddlerCount: 0,
    elderlyCount: 0,
  });

  const handleGenerateFromLog = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const logsThisMonth = populationLogs.filter(log => log.date.startsWith(currentMonth));
    
    const birthCount = logsThisMonth.filter(l => l.type === 'Birth').length;
    const deathCount = logsThisMonth.filter(l => l.type === 'Death').length;
    const newcomerCount = logsThisMonth.filter(l => l.type === 'Newcomer').length;
    const movedOutCount = logsThisMonth.filter(l => l.type === 'MovedOut').length;

    // Calculate current demographics from houses
    let currentPregnant = 0;
    let currentBaby = 0;
    let currentToddler = 0;
    let currentElderly = 0;
    let currentTotal = 0;

    houses.forEach(house => {
      if (house.status === 'Occupied') {
        currentTotal += house.occupants || 0;
        currentPregnant += house.pregnantCount || 0;
        currentBaby += house.babyCount || 0;
        currentToddler += house.toddlerCount || 0;
        currentElderly += house.elderlyCount || 0;
      }
    });

    // Calculate initial population from previous month if available, or just keep 0
    // For now, let's just pre-fill the counts
    setFormData(prev => ({
      ...prev,
      month: currentMonth,
      birthCount,
      deathCount,
      newcomerCount,
      movedOutCount,
      pregnantCount: currentPregnant,
      babyCount: currentBaby,
      toddlerCount: currentToddler,
      elderlyCount: currentElderly,
      // Optional: set initial population based on currentTotal and changes
      // initialPopulation: currentTotal - birthCount - newcomerCount + deathCount + movedOutCount
    }));
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddReport(formData);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-900">Laporan Kependudukan Bulanan</h2>
        <div className="flex gap-2">
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-indigo-200 shadow-lg transition-all active:scale-95">
            <Plus size={18} /> Tambah Laporan
          </button>
          <button onClick={handleGenerateFromLog} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 shadow-emerald-200 shadow-lg transition-all active:scale-95">
            <FileText size={18} /> Generate dari Log
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold">
            <tr>
              <th className="p-4 text-left">Periode</th>
              <th className="p-4 text-right">Awal</th>
              <th className="p-4 text-right">Lahir</th>
              <th className="p-4 text-right">Meninggal</th>
              <th className="p-4 text-right">Pendatang</th>
              <th className="p-4 text-right">Pindah</th>
              <th className="p-4 text-right">Akhir</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports && reports.map(r => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-800">{r.month} / {r.year}</td>
                <td className="p-4 text-right">{r.initialPopulation}</td>
                <td className="p-4 text-right text-emerald-600">+{r.birthCount}</td>
                <td className="p-4 text-right text-slate-500">-{r.deathCount || 0}</td>
                <td className="p-4 text-right text-blue-600">+{r.newcomerCount}</td>
                <td className="p-4 text-right text-amber-600">-{r.movedOutCount}</td>
                <td className="p-4 text-right font-black">{r.initialPopulation + r.birthCount + r.newcomerCount - r.movedOutCount - (r.deathCount || 0)}</td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => {
                      if (window.confirm("Apakah Anda yakin ingin menghapus laporan ini?")) {
                        onDeleteReport(r.id);
                      }
                    }} 
                    className="text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-black text-slate-800">Log Mutasi Penduduk</h3>
          <p className="text-xs text-slate-500">Daftar laporan mutasi dari warga (Kelahiran, Pendatang, Pindah, Kematian)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th className="p-4 text-left">Tanggal</th>
                <th className="p-4 text-left">Tipe</th>
                <th className="p-4 text-left">Nama</th>
                <th className="p-4 text-left">Rumah</th>
                <th className="p-4 text-left">Keterangan</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {populationLogs && populationLogs.length > 0 ? populationLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-4 text-slate-600">{new Date(log.date).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      log.type === 'Birth' ? 'bg-emerald-100 text-emerald-700' :
                      log.type === 'Newcomer' ? 'bg-blue-100 text-blue-700' :
                      log.type === 'MovedOut' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {log.type === 'Birth' ? 'Lahir' : log.type === 'Newcomer' ? 'Pendatang' : log.type === 'MovedOut' ? 'Pindah' : 'Kematian'}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-800">{(log as any).name || '-'}</td>
                  <td className="p-4 text-slate-600">{log.houseId}</td>
                  <td className="p-4 text-slate-500 italic">{log.description}</td>
                  <td className="p-4 text-center">
                    <button className="text-slate-400 hover:text-rose-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">Belum ada log mutasi penduduk.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Laporan Bulanan">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Bulan (YYYY-MM)</label>
              <input type="text" value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} className="w-full p-2 border rounded-xl" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Tahun</label>
              <input type="number" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} className="w-full p-2 border rounded-xl" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Penduduk Awal</label>
              <input type="number" value={formData.initialPopulation} onChange={e => setFormData({...formData, initialPopulation: parseInt(e.target.value)})} className="w-full p-2 border rounded-xl" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Lahir</label>
              <input type="number" value={formData.birthCount} onChange={e => setFormData({...formData, birthCount: parseInt(e.target.value)})} className="w-full p-2 border rounded-xl" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Meninggal</label>
              <input type="number" value={formData.deathCount} onChange={e => setFormData({...formData, deathCount: parseInt(e.target.value)})} className="w-full p-2 border rounded-xl" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Pendatang</label>
              <input type="number" value={formData.newcomerCount} onChange={e => setFormData({...formData, newcomerCount: parseInt(e.target.value)})} className="w-full p-2 border rounded-xl" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Pindah</label>
              <input type="number" value={formData.movedOutCount} onChange={e => setFormData({...formData, movedOutCount: parseInt(e.target.value)})} className="w-full p-2 border rounded-xl" required />
            </div>
          </div>
          <div className="border-t border-slate-100 pt-4 mt-4">
            <h4 className="text-xs font-black text-slate-700 mb-3">Data Kelompok Rentan (Otomatis dari Data Warga)</h4>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Ibu Hamil</label>
                <input type="number" value={formData.pregnantCount} onChange={e => setFormData({...formData, pregnantCount: parseInt(e.target.value) || 0})} className="w-full p-2 border rounded-xl bg-slate-50" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Bayi</label>
                <input type="number" value={formData.babyCount} onChange={e => setFormData({...formData, babyCount: parseInt(e.target.value) || 0})} className="w-full p-2 border rounded-xl bg-slate-50" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Balita</label>
                <input type="number" value={formData.toddlerCount} onChange={e => setFormData({...formData, toddlerCount: parseInt(e.target.value) || 0})} className="w-full p-2 border rounded-xl bg-slate-50" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Lansia</label>
                <input type="number" value={formData.elderlyCount} onChange={e => setFormData({...formData, elderlyCount: parseInt(e.target.value) || 0})} className="w-full p-2 border rounded-xl bg-slate-50" />
              </div>
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Simpan Laporan</button>
        </form>
      </Modal>
    </div>
  );
};
