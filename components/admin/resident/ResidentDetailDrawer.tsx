import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  X, Phone, MapPin, FileText, CreditCard, DollarSign, 
  LayoutList, Droplets, Trash2, Users, Activity, Shield, User,
  ShieldCheck, Calendar, AlertCircle, Printer, Home, Bike, Car, Key,
  CheckSquare, Waves, Recycle, Sparkles, MessageCircle, ExternalLink,
  Check, AlertTriangle
} from 'lucide-react';
import { House, PaymentStatus, STBMRecord } from '../../../types';
import { useFinancial } from '../../../context/FinancialContext';
import { subscribeToSTBMRecords, saveSTBMRecord } from '../../../services/databaseService';
import { toast } from 'sonner';
import { KartuKeluargaModal } from './KartuKeluargaModal';

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
          notes: ''
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
    if (!selectedResident?.phone) {
      toast.error('Nomor telepon warga belum terdaftar.');
      return;
    }
    const cleanPhone = selectedResident.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const message = `Halo Bapak/Ibu ${selectedResident.headOfFamily} (Kavling Blok ${selectedResident.block} No. ${selectedResident.number}), kami dari Pengurus RT 002 / RW 020 Huntap Tondo 2 ingin berkoordinasi terkait pemeliharaan sanitasi lingkungan: "${stbmRecord?.problemType || 'Pemeriksaan sarana sanitasi'}". Kapan waktu luang yang tepat untuk kami tinjau bersama kader kesehatan? Terima kasih.`;
    window.open(`https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!isOpen || !selectedResident) return null;

  const arrears = getArrearsForHouse(selectedResident);
  const isFullyPaid = arrears.length === 0;
  
  const statusAir = getPaymentStatus(selectedResident, 'Air', selectedMonth);
  const statusSampah = getPaymentStatus(selectedResident, 'Sampah', selectedMonth);

  return (
    <div key="drawer-overlay" className="fixed inset-0 z-[100] flex justify-end">
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
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative w-full max-w-lg bg-slate-50 h-full shadow-xl overflow-y-auto"
      >
        <div className="min-h-full flex flex-col">
          {/* Header Section */}
          <div className="relative h-56 sm:h-72 shrink-0">
            {/* Gradient Placeholder */}
            <div className="absolute inset-0 bg-slate-900 overflow-hidden">
              {selectedResident.housePhotoUrl ? (
                <>
                  <img 
                    src={selectedResident.housePhotoUrl} 
                    alt="Foto Rumah" 
                    className="w-full h-full object-cover opacity-60 scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-905/30 to-transparent"></div>
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                </div>
              )}
            </div>

            {/* Top Bar Actions */}
            <div className="relative z-20 p-4 sm:p-6 flex justify-between items-center">
              <button 
                onClick={onClose}
                className="w-9 h-9 bg-white/15 backdrop-blur-md border border-white/10 text-white flex items-center justify-center rounded-xl hover:bg-white/25 transition-all"
              >
                <X size={16} />
              </button>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsKkModalOpen(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Lihat & Cetak Blanko Kartu Keluarga (KK)"
                >
                  <Printer size={13} /> Blanko KK
                </button>
                <button 
                  onClick={() => { onClose(); handleOpenEdit(selectedResident); }}
                  className="px-3.5 py-1.5 bg-white text-slate-800 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <FileText size={13} /> Edit
                </button>
              </div>
            </div>

            {/* Profile Brief */}
            <div className="absolute bottom-0 left-0 w-full p-5 sm:p-6 z-20">
              <div className="flex items-center sm:items-end gap-3 sm:gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-xl p-0.5 shadow-md flex-shrink-0 relative">
                  <div className="w-full h-full bg-indigo-50 rounded-lg flex items-center justify-center text-xl font-bold text-indigo-600">
                    {selectedResident.headOfFamily.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="mb-0.5">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="px-1.5 py-0.2 bg-white/20 backdrop-blur-md border border-white/20 rounded text-[8px] font-bold uppercase tracking-wider text-white">
                      Terverifikasi
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider border ${
                      isFullyPaid 
                        ? 'bg-emerald-500/20 border-emerald-500/20 text-emerald-300' 
                        : 'bg-rose-500/20 border-rose-500/20 text-rose-300'
                    }`}>
                      {isFullyPaid ? 'Lunas' : 'Tunggak'}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight leading-tight">{selectedResident.headOfFamily}</h2>
                  <p className="text-[10px] text-white/70 font-semibold mt-1 flex items-center gap-1">
                    <MapPin size={10} className="text-white/40" />
                    Blok {selectedResident.block} - No. {selectedResident.number}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Body Content */}
          <div className="p-5 sm:p-6 space-y-6 flex-1">
            {/* Resident ID Card Display */}
            <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-900 px-4 py-2.5 flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Shield size={12} className="text-indigo-400" />
                  <span className="text-[9px] font-bold text-white uppercase tracking-wider">Resident ID Card</span>
                </div>
                <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest">ID: {selectedResident.id.substring(0, 8).toUpperCase()}</span>
              </div>
              <div className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-2xl shadow-inner select-none">
                  🇮🇩
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status Kependudukan</p>
                  <p className="text-sm font-bold text-slate-800">{selectedResident.residenceType || 'Warga Tetap'}</p>
                  <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                    <ShieldCheck size={11} className="inline text-emerald-500" /> Terdaftar di RTHub RT-02
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions Tray */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  onClose();
                  openPayModal(selectedResident);
                }}
                className="p-4 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl shadow-xs transition-all text-center group"
              >
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-xs">
                  <DollarSign size={18} />
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Bayar Bulanan</p>
                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mt-0.5">Entri Iuran</p>
              </button>
              <button 
                onClick={() => { onClose(); setSelectedHouseForBills(selectedResident); }}
                className="p-4 bg-white border border-slate-200 hover:border-emerald-300 rounded-xl shadow-xs transition-all text-center group"
              >
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-xs">
                  <LayoutList size={18} />
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Data Pembayaran</p>
                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mt-0.5">Riwayat Bayar</p>
              </button>
            </div>

            {/* Detailed Info Groups */}
            <div className="space-y-6 pb-6">
              {/* Group: Dasar & Kontak */}
              <section className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-indigo-600 rounded-full"></div>
                  <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Kontak & Rumah</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem icon={<Phone size={13} />} label="Nomor WA / Telp" value={selectedResident.phone || 'N/A'} isUrgent={!!selectedResident.phone} />
                  <DetailItem icon={<MapPin size={13} />} label="Alamat Blok / No" value={`Blok ${selectedResident.block} No. ${selectedResident.number}`} />
                  <DetailItem icon={<Home size={13} />} label="Status Hunian" value={selectedResident.residenceType || 'Tetap'} />
                  <DetailItem 
                    icon={<FileText size={13} />} 
                    label="Status PBB" 
                    value={selectedResident.pbbStatus || 'Belum Diambil'} 
                    isUrgent={selectedResident.pbbStatus !== 'Sudah Diambil'} 
                  />
                  <DetailItem 
                    icon={<Droplets size={13} className={selectedResident.pdamStatus === 'Hilang' ? 'text-purple-600' : 'text-blue-500'} />} 
                    label="Meteran PDAM Palu" 
                    value={
                      selectedResident.pdamStatus === 'Hilang'
                        ? `🚨 Meteran Hilang${selectedResident.pdamLostDate ? ` (Tgl: ${selectedResident.pdamLostDate})` : ''} - Stop Kran Wajib Ditutup`
                        : `${selectedResident.pdamStatus || 'Terpasang'}${selectedResident.pdamMeterNumber ? ` (ID: ${selectedResident.pdamMeterNumber})` : ''}`
                    } 
                    isUrgent={selectedResident.pdamStatus === 'Belum Terpasang' || selectedResident.pdamStatus === 'Hilang'} 
                  />
                  <DetailItem icon={<FileText size={13} />} label="Nomor NIK" value={selectedResident.nik || '-'} isMain />
                  <DetailItem icon={<Users size={13} />} label="Nomor KK" value={selectedResident.kkNumber || '-'} isMain />
                  <DetailItem icon={<Calendar size={13} />} label="Bergabung Pada" value={selectedResident.joiningDate ? selectedResident.joiningDate.split('T')[0] : '-'} />
                  {selectedResident.residenceType !== 'Tetap' && (
                    <DetailItem icon={<Key size={13} />} label="Pemilik Rumah" value={`${selectedResident.ownerName || '-'}${selectedResident.ownerPhone ? ` (${selectedResident.ownerPhone})` : ''}`} />
                  )}
                </div>

                {/* Kendaraan Terparkir Breakdown */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <Car size={13} className="text-slate-400" />
                    <span>Kendaraan Terparkir:</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[11px] font-bold">
                      <Bike size={11} className="text-amber-600" />
                      {selectedResident.twoWheelCount || 0} Motor
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[11px] font-bold">
                      <Car size={11} className="text-blue-600" />
                      {selectedResident.fourWheelCount || 0} Mobil
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold pl-0.5">
                      ({(selectedResident.twoWheelCount || 0) + (selectedResident.fourWheelCount || 0) > 0 ? (selectedResident.twoWheelCount || 0) + (selectedResident.fourWheelCount || 0) : (selectedResident.vehicleCount || 0)} unit)
                    </span>
                  </div>
                </div>
              </section>

              {/* Group: Smart Tags */}
              {selectedResident.tags && selectedResident.tags.length > 0 && (
                <section className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100 shadow-xs">
                  <h4 className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider mb-2">Smart Tags Warga</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedResident.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-white text-indigo-700 border border-indigo-200 rounded-md text-xs font-bold shadow-2xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Group: Demografi & Silsilah Keluarga */}
              <section className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-emerald-600 rounded-full"></div>
                  <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Profil Demografi & Silsilah Keluarga</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <DetailItem label="Tempat, Tgl Lahir" value={`${selectedResident.birthPlace || '-'}, ${selectedResident.birthDate ? new Date(selectedResident.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}`} />
                  <DetailItem label="Pekerjaan" value={selectedResident.jobCategory || '-'} />
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
                      <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-[#475569] rounded-[4px] text-[9px] font-bold">
                        {(selectedResident.familyMembers?.length || 0) + 1} Jiwa
                      </span>
                    </div>
                  </div>
                  
                  {/* Root: Head of Family */}
                  <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-indigo-600 text-white rounded flex items-center justify-center text-xs font-bold">
                        {selectedResident.headOfFamily.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-indigo-950 leading-tight">{selectedResident.headOfFamily}</p>
                        <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wide mt-0.5">Kepala Keluarga (Utama)</p>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded text-[8px] font-bold uppercase">{selectedResident.gender || 'Laki-laki'}</span>
                  </div>

                  {/* Nodes: Family Members */}
                  {selectedResident.familyMembers && selectedResident.familyMembers.length > 0 ? (
                    <div className="pl-4 border-l-2 border-indigo-100 space-y-2 ml-4">
                      {selectedResident.familyMembers.map((member, idx) => (
                        <div key={member.name || idx} className="relative flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 hover:bg-white rounded-lg transition-colors">
                          <div className="absolute -left-4 top-1/2 w-4 h-0.5 bg-indigo-100"></div>
                          <div className="flex items-center gap-2">
                             <div className="w-7 h-7 bg-white border border-slate-200 rounded flex items-center justify-center text-slate-700 text-xs font-bold shrink-0">
                               {member.name.charAt(0).toUpperCase()}
                             </div>
                             <div>
                                <p className="text-xs font-bold text-slate-800 leading-tight">{member.name}</p>
                                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">{member.relation} • {member.job || 'N/A'}</p>
                             </div>
                          </div>
                          <span className="px-1.5 py-0.2 bg-white rounded border border-slate-150 text-[8px] font-bold text-slate-500 uppercase">{member.gender === 'Laki-laki' ? 'Pria' : 'Wanita'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] font-medium text-slate-400 italic text-center py-2 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                      Tinggal mandiri (Kepala Keluarga tunggal)
                    </p>
                  )}
                </div>
              </section>

              {/* Group: Riwayat Kepenghunian Kavling */}
              <section className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                  <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Riwayat Kepenghunian Kavling</h4>
                </div>

                <div className="relative pl-4 border-l-2 border-amber-100 space-y-4">
                  {/* Current Active Resident */}
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white ring-2 ring-emerald-100"></div>
                    <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="px-1.5 py-0.2 bg-emerald-500 text-white rounded text-[8px] font-bold uppercase tracking-wider">Penghuni Aktif</span>
                          <p className="text-xs font-bold text-slate-800 mt-1">{selectedResident.headOfFamily}</p>
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
                          <div className={`p-3.5 rounded-xl border transition-all ${
                            isTanpaPamit 
                              ? 'bg-rose-50/40 border-rose-200' 
                              : 'bg-slate-50 border-slate-200/80'
                          }`}>
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-xs font-bold text-slate-800">{history.headOfFamily}</p>
                                  {isTanpaPamit ? (
                                    <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5">
                                      <AlertTriangle size={9} className="text-rose-600" />
                                      Pindah Tanpa Pamit
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[8px] font-bold uppercase tracking-wider">
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
                              <p className={`text-[10px] mt-2 p-2 rounded-lg font-medium leading-relaxed ${
                                isTanpaPamit 
                                  ? 'bg-rose-100/60 text-rose-900 border border-rose-200/60' 
                                  : 'bg-white text-slate-600 border border-slate-200/60'
                              }`}>
                                <span className="font-bold">Kronologi:</span> {history.moveOutNotes}
                              </p>
                            )}
                            {history.familyMembers && history.familyMembers.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-1 flex-wrap">
                                <span className="text-[8px] font-bold text-slate-400 uppercase">Keluarga:</span>
                                {history.familyMembers.map((m, idx) => (
                                  <span key={idx} className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 font-medium">
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
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-150">
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
                      <p className="text-[10px] text-slate-400 italic pl-1">Belum ada catatan kepenghunian terdahulu.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Group: Profil Sanitasi & 5 Pilar STBM (Kawasan Huntap Tondo 2) */}
              <section className="bg-white p-5 rounded-xl border border-emerald-200/90 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-emerald-600 rounded-full"></div>
                    <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckSquare size={13} className="text-emerald-600" />
                      Profil Sanitasi (5 Pilar STBM)
                    </h4>
                  </div>
                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {stbmRecord && !stbmRecord.isBABS && stbmRecord.hasHealthyLatrine ? '100% ODF Sehat' : 'Perlu Pantau'}
                  </span>
                </div>

                <p className="text-[10.5px] text-slate-500 mb-3.5 leading-relaxed font-medium">
                  Status kepatuhan sanitasi hunian tetap merujuk Permenkes No. 3/2014 & infrastruktur PUPR:
                </p>

                {/* 5 Pilar Grid Items */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  {/* Pilar 1: Biotank */}
                  <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">1. Jamban Sehat</p>
                      <p className="text-xs font-extrabold text-slate-800">Biotank PUPR</p>
                    </div>
                    <button
                      onClick={() => handleToggleSTBM('hasHealthyLatrine')}
                      disabled={isSavingSTBM}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        stbmRecord?.hasHealthyLatrine ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {stbmRecord?.hasHealthyLatrine ? 'Ya' : 'Tidak'}
                    </button>
                  </div>

                  {/* Bebas BABS */}
                  <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Bebas BABS</p>
                      <p className="text-xs font-extrabold text-slate-800">Status ODF</p>
                    </div>
                    <button
                      onClick={() => handleToggleSTBM('isBABS')}
                      disabled={isSavingSTBM}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        stbmRecord?.isBABS ? 'bg-rose-600 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {stbmRecord?.isBABS ? 'BABS ⚠️' : 'Bebas ✓'}
                    </button>
                  </div>

                  {/* Pilar 2: CTPS */}
                  <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">2. Cuci Tangan</p>
                      <p className="text-xs font-extrabold text-slate-800">Sarana CTPS</p>
                    </div>
                    <button
                      onClick={() => handleToggleSTBM('hasCTPS')}
                      disabled={isSavingSTBM}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        stbmRecord?.hasCTPS ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {stbmRecord?.hasCTPS ? 'Ya' : 'Tidak'}
                    </button>
                  </div>

                  {/* Pilar 3: PAMM-RT */}
                  <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">3. Air & Makanan</p>
                      <p className="text-xs font-extrabold text-slate-800">PAMM-RT Aman</p>
                    </div>
                    <button
                      onClick={() => handleToggleSTBM('safeWaterAndFood')}
                      disabled={isSavingSTBM}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        stbmRecord?.safeWaterAndFood ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {stbmRecord?.safeWaterAndFood ? 'Ya' : 'Tidak'}
                    </button>
                  </div>

                  {/* Pilar 4: TPS3R */}
                  <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">4. Pilah Sampah</p>
                      <p className="text-xs font-extrabold text-slate-800">Layanan TPS3R</p>
                    </div>
                    <button
                      onClick={() => handleToggleSTBM('wasteManagement')}
                      disabled={isSavingSTBM}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        stbmRecord?.wasteManagement ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {stbmRecord?.wasteManagement ? 'Ya' : 'Tidak'}
                    </button>
                  </div>

                  {/* Pilar 5: SPALDT */}
                  <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">5. Limbah Cair</p>
                      <p className="text-xs font-extrabold text-slate-800">Pipa SPALDT</p>
                    </div>
                    <button
                      onClick={() => handleToggleSTBM('liquidWasteManagement')}
                      disabled={isSavingSTBM}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        stbmRecord?.liquidWasteManagement ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {stbmRecord?.liquidWasteManagement ? 'Ya' : 'Tidak'}
                    </button>
                  </div>
                </div>

                {/* Status Tindak Lanjut & Action */}
                {stbmRecord?.needsFollowUp || stbmRecord?.problemType ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 mt-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
                        <AlertTriangle size={14} className="shrink-0 text-rose-600" />
                        <span>Kendala Sanitasi: {stbmRecord.problemType || 'Perlu perbaikan'}</span>
                      </div>
                    </div>
                    {selectedResident.phone && (
                      <button
                        onClick={handleContactWhatsAppSanitasi}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <MessageCircle size={13} />
                        <span>Koordinasi via WhatsApp Warga</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-between text-xs text-emerald-900 font-semibold">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      Kavling Terverifikasi Sanitasi Sehat
                    </span>
                    <button
                      onClick={() => handleToggleSTBM('needsFollowUp')}
                      className="text-[10px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Tandai Masalah
                    </button>
                  </div>
                )}
              </section>

              {/* Group: Ronda & Catatan Khusus */}
              <section className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-indigo-600 rounded-full"></div>
                  <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Keamanan & Siskamling</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status Tugas Ronda</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">
                        {selectedResident.rondaExempt ? 'Bebas Tugas (Dispensasi)' : 'Wajib Ronda Siskamling Aktif'}
                      </p>
                    </div>
                    {!selectedResident.rondaExempt && (
                      <div className="flex gap-4 border-l border-slate-200 pl-4 shrink-0 text-right">
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Poin</p>
                          <p className="text-xs font-bold text-indigo-700">{selectedResident.rondaPoints || 0} Pts</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Tugas Bulan Ini</p>
                          <p className="text-xs font-bold text-slate-800">{selectedResident.rondaDutyCount || 0} Kali</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedResident.specialNotes && (
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                      <p className="text-[9px] font-bold text-amber-800 uppercase tracking-wider mb-1">Catatan Khusus Hunian</p>
                      <p className="text-xs font-semibold text-amber-900 leading-relaxed">{selectedResident.specialNotes}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Vulnerability Section */}
              {(selectedResident.isPKH || selectedResident.isBLT || selectedResident.isBPNT || selectedResident.isBansosLain || selectedResident.isDisability || selectedResident.isOrphan) && (
                <section className="bg-rose-50/40 p-5 rounded-xl border border-rose-100 shadow-xs relative">
                  <div className="absolute top-4 right-4 opacity-5">
                    <Shield size={44} className="text-rose-900" />
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 bg-rose-600 rounded-full"></div>
                    <h4 className="text-[10px] font-bold text-rose-950 uppercase tracking-wider">Kesejahteraan & Bansos</h4>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {selectedResident.isPKH && <BansosBadge label="Penerima PKH" />}
                    {selectedResident.isBLT && <BansosBadge label="Bansos BLT" />}
                    {selectedResident.isBPNT && <BansosBadge label="Rastra BPNT" />}
                    {selectedResident.isBansosLain && <BansosBadge label={selectedResident.bansosLainName || 'BANSOS'} />}
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(selectedResident.pregnantCount || 0) > 0 && <VulnerabilityStat count={selectedResident.pregnantCount || 0} label="Ibu Hamil" />}
                    {(selectedResident.elderlyCount || 0) > 0 && <VulnerabilityStat count={selectedResident.elderlyCount || 0} label="Lansia (60+)" />}
                    {(selectedResident.babyCount || 0) > 0 && <VulnerabilityStat count={selectedResident.babyCount || 0} label="Bayi (0-12 M)" />}
                    {(selectedResident.toddlerCount || 0) > 0 && <VulnerabilityStat count={selectedResident.toddlerCount || 0} label="Balita" />}
                    {(selectedResident.childCount || 0) > 0 && <VulnerabilityStat count={selectedResident.childCount || 0} label="Anak" />}
                    {(selectedResident.widowCount || 0) > 0 && <VulnerabilityStat count={selectedResident.widowCount || 0} label="Janda / Duda" />}
                  </div>
                </section>
              )}
            </div>

            {/* Bottom Menu / Danger Zone */}
            <div className="pt-4 border-t border-slate-100">
              <button 
                onClick={() => handleDelete(selectedResident.id)}
                className="w-full py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
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
const DetailItem = ({ icon, label, value, isUrgent = false, isMain = false }: { icon?: React.ReactNode, label: string, value: string, isUrgent?: boolean, isMain?: boolean }) => (
  <div className="space-y-0.5">
    <div className="flex items-center gap-1.5">
       {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
    <p className={`text-sm font-bold truncate ${isUrgent ? 'text-indigo-600' : 'text-slate-800'} ${isMain ? 'font-mono' : ''}`}>{value || '-'}</p>
  </div>
);

const BansosBadge = ({ label }: { label: string }) => (
  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded text-[9px] font-bold uppercase tracking-wider shadow-xs">
    {label}
  </span>
);

const VulnerabilityStat = ({ count, label }: { count: number, label: string }) => (
  <div className="p-2 bg-white rounded border border-rose-100 flex items-center justify-between">
    <span className="text-[9px] font-bold text-rose-900 uppercase tracking-wider">{label}</span>
    <span className="text-xs font-bold text-rose-600">{count}</span>
  </div>
);

