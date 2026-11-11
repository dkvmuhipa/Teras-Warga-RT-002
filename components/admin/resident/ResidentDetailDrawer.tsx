import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  X, Phone, MapPin, FileText, CreditCard, DollarSign, 
  LayoutList, Droplets, Trash2, Users, Activity, Shield, User,
  ShieldCheck, Calendar, AlertCircle, Printer, Home, Bike, Car, Key,
  CheckSquare, Waves, Recycle, Sparkles, MessageCircle, ExternalLink,
  Check, AlertTriangle, Store, Clock, Award, Hammer, Gift
} from 'lucide-react';
import { House, PaymentStatus, STBMRecord, SocialAidItem } from '../../../types';
import { useFinancial } from '../../../context/FinancialContext';
import { subscribeToSTBMRecords, saveSTBMRecord, subscribeToSocialAid, updateHouseData } from '../../../services/databaseService';
import { toast } from 'sonner';
import { KartuKeluargaModal } from './KartuKeluargaModal';
import { CivicScoreBadge } from '../../community/CivicScoreBadge';
import { getWhatsAppLink, isValidWhatsAppNumber } from '../../../services/whatsappService';

interface ResidentDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedResident: House | null;
  selectedMonth: string;
  openPayModal: (house: House) => void;
  setSelectedHouseForBills: (house: House) => void;
  handleOpenEdit: (house: House) => void;
  handleDelete: (id: string) => void;
}

export const ResidentDetailDrawer: React.FC<ResidentDetailDrawerProps> = ({
  isOpen,
  onClose,
  selectedResident,
  selectedMonth,
  openPayModal,
  setSelectedHouseForBills,
  handleOpenEdit,
  handleDelete,
}) => {
  const { getPaymentStatus, getArrearsForHouse } = useFinancial();
  const [isKkModalOpen, setIsKkModalOpen] = useState(false);
  const [stbmRecord, setStbmRecord] = useState<STBMRecord | null>(null);
  const [isSavingSTBM, setIsSavingSTBM] = useState(false);
  const [isUpdatingBPBD, setIsUpdatingBPBD] = useState(false);
  const [aidPrograms, setAidPrograms] = useState<SocialAidItem[]>([]);

  // Subscribe to real-time Social Aid programs to display recipient history for this house
  useEffect(() => {
    if (!selectedResident) return;
    const unsub = subscribeToSocialAid(setAidPrograms);
    return () => unsub();
  }, [selectedResident?.id]);

  const houseAidHistory = useMemo(() => {
    if (!selectedResident) return [];
    const normKey = `${(selectedResident.block || '').trim().toUpperCase()}-${String(selectedResident.number ?? '').trim().padStart(2, '0')}`;
    return aidPrograms
      .map(prog => {
        const rec = (prog.recipients || []).find(r => {
          const rKey = `${(r.block || '').trim().toUpperCase()}-${String(r.number ?? '').trim().padStart(2, '0')}`;
          return r.houseId === selectedResident.id || rKey === normKey;
        });
        if (!rec) return null;
        return {
          id: prog.id,
          title: prog.title,
          category: prog.category,
          distributionDate: prog.distributionDate,
          unit: prog.unit || 'Paket',
          status: rec.status,
          receivedAt: rec.receivedAt,
          receivedBy: rec.receivedBy
        };
      })
      .filter(Boolean) as Array<{
        id: string;
        title: string;
        category: string;
        distributionDate: string;
        unit: string;
        status: 'Menunggu' | 'Diterima';
        receivedAt?: string;
        receivedBy?: string;
      }>;
  }, [aidPrograms, selectedResident]);

  const handleQuickUpdateHouse = async (updates: Partial<House>, successMsg: string) => {
    if (!selectedResident || isUpdatingBPBD) return;
    setIsUpdatingBPBD(true);
    try {
      await updateHouseData(selectedResident.id, updates);
      toast.success(successMsg);
    } catch (e) {
      toast.error('Gagal menyimpan perubahan cepat.');
    } finally {
      setIsUpdatingBPBD(false);
    }
  };

  // Subscribe to real-time STBM records for this specific house
  useEffect(() => {
    if (!selectedResident) return;
    const unsub = subscribeToSTBMRecords((records) => {
      const found = records.find(r => r.houseId === selectedResident.id || r.id === `stbm_${selectedResident.id}`);
      if (found) {
        setStbmRecord(found);
      } else {
        // Default standard for Huntap Tondo 2
        setStbmRecord({
          id: `stbm_${selectedResident.id}`,
          houseId: selectedResident.id,
          block: selectedResident.block,
          number: selectedResident.number,
          headOfFamily: selectedResident.headOfFamily,
          occupants: selectedResident.occupants || 1,
          hasHealthyLatrine: true,
          isBABS: false,
          hasCTPS: true,
          safeWaterAndFood: true,
          wasteManagement: true,
          liquidWasteManagement: true,
          hasCleanWaterAccess: true,
          hasSTBMTriggering: true,
          needsFollowUp: false,
          problemType: '',
          notes: '',
          updatedAt: new Date().toISOString()
        });
      }
    });
    return () => unsub();
  }, [selectedResident]);

  const handleToggleSTBM = async (field: keyof STBMRecord) => {
    if (!stbmRecord || !selectedResident) return;
    setIsSavingSTBM(true);
    const updated: STBMRecord = {
      ...stbmRecord,
      [field]: !stbmRecord[field],
      updatedAt: new Date().toISOString()
    };
    try {
      await saveSTBMRecord(updated);
      setStbmRecord(updated);
      toast.success(`Status sanitasi kavling ${selectedResident.block}-${selectedResident.number} diperbarui.`);
    } catch (e) {
      toast.error('Gagal memperbarui status sanitasi.');
    } finally {
      setIsSavingSTBM(false);
    }
  };

  const handleContactWhatsAppSanitasi = () => {
    if (!selectedResident) return;
    const message = `Halo Bapak/Ibu ${selectedResident.headOfFamily} (Kavling Blok ${selectedResident.block} No. ${selectedResident.number}), kami dari Pengurus RT 002 / RW 020 Huntap Tondo 2 ingin berkoordinasi terkait pemeliharaan sanitasi lingkungan: "${stbmRecord?.problemType || 'Pemeriksaan sarana sanitasi'}". Kapan waktu luang yang tepat untuk kami tinjau bersama kader kesehatan? Terima kasih.`;
    const link = getWhatsAppLink(selectedResident.phone, message);
    if (!link) {
      toast.error('Nomor WhatsApp warga belum terdaftar atau tidak valid.');
      return;
    }
    window.open(link, '_blank');
  };

  if (!isOpen || !selectedResident) return null;

  const arrears = getArrearsForHouse(selectedResident);
  const isFullyPaid = arrears.length === 0;
  
  const statusAir = getPaymentStatus(selectedResident, 'Air', selectedMonth);
  const statusSampah = getPaymentStatus(selectedResident, 'Sampah', selectedMonth);

  return (
    <div key="drawer-overlay" className="fixed inset-0 z-[150] bg-[#f8fafc] flex justify-center overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" 
        onClick={onClose}
      />
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 240 }}
        className="relative w-full max-w-5xl mx-auto bg-[#f8fafc] min-h-full shadow-xs sm:border-x border-slate-200/80 flex flex-col"
      >
        <div className="min-h-full flex flex-col">
          {/* Header Section */}
          <div className="relative shrink-0">
            {/* Background Cover */}
            <div className="relative h-44 sm:h-48 overflow-hidden bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/80">
              {selectedResident.housePhotoUrl ? (
                <>
                  <img 
                    src={selectedResident.housePhotoUrl} 
                    alt="Foto Rumah" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent"></div>
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#f0f2fe] via-slate-50 to-[#edf7ff]">
                  <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>
                </div>
              )}

              {/* Top Bar Actions */}
              <div className="relative z-20 p-4 sm:p-5 flex justify-between items-center">
                <button 
                  onClick={onClose}
                  className="px-3.5 py-2 bg-white/95 hover:bg-white text-slate-700 backdrop-blur-md border border-slate-200/60 flex items-center gap-1.5 rounded-2xl shadow-xs font-bold text-xs transition-colors cursor-pointer"
                >
                  <X size={16} /> <span>Kembali ke Daftar Warga</span>
                </button>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsKkModalOpen(true)}
                    className="px-3.5 py-2 bg-[#e8faf0] hover:bg-emerald-100 text-[#059669] border border-emerald-100 rounded-2xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    title="Lihat & Cetak Blanko Kartu Keluarga (KK)"
                  >
                    <Printer size={13} /> Blanko KK
                  </button>
                  <button 
                    onClick={() => { onClose(); handleOpenEdit(selectedResident); }}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/70 rounded-2xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <FileText size={13} /> Edit
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Brief Card */}
            <div className="px-5 sm:px-6 -mt-10 relative z-30">
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4.5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                <div className="w-14 h-14 bg-[#f0f2fe] border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-xl font-semibold shrink-0 shadow-xs">
                  {selectedResident.headOfFamily.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <button
                      type="button"
                      onClick={() => handleQuickUpdateHouse(
                        { isVerified: !selectedResident.isVerified },
                        selectedResident.isVerified ? 'Status warga diubah ke Belum Verifikasi.' : 'Data warga berhasil diverifikasi!'
                      )}
                      title="Klik untuk mengubah status verifikasi data warga"
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border cursor-pointer transition-colors ${
                        selectedResident.isVerified
                          ? 'bg-[#e8faf0] border-emerald-200 text-[#059669] hover:bg-emerald-100'
                          : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      {selectedResident.isVerified ? '✓ Terverifikasi' : 'Belum Verifikasi'}
                    </button>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                      isFullyPaid 
                        ? 'bg-[#e8faf0] border-emerald-100 text-[#059669]' 
                        : 'bg-[#fff1f2] border-rose-100 text-[#e11d48]'
                    }`}>
                      {isFullyPaid ? 'Lunas' : 'Tunggak'}
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[9px] font-bold uppercase tracking-wider">
                      {selectedResident.residenceType || 'Tetap'}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800 tracking-tight truncate">{selectedResident.headOfFamily}</h2>
                  <p className="text-xs text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                    <MapPin size={11} className="text-slate-400" />
                    Blok {selectedResident.block} - No. {selectedResident.number}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Body Content */}
          <div className="p-5 sm:p-6 space-y-5 flex-1">
            {/* Resident ID Card Display */}
            <div className="bg-white border border-slate-100 rounded-3xl p-4.5 shadow-xs">
              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#f0f2fe] text-indigo-600 flex items-center justify-center">
                    <Shield size={12} />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Resident ID Card</span>
                </div>
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md">ID: {selectedResident.id.substring(0, 8).toUpperCase()}</span>
              </div>
              <div className="pt-3.5 flex items-center gap-3.5">
                <div className="w-12 h-12 bg-indigo-50 border border-indigo-100/80 rounded-2xl flex items-center justify-center text-indigo-600 shadow-xs select-none shrink-0">
                  <ShieldCheck size={24} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status Kependudukan</p>
                  <p className="text-sm font-extrabold text-slate-800">{selectedResident.residenceType || 'Warga Tetap'}</p>
                  <p className="text-[10px] text-[#059669] font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                    <ShieldCheck size={12} className="inline text-[#059669]" /> Terdaftar di RTHub RT-02
                  </p>
                </div>
              </div>
            </div>

            {/* Civic Score Honor Badge */}
            <div className="bg-white border border-slate-100 rounded-3xl p-4.5 shadow-xs">
              <CivicScoreBadge house={selectedResident} showDetails={true} size="md" />
            </div>

            {/* Quick Actions Tray */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  onClose();
                  openPayModal(selectedResident);
                }}
                className="p-4 bg-white border border-slate-100 hover:border-indigo-200 hover:bg-[#f0f2fe]/20 rounded-3xl shadow-xs transition-colors text-center group cursor-pointer"
              >
                <div className="w-11 h-11 bg-[#f0f2fe] text-indigo-600 border border-indigo-100/60 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-xs group-hover:scale-105 transition-transform">
                  <DollarSign size={18} />
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Bayar Bulanan</p>
                <p className="text-xs font-semibold text-slate-800 tracking-tight mt-0.5">Entri Iuran</p>
              </button>
              <button 
                onClick={() => { onClose(); setSelectedHouseForBills(selectedResident); }}
                className="p-4 bg-white border border-slate-100 hover:border-emerald-200 hover:bg-[#e8faf0]/20 rounded-3xl shadow-xs transition-colors text-center group cursor-pointer"
              >
                <div className="w-11 h-11 bg-[#e8faf0] text-[#059669] border border-emerald-100/60 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-xs group-hover:scale-105 transition-transform">
                  <LayoutList size={18} />
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Data Pembayaran</p>
                <p className="text-xs font-semibold text-slate-800 tracking-tight mt-0.5">Riwayat Bayar</p>
              </button>
            </div>

            {/* Detailed Info Groups */}
            <div className="space-y-5 pb-6">
              {/* Group: Dasar & Kontak */}
              <section className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs relative overflow-hidden">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 bg-[#f0f2fe] text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <Home size={14} />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Kontak & Rumah</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 shrink-0"><Phone size={13} /></span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nomor WA / Telp</p>
                    </div>
                    {isValidWhatsAppNumber(selectedResident.phone) ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-extrabold text-indigo-600 font-mono tracking-tight">{selectedResident.phone}</span>
                        <a
                          href={getWhatsAppLink(selectedResident.phone, `Halo Bapak/Ibu ${selectedResident.headOfFamily} (Blok ${selectedResident.block}-${selectedResident.number}), salam dari Pengurus RT 002 Huntap Tondo 2.`) || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-lg text-[10px] font-bold transition-colors inline-flex items-center gap-1 shadow-2xs"
                          title="Kirim pesan WhatsApp"
                        >
                          <MessageCircle size={11} className="stroke-[2.5]" />
                          <span>Chat WA</span>
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs font-semibold text-slate-400 italic">Belum ada no. HP</p>
                    )}
                  </div>
                  <DetailItem icon={<MapPin size={13} />} label="Alamat Blok / No" value={`Blok ${selectedResident.block} No. ${selectedResident.number}`} />
                  <DetailItem icon={<Home size={13} />} label="Status Hunian" value={selectedResident.residenceType || 'Tetap'} />
                  <div className="col-span-2 p-3 bg-emerald-50/40 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileText size={15} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">PBB {selectedResident.pbbYear || new Date().getFullYear()}</span>
                          {selectedResident.pbbNop && (
                            <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-900 font-bold">{selectedResident.pbbNop}</span>
                          )}
                        </div>
                        <p className="text-xs font-extrabold text-slate-800">
                          {selectedResident.pbbPaymentStatus === 'Lunas' ? '✓ Lunas' : 'Belum Lunas'}
                          <span className="text-slate-400 font-normal"> • </span>
                          <span className={selectedResident.pbbProofAtRt === 'Ada di RT' ? 'text-sky-700 font-bold' : 'text-slate-500'}>
                            Bukti: {selectedResident.pbbProofAtRt || 'Belum Ada'}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${
                        selectedResident.pbbStatus === 'Sudah Diambil'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        SPPT: {selectedResident.pbbStatus || 'Belum Diambil'}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <DetailItem 
                      icon={selectedResident.pdamStatus === 'Hilang' ? <AlertTriangle size={13} className="text-rose-600" /> : <Droplets size={13} className="text-blue-500" />} 
                      label="Meteran PDAM Palu" 
                      value={
                        selectedResident.pdamStatus === 'Hilang'
                          ? `🚨 Meteran Hilang${selectedResident.pdamLostDate ? ` (Tgl: ${selectedResident.pdamLostDate})` : ''} - Stop Kran Wajib Ditutup`
                          : `${selectedResident.pdamStatus || 'Terpasang'}${selectedResident.pdamMeterNumber ? ` (ID: ${selectedResident.pdamMeterNumber})` : ''}`
                      } 
                      isUrgent={selectedResident.pdamStatus === 'Belum Terpasang' || selectedResident.pdamStatus === 'Hilang'} 
                      noTruncate
                    />
                  </div>
                  <DetailItem icon={<FileText size={13} />} label="Nomor NIK" value={selectedResident.nik || '-'} isMain />
                  <DetailItem icon={<Users size={13} />} label="Nomor KK" value={selectedResident.kkNumber || '-'} isMain />
                  <DetailItem icon={<Calendar size={13} />} label="Mulai Menempati" value={selectedResident.joiningDate ? selectedResident.joiningDate.split('T')[0] : (selectedResident.createdAt ? `${selectedResident.createdAt.split('T')[0]} (Registrasi)` : 'Belum Dicatat')} />
                  {/* Status Kesesuaian KTP & Alamat Sesuai KTP */}
                  <div className="col-span-2 p-3 bg-slate-50/90 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <CreditCard size={15} />
                      </div>
                      <div>
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest block">Status Kesesuaian KTP</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${
                            (selectedResident.ktpStatus === 'Sesuai Domisili' || (!selectedResident.ktpStatus && selectedResident.addressKtp && (selectedResident.addressKtp.toLowerCase().includes('tondo') || selectedResident.addressKtp.toLowerCase().includes('pue lombe'))))
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {(selectedResident.ktpStatus === 'Sesuai Domisili' || (!selectedResident.ktpStatus && selectedResident.addressKtp && (selectedResident.addressKtp.toLowerCase().includes('tondo') || selectedResident.addressKtp.toLowerCase().includes('pue lombe')))) ? <Check size={12} className="text-emerald-600" /> : <FileText size={12} className="text-amber-600" />}
                            <span>
                              {selectedResident.ktpStatus || (selectedResident.addressKtp && (selectedResident.addressKtp.toLowerCase().includes('tondo') || selectedResident.addressKtp.toLowerCase().includes('pue lombe')) ? 'Sesuai Domisili' : (selectedResident.addressKtp ? 'Luar Wilayah (Belum Mutasi)' : 'Sesuai Domisili'))}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                    {selectedResident.addressKtp && (
                      <div className="text-left sm:text-right text-xs text-slate-700 font-semibold max-w-xs pl-10 sm:pl-0">
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest block">Alamat KTP</span>
                        <span className="text-slate-800 font-bold leading-tight">{selectedResident.addressKtp}</span>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 p-3 bg-indigo-50/40 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                        <Key size={15} />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-800 block">
                          Pemilik Sah di SK Huntap
                        </span>
                        <p className="text-xs font-extrabold text-slate-800">
                          {selectedResident.ownerName || selectedResident.headOfFamily || '-'}
                          {selectedResident.ownerPhone ? (
                            <span className="text-slate-500 font-mono font-semibold"> ({selectedResident.ownerPhone})</span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-800">
                        Hubungan: {selectedResident.ownerRelationship || (selectedResident.residenceType === 'Sewa' ? 'Penyewa / Kontrak' : selectedResident.residenceType === 'Rumah Keluarga' ? 'Keluarga / Kerabat' : (selectedResident.ownerName && selectedResident.ownerName.trim().toUpperCase() !== selectedResident.headOfFamily.trim().toUpperCase() ? 'Pasangan / Keluarga' : 'Pemilik Sendiri'))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kendaraan Terparkir Breakdown */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <Car size={13} className="text-slate-400" />
                    <span>Kendaraan Terparkir:</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#fff4eb] text-[#ea580c] border border-amber-100 rounded-xl text-xs font-bold shadow-2xs">
                      <Bike size={12} className="text-amber-600" />
                      {selectedResident.twoWheelCount || 0} Motor
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#edf7ff] text-[#0284c7] border border-sky-100 rounded-xl text-xs font-bold shadow-2xs">
                      <Car size={12} className="text-sky-600" />
                      {selectedResident.fourWheelCount || 0} Mobil
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold pl-0.5">
                      ({(selectedResident.twoWheelCount || 0) + (selectedResident.fourWheelCount || 0) > 0 ? (selectedResident.twoWheelCount || 0) + (selectedResident.fourWheelCount || 0) : (selectedResident.vehicleCount || 0)} unit)
                    </span>
                  </div>
                </div>
              </section>

              {/* Group: Pendataan Fisik & Sertifikat BPBD (Huntap Tondo 2) */}
              <section className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl flex items-center justify-center shrink-0">
                      <Award size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Verifikasi Aset & Sertifikat BPBD</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Klik tombol di bawah untuk pembaruan cepat status sertifikat & fisik bangunan</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                    selectedResident.certificateStatus === 'Ya'
                      ? 'bg-[#e8faf0] text-[#059669] border-emerald-200'
                      : selectedResident.certificateStatus === 'Dalam Proses'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {selectedResident.certificateStatus === 'Ya'
                      ? 'Bersertifikat ✓'
                      : selectedResident.certificateStatus === 'Dalam Proses'
                        ? 'Proses Sertifikat'
                        : 'Belum Sertifikat'}
                  </span>
                </div>

                <div className="space-y-3">
                  {/* 1. Status Sertifikat Huntap */}
                  <div className="p-3 bg-slate-50/80 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status Sertifikat Kepemilikan</p>
                      <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                        {selectedResident.certificateStatus === 'Ya'
                          ? 'Sudah Menerima Sertifikat Hak Milik'
                          : selectedResident.certificateStatus === 'Dalam Proses'
                            ? 'Dalam Proses Pengurusan BPBD / BPN'
                            : 'Belum Menerima Sertifikat (Masih SK Huntap)'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {(['Ya', 'Dalam Proses', 'Tidak'] as const).map((statusOpt) => {
                        const currentCert = selectedResident.certificateStatus || 'Tidak';
                        const isActive = currentCert === statusOpt || (statusOpt === 'Tidak' && currentCert === 'Belum');
                        return (
                          <button
                            key={statusOpt}
                            type="button"
                            disabled={isUpdatingBPBD}
                            onClick={() => handleQuickUpdateHouse(
                              { certificateStatus: statusOpt },
                              `Status sertifikat kavling ${selectedResident.block}-${selectedResident.number} diubah ke "${statusOpt}".`
                            )}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-colors cursor-pointer border ${
                              isActive
                                ? statusOpt === 'Ya'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                  : statusOpt === 'Dalam Proses'
                                    ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                                    : 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {statusOpt === 'Ya' ? 'Sudah (Ya)' : statusOpt === 'Dalam Proses' ? 'Proses' : 'Belum'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Kondisi Fisik Bangunan */}
                  <div className="p-3 bg-slate-50/80 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Kondisi Fisik Bangunan</p>
                      <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                        {selectedResident.buildingCondition || 'Baik'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 shrink-0">
                      {(['Baik', 'Terlantar', 'Tidak Terawat'] as const).map((condOpt) => {
                        const currentCond = selectedResident.buildingCondition || 'Baik';
                        const isActive = currentCond === condOpt;
                        return (
                          <button
                            key={condOpt}
                            type="button"
                            disabled={isUpdatingBPBD}
                            onClick={() => handleQuickUpdateHouse(
                              { buildingCondition: condOpt },
                              `Kondisi bangunan ${selectedResident.block}-${selectedResident.number} diperbarui ke "${condOpt}".`
                            )}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-colors cursor-pointer border ${
                              isActive
                                ? condOpt === 'Baik'
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : condOpt === 'Terlantar'
                                    ? 'bg-amber-500 text-white border-amber-500'
                                    : 'bg-rose-600 text-white border-rose-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {condOpt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Status Modifikasi / Renovasi Bangunan */}
                  <div className="p-3 bg-slate-50/80 border border-slate-100 rounded-2xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Hammer size={14} className="text-slate-400 shrink-0" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Bentuk Fisik / Renovasi</p>
                        <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                          {selectedResident.hasStructuralModification ? 'Sudah Dimodifikasi / Tambah Bangunan' : 'Standar Asli Huntap PUPR'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isUpdatingBPBD}
                      onClick={() => handleQuickUpdateHouse(
                        { hasStructuralModification: !selectedResident.hasStructuralModification },
                        `Status modifikasi bangunan ${selectedResident.block}-${selectedResident.number} diperbarui.`
                      )}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-colors cursor-pointer border shrink-0 ${
                        selectedResident.hasStructuralModification
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {selectedResident.hasStructuralModification ? 'Ada Modifikasi' : 'Standar Asli'}
                    </button>
                  </div>
                </div>
              </section>

              {/* Group: Profil Usaha / UMKM Warga */}
              {(selectedResident.hasBusiness || selectedResident.businessName) && (
                <section className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-[#fff4eb] text-[#ea580c] rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
                        <Store size={14} />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Usaha / UMKM Warga</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Potensi ekonomi lokal kavling RT 02</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 bg-[#fff4eb] text-[#ea580c] border border-amber-100 rounded-xl text-[9px] font-semibold uppercase tracking-wider shadow-2xs">
                      {selectedResident.businessCategory || 'UMKM Aktif'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2 mb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{selectedResident.businessName || 'Usaha Warga'}</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                          <MapPin size={11} className="text-slate-400" />
                          {selectedResident.businessLocation || 'Di Rumah / Kavling'}
                        </p>
                      </div>
                      {selectedResident.isUmkmRegistered && (
                        <span className="px-2 py-0.5 bg-[#e8faf0] text-[#059669] border border-emerald-100 rounded-lg text-[9px] font-bold">
                          Katalog RT ✓
                        </span>
                      )}
                    </div>
                    {selectedResident.businessDescription && (
                      <p className="text-xs text-slate-600 leading-relaxed font-medium pt-1 border-t border-slate-200/60">
                        {selectedResident.businessDescription}
                      </p>
                    )}
                  </div>

                  {isValidWhatsAppNumber(selectedResident.businessPhone) && (
                    <a
                      href={getWhatsAppLink(selectedResident.businessPhone, `Halo Bapak/Ibu ${selectedResident.headOfFamily}, saya pengurus RT 02 ingin berkoordinasi seputar UMKM ${selectedResident.businessName || ''}.`) || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 bg-[#e8faf0] hover:bg-emerald-100 text-[#059669] border border-emerald-100 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <MessageCircle size={13} />
                      <span>Hubungi WhatsApp Usaha ({selectedResident.businessPhone})</span>
                    </a>
                  )}
                </section>
              )}

              {/* Group: Smart Tags */}
              {selectedResident.tags && selectedResident.tags.length > 0 && (
                <section className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-[#f0f2fe] text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <Sparkles size={14} />
                    </div>
                    <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Smart Tags Warga</h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedResident.tags.map((tag, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-[#f0f2fe] text-indigo-700 border border-indigo-100/80 rounded-xl text-xs font-bold shadow-2xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Group: Demografi & Silsilah Keluarga */}
              <section className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 bg-[#e8faf0] text-[#059669] rounded-xl flex items-center justify-center shrink-0">
                    <Users size={14} />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Profil Demografi & Silsilah</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="col-span-2">
                    <DetailItem label="Tempat, Tgl Lahir" value={`${selectedResident.birthPlace || '-'}, ${selectedResident.birthDate ? new Date(selectedResident.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}`} noTruncate />
                  </div>
                  <DetailItem
                    label="Pekerjaan"
                    value={
                      selectedResident.job && selectedResident.jobCategory && selectedResident.job !== selectedResident.jobCategory
                        ? `${selectedResident.job} (${selectedResident.jobCategory})`
                        : (selectedResident.job || selectedResident.jobCategory || '-')
                    }
                    noTruncate
                  />
                  <DetailItem label="Pendidikan Terakhir" value={selectedResident.education || '-'} />
                  <DetailItem label="Agama" value={selectedResident.religion || '-'} />
                  <DetailItem label="Status Perkawinan" value={selectedResident.maritalStatus || 'Belum Kawin'} />
                  <DetailItem label="Golongan Darah" value={selectedResident.bloodType || '-'} />
                  <DetailItem label="Kewarganegaraan" value={selectedResident.nationality || 'WNI'} />
                </div>

                {/* Family Tree Visualizer */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pohon Silsilah Keluarga</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsKkModalOpen(true)}
                        className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <FileText size={11} /> Format KK Resmi
                      </button>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-bold">
                        {(selectedResident.familyMembers?.length || 0) + 1} Jiwa
                      </span>
                    </div>
                  </div>
                  
                  {/* Root: Head of Family */}
                  <div className="p-3.5 bg-[#f0f2fe]/60 border border-indigo-100/80 rounded-2xl flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-xs font-semibold shadow-xs">
                        {selectedResident.headOfFamily.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 leading-tight">{selectedResident.headOfFamily}</p>
                        <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wide mt-0.5">Kepala Keluarga (Utama)</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-white text-indigo-700 border border-indigo-100 rounded-xl text-[9px] font-bold uppercase shadow-2xs">{selectedResident.gender || 'Laki-laki'}</span>
                  </div>

                  {/* Nodes: Family Members */}
                  {selectedResident.familyMembers && selectedResident.familyMembers.length > 0 ? (
                    <div className="pl-4 border-l-2 border-indigo-100 space-y-2 ml-4">
                      {selectedResident.familyMembers.map((member, idx) => (
                        <div key={member.name || idx} className="relative flex items-center justify-between p-3 bg-slate-50/80 border border-slate-100 hover:bg-white rounded-2xl transition-colors shadow-2xs">
                          <div className="absolute -left-4 top-1/2 w-4 h-0.5 bg-indigo-100"></div>
                          <div className="flex items-center gap-2.5">
                             <div className="w-8 h-8 bg-white border border-slate-200/80 rounded-xl flex items-center justify-center text-slate-700 text-xs font-bold shrink-0 shadow-xs">
                               {member.name.charAt(0).toUpperCase()}
                             </div>
                             <div>
                                <p className="text-xs font-semibold text-slate-800 leading-tight">{member.name}</p>
                                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">{member.relation} • {member.job || 'N/A'}</p>
                             </div>
                          </div>
                          <span className="px-2 py-0.5 bg-white rounded-xl border border-slate-200/80 text-[9px] font-bold text-slate-600 uppercase shadow-2xs">{member.gender === 'Laki-laki' ? 'Pria' : 'Wanita'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-slate-400 italic text-center py-3 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                      Tinggal mandiri (Kepala Keluarga tunggal)
                    </p>
                  )}
                </div>
              </section>

              {/* Group: Riwayat Kepenghunian Kavling */}
              <section className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 bg-[#fff4eb] text-[#ea580c] rounded-xl flex items-center justify-center shrink-0">
                    <Activity size={14} />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Riwayat Kepenghunian</h4>
                </div>

                <div className="relative pl-4 border-l-2 border-amber-100 space-y-4">
                  {/* Current Active Resident */}
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white ring-2 ring-emerald-100"></div>
                    <div className="bg-[#e8faf0]/60 p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[9px] font-bold uppercase tracking-wider shadow-2xs">Penghuni Aktif</span>
                          <p className="text-xs font-semibold text-slate-800 mt-1">{selectedResident.headOfFamily}</p>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">{selectedResident.joiningDate ? selectedResident.joiningDate.split('T')[0] : 'Aktif'} - Sekarang</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">Status: {selectedResident.residenceType || 'Tetap'} • {selectedResident.occupants || 1} Jiwa</p>
                    </div>
                  </div>

                  {/* Historical Records */}
                  {selectedResident.occupantHistory && selectedResident.occupantHistory.length > 0 ? (
                    selectedResident.occupantHistory.map((history) => {
                      const isTanpaPamit = history.moveOutReason === 'Pindah Keluar (Tanpa Pamit)';
                      return (
                        <div key={history.id} className="relative">
                          <div className={`absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                            isTanpaPamit ? 'bg-rose-500 ring-2 ring-rose-100' : 'bg-slate-400'
                          }`}></div>
                          <div className={`p-3.5 rounded-2xl border transition-colors ${
                            isTanpaPamit 
                              ? 'bg-[#fff1f2]/60 border-rose-100' 
                              : 'bg-slate-50 border-slate-100'
                          }`}>
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-xs font-bold text-slate-800">{history.headOfFamily}</p>
                                  {isTanpaPamit ? (
                                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded-full text-[9px] font-semibold uppercase tracking-wider flex items-center gap-0.5">
                                      <AlertTriangle size={9} className="text-rose-600" />
                                      Pindah Tanpa Pamit
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                      {history.moveOutReason || 'Pindah'}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[9px] font-semibold text-slate-500 uppercase mt-0.5">
                                  {history.residenceType || 'Warga'} • {history.occupants || 1} Jiwa
                                  {history.phone && history.phone !== '-' ? ` • Telp: ${history.phone}` : ''}
                                </p>
                              </div>
                              <span className="text-[9px] font-bold text-slate-400 shrink-0 text-right">
                                {history.startDate ? history.startDate.split('T')[0] : '?'} s/d {history.endDate || '-'}
                              </span>
                            </div>
                            {history.moveOutNotes && (
                              <p className={`text-[10px] mt-2 p-2.5 rounded-xl font-medium leading-relaxed ${
                                isTanpaPamit 
                                  ? 'bg-rose-100/60 text-rose-900 border border-rose-200/60' 
                                  : 'bg-white text-slate-600 border border-slate-100'
                              }`}>
                                <span className="font-bold">Kronologi:</span> {history.moveOutNotes}
                              </p>
                            )}
                            {history.familyMembers && history.familyMembers.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 flex-wrap">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Keluarga:</span>
                                {history.familyMembers.map((m, idx) => (
                                  <span key={idx} className="text-[9px] bg-white px-2 py-0.5 rounded-xl border border-slate-100 text-slate-600 font-medium">
                                    {m.name} ({m.relation})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : selectedResident.occupancyHistory && selectedResident.occupancyHistory.length > 0 ? (
                    selectedResident.occupancyHistory.map((history) => (
                      <div key={history.id} className="relative">
                        <div className="absolute -left-[21px] top-1 w-3.5 h-3.5 bg-slate-300 rounded-full border-2 border-white"></div>
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold text-slate-700">{history.headOfFamily}</p>
                              <p className="text-[9px] font-semibold text-slate-400 uppercase mt-0.5">{history.residenceType} • {history.movedReason || 'Pindah'}</p>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400">{history.startDate} s/d {history.endDate || '-'}</span>
                          </div>
                          {history.notes && <p className="text-[10px] text-slate-500 italic mt-1">{history.notes}</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 w-3.5 h-3.5 bg-slate-200 rounded-full border-2 border-white"></div>
                      <p className="text-xs text-slate-400 italic pl-1">Belum ada catatan kepenghunian terdahulu.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Group: Profil Sanitasi & 5 Pilar STBM (Kawasan Huntap Tondo 2) */}
              <section className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-[#e8faf0] text-[#059669] rounded-xl flex items-center justify-center shrink-0">
                      <CheckSquare size={14} />
                    </div>
                    <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                      Profil Sanitasi (5 Pilar STBM)
                    </h4>
                  </div>
                  <span className="text-[9px] font-bold bg-[#e8faf0] text-[#059669] border border-emerald-100 px-2.5 py-0.5 rounded-full">
                    {stbmRecord && !stbmRecord.isBABS && stbmRecord.hasHealthyLatrine ? '100% ODF Sehat' : 'Perlu Pantau'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-3.5 leading-relaxed font-medium">
                  Status kepatuhan sanitasi hunian tetap merujuk Permenkes No. 3/2014 & infrastruktur PUPR:
                </p>

                {/* 5 Pilar Grid Items */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  {/* Pilar 1: Biotank */}
                  <div className="p-3 bg-slate-50/80 border border-slate-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">1. Jamban Sehat</p>
                      <p className="text-xs font-semibold text-slate-800">Biotank PUPR</p>
                    </div>
                    <button
                      onClick={() => handleToggleSTBM('hasHealthyLatrine')}
                      disabled={isSavingSTBM}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-colors cursor-pointer shadow-2xs ${
                        stbmRecord?.hasHealthyLatrine ? 'bg-[#e8faf0] text-[#059669] border border-emerald-100' : 'bg-[#fff1f2] text-[#e11d48] border border-rose-100'
                      }`}
                    >
                      {stbmRecord?.hasHealthyLatrine ? 'Ya' : 'Tidak'}
                    </button>
                  </div>

                  {/* Bebas BABS */}
                  <div className="p-3 bg-slate-50/80 border border-slate-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Bebas BABS</p>
                      <p className="text-xs font-semibold text-slate-800">Status ODF</p>
                    </div>
                    <button
                      onClick={() => handleToggleSTBM('isBABS')}
                      disabled={isSavingSTBM}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-colors cursor-pointer shadow-2xs ${
                        stbmRecord?.isBABS ? 'bg-rose-600 text-white' : 'bg-[#e8faf0] text-[#059669] border border-emerald-100'
                      }`}
                    >
                      {stbmRecord?.isBABS ? 'BABS (Perlu Edukasi)' : 'Bebas ODF'}
                    </button>
                  </div>

                  {/* Pilar 2: CTPS */}
                  <div className="p-3 bg-slate-50/80 border border-slate-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">2. Cuci Tangan</p>
                      <p className="text-xs font-semibold text-slate-800">Sarana CTPS</p>
                    </div>
                    <button
                      onClick={() => handleToggleSTBM('hasCTPS')}
                      disabled={isSavingSTBM}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-colors cursor-pointer shadow-2xs ${
                        stbmRecord?.hasCTPS ? 'bg-[#e8faf0] text-[#059669] border border-emerald-100' : 'bg-[#fff1f2] text-[#e11d48] border border-rose-100'
                      }`}
                    >
                      {stbmRecord?.hasCTPS ? 'Ya' : 'Tidak'}
                    </button>
                  </div>

                  {/* Pilar 3: PAMM-RT */}
                  <div className="p-3 bg-slate-50/80 border border-slate-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">3. Air & Makanan</p>
                      <p className="text-xs font-semibold text-slate-800">PAMM-RT Aman</p>
                    </div>
                    <button
                      onClick={() => handleToggleSTBM('safeWaterAndFood')}
                      disabled={isSavingSTBM}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-colors cursor-pointer shadow-2xs ${
                        stbmRecord?.safeWaterAndFood ? 'bg-[#e8faf0] text-[#059669] border border-emerald-100' : 'bg-[#fff1f2] text-[#e11d48] border border-rose-100'
                      }`}
                    >
                      {stbmRecord?.safeWaterAndFood ? 'Ya' : 'Tidak'}
                    </button>
                  </div>

                  {/* Pilar 4: TPS3R */}
                  <div className="p-3 bg-slate-50/80 border border-slate-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">4. Pilah Sampah</p>
                      <p className="text-xs font-semibold text-slate-800">Layanan TPS3R</p>
                    </div>
                    <button
                      onClick={() => handleToggleSTBM('wasteManagement')}
                      disabled={isSavingSTBM}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-colors cursor-pointer shadow-2xs ${
                        stbmRecord?.wasteManagement ? 'bg-[#e8faf0] text-[#059669] border border-emerald-100' : 'bg-[#fff1f2] text-[#e11d48] border border-rose-100'
                      }`}
                    >
                      {stbmRecord?.wasteManagement ? 'Ya' : 'Tidak'}
                    </button>
                  </div>

                  {/* Pilar 5: SPALDT */}
                  <div className="p-3 bg-slate-50/80 border border-slate-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">5. Limbah Cair</p>
                      <p className="text-xs font-semibold text-slate-800">Pipa SPALDT</p>
                    </div>
                    <button
                      onClick={() => handleToggleSTBM('liquidWasteManagement')}
                      disabled={isSavingSTBM}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-colors cursor-pointer shadow-2xs ${
                        stbmRecord?.liquidWasteManagement ? 'bg-[#e8faf0] text-[#059669] border border-emerald-100' : 'bg-[#fff1f2] text-[#e11d48] border border-rose-100'
                      }`}
                    >
                      {stbmRecord?.liquidWasteManagement ? 'Ya' : 'Tidak'}
                    </button>
                  </div>
                </div>

                {/* Status Tindak Lanjut & Action */}
                {stbmRecord?.needsFollowUp || stbmRecord?.problemType ? (
                  <div className="p-3.5 bg-[#fff1f2]/70 border border-rose-100 rounded-2xl space-y-2 mt-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
                        <AlertTriangle size={14} className="shrink-0 text-rose-600" />
                        <span>Kendala Sanitasi: {stbmRecord.problemType || 'Perlu perbaikan'}</span>
                      </div>
                    </div>
                    {isValidWhatsAppNumber(selectedResident.phone) ? (
                      <button
                        onClick={handleContactWhatsAppSanitasi}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <MessageCircle size={14} />
                        <span>Koordinasi via WhatsApp Warga</span>
                      </button>
                    ) : (
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-center text-[11px] text-amber-800 font-medium">
                        Nomor kontak warga belum terdaftar untuk koordinasi via WhatsApp.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-[#e8faf0]/60 border border-emerald-100 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-semibold">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[#059669]">
                      <ShieldCheck size={14} className="text-[#059669]" />
                      Kavling Terverifikasi Sanitasi Sehat
                    </span>
                    <button
                      onClick={() => handleToggleSTBM('needsFollowUp')}
                      className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Tandai Masalah
                    </button>
                  </div>
                )}
              </section>

              {/* Group: Ronda & Catatan Khusus */}
              <section className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 bg-[#f0f2fe] text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <Shield size={14} />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Keamanan & Siskamling</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50/80 border border-slate-100 rounded-2xl">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status Tugas Ronda</p>
                      <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                        {selectedResident.rondaExempt ? 'Bebas Tugas (Dispensasi)' : 'Wajib Ronda Siskamling Aktif'}
                      </p>
                    </div>
                    {!selectedResident.rondaExempt && (
                      <div className="flex gap-4 border-l border-slate-200/80 pl-4 shrink-0 text-right">
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Poin</p>
                          <p className="text-xs font-semibold text-indigo-600">{selectedResident.rondaPoints || 0} Pts</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Tugas Bulan Ini</p>
                          <p className="text-xs font-semibold text-slate-800">{selectedResident.rondaDutyCount || 0} Kali</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedResident.specialNotes && (
                    <div className="p-3.5 bg-[#fff4eb]/70 border border-amber-100 rounded-2xl">
                      <p className="text-[9px] font-bold text-amber-800 uppercase tracking-wider mb-1">Catatan Khusus Hunian</p>
                      <p className="text-xs font-semibold text-amber-900 leading-relaxed">{selectedResident.specialNotes}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Vulnerability & Social Aid Section */}
              {(selectedResident.isPKH || selectedResident.isBLT || selectedResident.isBPNT || selectedResident.isBansosLain || selectedResident.economicStatus === 'Pra-Sejahtera' || selectedResident.isDisability || selectedResident.isOrphan || houseAidHistory.length > 0) && (
                <section className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs relative">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-[#fff1f2] text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                        <Gift size={14} />
                      </div>
                      <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Kesejahteraan & Bansos</h4>
                    </div>
                    {houseAidHistory.length > 0 && (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[9px] font-bold uppercase tracking-wider">
                        {houseAidHistory.filter(h => h.status === 'Diterima').length}x Menerima Bantuan RT
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {selectedResident.economicStatus === 'Pra-Sejahtera' && <BansosBadge label="Keluarga Pra-Sejahtera" />}
                    {selectedResident.isPKH && <BansosBadge label="Penerima PKH" />}
                    {selectedResident.isBLT && <BansosBadge label="Bansos BLT" />}
                    {selectedResident.isBPNT && <BansosBadge label="Rastra BPNT" />}
                    {selectedResident.isBansosLain && <BansosBadge label={selectedResident.bansosLainName || 'BANSOS'} />}
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(selectedResident.pregnantCount || 0) > 0 && <VulnerabilityStat count={selectedResident.pregnantCount || 0} label="Ibu Hamil" />}
                    {(selectedResident.elderlyCount || 0) > 0 && <VulnerabilityStat count={selectedResident.elderlyCount || 0} label="Lansia (60+)" />}
                    {(selectedResident.babyCount || 0) > 0 && <VulnerabilityStat count={selectedResident.babyCount || 0} label="Bayi (0-12 M)" />}
                    {(selectedResident.toddlerCount || 0) > 0 && <VulnerabilityStat count={selectedResident.toddlerCount || 0} label="Balita" />}
                    {(selectedResident.childCount || 0) > 0 && <VulnerabilityStat count={selectedResident.childCount || 0} label="Anak" />}
                    {(selectedResident.widowCount || 0) > 0 && <VulnerabilityStat count={selectedResident.widowCount || 0} label="Janda / Duda" />}
                    {(selectedResident.isDisability || (selectedResident.disabilityCount || 0) > 0) && (
                      <VulnerabilityStat count={selectedResident.disabilityCount || 1} label="Disabilitas" />
                    )}
                    {(selectedResident.isOrphan || (selectedResident.orphanCount || 0) > 0) && (
                      <VulnerabilityStat count={selectedResident.orphanCount || 1} label="Yatim / Piatu" />
                    )}
                  </div>

                  {houseAidHistory.length > 0 && (
                    <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Riwayat Penyaluran Bantuan & Sembako RT
                      </p>
                      <div className="space-y-2">
                        {houseAidHistory.map(item => (
                          <div key={item.id} className="p-3 bg-slate-50/80 border border-slate-100 rounded-2xl flex items-center justify-between gap-2">
                            <div>
                              <p className="text-xs font-extrabold text-slate-800">{item.title}</p>
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                {item.category} • {item.distributionDate ? new Date(item.distributionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                {item.receivedBy ? ` • Penerima: ${item.receivedBy}` : ''}
                              </p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 border ${
                              item.status === 'Diterima'
                                ? 'bg-[#e8faf0] text-[#059669] border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {item.status === 'Diterima' ? '✓ Sudah Diterima' : 'Menunggu Ambil'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* System Metadata Tracking */}
            <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-semibold">
              <span className="flex items-center gap-1">
                <Clock size={11} className="text-slate-400" />
                <span>Input Pertama: <strong className="text-slate-600">{selectedResident.createdAt ? new Date(selectedResident.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Data Awal Sistem'}</strong></span>
              </span>
              {selectedResident.updatedAt && (
                <span>Terakhir Diperbarui: <strong className="text-slate-600">{new Date(selectedResident.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
              )}
            </div>

            {/* Bottom Menu / Danger Zone */}
            <div className="pt-2 border-t border-slate-100">
              <button 
                onClick={() => handleDelete(selectedResident.id)}
                className="w-full py-3 bg-[#fff1f2] text-rose-600 hover:bg-rose-100 border border-rose-100 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Trash2 size={14} /> Arsipkan / Hapus Data Warga
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Official Kartu Keluarga Modal */}
      <KartuKeluargaModal 
        isOpen={isKkModalOpen} 
        onClose={() => setIsKkModalOpen(false)} 
        house={selectedResident} 
      />
    </div>
  );
};

// Sub-components
const DetailItem = ({ icon, label, value, isUrgent = false, isMain = false, noTruncate = false }: { icon?: React.ReactNode, label: string, value: string, isUrgent?: boolean, isMain?: boolean, noTruncate?: boolean }) => (
  <div className="space-y-0.5">
    <div className="flex items-center gap-1.5">
       {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
    <p className={`text-sm font-extrabold ${noTruncate ? 'break-words leading-snug' : 'truncate'} ${isUrgent ? 'text-indigo-600' : 'text-slate-800'} ${isMain ? 'font-mono' : ''}`}>{value || '-'}</p>
  </div>
);

const BansosBadge = ({ label }: { label: string }) => (
  <span className="px-2.5 py-1 bg-[#fff1f2] text-rose-700 border border-rose-100 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-2xs">
    {label}
  </span>
);

const VulnerabilityStat = ({ count, label }: { count: number, label: string }) => (
  <div className="p-2.5 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between shadow-2xs">
    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">{label}</span>
    <span className="text-xs font-semibold text-rose-600">{count}</span>
  </div>
);

