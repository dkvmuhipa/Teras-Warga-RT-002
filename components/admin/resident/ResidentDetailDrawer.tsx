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
              <div className="flex gap-2">
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
                onClick={() => openPayModal(selectedResident)}
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
                  <DetailItem 
                    icon={<FileText size={13} />} 
                    label="Status PBB" 
                    value={selectedResident.pbbStatus || 'Belum Diambil'} 
                    isUrgent={selectedResident.pbbStatus !== 'Sudah Diambil'} 
                  />
                  <DetailItem icon={<FileText size={13} />} label="Nomor NIK" value={selectedResident.nik || '-'} isMain />
                  <DetailItem icon={<Users size={13} />} label="Nomor KK" value={selectedResident.kkNumber || '-'} isMain />
                  <DetailItem icon={<Calendar size={13} />} label="Bergabung Pada" value={selectedResident.joiningDate ? selectedResident.joiningDate.split('T')[0] : '-'} />
                </div>
              </section>

              {/* Group: Demografi */}
              <section className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-emerald-600 rounded-full"></div>
                  <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Profil Demografi</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <DetailItem label="Tempat, Tgl Lahir" value={`${selectedResident.birthPlace || '-'}, ${selectedResident.birthDate ? new Date(selectedResident.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}`} />
                  <DetailItem label="Pekerjaan" value={selectedResident.jobCategory || '-'} />
                  <DetailItem label="Pendidikan Terakhir" value={selectedResident.education || '-'} />
                  <DetailItem label="Agama" value={selectedResident.religion || '-'} />
                </div>

                {/* Family Members Section */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Anggota Keluarga Terkait</p>
                    <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-[#475569] rounded-[4px] text-[9px] font-bold">{selectedResident.familyMembers?.length || 0} Jiwa</span>
                  </div>
                  
                  {selectedResident.familyMembers && selectedResident.familyMembers.length > 0 ? (
                    <div className="space-y-2">
                      {selectedResident.familyMembers.map((member, idx) => (
                        <div key={member.name || idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 hover:bg-white rounded-lg transition-colors">
                          <div className="flex items-center gap-2.5">
                             <div className="w-8 h-8 bg-white border border-slate-200 rounded flex items-center justify-center text-slate-700 text-xs font-bold">
                               {member.name.charAt(0).toUpperCase()}
                             </div>
                             <div>
                                <p className="text-xs font-bold text-slate-800 leading-tight">{member.name}</p>
                                <p className="text-[9px] font-semibold text-slate-405 uppercase tracking-wide mt-0.5">{member.relation} • {member.job || 'N/A'}</p>
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

