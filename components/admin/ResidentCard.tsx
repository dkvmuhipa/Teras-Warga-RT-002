import React from 'react';
import { House, PaymentStatus, Bill } from '../../types';
import { 
  Phone, CheckCircle, DollarSign, Edit2, AlertCircle, 
  MessageCircle, MapPin, ShieldCheck, FileText, Users, 
  Copy, ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface ResidentCardProps {
  house: House;
  bills: Bill[];
  onOpenDetail: (house: House) => void;
  onOpenEdit: (house: House) => void;
  onDelete: (id: string) => void;
  onOpenBills: (house: House) => void;
  onOpenPay: (house: House) => void;
  onSendWhatsApp?: (house: House) => void;
  onUpdatePBB?: (house: House) => void;
  dynamicStatusAir?: PaymentStatus;
  dynamicStatusSampah?: PaymentStatus;
  arrears?: string[];
}

export const ResidentCard: React.FC<ResidentCardProps> = ({ 
  house, bills, onOpenDetail, onOpenEdit, onDelete, onOpenBills, onOpenPay, onSendWhatsApp,
  onUpdatePBB,
  dynamicStatusAir, dynamicStatusSampah, arrears = []
}) => {
  const statusAir = dynamicStatusAir || house.paymentStatusAir;
  const statusSampah = dynamicStatusSampah || house.paymentStatusSampah;

  const isDuesPaid = statusAir === PaymentStatus.PAID && statusSampah === PaymentStatus.PAID;

  // Compute demographic & posyandu metrics
  const occupantsCount = Math.max(house.occupants || 1, 1 + (house.familyMembers?.length || 0));
  const hasBabyOrToddler = Boolean((house.babyCount && house.babyCount > 0) || (house.toddlerCount && house.toddlerCount > 0) || house.hasBaby || house.hasToddler);
  const toddlerTotal = (house.babyCount || 0) + (house.toddlerCount || 0);
  const hasElderly = Boolean((house.elderlyCount && house.elderlyCount > 0) || house.hasElderly);
  const hasPregnant = Boolean((house.pregnantCount && house.pregnantCount > 0) || house.hasPregnant);

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (house.phone) {
      navigator.clipboard.writeText(house.phone);
      toast.success('Nomor telepon disalin ke clipboard!');
    }
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSendWhatsApp) {
      onSendWhatsApp(house);
    } else if (house.phone) {
      let cleaned = house.phone.replace(/[^0-9]/g, '');
      if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.slice(1);
      }
      const text = encodeURIComponent(`Halo Bapak/Ibu ${house.headOfFamily}, kami dari Pengurus RT 02 / RW 020 Huntap Tondo 2 ingin berkoordinasi mengenai administrasi warga.`);
      window.open(`https://wa.me/${cleaned}?text=${text}`, '_blank');
    }
  };

  return (
    <motion.div 
      layout
      whileHover={{ y: -3 }}
      className="relative bg-white p-5 md:p-6 rounded-[2rem] border border-slate-200/80 shadow-2xs hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/8 transition-all duration-300 group overflow-hidden flex flex-col justify-between select-none"
    >
      {/* Ambient background glow */}
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />

      <div>
        {/* Header: Identity Section */}
        <div className="flex justify-between items-start mb-3 relative z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Refined Squircle Avatar */}
            <div className="relative shrink-0">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow-xs transition-all ${
                house.status === 'Occupied' 
                  ? 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white shadow-indigo-500/25 ring-2 ring-indigo-500/20 ring-offset-2 ring-offset-white' 
                  : house.status === 'Visiting'
                  ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sky-500/20'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}>
                {house.headOfFamily && house.headOfFamily !== '-' 
                  ? house.headOfFamily.charAt(0).toUpperCase() 
                  : <MapPin size={18} className="text-slate-400" />}
              </div>
              {house.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-xs">
                  <div className="bg-emerald-500 text-white p-0.5 rounded-full">
                    <ShieldCheck size={11} strokeWidth={3} />
                  </div>
                </div>
              )}
            </div>

            {/* Name & Residence details */}
            <div className="min-w-0 flex-1">
              <h4 className="font-black text-slate-900 text-sm tracking-tight truncate leading-snug">
                {house.headOfFamily && house.headOfFamily !== '-' ? house.headOfFamily : (house.ownerName ? `Hunian: ${house.ownerName}` : 'Rumah Kosong')}
              </h4>
              <p className="text-[11px] text-slate-400 font-semibold truncate mt-0.5">
                {house.ownerName && house.ownerName !== house.headOfFamily ? `Pemilik: ${house.ownerName}` : `Keluarga RT 02`}
              </p>
              
              {/* Status Pill Badges */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="px-2.5 py-0.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-wider shadow-2xs border border-slate-800">
                  Blok {house.block}-{house.number}
                </span>
                
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wide border ${
                  house.status === 'Occupied' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' :
                  house.status === 'Empty' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                  house.status === 'Business' ? 'bg-purple-50 text-purple-700 border-purple-200/80' :
                  'bg-sky-50 text-sky-700 border-sky-200/80'
                }`}>
                  {house.status === 'Occupied' ? 'Dihuni' : 
                   house.status === 'Empty' ? 'Kosong' : 
                   house.status === 'Business' ? 'Usaha' : 'Mengunjungi'}
                </span>

                {house.residenceType && (
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wide border ${
                    house.residenceType === 'Tetap' ? 'bg-blue-50 text-blue-700 border-blue-200/80' :
                    house.residenceType === 'Sewa' ? 'bg-amber-50 text-amber-700 border-amber-200/80' :
                    'bg-indigo-50 text-indigo-700 border-indigo-200/80'
                  }`}>
                    {house.residenceType === 'Rumah Keluarga' ? 'Keluarga' : house.residenceType}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Demographic & Posyandu Priority Micro-Bar (Full Information) */}
        {house.status === 'Occupied' && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3 pt-2.5 border-t border-slate-100/90 text-[10px] font-bold text-slate-600 relative z-10">
            <span className="flex items-center gap-1 bg-slate-100/80 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200/70">
              <Users size={11} className="text-indigo-600 stroke-[2.5]" />
              <span>{occupantsCount} Jiwa</span>
            </span>

            {hasBabyOrToddler && (
              <span className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-lg border border-purple-200/70 font-extrabold">
                <span>👶</span>
                <span>{toddlerTotal > 0 ? `${toddlerTotal} Balita` : 'Balita'}</span>
              </span>
            )}

            {hasElderly && (
              <span className="flex items-center gap-1 bg-teal-50 text-teal-700 px-2 py-0.5 rounded-lg border border-teal-200/70 font-extrabold">
                <span>🧓</span>
                <span>{house.elderlyCount ? `${house.elderlyCount} Lansia` : 'Lansia'}</span>
              </span>
            )}

            {hasPregnant && (
              <span className="flex items-center gap-1 bg-pink-50 text-pink-700 px-2 py-0.5 rounded-lg border border-pink-200/70 font-extrabold">
                <span>🤰</span>
                <span>Bumil</span>
              </span>
            )}

            {house.twoWheelCount && house.twoWheelCount > 0 ? (
              <span className="hidden sm:inline-flex items-center gap-1 bg-slate-50 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200/60 text-[9px]">
                🛵 {house.twoWheelCount}
              </span>
            ) : null}
          </div>
        )}

        {/* Info Stats Section: Dual Financial Widget */}
        <div className="grid grid-cols-2 gap-2.5 mb-3 relative z-10">
          <div className={`p-3 rounded-2xl border transition-all ${
            isDuesPaid 
              ? 'bg-emerald-50/70 border-emerald-200/70 text-emerald-800' 
              : 'bg-rose-50/70 border-rose-200/70 text-rose-800'
          }`}>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Status Iuran</p>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isDuesPaid ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-rose-500'}`} />
              <p className="text-xs font-black">
                {isDuesPaid ? 'Lunas' : 'Menunggak'}
              </p>
            </div>
          </div>
          <div className="p-3 bg-slate-50/80 border border-slate-200/70 rounded-2xl">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Tunggakan</p>
            <p className={`text-xs font-black font-mono ${arrears.length > 0 ? 'text-rose-600' : 'text-emerald-600 flex items-center gap-1'}`}>
              {arrears.length > 0 ? `${arrears.length} Bulan` : <><span>Nihil</span> <CheckCircle size={11} /></>}
            </p>
          </div>
        </div>

        {/* PBB Status Tracking */}
        {house.status === 'Occupied' && (
          <div className="mb-3 relative z-10">
            <button 
              onClick={(e) => { e.stopPropagation(); onUpdatePBB?.(house); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all duration-200 ${
                house.pbbStatus === 'Sudah Diambil' 
                  ? 'bg-emerald-50/70 text-emerald-700 border-emerald-200/70 hover:bg-emerald-100/80' 
                  : 'bg-amber-50/70 text-amber-800 border-amber-200/70 hover:bg-amber-100/80'
              }`}
              title="Klik untuk memperbarui status tanda terima PBB"
            >
              <div className="flex items-center gap-2">
                <FileText size={14} className={house.pbbStatus === 'Sudah Diambil' ? 'text-emerald-600' : 'text-amber-600'} />
                <div className="text-left">
                  <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">PBB {house.pbbYear || new Date().getFullYear()}</p>
                  <p className="text-[10px] font-black uppercase leading-none mt-0.5">{house.pbbStatus || 'Belum Diambil'}</p>
                </div>
              </div>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                house.pbbStatus === 'Sudah Diambil' 
                  ? 'bg-white/80 text-emerald-800 border-emerald-200' 
                  : 'bg-white/80 text-amber-800 border-amber-200'
              }`}>
                {house.pbbStatus === 'Sudah Diambil' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                <span>Ubah</span>
              </span>
            </button>
          </div>
        )}

        {/* Contact Quick Link Bar */}
        <div className="mb-4 relative z-10">
          <div className="flex items-center justify-between p-2.5 bg-slate-50/90 border border-slate-200/70 rounded-2xl transition-all hover:bg-slate-100/70">
            <div className="flex items-center gap-2 min-w-0">
              <Phone size={13} className="text-slate-400 shrink-0" />
              <span className="text-[11px] font-bold text-slate-700 tracking-tight truncate font-mono">
                {house.phone || 'Belum ada nomor HP'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {house.phone && (
                <button
                  onClick={handleCopyPhone}
                  className="p-1.5 rounded-xl bg-white hover:bg-slate-200/70 text-slate-500 border border-slate-200/80 transition-colors shadow-2xs"
                  title="Salin Nomor HP"
                >
                  <Copy size={12} />
                </button>
              )}
              {house.phone && (
                <button 
                  onClick={handleWhatsAppClick} 
                  className="px-2.5 py-1.5 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white border border-[#25D366]/30 transition-all flex items-center gap-1 text-[10px] font-black shadow-2xs"
                  title="Hubungi via WhatsApp"
                >
                  <MessageCircle size={13} className="stroke-[2.5]" />
                  <span>WhatsApp</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Executive Action Buttons */}
      <div className="flex items-center gap-2 pt-3.5 border-t border-slate-100/90 relative z-10 mt-auto">
        <button 
          onClick={() => onOpenDetail(house)} 
          className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-[0.98] shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
        >
          <span>Detail Warga</span>
          <ArrowRight size={13} className="stroke-[2.5]" />
        </button>
        <div className="flex gap-1.5">
          <IconButton icon={<DollarSign size={16} />} onClick={() => onOpenPay(house)} color="emerald" title="Bayar Iuran Kas" />
          <IconButton icon={<Edit2 size={15} />} onClick={() => onOpenEdit(house)} color="slate" title="Edit Data Warga" />
        </div>
      </div>
    </motion.div>
  );
};

const IconButton = ({ icon, onClick, color = 'slate', title }: { icon: any, onClick: () => void, color?: string, title: string }) => {
  const themes: any = {
    emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border-emerald-200/70',
    rose: 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border-rose-200/70',
    indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border-indigo-200/70',
    slate: 'bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white border-slate-200/70',
  };

  return (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`p-2.5 rounded-xl border transition-all duration-200 shadow-2xs active:scale-95 ${themes[color]}`}
      title={title}
    >
      {React.cloneElement(icon as React.ReactElement, { size: 16, className: 'stroke-[2.4px]' })}
    </button>
  );
};
