import React from 'react';
import { motion } from 'motion/react';
import { 
  X, Phone, MapPin, FileText, CreditCard, DollarSign, 
  LayoutList, Droplets, Trash2, Users, Activity 
} from 'lucide-react';
import { House, PaymentStatus } from '../../../types';
import { useFinancial } from '../../../context/FinancialContext';

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
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
        onClick={onClose}
      />
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto custom-scrollbar"
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Detail Warga</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Informasi Lengkap Keluarga</p>
            </div>
            <button 
              onClick={onClose}
              className="p-3 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-2xl transition-all"
            >
              <X size={24} />
            </button>
          </div>

          {/* Profile Header */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 text-center mb-10 text-white relative overflow-hidden shadow-xl shadow-indigo-600/20">
            {selectedResident.housePhotoUrl && (
              <div className="absolute inset-0 opacity-20">
                <img 
                  src={selectedResident.housePhotoUrl} 
                  alt="Foto Rumah" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="w-28 h-28 mx-auto bg-white/20 backdrop-blur-md text-white rounded-[2rem] flex items-center justify-center text-4xl font-black mb-6 border-4 border-white/30 shadow-2xl">
                {selectedResident.headOfFamily.charAt(0)}
              </div>
              <h2 className="text-3xl font-black mb-2">{selectedResident.headOfFamily}</h2>
              <p className="text-indigo-100/80 font-bold uppercase tracking-widest text-[10px]">Kepala Keluarga</p>
              
              {selectedResident.ownerName && selectedResident.ownerName !== selectedResident.headOfFamily && (
                <div className="mt-2 px-3 py-1 bg-white/10 rounded-lg inline-block">
                  <p className="text-[10px] font-bold text-white/90 uppercase tracking-widest">Pemilik: {selectedResident.ownerName}</p>
                </div>
              )}

              <div className="flex justify-center gap-3 mt-8">
                <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-xs font-black uppercase tracking-widest">
                  Blok {selectedResident.block}-{selectedResident.number}
                </div>
                <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-xs font-black uppercase tracking-widest">
                  {selectedResident.status === 'Occupied' ? 'Dihuni' : selectedResident.status === 'Empty' ? 'Kosong' : 'Usaha'}
                </div>
                {selectedResident.status === 'Occupied' && (
                  <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-xs font-black uppercase tracking-widest">
                    {selectedResident.residenceType === 'Kontrak' ? 'Kontrak' : selectedResident.residenceType === 'Kost' ? 'Kost' : selectedResident.residenceType === 'Rumah Keluarga' ? 'Rumah Keluarga' : 'Pemilik'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info Sections */}
          <div className="grid grid-cols-1 gap-8">
            <section>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Informasi Kontak</h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-3xl group hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                  <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Telepon / WA</p>
                    <p className="text-base font-bold text-slate-800">{selectedResident.phone || 'N/A'}</p>
                  </div>
                </div>
                {selectedResident.ownerPhone && (
                  <div className="flex items-center gap-4 p-5 bg-indigo-50/30 border border-indigo-100/50 rounded-3xl group hover:bg-white hover:shadow-lg hover:shadow-indigo-200/50 transition-all">
                    <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                      <Phone size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Kontak Pemilik</p>
                      <p className="text-base font-bold text-slate-800">{selectedResident.ownerPhone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-3xl group hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                  <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Alamat</p>
                    <p className="text-base font-bold text-slate-800">Blok {selectedResident.block} No. {selectedResident.number}</p>
                  </div>
                </div>
              </div>
            </section>

            {(selectedResident.ktpUrl || selectedResident.kkUrl) && (
              <section>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Dokumen Kependudukan</h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedResident.ktpUrl && (
                    <a 
                      href={selectedResident.ktpUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-3xl hover:bg-indigo-100 transition-all group"
                    >
                      <div className="p-2 bg-white text-indigo-600 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-indigo-900">Foto KTP</p>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Lihat Dokumen</p>
                      </div>
                    </a>
                  )}
                  {selectedResident.kkUrl && (
                    <a 
                      href={selectedResident.kkUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-3xl hover:bg-emerald-100 transition-all group"
                    >
                      <div className="p-2 bg-white text-emerald-600 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-900">Foto KK</p>
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Lihat Dokumen</p>
                      </div>
                    </a>
                  )}
                </div>
              </section>
            )}

            <section>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Status Keuangan</h4>
              <div className="space-y-3">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 w-2 h-full ${isFullyPaid ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">Iuran Bulanan</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Otomatis</p>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      isFullyPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {isFullyPaid ? 'Lunas' : `${arrears.length} Tunggakan`}
                    </span>
                  </div>

                  {!isFullyPaid && (
                    <div className="mb-6 px-4 py-3 bg-rose-50 rounded-2xl border border-rose-100">
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Daftar Tunggakan:</p>
                      <div className="flex flex-wrap gap-2">
                        {arrears.map(m => (
                          <span key={m} className="px-2 py-1 bg-white text-rose-600 rounded-lg text-[10px] font-bold border border-rose-200">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button 
                      onClick={() => openPayModal(selectedResident)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                    >
                      <DollarSign size={16} /> Bayar Iuran
                    </button>
                    <button 
                      onClick={() => { onClose(); setSelectedHouseForBills(selectedResident); }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      <LayoutList size={16} /> Riwayat
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-white border border-slate-100 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <Droplets size={14} />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Air</span>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                      statusAir === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {statusAir === PaymentStatus.PAID ? 'Lunas' : 'Belum'}
                    </span>
                  </div>
                  <div className="p-4 bg-white border border-slate-100 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                        <Trash2 size={14} />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sampah</span>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                      statusSampah === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {statusSampah === PaymentStatus.PAID ? 'Lunas' : 'Belum'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Identitas & Dokumen</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">NIK</p>
                  <p className="text-sm font-bold text-slate-800">{selectedResident.nik || '-'}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">No. KK</p>
                  <p className="text-sm font-bold text-slate-800">{selectedResident.kkNumber || '-'}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tempat Lahir</p>
                  <p className="text-sm font-bold text-slate-800">{selectedResident.birthPlace || '-'}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status Perkawinan</p>
                  <p className="text-sm font-bold text-slate-800">{selectedResident.maritalStatus || '-'}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Golongan Darah</p>
                  <p className="text-sm font-bold text-slate-800">{selectedResident.bloodType || '-'}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Kewarganegaraan</p>
                  <p className="text-sm font-bold text-slate-800">{selectedResident.nationality || '-'}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status BPJS</p>
                  <p className="text-sm font-bold text-slate-800">{selectedResident.bpjsStatus || '-'}</p>
                </div>
              </div>
              {selectedResident.addressKtp && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl mb-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Alamat KTP</p>
                  <p className="text-sm font-bold text-slate-800">{selectedResident.addressKtp}</p>
                </div>
              )}
            </section>

            <section>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Kesehatan & Lainnya</h4>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Vaksinasi</p>
                  <p className="text-sm font-bold text-slate-800">{selectedResident.vaccinationStatus || '-'}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tgl Bergabung</p>
                  <p className="text-sm font-bold text-slate-800">{selectedResident.joiningDate ? new Date(selectedResident.joiningDate).toLocaleDateString('id-ID') : '-'}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedResident.isVerified && <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Terverifikasi</span>}
                {selectedResident.isOutOfTown && <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">Luar Kota</span>}
                {selectedResident.hasGuest && <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">Ada Tamu</span>}
                {selectedResident.isIsoman && <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100">Isoman</span>}
              </div>

              {selectedResident.specialNotes && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-3xl">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-2">Catatan Khusus</p>
                  <p className="text-sm font-medium text-slate-700 italic">"{selectedResident.specialNotes}"</p>
                </div>
              )}
            </section>

            <section>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Demografi & Kerentanan</h4>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Jenis Kelamin</p>
                  <p className="text-sm font-bold text-slate-800">{selectedResident.gender || '-'}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tanggal Lahir</p>
                  <p className="text-sm font-bold text-slate-800">{selectedResident.birthDate ? new Date(selectedResident.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Agama</p>
                  <p className="text-sm font-bold text-slate-800">{selectedResident.religion || '-'}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pendidikan</p>
                  <p className="text-sm font-bold text-slate-800">{selectedResident.education || '-'}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pekerjaan</p>
                  <p className="text-sm font-bold text-slate-800">{selectedResident.jobCategory || '-'}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Kendaraan</p>
                  <p className="text-sm font-bold text-slate-800">{selectedResident.vehicleCount || 0} Unit</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Penghuni</p>
                  <p className="text-sm font-bold text-slate-800">{selectedResident.occupants || 0} Orang</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status Ekonomi</p>
                  <p className="text-sm font-bold text-slate-800">{selectedResident.economicStatus || 'Sejahtera'}</p>
                </div>
              </div>
              
              {((selectedResident.pregnantCount || 0) > 0 || (selectedResident.babyCount || 0) > 0 || (selectedResident.toddlerCount || 0) > 0 || (selectedResident.childCount || 0) > 0 || (selectedResident.teenagerCount || 0) > 0 || (selectedResident.adultCount || 0) > 0 || (selectedResident.elderlyCount || 0) > 0 || (selectedResident.widowCount || 0) > 0 || selectedResident.isDisability || selectedResident.isOrphan) && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-3xl">
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none mb-3">Kelompok Rentan</p>
                  <div className="flex flex-wrap gap-2">
                    {(selectedResident.pregnantCount || 0) > 0 && <span className="px-3 py-1 bg-white text-rose-600 rounded-full text-xs font-bold shadow-sm">{selectedResident.pregnantCount} Ibu Hamil</span>}
                    {(selectedResident.babyCount || 0) > 0 && <span className="px-3 py-1 bg-white text-cyan-600 rounded-full text-xs font-bold shadow-sm">{selectedResident.babyCount} Bayi</span>}
                    {(selectedResident.toddlerCount || 0) > 0 && <span className="px-3 py-1 bg-white text-orange-600 rounded-full text-xs font-bold shadow-sm">{selectedResident.toddlerCount} Balita</span>}
                    {(selectedResident.childCount || 0) > 0 && <span className="px-3 py-1 bg-white text-blue-600 rounded-full text-xs font-bold shadow-sm">{selectedResident.childCount} Anak</span>}
                    {(selectedResident.teenagerCount || 0) > 0 && <span className="px-3 py-1 bg-white text-indigo-600 rounded-full text-xs font-bold shadow-sm">{selectedResident.teenagerCount} Remaja</span>}
                    {(selectedResident.adultCount || 0) > 0 && <span className="px-3 py-1 bg-white text-emerald-600 rounded-full text-xs font-bold shadow-sm">{selectedResident.adultCount} Dewasa</span>}
                    {(selectedResident.elderlyCount || 0) > 0 && <span className="px-3 py-1 bg-white text-purple-600 rounded-full text-xs font-bold shadow-sm">{selectedResident.elderlyCount} Lansia</span>}
                    {(selectedResident.widowCount || 0) > 0 && <span className="px-3 py-1 bg-white text-slate-600 rounded-full text-xs font-bold shadow-sm">{selectedResident.widowCount} Janda</span>}
                    {selectedResident.isDisability && <span className="px-3 py-1 bg-white text-rose-600 rounded-full text-xs font-bold shadow-sm">{selectedResident.disabilityCount || 1} Disabilitas</span>}
                    {selectedResident.isOrphan && <span className="px-3 py-1 bg-white text-rose-600 rounded-full text-xs font-bold shadow-sm">{selectedResident.orphanCount || 1} Yatim/Piatu</span>}
                  </div>
                </div>
              )}

              {(selectedResident.isPKH || selectedResident.isBLT || selectedResident.isBPNT || selectedResident.isBansosLain) && (
                <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">Penerima Bantuan Sosial</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedResident.isPKH && <span className="px-3 py-1 bg-white text-indigo-600 rounded-full text-xs font-bold shadow-sm">PKH</span>}
                    {selectedResident.isBLT && <span className="px-3 py-1 bg-white text-indigo-600 rounded-full text-xs font-bold shadow-sm">BLT</span>}
                    {selectedResident.isBPNT && <span className="px-3 py-1 bg-white text-indigo-600 rounded-full text-xs font-bold shadow-sm">BPNT</span>}
                    {selectedResident.isBansosLain && (
                      <span className="px-3 py-1 bg-white text-indigo-600 rounded-full text-xs font-bold shadow-sm">
                        {selectedResident.bansosLainName || 'Bansos Lainnya'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Anggota Keluarga</h4>
              {selectedResident.familyMembers && selectedResident.familyMembers.length > 0 ? (
                <div className="space-y-3">
                  {selectedResident.familyMembers.map((member, idx) => (
                    <div key={member.id || idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-800">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.relation} • {member.birthDate ? new Date(member.birthDate).toLocaleDateString('id-ID') : '-'}</p>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded border border-slate-200">
                        {member.nik || 'No NIK'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50/50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                    <Users size={32} />
                  </div>
                  <p className="text-sm font-bold text-slate-400">Belum ada data anggota keluarga</p>
                  <button onClick={() => { onClose(); handleOpenEdit(selectedResident); }} className="mt-4 text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Tambah Anggota</button>
                </div>
              )}
            </section>
          </div>

          {/* Actions Footer */}
          <div className="mt-12 pt-8 border-t border-slate-100 flex gap-4">
            <button 
              onClick={() => { onClose(); handleOpenEdit(selectedResident); }}
              className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all shadow-sm"
            >
              Edit Data
            </button>
            <button 
              onClick={() => handleDelete(selectedResident.id)}
              className="flex-1 py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-black text-sm hover:bg-rose-600 hover:text-white transition-all shadow-sm"
            >
              Hapus Warga
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
