import React, { useState } from 'react';
import { 
  User, Phone, ChevronDown, ChevronUp, Eye, Check, X, Users, Heart, 
  GraduationCap, Briefcase, Calendar, ShieldCheck, MapPin, FileText, 
  Info, CheckCircle, Search, Baby, Smile, Accessibility, ExternalLink,
  ClipboardList, AlertTriangle, Building, LayoutGrid
} from 'lucide-react';
import { ResidentRegistration, PaymentStatus, House } from '../../../types';
import { toast } from 'sonner';
import { useConfirm } from '../../../context/ConfirmContext';
import { formatHouseId, handleFirestoreError, OperationType } from '../../../services/databaseService';
import { motion, AnimatePresence } from 'motion/react';

interface ResidentRegistrationListProps {
  residentRegistrations: ResidentRegistration[];
  searchTerm: string;
  updateResidentRegistrationInDb: (id: string, data: Partial<ResidentRegistration>) => Promise<void>;
  addHouse: (house: Omit<House, 'id'>) => Promise<void>;
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
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

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
      title: 'Setujui Pendaftaran',
      message: `Apakah Anda yakin ingin menyetujui pendaftaran ${reg.headOfFamily}? Data warga akan otomatis ditambahkan ke sistem utama dan status hunian Blok ${reg.block} - No. ${reg.number} akan diperbarui.`,
      confirmLabel: 'Setujui & Daftarkan',
    });

    if (!isConfirmed) return;

    setActionLoadingId(reg.id);
    try {
      // 1. Add to houses database
      await addHouse({
        headOfFamily: reg.headOfFamily,
        gender: reg.gender,
        birthDate: reg.birthDate,
        ownerName: reg.ownerName || reg.headOfFamily,
        block: reg.block,
        number: reg.number,
        phone: reg.phone,
        status: reg.status || 'Occupied',
        residenceType: reg.residenceType || 'Tetap',
        occupants: reg.occupants || 1,
        education: reg.education || '',
        jobCategory: reg.jobCategory || '',
        vehicleCount: reg.vehicleCount || 0,
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
        isPKH: reg.isPKH || false,
        isBLT: reg.isBLT || false,
        isBansosLain: reg.isBansosLain || false,
        bansosLainName: reg.bansosLainName || '',
        childCount: reg.childCount || 0,
      } as any);
      
      // 2. Update registration status to approved
      await updateResidentRegistrationInDb(reg.id, { approvalStatus: 'Approved' });
      
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
            kkNumber: '-',
            jobCategory: reg.jobCategory || '-',
            education: reg.education || '-'
          }
        });
      }
      
      toast.success('Pendaftaran Disetujui!', {
        description: `Warga atas nama ${reg.headOfFamily} berhasil didaftarkan.`
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
      toast.success('Pendaftaran ditolak.');
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
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <a 
                  href={lightboxImage.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-md flex items-center gap-1.5"
                >
                  <ExternalLink size={12} /> Buka Tab Baru
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Bento Grid Header - Simplified & Ultra-Professional */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Menunggu Persetujuan', value: totalPending, desc: 'Berkas perlu diverifikasi', color: 'border-slate-200 bg-white text-slate-900', badgeColor: 'bg-amber-100/80 text-amber-600 border-amber-200' },
          { label: 'Telah Disetujui', value: totalApproved, desc: 'Ditambahkan ke database', color: 'border-slate-200 bg-white text-slate-900', badgeColor: 'bg-emerald-100/80 text-emerald-600 border-emerald-200' },
          { label: 'Berkas Ditolak', value: totalRejected, desc: 'Ditolak/belum memenuhi syarat', color: 'border-slate-200 bg-white text-slate-900', badgeColor: 'bg-rose-100/80 text-rose-600 border-rose-200' },
        ].map((stat, i) => (
          <div key={i} className={`p-5 bg-white border ${stat.color} rounded-2xl shadow-xs flex items-center justify-between`}>
            <div>
              <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</span>
              <span className="block text-3xl font-black mt-1 tracking-tight">{stat.value}</span>
              <span className="block text-[10px] text-slate-400 font-medium mt-0.5">{stat.desc}</span>
            </div>
            <div className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${stat.badgeColor}`}>
              {stat.value} Berkas
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Local search control drawer - Modern, compact and flat */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
        {/* Status segmented filters - Fine styled */}
        <div className="flex bg-slate-100/80 p-0.5 rounded-lg w-full md:w-auto">
          {[
            { id: 'All', label: 'Semua', count: residentRegistrations.length },
            { id: 'Pending', label: 'Tertunda', count: totalPending },
            { id: 'Approved', label: 'Disetujui', count: totalApproved },
            { id: 'Rejected', label: 'Ditolak', count: totalRejected },
          ].map((status) => {
            const isSel = filterStatus === status.id;
            return (
              <button
                key={status.id}
                onClick={() => { setFilterStatus(status.id as any); setExpandedRegId(null); }}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all flex-1 md:flex-none ${
                  isSel ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>{status.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-mono ${isSel ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/60 text-slate-500'}`}>
                  {status.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Localized search input box */}
        <div className="relative w-full md:max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, blok, nomor..."
            className="w-full pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white outline-none focus:ring-1 focus:ring-slate-400 placeholder:text-slate-400 transition-all"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Request Cards Content */}
      <div className="space-y-3">
        {filteredRegistrations.length > 0 ? (
          filteredRegistrations.map((reg) => {
            const isExpanded = expandedRegId === reg.id;
            const regDate = reg.date ? new Date(reg.date) : new Date();
            const hasDemographics = reg.pregnantCount || reg.babyCount || reg.toddlerCount || reg.elderlyCount;
            
            return (
              <div 
                key={reg.id} 
                className={`bg-white border transition-all rounded-xl ${
                  isExpanded ? 'border-indigo-500/80 shadow-xs ring-1 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Core Quick Row - Simplified for quick glance */}
                <div 
                  onClick={() => toggleExpanded(reg.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer hover:bg-slate-50/40 select-none"
                >
                  <div className="flex gap-3.5 items-center">
                    <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                      <User size={16} className="stroke-[2]" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="font-bold text-slate-800 text-sm tracking-tight">{reg.headOfFamily}</h4>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          reg.approvalStatus === 'Pending' || reg.approvalStatus === 'Menunggu' ? 'bg-amber-100 text-amber-700' :
                          reg.approvalStatus === 'Approved' || reg.approvalStatus === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {reg.approvalStatus === 'Pending' || reg.approvalStatus === 'Menunggu' ? 'Pending' : 
                           reg.approvalStatus === 'Approved' || reg.approvalStatus === 'Disetujui' ? 'Disetujui' : 'Ditolak'}
                        </span>
                        
                        <span className="px-1.5 py-0.2 bg-slate-100 border border-slate-200 text-slate-600 rounded text-[9px] font-bold">
                          {reg.residenceType || 'Tetap'}
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-1 flex items-center gap-2">
                        <MapPin size={10} className="text-slate-400" />
                        Blok {reg.block} - No. {reg.number}
                        <span className="text-slate-300">•</span>
                        <Users size={10} className="inline" /> {reg.occupants || 1} Anggota
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto sm:self-center justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-150">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      {regDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://wa.me/${reg.phone.replace(/^0/, '62')}`, '_blank');
                        }}
                        className="p-1.5 hover:bg-slate-100 border border-slate-200 text-emerald-600 rounded-lg transition-all active:scale-95"
                        title="Hubungi via WhatsApp"
                      >
                        <Phone size={13} className="stroke-[2]" />
                      </button>
                      
                      <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
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
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-250 bg-slate-50/50"
                    >
                      <div className="p-4 sm:p-5 space-y-5">
                        
                        {/* 1. Profile Metrics Grid - Simplified & Compact */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Informasi Utama Kepala Keluarga</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { label: 'Jenis Kelamin', value: reg.gender, icon: User },
                              { label: 'Tanggal Lahir', value: reg.birthDate ? new Date(reg.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-', icon: Calendar },
                              { label: 'Pekerjaan', value: reg.jobCategory || '-', icon: Briefcase },
                              { label: 'Pendidikan', value: reg.education || '-', icon: GraduationCap },
                              { label: 'Agama', value: reg.religion || '-', icon: Building },
                              { label: 'Pemilik Rumah', value: reg.ownerName || reg.headOfFamily, icon: MapPin },
                              { label: 'Nomor Telp', value: reg.phone, icon: Phone },
                              { label: 'Kendaraan', value: `${reg.vehicleCount || 0} Unit`, icon: LayoutGrid },
                            ].map((item, id) => (
                              <div key={id} className="p-2.5 bg-slate-50/50 rounded-lg border border-slate-100">
                                <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                                <span className="block text-xs font-semibold text-slate-700 mt-0.5 truncate">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 2. Demographics Indicators */}
                        {hasDemographics ? (
                          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Indikator Kerentanan & Kesehatan</label>
                            <div className="flex flex-wrap gap-2">
                              {!!reg.pregnantCount && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                  <Heart size={12} className="stroke-[2.5]" /> Ibu Hamil: {reg.pregnantCount}
                                </div>
                              )}
                              {!!reg.babyCount && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-sky-50 border border-sky-100 text-sky-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                  <Baby size={12} className="stroke-[2.5]" /> Bayi (0-1 Th): {reg.babyCount}
                                </div>
                              )}
                              {!!reg.toddlerCount && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                  <Smile size={12} className="stroke-[2.5]" /> Balita: {reg.toddlerCount}
                                </div>
                              )}
                              {!!reg.elderlyCount && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 text-amber-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                  <Accessibility size={12} className="stroke-[2.5]" /> Lansia: {reg.elderlyCount}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null}

                        {/* 3. Family Members Table - Sleek list */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Daftar Anggota Keluarga Terlampir ({reg.familyMembers?.length || 0} Jiwa)</label>

                          {reg.familyMembers && reg.familyMembers.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse min-w-[500px]">
                                <thead>
                                  <tr className="border-b border-slate-100 text-[8px] font-black text-slate-450 uppercase tracking-widest">
                                    <th className="pb-2">Nama Lengkap</th>
                                    <th className="pb-2">Hubungan</th>
                                    <th className="pb-2">Jenis Kelamin</th>
                                    <th className="pb-2">Pekerjaan</th>
                                    <th className="pb-2">NIK</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-[11px] font-medium text-slate-700">
                                  {reg.familyMembers.map((member, mIdx) => (
                                    <tr key={mIdx} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="py-2.5 text-slate-900 font-bold">{member.name}</td>
                                      <td className="py-2.5">
                                        <span className="px-1.5 py-0.2 bg-slate-150 border border-slate-200 rounded text-[9px] font-semibold">{member.relation}</span>
                                      </td>
                                      <td className="py-2.5 text-slate-500">{member.gender}</td>
                                      <td className="py-2.5 text-slate-500">{member.job || '-'}</td>
                                      <td className="py-2.5 font-mono text-slate-400 text-[10px]">{member.nik || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="py-4 text-center text-slate-400 font-medium text-xs italic">
                              Hanya mendaftarkan diri sendiri sebagai kepala keluarga (tinggal sendiri).
                            </div>
                          )}
                        </div>

                        {/* 4. Documents / Attachments - Clean Minimal Cards */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Dokumen Identitas Lampiran</label>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* KTP Card */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText size={15} className="text-slate-500" />
                                <div>
                                  <h6 className="text-xs font-bold text-slate-800">KTP Kepala Keluarga</h6>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">{reg.ktpUrl ? 'Tersedia' : 'Tidak Unggah'}</p>
                                </div>
                              </div>
                              {reg.ktpUrl ? (
                                <div className="flex gap-1.5">
                                  <button 
                                    onClick={() => setLightboxImage({ url: reg.ktpUrl!, title: `KTP - ${reg.headOfFamily}` })}
                                    className="px-2 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                                  >
                                    <Eye size={11} /> Pratinjau
                                  </button>
                                  <a 
                                    href={reg.ktpUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="p-1 hover:bg-slate-100 hover:text-slate-800 bg-white border border-slate-200 rounded-lg text-slate-500 transition-all flex items-center"
                                  >
                                    <ExternalLink size={12} />
                                  </a>
                                </div>
                              ) : (
                                <span className="text-[8px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 border border-rose-100 rounded">Tidak Ada</span>
                              )}
                            </div>

                            {/* KK Card */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ClipboardList size={15} className="text-slate-500" />
                                <div>
                                  <h6 className="text-xs font-bold text-slate-800">Kartu Keluarga (KK)</h6>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">{reg.kkUrl ? 'Tersedia' : 'Tidak Unggah'}</p>
                                </div>
                              </div>
                              {reg.kkUrl ? (
                                <div className="flex gap-1.5">
                                  <button 
                                    onClick={() => setLightboxImage({ url: reg.kkUrl!, title: `Kartu Keluarga - ${reg.headOfFamily}` })}
                                    className="px-2 py-1 bg-white hover:bg-slate-100 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                                  >
                                    <Eye size={11} /> Pratinjau
                                  </button>
                                  <a 
                                    href={reg.kkUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="p-1 hover:bg-slate-100 hover:text-slate-800 bg-white border border-slate-200 rounded-lg text-slate-500 transition-all flex items-center"
                                  >
                                    <ExternalLink size={12} />
                                  </a>
                                </div>
                              ) : (
                                <span className="text-[8px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 border border-rose-100 rounded">Tidak Ada</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 5. Responsive Verification Action Drawer */}
                        {reg.approvalStatus === 'Pending' || reg.approvalStatus === 'Menunggu' ? (
                          <div className="pt-3 border-t border-slate-200/80 flex flex-col md:flex-row gap-3 justify-end items-center">
                            <div className="flex items-center gap-1.5 mr-auto text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                              <Info size={12} className="shrink-0 text-amber-500" />
                              Konfirmasi pelamar via WhatsApp sebelum menyetujui
                            </div>
                            
                            <div className="flex gap-2 w-full md:w-auto">
                              <button
                                disabled={actionLoadingId === reg.id}
                                onClick={() => handleReject(reg)}
                                className={`flex-1 md:flex-initial px-4 py-2 border border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-50 hover:text-rose-700 rounded-xl text-xs font-bold transition-all active:scale-98 ${
                                  actionLoadingId === reg.id ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                {actionLoadingId === reg.id ? 'Memproses...' : 'Tolak Berkas'}
                              </button>
                              
                              <button
                                disabled={actionLoadingId === reg.id}
                                onClick={() => handleApprove(reg)}
                                className={`flex-1 md:flex-initial px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all active:scale-98 shadow-sm ${
                                  actionLoadingId === reg.id ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                {actionLoadingId === reg.id ? 'Mengonfirmasi...' : 'Setujui & Daftarkan'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-3 border-t border-slate-200/85 flex justify-end">
                            <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 ${
                              reg.approvalStatus === 'Approved' || reg.approvalStatus === 'Disetujui'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                : 'bg-rose-50 text-rose-600 border border-rose-100'
                            }`}>
                              {reg.approvalStatus === 'Approved' || reg.approvalStatus === 'Disetujui' ? (
                                <>
                                  <CheckCircle size={12} /> Berkas Diterima • Warga Sudah Terdaftar
                                </>
                              ) : (
                                <>
                                  <AlertTriangle size={12} /> Permohonan Ditolak Pengurus
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
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
            <ClipboardList className="text-slate-300 mb-3 stroke-[1.5]" size={36} />
            <h5 className="font-extrabold text-slate-700 text-xs tracking-tight uppercase">Tidak Ada Permohonan</h5>
            <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 max-w-xs leading-normal">
              Belum ada permohonan pendaftaran warga baru dengan status "{filterStatus === 'All' ? 'Semua' : filterStatus}".
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
