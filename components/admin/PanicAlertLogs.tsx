import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, Clock, Search, Filter, Phone, MapPin, Trash2, Shield, Calendar, User } from 'lucide-react';
import { PanicAlert, House } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { toast } from 'sonner';
import { 
  subscribeToActivePanicAlerts, 
  updatePanicAlertStatus,
  deletePanicAlertFromDb
} from '../../services/databaseService';
import { motion } from 'motion/react';
import { useConfirm } from '../../context/ConfirmContext';

interface PanicAlertLogsProps {
  houses: House[];
}

export const PanicAlertLogs: React.FC<PanicAlertLogsProps> = ({ houses }) => {
  const confirm = useConfirm();
  const [alerts, setAlerts] = useState<PanicAlert[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  useEffect(() => {
    const unsub = subscribeToActivePanicAlerts((data) => {
      setAlerts(data as PanicAlert[]);
    });
    return () => unsub();
  }, []);

  const handleResolveAlert = async (id: string) => {
    try {
      await updatePanicAlertStatus(id, 'RESOLVED');
      toast.success('Status darurat telah ditandai SELESAI (AMAN).');
    } catch (error) {
      toast.error('Gagal memperbarui status darurat.');
    }
  };

  const handleDeleteAlert = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Log Darurat',
      message: 'Apakah Anda yakin ingin menghapus log riwayat Panic Button ini?',
      confirmLabel: 'Hapus Log',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await deletePanicAlertFromDb(id);
        toast.success('Log darurat dihapus.');
      } catch (error) {
        toast.error('Gagal menghapus log.');
      }
    }
  };

  const getHouseLabel = (id: string) => {
    const house = houses.find(h => h.id === id);
    return house ? `${house.block}-${house.number}` : id;
  };

  const filteredAlerts = alerts.filter(a => {
    const houseLabel = getHouseLabel(a.houseId);
    const search = searchQuery.toLowerCase();
    const matchesSearch = (a.residentName || '').toLowerCase().includes(search) || 
                          (a.location || '').toLowerCase().includes(search) ||
                          houseLabel.toLowerCase().includes(search);
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeAlertsCount = alerts.filter(a => a.status === 'Active' || a.status === 'Responding').length;
  const resolvedAlertsCount = alerts.filter(a => a.status === 'Resolved').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 md:p-8 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-full text-[10px] font-mono font-black uppercase tracking-widest mb-2 inline-block">
            🆘 RESPON DARURAT SATPAM RT 02
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Log Panic Button & Insiden Darurat</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Rekap riwayat penekanan Panic Button oleh warga (Kebakaran, Maling/Keamanan, Darurat Medis).
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-0.5">DARURAT AKTIF</p>
            <p className="text-2xl font-black text-rose-600">{activeAlertsCount} <span className="text-xs font-bold text-slate-400">Insiden</span></p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
            <ShieldAlert size={24} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-0.5">SELESAI (AMAN)</p>
            <p className="text-2xl font-black text-emerald-600">{resolvedAlertsCount} <span className="text-xs font-bold text-slate-400">Penanganan</span></p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-0.5">TOTAL INSIDEN</p>
            <p className="text-2xl font-black text-slate-900">{alerts.length} <span className="text-xs font-bold text-slate-400">Kejadian</span></p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl border border-slate-100">
            <Shield size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Cari jenis darurat, nama warga, atau blok..." 
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 border border-slate-200/60 rounded-2xl overflow-x-auto no-scrollbar">
          {(['All', 'ACTIVE', 'RESOLVED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                statusFilter === st 
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80' 
                : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {st === 'All' ? 'Semua Status' : st === 'ACTIVE' ? '🟢 Aktif' : '✓ Selesai'}
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
                <th className="px-6 py-4 text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Jenis Darurat</th>
                <th className="px-6 py-4 text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Warna / Pelapor</th>
                <th className="px-6 py-4 text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Waktu Terdeteksi</th>
                <th className="px-6 py-4 text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Status Penanganan</th>
                <th className="px-6 py-4 text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlerts.map((alert) => (
                <tr key={alert.id} className={`transition-colors group ${alert.status === 'Active' ? 'bg-rose-50/30 hover:bg-rose-50/60' : 'hover:bg-slate-50/50'}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border ${alert.status === 'Active' ? 'bg-rose-500 text-white border-rose-600 animate-pulse' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        <AlertTriangle size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-none mb-1">{alert.location || 'Lokasi Terdaftar'}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Lat/Long Terdeteksi</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-900 leading-none mb-1">{alert.residentName}</p>
                    <p className="text-[10px] font-mono text-emerald-600 font-bold">Blok {getHouseLabel(alert.houseId)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-800">{new Date(alert.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-xl text-[9px] font-mono font-black uppercase tracking-widest border ${
                      alert.status === 'Active' 
                        ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {alert.status === 'Active' ? '🚨 SOS AKTIF' : '✓ AMAN / SELESAI'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {alert.status === 'Active' && (
                        <button 
                          onClick={() => handleResolveAlert(alert.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                        >
                          Tandai Aman
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Hapus Log"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAlerts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-3 border border-slate-100">
                      <ShieldAlert size={32} />
                    </div>
                    <p className="text-slate-400 font-bold text-sm">Tidak ada log Panic Button terdeteksi.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
