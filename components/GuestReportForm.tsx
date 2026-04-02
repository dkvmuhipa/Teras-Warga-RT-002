import React, { useState } from 'react';
import { User, Phone, Calendar, Clock, Send, CheckCircle, ArrowLeft, Camera, ShieldAlert, Lock, MapPin, FileText, Car, Info } from 'lucide-react';
import { Button } from './ui/Button';
import { addGuestReportToDb, uploadImageToStorage, validateResidentAccess, handleFirestoreError, OperationType, isFirebaseConfigured } from '../services/databaseService';
import { House } from '../types';
import { toast } from 'sonner';

interface GuestReportFormProps {
  onClose: () => void;
  houses: House[];
}

export const GuestReportForm: React.FC<GuestReportFormProps> = ({ onClose, houses }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [pin, setPin] = useState('');
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [ktpUrlInput, setKtpUrlInput] = useState('');
  const [uploadType, setUploadType] = useState<'file' | 'url'>('file');
  const [formData, setFormData] = useState({
    residentHouseId: '',
    guestName: '',
    guestNik: '',
    guestJob: '',
    guestAddress: '',
    gender: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    relationship: '',
    purpose: '',
    stayDuration: '',
    arrivalDate: new Date().toISOString().split('T')[0],
    departureDate: '',
    vehicleInfo: '',
    phone: '',
  });

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.residentHouseId) {
      toast.error('Pilih rumah terlebih dahulu.');
      return;
    }
    if (!pin) {
      toast.error('Masukkan PIN akses.');
      return;
    }

    setIsLoading(true);
    try {
      const isValid = await validateResidentAccess(formData.residentHouseId, pin);
      if (isValid) {
        setIsVerified(true);
        toast.success('Verifikasi berhasil! Silakan lengkapi data tamu.');
      } else {
        toast.error('PIN Akses salah.', {
          description: 'Gunakan PIN yang diberikan oleh pengurus RT.'
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat verifikasi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const selectedHouse = houses.find(h => h.id === formData.residentHouseId);
      let ktpUrl = ktpUrlInput;

      if (uploadType === 'file' && ktpFile) {
        ktpUrl = await uploadImageToStorage(ktpFile, `guests/ktp_${Date.now()}_${ktpFile.name}`);
      }

      await addGuestReportToDb({
        ...formData,
        residentName: selectedHouse?.headOfFamily || 'Warga',
        ktpUrl,
        status: 'Active',
        createdAt: new Date().toISOString()
      });
      setIsSubmitted(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "guestReports");
      toast.error('Gagal mengirim laporan tamu.', {
        description: 'Silakan coba lagi beberapa saat lagi.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-4">Laporan Diterima!</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          Terima kasih telah melaporkan tamu Anda. Data ini membantu menjaga keamanan lingkungan kita bersama.
        </p>
        <Button onClick={onClose} className="w-full py-4 bg-slate-800 hover:bg-slate-900">
          Kembali ke Beranda
        </Button>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-w-md mx-auto border border-slate-100">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Lock size={16} className="text-indigo-500" />
              <h2 className="text-2xl font-black text-slate-800">Verifikasi</h2>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gunakan PIN Akses Warga</p>
          </div>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Rumah <span className="text-red-500">*</span></label>
            <select 
              required
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              value={formData.residentHouseId}
              onChange={e => setFormData({...formData, residentHouseId: e.target.value})}
            >
              <option value="">Pilih Rumah Anda</option>
              {houses.map(h => (
                <option key={h.id} value={h.id}>Blok {h.block} No. {h.number} - {h.headOfFamily}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PIN Akses <span className="text-red-500">*</span></label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                required
                type="password"
                placeholder="Masukkan PIN"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all tracking-[0.5em]"
                value={pin}
                onChange={e => setPin(e.target.value)}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
          >
            {isLoading ? 'Memverifikasi...' : 'Lanjut Lapor Tamu'}
          </Button>
          
          <p className="text-[10px] text-center text-slate-400 font-bold mt-4">
            Lupa PIN? Silakan hubungi pengurus RT.
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-w-3xl mx-auto border border-slate-100">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setIsVerified(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-slate-400" />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert size={16} className="text-rose-500" />
            <h2 className="text-2xl font-black text-slate-800">Detail Laporan Tamu</h2>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rumah: {houses.find(h => h.id === formData.residentHouseId)?.headOfFamily} (Blok {houses.find(h => h.id === formData.residentHouseId)?.block}-{houses.find(h => h.id === formData.residentHouseId)?.number})</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Identitas Tamu */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
            <User size={14} /> Identitas Tamu
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap Tamu</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="text"
                  placeholder="Sesuai KTP"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  value={formData.guestName}
                  onChange={e => setFormData({...formData, guestName: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NIK Tamu (Opsional)</label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="16 Digit NIK"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  value={formData.guestNik}
                  onChange={e => setFormData({...formData, guestNik: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pekerjaan Tamu</label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Pekerjaan Tamu..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  value={formData.guestJob}
                  onChange={e => setFormData({...formData, guestJob: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Kelamin</label>
              <select 
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                value={formData.gender}
                onChange={e => setFormData({...formData, gender: e.target.value as any})}
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor HP Tamu</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="tel"
                  placeholder="0812xxxx"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Asal</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 text-slate-400" size={18} />
                <textarea 
                  placeholder="Alamat Lengkap Asal Tamu"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all min-h-[100px]"
                  value={formData.guestAddress}
                  onChange={e => setFormData({...formData, guestAddress: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Detail Kunjungan */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
            <Info size={14} /> Detail Kunjungan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hubungan</label>
              <input 
                required
                type="text"
                placeholder="Saudara, Teman, dll"
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                value={formData.relationship}
                onChange={e => setFormData({...formData, relationship: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keperluan</label>
              <input 
                required
                type="text"
                placeholder="Tujuan Kunjungan"
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                value={formData.purpose}
                onChange={e => setFormData({...formData, purpose: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Kedatangan</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="date"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  value={formData.arrivalDate}
                  onChange={e => setFormData({...formData, arrivalDate: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lama Menginap (Hari)</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="text"
                  placeholder="Contoh: 3 Hari"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  value={formData.stayDuration}
                  onChange={e => setFormData({...formData, stayDuration: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rencana Kepulangan</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="date"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  value={formData.departureDate}
                  onChange={e => setFormData({...formData, departureDate: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Info Kendaraan (Jika Ada)</label>
              <div className="relative">
                <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Merk & No. Polisi"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  value={formData.vehicleInfo}
                  onChange={e => setFormData({...formData, vehicleInfo: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Foto KTP Tamu</label>
            {!isFirebaseConfigured && uploadType === 'file' && (
              <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded uppercase tracking-widest">Storage Offline (Opsional)</span>
            )}
          </div>

          <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-4">
            <button 
              type="button" 
              onClick={() => setUploadType('file')} 
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${uploadType === 'file' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
            >
              Upload File
            </button>
            <button 
              type="button" 
              onClick={() => setUploadType('url')} 
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${uploadType === 'url' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
            >
              Link URL
            </button>
          </div>

          {uploadType === 'file' ? (
            <div className={`
              relative h-40 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 cursor-pointer overflow-hidden
              ${ktpFile ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-indigo-300'}
            `}>
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                onChange={e => setKtpFile(e.target.files?.[0] || null)}
              />
              {ktpFile ? (
                <div className="text-center p-4">
                  <CheckCircle className="mx-auto mb-2 text-indigo-600" size={32} />
                  <p className="text-xs font-black text-indigo-600 truncate max-w-[200px]">{ktpFile.name}</p>
                </div>
              ) : (
                <>
                  <Camera className="text-slate-300" size={40} />
                  <p className="text-xs font-black text-slate-400">Ambil Foto KTP Tamu</p>
                </>
              )}
            </div>
          ) : (
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="url" 
                placeholder="https://link-foto-ktp.com/foto.jpg" 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                value={ktpUrlInput} 
                onChange={e => setKtpUrlInput(e.target.value)} 
              />
            </div>
          )}
        </div>

        <div className="pt-6">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-100 flex items-center justify-center gap-3"
          >
            {isLoading ? 'Mengirim...' : (
              <>
                <Send size={18} />
                Kirim Laporan Tamu
              </>
            )}
          </Button>
          <p className="text-[10px] text-center text-slate-400 font-bold mt-4 italic">
            * Laporan ini akan diteruskan ke Pengurus RT dan Petugas Keamanan.
          </p>
        </div>
      </form>
    </div>
  );
};
