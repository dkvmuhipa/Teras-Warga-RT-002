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
      className="relative bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all group overflow-hidden"
    >
      {/* Header: Identity Section */}
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm border transition-colors ${
              house.status === 'Occupied' 
                ? 'bg-indigo-50 text-indigo-600 border-indigo-150' 
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}>
              {house.headOfFamily ? house.headOfFamily.charAt(0).toUpperCase() : <MapPin size={16} />}
            </div>
            {house.isVerified && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-white p-0.5 rounded-full shadow-sm">
                <div className="bg-emerald-500 text-white p-0.5 rounded-full">
                  <ShieldCheck size={10} strokeWidth={3} />
                </div>
              </div>
            )}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm tracking-tight truncate max-w-[150px] leading-snug">
              {house.headOfFamily || 'Unit Kosong'}
            </h4>
            {house.ownerName && house.ownerName !== house.headOfFamily && (
              <p className="text-[10px] text-slate-400 font-medium truncate -mt-0.5">Pemilik: {house.ownerName}</p>
            )}
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[9px] font-bold uppercase tracking-wider">
                Blok {house.block}-{house.number}
              </span>
              {house.residenceType && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide border ${
                  house.residenceType === 'Tetap' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                  house.residenceType === 'Sewa' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                  house.residenceType === 'Rumah Keluarga' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                  'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}>
                  {house.residenceType === 'Mengunjungi' ? 'Mengunjungi' : house.residenceType}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Stats Section */}
      <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
        <div className="p-3 bg-slate-50/80 hover:bg-slate-50 border border-slate-100 rounded-lg transition-colors">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Iuran</p>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isDuesPaid ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <p className={`text-xs font-bold leading-none ${isDuesPaid ? 'text-emerald-700' : 'text-rose-700'}`}>
              {isDuesPaid ? 'Lunas' : 'Menunggak'}
            </p>
          </div>
        </div>
        <div className="p-3 bg-slate-50/80 hover:bg-slate-50 border border-slate-100 rounded-lg transition-colors">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tunggakan</p>
          <p className={`text-xs font-bold ${arrears.length > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
            {arrears.length > 0 ? `${arrears.length} Bulan` : 'Nihil'}
          </p>
        </div>
      </div>

      {/* PBB Status Tracking */}
      {house.status === 'Occupied' && (
        <div className="mb-3 relative z-10">
          <button 
            onClick={(e) => { e.stopPropagation(); onUpdatePBB?.(house); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all duration-250 ${
              house.pbbStatus === 'Sudah Diambil' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
                : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText size={13} className="text-slate-500" />
              <div className="text-left">
                <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">PBB {house.pbbYear || new Date().getFullYear()}</p>
                <p className="text-[10px] font-bold uppercase leading-none mt-0.5">{house.pbbStatus || 'Belum Diambil'}</p>
              </div>
            </div>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center ${
              house.pbbStatus === 'Sudah Diambil' ? 'bg-emerald-200 text-emerald-700' : 'bg-amber-200 text-amber-700'
            }`}>
              {house.pbbStatus === 'Sudah Diambil' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
            </span>
          </button>
        </div>
      )}

      {/* Contact Quick Link (Simpler row format) */}
      <div className="mb-5 relative z-10">
        <div className="flex items-center justify-between p-2.5 bg-slate-50/50 hover:bg-indigo-50/30 border border-slate-100 hover:border-indigo-100 rounded-xl transition-all">
          <div className="flex items-center gap-2">
            <Phone size={12} className="text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-600 tracking-tight">{house.phone || '—'}</span>
          </div>
          {onSendWhatsApp && house.phone && (
             <button 
               onClick={(e) => { e.stopPropagation(); onSendWhatsApp(house); }} 
               className="p-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center shadow-xs"
               title="WhatsApp"
             >
               <MessageCircle size={13} className="stroke-[2.5]" />
             </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-slate-100 relative z-10">
        <button 
          onClick={() => onOpenDetail(house)} 
          className="flex-1 py-2 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-wide hover:bg-indigo-600 transition-all active:scale-98 shadow-xs"
        >
          Lihat Profil
        </button>
        <div className="flex gap-1.5">
          <IconButton icon={<DollarSign size={16} />} onClick={() => onOpenPay(house)} color="indigo" title="Bayar" />
          <IconButton icon={<Edit2 size={16} />} onClick={() => onOpenEdit(house)} color="slate" title="Edit" />
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
