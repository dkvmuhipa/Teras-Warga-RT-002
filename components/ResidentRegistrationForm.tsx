import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Home, Phone, Users, Send, CheckCircle, ArrowLeft, Plus, Trash2, 
  GraduationCap, Briefcase, Car, Bike, Baby, Heart, Accessibility, Smile, 
  FileText, Camera, ShieldCheck, MapPin, Calendar, Check, AlertCircle, Info,
  ShieldAlert, Search, Sparkles, Building, Lock, CheckSquare, Eye, ExternalLink,
  Shield, CheckCheck, HelpCircle, X, Clock
} from 'lucide-react';
import { Button } from './ui/Button';
import { 
  addResidentRegistrationToDb, uploadImageToStorage, checkHouseOccupied, 
  formatHouseId, handleFirestoreError, OperationType, isFirebaseConfigured,
  subscribeToCollection, isHouseTrulyOccupied, checkNikDuplicate 
} from '../services/databaseService';
import { House } from '../types';
import { toast } from 'sonner';

interface ResidentRegistrationFormProps {
  onClose: () => void;
  houses?: House[];
}

const STEPS = [
  { label: 'Domisili', desc: 'Lokasi & Kontak' },
  { label: 'Profil Utama', desc: 'Personal & NIK' },
  { label: 'Keluarga', desc: 'Anggota & Sosial' },
  { label: 'Berkas', desc: 'Lampiran & Konfirmasi' }
];

const DEFAULT_BLOCKS = [
  { code: 'C5', start: 1, end: 26 },
  { code: 'C7', start: 1, end: 18 },
  { code: 'C8', start: 1, end: 18 },
  { code: 'C9', start: 1, end: 18 },
  { code: 'C10', start: 1, end: 16 },
  { code: 'C11', start: 1, end: 18 },
  { code: 'C12', start: 1, end: 15 },
];

export const ResidentRegistrationForm: React.FC<ResidentRegistrationFormProps> = ({ onClose, houses = [] }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedHouses, setLoadedHouses] = useState<House[]>(houses);

  // Subscribe to houses if prop is empty
  useEffect(() => {
    if (!houses || houses.length === 0) {
      const unsub = subscribeToCollection('houses', (data) => setLoadedHouses(data as House[]));
      return () => unsub();
    } else {
      setLoadedHouses(houses);
    }
  }, [houses]);

  // Block & Unit Availability Selector States
  const [selectedBlock, setSelectedBlock] = useState<string>('C10');
  const [inputMode, setInputMode] = useState<'picker' | 'manual'>('picker');
  const [unitFilter, setUnitFilter] = useState<'available' | 'occupied' | 'all'>('available');
  const [unitSearch, setUnitSearch] = useState<string>('');

  // Upload and preview states
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [kkFile, setKkFile] = useState<File | null>(null);
  const [ktpPreviewUrl, setKtpPreviewUrl] = useState<string>('');
  const [kkPreviewUrl, setKkPreviewUrl] = useState<string>('');
  const [ktpUrlInput, setKtpUrlInput] = useState('');
  const [kkUrlInput, setKkUrlInput] = useState('');
  const [uploadType, setUploadType] = useState<'file' | 'url'>('file');

  // Comprehensive Resident Registration Form Data
  const [formData, setFormData] = useState({
    // Step 0: Domisili & Hunian
    block: 'C10',
    number: '',
    phone: '',
    status: 'Occupied' as 'Occupied' | 'Business' | 'Visiting',
    residenceType: 'Tetap' as 'Tetap' | 'Sewa' | 'Rumah Keluarga',
    occupants: 1,
    vehicleCount: 0,
    twoWheelCount: 0,
    fourWheelCount: 0,

    // Step 1: Profil Kepala Keluarga / Pemohon
    headOfFamily: '',
    nik: '',
    kkNumber: '',
    birthPlace: 'Palu',
    birthDate: '',
    gender: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    religion: 'Islam',
    bloodType: '-' as 'A' | 'B' | 'AB' | 'O' | '-',
    maritalStatus: 'Kawin' as 'Kawin' | 'Belum Kawin' | 'Cerai Hidup' | 'Cerai Mati',
    education: 'SMA/SMK',
    jobCategory: 'Wiraswasta',
    bpjsStatus: 'PPU' as 'PPU' | 'PBPU' | 'PBI' | 'Tidak Ada',
    ownerName: '',

    // Step 2: Demografi, Sosial & Anggota Keluarga
    pregnantCount: 0,
    babyCount: 0,
    toddlerCount: 0,
    teenagerCount: 0,
    adultCount: 0,
    elderlyCount: 0,
    widowCount: 0,
    isPKH: false,
    isBLT: false,
    isBPNT: false,
    isBansosLain: false,
    bansosLainName: '',
    isDisability: false,
    isOrphan: false,
    familyMembers: [] as { 
      id?: string; 
      name: string; 
      nik?: string; 
      gender: 'Laki-laki' | 'Perempuan'; 
      relation: string; 
      birthDate?: string; 
      job?: string;
      bpjsStatus?: string;
    }[],

    // Step 3: Komitmen
    agreementAccepted: true
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Handle local file previews
  useEffect(() => {
    if (ktpFile) {
      const url = URL.createObjectURL(ktpFile);
      setKtpPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setKtpPreviewUrl('');
    }
  }, [ktpFile]);

  useEffect(() => {
    if (kkFile) {
      const url = URL.createObjectURL(kkFile);
      setKkPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setKkPreviewUrl('');
    }
  }, [kkFile]);

  // Derived unique blocks list
  const availableBlocks = useMemo(() => {
    const fromHouses = Array.from(
      new Set(loadedHouses.map(h => (h.block || '').trim().toUpperCase()).filter(Boolean))
    );
    const defaultCodes = DEFAULT_BLOCKS.map(b => b.code);
    const merged = Array.from(new Set([...defaultCodes, ...fromHouses])).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
    return merged;
  }, [loadedHouses]);

  // Calculate units and their live status for currently selected block
  const blockUnits = useMemo(() => {
    if (!selectedBlock) return [];
    const cfg = DEFAULT_BLOCKS.find(b => b.code.toUpperCase() === selectedBlock.toUpperCase());
    const startNum = cfg ? cfg.start : 1;
    const endNum = cfg ? cfg.end : 20;

    const housesInBlock = loadedHouses.filter(
      h => (h.block || '').trim().toUpperCase() === selectedBlock.toUpperCase()
    );

    const unitNumbers = new Set<string>();
    for (let i = startNum; i <= endNum; i++) {
      unitNumbers.add(i < 10 ? `0${i}` : `${i}`);
    }
    housesInBlock.forEach(h => {
      if (h.number) {
        unitNumbers.add(h.number.trim().padStart(2, '0'));
      }
    });

    const sorted = Array.from(unitNumbers).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    return sorted.map(numStr => {
      const existing = housesInBlock.find(h => {
        const hNum = (h.number || '').trim().padStart(2, '0');
        return hNum === numStr || (h.number || '').trim() === numStr || parseInt(h.number || '0', 10) === parseInt(numStr, 10);
      });

      const isOccupied = isHouseTrulyOccupied(existing);
      const isVisiting = existing?.status === 'Visiting';

      return {
        number: numStr,
        isOccupied,
        isVisiting,
        headOfFamily: existing?.headOfFamily && existing.headOfFamily !== '-' ? existing.headOfFamily : (existing?.ownerName || ''),
        status: existing?.status || 'Empty'
      };
    });
  }, [selectedBlock, loadedHouses]);

  // Calculate availability stats for a block
  const getBlockStats = (blockCode: string) => {
    const cfg = DEFAULT_BLOCKS.find(b => b.code.toUpperCase() === blockCode.toUpperCase());
    const startNum = cfg ? cfg.start : 1;
    const endNum = cfg ? cfg.end : 20;
    const housesInBlock = loadedHouses.filter(
      h => (h.block || '').trim().toUpperCase() === blockCode.toUpperCase()
    );

    const unitNumbers = new Set<string>();
    for (let i = startNum; i <= endNum; i++) unitNumbers.add(i < 10 ? `0${i}` : `${i}`);
    housesInBlock.forEach(h => { if (h.number) unitNumbers.add(h.number.trim().padStart(2, '0')); });

    let occupied = 0;
    unitNumbers.forEach(num => {
      const existing = housesInBlock.find(
        h => (h.number || '').trim().padStart(2, '0') === num || (h.number || '').trim() === num
      );
      if (isHouseTrulyOccupied(existing)) {
        occupied++;
      }
    });

    const total = unitNumbers.size;
    const available = Math.max(0, total - occupied);
    return { total, occupied, available };
  };

  // Filtered units list for display
  const displayedUnits = useMemo(() => {
    return blockUnits.filter(u => {
      if (unitFilter === 'available' && u.isOccupied) return false;
      if (unitFilter === 'occupied' && !u.isOccupied) return false;
      if (unitSearch.trim() && !u.number.includes(unitSearch.trim())) return false;
      return true;
    });
  }, [blockUnits, unitFilter, unitSearch]);

  const handleSelectUnit = (unitNumber: string, isOccupied: boolean, isVisiting?: boolean, headOfFamily?: string) => {
    if (isOccupied) {
      if (isVisiting) {
        toast.warning(`Unit Blok ${selectedBlock} No. ${unitNumber} Memiliki Pemilik (Rumah Singgah)`, {
          description: `Unit ini telah terdaftar atas nama Bpk/Ibu ${headOfFamily || 'Warga'} dengan status Rutin Dikunjungi. Jika Anda pemilik yang ingin mendaftar ulang atau mutasi, silakan hubungi pengurus RT.`
        });
        return;
      }
      toast.warning(`Unit Blok ${selectedBlock} No. ${unitNumber} Sudah Berpenghuni`, {
        description: `Unit ini telah terdaftar atas nama Keluarga Bpk/Ibu ${headOfFamily || 'Warga'}. Jika Anda mutasi atau anggota keluarga baru, silakan gunakan menu Mutasi atau hubungi pengurus RT.`
      });
      return;
    }

    const matched = loadedHouses.find(h => 
      (h.block || '').trim().toUpperCase() === selectedBlock.toUpperCase() &&
      ((h.number || '').trim().padStart(2, '0') === unitNumber.padStart(2, '0') ||
       (h.number || '').trim() === unitNumber ||
       parseInt(h.number || '0', 10) === parseInt(unitNumber, 10))
    );

    const detectedOwner = (matched?.ownerName && matched.ownerName !== '-') ? matched.ownerName : '';

    setFormData(prev => ({
      ...prev,
      block: selectedBlock,
      number: unitNumber,
      ownerName: (prev.residenceType !== 'Tetap' && detectedOwner) ? detectedOwner : prev.ownerName
    }));

    if (validationErrors.block || validationErrors.number) {
      setValidationErrors(prev => ({ ...prev, block: '', number: '' }));
    }

    toast.success(`Unit Dipilih: Blok ${selectedBlock} No. ${unitNumber}`, {
      description: detectedOwner 
        ? `Unit tersedia. Terdata pemilik asli: Bpk/Ibu ${detectedOwner}.`
        : 'Unit tersedia dan siap didaftarkan sebagai hunian baru.'
    });
  };

  // Auto-detect existing house in database RT 002 for current block and unit
  const matchedHouse = useMemo(() => {
    if (!formData.block || !formData.number) return null;
    const numClean = formData.number.trim().padStart(2, '0');
    return loadedHouses.find(h => 
      (h.block || '').trim().toUpperCase() === formData.block.trim().toUpperCase() &&
      ((h.number || '').trim().padStart(2, '0') === numClean ||
       (h.number || '').trim() === formData.number.trim() ||
       parseInt(h.number || '0', 10) === parseInt(formData.number.trim(), 10))
    );
  }, [formData.block, formData.number, loadedHouses]);

  // Pre-fill ownerName when residenceType is Sewa or Rumah Keluarga if existing owner is detected
  useEffect(() => {
    if (matchedHouse?.ownerName && matchedHouse.ownerName !== '-' && (formData.residenceType === 'Sewa' || formData.residenceType === 'Rumah Keluarga')) {
      if (!formData.ownerName) {
        setFormData(prev => ({ ...prev, ownerName: matchedHouse.ownerName || '' }));
      }
    }
  }, [matchedHouse, formData.residenceType]);

  const addFamilyMember = () => {
    setFormData(prev => {
      const updatedMembers = [
        ...prev.familyMembers,
        {
          id: Math.random().toString(36).substr(2, 9),
          name: '',
          nik: '',
          gender: 'Laki-laki',
          relation: 'Istri',
          birthDate: '',
          job: 'Ibu Rumah Tangga',
          bpjsStatus: 'PPU'
        }
      ];
      return {
        ...prev,
        familyMembers: updatedMembers,
        occupants: 1 + updatedMembers.length
      };
    });
  };

  const removeFamilyMember = (index: number) => {
    const newList = [...formData.familyMembers];
    newList.splice(index, 1);
    setFormData({ 
      ...formData, 
      familyMembers: newList,
      occupants: 1 + newList.length 
    });
  };

  const updateFamilyMember = (index: number, field: string, value: string) => {
    const newList = [...formData.familyMembers];
    newList[index] = { ...newList[index], [field]: value };
    setFormData({ ...formData, familyMembers: newList });
  };

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!formData.block.trim()) errors.block = 'Pilih atau masukkan blok rumah';
      if (!formData.number.trim()) errors.number = 'Pilih atau masukkan nomor unit';
      if (!formData.phone.trim()) {
        errors.phone = 'Nomor WhatsApp wajib diisi';
      } else if (!/^[0-9\s+-]{8,15}$/.test(formData.phone.trim())) {
        errors.phone = 'Nomor WhatsApp tidak valid (contoh: 08123456789)';
      }
    } else if (currentStep === 1) {
      if (!formData.headOfFamily.trim()) errors.headOfFamily = 'Nama lengkap kepala keluarga wajib diisi';
      if (!formData.nik.trim()) {
        errors.nik = 'NIK wajib diisi';
      } else if (!/^\d{16}$/.test(formData.nik.trim())) {
        errors.nik = 'NIK harus tepat 16 digit angka';
      } else {
        // Validasi anti-duplikasi NIK Kepala Keluarga
        const dupCheck = checkNikDuplicate(formData.nik, undefined, loadedHouses);
        if (dupCheck.isDuplicate) {
          errors.nik = `NIK ini sudah terdaftar atas nama ${dupCheck.residentName} (${dupCheck.role}) di Unit ${dupCheck.houseId}`;
        }
      }
      if (!formData.birthDate) errors.birthDate = 'Tanggal lahir wajib diisi';
      if (!formData.education.trim()) errors.education = 'Pendidikan terakhir wajib diisi';
      if (!formData.jobCategory.trim()) errors.jobCategory = 'Pekerjaan wajib diisi';
    } else if (currentStep === 2) {
      const cleanHeadNik = formData.nik.trim().replace(/\D/g, '');
      const seenMemberNiks = new Set<string>();

      formData.familyMembers.forEach((member, idx) => {
        if (!member.name.trim()) {
          errors[`member_${idx}_name`] = 'Nama anggota wajib diisi';
        }

        const cleanMemberNik = (member.nik || '').trim().replace(/\D/g, '');
        if (cleanMemberNik) {
          if (cleanMemberNik.length !== 16) {
            errors[`member_${idx}_nik`] = 'NIK anggota harus 16 digit angka';
          } else if (cleanHeadNik && cleanMemberNik === cleanHeadNik) {
            errors[`member_${idx}_nik`] = 'NIK tidak boleh sama dengan NIK Kepala Keluarga';
          } else if (seenMemberNiks.has(cleanMemberNik)) {
            errors[`member_${idx}_nik`] = 'NIK kembar dengan anggota keluarga lain di formulir ini';
          } else {
            seenMemberNiks.add(cleanMemberNik);
            const dupCheck = checkNikDuplicate(cleanMemberNik, undefined, loadedHouses);
            if (dupCheck.isDuplicate) {
              errors[`member_${idx}_nik`] = `NIK ini sudah terdaftar atas nama ${dupCheck.residentName} di Unit ${dupCheck.houseId}`;
            }
          }
        }
      });
    } else if (currentStep === 3) {
      if (!formData.agreementAccepted) {
        errors.agreement = 'Anda wajib menyetujui pernyataan data kependudukan.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep === 0) {
        const formattedBlock = formData.block.trim().toUpperCase();
        const formattedNum = formData.number.trim().padStart(2, '0');
        const existing = loadedHouses.find(h => {
          const hBlock = (h.block || '').trim().toUpperCase();
          const hNum = (h.number || '').trim().padStart(2, '0');
          return hBlock === formattedBlock && (hNum === formattedNum || (h.number || '').trim() === formData.number.trim());
        });

        if (isHouseTrulyOccupied(existing)) {
          toast.warning(`Unit Blok ${formData.block} No. ${formData.number} Sudah Berpenghuni`, {
            description: `Unit ini telah terdaftar atas nama Keluarga Bpk/Ibu ${existing?.headOfFamily && existing.headOfFamily !== '-' ? existing.headOfFamily : 'Warga'}. Harap pilih unit yang belum berpenghuni atau kosong.`,
            position: 'top-center'
          });
          return;
        }
      }

      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error('Mohon Lengkapi Data Wajib', {
        description: 'Silakan periksa kolom yang ditandai merah sebelum melanjutkan.',
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
          description: `Blok ${formData.block} No. ${formData.number} sudah berpenghuni. Jika ingin menambahkan anggota keluarga baru, silakan gunakan menu Mutasi atau hubungi pengurus RT.`,
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
          try {
            ktpUrl = await uploadImageToStorage(ktpFile, `registrations/ktp_${Date.now()}_${ktpFile.name}`);
          } catch (err: any) {
            toast.error("Gagal Memproses Foto KTP", {
              description: "Foto KTP gagal diproses. Pastikan format file JPG, PNG, atau WEBP dan coba lagi."
            });
            setIsLoading(false);
            return;
          }
        }
        if (kkFile) {
          try {
            kkUrl = await uploadImageToStorage(kkFile, `registrations/kk_${Date.now()}_${kkFile.name}`);
          } catch (err: any) {
            toast.error("Gagal Memproses Foto KK", {
              description: "Foto KK gagal diproses. Pastikan format file JPG, PNG, atau WEBP dan coba lagi."
            });
            setIsLoading(false);
            return;
          }
        }
      }

      await addResidentRegistrationToDb({
        ...formData,
        ktpUrl,
        kkUrl,
        date: new Date().toISOString(),
        approvalStatus: 'Pending',
        officialTerritory: 'RT 002 / RW 020 Kelurahan Tondo, Kecamatan Mantikulore, Kota Palu'
      });

      setIsSubmitted(true);
      toast.success("Pendaftaran Berhasil Dikirim!", {
        description: `Data pendaftaran Blok ${formData.block} No. ${formData.number} telah masuk ke antrean verifikasi pengurus RT.`
      });
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

  const updateVehicleCount = (type: 'twoWheel' | 'fourWheel', delta: number) => {
    setFormData(prev => {
      const current2W = prev.twoWheelCount || 0;
      const current4W = prev.fourWheelCount || 0;
      const new2W = type === 'twoWheel' ? Math.max(0, current2W + delta) : current2W;
      const new4W = type === 'fourWheel' ? Math.max(0, current4W + delta) : current4W;

      return {
        ...prev,
        twoWheelCount: new2W,
        fourWheelCount: new4W,
        vehicleCount: new2W + new4W
      };
    });
  };

  const isLastStep = currentStep === STEPS.length - 1;

  if (isSubmitted) {
    return (
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl text-center max-w-lg mx-auto border border-slate-100">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={44} className="stroke-[2.5]" />
        </div>
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">
          Status: Menunggu Verifikasi RT
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-3">Pendaftaran Dikirim!</h2>
        <p className="text-slate-500 text-xs md:text-sm leading-relaxed mt-3 mb-6">
          Terima kasih. Berkas pendaftaran warga baru untuk <strong>Blok {formData.block} No. {formData.number}</strong> telah sukses tersimpan di sistem pengurus <strong>RT 002 / RW 020 Kelurahan Tondo</strong>. Pengurus RT akan memverifikasi berkas dan menghubungi nomor WhatsApp Anda (<strong>{formData.phone}</strong>).
        </p>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 mb-8 text-left text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400 font-bold">Kepala Keluarga:</span>
            <span className="font-black text-slate-800">{formData.headOfFamily}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-bold">Unit Hunian:</span>
            <span className="font-black text-emerald-700">Blok {formData.block} No. {formData.number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-bold">Status Hunian:</span>
            <span className="font-black text-slate-800">
              {formData.residenceType === 'Sewa' 
                ? `Sewa / Kontrak (Pemilik: ${formData.ownerName || 'Tercatat di RT'})` 
                : formData.residenceType === 'Rumah Keluarga' 
                  ? `Rumah Kerabat (Pemilik: ${formData.ownerName || 'Keluarga'})` 
                  : 'Milik Sendiri'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-bold">Total Penghuni:</span>
            <span className="font-black text-slate-800">{formData.occupants} Jiwa</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-bold">Inventaris Kendaraan:</span>
            <span className="font-black text-indigo-700">
              {(formData.twoWheelCount || 0) + (formData.fourWheelCount || 0) > 0 
                ? `${formData.twoWheelCount || 0} Motor • ${formData.fourWheelCount || 0} Mobil` 
                : 'Tidak Ada Kendaraan'}
            </span>
          </div>
        </div>
        <Button onClick={onClose} variant="primary" className="w-full py-4 text-xs font-black tracking-widest uppercase shadow-md">
          Selesai &amp; Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl max-w-4xl mx-auto border border-slate-100 relative">
      {/* Header Wilayah Resmi */}
      <div className="flex items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <button 
            type="button"
            onClick={onClose} 
            className="p-3 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all active:scale-95 text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Portal Warga Baru</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Pendaftaran Warga Baru</h2>
            <p className="text-[10px] md:text-[11px] font-bold text-slate-500 mt-0.5">
              RT 002 / RW 020 &bull; Kelurahan Tondo, Kecamatan Mantikulore, Kota Palu
            </p>
          </div>
        </div>

        <div className="hidden sm:flex flex-col items-end text-right">
          <span className="px-3 py-1 bg-indigo-50 border border-indigo-200/80 rounded-xl text-[10px] font-black text-indigo-700 uppercase tracking-wider">
            Terintegrasi Database
          </span>
          <span className="text-[9px] text-slate-400 font-bold mt-1">Huntap Tondo 2</span>
        </div>
      </div>

      {/* Multi-step Progressive Stepper Header */}
      <div className="mb-8 p-4 bg-slate-950 rounded-[2rem] text-white shadow-xl shadow-slate-950/15 border border-white/10">
        <div className="flex justify-between items-center px-3 mb-2.5">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
            Langkah {currentStep + 1} dari {STEPS.length}
          </span>
          <span className="text-xs font-black text-white">
            {STEPS[currentStep].label} &bull; <span className="text-slate-400 font-medium">{STEPS[currentStep].desc}</span>
          </span>
        </div>
        
        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden p-0.5">
          <motion.div 
            className="bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-400 h-full rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          />
        </div>

        <div className="grid grid-cols-4 gap-2 mt-3 text-center">
          {STEPS.map((step, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (idx < currentStep) setCurrentStep(idx);
              }}
              className={`text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-colors py-1 rounded-lg ${
                currentStep === idx 
                  ? 'text-white bg-white/15' 
                  : idx < currentStep 
                    ? 'text-emerald-400 hover:text-emerald-300' 
                    : 'text-slate-500'
              }`}
            >
              {idx + 1}. {step.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* ======================================================== */}
            {/* STEP 0: DOMISILI & SMART UNIT AVAILABILITY PICKER        */}
            {/* ======================================================== */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-200/70 shadow-2xs">
                      <Home size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Pilih Lokasi Hunian Rumah</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Pilih blok dan nomor rumah yang masih kosong/tersedia di RT 002 / RW 020</p>
                    </div>
                  </div>

                  {/* Mode Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setInputMode(inputMode === 'picker' ? 'manual' : 'picker')}
                    className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer bg-slate-50"
                  >
                    {inputMode === 'picker' ? '✏️ Beralih ke Input Manual' : '🎯 Beralih ke Pilihan Interaktif'}
                  </button>
                </div>

                {/* SMART UNIT AVAILABILITY PICKER */}
                {inputMode === 'picker' ? (
                  <div className="p-5 md:p-6 bg-slate-50/80 border border-slate-200/80 rounded-[2rem] space-y-5">
                    {/* 1. Pill Selector Blok */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                          <span>1. Pilih Blok Kawasan:</span>
                          <span className="text-indigo-600 font-black">Blok {selectedBlock}</span>
                        </label>
                        <span className="text-[10px] font-bold text-slate-400">Huntap Tondo 2</span>
                      </div>

                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {availableBlocks.map(blockCode => {
                          const stats = getBlockStats(blockCode);
                          const isSel = selectedBlock.toUpperCase() === blockCode.toUpperCase();
                          return (
                            <button
                              key={blockCode}
                              type="button"
                              onClick={() => {
                                setSelectedBlock(blockCode);
                                setFormData(prev => ({ ...prev, block: blockCode, number: '' }));
                              }}
                              className={`px-4 py-3 rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center shrink-0 border min-w-[90px] ${
                                isSel
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/20 scale-105'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                              }`}
                            >
                              <span className="text-xs font-black">Blok {blockCode}</span>
                              <span className={`text-[9px] font-black mt-0.5 px-2 py-0.5 rounded-full ${
                                isSel 
                                  ? 'bg-emerald-500 text-white' 
                                  : stats.available > 0 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                    : 'bg-slate-100 text-slate-400'
                              }`}>
                                {stats.available} Kosong
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Unit Selection & Filter */}
                    <div className="space-y-3 pt-2 border-t border-slate-200/60">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            2. Pilih Unit di Blok {selectedBlock}:
                          </label>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[9px] font-black uppercase">
                            {getBlockStats(selectedBlock).available} Unit Kosong
                          </span>
                        </div>

                        {/* Filter & Search Bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0">
                            <button
                              type="button"
                              onClick={() => setUnitFilter('available')}
                              className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
                                unitFilter === 'available' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              🟢 Kosong ({getBlockStats(selectedBlock).available})
                            </button>
                            <button
                              type="button"
                              onClick={() => setUnitFilter('occupied')}
                              className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
                                unitFilter === 'occupied' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              🔒 Terisi ({getBlockStats(selectedBlock).occupied})
                            </button>
                            <button
                              type="button"
                              onClick={() => setUnitFilter('all')}
                              className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
                                unitFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Semua ({getBlockStats(selectedBlock).total})
                            </button>
                          </div>

                          <div className="relative w-28">
                            <input
                              type="text"
                              value={unitSearch}
                              onChange={e => setUnitSearch(e.target.value)}
                              placeholder="Cari No..."
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                            />
                            {unitSearch && (
                              <button
                                type="button"
                                onClick={() => setUnitSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Units Grid */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-[260px] overflow-y-auto p-1.5 bg-white/70 rounded-2xl border border-slate-200/80">
                        {displayedUnits.map(unit => {
                          const isSelected = formData.block === selectedBlock && formData.number === unit.number;
                          return (
                            <button
                              key={unit.number}
                              type="button"
                              onClick={() => handleSelectUnit(unit.number, unit.isOccupied, unit.isVisiting, unit.headOfFamily)}
                              className={`p-3 rounded-xl text-center border transition-all cursor-pointer relative group flex flex-col justify-between min-h-[70px] ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-4 ring-emerald-500/20'
                                  : unit.isVisiting
                                    ? 'bg-sky-50/80 border-sky-300 text-sky-900 opacity-80 hover:opacity-95 hover:border-sky-400'
                                    : unit.isOccupied
                                      ? 'bg-slate-100/70 border-slate-200/60 opacity-60 hover:opacity-80'
                                      : 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-400 hover:scale-[1.02]'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className={`text-[8px] font-black uppercase ${
                                  isSelected ? 'text-emerald-100' :
                                  unit.isVisiting ? 'text-sky-700' :
                                  unit.isOccupied ? 'text-slate-400' : 'text-emerald-600'
                                }`}>
                                  {unit.isVisiting ? 'Singgah' : unit.isOccupied ? 'Terisi' : 'Kosong'}
                                </span>
                                {isSelected ? (
                                  <Check size={12} className="text-white stroke-[3]" />
                                ) : unit.isVisiting ? (
                                  <Clock size={10} className="text-sky-600" />
                                ) : unit.isOccupied ? (
                                  <Lock size={10} className="text-slate-400" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                )}
                              </div>

                              <span className={`text-base font-black ${
                                isSelected ? 'text-white' :
                                unit.isVisiting ? 'text-sky-950 font-black' :
                                unit.isOccupied ? 'text-slate-500 line-through' : 'text-slate-900'
                              }`}>
                                No. {unit.number}
                              </span>

                              <span className={`text-[8px] font-bold truncate max-w-full ${
                                isSelected ? 'text-emerald-100' :
                                unit.isVisiting ? 'text-sky-800 font-extrabold' :
                                unit.isOccupied ? 'text-slate-400' : 'text-emerald-700'
                              }`}>
                                {unit.isVisiting ? (unit.headOfFamily ? `Klg. ${unit.headOfFamily.split(' ')[0]}` : 'Rutin Dikunjungi') :
                                 unit.isOccupied ? (unit.headOfFamily ? `Klg. ${unit.headOfFamily.split(' ')[0]}` : 'Berpenghuni') : 'Siap Dihuni'}
                              </span>
                            </button>
                          );
                        })}

                        {displayedUnits.length === 0 && (
                          <div className="col-span-full py-8 text-center text-slate-400 text-xs font-bold">
                            Tidak ada unit yang sesuai dengan filter pencarian.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3. Live Selected Unit Confirmation Card */}
                    {formData.number ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-center justify-between flex-wrap gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-600/20">
                            <Home size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-emerald-900">Unit Hunian Terpilih:</span>
                              <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase">
                                Blok {formData.block} No. {formData.number}
                              </span>
                            </div>
                            <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                              Huntap Tondo 2 &bull; RT 002 / RW 020 Kelurahan Tondo, Palu
                            </p>
                          </div>
                        </div>

                        <span className="px-3 py-1 bg-white text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-200 shadow-2xs">
                          ✓ Siap Didaftarkan
                        </span>
                      </motion.div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-amber-800 font-medium">
                        <AlertCircle size={16} className="text-amber-600 shrink-0" />
                        <span>Silakan klik salah satu kotak unit hijau di atas untuk memilih nomor hunian Anda.</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Mode Input Manual */
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <p className="text-xs text-slate-500 font-medium">
                      Gunakan mode ini jika nomor unit rumah Anda tidak tercantum dalam daftar standar di atas.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Blok Rumah <span className="text-rose-500">*</span></label>
                        <input 
                          type="text" 
                          placeholder="Contoh: C10" 
                          className={`w-full px-4 py-3.5 bg-white border rounded-2xl text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500/10 ${
                            validationErrors.block ? 'border-rose-400' : 'border-slate-200 focus:border-indigo-500'
                          }`}
                          value={formData.block} 
                          onChange={e => setFormData({ ...formData, block: e.target.value.toUpperCase() })} 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor Unit <span className="text-rose-500">*</span></label>
                        <input 
                          type="text" 
                          placeholder="Contoh: 08" 
                          className={`w-full px-4 py-3.5 bg-white border rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 ${
                            validationErrors.number ? 'border-rose-400' : 'border-slate-200 focus:border-indigo-500'
                          }`}
                          value={formData.number} 
                          onChange={e => setFormData({ ...formData, number: e.target.value })} 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* WhatsApp & Kontak */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      required 
                      type="tel" 
                      placeholder="Contoh: 08123456789 atau 628123456789" 
                      className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all ${
                        validationErrors.phone ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200/80 focus:border-indigo-500'
                      }`}
                      value={formData.phone} 
                      onChange={e => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (validationErrors.phone) setValidationErrors({ ...validationErrors, phone: '' });
                      }} 
                    />
                  </div>
                  {validationErrors.phone && (
                    <p className="text-[9px] font-bold text-rose-500 uppercase ml-1">{validationErrors.phone}</p>
                  )}
                  <p className="text-[9px] text-slate-400 font-bold ml-1 uppercase tracking-wide">
                    Nomor WhatsApp yang akan dihubungi oleh pengurus RT untuk konfirmasi pendaftaran.
                  </p>
                </div>

                {/* Status Hunian Rumah */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Status Hunian Rumah <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'Occupied', label: 'Dihuni', desc: 'Menetap dan tinggal di rumah ini' },
                      { id: 'Business', label: 'Tempat Usaha', desc: 'Digunakan sebagai lokasi usaha/dagang' },
                      { id: 'Visiting', label: 'Mengunjungi / Singgah', desc: 'Sering berkunjung untuk merawat rumah' }
                    ].map((t) => {
                      const isSel = formData.status === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, status: t.id as any })}
                          className={`p-4 text-left border rounded-2xl transition-all cursor-pointer relative overflow-hidden group ${
                            isSel 
                              ? 'bg-emerald-50/70 border-emerald-500 shadow-sm ring-2 ring-emerald-500/10' 
                              : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/60'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1.5">
                            <span className={`text-xs font-black ${isSel ? 'text-emerald-700' : 'text-slate-700'}`}>{t.label}</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSel ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'}`}>
                              {isSel && <Check size={10} className="stroke-[3]" />}
                            </div>
                          </div>
                          <p className="text-[9px] font-semibold text-slate-400 leading-relaxed">{t.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Status Kepenghunian Rumah */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Status Kepenghunian Rumah <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'Tetap', label: 'Milik Sendiri', desc: 'Rumah pribadi / hak milik' },
                      { id: 'Sewa', label: 'Sewa / Kontrak', desc: 'Mengontrak atau menyewa hunian' },
                      { id: 'Rumah Keluarga', label: 'Rumah Keluarga', desc: 'Menempati rumah milik kerabat/orang tua' }
                    ].map((type) => {
                      const isSel = formData.residenceType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, residenceType: type.id as any })}
                          className={`p-4 text-left border rounded-2xl transition-all cursor-pointer relative overflow-hidden group ${
                            isSel 
                              ? 'bg-indigo-50/70 border-indigo-500 shadow-sm ring-2 ring-indigo-500/10' 
                              : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/60'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1.5">
                            <span className={`text-xs font-black ${isSel ? 'text-indigo-700' : 'text-slate-700'}`}>{type.label}</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSel ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                              {isSel && <Check size={10} className="stroke-[3]" />}
                            </div>
                          </div>
                          <p className="text-[9px] font-semibold text-slate-400 leading-relaxed">{type.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Info & Input Pemilik untuk Status Sewa / Rumah Keluarga */}
                {(formData.residenceType === 'Sewa' || formData.residenceType === 'Rumah Keluarga') && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <Sparkles size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed">
                        <strong className="text-indigo-950 block font-bold">Otomatis Terhubung ke Buku Kontrak Sewa RT</strong>
                        <span className="text-indigo-800/85">
                          Anda <strong>tidak perlu lagi mengisi formulir &quot;Lapor Sewa&quot;</strong> terpisah. Data sewa akan otomatis tersinkronisasi saat pendaftaran Anda disetujui pengurus RT.
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-indigo-100">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-indigo-950 uppercase tracking-widest block ml-1">
                          Nama Pemilik Rumah Asli {formData.residenceType === 'Sewa' ? '(Induk Semang)' : '(Kerabat)'}
                        </label>
                        {matchedHouse?.ownerName && matchedHouse.ownerName !== '-' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCheck size={12} /> Terdata di RT: {matchedHouse.ownerName}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder={matchedHouse?.ownerName && matchedHouse.ownerName !== '-' ? `Pemilik: ${matchedHouse.ownerName}` : "Contoh: Bapak Irfan / Ibu Hj. Aminah (Opsional)"}
                          value={formData.ownerName || ''}
                          onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                        />
                        {matchedHouse?.ownerName && matchedHouse.ownerName !== '-' && formData.ownerName !== matchedHouse.ownerName && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, ownerName: matchedHouse.ownerName || '' })}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[10px] font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Gunakan Data RT
                          </button>
                        )}
                      </div>
                      {matchedHouse?.ownerName && matchedHouse.ownerName !== '-' ? (
                        <p className="text-[10px] text-emerald-700 font-medium ml-1">
                          ✓ Nama pemilik asli terdeteksi otomatis dari database kavling RT 002. Anda dapat mengubahnya jika rumah sudah berpindah kepemilikan.
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-500 font-medium ml-1">
                          Mohon cantumkan nama pemilik asli rumah hunian ini untuk validasi dan kelengkapan administrasi RT.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Jumlah Anggota Keluarga */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Jumlah Anggota Keluarga yang Tinggal <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => decrementValue('occupants', 1)}
                      className="w-10 h-10 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center font-bold text-lg cursor-pointer active:scale-95"
                    >
                      -
                    </button>
                    <div className="text-center">
                      <span className="font-black text-slate-900 text-sm block">{formData.occupants} Jiwa</span>
                      <span className="text-[10px] text-slate-400 font-medium">Termasuk Kepala Keluarga</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => incrementValue('occupants')}
                      className="w-10 h-10 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center font-bold text-lg cursor-pointer active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Klasifikasi Kendaraan Warga (Motor & Mobil) */}
                <div className="space-y-2.5 p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                        <Car size={15} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Inventaris Kendaraan Penghuni
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Klasifikasi jenis kendaraan untuk ketertiban lahan parkir RT 002
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white border border-slate-200 text-slate-700 shadow-2xs">
                      Total: {(formData.twoWheelCount || 0) + (formData.fourWheelCount || 0)} Unit
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Sepeda Motor (Roda 2) */}
                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                            <Bike size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-900 block">Sepeda Motor</span>
                            <span className="text-[9px] text-slate-400 font-medium">Roda 2 (Matic/Sport/Listrik)</span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {formData.twoWheelCount || 0} Unit
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => updateVehicleCount('twoWheel', -1)}
                          className="flex-1 h-9 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg flex items-center justify-center font-black text-sm transition-all cursor-pointer active:scale-95"
                          title="Kurangi motor"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-black text-slate-800 text-sm">
                          {formData.twoWheelCount || 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateVehicleCount('twoWheel', 1)}
                          className="flex-1 h-9 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border border-amber-200 text-amber-800 rounded-lg flex items-center justify-center font-black text-sm transition-all cursor-pointer active:scale-95"
                          title="Tambah motor"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Mobil (Roda 4) */}
                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                            <Car size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-900 block">Mobil Pribadi</span>
                            <span className="text-[9px] text-slate-400 font-medium">Roda 4 (Sedan/SUV/Pickup)</span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {formData.fourWheelCount || 0} Unit
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => updateVehicleCount('fourWheel', -1)}
                          className="flex-1 h-9 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg flex items-center justify-center font-black text-sm transition-all cursor-pointer active:scale-95"
                          title="Kurangi mobil"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-black text-slate-800 text-sm">
                          {formData.fourWheelCount || 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateVehicleCount('fourWheel', 1)}
                          className="flex-1 h-9 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 text-blue-800 rounded-lg flex items-center justify-center font-black text-sm transition-all cursor-pointer active:scale-95"
                          title="Tambah mobil"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 1: PROFIL UTAMA KEPALA KELUARGA / PEMOHON           */}
            {/* ======================================================== */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-200/70 shadow-2xs">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Profil Kepala Keluarga / Pemohon</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Lengkapi identitas diri sesuai dokumen resmi KTP &amp; Kartu Keluarga</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Nama Lengkap */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Nama Lengkap Kepala Keluarga <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        required 
                        type="text" 
                        placeholder="Nama lengkap sesuai KTP" 
                        className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all ${
                          validationErrors.headOfFamily ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:border-indigo-500'
                        }`}
                        value={formData.headOfFamily} 
                        onChange={e => {
                          setFormData({ ...formData, headOfFamily: e.target.value });
                          if (validationErrors.headOfFamily) setValidationErrors({ ...validationErrors, headOfFamily: '' });
                        }} 
                      />
                    </div>
                    {validationErrors.headOfFamily && (
                      <p className="text-[9px] font-bold text-rose-500 uppercase ml-1">{validationErrors.headOfFamily}</p>
                    )}
                  </div>

                  {/* NIK */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        NIK (Nomor Induk Kependudukan) <span className="text-rose-500">*</span>
                      </label>
                      <span className={`text-[9px] font-mono font-bold ${formData.nik.length === 16 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {formData.nik.length}/16 Digit
                      </span>
                    </div>
                    <input 
                      required 
                      type="text" 
                      maxLength={16}
                      placeholder="16 Digit NIK KTP" 
                      className={`w-full px-4 py-3.5 bg-slate-50 border rounded-2xl text-sm font-mono font-bold tracking-wider outline-none focus:ring-2 focus:ring-indigo-500/10 ${
                        validationErrors.nik ? 'border-rose-400' : 'border-slate-200 focus:border-indigo-500'
                      }`}
                      value={formData.nik} 
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, nik: val });
                        if (validationErrors.nik) setValidationErrors({ ...validationErrors, nik: '' });
                      }} 
                    />
                    {validationErrors.nik && (
                      <p className="text-[9px] font-bold text-rose-500 uppercase ml-1">{validationErrors.nik}</p>
                    )}
                  </div>

                  {/* Nomor Kartu Keluarga */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Nomor Kartu Keluarga (KK)
                      </label>
                      <span className={`text-[9px] font-mono font-bold ${formData.kkNumber.length === 16 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {formData.kkNumber.length}/16 Digit
                      </span>
                    </div>
                    <input 
                      type="text" 
                      maxLength={16}
                      placeholder="16 Digit Nomor KK" 
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-bold tracking-wider outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                      value={formData.kkNumber} 
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, kkNumber: val });
                      }} 
                    />
                  </div>

                  {/* Tempat Lahir & Tanggal Lahir */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Tempat Lahir
                    </label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Palu" 
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                      value={formData.birthPlace} 
                      onChange={e => setFormData({ ...formData, birthPlace: e.target.value })} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Tanggal Lahir <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      <input 
                        required 
                        type="date" 
                        className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none ${
                          validationErrors.birthDate ? 'border-rose-400' : 'border-slate-200 focus:border-indigo-500'
                        }`}
                        value={formData.birthDate} 
                        onChange={e => {
                          setFormData({ ...formData, birthDate: e.target.value });
                          if (validationErrors.birthDate) setValidationErrors({ ...validationErrors, birthDate: '' });
                        }} 
                      />
                    </div>
                  </div>

                  {/* Jenis Kelamin */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Jenis Kelamin <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Laki-laki', 'Perempuan'].map(item => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setFormData({ ...formData, gender: item as any })}
                          className={`py-3 text-center font-bold text-xs border rounded-xl transition-all cursor-pointer ${
                            formData.gender === item
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Golongan Darah */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Golongan Darah
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none"
                      value={formData.bloodType}
                      onChange={e => setFormData({ ...formData, bloodType: e.target.value as any })}
                    >
                      <option value="-">Belum Tahu / Tidak Dicantumkan</option>
                      <option value="A">Golongan Darah A</option>
                      <option value="B">Golongan Darah B</option>
                      <option value="AB">Golongan Darah AB</option>
                      <option value="O">Golongan Darah O</option>
                    </select>
                  </div>

                  {/* Agama & Status Perkawinan */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Agama <span className="text-rose-500">*</span>
                    </label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none"
                      value={formData.religion} 
                      onChange={e => setFormData({ ...formData, religion: e.target.value })}
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Status Perkawinan
                    </label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none"
                      value={formData.maritalStatus} 
                      onChange={e => setFormData({ ...formData, maritalStatus: e.target.value as any })}
                    >
                      <option value="Kawin">Kawin</option>
                      <option value="Belum Kawin">Belum Kawin</option>
                      <option value="Cerai Hidup">Cerai Hidup</option>
                      <option value="Cerai Mati">Cerai Mati</option>
                    </select>
                  </div>

                  {/* Pendidikan & Pekerjaan */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Pendidikan Terakhir <span className="text-rose-500">*</span>
                    </label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none"
                      value={formData.education} 
                      onChange={e => setFormData({ ...formData, education: e.target.value })}
                    >
                      <option value="SD">SD / Sederajat</option>
                      <option value="SMP">SMP / Sederajat</option>
                      <option value="SMA/SMK">SMA / SMK / MA</option>
                      <option value="D3">Diploma 3 (D3)</option>
                      <option value="S1">Sarjana (S1 / D4)</option>
                      <option value="S2">Magister (S2)</option>
                      <option value="S3">Doktor (S3)</option>
                      <option value="Lainnya">Lainnya / Tidak Sekolah</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Sektor Pekerjaan <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Wiraswasta, Karyawan Swasta, PNS" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                      value={formData.jobCategory} 
                      onChange={e => setFormData({ ...formData, jobCategory: e.target.value })} 
                    />
                  </div>

                  {/* BPJS Kesehatan */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Status BPJS / JKN Kesehatan
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'PPU', label: 'PPU (Pekerja)' },
                        { id: 'PBPU', label: 'PBPU (Mandiri)' },
                        { id: 'PBI', label: 'PBI (Bantuan Pemerintah)' },
                        { id: 'Tidak Ada', label: 'Belum Memiliki' }
                      ].map(b => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, bpjsStatus: b.id as any })}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                            formData.bpjsStatus === b.id
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 2: ANGGOTA KELUARGA, DEMOGRAFI & BANTUAN SOSIAL     */}
            {/* ======================================================== */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Visual Demographics Counter */}
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-200/70 shadow-2xs">
                      <Heart size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Demografi Rentan dalam Keluarga</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Bantu pendataan program posyandu, lansia, dan pelayanan kesehatan warga</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {[
                      { label: 'Ibu Hamil', field: 'pregnantCount', icon: Heart, color: 'text-rose-500 bg-rose-50' },
                      { label: 'Bayi (0-1 Thn)', field: 'babyCount', icon: Baby, color: 'text-sky-500 bg-sky-50' },
                      { label: 'Balita (1-5 Thn)', field: 'toddlerCount', icon: Smile, color: 'text-emerald-500 bg-emerald-50' },
                      { label: 'Lansia (>60 Thn)', field: 'elderlyCount', icon: Accessibility, color: 'text-amber-500 bg-amber-50' },
                    ].map((item) => (
                      <div key={item.field} className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col items-center text-center">
                        <div className={`p-2 rounded-xl mb-1.5 ${item.color}`}>
                          <item.icon size={16} />
                        </div>
                        <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">{item.label}</label>
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => decrementValue(item.field as any)}
                            className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer active:scale-95 shadow-2xs"
                          >
                            -
                          </button>
                          <span className="font-black text-slate-800 text-sm text-center w-6">{(formData as any)[item.field]}</span>
                          <button
                            type="button"
                            onClick={() => incrementValue(item.field as any)}
                            className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer active:scale-95 shadow-2xs"
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
                        <Users size={16} />
                      </div>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Detail Anggota Keluarga Tambahan</h3>
                    </div>
                    <button 
                      type="button" 
                      onClick={addFamilyMember} 
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer active:scale-95 border border-emerald-200"
                    >
                      <Plus size={12} /> Tambah Anggota
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.familyMembers.map((member, idx) => (
                      <div key={member.id || idx} className="p-5 bg-slate-50/80 border border-slate-200/80 rounded-3xl relative">
                        <button 
                          type="button" 
                          onClick={() => removeFamilyMember(idx)} 
                          className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-white rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                        
                        <div className="text-[10px] uppercase tracking-widest font-black text-indigo-600 mb-3 ml-0.5">
                          Anggota Keluarga #{idx + 1}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Anggota <span className="text-rose-500">*</span></label>
                            <input 
                              required 
                              type="text" 
                              placeholder="Nama lengkap"
                              className={`w-full px-3.5 py-2 bg-white border rounded-xl text-xs font-bold outline-none focus:border-indigo-500 ${
                                validationErrors[`member_${idx}_name`] ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                              }`} 
                              value={member.name} 
                              onChange={e => {
                                updateFamilyMember(idx, 'name', e.target.value);
                                if (validationErrors[`member_${idx}_name`]) {
                                  setValidationErrors(prev => ({ ...prev, [`member_${idx}_name`]: '' }));
                                }
                              }} 
                            />
                            {validationErrors[`member_${idx}_name`] && (
                              <p className="text-[9px] font-bold text-rose-500 ml-1">{validationErrors[`member_${idx}_name`]}</p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Hubungan Keluarga <span className="text-rose-500">*</span></label>
                            <select 
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" 
                              value={member.relation} 
                              onChange={e => updateFamilyMember(idx, 'relation', e.target.value)}
                            >
                              <option value="Istri">Istri</option>
                              <option value="Suami">Suami</option>
                              <option value="Anak">Anak</option>
                              <option value="Orang Tua">Orang Tua</option>
                              <option value="Mertua">Ibu/Ayah Mertua</option>
                              <option value="Menantu">Menantu</option>
                              <option value="Cucu">Cucu</option>
                              <option value="Saudara">Saudara / Adik / Kakak</option>
                              <option value="Keponakan">Keponakan</option>
                              <option value="Famili Lain">Famili Lain</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Kelamin</label>
                            <select 
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" 
                              value={member.gender} 
                              onChange={e => updateFamilyMember(idx, 'gender', e.target.value)}
                            >
                              <option value="Laki-laki">Laki-laki</option>
                              <option value="Perempuan">Perempuan</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">NIK (16 Digit)</label>
                              {member.nik && (
                                <span className={`text-[8px] font-mono font-bold ${member.nik.length === 16 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                  {member.nik.length}/16
                                </span>
                              )}
                            </div>
                            <input 
                              type="text" 
                              maxLength={16}
                              placeholder="16 digit angka"
                              className={`w-full px-3.5 py-2 bg-white border rounded-xl text-xs font-mono font-bold outline-none ${
                                validationErrors[`member_${idx}_nik`] ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-indigo-500'
                              }`} 
                              value={member.nik || ''} 
                              onChange={e => {
                                updateFamilyMember(idx, 'nik', e.target.value.replace(/\D/g, ''));
                                if (validationErrors[`member_${idx}_nik`]) {
                                  setValidationErrors(prev => ({ ...prev, [`member_${idx}_nik`]: '' }));
                                }
                              }} 
                            />
                            {validationErrors[`member_${idx}_nik`] && (
                              <p className="text-[9px] font-bold text-rose-500 ml-1 leading-tight">{validationErrors[`member_${idx}_nik`]}</p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Pekerjaan</label>
                            <input 
                              type="text" 
                              placeholder="Contoh: Pelajar, Swasta"
                              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" 
                              value={member.job || ''} 
                              onChange={e => updateFamilyMember(idx, 'job', e.target.value)} 
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Lahir</label>
                            <input 
                              type="date" 
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" 
                              value={member.birthDate || ''} 
                              onChange={e => updateFamilyMember(idx, 'birthDate', e.target.value)} 
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {formData.familyMembers.length === 0 && (
                      <div className="py-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
                        <Users className="mx-auto text-slate-300 mb-1.5" size={28} />
                        <p className="text-xs font-bold text-slate-500">Tinggal Sendiri (Tanpa Anggota Tambahan)</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Klik "+ Tambah Anggota" di kanan atas jika ada istri, anak, atau orang tua yang tinggal bersama.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section Kondisi Khusus & Bantuan Sosial */}
                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
                      <ShieldAlert size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Kondisi Khusus &amp; Bantuan Sosial</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <label className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${formData.isPKH ? 'bg-indigo-50/50 border-indigo-400 shadow-2xs' : 'bg-slate-50/50 border-slate-200/60 hover:bg-white'}`}>
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4 cursor-pointer"
                        checked={formData.isPKH}
                        onChange={e => setFormData({ ...formData, isPKH: e.target.checked })}
                      />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Penerima PKH</span>
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Prog. Keluarga Harapan</span>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${formData.isBLT ? 'bg-indigo-50/50 border-indigo-400 shadow-2xs' : 'bg-slate-50/50 border-slate-200/60 hover:bg-white'}`}>
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4 cursor-pointer"
                        checked={formData.isBLT}
                        onChange={e => setFormData({ ...formData, isBLT: e.target.checked })}
                      />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Penerima BLT</span>
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Bantuan Langsung Tunai</span>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${formData.isBPNT ? 'bg-indigo-50/50 border-indigo-400 shadow-2xs' : 'bg-slate-50/50 border-slate-200/60 hover:bg-white'}`}>
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4 cursor-pointer"
                        checked={formData.isBPNT}
                        onChange={e => setFormData({ ...formData, isBPNT: e.target.checked })}
                      />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Sembako / BPNT</span>
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Bantuan Pangan Non-Tunai</span>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${formData.isDisability ? 'bg-indigo-50/50 border-indigo-400 shadow-2xs' : 'bg-slate-50/50 border-slate-200/60 hover:bg-white'}`}>
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4 cursor-pointer"
                        checked={formData.isDisability}
                        onChange={e => setFormData({ ...formData, isDisability: e.target.checked })}
                      />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Disabilitas</span>
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Kebutuhan Khusus</span>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${formData.isOrphan ? 'bg-indigo-50/50 border-indigo-400 shadow-2xs' : 'bg-slate-50/50 border-slate-200/60 hover:bg-white'}`}>
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4 cursor-pointer"
                        checked={formData.isOrphan}
                        onChange={e => setFormData({ ...formData, isOrphan: e.target.checked })}
                      />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Yatim / Piatu</span>
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Anak Yatim / Piatu</span>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${formData.isBansosLain ? 'bg-indigo-50/50 border-indigo-400 shadow-2xs' : 'bg-slate-50/50 border-slate-200/60 hover:bg-white'}`}>
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4 cursor-pointer"
                        checked={formData.isBansosLain}
                        onChange={e => setFormData({ ...formData, isBansosLain: e.target.checked })}
                      />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Bansos Lainnya</span>
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Program Bantuan Lain</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 3: UNGGAH BERKAS, PRATINJAU & KONFIRMASI            */}
            {/* ======================================================== */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-200/70 shadow-2xs">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Unggah Berkas &amp; Konfirmasi Akhir</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Unggah foto KTP dan KK sebagai syarat verifikasi keabsahan kependudukan</p>
                  </div>
                </div>

                {/* Upload Mode Segmented */}
                <div className="flex gap-1.5 p-1 bg-slate-100 border border-slate-200/50 rounded-2xl">
                  <button 
                    type="button" 
                    onClick={() => setUploadType('file')} 
                    className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest cursor-pointer ${
                      uploadType === 'file' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    📷 Unggah Foto / Scan (Kamera HP)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setUploadType('url')} 
                    className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest cursor-pointer ${
                      uploadType === 'url' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    🔗 Gunakan Tautan / Link URL
                  </button>
                </div>

                {uploadType === 'file' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* KTP Upload */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Foto KTP Kepala Keluarga <span className="text-rose-500">*</span>
                      </label>
                      <div className={`
                        relative min-h-[160px] rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-5 text-center
                        ${ktpFile ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-200 bg-slate-50 hover:border-indigo-400'}
                      `}>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          onChange={e => setKtpFile(e.target.files?.[0] || null)}
                        />
                        {ktpPreviewUrl ? (
                          <div className="space-y-2 w-full">
                            <img src={ktpPreviewUrl} alt="KTP Preview" className="w-full h-28 object-cover rounded-xl shadow-xs" />
                            <div className="flex items-center justify-center gap-1.5 text-emerald-700 text-xs font-bold">
                              <CheckCircle size={14} />
                              <span className="truncate max-w-[160px]">{ktpFile?.name}</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Klik untuk mengganti foto</span>
                          </div>
                        ) : (
                          <>
                            <Camera className="text-slate-400 mb-1" size={30} />
                            <p className="text-xs font-black text-slate-700 uppercase">Ambil / Unggah Foto KTP</p>
                            <p className="text-[9px] text-slate-400 font-medium mt-0.5">Format JPG, PNG, atau WEBP</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* KK Upload */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Foto Kartu Keluarga (KK) <span className="text-rose-500">*</span>
                      </label>
                      <div className={`
                        relative min-h-[160px] rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-5 text-center
                        ${kkFile ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-200 bg-slate-50 hover:border-indigo-400'}
                      `}>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          onChange={e => setKkFile(e.target.files?.[0] || null)}
                        />
                        {kkPreviewUrl ? (
                          <div className="space-y-2 w-full">
                            <img src={kkPreviewUrl} alt="KK Preview" className="w-full h-28 object-cover rounded-xl shadow-xs" />
                            <div className="flex items-center justify-center gap-1.5 text-emerald-700 text-xs font-bold">
                              <CheckCircle size={14} />
                              <span className="truncate max-w-[160px]">{kkFile?.name}</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Klik untuk mengganti foto</span>
                          </div>
                        ) : (
                          <>
                            <Camera className="text-slate-400 mb-1" size={30} />
                            <p className="text-xs font-black text-slate-700 uppercase">Ambil / Unggah Foto KK</p>
                            <p className="text-[9px] text-slate-400 font-medium mt-0.5">Gambar jelas dan tulisan terbaca</p>
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
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500" 
                        value={ktpUrlInput} 
                        onChange={e => setKtpUrlInput(e.target.value)} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Link URL Foto KK</label>
                      <input 
                        type="url" 
                        placeholder="https://..." 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500" 
                        value={kkUrlInput} 
                        onChange={e => setKkUrlInput(e.target.value)} 
                      />
                    </div>
                  </div>
                )}

                {/* Ringkasan Data Sebelum Kirim (Summary Card) */}
                <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-[2rem] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700">
                      Ringkasan Pendaftaran
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">Pastikan Data Sudah Benar</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200/60">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Alamat Hunian</span>
                      <span className="font-black text-slate-900 text-sm">Blok {formData.block} No. {formData.number}</span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200/60">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Kepala Keluarga</span>
                      <span className="font-black text-slate-900 truncate block">{formData.headOfFamily || '-'}</span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200/60">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">WhatsApp Aktif</span>
                      <span className="font-black text-slate-900 truncate block">{formData.phone || '-'}</span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200/60">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Hak &amp; Pemilik Hunian</span>
                      <span className="font-black text-slate-900 truncate block">
                        {formData.residenceType === 'Sewa' 
                          ? `Sewa (${formData.ownerName || 'Pemilik RT'})` 
                          : formData.residenceType === 'Rumah Keluarga' 
                            ? `Keluarga (${formData.ownerName || 'Kerabat'})` 
                            : 'Milik Pribadi'}
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200/60">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Total Anggota</span>
                      <span className="font-black text-slate-900">{formData.occupants} Jiwa</span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200/60">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Kendaraan Terparkir</span>
                      <span className="font-black text-indigo-700">
                        {(formData.twoWheelCount || 0) + (formData.fourWheelCount || 0) > 0
                          ? `${formData.twoWheelCount || 0} Motor • ${formData.fourWheelCount || 0} Mobil`
                          : 'Tidak Ada'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Checklist Pernyataan & Persetujuan */}
                <label className="flex items-start gap-3 p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.agreementAccepted}
                    onChange={e => setFormData({ ...formData, agreementAccepted: e.target.checked })}
                    className="mt-0.5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500/20 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 leading-relaxed font-medium">
                    Saya menyatakan bahwa seluruh informasi dan berkas yang saya unggah adalah <strong>benar, sah, dan dapat dipertanggungjawabkan</strong>. Saya bersedia mematuhi norma lingkungan dan tata tertib resmi <strong>RT 002 / RW 020 Kelurahan Tondo</strong>.
                  </span>
                </label>
                {validationErrors.agreement && (
                  <p className="text-[9px] font-bold text-rose-500 uppercase ml-1">{validationErrors.agreement}</p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Action Buttons Footer */}
        <div className="pt-6 border-t border-slate-100 flex gap-3">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading}
              className="flex-1 sm:flex-initial px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer border border-slate-200"
            >
              Kembali
            </button>
          )}

          {!isLastStep ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Lanjut ke Langkah {currentStep + 2}</span>
              <Check size={14} className="stroke-[3]" />
            </button>
          ) : (
            <Button
              type="submit"
              isLoading={isLoading}
              className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <Send size={14} /> Kirim Pendaftaran Warga Baru
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
