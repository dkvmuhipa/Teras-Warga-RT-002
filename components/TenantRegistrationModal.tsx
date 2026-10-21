import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, X, Check, ArrowRight, ArrowLeft, Sparkles, 
  MapPin, UserCheck, ShieldCheck, Phone, Wallet, 
  Layers, Palette, CheckCircle2, AlertCircle, Plus, Trash2,
  Key, Lock, Mail, Eye, EyeOff, Copy, MessageSquare, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTenant } from '../context/TenantContext';
import { Tenant, BlockRangeConfig, Role } from '../types';
import { createTenantAdminAccount, suggestRtAdminEmail, generateTemporaryPassword } from '../services/authAdminService';
import { toast } from 'sonner';

interface TenantRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (tenant: Tenant) => void;
}

const THEME_COLORS = [
  { label: 'Biru Samudera', color: '#2563EB', bg: 'bg-blue-600' },
  { label: 'Hijau Zamrud', color: '#059669', bg: 'bg-emerald-600' },
  { label: 'Indigo Modern', color: '#4F46E5', bg: 'bg-indigo-600' },
  { label: 'Ungu Elegan', color: '#7C3AED', bg: 'bg-purple-600' },
  { label: 'Mawar Elegan', color: '#E11D48', bg: 'bg-rose-600' },
  { label: 'Amber Surya', color: '#D97706', bg: 'bg-amber-600' },
];

export const TenantRegistrationModal: React.FC<TenantRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { registerTenant } = useTenant();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [createdTenant, setCreatedTenant] = useState<Tenant | null>(null);
  const [createdAdminInfo, setCreatedAdminInfo] = useState<{ email: string; password: string } | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    // Step 0: Identitas Wilayah
    rt: '003',
    rw: '020',
    housingName: 'Huntap Tondo 2',
    kelurahan: 'Tondo',
    kecamatan: 'Mantikulore',
    city: 'Kota Palu',
    province: 'Sulawesi Tengah',
    postalCode: '94119',
    address: 'Jl. Merpati Blok A1-01',

    // Step 1: Susunan Blok
    blockInput: 'A1, A2, B1, B2',
    unitsPerBlock: 20,

    // Step 2: Pengurus & Akun Login
    chairmanName: '',
    chairmanPhone: '',
    secretaryName: '',
    treasurerName: '',
    themeColor: '#4F46E5',
    createAdminAccount: true,
    adminEmail: 'rt003.tondo@teraswarga.id',
    adminPassword: 'TerasWarga!003#88',
    isEmailCustomized: false,

    // Step 3: Tarif Iuran
    sampahUmum: 20000,
    sampahPkh: 10000,
    sampahPns: 35000,
    kasFee: 20000,
    airFee: 10000,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-sync suggested admin email & password when RT or Kelurahan changes
  useEffect(() => {
    if (!formData.isEmailCustomized) {
      const suggested = suggestRtAdminEmail(formData.rt, formData.kelurahan);
      const generatedPass = generateTemporaryPassword(formData.rt);
      setFormData(prev => ({
        ...prev,
        adminEmail: suggested,
        adminPassword: prev.adminPassword || generatedPass
      }));
    }
  }, [formData.rt, formData.kelurahan]);

  // Parse blocks
  const parsedBlocks = useMemo(() => {
    return formData.blockInput
      .split(',')
      .map(b => b.trim().toUpperCase())
      .filter(b => b.length > 0);
  }, [formData.blockInput]);

  const blockConfigs: BlockRangeConfig[] = useMemo(() => {
    return parsedBlocks.map(code => ({
      code,
      start: 1,
      end: Number(formData.unitsPerBlock) || 20
    }));
  }, [parsedBlocks, formData.unitsPerBlock]);

  // Derived Title Preview
  const rtFormatted = formData.rt.padStart(3, '0');
  const rwFormatted = formData.rw.padStart(3, '0');
  const displayNamePreview = `RT ${rtFormatted} / RW ${rwFormatted} ${formData.housingName ? formData.housingName : ''}`.trim();

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Disalin ke clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSendWhatsAppToChairman = () => {
    if (!createdTenant || !createdAdminInfo) return;
    let cleanPhone = createdTenant.chairmanPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);

    const portalUrl = `${window.location.origin}/?rt=${createdTenant.slug}#/admin`;
    const message = encodeURIComponent(
      `Halo Bpk/Ibu ${createdTenant.chairmanName},\n\n` +
      `Selamat! Portal digital mandiri untuk *${createdTenant.name}* telah berhasil didaftarkan dan aktif di sistem Teras Warga.\n\n` +
      `🔑 *Akses Login Portal Admin RT:*\n` +
      `• URL Portal Admin: ${portalUrl}\n` +
      `• Email Login: ${createdAdminInfo.email}\n` +
      `• Password Sementara: ${createdAdminInfo.password}\n\n` +
      `Silakan login untuk mulai mengelola kependudukan, iuran warga, dan persuratan digital lingkungan Anda.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.rt.trim()) newErrors.rt = 'Nomor RT wajib diisi';
      if (!formData.rw.trim()) newErrors.rw = 'Nomor RW wajib diisi';
      if (!formData.kelurahan.trim()) newErrors.kelurahan = 'Kelurahan wajib diisi';
      if (!formData.kecamatan.trim()) newErrors.kecamatan = 'Kecamatan wajib diisi';
      if (!formData.city.trim()) newErrors.city = 'Kota/Kabupaten wajib diisi';
    }

    if (step === 1) {
      if (parsedBlocks.length === 0) {
        newErrors.blockInput = 'Minimal cantumkan 1 blok kavling warga';
      }
    }

    if (step === 2) {
      if (!formData.chairmanName.trim()) newErrors.chairmanName = 'Nama Ketua RT wajib diisi';
      if (!formData.chairmanPhone.trim()) {
        newErrors.chairmanPhone = 'Nomor WhatsApp Ketua RT wajib diisi';
      } else if (!/^[0-9+\s-]{8,20}$/.test(formData.chairmanPhone)) {
        newErrors.chairmanPhone = 'Format nomor WhatsApp tidak valid';
      }

      if (formData.createAdminAccount) {
        if (!formData.adminEmail.trim()) {
          newErrors.adminEmail = 'Email login Admin RT wajib diisi';
        } else if (!formData.adminEmail.includes('@') || !formData.adminEmail.includes('.')) {
          newErrors.adminEmail = 'Format email tidak valid';
        }
        if (!formData.adminPassword.trim()) {
          newErrors.adminPassword = 'Password login wajib diisi';
        } else if (formData.adminPassword.length < 6) {
          newErrors.adminPassword = 'Password minimal 6 karakter';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsLoading(true);
    try {
      const cleanPhone = formData.chairmanPhone.startsWith('0') 
        ? `+62 ${formData.chairmanPhone.substring(1)}` 
        : formData.chairmanPhone;

      const fullAddress = `${formData.address}${formData.housingName ? ` ${formData.housingName}` : ''}, Kel. ${formData.kelurahan}, Kec. ${formData.kecamatan}, ${formData.city}`;

      const chairmanFormattedName = formData.chairmanName.trim().startsWith('Bpk.') || formData.chairmanName.trim().startsWith('Ibu') 
        ? formData.chairmanName.trim() 
        : `Bpk. ${formData.chairmanName.trim()}`;

      // 1. Register Tenant in Firestore
      const newTenant = await registerTenant({
        name: displayNamePreview,
        rt: rtFormatted,
        rw: rwFormatted,
        kelurahan: formData.kelurahan.trim(),
        kecamatan: formData.kecamatan.trim(),
        city: formData.city.trim(),
        province: formData.province.trim(),
        postalCode: formData.postalCode.trim() || '94119',
        address: fullAddress,
        chairmanName: chairmanFormattedName,
        chairmanPhone: cleanPhone,
        secretaryName: formData.secretaryName.trim() || `Sekretaris RT ${rtFormatted}`,
        treasurerName: formData.treasurerName.trim() || `Bendahara RT ${rtFormatted}`,
        blocks: parsedBlocks,
        blockConfig: blockConfigs,
        fees: {
          sampahUmum: Number(formData.sampahUmum) || 20000,
          sampahPkh: Number(formData.sampahPkh) || 10000,
          sampahPns: Number(formData.sampahPns) || 35000,
          kasFee: Number(formData.kasFee) || 20000,
          airFee: Number(formData.airFee) || 10000,
        },
        logoUrl: '/logo-rt.svg',
        themeColor: formData.themeColor,
        isPilotDemo: false
      });

      // 2. Create Firebase Auth Admin Account if toggled
      if (formData.createAdminAccount) {
        try {
          await createTenantAdminAccount({
            email: formData.adminEmail,
            password: formData.adminPassword,
            name: chairmanFormattedName,
            phone: cleanPhone,
            role: Role.ADMIN,
            tenantId: newTenant.id
          });
          setCreatedAdminInfo({
            email: formData.adminEmail.trim().toLowerCase(),
            password: formData.adminPassword.trim()
          });
        } catch (authErr: any) {
          console.warn("Gagal membuat akun login Admin RT:", authErr);
          toast.warning("RT Terdaftar, Namun Akun Admin Gagal Dibuat", {
            description: authErr.message || "Email mungkin sudah dipakai. Akun dapat dibuat terpisah di Direktori Aparatur."
          });
        }
      }

      setCreatedTenant(newTenant);
      setIsSuccess(true);
      if (onSuccess) {
        onSuccess(newTenant);
      }
      toast.success("RT Baru Berhasil Didaftarkan!", {
        description: `Portal ${newTenant.name} kini telah aktif dan siap digunakan.`,
        duration: 4500
      });
    } catch (err: any) {
      console.error("Gagal mendaftarkan tenant:", err);
      toast.error("Gagal Mendaftarkan RT", {
        description: err?.message || "Terjadi kesalahan saat menyimpan ke database."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    setIsSuccess(false);
    onClose();
    setCurrentStep(0);
    setCreatedAdminInfo(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 relative overflow-hidden my-auto"
      >
        {/* Top Gradient Bar */}
        <div 
          className="h-2 w-full transition-all duration-300"
          style={{ backgroundColor: formData.themeColor || '#4F46E5' }}
        />

        {/* Close Button */}
        <button 
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-2xl hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>

        {isSuccess && createdTenant ? (
          /* ================= SUCCESS STATE ================= */
          <div className="p-6 sm:p-10 text-center space-y-6 max-h-[88vh] overflow-y-auto">
            <div 
              className="w-20 h-20 rounded-3xl text-white flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/20"
              style={{ backgroundColor: createdTenant.themeColor || '#4F46E5' }}
            >
              <CheckCircle2 size={44} />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black uppercase tracking-wider">
                ✓ Aktivasi Instan Berhasil
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Selamat Datang di {createdTenant.name}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Portal digital RT mandiri Anda telah sukses terdaftar di platform Teras Warga.
              </p>
            </div>

            {/* Created Admin Account Credentials Card */}
            {createdAdminInfo && (
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-left space-y-3 max-w-md mx-auto shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <Key size={13} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wide">
                      Akun Login Admin RT Siap Pakai
                    </h4>
                    <p className="text-[10px] text-indigo-700">Kredensial login untuk Ketua / Pengurus RT</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs pt-1">
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-indigo-100">
                    <span className="text-slate-500 font-medium">Email Login:</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                      <span>{createdAdminInfo.email}</span>
                      <button
                        onClick={() => handleCopyText(createdAdminInfo.email, 'email')}
                        className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                        title="Salin email"
                      >
                        {copiedKey === 'email' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-indigo-100">
                    <span className="text-slate-500 font-medium">Password Sementara:</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-indigo-700">
                      <span>{createdAdminInfo.password}</span>
                      <button
                        onClick={() => handleCopyText(createdAdminInfo.password, 'pass')}
                        className="p-1 text-indigo-500 hover:text-indigo-800 cursor-pointer"
                        title="Salin password"
                      >
                        {copiedKey === 'pass' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-indigo-100">
                    <span className="text-slate-500 font-medium">Portal Admin:</span>
                    <div className="flex items-center gap-1 font-mono text-emerald-700 font-bold truncate max-w-[200px]">
                      <span>?rt={createdTenant.slug}#/admin</span>
                    </div>
                  </div>
                </div>

                <div className="pt-1 flex gap-2">
                  <button
                    onClick={handleSendWhatsAppToChairman}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
                  >
                    <MessageSquare size={14} />
                    <span>Kirim Kredensial via WA</span>
                  </button>
                  <button
                    onClick={() => handleCopyText(
                      `Akses Admin ${createdTenant.name}:\nPortal: ${window.location.origin}/?rt=${createdTenant.slug}#/admin\nEmail: ${createdAdminInfo.email}\nPassword: ${createdAdminInfo.password}`,
                      'all'
                    )}
                    className="py-2.5 px-3 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Copy size={13} />
                    <span>Salin Semua</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tenant Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Wilayah:</span>
                <span className="font-black text-slate-800">{createdTenant.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Kelurahan / Kecamatan:</span>
                <span className="font-black text-slate-800">{createdTenant.kelurahan}, {createdTenant.kecamatan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Ketua RT:</span>
                <span className="font-black text-slate-800">{createdTenant.chairmanName} ({createdTenant.chairmanPhone})</span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-white font-extrabold text-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
              style={{ backgroundColor: createdTenant.themeColor || '#4F46E5' }}
            >
              Mulai Kelola Warga Sekarang
            </button>
          </div>
        ) : (
          /* ================= WIZARD FORM ================= */
          <div className="p-6 sm:p-8 space-y-6">
            {/* Modal Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200/80 rounded-full text-[10px] font-black text-indigo-700 uppercase tracking-wider mb-2">
                <Sparkles size={12} />
                <span>Self-Service Multi-RT Onboarding</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Daftarkan RT / RW Baru
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Isi formulir di bawah ini untuk mengaktifkan portal digital mandiri beserta akun login admin bagi lingkungan Anda.
              </p>
            </div>

            {/* Steps Progress */}
            <div className="grid grid-cols-4 gap-2 border-b border-slate-100 pb-4">
              {[
                { title: 'Identitas', desc: 'RT/RW' },
                { title: 'Kavling', desc: 'Blok' },
                { title: 'Pengurus & Akun', desc: 'Kontak' },
                { title: 'Iuran', desc: 'Tarif' },
              ].map((step, idx) => {
                const isActive = currentStep === idx;
                const isPassed = currentStep > idx;
                return (
                  <div key={idx} className="flex flex-col items-center text-center">
                    <div 
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                        isActive 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                          : isPassed 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isPassed ? <Check size={14} /> : idx + 1}
                    </div>
                    <span className={`text-[10px] font-bold mt-1.5 ${isActive ? 'text-indigo-600 font-black' : 'text-slate-400'}`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Form Content by Step */}
            <div className="space-y-4 min-h-[280px]">
              {/* STEP 0: Identitas Wilayah */}
              {currentStep === 0 && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">
                        Nomor RT <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text"
                        placeholder="Contoh: 003"
                        value={formData.rt}
                        onChange={e => setFormData({ ...formData, rt: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                      {errors.rt && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.rt}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">
                        Nomor RW <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text"
                        placeholder="Contoh: 020"
                        value={formData.rw}
                        onChange={e => setFormData({ ...formData, rw: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                      {errors.rw && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.rw}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">
                      Nama Perumahan / Komplek / Wilayah
                    </label>
                    <input 
                      type="text"
                      placeholder="Contoh: Huntap Tondo 2"
                      value={formData.housingName}
                      onChange={e => setFormData({ ...formData, housingName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">
                        Kelurahan / Desa <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text"
                        placeholder="Contoh: Tondo"
                        value={formData.kelurahan}
                        onChange={e => setFormData({ ...formData, kelurahan: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                      {errors.kelurahan && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.kelurahan}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">
                        Kecamatan <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text"
                        placeholder="Contoh: Mantikulore"
                        value={formData.kecamatan}
                        onChange={e => setFormData({ ...formData, kecamatan: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                      {errors.kecamatan && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.kecamatan}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">
                        Kota / Kabupaten <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text"
                        placeholder="Contoh: Kota Palu"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                      {errors.city && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">
                        Provinsi
                      </label>
                      <input 
                        type="text"
                        placeholder="Contoh: Sulawesi Tengah"
                        value={formData.province}
                        onChange={e => setFormData({ ...formData, province: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">
                      Alamat Sekretariat / Pos Ronda
                    </label>
                    <input 
                      type="text"
                      placeholder="Contoh: Jl. Merpati Blok A1-01"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  {/* Preview Banner */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Pratinjau Nama Resmi:</span>
                    <span className="font-black text-slate-900">{displayNamePreview}</span>
                  </div>
                </motion.div>
              )}

              {/* STEP 1: Susunan Blok & Kavling */}
              {currentStep === 1 && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">
                      Daftar Blok / Lorong / Gang (Dipisah Tanda Koma) <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text"
                      placeholder="Contoh: A1, A2, B1, B2, C1"
                      value={formData.blockInput}
                      onChange={e => setFormData({ ...formData, blockInput: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                    {errors.blockInput && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.blockInput}</p>}
                    <p className="text-[11px] text-slate-400 mt-1">
                      Ketikkan kode blok yang ada di wilayah RT Anda. Misal: <code className="bg-slate-100 px-1 py-0.5 rounded">A, B, C</code> atau <code className="bg-slate-100 px-1 py-0.5 rounded">Blok 1, Blok 2</code>.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">
                      Estimasi Rata-rata Unit Rumah per Blok
                    </label>
                    <input 
                      type="number"
                      min={1}
                      max={100}
                      value={formData.unitsPerBlock}
                      onChange={e => setFormData({ ...formData, unitsPerBlock: Number(e.target.value) || 20 })}
                      className="w-32 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                    <span className="text-xs text-slate-500 ml-2">Unit / Rumah</span>
                  </div>

                  {/* Block Visual Tags Preview */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">Blok yang Terdeteksi ({parsedBlocks.length}):</span>
                      <span className="font-black text-indigo-700">Total ~{parsedBlocks.length * formData.unitsPerBlock} Potensi Kavling</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {parsedBlocks.length > 0 ? (
                        parsedBlocks.map(b => (
                          <span key={b} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded-lg text-xs font-black shadow-2xs">
                            Blok {b} (1–{formData.unitsPerBlock})
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Belum ada blok yang diketik</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Pengurus & Akun Login */}
              {currentStep === 2 && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">
                        Nama Ketua RT <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text"
                        placeholder="Contoh: Hendra Gunawan"
                        value={formData.chairmanName}
                        onChange={e => setFormData({ ...formData, chairmanName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                      {errors.chairmanName && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.chairmanName}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">
                        No. WhatsApp Ketua RT <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text"
                        placeholder="Contoh: 081234567890"
                        value={formData.chairmanPhone}
                        onChange={e => setFormData({ ...formData, chairmanPhone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                      {errors.chairmanPhone && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.chairmanPhone}</p>}
                    </div>
                  </div>

                  {/* Interactive Admin Account Provisioning Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 border border-indigo-200/80 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                          <Key size={15} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                            <span>Buat Akun Login Admin RT</span>
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
                              Cloud Auth
                            </span>
                          </h4>
                          <p className="text-[10px] text-slate-500 font-medium">
                            Kredensial login portal admin mandiri untuk Ketua RT ini
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.createAdminAccount}
                          onChange={e => setFormData({ ...formData, createAdminAccount: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {formData.createAdminAccount && (
                      <div className="pt-2.5 border-t border-indigo-100/70 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-bold text-slate-700">
                                Email Login <span className="text-rose-500">*</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => setFormData({ 
                                  ...formData, 
                                  adminEmail: suggestRtAdminEmail(formData.rt, formData.kelurahan),
                                  isEmailCustomized: false 
                                })}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                              >
                                Reset Rekomendasi
                              </button>
                            </div>
                            <div className="relative">
                              <Mail size={14} className="absolute left-3 top-2.5 text-slate-400" />
                              <input 
                                type="email"
                                value={formData.adminEmail}
                                onChange={e => setFormData({ ...formData, adminEmail: e.target.value, isEmailCustomized: true })}
                                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                placeholder="rt003.tondo@teraswarga.id"
                              />
                            </div>
                            {errors.adminEmail && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.adminEmail}</p>}
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-bold text-slate-700">
                                Password Sementara <span className="text-rose-500">*</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => setFormData({ 
                                  ...formData, 
                                  adminPassword: generateTemporaryPassword(formData.rt) 
                                })}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                              >
                                Acak Baru
                              </button>
                            </div>
                            <div className="relative">
                              <Lock size={14} className="absolute left-3 top-2.5 text-slate-400" />
                              <input 
                                type={showPassword ? "text" : "password"}
                                value={formData.adminPassword}
                                onChange={e => setFormData({ ...formData, adminPassword: e.target.value })}
                                className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                placeholder="Minimal 6 karakter"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            </div>
                            {errors.adminPassword && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.adminPassword}</p>}
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-500">
                          💡 Akun dibuat otomatis di Firebase Auth tanpa memutus sesi Super Admin Anda.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">
                        Nama Sekretaris RT (Opsional)
                      </label>
                      <input 
                        type="text"
                        placeholder="Sekretaris RT"
                        value={formData.secretaryName}
                        onChange={e => setFormData({ ...formData, secretaryName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">
                        Nama Bendahara RT (Opsional)
                      </label>
                      <input 
                        type="text"
                        placeholder="Bendahara RT"
                        value={formData.treasurerName}
                        onChange={e => setFormData({ ...formData, treasurerName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Warna Tema Identitas RT */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-2 block flex items-center gap-1.5">
                      <Palette size={14} className="text-indigo-600" />
                      <span>Warna Tema Identitas RT</span>
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {THEME_COLORS.map(c => {
                        const isSelected = formData.themeColor === c.color;
                        return (
                          <button
                            key={c.color}
                            type="button"
                            onClick={() => setFormData({ ...formData, themeColor: c.color })}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              isSelected 
                                ? 'border-slate-800 bg-slate-900 text-white shadow-sm' 
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded-full ${c.bg} shrink-0`} />
                            <span>{c.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Konfigurasi Tarif Iuran */}
              {currentStep === 3 && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs text-indigo-900 leading-relaxed">
                    💡 <strong>Pengaturan Fleksibel:</strong> Nilai tarif iuran di bawah ini adalah acuan awal dan dapat diubah kapan saja di menu Pengaturan Admin RT Anda.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">
                        Iuran Retribusi Sampah Umum
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                        <input 
                          type="number"
                          step={1000}
                          value={formData.sampahUmum}
                          onChange={e => setFormData({ ...formData, sampahUmum: Number(e.target.value) || 0 })}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">
                        Iuran Kas Lingkungan Bulanan
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                        <input 
                          type="number"
                          step={1000}
                          value={formData.kasFee}
                          onChange={e => setFormData({ ...formData, kasFee: Number(e.target.value) || 0 })}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                    <span className="font-black text-slate-900 block">Ringkasan Pendaftaran:</span>
                    <div className="text-slate-600 space-y-1">
                      <p>• <strong>Identitas:</strong> {displayNamePreview}</p>
                      <p>• <strong>Wilayah:</strong> Kel. {formData.kelurahan}, Kec. {formData.kecamatan}, {formData.city}</p>
                      <p>• <strong>Kavling:</strong> {parsedBlocks.join(', ')} ({parsedBlocks.length} Blok)</p>
                      <p>• <strong>Pengurus:</strong> {formData.chairmanName} ({formData.chairmanPhone})</p>
                      {formData.createAdminAccount && (
                        <p>• <strong>Akun Admin RT:</strong> {formData.adminEmail} (Otomatis dibuat)</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Kembali</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/25 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <span>Lanjutkan</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl text-white font-black text-xs shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                  style={{ backgroundColor: formData.themeColor || '#4F46E5' }}
                >
                  {isLoading ? (
                    <span>Mendaftarkan ke Cloud...</span>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Aktifkan RT Sekarang</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
