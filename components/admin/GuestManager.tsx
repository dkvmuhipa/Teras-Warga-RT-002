import React, { useState } from 'react';
import { ShieldAlert, User, Calendar, Clock, Phone, Trash2, CheckCircle, ExternalLink, MapPin, History, Info, FileText, Car, UserCheck, Download, Plus, X, FileUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { updateGuestReportStatus, deleteGuestReportFromDb, addGuestReportToDb } from '../../services/databaseService';
import { GuestReport, PdfConfig } from '../../types';
import { generateGuestReportPDF } from '../../services/pdfService';
import { generateGuestReportExcel } from '../../services/excelService';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Modal } from '../ui/Modal';
import { toast } from 'sonner';

interface GuestManagerProps {
  guestReports: GuestReport[];
  pdfConfig: PdfConfig;
}

export const GuestManager: React.FC<GuestManagerProps> = ({ guestReports, pdfConfig }) => {
  const [selectedGuest, setSelectedGuest] = React.useState<GuestReport | null>(null);
  const [confirmDialog, setConfirmDialog] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addFormData, setAddFormData] = useState({
    guestName: '',
    phone: '',
    residentName: '',
    residentHouseId: '',
    relationship: 'Kerabat / Saudara',
    stayDuration: '1 Hari',
    arrivalDate: new Date().toISOString().split('T')[0],
    departureDate: '',
    guestAddress: '',
    purpose: 'Silaturahmi Keluarga'
  });

  const activeGuests = guestReports.filter(g => g.status === 'Active');
  const departedGuests = guestReports.filter(g => g.status === 'Departed');

  const handleAddGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormData.guestName || !addFormData.residentHouseId) {
      toast.error('Mohon lengkapi Nama Tamu dan Rumah Tujuan!');
      return;
    }
    setIsSubmitting(true);
    try {
      await addGuestReportToDb({
        ...addFormData,
        status: 'Active',
        createdAt: new Date().toISOString()
      });
      toast.success('Laporan Tamu Wajib Lapor berhasil dicatat!');
      setIsAddModalOpen(false);
      setAddFormData({
        guestName: '',
        phone: '',
        residentName: '',
        residentHouseId: '',
        relationship: 'Kerabat / Saudara',
        stayDuration: '1 Hari',
        arrivalDate: new Date().toISOString().split('T')[0],
        departureDate: '',
        guestAddress: '',
        purpose: 'Silaturahmi Keluarga'
      });
    } catch (error) {
      toast.error('Gagal mencatat tamu baru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'Active' | 'Departed') => {
    setConfirmDialog({
      isOpen: true,
      title: 'Update Status Tamu',
      message: `Apakah Anda yakin ingin mengubah status tamu menjadi ${status === 'Departed' ? 'Sudah Pulang' : 'Masih Menginap'}?`,
      type: 'warning',
      onConfirm: async () => {
        await updateGuestReportStatus(id, status);
      }
    });
  };

  const handleDelete = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Laporan Tamu',
      message: 'Apakah Anda yakin ingin menghapus data laporan tamu ini?',
      type: 'danger',
      onConfirm: async () => {
        await deleteGuestReportFromDb(id);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Wajib Lapor Tamu 24 Jam</h2>
          <p className="text-slate-500 font-medium text-xs mt-0.5">Pemantauan & pengawasan tamu yang menginap di lingkungan RT 02 demi keamanan wilayah.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => generateGuestReportExcel(guestReports)}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            <Download size={14} /> Ekspor Excel
          </button>
          <button 
            onClick={() => generateGuestReportPDF(guestReports, pdfConfig)}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            <ExternalLink size={14} /> Ekspor PDF
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all active:scale-95"
          >
            <Plus size={16} /> Catat Tamu Baru
          </button>
        </div>
      </div>

      {/* Header Bento Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-rose-600 tracking-wider">Tamu Menginap Aktif</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{activeGuests.length} <span className="text-xs font-semibold text-slate-400">Orang</span></p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <ShieldAlert size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Tamu Sudah Pulang</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{departedGuests.length} <span className="text-xs font-semibold text-slate-400">Arsip</span></p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <UserCheck size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Total Laporan Bulan Ini</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{guestReports.length} <span className="text-xs font-semibold text-slate-400">Laporan</span></p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <FileText size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Proteksi Keamanan</p>
            <p className="text-xs font-black text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle size={14} /> Terkendali 24 Jam
            </p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl">
            <UserCheck size={20} />
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
                  <button 
                    onClick={() => setSelectedGuest(guest)}
                    className="flex-1 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all"
                  >
                    <Info size={12} /> Detail
                  </button>
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
              <div className="col-span-full py-16 text-center bg-white rounded-[2.5rem] border border-slate-150 p-8 shadow-xs">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                  <ShieldAlert size={32} />
                </div>
                <h4 className="font-black text-slate-900 text-base mb-1">Tidak Ada Tamu Yang Sedang Menginap</h4>
                <p className="text-xs text-slate-400 font-semibold max-w-md mx-auto mb-4">
                  Lingkungan RT 02 dalam kondisi aman dan terkendali. Tidak ada laporan tamu menginap aktif 24 jam saat ini.
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all"
                >
                  <Plus size={14} /> Catat Laporan Tamu Baru
                </button>
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
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedGuest(guest)}
                          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Detail"
                        >
                          <Info size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(guest.id)}
                          className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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

      {/* Detail Modal */}
      {selectedGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Detail Laporan Tamu</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID: {selectedGuest.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedGuest(null)}
                className="w-10 h-10 bg-white border border-slate-200 text-slate-400 rounded-xl flex items-center justify-center hover:text-slate-900 transition-all"
              >
                <Trash2 size={20} className="rotate-45" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Guest Info */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Informasi Tamu</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="text-indigo-500 mt-1" size={18} />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nama Lengkap</p>
                        <p className="font-bold text-slate-800">{selectedGuest.guestName}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <FileText className="text-indigo-500 mt-1" size={18} />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">NIK Tamu</p>
                        <p className="font-bold text-slate-800">{selectedGuest.guestNik || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <FileText className="text-indigo-500 mt-1" size={18} />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pekerjaan Tamu</p>
                        <p className="font-bold text-slate-800">{selectedGuest.guestJob || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <UserCheck className="text-indigo-500 mt-1" size={18} />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Jenis Kelamin</p>
                        <p className="font-bold text-slate-800">{selectedGuest.gender || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="text-indigo-500 mt-1" size={18} />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nomor HP</p>
                        <p className="font-bold text-slate-800">{selectedGuest.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="text-indigo-500 mt-1" size={18} />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Alamat Asal</p>
                        <p className="font-bold text-slate-800 text-sm leading-relaxed">{selectedGuest.guestAddress || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visit Info */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Informasi Kunjungan</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="text-emerald-500 mt-1" size={18} />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rumah Dikunjungi</p>
                        <p className="font-bold text-slate-800">{selectedGuest.residentName}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <UserCheck className="text-emerald-500 mt-1" size={18} />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Hubungan</p>
                        <p className="font-bold text-slate-800">{selectedGuest.relationship}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="text-emerald-500 mt-1" size={18} />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rencana Menginap</p>
                        <p className="font-bold text-slate-800">{new Date(selectedGuest.arrivalDate).toLocaleDateString('id-ID')} s/d {selectedGuest.departureDate ? new Date(selectedGuest.departureDate).toLocaleDateString('id-ID') : '-'}</p>
                        <p className="text-xs text-slate-500 mt-1">Durasi: {selectedGuest.stayDuration}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Info className="text-emerald-500 mt-1" size={18} />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Keperluan</p>
                        <p className="font-bold text-slate-800 text-sm leading-relaxed">{selectedGuest.purpose || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Car className="text-emerald-500 mt-1" size={18} />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Informasi Kendaraan</p>
                        <p className="font-bold text-slate-800">{selectedGuest.vehicleInfo || 'Tidak membawa kendaraan'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* KTP Image */}
              {selectedGuest.ktpUrl && (
                <div className="mt-10 pt-8 border-t border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Identitas (KTP)</h4>
                  <div className="relative group rounded-3xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center">
                    <img 
                      src={selectedGuest.ktpUrl} 
                      alt="KTP Tamu" 
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <a 
                      href={selectedGuest.ktpUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white font-black uppercase tracking-widest text-xs gap-2"
                    >
                      <ExternalLink size={20} /> Lihat Ukuran Penuh
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => setSelectedGuest(null)}
                className="flex-1"
              >
                Tutup
              </Button>
              {selectedGuest.status === 'Active' && (
                <Button 
                  onClick={() => {
                    handleStatusUpdate(selectedGuest.id, 'Departed');
                    setSelectedGuest(null);
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  Tamu Sudah Pulang
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />

      {/* Modal Form Catat Tamu Baru (Admin) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Pencatatan Wajib Lapor Tamu 24 Jam"
      >
        <form onSubmit={handleAddGuestSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Nama Lengkap Tamu *</label>
              <input 
                type="text"
                required
                placeholder="Contoh: Ahmad Subagja"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all"
                value={addFormData.guestName}
                onChange={e => setAddFormData(prev => ({ ...prev, guestName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">No. Telp / WhatsApp Tamu</label>
              <input 
                type="text"
                placeholder="0812xxxxxxx"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all"
                value={addFormData.phone}
                onChange={e => setAddFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">ID Kavling / Rumah Tujuan *</label>
              <input 
                type="text"
                required
                placeholder="Contoh: C5 atau C12"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all"
                value={addFormData.residentHouseId}
                onChange={e => setAddFormData(prev => ({ ...prev, residentHouseId: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Nama Tuan Rumah (Warga)</label>
              <input 
                type="text"
                placeholder="Nama pemilik rumah"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all"
                value={addFormData.residentName}
                onChange={e => setAddFormData(prev => ({ ...prev, residentName: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Hubungan</label>
              <select
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all"
                value={addFormData.relationship}
                onChange={e => setAddFormData(prev => ({ ...prev, relationship: e.target.value }))}
              >
                <option value="Kerabat / Saudara">Kerabat / Saudara</option>
                <option value="Teman / Rekan Kerja">Teman / Rekan Kerja</option>
                <option value="Orang Tua / Keluarga Inti">Orang Tua / Keluarga Inti</option>
                <option value="Tamu Kedinasan / Kerja">Tamu Kedinasan / Kerja</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Lama Menginap</label>
              <input 
                type="text"
                placeholder="1-3 Hari"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all"
                value={addFormData.stayDuration}
                onChange={e => setAddFormData(prev => ({ ...prev, stayDuration: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Tgl Kedatangan</label>
              <input 
                type="date"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all"
                value={addFormData.arrivalDate}
                onChange={e => setAddFormData(prev => ({ ...prev, arrivalDate: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Keperluan Kunjungan</label>
            <textarea 
              rows={2}
              placeholder="Jelaskan secara singkat alasan kunjungan/menginap..."
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all resize-none"
              value={addFormData.purpose}
              onChange={e => setAddFormData(prev => ({ ...prev, purpose: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] py-3.5 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all"
            >
              Simpan Laporan Tamu
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
