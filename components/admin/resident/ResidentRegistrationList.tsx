import React, { useState } from 'react';
import { 
  User, Phone, ChevronDown, ChevronUp, Eye, Check, X, Users, Heart, 
  GraduationCap, Briefcase, Calendar, ShieldCheck, MapPin, FileText, 
  Info, CheckCircle, Search, Baby, Smile, Accessibility, ExternalLink,
  ClipboardList, AlertTriangle, Building, LayoutGrid, Download, Printer,
  Copy, Clock, Sparkles, CheckCheck, UserCheck, XCircle, Shield, Car,
  AlertCircle, MessageSquare, ArrowUpRight, HelpCircle, FileCheck, Hash
} from 'lucide-react';
import { ResidentRegistration, PaymentStatus, House } from '../../../types';
import { toast } from 'sonner';
import { useConfirm } from '../../../context/ConfirmContext';
import { formatHouseId, handleFirestoreError, OperationType, logAction, setDocumentInCollection } from '../../../services/databaseService';
import { sendWhatsAppViaGateway } from '../../../services/whatsappService';
import { motion, AnimatePresence } from 'motion/react';

interface ResidentRegistrationListProps {
  residentRegistrations: ResidentRegistration[];
  searchTerm: string;
  updateResidentRegistrationInDb: (id: string, data: Partial<ResidentRegistration>) => Promise<void>;
  addHouse: (house: any) => Promise<void>;
  addPopulationLogToDb?: (log: any) => Promise<void>;
}

export const ResidentRegistrationList: React.FC<ResidentRegistrationListProps> = ({
  residentRegistrations,
  searchTerm: parentSearchTerm,
  updateResidentRegistrationInDb,
  addHouse,
  addPopulationLogToDb,
}) => {
  const confirm = useConfirm();
  const [localSearch, setLocalSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [expandedRegId, setExpandedRegId] = useState<string | null>(null);
  
  // Immersive Image Lightbox/Viewer state
  const [lightboxImage, setLightboxImage] = useState<{ 
    url: string; 
    title: string; 
    isPlaceholder?: boolean; 
    phone?: string; 
    applicantName?: string;
  } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Helper function to calculate age from birthDate
  const calculateAge = (birthDateStr?: string): string => {
    if (!birthDateStr) return '-';
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return '-';
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? `${age} Tahun` : 'Kurang dari 1 Tahun';
  };

  const handleCopy = (text: string, label: string) => {
    if (!text || text === '-') return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} Berhasil Disalin!`, {
      description: text,
      duration: 2500
    });
  };

  const handleOpenDocInNewTab = (url: string) => {
    if (url.startsWith('data:')) {
      const win = window.open('');
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head><title>Pratinjau Dokumen - Teras Warga RT 002</title></head>
            <body style="margin:0;background:#090d16;display:flex;justify-content:center;align-items:center;min-height:100vh;">
              <img src="${url}" style="max-width:96vw;max-height:96vh;object-fit:contain;border-radius:12px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);" />
            </body>
          </html>
        `);
        win.document.close();
      }
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownloadDoc = (url: string, title: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const toggleExpanded = (regId: string) => {
    setExpandedRegId(expandedRegId === regId ? null : regId);
  };

  // Combine parent search with local search term
  const activeSearch = (localSearch || parentSearchTerm).toLowerCase();

  // Filtering list
  const filteredRegistrations = residentRegistrations.filter(reg => {
    const matchesSearch = 
      reg.headOfFamily.toLowerCase().includes(activeSearch) ||
      reg.block.toLowerCase().includes(activeSearch) ||
      reg.number.toLowerCase().includes(activeSearch) ||
      (reg.nik && reg.nik.toLowerCase().includes(activeSearch)) ||
      (reg.kkNumber && reg.kkNumber.toLowerCase().includes(activeSearch)) ||
      (reg.ownerName && reg.ownerName.toLowerCase().includes(activeSearch)) ||
      reg.phone.toLowerCase().includes(activeSearch) ||
      (reg.familyMembers && reg.familyMembers.some(m => m.name.toLowerCase().includes(activeSearch)));

    if (filterStatus === 'All') return matchesSearch;
    return reg.approvalStatus === filterStatus && matchesSearch;
  });

  // Count stats
  const totalPending = residentRegistrations.filter(r => r.approvalStatus === 'Pending' || r.approvalStatus === 'Menunggu').length;
  const totalApproved = residentRegistrations.filter(r => r.approvalStatus === 'Approved' || r.approvalStatus === 'Disetujui').length;
  const totalRejected = residentRegistrations.filter(r => r.approvalStatus === 'Rejected' || r.approvalStatus === 'Ditolak').length;

  const handleApprove = async (reg: ResidentRegistration) => {
    const isConfirmed = await confirm({
      title: 'Setujui & Terbitkan Data Warga',
      message: `Apakah Anda yakin ingin menyetujui pendaftaran ${reg.headOfFamily}? Data kependudukan akan otomatis diterbitkan ke Sensus Jiwa RT 002 (Blok ${reg.block}-${reg.number})${reg.residenceType === 'Sewa' ? ' dan kontrak sewa otomatis terhubung ke Buku Sewa RT' : ''}.`,
      confirmLabel: 'Setujui & Daftarkan Resmi',
    });

    if (!isConfirmed) return;

    setActionLoadingId(reg.id);
    try {
      // 1. Add to houses database
      const houseId = formatHouseId(`${reg.block}-${reg.number}`);
      await addHouse({
        id: houseId,
        headOfFamily: reg.headOfFamily,
        gender: reg.gender,
        birthDate: reg.birthDate,
        ownerName: reg.ownerName || (reg.residenceType === 'Tetap' ? reg.headOfFamily : ''),
        block: reg.block,
        number: reg.number,
        phone: reg.phone,
        status: reg.status || 'Occupied',
        residenceType: reg.residenceType || 'Tetap',
        occupants: reg.occupants || 1,
        education: reg.education || '',
        jobCategory: reg.jobCategory || '',
        vehicleCount: reg.vehicleCount || 0,
        twoWheelCount: reg.twoWheelCount || 0,
        fourWheelCount: reg.fourWheelCount || 0,
        pregnantCount: reg.pregnantCount || 0,
        babyCount: reg.babyCount || 0,
        toddlerCount: reg.toddlerCount || 0,
        teenagerCount: reg.teenagerCount || 0,
        adultCount: reg.adultCount || 0,
        elderlyCount: reg.elderlyCount || 0,
        widowCount: reg.widowCount || 0,
        ktpUrl: reg.ktpUrl || '',
        kkUrl: reg.kkUrl || '',
        familyMembers: reg.familyMembers || [],
        paymentStatusAir: PaymentStatus.PENDING,
        paymentStatusSampah: PaymentStatus.PENDING,
        isVerified: true,
        joiningDate: reg.date || new Date().toISOString(),
        religion: reg.religion || 'Islam',
        kkNumber: reg.kkNumber || '',
        nik: reg.nik || '',
        birthPlace: reg.birthPlace || '',
        maritalStatus: reg.maritalStatus || 'Kawin',
        bloodType: reg.bloodType || '-',
        bpjsStatus: reg.bpjsStatus || 'Tidak Ada',
        isPKH: reg.isPKH || false,
        isBLT: reg.isBLT || false,
        isBPNT: reg.isBPNT || false,
        isBansosLain: reg.isBansosLain || false,
        bansosLainName: reg.bansosLainName || '',
        isDisability: reg.isDisability || false,
        isOrphan: reg.isOrphan || false,
        childCount: reg.childCount || 0,
      } as any);
      
      // 2. Update registration status to approved
      await updateResidentRegistrationInDb(reg.id, { approvalStatus: 'Approved' });

      // 2b. Auto-sync to rentalContracts if residenceType is 'Sewa' or 'Rumah Keluarga'
      if (reg.residenceType === 'Sewa' || reg.residenceType === 'Rumah Keluarga') {
        const contractDocId = `rent-${houseId}`;
        const isRumahKeluarga = reg.residenceType === 'Rumah Keluarga';

        await setDocumentInCollection('rentalContracts', contractDocId, {
          id: contractDocId,
          houseId: houseId,
          block: reg.block,
          number: reg.number,
          ownerName: reg.ownerName || (isRumahKeluarga ? 'Keluarga / Kerabat' : 'Perlu Konfirmasi Pemilik'),
          ownerPhone: reg.phone,
          ownerAddress: `Blok ${reg.block} No. ${reg.number}`,
          tenantName: reg.headOfFamily,
          tenantPhone: reg.phone,
          tenantNik: reg.nik || '',
          occupancyType: isRumahKeluarga ? 'Rumah Keluarga' : 'Keluarga',
          rentType: isRumahKeluarga ? 'Bukan Kontrak (Keluarga)' : 'Tahunan',
          rentPrice: 0,
          status: 'Aktif',
          startDate: reg.date ? reg.date.split('T')[0] : new Date().toISOString().split('T')[0],
          endDate: isRumahKeluarga ? '-' : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          verificationStatus: 'Terverifikasi',
          occupantsCount: Number(reg.occupants) || 1,
          reportedBy: 'Penyewa',
          reporterName: reg.headOfFamily,
          reporterPhone: reg.phone,
          notes: isRumahKeluarga 
            ? 'Rumah Keluarga / Ikut Kerabat (Sinkronisasi Otomatis dari Pendaftaran Warga)' 
            : 'Kontrak Sewa Keluarga (Sinkronisasi Otomatis dari Pendaftaran Warga)',
          createdAt: new Date().toISOString()
        });
      }

      // 3. Add to population logs (Log Mutasi)
      if (addPopulationLogToDb) {
        await addPopulationLogToDb({
          id: Date.now().toString(),
          type: 'Newcomer',
          name: reg.headOfFamily,
          phone: reg.phone,
          houseId: formatHouseId(`${reg.block}-${reg.number}`),
          date: new Date().toISOString().split('T')[0],
          description: 'Registrasi Warga Baru (Online)',
          isGenerated: true,
          details: {
            previousAddress: '-',
            reasonForMoving: 'Registrasi Online',
            familyCount: reg.occupants || 1,
            familyMembers: reg.familyMembers || [],
            residenceType: reg.residenceType || 'Tetap',
            religion: reg.religion || '-',
            kkNumber: reg.kkNumber || '-',
            jobCategory: reg.jobCategory || '-',
            education: reg.education || '-'
          }
        });
      }
      
      // 4. Audit Log
      await logAction('Disetujui Pendaftaran Warga', `Menyetujui pendaftaran warga baru ${reg.headOfFamily} (Kavling Blok ${reg.block}-${reg.number})`);

      // 5. Auto WhatsApp Dispatch
      if (reg.phone && reg.phone !== '-') {
        const msg = `Halo Bpk/Ibu ${reg.headOfFamily}, Selamat! Pengurus RT 002 Huntap Tondo 2 mengonfirmasi bahwa permohonan pendaftaran warga baru Anda di Kavling Blok ${reg.block}-${reg.number} telah DISETUJUI. Akun & profil domisili Anda kini telah terdaftar resmi di sistem RT 002.`;
        await sendWhatsAppViaGateway(reg.phone, msg);
      }
      
      toast.success('Pendaftaran Disetujui & Diterbitkan!', {
        description: `Warga atas nama ${reg.headOfFamily} berhasil didaftarkan ke sistem RT.`
      });
      setExpandedRegId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `residentRegistrations/${reg.id}`);
      toast.error('Gagal menyetujui pendaftaran.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (reg: ResidentRegistration) => {
    const isConfirmed = await confirm({
      title: 'Tolak Pendaftaran',
      message: `Apakah Anda yakin ingin menolak berkas pendaftaran dari ${reg.headOfFamily}? Langkah ini tidak menambahkan warga ke database.`,
      confirmLabel: 'Tolak Berkas',
      isDanger: true
    });

    if (!isConfirmed) return;

    setActionLoadingId(reg.id);
    try {
      await updateResidentRegistrationInDb(reg.id, { approvalStatus: 'Rejected' });
      await logAction('Tolak Pendaftaran Warga', `Menolak pendaftaran warga baru ${reg.headOfFamily} (Blok ${reg.block}-${reg.number})`);

      if (reg.phone && reg.phone !== '-') {
        const msg = `Halo Bpk/Ibu ${reg.headOfFamily}, permohonan pendaftaran warga baru Anda di Blok ${reg.block}-${reg.number} DITOLAK oleh Pengurus RT 02 karena berkas/data belum memenuhi syarat. Silakan hubungi pengurus RT untuk informasi lebih lanjut.`;
        await sendWhatsAppViaGateway(reg.phone, msg);
      }

      toast.success('Pendaftaran ditolak & notifikasi WA dikirim.');
      setExpandedRegId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `residentRegistrations/${reg.id}`);
      toast.error('Gagal menolak pendaftaran.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Immersive Lightbox Image Portal */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col justify-center items-center p-4"
          >
            <div className="absolute top-6 left-6 text-white">
              <h4 className="text-[10px] font-black tracking-widest uppercase text-slate-400">Pratinjau Dokumen</h4>
              <p className="text-lg font-bold">{lightboxImage.title}</p>
            </div>
            
            <button 
              onClick={() => setLightboxImage(null)}
              className="absolute top-6 right-6 w-11 h-11 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl flex items-center justify-center text-white transition-all active:scale-95"
            >
              <X size={18} />
            </button>

            {/* Warning Banner if Document is a Dummy Placeholder */}
            {lightboxImage.isPlaceholder && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="mb-4 max-w-2xl w-full bg-amber-500/20 border border-amber-500/40 backdrop-blur-md rounded-2xl p-4 text-amber-200 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg"
              >
                <div className="flex items-center gap-3 text-left">
                  <AlertTriangle size={24} className="text-amber-400 shrink-0" />
                  <div>
                    <strong className="block text-amber-300 font-bold text-sm">Dokumen Ini Gambar Dummy / Placeholder Acak</strong>
                    <span className="text-[11px] text-amber-250 opacity-90 leading-relaxed">
                      Pemohon gagal mengunggah dokumen fisik asli ke server saat mendaftar. Mohon jangan disetujui dahulu sebelum memverifikasi foto asli via WhatsApp.
                    </span>
                  </div>
                </div>
                {lightboxImage.phone && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(
                        `https://wa.me/${lightboxImage.phone?.replace(/^0/, '62')}?text=${encodeURIComponent(`Halo Bapak/Ibu ${lightboxImage.applicantName || ''}, terkait pendaftaran warga di Teras Warga RT 002, foto KTP/KK Anda belum terunggah dengan jelas di sistem. Mohon kirimkan foto asli fisik KTP & KK via chat WhatsApp ini untuk verifikasi. Terima kasih!`)}`,
                        '_blank'
                      );
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow transition-all active:scale-95"
                  >
                    <Phone size={13} /> Minta Foto via WA
                  </button>
                )}
              </div>
            )}

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl max-h-[80vh] bg-white p-1 rounded-2xl shadow-xl overflow-hidden relative group"
            >
              <img 
                src={lightboxImage.url} 
                alt={lightboxImage.title}
                className="max-h-[75vh] object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleDownloadDoc(lightboxImage.url, lightboxImage.title)}
                  className="px-3.5 py-2 bg-slate-900/90 hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-md flex items-center gap-1.5 transition-all"
                  title="Unduh Berkas ke Komputer"
                >
                  <Download size={12} /> Unduh
                </button>
                <button 
                  onClick={() => handleOpenDocInNewTab(lightboxImage.url)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-md flex items-center gap-1.5 transition-all"
                >
                  <ExternalLink size={12} /> Buka Tab Baru
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Executive KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Pending */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-amber-50/40 to-white border border-amber-200/80 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md hover:border-amber-300">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 block">
                Menunggu Verifikasi
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">{totalPending}</span>
                <span className="text-xs font-bold text-slate-400">Berkas</span>
              </div>
              <p className="text-[11px] text-amber-900/80 font-medium">Perlu ditinjau &amp; diverifikasi RT</p>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Clock size={22} className="stroke-[2.5]" />
              </div>
              {totalPending > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                </span>
              )}
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-amber-200/60 flex items-center justify-between text-[10px] font-bold">
            <span className="text-amber-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Prioritas Verifikasi
            </span>
            <span className="text-slate-400 font-medium">{totalPending > 0 ? 'Segera respon pemohon' : 'Semua berkas tuntas'}</span>
          </div>
        </div>

        {/* Card 2: Approved */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-emerald-50/40 to-white border border-emerald-200/80 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md hover:border-emerald-300">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 block">
                Telah Disetujui
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">{totalApproved}</span>
                <span className="text-xs font-bold text-slate-400">Warga</span>
              </div>
              <p className="text-[11px] text-emerald-900/80 font-medium">Aktif di database resmi RT 002</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <UserCheck size={22} className="stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-[10px] font-bold">
            <span className="text-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Data Terverifikasi
            </span>
            <span className="text-slate-400 font-medium">Sinkron ke Sensus &amp; Peta</span>
          </div>
        </div>

        {/* Card 3: Rejected */}
        <div className="relative overflow-hidden bg-gradient-to-br from-rose-500/10 via-rose-50/40 to-white border border-rose-200/80 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md hover:border-rose-300">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-700 block">
                Permohonan Ditolak
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">{totalRejected}</span>
                <span className="text-xs font-bold text-slate-400">Berkas</span>
              </div>
              <p className="text-[11px] text-rose-900/80 font-medium">Berkas tidak memenuhi syarat</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/25">
              <XCircle size={22} className="stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-rose-200/60 flex items-center justify-between text-[10px] font-bold">
            <span className="text-rose-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Arsip Riwayat
            </span>
            <span className="text-slate-400 font-medium">Notifikasi WA terkirim</span>
          </div>
        </div>
      </div>

      {/* Filter and Local search control drawer - Sleek & Modern */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
        {/* Status segmented filters */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'All', label: 'Semua Berkas', count: residentRegistrations.length },
            { id: 'Pending', label: 'Menunggu', count: totalPending, alert: totalPending > 0 },
            { id: 'Approved', label: 'Disetujui', count: totalApproved },
            { id: 'Rejected', label: 'Ditolak', count: totalRejected },
          ].map((status) => {
            const isSel = filterStatus === status.id;
            return (
              <button
                key={status.id}
                onClick={() => { setFilterStatus(status.id as any); setExpandedRegId(null); }}
                className={`flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex-1 md:flex-none whitespace-nowrap cursor-pointer ${
                  isSel 
                    ? 'bg-white shadow-xs text-slate-900' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                {status.alert && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                <span>{status.label}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                  isSel ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {status.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Localized search input box */}
        <div className="relative w-full md:max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, NIK, No. KK, blok..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400 transition-all shadow-2xs"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Request Cards Content */}
      <div className="space-y-3.5">
        {filteredRegistrations.length > 0 ? (
          filteredRegistrations.map((reg) => {
            const isExpanded = expandedRegId === reg.id;
            const regDate = reg.date ? new Date(reg.date) : new Date();
            const hasDemographics = reg.pregnantCount || reg.babyCount || reg.toddlerCount || reg.elderlyCount || reg.widowCount || reg.isDisability || reg.isOrphan;
            const hasBansos = reg.isPKH || reg.isBLT || reg.isBPNT || reg.isBansosLain;
            const isPending = reg.approvalStatus === 'Pending' || reg.approvalStatus === 'Menunggu';
            const isApproved = reg.approvalStatus === 'Approved' || reg.approvalStatus === 'Disetujui';
            const isRejected = reg.approvalStatus === 'Rejected' || reg.approvalStatus === 'Ditolak';

            return (
              <div 
                key={reg.id} 
                className={`bg-white border transition-all rounded-2xl overflow-hidden ${
                  isExpanded 
                    ? 'border-indigo-500/80 shadow-md ring-2 ring-indigo-500/10' 
                    : isPending 
                      ? 'border-amber-200 hover:border-amber-300 shadow-xs' 
                      : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Core Header Row */}
                <div 
                  onClick={() => toggleExpanded(reg.id)}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 cursor-pointer transition-colors select-none ${
                    isExpanded ? 'bg-indigo-50/20' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex gap-4 items-center min-w-0">
                    {/* Modern Avatar */}
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                      isPending 
                        ? 'bg-amber-100 text-amber-700 border border-amber-300' 
                        : isApproved 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                          : 'bg-rose-100 text-rose-700 border border-rose-300'
                    }`}>
                      {reg.headOfFamily ? reg.headOfFamily.substring(0, 2).toUpperCase() : 'WG'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-black text-slate-900 text-base tracking-tight truncate">{reg.headOfFamily}</h4>
                        
                        {/* Status Verification Pill */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                          isPending 
                            ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                            : isApproved 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {isPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />}
                          {isPending ? 'Menunggu Persetujuan' : isApproved ? '✓ Disetujui' : '✕ Ditolak'}
                        </span>

                        {/* Status Hunian Pill */}
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                          reg.residenceType === 'Sewa'
                            ? 'bg-teal-50 text-teal-800 border-teal-200'
                            : reg.residenceType === 'Rumah Keluarga'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {reg.residenceType === 'Sewa' ? '🏢 Hunian Sewa / Kontrak' : reg.residenceType === 'Rumah Keluarga' ? '🏠 Rumah Keluarga' : '🏠 Rumah Milik Sendiri'}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-semibold mt-1">
                        <span className="flex items-center gap-1 text-slate-700 font-bold">
                          <MapPin size={12} className="text-indigo-600" />
                          Blok {reg.block} - No. {reg.number}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1">
                          <Users size={12} className="text-slate-400" /> {reg.occupants || 1} Jiwa
                        </span>
                        {reg.nik && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="font-mono text-slate-400 text-[11px]">
                              NIK: {reg.nik}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 font-mono">
                      {regDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const greeting = encodeURIComponent(`Halo Bapak/Ibu ${reg.headOfFamily}, saya pengurus RT 002 Huntap Tondo 2 terkait permohonan pendaftaran warga baru Anda di Kavling Blok ${reg.block}-${reg.number}...`);
                          window.open(`https://wa.me/${reg.phone.replace(/^0/, '62')}?text=${greeting}`, '_blank');
                        }}
                        className="p-2 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-emerald-600 rounded-xl transition-all active:scale-95 shadow-2xs"
                        title="Hubungi via WhatsApp"
                      >
                        <Phone size={14} className="stroke-[2.5]" />
                      </button>
                      
                      <div className={`p-2 rounded-xl border transition-all ${
                        isExpanded ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed Grid */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-slate-200 bg-slate-50/50"
                    >
                      <div className="p-4 sm:p-6 space-y-6">

                        {/* SECTION 1: IDENTITAS RESMI & DUKCAPIL KEPALA KELUARGA */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                <FileCheck size={16} />
                              </div>
                              <div>
                                <h5 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                  1. Identitas Resmi Kepala Keluarga (Data Dukcapil)
                                </h5>
                                <p className="text-[10px] text-slate-400 font-medium">Validasi identitas kependudukan kepala keluarga pemohon</p>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">
                              {reg.maritalStatus || 'Status Nikah -'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                            {/* NIK Card with Copy */}
                            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between group">
                              <div>
                                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">NIK KTP</span>
                                <span className="block text-xs font-mono font-bold text-slate-900 mt-0.5">{reg.nik || '-'}</span>
                              </div>
                              {reg.nik && (
                                <button
                                  onClick={() => handleCopy(reg.nik!, 'NIK')}
                                  className="p-1.5 hover:bg-white text-slate-400 hover:text-indigo-600 rounded-lg border border-transparent hover:border-slate-200 transition-all opacity-80 group-hover:opacity-100"
                                  title="Salin NIK"
                                >
                                  <Copy size={13} />
                                </button>
                              )}
                            </div>

                            {/* No KK Card with Copy */}
                            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between group">
                              <div>
                                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Nomor KK</span>
                                <span className="block text-xs font-mono font-bold text-slate-900 mt-0.5">{reg.kkNumber || '-'}</span>
                              </div>
                              {reg.kkNumber && (
                                <button
                                  onClick={() => handleCopy(reg.kkNumber!, 'Nomor KK')}
                                  className="p-1.5 hover:bg-white text-slate-400 hover:text-indigo-600 rounded-lg border border-transparent hover:border-slate-200 transition-all opacity-80 group-hover:opacity-100"
                                  title="Salin No. KK"
                                >
                                  <Copy size={13} />
                                </button>
                              )}
                            </div>

                            {/* Tempat, Tanggal Lahir & Usia */}
                            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Tempat / Tanggal Lahir</span>
                              <span className="block text-xs font-bold text-slate-900 mt-0.5 truncate">
                                {reg.birthPlace ? `${reg.birthPlace}, ` : ''}
                                {reg.birthDate ? new Date(reg.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                              </span>
                              <span className="text-[10px] font-black text-indigo-600 block mt-0.5">
                                Usia: {calculateAge(reg.birthDate)}
                              </span>
                            </div>

                            {/* Jenis Kelamin & Gol Darah */}
                            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Gender &amp; Gol. Darah</span>
                              <span className="block text-xs font-bold text-slate-900 mt-0.5">
                                {reg.gender || '-'} {reg.bloodType && reg.bloodType !== '-' ? `(Gol. ${reg.bloodType})` : ''}
                              </span>
                            </div>

                            {/* Agama */}
                            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Agama</span>
                              <span className="block text-xs font-bold text-slate-900 mt-0.5">{reg.religion || 'Islam'}</span>
                            </div>

                            {/* Pendidikan Terakhir */}
                            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Pendidikan Terakhir</span>
                              <span className="block text-xs font-bold text-slate-900 mt-0.5">{reg.education || '-'}</span>
                            </div>

                            {/* Pekerjaan / Profesi */}
                            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Pekerjaan / Profesi</span>
                              <span className="block text-xs font-bold text-slate-900 mt-0.5">{reg.jobCategory || '-'}</span>
                            </div>

                            {/* Jaminan Kesehatan BPJS */}
                            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Jaminan Kesehatan</span>
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                reg.bpjsStatus && reg.bpjsStatus !== 'Tidak Ada'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}>
                                BPJS: {reg.bpjsStatus || 'Tidak Ada'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* SECTION 2: DOMISILI, HUNIAN & STATUS KEPEMILIKAN */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                              <Building size={16} />
                            </div>
                            <div>
                              <h5 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                2. Domisili, Status Hunian &amp; Aset Lingkungan
                              </h5>
                              <p className="text-[10px] text-slate-400 font-medium">Informasi kepenghunian rumah dan kendaraan di lingkungan RT 002</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                            {/* Alamat Unit Rumah */}
                            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Alamat Kavling</span>
                              <span className="block text-sm font-black text-indigo-900 mt-0.5">
                                Blok {reg.block} - No. {reg.number}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Huntap Tondo 2 RT 002</span>
                            </div>

                            {/* Status Hak Tempat Tinggal */}
                            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Status Hak Hunian</span>
                              <span className="block text-xs font-bold text-slate-900 mt-0.5">
                                {reg.residenceType === 'Sewa' ? 'Sewa / Kontrak' : reg.residenceType === 'Rumah Keluarga' ? 'Rumah Keluarga / Kerabat' : 'Hak Milik Pribadi'}
                              </span>
                              <span className="text-[10px] font-bold text-teal-700 block mt-0.5">
                                {reg.residenceType === 'Sewa' ? 'Sinkron ke Buku Kontrak Sewa' : reg.residenceType === 'Rumah Keluarga' ? 'Non-Komersial' : 'Warga Tetap'}
                              </span>
                            </div>

                            {/* Nama Pemilik Rumah Asli */}
                            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                {reg.residenceType === 'Sewa' ? 'Pemilik Asli (Induk Semang)' : reg.residenceType === 'Rumah Keluarga' ? 'Pemilik (Keluarga)' : 'Pemilik Rumah'}
                              </span>
                              {reg.residenceType === 'Sewa' ? (
                                reg.ownerName && reg.ownerName !== reg.headOfFamily ? (
                                  <span className="block text-xs font-bold text-slate-900 mt-0.5">{reg.ownerName}</span>
                                ) : (
                                  <span className="block text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-1">
                                    Belum Diisi (Perlu Konfirmasi)
                                  </span>
                                )
                              ) : (
                                <span className="block text-xs font-bold text-slate-900 mt-0.5">
                                  {reg.ownerName || reg.headOfFamily}
                                </span>
                              )}
                            </div>

                            {/* Kepemilikan Kendaraan */}
                            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Kendaraan Terparkir</span>
                              <span className="block text-xs font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                                <Car size={13} className="text-slate-500" />
                                {reg.vehicleCount || (Number(reg.twoWheelCount || 0) + Number(reg.fourWheelCount || 0))} Unit Total
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                                Motor: {reg.twoWheelCount || 0} • Mobil: {reg.fourWheelCount || 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* SECTION 3: BANTUAN SOSIAL & INDIKATOR KERENTANAN */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                              <Heart size={16} />
                            </div>
                            <div>
                              <h5 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                3. Bantuan Sosial &amp; Indikator Kerentanan
                              </h5>
                              <p className="text-[10px] text-slate-400 font-medium">Pemeriksaan profil kesejahteraan sosial &amp; kelompok rentan untuk posyandu/bansos</p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {/* Bansos Badges */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">Status Bansos:</span>
                              {hasBansos ? (
                                <>
                                  {reg.isPKH && <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-black">PKH Aktif</span>}
                                  {reg.isBLT && <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-black">BLT Aktif</span>}
                                  {reg.isBPNT && <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-black">BPNT Aktif</span>}
                                  {reg.isBansosLain && <span className="px-2.5 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded-lg text-[10px] font-black">{reg.bansosLainName || 'Bansos Lain'}</span>}
                                </>
                              ) : (
                                <span className="px-2.5 py-0.8 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold">
                                  Bukan Penerima Bansos (Mandiri)
                                </span>
                              )}
                            </div>

                            {/* Demographics indicators */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">Kelompok Rentan:</span>
                              {hasDemographics ? (
                                <>
                                  {!!reg.pregnantCount && (
                                    <div className="flex items-center gap-1 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[10px] font-bold">
                                      <Heart size={12} className="stroke-[2.5]" /> Ibu Hamil: {reg.pregnantCount}
                                    </div>
                                  )}
                                  {!!reg.babyCount && (
                                    <div className="flex items-center gap-1 px-3 py-1 bg-sky-50 border border-sky-200 text-sky-700 rounded-lg text-[10px] font-bold">
                                      <Baby size={12} className="stroke-[2.5]" /> Bayi (0-1 Th): {reg.babyCount}
                                    </div>
                                  )}
                                  {!!reg.toddlerCount && (
                                    <div className="flex items-center gap-1 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold">
                                      <Smile size={12} className="stroke-[2.5]" /> Balita: {reg.toddlerCount}
                                    </div>
                                  )}
                                  {!!reg.elderlyCount && (
                                    <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-[10px] font-bold">
                                      <Accessibility size={12} className="stroke-[2.5]" /> Lansia: {reg.elderlyCount}
                                    </div>
                                  )}
                                  {reg.isDisability && (
                                    <div className="flex items-center gap-1 px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-[10px] font-bold">
                                      Disabilitas
                                    </div>
                                  )}
                                  {reg.isOrphan && (
                                    <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-[10px] font-bold">
                                      Yatim / Piatu
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.8 border border-emerald-200 rounded-lg flex items-center gap-1">
                                  <Check size={11} /> Keluarga Sehat &bull; Tidak Ada Anggota Rentan Khusus
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* SECTION 4: ANGGOTA KELUARGA TERLAMPIR */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <Users size={16} />
                              </div>
                              <div>
                                <h5 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                  4. Daftar Anggota Keluarga Terlampir ({reg.familyMembers?.length || 0} Jiwa)
                                </h5>
                                <p className="text-[10px] text-slate-400 font-medium">Rincian anggota keluarga yang didaftarkan bersama kepala keluarga</p>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold font-mono">
                              Total: {(reg.familyMembers?.length || 0) + 1} Jiwa
                            </span>
                          </div>

                          {reg.familyMembers && reg.familyMembers.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse min-w-[550px]">
                                <thead>
                                  <tr className="border-b border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="pb-2.5">Nama Lengkap</th>
                                    <th className="pb-2.5">Hubungan</th>
                                    <th className="pb-2.5">Gender</th>
                                    <th className="pb-2.5">Pekerjaan</th>
                                    <th className="pb-2.5">NIK Kependudukan</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                                  {reg.familyMembers.map((member, mIdx) => (
                                    <tr key={mIdx} className="hover:bg-slate-50 transition-colors">
                                      <td className="py-3 text-slate-900 font-bold">{member.name}</td>
                                      <td className="py-3">
                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-bold">
                                          {member.relation}
                                        </span>
                                      </td>
                                      <td className="py-3 text-slate-500">{member.gender}</td>
                                      <td className="py-3 text-slate-500">{member.job || '-'}</td>
                                      <td className="py-3 font-mono text-slate-600 text-[11px]">
                                        {member.nik || '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium space-y-1">
                              <User size={24} className="mx-auto text-slate-300 stroke-[1.5]" />
                              <p className="font-bold text-slate-600">Tinggal Sendiri (Mandiri)</p>
                              <p className="text-[11px]">Pemohon mendaftarkan diri sendiri sebagai kepala keluarga tunggal tanpa anggota keluarga tambahan.</p>
                            </div>
                          )}
                        </div>

                        {/* SECTION 5: DOKUMEN IDENTITAS LAMPIRAN (KTP & KK) */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                              <ClipboardList size={16} />
                            </div>
                            <div>
                              <h5 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                5. Dokumen Lampiran Fisik (KTP &amp; KK)
                              </h5>
                              <p className="text-[10px] text-slate-400 font-medium">Verifikasi foto dokumen asli kepala keluarga pemohon</p>
                            </div>
                          </div>

                          {(() => {
                            const isKtpPlaceholder = !!reg.ktpUrl && reg.ktpUrl.includes('picsum.photos');
                            const isKkPlaceholder = !!reg.kkUrl && reg.kkUrl.includes('picsum.photos');

                            return (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* KTP Card */}
                                <div className={`p-4 rounded-2xl border transition-all ${
                                  isKtpPlaceholder 
                                    ? 'bg-amber-50/70 border-amber-300 shadow-xs' 
                                    : reg.ktpUrl 
                                      ? 'bg-emerald-50/40 border-emerald-200' 
                                      : 'bg-slate-50 border-slate-200'
                                }`}>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                      <div className={`p-3 rounded-xl shrink-0 ${
                                        isKtpPlaceholder 
                                          ? 'bg-amber-100 text-amber-700' 
                                          : reg.ktpUrl 
                                            ? 'bg-emerald-100 text-emerald-700' 
                                            : 'bg-slate-200 text-slate-500'
                                      }`}>
                                        <FileText size={20} />
                                      </div>
                                      <div>
                                        <h6 className="text-xs font-black text-slate-900">KTP Kepala Keluarga</h6>
                                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">Identitas e-KTP Pemohon</p>
                                        <div className="mt-2">
                                          {reg.ktpUrl ? (
                                            isKtpPlaceholder ? (
                                              <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1.5">
                                                <AlertTriangle size={10} className="text-amber-600" />
                                                Gagal Unggah (Placeholder Dummy)
                                              </span>
                                            ) : (
                                              <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1.5">
                                                <CheckCircle size={11} className="text-emerald-600" />
                                                Dokumen Asli Tersedia
                                              </span>
                                            )
                                          ) : (
                                            <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                                              Tidak Ada Berkas
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {reg.ktpUrl && (
                                      <div className="flex flex-col gap-1.5">
                                        <button 
                                          onClick={() => setLightboxImage({ 
                                            url: reg.ktpUrl!, 
                                            title: `KTP - ${reg.headOfFamily}`,
                                            isPlaceholder: isKtpPlaceholder,
                                            phone: reg.phone,
                                            applicantName: reg.headOfFamily
                                          })}
                                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                                            isKtpPlaceholder 
                                              ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                          }`}
                                        >
                                          <Eye size={12} /> Pratinjau
                                        </button>
                                        <button 
                                          onClick={() => handleOpenDocInNewTab(reg.ktpUrl!)}
                                          className="px-3 py-1 hover:bg-white text-slate-600 border border-slate-200 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                                          title="Buka di Tab Baru"
                                        >
                                          <ExternalLink size={11} /> Tab Baru
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {isKtpPlaceholder && (
                                    <div className="mt-3 pt-3 border-t border-amber-200/80 flex items-center justify-between text-[11px] text-amber-900">
                                      <span>Minta foto asli fisik KTP langsung ke pemohon:</span>
                                      <button
                                        onClick={() => {
                                          const msg = encodeURIComponent(`Halo Bpk/Ibu ${reg.headOfFamily}, mohon kirimkan foto asli fisik KTP Anda melalui WhatsApp ini untuk verifikasi pendaftaran warga di RT 002 Huntap Tondo 2. Terima kasih!`);
                                          window.open(`https://wa.me/${reg.phone.replace(/^0/, '62')}?text=${msg}`, '_blank');
                                        }}
                                        className="text-[10px] font-black text-emerald-700 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg border border-emerald-300 transition-all flex items-center gap-1"
                                      >
                                        <Phone size={10} /> Chat WA
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* KK Card */}
                                <div className={`p-4 rounded-2xl border transition-all ${
                                  isKkPlaceholder 
                                    ? 'bg-amber-50/70 border-amber-300 shadow-xs' 
                                    : reg.kkUrl 
                                      ? 'bg-emerald-50/40 border-emerald-200' 
                                      : 'bg-slate-50 border-slate-200'
                                }`}>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                      <div className={`p-3 rounded-xl shrink-0 ${
                                        isKkPlaceholder 
                                          ? 'bg-amber-100 text-amber-700' 
                                          : reg.kkUrl 
                                            ? 'bg-emerald-100 text-emerald-700' 
                                            : 'bg-slate-200 text-slate-500'
                                      }`}>
                                        <ClipboardList size={20} />
                                      </div>
                                      <div>
                                        <h6 className="text-xs font-black text-slate-900">Kartu Keluarga (KK)</h6>
                                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">Berkas KK Warga Pemohon</p>
                                        <div className="mt-2">
                                          {reg.kkUrl ? (
                                            isKkPlaceholder ? (
                                              <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1.5">
                                                <AlertTriangle size={10} className="text-amber-600" />
                                                Gagal Unggah (Placeholder Dummy)
                                              </span>
                                            ) : (
                                              <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1.5">
                                                <CheckCircle size={11} className="text-emerald-600" />
                                                Dokumen Asli Tersedia
                                              </span>
                                            )
                                          ) : (
                                            <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                                              Tidak Ada Berkas
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {reg.kkUrl && (
                                      <div className="flex flex-col gap-1.5">
                                        <button 
                                          onClick={() => setLightboxImage({ 
                                            url: reg.kkUrl!, 
                                            title: `Kartu Keluarga - ${reg.headOfFamily}`,
                                            isPlaceholder: isKkPlaceholder,
                                            phone: reg.phone,
                                            applicantName: reg.headOfFamily
                                          })}
                                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                                            isKkPlaceholder 
                                              ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                          }`}
                                        >
                                          <Eye size={12} /> Pratinjau
                                        </button>
                                        <button 
                                          onClick={() => handleOpenDocInNewTab(reg.kkUrl!)}
                                          className="px-3 py-1 hover:bg-white text-slate-600 border border-slate-200 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                                          title="Buka di Tab Baru"
                                        >
                                          <ExternalLink size={11} /> Tab Baru
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {isKkPlaceholder && (
                                    <div className="mt-3 pt-3 border-t border-amber-200/80 flex items-center justify-between text-[11px] text-amber-900">
                                      <span>Minta foto asli fisik KK langsung ke pemohon:</span>
                                      <button
                                        onClick={() => {
                                          const msg = encodeURIComponent(`Halo Bpk/Ibu ${reg.headOfFamily}, mohon kirimkan foto asli fisik Kartu Keluarga (KK) Anda melalui WhatsApp ini untuk verifikasi pendaftaran warga di RT 002 Huntap Tondo 2. Terima kasih!`);
                                          window.open(`https://wa.me/${reg.phone.replace(/^0/, '62')}?text=${msg}`, '_blank');
                                        }}
                                        className="text-[10px] font-black text-emerald-700 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg border border-emerald-300 transition-all flex items-center gap-1"
                                      >
                                        <Phone size={10} /> Chat WA
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* SECTION 6: EXECUTIVE VERIFICATION ACTION CONTROLS */}
                        {isPending ? (
                          <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row gap-3 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                            <div className="flex items-center gap-2.5 text-slate-600 text-xs">
                              <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                                <Info size={14} />
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 block">Konfirmasi Terlebih Dahulu Sebelum Menyetujui</span>
                                <span className="text-[11px] text-slate-400">Pastikan NIK, No. KK, dan berkas fisik sudah terverifikasi kebenarannya.</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  const greeting = encodeURIComponent(`Halo Bapak/Ibu ${reg.headOfFamily}, kami dari Pengurus RT 002 ingin mengonfirmasi pendaftaran warga baru Anda di Blok ${reg.block}-${reg.number}...`);
                                  window.open(`https://wa.me/${reg.phone.replace(/^0/, '62')}?text=${greeting}`, '_blank');
                                }}
                                className="px-4 py-2.5 border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Phone size={13} /> Chat WhatsApp
                              </button>

                              <button
                                disabled={actionLoadingId === reg.id}
                                onClick={() => handleReject(reg)}
                                className={`px-4 py-2.5 border border-rose-200 text-rose-600 bg-rose-50/70 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                                  actionLoadingId === reg.id ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                {actionLoadingId === reg.id ? 'Memproses...' : 'Tolak Berkas'}
                              </button>
                              
                              <button
                                disabled={actionLoadingId === reg.id}
                                onClick={() => handleApprove(reg)}
                                className={`px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer ${
                                  actionLoadingId === reg.id ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                <CheckCircle size={15} />
                                <span>{actionLoadingId === reg.id ? 'Menerbitkan Data...' : 'Setujui & Daftarkan Resmi'}</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-3 border-t border-slate-200 flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80">
                            <span className="text-xs text-slate-500 font-medium">Status Permohonan:</span>
                            <div className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}>
                              {isApproved ? (
                                <>
                                  <CheckCheck size={14} className="text-emerald-700" />
                                  <span>Telah Terdaftar Resmi di RT 002</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle size={14} className="text-rose-700" />
                                  <span>Permohonan Ditolak Pengurus</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 p-8 space-y-3 shadow-xs">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <Search size={22} />
            </div>
            <h5 className="font-black text-slate-800 text-base">Tidak Ada Berkas Pendaftaran Ditemukan</h5>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {localSearch ? `Tidak ada data yang cocok dengan pencarian "${localSearch}". Coba kata kunci lain.` : 'Belum ada warga yang mengajukan pendaftaran pada filter ini.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};