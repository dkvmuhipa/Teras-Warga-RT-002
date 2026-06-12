import React, { useState } from 'react';
import { 
  User, Phone, Calendar, Clock, Send, Check, ArrowLeft, Camera, 
  ShieldAlert, Lock, MapPin, FileText, Car, Info, Eye, EyeOff, Trash2, 
  Building, CheckCircle2, UserCheck, ShieldCheck
} from 'lucide-react';
import { Button } from './ui/Button';
import { 
  addGuestReportToDb, uploadImageToStorage, validateResidentAccess, 
  handleFirestoreError, OperationType, isFirebaseConfigured 
} from '../services/databaseService';
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
  const [showPin, setShowPin] = useState(false);
  
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [ktpPreview, setKtpPreview] = useState<string | null>(null);
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
        toast.success('Verifikasi Berhasil!', {
          description: 'Identitas rumah terverifikasi. Silakan lengkapi formulir laporan.'
        });
      } else {
        toast.error('PIN Akses Salah', {
          description: 'Pastikan kecocokan 6-digit PIN rumah Anda.'
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal melakukan verifikasi PIN.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setKtpFile(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setKtpPreview(previewUrl);
    } else {
      setKtpPreview(null);
    }
  };

  const handleRemoveFile = () => {
    setKtpFile(null);
    setKtpPreview(null);
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
      toast.success('Laporan Tamu Berhasil Dikirim!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "guestReports");
      toast.error('Gagal mengirim laporan tamu.', {
        description: 'Periksa kembali koneksi internet Anda.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const activeHouse = houses.find(h => h.id === formData.residentHouseId);

  // 1. SUCCESS SUBMISSION VIEW
  if (isSubmitted) {
    return (
      <div className="bg-white p-8 md:p-11 rounded-[2.5rem] border border-slate-150 shadow-2xl max-w-xl mx-auto text-center" id="success-guest-report">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner border border-emerald-100">
          <CheckCircle2 size={30} strokeWidth={2.5} />
        </div>
        
        <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">Pelaporan Tamu Sukses</h2>
        <span className="px-3.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-full inline-block mb-6 border border-emerald-150">
          TERDAFTAR DALAM DATABASE RT 02
        </span>
        
        <p className="text-slate-500 text-[11px] font-semibold leading-relaxed max-w-sm mx-auto mb-7">
          Terima kasih telah melaporkan kunjungan tamu Anda secara tertib. Laporan digital ini diarsipkan resmi pada database lingkungan RT 02 demi ketentraman bersama.
        </p>

        {/* Guest info card preview */}
        <div className="bg-slate-50 border border-slate-150 rounded-xl p-5 mb-7 text-left space-y-3 shadow-xs">
          <div className="border-b border-slate-200/55 pb-2.5 flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Detail Terarsip</span>
            <span className="text-[9px] font-black text-slate-800 bg-slate-200/50 px-2.5 py-0.5 rounded uppercase tracking-wider">SIP RESIDENT</span>
          </div>
          
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-[10.5px] font-semibold text-slate-700">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap Tamu</p>
              <p className="text-slate-900 mt-0.5 uppercase font-black">{formData.guestName}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tuan Rumah (Host)</p>
              <p className="text-slate-900 mt-0.5 font-black">Bp/Ibu {activeHouse?.headOfFamily}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Durasi Kunjungan</p>
              <p className="text-slate-900 mt-0.5 font-black">{formData.stayDuration}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Blok Rumah</p>
              <p className="text-slate-900 mt-0.5 font-black">Mansion Blok {activeHouse?.block}-{activeHouse?.number}</p>
            </div>
          </div>
        </div>

        <Button 
          id="back-to-home-from-sub"
          onClick={onClose} 
          className="w-full py-4 bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
        >
          Selesai & Tutup Formulir
        </Button>
      </div>
    );
  }

  // 2. UNVERIFIED ACCESS GATE VIEW
  if (!isVerified) {
    return (
      <div className="bg-white p-7 md:p-10 rounded-[2.5rem] shadow-2xl max-w-md mx-auto border border-slate-150" id="gate-guest-report">
        <div className="flex items-center gap-4 mb-7">
          <button 
            type="button"
            onClick={onClose} 
            className="p-2.5 hover:bg-slate-50 border border-slate-150 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} className="text-slate-500" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[8px] font-black uppercase tracking-widest border border-rose-100">PROSEDUR 1X24 JAM</span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">Lapor Kunjungan Tamu</h2>
          </div>
        </div>

        {/* Security Alert Badge */}
        <div className="p-4 bg-amber-50/45 border border-amber-100 rounded-xl flex gap-3 mb-6.5">
          <div className="p-1.5 bg-white rounded-lg shadow-xs text-amber-500 self-start shrink-0 border border-amber-100">
            <Lock size={14} />
          </div>
          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
            Demi menjaga kenyamanan lingkungan, pelapor tamu wajib divalidasi menggunakan <b>PIN Akses Rumah Tuan Rumah</b> untuk mencegah manipulasi data.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest ml-1">Nama Tuan Rumah <span className="text-rose-500">*</span></label>
            <div className="relative">
              <select 
                required
                className="w-full pl-4 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:bg-white focus:border-slate-900 hover:border-slate-300 outline-none transition-all appearance-none cursor-pointer shadow-xs"
                value={formData.residentHouseId}
                onChange={e => setFormData({...formData, residentHouseId: e.target.value})}
              >
                <option value="">-- Pilih Nama Kepala Keluarga / Blok --</option>
                {houses.map(h => (
                  <option key={h.id} value={h.id}>
                    Blok {h.block}-{h.number} (Bpk/Ibu {h.headOfFamily})
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <Building size={13} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest">PIN Otoritas Rumah <span className="text-rose-500">*</span></label>
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">6 DIGIT</span>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                required
                type={showPin ? "text" : "password"}
                placeholder="MASUKKAN PIN"
                maxLength={6}
                className="w-full pl-11 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:bg-white focus:border-slate-900 hover:border-slate-300 outline-none transition-all text-center tracking-[0.5em] placeholder:tracking-normal placeholder:font-bold placeholder:text-slate-350 shadow-xs"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <Button 
            id="verify-pin-guest-btn"
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? 'Memproses Verifikasi...' : (
              <>
                <UserCheck size={13} /> Otorisasi & Lanjutkan Form
              </>
            )}
          </Button>
          
          <p className="text-[9px] text-center text-slate-400 font-bold leading-normal uppercase tracking-wide">
            Otoritas akses terdaftar saat sensus data warga RT 02.
          </p>
        </form>
      </div>
    );
  }

  // 3. VERIFIED GUEST REPORT FORM VIEW
  return (
    <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl max-w-4xl mx-auto border border-slate-150" id="main-verified-form-guest">
      
      {/* Redesigned Verified Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => setIsVerified(false)} 
            className="p-2.5 hover:bg-slate-50 border border-slate-150 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Kembali ke verifikasi"
          >
            <ArrowLeft size={15} className="text-slate-500" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1">
                <ShieldCheck size={10} /> TEROTORISASI RESIDEN
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">Formulir Lapor Kunjungan Tamu</h2>
            <p className="text-[11px] text-slate-450 font-semibold mt-0.5">Pendataan wajib bagi tamu menginap demi menjaga harmoni wilayah.</p>
          </div>
        </div>

        {/* Resident Host Detail Banner */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl shrink-0 flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-xs text-slate-700 border border-slate-150">
            <Building size={14} />
          </div>
          <div className="text-left text-xs font-bold font-sans">
            <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">Tuan Rumah (Host)</p>
            <p className="text-slate-800 uppercase mt-0.5">
              Bp/Ibu {activeHouse?.headOfFamily}
            </p>
            <p className="text-[9.5px] text-slate-500 leading-none mt-0.5">
              Blok {activeHouse?.block}-{activeHouse?.number}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1: IDENTITAS TAMU */}
        <div className="space-y-5">
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
            <div className="w-5.5 h-5.5 bg-slate-900 text-white rounded-md flex items-center justify-center text-[9px] font-black">1</div>
            <h3 className="text-[10.5px] font-black text-slate-850 uppercase tracking-widest">Identitas Kependudukan Tamu</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest ml-1">Nama Lengkap Tamu <span className="text-rose-500">*</span></label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  required
                  type="text"
                  placeholder="Nama lengkap sesuai KTP"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-slate-900 hover:border-slate-350 outline-none transition-all shadow-xs"
                  value={formData.guestName}
                  onChange={e => setFormData({...formData, guestName: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest ml-1">Nomor NIK KTP (16 Digit)</label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text"
                  maxLength={16}
                  placeholder="Ketik 16 digit NIK tamu"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-slate-900 hover:border-slate-350 outline-none transition-all shadow-xs"
                  value={formData.guestNik}
                  onChange={e => setFormData({...formData, guestNik: e.target.value.replace(/\D/g, '')})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest ml-1">Profesi Pekerjaan</label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text"
                  placeholder="Swasta, Pegawai, Mahasiswa, Ibu Rumah Tangga..."
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-slate-900 hover:border-slate-350 outline-none transition-all shadow-xs"
                  value={formData.guestJob}
                  onChange={e => setFormData({...formData, guestJob: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest ml-1">Jenis Kelamin <span className="text-rose-500">*</span></label>
              <div className="relative">
                <select 
                  required
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-slate-900 hover:border-slate-350 outline-none transition-all appearance-none cursor-pointer shadow-xs"
                  value={formData.gender}
                  onChange={e => setFormData({...formData, gender: e.target.value as any})}
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <User size={13} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest ml-1">Nomor WhatsApp Aktif <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  required
                  type="tel"
                  placeholder="Contoh: 08123456789"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-slate-900 hover:border-slate-350 outline-none transition-all shadow-xs"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest ml-1">Alamat Asal Daerah Tamu <span className="text-rose-500">*</span></label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4.5 text-slate-400" size={14} />
                <textarea 
                  required
                  placeholder="Ketik alamat domisili asal daerah pelapor tamu sesuai KTP"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-slate-900 hover:border-slate-350 outline-none transition-all min-h-[85px] resize-none leading-relaxed shadow-xs"
                  value={formData.guestAddress}
                  onChange={e => setFormData({...formData, guestAddress: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: DETAIL KUNJUNGAN */}
        <div className="space-y-5">
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
            <div className="w-5.5 h-5.5 bg-slate-900 text-white rounded-md flex items-center justify-center text-[9px] font-black">2</div>
            <h3 className="text-[10.5px] font-black text-slate-850 uppercase tracking-widest">Keperluan & Durasi Singgah</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest ml-1">Hubungan Kekerabatan / Relasi <span className="text-rose-500">*</span></label>
              <input 
                required
                type="text"
                placeholder="Orang tua, Saudara Kandung, Rekan Swasta..."
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-slate-900 hover:border-slate-350 outline-none transition-all shadow-xs"
                value={formData.relationship}
                onChange={e => setFormData({...formData, relationship: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest ml-1">Agenda / Maksud Pertemuan <span className="text-rose-500">*</span></label>
              <input 
                required
                type="text"
                placeholder="Silaturahmi lebaran, Liburan, Acara sosial RT..."
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-slate-900 hover:border-slate-350 outline-none transition-all shadow-xs"
                value={formData.purpose}
                onChange={e => setFormData({...formData, purpose: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest ml-1">Tanggal Kedatangan <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  required
                  type="date"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-slate-900 hover:border-slate-350 outline-none transition-all shadow-xs text-slate-805"
                  value={formData.arrivalDate}
                  onChange={e => setFormData({...formData, arrivalDate: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest ml-1">Estimasi Lama Singgah <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  required
                  type="text"
                  placeholder="Contoh: 3 Hari / 1 Minggu"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-slate-900 hover:border-slate-350 outline-none transition-all shadow-xs"
                  value={formData.stayDuration}
                  onChange={e => setFormData({...formData, stayDuration: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest ml-1">Rencana Tanggal Pulang</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="date"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-slate-900 hover:border-slate-350 outline-none transition-all shadow-xs text-slate-805"
                  value={formData.departureDate}
                  onChange={e => setFormData({...formData, departureDate: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-455 uppercase tracking-widest ml-1">Nomor Polisi / Info Kendaraan</label>
              <div className="relative">
                <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text"
                  placeholder="Cth: Toyota Avanza (B 1234 ABC) / Motor Beat (D 567 EF)"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-slate-900 hover:border-slate-350 outline-none transition-all shadow-xs"
                  value={formData.vehicleInfo}
                  onChange={e => setFormData({...formData, vehicleInfo: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: UPLOAD FOTO KTP */}
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-5.5 h-5.5 bg-slate-900 text-white rounded-md flex items-center justify-center text-[9px] font-black">3</div>
              <h3 className="text-[10.5px] font-black text-slate-850 uppercase tracking-widest">Adisi Dokumen KTP Tamu <span className="text-slate-450 font-medium lowercase">(opsional)</span></h3>
            </div>
            {!isFirebaseConfigured && uploadType === 'file' && (
              <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-wider border border-amber-100">DUKUNGAN OFFLINE</span>
            )}
          </div>

          {/* Toggle Type */}
          <div className="flex p-0.5 bg-slate-100 rounded-xl max-w-xs">
            <button 
              type="button" 
              onClick={() => setUploadType('file')} 
              className={`flex-1 py-1.5 text-[9px] font-black rounded-lg transition-all uppercase tracking-wider cursor-pointer ${uploadType === 'file' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Unggah File
            </button>
            <button 
              type="button" 
              onClick={() => setUploadType('url')} 
              className={`flex-1 py-1.5 text-[9px] font-black rounded-lg transition-all uppercase tracking-wider cursor-pointer ${uploadType === 'url' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Tautan URL
            </button>
          </div>

          {uploadType === 'file' ? (
            <div className="relative">
              {ktpPreview ? (
                <div className="relative max-w-md aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                  <img src={ktpPreview} alt="Preview KTP Tamu" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2.5">
                    <label 
                      htmlFor="edit-ktp-file" 
                      className="px-4 py-2 bg-white text-slate-900 rounded-md text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-md hover:bg-slate-50 transition-all"
                    >
                      Ubah Berkas Foto
                    </label>
                    <input 
                      type="file" 
                      id="edit-ktp-file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                    <button 
                      type="button"
                      onClick={handleRemoveFile}
                      className="px-4 py-2 bg-rose-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider shadow-md hover:bg-rose-700 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 size={12} /> Hapus File
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative max-w-md h-36 rounded-xl border border-dashed border-slate-250 bg-slate-50/50 hover:bg-slate-100/40 hover:border-slate-950 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group/uploader">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={handleFileChange}
                  />
                  <div className="p-2.5 bg-white rounded-lg shadow-sm text-slate-400 group-hover/uploader:text-slate-750 transition-colors">
                    <Camera size={18} />
                  </div>
                  <p className="text-[11px] font-black text-slate-705">Ketuk atau Seret File KTP Tamu</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">JPG, PNG, WEBP (MAKSIMAL 5MB)</p>
                </div>
              )}
            </div>
          ) : (
            <div className="relative max-w-md">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="url" 
                placeholder="https://domisili.com/foto-ktp-tamu.jpg" 
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all shadow-xs" 
                value={ktpUrlInput} 
                onChange={e => setKtpUrlInput(e.target.value)} 
              />
            </div>
          )}
        </div>

        {/* Dynamic Alert Box */}
        <div className="p-4.5 bg-rose-50/45 border border-rose-100 rounded-xl flex gap-3.5">
          <div className="p-2 bg-white text-rose-600 rounded-lg shadow-xs self-start shrink-0">
            <ShieldAlert size={15} />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-rose-955 uppercase tracking-wide">Ketentuan Sipil Lapor Tamu 1x24 Jam</h4>
            <p className="text-[10px] text-slate-500 font-semibold mt-1 leading-relaxed">
              Sesuai regulasi rukun tetangga, pelapor tamu yang menginap wajib mendaftarkan identitas tamu resmi demi koordinasi keamanan lingkungan. Informasi terenkripsi dan dijaga kerahasiaannya.
            </p>
          </div>
        </div>

        {/* Action Button Section bar */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center sm:text-left">
            Pastikan berkas dan NIK tamu terisi akurat sesuai KTP.
          </p>
          
          <Button 
            id="submit-citizens-guest-report"
            type="submit" 
            disabled={isLoading}
            className="w-full sm:w-auto px-10 py-3.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md hover:-translate-y-0.5 cursor-pointer"
          >
            {isLoading ? 'Mengirim Data Laporan...' : (
              <span className="flex items-center justify-center gap-1.5">
                <Send size={13} /> Kirim Laporan Tamu Resmi
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
