import React from 'react';
import { motion } from 'motion/react';
import { 
  X, Phone, MapPin, FileText, CreditCard, DollarSign, 
  LayoutList, Droplets, Trash2, Users, Activity, Shield, User,
  ShieldCheck, Calendar, AlertCircle
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
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
        onClick={onClose}
      />
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-xl bg-slate-50 h-full shadow-2xl overflow-y-auto custom-scrollbar"
      >
        <div className="min-h-full flex flex-col">
          {/* Header Section */}
          <div className="relative h-96 shrink-0">
            {/* House Photo or Gradient Placeholder */}
            <div className="absolute inset-0 bg-slate-900 overflow-hidden">
              {selectedResident.housePhotoUrl ? (
                <>
                  <img 
                    src={selectedResident.housePhotoUrl} 
                    alt="Foto Rumah" 
                    className="w-full h-full object-cover opacity-60 scale-110 hover:scale-100 transition-transform duration-1000"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-indigo-900 to-violet-900">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
                </div>
              )}
            </div>

            {/* Top Bar Actions */}
            <div className="relative z-20 p-8 flex justify-between items-center">
              <button 
                onClick={onClose}
                className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center rounded-2xl hover:bg-white/20 transition-all hover:scale-105"
              >
                <X size={20} />
              </button>
              <div className="flex gap-3">
                <button 
                  onClick={() => { onClose(); handleOpenEdit(selectedResident); }}
                  className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-xl"
                >
                  <FileText size={14} /> Edit
                </button>
              </div>
            </div>

            {/* Profile Brief */}
            <div className="absolute bottom-0 left-0 w-full p-10 z-20">
               <div className="flex items-end gap-6">
                  <div className="w-24 h-24 bg-white rounded-3xl p-1 shadow-2xl flex-shrink-0 group overflow-hidden relative">
                    <div className="w-full h-full bg-slate-100 rounded-[1.25rem] flex items-center justify-center text-3xl font-black text-indigo-600">
                      {selectedResident.headOfFamily.charAt(0)}
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] text-white">
                        Warga Terverifikasi
                      </span>
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${isFullyPaid ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/20 border-rose-500/30 text-rose-300'}`}>
                        {isFullyPaid ? 'LUNAS IURAN' : 'MENUNGGAK'}
                      </span>
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tight leading-tight">{selectedResident.headOfFamily}</h2>
                    <div className="flex items-center gap-2 mt-4">
                       <MapPin size={14} className="text-white/40" />
                       <span className="text-[11px] font-black text-white/60 uppercase tracking-widest">Domisili: Blok {selectedResident.block} - #{selectedResident.number}</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Main Body Content */}
          <div className="p-8 space-y-12 flex-1">
            {/* Professional Resident ID Card Display */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
              <div className="relative bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="bg-slate-900 px-8 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-indigo-400" />
                    <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Smart Resident Card</span>
                  </div>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">ID: {selectedResident.id.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="p-8 flex items-center gap-8">
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-4xl shadow-inner">
                    🇮🇩
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Kependudukan</p>
                    <p className="text-lg font-black text-slate-900 tracking-tight">{selectedResident.residenceType || 'Pemilik Tetap'}</p>
                    <div className="flex items-center gap-2 mt-2">
                       {selectedResident.isVerified ? (
                        <>
                          <ShieldCheck size={14} className="text-emerald-500" />
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Data Terverifikasi RT-02</span>
                        </>
                       ) : (
                        <>
                          <AlertCircle size={14} className="text-amber-500" />
                          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Belum Terverifikasi</span>
                        </>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Tray */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => openPayModal(selectedResident)}
                className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all text-center group"
              >
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-sm">
                  <DollarSign size={24} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Entri</p>
                <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Iuran Bulanan</p>
              </button>
              <button 
                onClick={() => { onClose(); setSelectedHouseForBills(selectedResident); }}
                className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all text-center group"
              >
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-sm">
                  <LayoutList size={24} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pantau</p>
                <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Riwayat Bayar</p>
              </button>
            </div>

            {/* Detailed Info Groups */}
            <div className="space-y-12 pb-10">
              {/* Group: Dasar & Kontak */}
              <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200/60 shadow-sm relative overflow-hidden group/sec">
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover/sec:scale-110 transition-transform"></div>
                <div className="flex items-center gap-3 mb-10 relative z-10">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Data Primer & Kontak</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                  <DetailItem icon={<Phone size={16} />} label="Nomor WhatsApp" value={selectedResident.phone || 'N/A'} isUrgent={!!selectedResident.phone} />
                  <DetailItem icon={<MapPin size={16} />} label="Unit Hunian" value={`Blok ${selectedResident.block} - Nomor ${selectedResident.number}`} />
                  <DetailItem icon={<FileText size={16} />} label="Nomor NIK" value={selectedResident.nik || '-'} isMain />
                  <DetailItem icon={<Users size={16} />} label="Nomor Keluarga" value={selectedResident.kkNumber || '-'} isMain />
                  <DetailItem icon={<Calendar size={16} />} label="Mulai Menempati" value={selectedResident.joiningDate || '-'} />
                  <DetailItem icon={<Activity size={16} />} label="Kepemilikan" value={selectedResident.residenceType || 'Pemilik'} />
                  {selectedResident.ownerName && (
                    <DetailItem icon={<User size={16} />} label="Pemilik Rumah" value={selectedResident.ownerName} />
                  )}
                  {selectedResident.ownerPhone && (
                    <DetailItem icon={<Phone size={16} />} label="Kontak Pemilik" value={selectedResident.ownerPhone} isUrgent />
                  )}
                </div>
              </section>

              {/* Group: Demografi */}
              <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Profil Demografis</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                  <DetailItem label="Tempat, Tgl Lahir" value={`${selectedResident.birthPlace || '-'}, ${selectedResident.birthDate ? new Date(selectedResident.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}`} />
                  <DetailItem label="Pekerjaan" value={selectedResident.jobCategory || '-'} />
                  <DetailItem label="Pendidikan Terakhir" value={selectedResident.education || '-'} />
                  <DetailItem label="Status Ekonomi" value={selectedResident.economicStatus || 'Sejahtera'} />
                  <DetailItem label="Asuransi Kesehatan" value={selectedResident.bpjsStatus || 'N/A'} />
                  <DetailItem label="Agama" value={selectedResident.religion || '-'} />
                </div>

                {/* Family Members Section - Enhanced */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anggota Keluarga Terdata</p>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black">{selectedResident.familyMembers?.length || 0} Jiwa</span>
                  </div>
                  
                  {selectedResident.familyMembers && selectedResident.familyMembers.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {selectedResident.familyMembers.map((member, idx) => (
                        <div key={member.id || idx} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-200/40 hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 transition-all group/member">
                          <div className="flex items-center gap-4">
                             <div className="w-11 h-11 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-indigo-600 text-sm font-black shadow-sm group-hover/member:border-indigo-200 transition-colors">
                               {member.name.charAt(0)}
                             </div>
                             <div>
                                <p className="text-sm font-black text-slate-800">{member.name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{member.relation} • {member.job || 'Tidak Bekerja'} • {member.nik || 'NIK N/A'}</p>
                             </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                             <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-100 text-[9px] font-black text-slate-500 uppercase">{member.gender === 'Laki-laki' ? 'PRIA' : 'WANITA'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Belum ada data anggota keluarga</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Vulnerability Section */}
              {(selectedResident.isPKH || selectedResident.isBLT || selectedResident.isBPNT || selectedResident.isBansosLain || selectedResident.isDisability || selectedResident.isOrphan) && (
                <section className="bg-rose-50/40 p-10 rounded-[3.5rem] border border-rose-100 shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Shield size={64} className="text-rose-900" />
                  </div>
                  <div className="flex items-center gap-3 mb-8 relative z-10">
                    <div className="w-1.5 h-6 bg-rose-600 rounded-full"></div>
                    <h4 className="text-[11px] font-black text-rose-950 uppercase tracking-[0.2em]">Prioritas & Afiliasi</h4>
                  </div>
                  
                  <div className="flex flex-wrap gap-2.5 relative z-10">
                    {selectedResident.isPKH && <BansosBadge label="Penerima PKH" />}
                    {selectedResident.isBLT && <BansosBadge label="Subsidi BLT" />}
                    {selectedResident.isBPNT && <BansosBadge label="Bantuan BPNT" />}
                    {selectedResident.isBansosLain && <BansosBadge label={selectedResident.bansosLainName || 'BANSOS'} />}
                    {selectedResident.isDisability && <BansosBadge label="PENYANDANG DISABILITAS" color="rose" />}
                    {selectedResident.isOrphan && <BansosBadge label="YATIM / PIATU" color="rose" />}
                  </div>

                  <div className="mt-10 grid grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                     {(selectedResident.pregnantCount || 0) > 0 && <VulnerabilityStat count={selectedResident.pregnantCount || 0} label="Ibu Hamil" />}
                     {(selectedResident.elderlyCount || 0) > 0 && <VulnerabilityStat count={selectedResident.elderlyCount || 0} label="Lansia" />}
                     {(selectedResident.babyCount || 0) > 0 && <VulnerabilityStat count={selectedResident.babyCount || 0} label="Bayi" />}
                     {(selectedResident.toddlerCount || 0) > 0 && <VulnerabilityStat count={selectedResident.toddlerCount || 0} label="Balita" />}
                     {(selectedResident.childCount || 0) > 0 && <VulnerabilityStat count={selectedResident.childCount || 0} label="Anak" />}
                     {(selectedResident.teenagerCount || 0) > 0 && <VulnerabilityStat count={selectedResident.teenagerCount || 0} label="Remaja" />}
                     {(selectedResident.adultCount || 0) > 0 && <VulnerabilityStat count={selectedResident.adultCount || 0} label="Dewasa" />}
                     {(selectedResident.widowCount || 0) > 0 && <VulnerabilityStat count={selectedResident.widowCount || 0} label="Janda/Duda" />}
                     {(selectedResident.disabilityCount || 0) > 0 && <VulnerabilityStat count={selectedResident.disabilityCount || 0} label="Disabilitas" />}
                     {(selectedResident.orphanCount || 0) > 0 && <VulnerabilityStat count={selectedResident.orphanCount || 0} label="Yatim/Piatu" />}
                  </div>
                </section>
              )}
            </div>

            {/* Bottom Menu / Danger Zone */}
            <div className="pt-10 border-t border-slate-100 flex flex-col gap-4">
              <button 
                onClick={() => handleDelete(selectedResident.id)}
                className="w-full py-5 bg-rose-50 text-rose-600 border border-rose-100 rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95 flex items-center justify-center gap-3"
              >
                <Trash2 size={16} /> Arsipkan / Hapus Data Warga
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Sub-components
const DetailItem = ({ icon, label, value, isUrgent = false, isMain = false }: { icon?: React.ReactNode, label: string, value: string, isUrgent?: boolean, isMain?: boolean }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
       {icon && <span className="text-slate-400">{icon}</span>}
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
    <p className={`text-base font-black tracking-tight ${isUrgent ? 'text-indigo-600' : 'text-slate-800'} ${isMain ? 'font-mono' : ''}`}>{value || '-'}</p>
  </div>
);

const BansosBadge = ({ label, color = 'indigo' }: { label: string, color?: 'indigo' | 'rose' }) => (
  <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
    color === 'indigo' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-rose-600 text-white shadow-rose-200'
  }`}>
    {label}
  </span>
);

const VulnerabilityStat = ({ count, label }: { count: number, label: string }) => (
  <div className="p-4 bg-white rounded-2xl border border-rose-100 flex items-center justify-between">
    <span className="text-[10px] font-black text-rose-900 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-black text-rose-600">{count}</span>
  </div>
);

