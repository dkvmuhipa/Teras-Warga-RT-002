import React from 'react';
import { House, PaymentStatus, Bill } from '../../types';
import { Phone, CheckCircle, XCircle, DollarSign, Edit2, Trash2, LayoutList, AlertCircle, MessageCircle, MapPin, User, ShieldCheck } from 'lucide-react';
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
  dynamicStatusAir?: PaymentStatus;
  dynamicStatusSampah?: PaymentStatus;
  arrears?: string[];
}

export const ResidentCard: React.FC<ResidentCardProps> = ({ 
  house, bills, onOpenDetail, onOpenEdit, onDelete, onOpenBills, onOpenPay, onSendWhatsApp,
  dynamicStatusAir, dynamicStatusSampah, arrears = []
}) => {
  const houseBills = bills.filter(b => b.houseId === house.id);
  const isFullyPaid = houseBills.length > 0 && houseBills.every(b => b.total === 0);
  
  const statusAir = dynamicStatusAir || house.paymentStatusAir;
  const statusSampah = dynamicStatusSampah || house.paymentStatusSampah;

  const isDuesPaid = statusAir === PaymentStatus.PAID && statusSampah === PaymentStatus.PAID;

  return (
    <motion.div 
      layout
      whileHover={{ y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
      className="relative bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-[0_15px_30px_rgba(79,70,229,0.08)] transition-all group overflow-hidden"
    >
      {/* Premium Gradient Glow */}
      <div className={`absolute -top-12 -right-12 w-36 h-36 rounded-full blur-[60px] transition-all duration-1000 ${
        house.status === 'Occupied' 
          ? 'bg-indigo-500/5 group-hover:bg-indigo-500/10' 
          : 'bg-slate-500/5 group-hover:bg-slate-500/10'
      }`}></div>

      {/* Header: Identity Section */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg border-2 transition-all shadow-sm ${
            house.status === 'Occupied' 
              ? 'bg-slate-950 text-white border-slate-800' 
              : 'bg-slate-50 text-slate-200 border-slate-100'
          }`}>
            {house.headOfFamily ? house.headOfFamily.charAt(0) : <MapPin size={16} className="text-slate-300" />}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1">
              <h4 className="font-black text-slate-900 text-sm tracking-tight truncate max-w-[120px] group-hover:text-indigo-600 transition-colors">
                {house.headOfFamily || 'Hunian Kosong'}
              </h4>
              {house.isVerified && (
                <ShieldCheck size={10} className="text-emerald-500" strokeWidth={3} />
              )}
            </div>
            <div className="flex items-center gap-1">
              <div className="px-1.5 py-0.5 bg-slate-950 text-white rounded-md text-[8px] font-black uppercase tracking-widest shadow-sm">
                {house.block}-{house.number}
              </div>
            </div>
          </div>
        </div>
        
        <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
           isDuesPaid 
             ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
             : 'bg-rose-50 text-rose-600 border-rose-100'
        }`}>
           {isDuesPaid ? 'Lunas' : 'Belum'}
        </div>
      </div>

      {/* Info Rows - Compact */}
      <div className="space-y-3 mb-4 relative z-10">
        <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-white hover:border-indigo-200 transition-all group/contact cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 group-hover/contact:text-indigo-600 shadow-sm border border-slate-100 transition-all">
              <Phone size={14} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Kontak</span>
              <span className="text-xs font-black text-slate-800 tracking-tight">{house.phone || '—'}</span>
            </div>
          </div>
          {onSendWhatsApp && house.phone && (
             <button 
               onClick={(e) => { e.stopPropagation(); onSendWhatsApp(house); }} 
               className="w-8 h-8 flex items-center justify-center bg-emerald-600 text-white rounded-lg shadow-md hover:bg-slate-900 transition-all"
             >
               <MessageCircle size={14} strokeWidth={2.5} />
             </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge label={house.status === 'Occupied' ? 'Dihuni' : house.status === 'Empty' ? 'Kosong' : 'Bisnis'} variant={house.status === 'Occupied' ? 'indigo' : house.status === 'Empty' ? 'slate' : 'amber'} />
          {house.residenceType && house.status === 'Occupied' && (
            <Badge label={house.residenceType} variant="emerald" outline />
          )}
          {arrears.length > 0 && house.status === 'Occupied' && (
            <Badge label={`${arrears.length} Tunggakan`} variant="rose" icon={<AlertCircle size={8} strokeWidth={3} />} />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-slate-100 relative z-10">
        <button 
          onClick={() => onOpenDetail(house)} 
          className="flex-1 py-2.5 bg-slate-950 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 active:scale-95 group/btn"
        >
          Detail
        </button>
        <IconButton icon={<DollarSign size={16} strokeWidth={3} />} onClick={() => onOpenPay(house)} color="emerald" title="Bayar" />
        <IconButton icon={<Edit2 size={16} strokeWidth={3} />} onClick={() => onOpenEdit(house)} color="indigo" title="Edit" />
      </div>
    </motion.div>
  );
};

const Badge = ({ label, variant = 'slate', outline = false, icon = null }: { label: string, variant?: string, outline?: boolean, icon?: any }) => {
  const colors: any = {
    indigo: outline ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-indigo-600 text-white border-indigo-500',
    emerald: outline ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-emerald-600 text-white border-emerald-500',
    rose: outline ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-rose-600 text-white border-rose-500',
    amber: outline ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-amber-600 text-white border-amber-500',
    slate: outline ? 'bg-slate-50 text-slate-500 border-slate-100' : 'bg-slate-100 text-slate-500 border-slate-200',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.05em] border shadow-sm ${colors[variant]}`}>
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
    slate: 'bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white border-slate-100',
  };

  return (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`p-2.5 rounded-xl border group transition-all duration-300 ${themes[color]}`}
      title={title}
    >
      {icon}
    </button>
  );
};
