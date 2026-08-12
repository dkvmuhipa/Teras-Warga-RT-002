import React from 'react';
import { House, PaymentStatus, Bill } from '../../types';
import { Phone, CheckCircle, XCircle, DollarSign, Edit2, Trash2, LayoutList, AlertCircle, MessageCircle, MapPin, User, ShieldCheck, FileText } from 'lucide-react';
import { motion } from 'motion/react';

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
  const houseBills = bills.filter(b => b.houseId === house.id);
  
  const statusAir = dynamicStatusAir || house.paymentStatusAir;
  const statusSampah = dynamicStatusSampah || house.paymentStatusSampah;

  const isDuesPaid = statusAir === PaymentStatus.PAID && statusSampah === PaymentStatus.PAID;

  return (
    <motion.div 
      layout
      whileHover={{ y: -3 }}
      className="relative bg-white p-5 md:p-6 rounded-[2rem] border border-slate-200/80 shadow-sm hover:border-indigo-300 hover:shadow-xl transition-all duration-300 group overflow-hidden flex flex-col justify-between"
    >
      <div>
        {/* Header: Identity Section */}
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border transition-colors ${
                house.status === 'Occupied' 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-150 shadow-sm' 
                  : house.status === 'Visiting'
                  ? 'bg-sky-50 text-sky-700 border-sky-150'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}>
                {house.headOfFamily && house.headOfFamily !== '-' 
                  ? house.headOfFamily.charAt(0).toUpperCase() 
                  : <MapPin size={18} className="text-slate-400" />}
              </div>
              {house.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-sm">
                  <div className="bg-emerald-500 text-white p-0.5 rounded-full">
                    <ShieldCheck size={11} strokeWidth={3} />
                  </div>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-slate-900 text-sm tracking-tight truncate max-w-[170px] leading-snug">
                {house.headOfFamily && house.headOfFamily !== '-' ? house.headOfFamily : (house.ownerName ? `Hunian: ${house.ownerName}` : 'Rumah Kosong')}
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">
                {house.ownerName && house.ownerName !== house.headOfFamily ? `Pemilik: ${house.ownerName}` : `Rumah RT 02`}
              </p>
              
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="px-2 py-0.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-wider">
                  Blok {house.block}-{house.number}
                </span>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-lg uppercase tracking-wide border ${
                  house.status === 'Occupied' ? 'bg-indigo-50 text-indigo-700 border-indigo-200/60' :
                  house.status === 'Empty' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                  house.status === 'Business' ? 'bg-purple-50 text-purple-700 border-purple-200/60' :
                  'bg-sky-50 text-sky-700 border-sky-200/60'
                }`}>
                  {house.status === 'Occupied' ? 'Dihuni' : 
                   house.status === 'Empty' ? 'Kosong' : 
                   house.status === 'Business' ? 'Usaha' : 'Mengunjungi'}
                </span>
                {house.residenceType && (
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-lg uppercase tracking-wide border ${
                    house.residenceType === 'Tetap' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                    house.residenceType === 'Sewa' ? 'bg-amber-50 text-amber-700 border-amber-200/60' :
                    'bg-indigo-50 text-indigo-700 border-indigo-200/60'
                  }`}>
                    {house.residenceType === 'Rumah Keluarga' ? 'Keluarga' : house.residenceType}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Stats Section */}
        <div className="grid grid-cols-2 gap-2.5 mb-3 relative z-10">
          <div className="p-3 bg-slate-50/80 hover:bg-slate-50 border border-slate-100/80 rounded-2xl transition-colors">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Iuran</p>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isDuesPaid ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500'}`} />
              <p className={`text-xs font-black ${isDuesPaid ? 'text-emerald-700' : 'text-rose-700'}`}>
                {isDuesPaid ? 'Lunas' : 'Menunggak'}
              </p>
            </div>
          </div>
          <div className="p-3 bg-slate-50/80 hover:bg-slate-50 border border-slate-100/80 rounded-2xl transition-colors">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tunggakan</p>
            <p className={`text-xs font-black ${arrears.length > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
              {arrears.length > 0 ? `${arrears.length} Bulan` : 'Nihil'}
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
                  ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/60 hover:bg-emerald-100/80' 
                  : 'bg-amber-50/80 text-amber-700 border-amber-200/60 hover:bg-amber-100/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText size={13} className="text-slate-400" />
                <div className="text-left">
                  <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">PBB {house.pbbYear || new Date().getFullYear()}</p>
                  <p className="text-[10px] font-black uppercase leading-none mt-0.5">{house.pbbStatus || 'Belum Diambil'}</p>
                </div>
              </div>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center ${
                house.pbbStatus === 'Sudah Diambil' ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
              }`}>
                {house.pbbStatus === 'Sudah Diambil' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
              </span>
            </button>
          </div>
        )}

        {/* Contact Quick Link */}
        <div className="mb-4 relative z-10">
          <div className="flex items-center justify-between p-2.5 bg-slate-50/80 hover:bg-indigo-50/30 border border-slate-100/80 hover:border-indigo-100 rounded-2xl transition-all">
            <div className="flex items-center gap-2">
              <Phone size={12} className="text-slate-400" />
              <span className="text-[11px] font-bold text-slate-700 tracking-tight">{house.phone || '—'}</span>
            </div>
            {onSendWhatsApp && house.phone && (
               <button 
                 onClick={(e) => { e.stopPropagation(); onSendWhatsApp(house); }} 
                 className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center shadow-xs"
                 title="Kirim WhatsApp"
               >
                 <MessageCircle size={13} className="stroke-[2.5]" />
               </button>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 relative z-10 mt-auto">
        <button 
          onClick={() => onOpenDetail(house)} 
          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-indigo-600/20"
        >
          Lihat Profil
        </button>
        <div className="flex gap-1.5">
          <IconButton icon={<DollarSign size={16} />} onClick={() => onOpenPay(house)} color="indigo" title="Bayar Iuran" />
          <IconButton icon={<Edit2 size={16} />} onClick={() => onOpenEdit(house)} color="slate" title="Edit Data" />
        </div>
      </div>
    </motion.div>
  );
};

const Badge = ({ label, variant = 'slate', outline = false, icon = null }: { label: string, variant?: string, outline?: boolean, icon?: any }) => {
  const colors: any = {
    indigo: outline ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-indigo-600 text-white border-indigo-600',
    emerald: outline ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-emerald-600 text-white border-emerald-600',
    rose: outline ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-rose-600 text-white border-rose-600',
    amber: outline ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-amber-600 text-white border-amber-600',
    slate: outline ? 'bg-slate-50 text-slate-500 border-slate-100' : 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-sm ${colors[variant]}`}>
      {icon}
      {label}
    </span>
  );
};

const IconButton = ({ icon, onClick, color = 'slate', title }: { icon: any, onClick: () => void, color?: string, title: string }) => {
  const themes: any = {
    emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border-rose-100',
    indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border-indigo-100',
    slate: 'bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white border-slate-200',
  };

  return (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`p-2 rounded-xl border transition-all duration-200 ${themes[color]}`}
      title={title}
    >
      {React.cloneElement(icon as React.ReactElement, { size: 18 })}
    </button>
  );
};
