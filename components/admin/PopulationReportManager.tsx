import React, { useState } from 'react';
import { PopulationReport, PopulationChangeLog } from '../../types';
import { Plus, FileText, Trash2, Edit2 } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface PopulationReportManagerProps {
  reports: PopulationReport[];
  onAddReport: (report: Omit<PopulationReport, 'id' | 'createdAt'>) => void;
  onDeleteReport: (id: string) => void;
  populationLogs: PopulationChangeLog[];
  setPopulationLogs: (logs: PopulationChangeLog[]) => void;
}

export const PopulationReportManager: React.FC<PopulationReportManagerProps> = ({ reports, onAddReport, onDeleteReport, populationLogs, setPopulationLogs }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<PopulationReport, 'id' | 'createdAt'>>({
    month: new Date().toISOString().slice(0, 7),
    year: new Date().getFullYear(),
    initialPopulation: 0,
    birthCount: 0,
    newcomerCount: 0,
    movedOutCount: 0,
    maleCount: 0,
    femaleCount: 0,
    seasonalCount: 0,
    seasonalMaleCount: 0,
    seasonalFemaleCount: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddReport(formData);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-900">Laporan Kependudukan Bulanan</h2>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700">
          <Plus size={18} /> Tambah Laporan
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700">
          <FileText size={18} /> Generate dari Log
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold">
            <tr>
              <th className="p-4 text-left">Periode</th>
              <th className="p-4 text-right">Awal</th>
              <th className="p-4 text-right">Lahir</th>
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
                <td className="p-4 text-right text-emerald-600">+{r.newcomerCount}</td>
                <td className="p-4 text-right text-rose-600">-{r.movedOutCount}</td>
                <td className="p-4 text-right font-black">{r.initialPopulation + r.birthCount + r.newcomerCount - r.movedOutCount}</td>
                <td className="p-4 text-center">
                  <button onClick={() => onDeleteReport(r.id)} className="text-rose-500 hover:text-rose-700"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
              <label className="block text-xs font-bold text-slate-500 mb-1">Pendatang</label>
              <input type="number" value={formData.newcomerCount} onChange={e => setFormData({...formData, newcomerCount: parseInt(e.target.value)})} className="w-full p-2 border rounded-xl" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Pindah</label>
              <input type="number" value={formData.movedOutCount} onChange={e => setFormData({...formData, movedOutCount: parseInt(e.target.value)})} className="w-full p-2 border rounded-xl" required />
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Simpan Laporan</button>
        </form>
      </Modal>
    </div>
  );
};
