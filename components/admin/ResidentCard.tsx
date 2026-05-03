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
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      className="relative bg-white p-7 rounded-[2.5rem] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group overflow-hidden"
    >
      {/* Decorative Background Element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>

      {/* Header: Identity Section */}
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl border-2 transition-all duration-500 ${
              house.status === 'Occupied' 
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-200' 
                : 'bg-white text-slate-200 border-slate-100 shadow-inner'
            }`}>
              {house.headOfFamily ? house.headOfFamily.charAt(0) : <MapPin size={24} />}
            </div>
            {house.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md">
                <div className="bg-emerald-500 text-white p-0.5 rounded-full">
                  <ShieldCheck size={12} strokeWidth={3} />
                </div>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <h4 className="font-black text-slate-900 text-lg tracking-tight truncate max-w-[160px] leading-tight">
              {house.headOfFamily || 'Unit Kosong'}
            </h4>
            {house.ownerName && house.ownerName !== house.headOfFamily && (
              <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-tight -mt-1">Milik: {house.ownerName}</p>
            )}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-[0.15em] shadow-sm">
                Blok {house.block}-{house.number}
              </span>
              {house.residenceType && house.status === 'Occupied' && (
                <span className="text-[9px] font-bold text-slate-400 border border-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-widest whitespace-nowrap">
                  {house.residenceType}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Stats Section */}
      <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Iuran</p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isDuesPaid ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
            <p className={`text-xs font-black uppercase tracking-widest ${isDuesPaid ? 'text-emerald-700' : 'text-rose-700'}`}>
              {isDuesPaid ? 'Lunas' : 'Menunggak'}
            </p>
          </div>
        </div>
        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Tunggakan</p>
          <p className={`text-xs font-black tracking-tight ${arrears.length > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {arrears.length > 0 ? `${arrears.length} Periode` : 'Nihil'}
          </p>
        </div>
      </div>

      {/* PBB Status Tracking */}
      {house.status === 'Occupied' && (
        <div className="mb-4 relative z-10">
          <button 
            onClick={(e) => { e.stopPropagation(); onUpdatePBB?.(house); }}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group/pbb ${
              house.pbbStatus === 'Sudah Diambil' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                : 'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                house.pbbStatus === 'Sudah Diambil' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
              }`}>
                <FileText size={14} />
              </div>
              <div className="text-left">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Status PBB {house.pbbYear || new Date().getFullYear()}</p>
                <p className="text-[10px] font-black uppercase tracking-widest">{house.pbbStatus || 'Belum Diambil'}</p>
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              house.pbbStatus === 'Sudah Diambil' ? 'bg-emerald-200 text-emerald-700' : 'bg-amber-200 text-amber-700 group-hover/pbb:scale-110'
            }`}>
              {house.pbbStatus === 'Sudah Diambil' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
            </div>
          </button>
        </div>
      )}

      {/* Contact Quick Link */}
      <div className="mb-8 relative z-10">
        <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-600 hover:shadow-md transition-all group/contact cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 group-hover/contact:bg-indigo-50 group-hover/contact:text-indigo-600 transition-all flex items-center justify-center">
              <Phone size={14} />
            </div>
            <span className="text-sm font-bold text-slate-700 tracking-tight">{house.phone || '—'}</span>
          </div>
          {onSendWhatsApp && house.phone && (
             <button 
               onClick={(e) => { e.stopPropagation(); onSendWhatsApp(house); }} 
               className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center"
             >
               <MessageCircle size={14} />
             </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-6 border-t border-slate-100 relative z-10">
        <button 
          onClick={() => onOpenDetail(house)} 
          className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-slate-200"
        >
          Lihat Profil
        </button>
        <div className="flex gap-2">
          <IconButton icon={<DollarSign size={18} />} onClick={() => onOpenPay(house)} color="indigo" title="Bayar" />
          <IconButton icon={<Edit2 size={18} />} onClick={() => onOpenEdit(house)} color="slate" title="Edit" />
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
