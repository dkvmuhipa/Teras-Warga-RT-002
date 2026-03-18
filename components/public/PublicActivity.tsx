import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, CheckCircle, QrCode, ArrowLeft, Clock, Info, AlertTriangle } from 'lucide-react';
import { Activity, Attendance, House } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { toast } from 'sonner';
import { 
  subscribeToActivities, 
  addAttendanceToDb,
  subscribeToAttendance
} from '../../services/databaseService';
import { motion, AnimatePresence } from 'motion/react';
import { QrReader } from 'react-qr-reader';
import { Link } from 'react-router-dom';

export const PublicActivity: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  
  const [residentForm, setResidentForm] = useState({
    name: localStorage.getItem('resident_name') || '',
    houseId: localStorage.getItem('resident_house_id') || ''
  });

  const handleFormChange = (field: 'name' | 'houseId', value: string) => {
    setResidentForm(prev => ({ ...prev, [field]: value }));
    localStorage.setItem(`resident_${field === 'name' ? 'name' : 'house_id'}`, value);
  };

  const [activityAttendance, setActivityAttendance] = useState<Attendance[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToActivities((data) => {
      // Filter only upcoming or ongoing activities
      setActivities(data.filter(a => a.status !== 'Completed'));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedActivity) {
      const unsubscribe = subscribeToAttendance(selectedActivity.id, setActivityAttendance);
      return () => unsubscribe();
    } else {
      setActivityAttendance([]);
    }
  }, [selectedActivity]);

  const handleScan = async (result: any) => {
    if (result && selectedActivity) {
      const scannedId = result.getText();
      if (scannedId === selectedActivity.id) {
        if (!residentForm.name || !residentForm.houseId) {
          toast.error("Mohon isi nama dan blok rumah terlebih dahulu!");
          setIsScanModalOpen(false);
          return;
        }

        // Check for duplicates
        const trimmedName = residentForm.name.trim().toLowerCase();
        const trimmedHouseId = residentForm.houseId.trim().toLowerCase();

        const isDuplicate = activityAttendance.some(
          a => a.houseId.trim().toLowerCase() === trimmedHouseId || 
               a.residentName.trim().toLowerCase() === trimmedName
        );

        if (isDuplicate) {
          toast.warning("Anda atau rumah Anda sudah tercatat hadir dalam kegiatan ini!");
          setIsScanModalOpen(false);
          return;
        }

        try {
          await addAttendanceToDb({
            activityId: selectedActivity.id,
            residentName: residentForm.name.trim(),
            houseId: residentForm.houseId.trim(),
            timestamp: new Date().toISOString()
          });
          setIsScanModalOpen(false);
          setIsSuccessModalOpen(true);
        } catch (error) {
          console.error(error);
          toast.error("Gagal mencatat kehadiran.");
        }
      } else {
        toast.error("QR Code tidak cocok dengan kegiatan ini!");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-lg font-black text-slate-800 tracking-tight">Presensi Kegiatan</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Info */}
        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Users size={160} />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black mb-2">Ayo Berpartisipasi!</h2>
            <p className="text-indigo-100 font-medium max-w-md">Silakan isi data diri dan scan QR Code yang tersedia di lokasi kegiatan untuk mencatat kehadiran Anda.</p>
          </div>
        </div>

        {/* Resident Data Form */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Info size={16} className="text-indigo-500" /> Data Diri Peserta
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Nama Lengkap</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                placeholder="Masukkan nama Anda"
                value={residentForm.name}
                onChange={e => handleFormChange('name', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Blok Rumah</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                placeholder="Contoh: C10-08"
                value={residentForm.houseId}
                onChange={e => handleFormChange('houseId', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Activities List */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest pl-2">Kegiatan Berlangsung & Akan Datang</h3>
          
          {activities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activities.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      activity.status === 'Ongoing' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'
                    }`}>
                      {activity.status}
                    </span>
                    <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                      <Calendar size={18} />
                    </div>
                  </div>

                  <h4 className="text-lg font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{activity.title}</h4>
                  {activity.isMandatory && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-100 flex items-center gap-1">
                        <AlertTriangle size={10} /> Wajib
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">Kompensasi Absen: Rp {activity.compensationAmount?.toLocaleString()}</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">{activity.description}</p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                      <Clock size={14} className="text-indigo-500" />
                      {new Date(activity.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                      <MapPin size={14} className="text-indigo-500" />
                      {activity.location}
                    </div>
                  </div>

                  <Button 
                    onClick={() => { setSelectedActivity(activity); setIsScanModalOpen(true); }}
                    className={`w-full py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                      activity.status === 'Ongoing' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                    }`}
                  >
                    <QrCode size={18} /> Scan Presensi
                  </Button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                <Calendar size={32} />
              </div>
              <p className="text-slate-400 font-bold">Belum ada kegiatan yang dijadwalkan.</p>
            </div>
          )}
        </div>
      </div>

      {/* Scan Modal */}
      <Modal isOpen={isScanModalOpen} onClose={() => setIsScanModalOpen(false)} title={`Presensi: ${selectedActivity?.title}`}>
        <div className="space-y-6">
          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-center">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Peserta: {residentForm.name || 'Belum diisi'}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Blok: {residentForm.houseId || '-'}</p>
          </div>

          <div className="w-full aspect-square bg-slate-900 rounded-3xl overflow-hidden border-4 border-white shadow-2xl relative">
            <QrReader
              constraints={{ facingMode: 'environment' }}
              onResult={handleScan}
              className="w-full h-full"
            />
            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
              <div className="w-full h-full border-2 border-indigo-500 rounded-xl animate-pulse" />
            </div>
          </div>

          <p className="text-center text-xs font-bold text-slate-500">Arahkan kamera ke QR Code yang disediakan petugas di lokasi.</p>
          
          <Button onClick={() => setIsScanModalOpen(false)} variant="outline" className="w-full">Batal</Button>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)} title="Presensi Berhasil!">
        <div className="text-center py-6 space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle size={48} />
          </div>
          <div>
            <h4 className="text-xl font-black text-slate-800 mb-2">Terima Kasih!</h4>
            <p className="text-sm text-slate-500">Kehadiran Anda di kegiatan <strong>{selectedActivity?.title}</strong> telah tercatat dalam sistem.</p>
          </div>
          <Button onClick={() => setIsSuccessModalOpen(false)} className="w-full bg-emerald-600 hover:bg-emerald-700">Tutup</Button>
        </div>
      </Modal>
    </div>
  );
};
