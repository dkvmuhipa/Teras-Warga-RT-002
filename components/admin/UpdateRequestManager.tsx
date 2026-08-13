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
import { updateRequestStatus, updateHouseData, logAction, handleFirestoreError, OperationType } from '../../services/databaseService';
import { sendWhatsAppViaGateway } from '../../services/whatsappService';
import { FileUp, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface UpdateRequestManagerProps {
  requests: UpdateRequest[];
  houses: House[];
  embedded?: boolean;
}

export const UpdateRequestManager: React.FC<UpdateRequestManagerProps> = ({ requests, houses, embedded = false }) => {
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
      const house = houses.find(h => h.id === req.houseId);
      const houseLabel = house ? `Blok ${house.block}-${house.number}` : req.houseId;

      // 1. Update the house data
      await updateHouseData(req.houseId, {
        headOfFamily: req.headOfFamily,
        phone: req.phone,
        occupants: req.occupants
      });

      // 2. Update the request status
      await updateRequestStatus(req.id, 'Disetujui', adminNote);

      // 3. Audit Log
      await logAction('Update Data Warga', `Menyetujui pembaruan profil warga ${req.headOfFamily} (Kavling ${houseLabel})`);

      // 4. Auto WhatsApp Dispatch
      if (req.phone && req.phone !== '-') {
        const msg = `Halo Bpk/Ibu ${req.headOfFamily}, Pengurus RT 02 mengonfirmasi bahwa permohonan pembaruan data profil domisili Anda di Kavling ${houseLabel} telah DISETUJUI dan diperbarui secara resmi di sistem.`;
        await sendWhatsAppViaGateway(req.phone, msg);
      }

      toast.success('Permohonan disetujui, data warga & Audit Log diperbarui, notifikasi WA terkirim.');
      setSelectedRequest(null);
      setAdminNote('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `updateRequests/${req.id}`);
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
      const house = houses.find(h => h.id === req.houseId);
      const houseLabel = house ? `Blok ${house.block}-${house.number}` : req.houseId;

      await updateRequestStatus(req.id, 'Ditolak', adminNote);
      await logAction('Tolak Update Data', `Menolak pembaruan data ${req.headOfFamily} (Kavling ${houseLabel}): ${adminNote}`);

      // Auto WhatsApp Dispatch on rejection
      if (req.phone && req.phone !== '-') {
        const msg = `Halo Bpk/Ibu ${req.headOfFamily}, permohonan pembaruan data profil domisili Anda di Kavling ${houseLabel} DITOLAK oleh Pengurus RT. Alasan: "${adminNote}". Silakan hubungi pengurus jika membutuhkan bantuan.`;
        await sendWhatsAppViaGateway(req.phone, msg);
      }

      toast.success('Permohonan telah ditolak dan notifikasi WA dikirim ke warga.');
      setSelectedRequest(null);
      setAdminNote('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `updateRequests/${req.id}`);
      toast.error('Gagal menolak permohonan.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Stats counters
  const pendingCount = requests.filter(r => r.status === 'Menunggu' || r.status === 'Pending').length;
  const approvedCount = requests.filter(r => r.status === 'Disetujui' || r.status === 'Approved').length;
  const rejectedCount = requests.filter(r => r.status === 'Ditolak' || r.status === 'Rejected').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Manajemen Update Data Warga</h2>
          <p className="text-sm text-slate-500 font-medium">Tinjau, verifikasi diff, dan setujui permohonan pembaruan data profil warga.</p>
        </div>
      </div>

      {/* Header Bento Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Menunggu Persetujuan</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{pendingCount} <span className="text-xs font-semibold text-slate-400">Pengajuan</span></p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Sudah Disetujui</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{approvedCount} <span className="text-xs font-semibold text-slate-400">Pengajuan</span></p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-rose-600 tracking-wider">Ditolak</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{rejectedCount} <span className="text-xs font-semibold text-slate-400">Pengajuan</span></p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <XCircle size={22} />
          </div>
        </div>
      </div>

      {/* Search & Filter Control Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Cari nama warga atau nomor rumah..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-xs"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-white p-1 border border-slate-200 rounded-2xl shadow-xs items-center gap-1">
          {[
            { id: 'All', label: 'Semua', count: requests.length },
            { id: 'Menunggu', label: 'Menunggu', count: pendingCount },
            { id: 'Disetujui', label: 'Disetujui', count: approvedCount },
            { id: 'Ditolak', label: 'Ditolak', count: rejectedCount }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id as any)}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                statusFilter === item.id 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{item.label}</span>
              {item.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-extrabold ${
                  statusFilter === item.id 
                    ? 'bg-white/20 text-white' 
                    : item.id === 'Menunggu' ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-600'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((req) => {
            const house = houses.find(h => h.id === req.houseId);
            return (
              <Card key={req.id} className="p-6 bg-white border-slate-100 shadow-xs hover:shadow-md transition-all group">
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
                        <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          req.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' :
                          req.status === 'Ditolak' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700 border border-amber-200/60'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                        <Home size={12} /> Rumah {house ? `Blok ${house.block}-${house.number}` : req.houseId}
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
                      Detail Diff <ChevronRight size={16} className="ml-1" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-150 p-8 shadow-xs">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
              <CheckCircle size={32} />
            </div>
            <h4 className="font-black text-slate-900 text-base mb-1">Tidak Ada Permohonan Tertunda</h4>
            <p className="text-xs text-slate-400 font-semibold max-w-md mx-auto">
              Semua permohonan pembaruan data profil warga telah diproses. Warga dapat mengajukan pembaruan data kapan saja melalui dasbor warga online.
            </p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Diff Card: Data Lama */}
              <div className="p-4 bg-rose-50/60 border border-rose-200/80 rounded-2xl">
                <div className="flex items-center justify-between mb-3 border-b border-rose-200/60 pb-2">
                  <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest flex items-center gap-1">
                    <Clock size={12} /> Data Saat Ini (Lama)
                  </p>
                  <span className="text-[9px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">Sistem</span>
                </div>
                {(() => {
                  const house = houses.find(h => h.id === selectedRequest.houseId);
                  return (
                    <div className="space-y-2 text-xs font-semibold text-rose-900">
                      <div className="flex justify-between"><span>Kepala Keluarga:</span> <span className="font-bold line-through">{house?.headOfFamily || '-'}</span></div>
                      <div className="flex justify-between"><span>No. HP / WA:</span> <span className="font-bold">{house?.phone || '-'}</span></div>
                      <div className="flex justify-between"><span>Jumlah Penghuni:</span> <span className="font-bold">{house?.occupants || 0} Jiwa</span></div>
                    </div>
                  );
                })()}
              </div>

              {/* Diff Card: Data Baru (Diajukan) */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl">
                <div className="flex items-center justify-between mb-3 border-b border-emerald-200/60 pb-2">
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle size={12} /> Data Baru (Diajukan Warga)
                  </p>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Usulan</span>
                </div>
                <div className="space-y-2 text-xs font-semibold text-emerald-900">
                  <div className="flex justify-between"><span>Kepala Keluarga:</span> <span className="font-extrabold text-emerald-700">{selectedRequest.headOfFamily}</span></div>
                  <div className="flex justify-between"><span>No. HP / WA:</span> <span className="font-extrabold text-emerald-700">{selectedRequest.phone}</span></div>
                  <div className="flex justify-between"><span>Jumlah Penghuni:</span> <span className="font-extrabold text-emerald-700">{selectedRequest.occupants} Jiwa</span></div>
                </div>
              </div>
            </div>

            {/* Document Attachment Viewer */}
            {selectedRequest.documentUrl && (
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <FileUp size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Lampiran Berkas Bukti / KK Baru</p>
                    <p className="text-[10px] text-slate-400 font-semibold">Lampiran resmi pendukung perubahan data</p>
                  </div>
                </div>
                <a
                  href={selectedRequest.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-700 transition-all"
                >
                  <ExternalLink size={14} /> Lihat Berkas
                </a>
              </div>
            )}

            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Alasan Pengajuan Warga</p>
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
