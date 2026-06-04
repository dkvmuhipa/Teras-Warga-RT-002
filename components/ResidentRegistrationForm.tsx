import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Home, Phone, Users, Send, CheckCircle, ArrowLeft, Plus, Trash2, 
  GraduationCap, Briefcase, Car, Baby, Heart, Accessibility, Smile, 
  FileText, Camera, ShieldCheck, MapPin, Calendar, Check, AlertCircle, Info
} from 'lucide-react';
import { Button } from './ui/Button';
import { 
  addResidentRegistrationToDb, uploadImageToStorage, checkHouseOccupied, 
  formatHouseId, handleFirestoreError, OperationType, isFirebaseConfigured 
} from '../services/databaseService';
import { toast } from 'sonner';

interface ResidentRegistrationFormProps {
  onClose: () => void;
}

const STEPS = [
  { label: 'Domisili', desc: 'Lokasi & Kontak' },
  { label: 'Profil Utama', desc: 'Personal' },
  { label: 'Keluarga', desc: 'Anggota & Hubungan' },
  { label: 'Berkas', desc: 'Lampiran Pendukung' }
];

export const ResidentRegistrationForm: React.FC<ResidentRegistrationFormProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [kkFile, setKkFile] = useState<File | null>(null);
  const [ktpUrlInput, setKtpUrlInput] = useState('');
  const [kkUrlInput, setKkUrlInput] = useState('');
  const [uploadType, setUploadType] = useState<'file' | 'url'>('file');
  const [formData, setFormData] = useState({
    headOfFamily: '',
    gender: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    birthDate: '',
    ownerName: '',
    block: '',
    number: '',
    phone: '',
    status: 'Occupied' as const,
    residenceType: 'Tetap' as const,
    religion: 'Islam',
    occupants: 1,
    education: '',
    jobCategory: '',
    vehicleCount: 0,
    pregnantCount: 0,
    babyCount: 0,
    toddlerCount: 0,
    teenagerCount: 0,
    adultCount: 0,
    elderlyCount: 0,
    widowCount: 0,
    familyMembers: [] as { id?: string; name: string; nik?: string; gender: 'Laki-laki' | 'Perempuan'; relation: any; birthDate?: string; job?: string }[]
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const addFamilyMember = () => {
    setFormData({
      ...formData,
      familyMembers: [...formData.familyMembers, { 
        id: Math.random().toString(36).substr(2, 9),
        name: '', 
        relation: 'Anak', 
        gender: 'Laki-laki', 
        birthDate: '',
        job: '',
        nik: ''
      }]
    });
  };

  const removeFamilyMember = (index: number) => {
    const newList = [...formData.familyMembers];
    newList.splice(index, 1);
    setFormData({ ...formData, familyMembers: newList });
  };

  const updateFamilyMember = (index: number, field: string, value: string) => {
    const newList = [...formData.familyMembers];
    newList[index] = { ...newList[index], [field]: value };
    setFormData({ ...formData, familyMembers: newList });
  };

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (currentStep === 0) {
      if (!formData.block.trim()) errors.block = 'Blok wajib diisi';
      if (!formData.number.trim()) errors.number = 'Nomor rumah wajib diisi';
      if (!formData.phone.trim()) {
        errors.phone = 'Nomor WhatsApp wajib diisi';
      } else if (!/^[0-9\s+-]{8,15}$/.test(formData.phone.trim())) {
        errors.phone = 'Nomor WhatsApp tidak valid (contoh: 08123456789)';
      }
    } else if (currentStep === 1) {
      if (!formData.headOfFamily.trim()) errors.headOfFamily = 'Nama lengkap wajib diisi';
      if (!formData.birthDate) errors.birthDate = 'Tanggal lahir wajib diisi';
      if (!formData.education.trim()) errors.education = 'Pendidikan terakhir wajib diisi';
      if (!formData.jobCategory.trim()) errors.jobCategory = 'Pekerjaan wajib diisi';
    } else if (currentStep === 2) {
      // Validate family members if any are added but blank
      formData.familyMembers.forEach((member, idx) => {
        if (!member.name.trim()) {
          errors[`member_${idx}_name`] = 'Nama anggota wajib diisi';
        }
        if (!member.job?.trim()) {
          errors[`member_${idx}_job`] = 'Pekerjaan anggota wajib diisi';
        }
      });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error('Mohon Lengkapi Data', {
        description: 'Silakan isi kolom berlabel merah terlebih dahulu.',
        position: 'top-center'
      });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    setIsLoading(true);
    try {
      const houseId = formatHouseId(`${formData.block}-${formData.number}`);
      const isOccupied = await checkHouseOccupied(houseId);
      
      if (isOccupied) {
        toast.error('Unit Rumah Sudah Terdaftar!', {
          description: `Blok ${formData.block} No. ${formData.number} sudah berpenghuni. Jika ingin menambahkan anggota keluarga baru, silakan gunakan fitur Mutasi di halaman layanan warga.`,
          duration: 7000,
          position: 'top-center'
        });
        setIsLoading(false);
        return;
      }

      let ktpUrl = ktpUrlInput;
      let kkUrl = kkUrlInput;

      if (uploadType === 'file') {
        if (ktpFile) {
          ktpUrl = await uploadImageToStorage(ktpFile, `registrations/ktp_${Date.now()}_${ktpFile.name}`);
        }
        if (kkFile) {
          kkUrl = await uploadImageToStorage(kkFile, `registrations/kk_${Date.now()}_${kkFile.name}`);
        }
      }

      await addResidentRegistrationToDb({
        ...formData,
        ktpUrl,
        kkUrl,
        date: new Date().toISOString(),
        approvalStatus: 'Pending'
      });
      setIsSubmitted(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "residentRegistrations");
      toast.error('Gagal mengirim pendaftaran.', {
        description: 'Pastikan koneksi internet Anda stabil, lalu silakan coba kembali.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const incrementValue = (field: keyof typeof formData) => {
    const val = formData[field] as number;
    setFormData({ ...formData, [field]: val + 1 });
  };

  const decrementValue = (field: keyof typeof formData, min: number = 0) => {
    const val = formData[field] as number;
    setFormData({ ...formData, [field]: Math.max(min, val - 1) });
  };

  const isLastStep = currentStep === STEPS.length - 1;

  if (isSubmitted) {
    return (
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl text-center max-w-md mx-auto border border-slate-100">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="stroke-[2.5]" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Pendaftaran Dikirim!</h2>
        <p className="text-[10px] uppercase font-black tracking-widest text-emerald-600 mt-1">Dalam Proses Peninjauan</p>
        <p className="text-slate-500 text-xs leading-relaxed mt-4 mb-8">
          Terima kasih. Berkas pendaftaran warga baru Anda telah sukses terkirim ke sistem pengurus RT 020. 
          Kami akan memverifikasi berkas Anda segera dan menghubungi via nomor WhatsApp yang dicantumkan.
        </p>
        <Button onClick={onClose} variant="primary" className="w-full py-4 text-xs font-black tracking-widest">
          Kembali ke Beranda
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl max-w-3xl mx-auto border border-slate-100">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          type="button"
          onClick={onClose} 
          className="p-3 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all active:scale-95 text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Pendaftaran Warga Baru</h2>
          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mt-1">Sistem Informasi Kependudukan RT 020</p>
        </div>
      </div>

      {/* Multi-step Progressive Indicator */}
      <div className="mb-8 p-1 bg-slate-50 border border-slate-100 rounded-[2rem] hidden md:block">
        <div className="grid grid-cols-4 gap-1">
          {STEPS.map((step, idx) => {
            const isActive = currentStep === idx;
            const isCompleted = currentStep > idx;
            return (
              <div 
                key={idx}
                className={`flex items-center gap-3 px-5 py-3 rounded-3xl transition-all duration-300 ${
                  isActive ? 'bg-white shadow-sm border border-slate-200/50' : ''
                }`}
              >
                <div className={`w-6 h-6 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${
                  isCompleted ? 'bg-emerald-500 text-white' : 
                  isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'bg-slate-200 text-slate-400'
                }`}>
                  {isCompleted ? <Check size={12} className="stroke-[3]" /> : idx + 1}
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-wider leading-none ${isActive ? 'text-indigo-600' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                    {step.label}
                  </p>
                  <p className="text-[8px] font-bold text-slate-400 mt-1">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compact Indicator for Mobile Devices */}
      <div className="md:hidden mb-6 p-4 bg-slate-50 border border-slate-100 rounded-3xl">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
          <span>Langkah {currentStep + 1} s.d {STEPS.length}</span>
          <span className="text-indigo-600 font-extrabold">{STEPS[currentStep].label}</span>
        </div>
        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
          <div 
            className="bg-indigo-600 h-full transition-all duration-500 rounded-full"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="space-y-6"
          >
            {/* STEP 0: DOMISILI & KONTAK */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
                    <Home size={15} />
                  </div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Informasi Hunian & Kontak</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Blok Rumah <span className="text-rose-500">*</span></label>
                    <input 
                      required 
                      type="text" 
                      placeholder="Contoh: B" 
                      className={`w-full px-4 py-3.5 bg-slate-50 border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400 outline-none transition-all uppercase ${
                        validationErrors.block ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200/80 focus:border-indigo-500'
                      }`}
                      value={formData.block} 
                      onChange={e => {
                        setFormData({...formData, block: e.target.value.toUpperCase()});
                        if (validationErrors.block) setValidationErrors({...validationErrors, block: ''});
                      }} 
                    />
                    {validationErrors.block && (
                      <p className="text-[9px] font-bold text-rose-500 uppercase ml-1">{validationErrors.block}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor Unit <span className="text-rose-500">*</span></label>
                    <input 
                      required 
                      type="text" 
                      placeholder="Contoh: 14" 
                      className={`w-full px-4 py-3.5 bg-slate-50 border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400 outline-none transition-all ${
                        validationErrors.number ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200/80 focus:border-indigo-500'
                      }`}
                      value={formData.number} 
                      onChange={e => {
                        setFormData({...formData, number: e.target.value});
                        if (validationErrors.number) setValidationErrors({...validationErrors, number: ''});
                      }} 
                    />
                    {validationErrors.number && (
                      <p className="text-[9px] font-bold text-rose-500 uppercase ml-1">{validationErrors.number}</p>
                    )}
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor WhatsApp Aktif <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        required 
                        type="tel" 
                        placeholder="Contoh: 08123456789" 
                        className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400 outline-none transition-all ${
                          validationErrors.phone ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200/80 focus:border-indigo-500'
                        }`}
                        value={formData.phone} 
                        onChange={e => {
                          setFormData({...formData, phone: e.target.value});
                          if (validationErrors.phone) setValidationErrors({...validationErrors, phone: ''});
                        }} 
                      />
                    </div>
                    {validationErrors.phone && (
                      <p className="text-[9px] font-bold text-rose-500 uppercase ml-1">{validationErrors.phone}</p>
                    )}
                    <span className="text-[9px] text-slate-400 font-bold ml-1 uppercase tracking-wide">Nomor HP yang dihubungi oleh pengurus RT untuk verifikasi.</span>
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Hunian Rumah <span className="text-rose-500">*</span></label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'Occupied', label: 'Dihuni', desc: 'Menetap dan tinggal di rumah ini' },
                        { id: 'Business', label: 'Tempat Usaha', desc: 'Digunakan sebagai lokasi tempat usaha' },
                        { id: 'Visiting', label: 'Mengunjungi / Kunjungan', desc: 'Caretaker / sering berkunjung untuk merawat rumah' }
                      ].map((t) => {
                        const isSel = formData.status === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setFormData({...formData, status: t.id as any})}
                            className={`p-4 text-left border rounded-[1.5rem] transition-all relative overflow-hidden group active:scale-[0.98] ${
                              isSel 
                                ? 'bg-emerald-50/70 border-emerald-500/60 shadow-sm ring-2 ring-emerald-500/5' 
                                : 'bg-slate-50/30 border-slate-200/80 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1.5">
                              <span className={`text-xs font-black ${isSel ? 'text-emerald-600' : 'text-slate-700'}`}>{t.label}</span>
                              <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center ${isSel ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'}`}>
                                {isSel && <Check size={10} className="stroke-[3]" />}
                              </div>
                            </div>
                            <p className="text-[9px] font-semibold text-slate-400 leading-relaxed">{t.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Kepenghunian Rumah <span className="text-rose-500">*</span></label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'Tetap', label: 'Milik Sendiri', desc: 'Sertifikat pribadi/keluarga' },
                        { id: 'Sewa', label: 'Sewa / Kontrak', desc: 'Sewa / indekos per bulan / tahun' },
                        { id: 'Rumah Keluarga', label: 'Rumah Keluarga', desc: 'Kerabat / Orang tua' }
                      ].map((type) => {
                        const isSel = formData.residenceType === type.id;
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setFormData({...formData, residenceType: type.id as any})}
                            className={`p-4 text-left border rounded-[1.5rem] transition-all relative overflow-hidden group active:scale-[0.98] ${
                              isSel 
                                ? 'bg-indigo-50/70 border-indigo-500/60 shadow-sm ring-2 ring-indigo-500/5' 
                                : 'bg-slate-50/30 border-slate-200/80 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1.5">
                              <span className={`text-xs font-black ${isSel ? 'text-indigo-600' : 'text-slate-700'}`}>{type.label}</span>
                              <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center ${isSel ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                                {isSel && <Check size={10} className="stroke-[3]" />}
                              </div>
                            </div>
                            <p className="text-[9px] font-semibold text-slate-400 leading-relaxed">{type.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah Anggota Keluarga <span className="text-rose-500">*</span></label>
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl w-full">
                      <button
                        type="button"
                        onClick={() => decrementValue('occupants', 1)}
                        className="w-10 h-10 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center font-bold text-lg select-none transition-all active:scale-90"
                      >
                        -
                      </button>
                      <span className="font-extrabold text-slate-800 text-sm">{formData.occupants} Orang</span>
                      <button
                        type="button"
                        onClick={() => incrementValue('occupants')}
                        className="w-10 h-10 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center font-bold text-lg select-none transition-all active:scale-90"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah Kendaraan</label>
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl w-full">
                      <button
                        type="button"
                        onClick={() => decrementValue('vehicleCount')}
                        className="w-10 h-10 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center font-bold text-lg select-none transition-all active:scale-90"
                      >
                        -
                      </button>
                      <span className="font-extrabold text-slate-800 text-sm">{formData.vehicleCount} Unit</span>
                      <button
                        type="button"
                        onClick={() => incrementValue('vehicleCount')}
                        className="w-10 h-10 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center font-bold text-lg select-none transition-all active:scale-90"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: PROFIL KEPALA KELUARGA */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                    <User size={15} />
                  </div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Profil Kepala Keluarga / Penghuni</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap Kepala Keluarga / Penghuni <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        required 
                        type="text" 
                        placeholder="Contoh: Joko Prasetyo" 
                        className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400 outline-none transition-all ${
                          validationErrors.headOfFamily ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200/80 focus:border-indigo-500'
                        }`}
                        value={formData.headOfFamily} 
                        onChange={e => {
                          setFormData({...formData, headOfFamily: e.target.value});
                          if (validationErrors.headOfFamily) setValidationErrors({...validationErrors, headOfFamily: ''});
                        }} 
                      />
                    </div>
                    {validationErrors.headOfFamily && (
                      <p className="text-[9px] font-bold text-rose-500 uppercase ml-1">{validationErrors.headOfFamily}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Kelamin <span className="text-rose-500">*</span></label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'Laki-laki', label: 'Laki-laki' },
                        { id: 'Perempuan', label: 'Perempuan' }
                      ].map((item) => {
                        const isSel = formData.gender === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setFormData({...formData, gender: item.id as any})}
                            className={`py-3.5 text-center font-bold text-xs border rounded-2xl transition-all ${
                              isSel 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/15' 
                                : 'bg-slate-50/60 border-slate-200 text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Lahir <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      <input 
                        required 
                        type="date" 
                        className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all ${
                          validationErrors.birthDate ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200/80 focus:border-indigo-500'
                        }`}
                        value={formData.birthDate} 
                        onChange={e => {
                          setFormData({...formData, birthDate: e.target.value});
                          if (validationErrors.birthDate) setValidationErrors({...validationErrors, birthDate: ''});
                        }} 
                      />
                    </div>
                    {validationErrors.birthDate && (
                      <p className="text-[9px] font-bold text-rose-500 uppercase ml-1">{validationErrors.birthDate}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Agama <span className="text-rose-500">*</span></label>
                    <select 
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                      value={formData.religion} 
                      onChange={e => setFormData({...formData, religion: e.target.value})}
                    >
                      <option value="Islam">Islam</option>
                      <option value="Kristen">Kristen</option>
                      <option value="Katolik">Katolik</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Budha">Budha</option>
                      <option value="Konghucu">Konghucu</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pendidikan Terakhir <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        required 
                        type="text" 
                        placeholder="Contoh: SMA, S1, dsb." 
                        className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400 outline-none transition-all ${
                          validationErrors.education ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200/80 focus:border-indigo-500'
                        }`}
                        value={formData.education} 
                        onChange={e => {
                          setFormData({...formData, education: e.target.value});
                          if (validationErrors.education) setValidationErrors({...validationErrors, education: ''});
                        }} 
                      />
                    </div>
                    {validationErrors.education && (
                      <p className="text-[9px] font-bold text-rose-500 uppercase ml-1">{validationErrors.education}</p>
                    )}
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori / Sektor Pekerjaan <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        required 
                        type="text" 
                        placeholder="Contoh: Karyawan Swasta, Wiraswasta, Ibu Rumah Tangga" 
                        className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400 outline-none transition-all ${
                          validationErrors.jobCategory ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200/80 focus:border-indigo-500'
                        }`}
                        value={formData.jobCategory} 
                        onChange={e => {
                          setFormData({...formData, jobCategory: e.target.value});
                          if (validationErrors.jobCategory) setValidationErrors({...validationErrors, jobCategory: ''});
                        }} 
                      />
                    </div>
                    {validationErrors.jobCategory && (
                      <p className="text-[9px] font-bold text-rose-500 uppercase ml-1">{validationErrors.jobCategory}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: ANGGOTA KELUARGA & DEMOGRAFI */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Visual Demographics Counter */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100">
                      <Heart size={15} />
                    </div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Detail Demografi dalam Keluarga</h3>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mb-4 uppercase tracking-wide leading-relaxed">
                    Tentukan jumlah masing-masing kriteria di dalam rumah (isi 0 jika tidak ada) untuk pemantauan program pelayanan sosial & kesehatan warga.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Sayang Ibu Hamil', field: 'pregnantCount', icon: Heart, color: 'text-rose-500 bg-rose-50' },
                      { label: 'Bayi (0-1 Th)', field: 'babyCount', icon: Baby, color: 'text-sky-500 bg-sky-50' },
                      { label: 'Balita (1-5 Th)', field: 'toddlerCount', icon: Smile, color: 'text-emerald-500 bg-emerald-50' },
                      { label: 'Lansia (>60 Th)', field: 'elderlyCount', icon: Accessibility, color: 'text-amber-500 bg-amber-50' },
                    ].map((item) => (
                      <div key={item.field} className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col items-center text-center">
                        <div className={`p-2 rounded-xl mb-1.5 ${item.color}`}>
                          <item.icon size={14} />
                        </div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{item.label}</label>
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => decrementValue(item.field as any)}
                            className="w-6 h-6 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-xs select-none transition-all active:scale-90 shadow-sm"
                          >
                            -
                          </button>
                          <span className="font-extrabold text-slate-800 text-xs text-center w-6">{(formData as any)[item.field]}</span>
                          <button
                            type="button"
                            onClick={() => incrementValue(item.field as any)}
                            className="w-6 h-6 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-xs select-none transition-all active:scale-90 shadow-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Family Members list */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                        <Users size={15} />
                      </div>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Detail Anggota Keluarga</h3>
                    </div>
                    <button 
                      type="button" 
                      onClick={addFamilyMember} 
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all active:scale-95"
                    >
                      <Plus size={12} /> Tambah
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.familyMembers.map((member, idx) => (
                      <div key={member.id || idx} className="p-5 bg-slate-50 border border-slate-200 rounded-3xl relative">
                        <button 
                          type="button" 
                          onClick={() => removeFamilyMember(idx)} 
                          className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-white rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                        
                        <div className="text-[10px] uppercase tracking-widest font-black text-indigo-500 mb-3 ml-0.5">Anggota #{idx + 1}</div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Anggota <span className="text-rose-500">*</span></label>
                            <input 
                              required 
                              type="text" 
                              placeholder="Contoh: Susi Lestari"
                              className={`w-full px-3.5 py-2 hover:bg-white focus:bg-white bg-slate-100/40 border rounded-xl text-xs font-bold outline-none ${
                                validationErrors[`member_${idx}_name`] ? 'border-rose-400' : 'border-slate-200 focus:border-indigo-500'
                              }`} 
                              value={member.name} 
                              onChange={e => {
                                updateFamilyMember(idx, 'name', e.target.value);
                                if (validationErrors[`member_${idx}_name`]) {
                                  setValidationErrors({...validationErrors, [`member_${idx}_name`]: ''});
                                }
                              }} 
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Kelamin <span className="text-rose-500">*</span></label>
                            <select 
                              className="w-full px-3 py-2 bg-slate-100/40 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" 
                              value={member.gender} 
                              onChange={e => updateFamilyMember(idx, 'gender', e.target.value)}
                            >
                              <option value="Laki-laki">Laki-laki</option>
                              <option value="Perempuan">Perempuan</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Hubungan Keluarga <span className="text-rose-500">*</span></label>
                            <select 
                              className="w-full px-3 py-2 bg-slate-100/40 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" 
                              value={member.relation} 
                              onChange={e => updateFamilyMember(idx, 'relation', e.target.value)}
                            >
                              <option value="Istri">Istri</option>
                              <option value="Anak">Anak</option>
                              <option value="Orang Tua">Orang Tua</option>
                              <option value="Famili Lain">Famili Lain</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Pekerjaan / Sektor <span className="text-rose-500">*</span></label>
                            <input 
                              required 
                              type="text" 
                              placeholder="Contoh: Pelajar, Swasta"
                              className={`w-full px-3.5 py-2 hover:bg-white focus:bg-white bg-slate-100/40 border rounded-xl text-xs font-bold outline-none ${
                                validationErrors[`member_${idx}_job`] ? 'border-rose-400' : 'border-slate-200 focus:border-indigo-500'
                              }`} 
                              value={member.job || ''} 
                              onChange={e => {
                                updateFamilyMember(idx, 'job', e.target.value);
                                if (validationErrors[`member_${idx}_job`]) {
                                  setValidationErrors({...validationErrors, [`member_${idx}_job`]: ''});
                                }
                              }} 
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Lahir (Opsional)</label>
                            <input 
                              type="date" 
                              className="w-full px-3 py-2 bg-slate-100/40 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" 
                              value={member.birthDate || ''} 
                              onChange={e => updateFamilyMember(idx, 'birthDate', e.target.value)} 
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">NIK (Opsional)</label>
                            <input 
                              type="text" 
                              maxLength={16}
                              placeholder="16 Digit NIK"
                              className="w-full px-3.5 py-2 bg-slate-100/40 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" 
                              value={member.nik || ''} 
                              onChange={e => updateFamilyMember(idx, 'nik', e.target.value)} 
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {formData.familyMembers.length === 0 && (
                      <div className="py-8 bg-slate-50 border border-dashed border-slate-200 rounded-[2rem] text-center">
                        <Users className="mx-auto text-slate-300 mb-2" size={32} />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hanya Tinggal Sendiri</p>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-[280px] mx-auto leading-relaxed">Klik "Tambah" di kanan atas jika ada anggota keluarga lain (istri, anak, dll) yang tinggal satu rumah.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: BERKAS & LAMPIRAN */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100">
                    <FileText size={15} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Unggah Berkas Kependudukan</h3>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/50 border border-indigo-100/60 rounded-3xl flex items-start gap-3">
                  <Info className="text-indigo-600 shrink-0 mt-0.5" size={16} />
                  <p className="text-[10px] text-indigo-700 font-bold leading-relaxed uppercase tracking-wider">
                    Pastikan informasi/detail berfoto pada berkas terlihat jelas dan utuh sebelum dikirimkan.
                  </p>
                </div>

                <div className="flex gap-1.5 p-1 bg-slate-100 border border-slate-200/50 rounded-2xl mb-4">
                  <button 
                    type="button" 
                    onClick={() => setUploadType('file')} 
                    className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${uploadType === 'file' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Upload Foto / Scan
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setUploadType('url')} 
                    className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${uploadType === 'url' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                  >
                    Gunakan Link URL
                  </button>
                </div>

                {uploadType === 'file' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">KTP Kepala Keluarga / Penghuni</label>
                      <div className={`
                        relative h-44 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden p-6 text-center
                        ${ktpFile ? 'border-indigo-500 bg-indigo-50/40 text-indigo-600' : 'border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-slate-50/50'}
                      `}>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          onChange={e => setKtpFile(e.target.files?.[0] || null)}
                        />
                        {ktpFile ? (
                          <div className="text-center">
                            <CheckCircle className="mx-auto mb-1 text-indigo-600" size={24} />
                            <p className="text-[11px] font-extrabold truncate max-w-[180px]">{ktpFile.name}</p>
                            <p className="text-[8px] text-indigo-400 font-bold tracking-wider uppercase mt-1">Klik untuk Ganti</p>
                          </div>
                        ) : (
                          <>
                            <Camera className="text-slate-300" size={28} />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Unggah Foto KTP</p>
                            <p className="text-[8px] text-slate-400 font-bold leading-normal">Maksimal resolusi normal</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kartu Keluarga (KK)</label>
                      <div className={`
                        relative h-44 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden p-6 text-center
                        ${kkFile ? 'border-emerald-500 bg-emerald-50/40 text-emerald-600' : 'border-slate-200 bg-slate-50 hover:border-emerald-400 hover:bg-slate-50/50'}
                      `}>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          onChange={e => setKkFile(e.target.files?.[0] || null)}
                        />
                        {kkFile ? (
                          <div className="text-center">
                            <CheckCircle className="mx-auto mb-1 text-emerald-600" size={24} />
                            <p className="text-[11px] font-extrabold truncate max-w-[180px]">{kkFile.name}</p>
                            <p className="text-[8px] text-emerald-400 font-bold tracking-wider uppercase mt-1">Klik untuk Ganti</p>
                          </div>
                        ) : (
                          <>
                            <Camera className="text-slate-300" size={28} />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Unggah Foto KK</p>
                            <p className="text-[8px] text-slate-400 font-bold leading-normal">Gambar jelas terpotong rapi</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Link URL Foto KTP</label>
                      <input 
                        type="url" 
                        placeholder="https://..." 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400" 
                        value={ktpUrlInput} 
                        onChange={e => setKtpUrlInput(e.target.value)} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Link URL Foto KK</label>
                      <input 
                        type="url" 
                        placeholder="https://..." 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400" 
                        value={kkUrlInput} 
                        onChange={e => setKkUrlInput(e.target.value)} 
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Action buttons footer */}
        <div className="pt-6 border-t border-slate-100 flex gap-3">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading}
              className="flex-1 sm:flex-initial px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 text-center flex items-center justify-center border border-slate-200/40"
            >
              Kembali
            </button>
          )}
          
          {!isLastStep ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:shadow-[0_10px_20px_-5px_rgba(79,70,229,0.3)] active:scale-95 text-center flex items-center justify-center gap-1.5"
            >
              Selanjutnya
            </button>
          ) : (
            <Button
              type="submit"
              isLoading={isLoading}
              className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest"
            >
              <Send size={14} /> Kirim Pendaftaran
            </Button>
          )}
        </div>
        
        {isLastStep && (
          <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-wider leading-relaxed mt-4 max-w-[420px] mx-auto">
            * Dengan mengirim data di atas, Anda menyatakan bahwa seluruh berkas informasi kependudukan yang diunggah adalah sah dan benar.
          </p>
        )}
      </form>
    </div>
  );
};
