import React, { useState } from 'react';
import { 
  FileEdit, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  ChevronRight, 
  User, 
  Phone, 
  Users, 
  Home,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { UpdateRequest, House } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { updateRequestStatus, updateHouseData } from '../../services/databaseService';
import { toast } from 'sonner';

interface UpdateRequestManagerProps {
  requests: UpdateRequest[];
  houses: House[];
}

export const UpdateRequestManager: React.FC<UpdateRequestManagerProps> = ({ requests, houses }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Menunggu' | 'Disetujui' | 'Ditolak'>('All');
  const [selectedRequest, setSelectedRequest] = useState<UpdateRequest | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredRequests = requests.filter(req => {
    const house = houses.find(h => h.id === req.houseId);
    const matchesSearch = 
      req.headOfFamily.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (house && `${house.block}-${house.number}`.includes(searchTerm));
    const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (req: UpdateRequest) => {
    setIsProcessing(true);
    try {
      // 1. Update the house data first
      await updateHouseData(req.houseId, {
        headOfFamily: req.headOfFamily,
        phone: req.phone,
        occupants: req.occupants
      });

      // 2. Update the request status
      await updateRequestStatus(req.id, 'Disetujui', adminNote);
      
      toast.success('Permohonan disetujui dan data warga telah diperbarui.');
      setSelectedRequest(null);
      setAdminNote('');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyetujui permohonan.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (req: UpdateRequest) => {
    if (!adminNote) {
      toast.error('Harap berikan alasan penolakan pada catatan admin.');
      return;
    }
    setIsProcessing(true);
    try {
      await updateRequestStatus(req.id, 'Ditolak', adminNote);
      toast.success('Permohonan telah ditolak.');
      setSelectedRequest(null);
      setAdminNote('');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menolak permohonan.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Manajemen Update Data</h2>
          <p className="text-sm text-slate-500 font-medium">Tinjau dan setujui permohonan pembaruan data dari warga.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Cari nama atau nomor rumah..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-white p-1 border border-slate-200 rounded-2xl shadow-sm">
          {['All', 'Menunggu', 'Disetujui', 'Ditolak'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                statusFilter === status 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {status === 'All' ? 'Semua' : status === 'Menunggu' ? 'Menunggu' : status === 'Disetujui' ? 'Disetujui' : 'Ditolak'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((req) => {
            const house = houses.find(h => h.id === req.houseId);
            return (
              <Card key={req.id} className="p-6 bg-white border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${
                      req.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-600' :
                      req.status === 'Ditolak' ? 'bg-rose-50 text-rose-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      <FileEdit size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-black text-slate-800">{req.headOfFamily}</h4>
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                          req.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-600' :
                          req.status === 'Ditolak' ? 'bg-rose-100 text-rose-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                        <Home size={12} /> Rumah {house?.block}-{house?.number}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Diajukan Pada</p>
                      <p className="text-xs font-bold text-slate-700">{new Date(req.createdAt).toLocaleDateString('id-ID')}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedRequest(req)}
                      className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      Detail <ChevronRight size={16} className="ml-1" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4">
              <FileEdit size={32} />
            </div>
            <h4 className="font-black text-slate-800 mb-1">Tidak Ada Permohonan</h4>
            <p className="text-xs text-slate-400 font-medium">Belum ada warga yang mengajukan perubahan data.</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={!!selectedRequest} 
        onClose={() => {
          setSelectedRequest(null);
          setAdminNote('');
        }} 
        title="Detail Permohonan Update Data"
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data Saat Ini</p>
                {(() => {
                  const house = houses.find(h => h.id === selectedRequest.houseId);
                  return (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><User size={14} className="text-slate-400" /> {house?.headOfFamily}</p>
                      <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {house?.phone || '-'}</p>
                      <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><Users size={14} className="text-slate-400" /> {house?.occupants} Penghuni</p>
                    </div>
                  );
                })()}
              </div>
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Data Baru (Diajukan)</p>
                <div className="space-y-2">
                  <p className="text-sm font-black text-indigo-700 flex items-center gap-2"><User size={14} /> {selectedRequest.headOfFamily}</p>
                  <p className="text-sm font-black text-indigo-700 flex items-center gap-2"><Phone size={14} /> {selectedRequest.phone}</p>
                  <p className="text-sm font-black text-indigo-700 flex items-center gap-2"><Users size={14} /> {selectedRequest.occupants} Penghuni</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Alasan Warga</p>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-sm text-slate-600 font-medium">
                "{selectedRequest.reason}"
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Catatan Admin / Alasan Penolakan</label>
              <textarea 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none"
                rows={3}
                placeholder="Berikan catatan atau alasan jika menolak..."
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
              />
            </div>

            {selectedRequest.status === 'Menunggu' ? (
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={() => handleReject(selectedRequest)}
                  disabled={isProcessing}
                  className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-100"
                >
                  <XCircle size={18} className="mr-2" /> Tolak
                </Button>
                <Button 
                  onClick={() => handleApprove(selectedRequest)}
                  disabled={isProcessing}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100"
                >
                  <CheckCircle size={18} className="mr-2" /> Setujui & Update
                </Button>
              </div>
            ) : (
              <div className={`p-4 rounded-2xl flex items-center gap-3 ${
                selectedRequest.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
              }`}>
                {selectedRequest.status === 'Disetujui' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                <div>
                  <p className="text-xs font-black uppercase tracking-widest">Permohonan {selectedRequest.status}</p>
                  {selectedRequest.adminNote && <p className="text-[10px] font-medium mt-0.5">{selectedRequest.adminNote}</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
