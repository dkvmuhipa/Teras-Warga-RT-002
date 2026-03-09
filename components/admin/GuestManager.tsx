import React from 'react';
import { ShieldAlert, User, Calendar, Clock, Phone, Trash2, CheckCircle, ExternalLink, MapPin, History } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { updateGuestReportStatus, deleteGuestReportFromDb } from '../../services/databaseService';
import { GuestReport } from '../../types';

interface GuestManagerProps {
  guestReports: GuestReport[];
}

export const GuestManager: React.FC<GuestManagerProps> = ({ guestReports }) => {
  const activeGuests = guestReports.filter(g => g.status === 'Active');
  const departedGuests = guestReports.filter(g => g.status === 'Departed');

  const handleStatusUpdate = async (id: string, status: 'Active' | 'Departed') => {
    if (window.confirm(`Ubah status tamu menjadi ${status === 'Departed' ? 'Sudah Pulang' : 'Masih Menginap'}?`)) {
      await updateGuestReportStatus(id, status);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus data laporan tamu ini?')) {
      await deleteGuestReportFromDb(id);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen Tamu</h2>
          <p className="text-slate-500 font-medium">Pantau tamu yang menginap di lingkungan RT 002</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex items-center gap-2">
            <ShieldAlert size={16} />
            <span className="text-xs font-black uppercase tracking-widest">{activeGuests.length} Tamu Aktif</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Clock size={20} />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Tamu Sedang Menginap</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeGuests.map((guest) => (
              <div key={guest.id} className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <span className="px-3 py-1 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full">Aktif</span>
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                    <User size={28} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-lg leading-tight">{guest.guestName}</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{guest.relationship}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="text-xs font-bold">Rumah: {guest.residentName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-xs font-bold">Masuk: {new Date(guest.arrivalDate).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <Clock size={14} className="text-slate-400" />
                    <span className="text-xs font-bold">Durasi: {guest.stayDuration}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <Phone size={14} className="text-slate-400" />
                    <span className="text-xs font-bold">{guest.phone}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {guest.ktpUrl && (
                    <a 
                      href={guest.ktpUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                    >
                      <ExternalLink size={12} /> KTP
                    </a>
                  )}
                  <button 
                    onClick={() => handleStatusUpdate(guest.id, 'Departed')}
                    className="flex-1 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all"
                  >
                    <CheckCircle size={12} /> Pulang
                  </button>
                </div>
              </div>
            ))}
            {activeGuests.length === 0 && (
              <div className="col-span-full py-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-bold">Tidak ada tamu yang sedang menginap.</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
              <History size={20} />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Riwayat Tamu</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Tamu</th>
                  <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rumah Dikunjungi</th>
                  <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                  <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="text-right py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {departedGuests.map((guest) => (
                  <tr key={guest.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-800 text-sm">{guest.guestName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{guest.relationship}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm font-medium text-slate-600">{guest.residentName}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm font-medium text-slate-600">{new Date(guest.arrivalDate).toLocaleDateString('id-ID')}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 bg-slate-200 text-slate-600 text-[8px] font-black uppercase tracking-widest rounded-full">Sudah Pulang</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button 
                        onClick={() => handleDelete(guest.id)}
                        className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {departedGuests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-medium italic">Belum ada riwayat tamu.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
