import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  ArrowLeft, 
  QrCode, 
  FileEdit, 
  History, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Phone,
  Users,
  Home,
  Calendar,
  LogOut,
  ChevronRight,
  Info
} from 'lucide-react';
import { House, GuestReport, UpdateRequest, PaymentStatus } from '../../types';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  subscribeToHouseGuestReports,
  addUpdateRequest,
  subscribeToHouseUpdateRequests
} from '../../services/databaseService';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

interface PublicResidentDashboardProps {
  houses: House[];
}

export const PublicResidentDashboard: React.FC<PublicResidentDashboardProps> = ({ houses }) => {
  const [selectedHouseId, setSelectedHouseId] = useState<string>(localStorage.getItem('resident_house_id') || '');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [tempHouseId, setTempHouseId] = useState('');
  const [pinError, setPinError] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'eid' | 'update' | 'guests'>('eid');
  const [guestReports, setGuestReports] = useState<GuestReport[]>([]);
  const [updateRequests, setUpdateRequests] = useState<UpdateRequest[]>([]);
  
  const currentHouse = houses.find(h => h.id === selectedHouseId);

  useEffect(() => {
    if (!selectedHouseId) return;
    
    const unsubGuests = subscribeToHouseGuestReports(selectedHouseId, setGuestReports);
    const unsubUpdates = subscribeToHouseUpdateRequests(selectedHouseId, setUpdateRequests);
    
    return () => {
      unsubGuests();
      unsubUpdates();
    };
  }, [selectedHouseId]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const house = houses.find(h => h.id === tempHouseId);
    if (house && house.accessCode === pinInput) {
      setSelectedHouseId(tempHouseId);
      localStorage.setItem('resident_house_id', tempHouseId);
      setIsPinModalOpen(false);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 2000);
    }
  };

  const handleLogout = () => {
    setSelectedHouseId('');
    localStorage.removeItem('resident_house_id');
  };

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    headOfFamily: '',
    phone: '',
    occupants: 0,
    reason: ''
  });

  useEffect(() => {
    if (currentHouse) {
      setUpdateForm({
        headOfFamily: currentHouse.headOfFamily,
        phone: currentHouse.phone || '',
        occupants: currentHouse.occupants,
        reason: ''
      });
    }
  }, [currentHouse, isUpdateModalOpen]);

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addUpdateRequest({
        houseId: selectedHouseId,
        ...updateForm
      });
      setIsUpdateModalOpen(false);
      toast.success('Permohonan pembaruan data berhasil dikirim!', {
        description: 'Admin akan meninjau permohonan Anda.'
      });
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengirim permohonan.');
    }
  };

  if (!selectedHouseId) {
    const sortedHouses = [...houses]
      .filter(h => h.status === 'Occupied')
      .sort((a, b) => {
        if (a.block !== b.block) return a.block.localeCompare(b.block);
        return parseInt(a.number) - parseInt(b.number);
      });

    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <User size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Dashboard Warga</h2>
        <p className="text-slate-500 font-medium mb-8">Akses Kartu Warga Digital, update data, dan pantau log tamu rumah Anda.</p>
        
        <div className="space-y-4">
          <select 
            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
            value={tempHouseId}
            onChange={(e) => {
              setTempHouseId(e.target.value);
              if (e.target.value) setIsPinModalOpen(true);
            }}
          >
            <option value="">Pilih Nomor Rumah...</option>
            {sortedHouses.map(h => (
              <option key={h.id} value={h.id}>{h.block}-{h.number} - {h.headOfFamily}</option>
            ))}
          </select>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gunakan PIN rumah untuk masuk.</p>
        </div>

        <Modal isOpen={isPinModalOpen} onClose={() => {
          setIsPinModalOpen(false);
          setTempHouseId('');
          setPinInput('');
        }} title="Verifikasi PIN Akses">
          <form onSubmit={handlePinSubmit} className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-800">Masukkan PIN Rumah</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Verifikasi akses untuk rumah <span className="font-bold text-indigo-600">{houses.find(h => h.id === tempHouseId)?.block}-{houses.find(h => h.id === tempHouseId)?.number}</span>
              </p>
            </div>

            <input 
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              autoFocus
              className={`w-full px-6 py-4 bg-slate-50 border ${pinError ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'} rounded-2xl text-center text-2xl font-black tracking-[1em] outline-none transition-all`}
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              placeholder="••••••"
            />

            <Button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100">
              Masuk ke Dashboard
            </Button>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 mb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard Warga</h2>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-200">
              Blok {currentHouse?.block}-{currentHouse?.number}
            </span>
          </div>
          <p className="text-slate-500 font-medium">Selamat datang, Bpk/Ibu {currentHouse?.headOfFamily}.</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"
        >
          <LogOut size={16} /> Keluar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white p-1.5 border border-slate-200 rounded-3xl shadow-sm mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: 'eid', label: 'E-ID Warga', icon: QrCode },
          { id: 'update', label: 'Update Data', icon: FileEdit },
          { id: 'guests', label: 'Log Tamu', icon: History }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'eid' && (
          <motion.div 
            key="eid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* E-ID Card */}
            <div className="lg:col-span-2">
              <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white border-none shadow-2xl p-0 aspect-[1.6/1] md:aspect-auto md:h-[400px]">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
                
                <div className="relative h-full flex flex-col p-8 md:p-12">
                  <div className="flex justify-between items-start mb-auto">
                    <div>
                      <h3 className="text-xl md:text-2xl font-black tracking-tighter uppercase">Kartu Warga Digital</h3>
                      <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] opacity-60">Rukun Tetangga 02 / RW 05</p>
                    </div>
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                      <Home size={24} className="md:hidden" />
                      <Home size={32} className="hidden md:block" />
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-8">
                    <div className="space-y-4 md:space-y-6">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Nama Kepala Keluarga</p>
                        <p className="text-2xl md:text-4xl font-black tracking-tight">{currentHouse?.headOfFamily}</p>
                      </div>
                      <div className="flex gap-8 md:gap-12">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">ID Rumah</p>
                          <p className="text-lg md:text-xl font-black">{currentHouse?.block}-{currentHouse?.number}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Status Iuran</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            currentHouse?.paymentStatus === PaymentStatus.PAID 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}>
                            {currentHouse?.paymentStatus || 'Belum Lunas'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-2xl shadow-2xl">
                      <QRCodeSVG 
                        value={`RESIDENT:${selectedHouseId}`} 
                        size={100} 
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Info */}
            <div className="space-y-6">
              <Card className="p-6 bg-white border-slate-100 shadow-sm">
                <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                  <Info size={18} className="text-indigo-600" /> Informasi Hunian
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Jumlah Penghuni</span>
                    <span className="text-sm font-black text-slate-800">{currentHouse?.occupants} Orang</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status Tinggal</span>
                    <span className="text-sm font-black text-slate-800">{currentHouse?.residenceType || 'Tetap'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">No. Telepon</span>
                    <span className="text-sm font-black text-slate-800">{currentHouse?.phone || '-'}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-indigo-50 border-indigo-100 shadow-sm">
                <h4 className="font-black text-indigo-900 mb-2">Manfaat E-ID</h4>
                <p className="text-xs text-indigo-700 font-medium leading-relaxed mb-4">
                  Gunakan QR Code di atas untuk verifikasi identitas saat kegiatan RT, pengambilan bantuan, atau akses fasilitas lingkungan.
                </p>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-[10px] font-black uppercase tracking-widest">
                  Unduh Kartu (PDF)
                </Button>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === 'update' && (
          <motion.div 
            key="update"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800">Pembaruan Data Mandiri</h3>
                <p className="text-sm text-slate-500 font-medium">Ajukan perubahan data jika ada ketidaksesuaian atau penambahan penghuni.</p>
              </div>
              <Button onClick={() => setIsUpdateModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <FileEdit size={18} className="mr-2" /> Ajukan Perubahan
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {updateRequests.length > 0 ? (
                updateRequests.map((req) => (
                  <Card key={req.id} className="p-6 bg-white border-slate-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${
                        req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                        req.status === 'Rejected' ? 'bg-rose-50 text-rose-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        <Clock size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black text-slate-800">Permohonan Update Data</h4>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                            req.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                            req.status === 'Rejected' ? 'bg-rose-100 text-rose-600' :
                            'bg-amber-100 text-amber-600'
                          }`}>
                            {req.status === 'Pending' ? 'Menunggu Review' : req.status === 'Approved' ? 'Disetujui' : 'Ditolak'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{req.reason}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          Diajukan pada {new Date(req.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {req.status === 'Approved' && (
                      <div className="text-emerald-600">
                        <CheckCircle size={24} />
                      </div>
                    )}
                  </Card>
                ))
              ) : (
                <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4">
                    <FileEdit size={32} />
                  </div>
                  <h4 className="font-black text-slate-800 mb-1">Belum Ada Pengajuan</h4>
                  <p className="text-xs text-slate-400 font-medium">Data Anda saat ini sudah sesuai dengan catatan RT.</p>
                </div>
              )}
            </div>

            <Modal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} title="Formulir Update Data">
              <form onSubmit={handleUpdateSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Nama Kepala Keluarga</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      value={updateForm.headOfFamily}
                      onChange={e => setUpdateForm({...updateForm, headOfFamily: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">No. Telepon (WA)</label>
                    <input 
                      type="tel" 
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      value={updateForm.phone}
                      onChange={e => setUpdateForm({...updateForm, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Jumlah Penghuni</label>
                  <input 
                    type="number" 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={updateForm.occupants}
                    onChange={e => setUpdateForm({...updateForm, occupants: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Alasan Perubahan</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Contoh: Penambahan anggota keluarga baru atau koreksi ejaan nama..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none"
                    value={updateForm.reason}
                    onChange={e => setUpdateForm({...updateForm, reason: e.target.value})}
                  />
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                  <AlertCircle className="text-amber-500 shrink-0" size={18} />
                  <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                    Data tidak akan langsung berubah. Admin akan memverifikasi pengajuan Anda terlebih dahulu sebelum memperbarui database utama.
                  </p>
                </div>
                <Button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 mt-4">
                  Kirim Permohonan
                </Button>
              </form>
            </Modal>
          </motion.div>
        )}

        {activeTab === 'guests' && (
          <motion.div 
            key="guests"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-xl font-black text-slate-800">Log Kunjungan Tamu</h3>
              <p className="text-sm text-slate-500 font-medium">Daftar tamu yang melapor berkunjung ke rumah Anda melalui sistem Keamanan RT.</p>
            </div>

            <div className="space-y-4">
              {guestReports.length > 0 ? (
                guestReports.map((guest) => (
                  <Card key={guest.id} className="p-6 bg-white border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-2xl ${guest.status === 'Active' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                        <Users size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black text-slate-800">{guest.guestName}</h4>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                            guest.status === 'Active' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {guest.status === 'Active' ? 'Masih Berkunjung' : 'Sudah Pulang'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(guest.arrivalDate).toLocaleDateString('id-ID')}</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {guest.stayDuration}</span>
                          <span className="flex items-center gap-1"><Info size={12} /> {guest.relationship}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dilaporkan Pada</p>
                      <p className="text-xs font-bold text-slate-700">{new Date(guest.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4">
                    <History size={32} />
                  </div>
                  <h4 className="font-black text-slate-800 mb-1">Belum Ada Data Tamu</h4>
                  <p className="text-xs text-slate-400 font-medium">Tidak ada riwayat tamu yang melapor berkunjung ke rumah Anda.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
