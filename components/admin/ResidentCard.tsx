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
      whileHover={{ y: -10, transition: { duration: 0.3, ease: 'easeOut' } }}
      className="relative bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-[0_30px_60px_rgba(79,70,229,0.15)] transition-all group overflow-hidden"
    >
      {/* Premium Gradient Glow */}
      <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] transition-all duration-1000 ${
        house.status === 'Occupied' 
          ? 'bg-indigo-500/5 group-hover:bg-indigo-500/15' 
          : 'bg-slate-500/5 group-hover:bg-slate-500/10'
      }`}></div>

      {/* Header: Identity Section */}
      <div className="flex justify-between items-start mb-10 relative z-10">
        <div className="flex items-center gap-6">
          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center font-black text-2xl border-2 transition-all duration-700 shadow-sm ${
            house.status === 'Occupied' 
              ? 'bg-slate-950 text-white border-slate-800 group-hover:scale-105 group-hover:rotate-[8deg]' 
              : 'bg-slate-50 text-slate-200 border-slate-100'
          }`}>
            {house.headOfFamily ? house.headOfFamily.charAt(0) : <MapPin size={28} className="text-slate-300" />}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="font-black text-slate-900 text-xl tracking-tight truncate max-w-[180px] group-hover:text-indigo-600 transition-colors">
                {house.headOfFamily || 'Hunian Kosong'}
              </h4>
              {house.isVerified && (
                <div className="p-1 bg-emerald-50 text-emerald-500 rounded-full border border-emerald-100 shadow-sm">
                  <ShieldCheck size={14} strokeWidth={3} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-black/10">
                {house.block}-{house.number}
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-1 bg-slate-50 rounded-xl">
                Blok {house.block}
              </span>
            </div>
          </div>
        </div>
        
        <div className={`px-5 py-2.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all duration-500 ${
           isDuesPaid 
             ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/5' 
             : 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-500/5 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600'
        }`}>
           {isDuesPaid ? 'Lunas' : 'Belum Lunas'}
        </div>
      </div>

      {/* Info Rows - More Spacing */}
      <div className="space-y-6 mb-10 relative z-10">
        <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-[2rem] border border-slate-100 hover:bg-white hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group/contact cursor-pointer">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover/contact:text-indigo-600 shadow-md border border-slate-100 group-hover/contact:rotate-6 transition-all">
              <Phone size={18} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kontak Hubungi</span>
              <span className="text-base font-black text-slate-800 tracking-tight">{house.phone || '—'}</span>
            </div>
          </div>
          {onSendWhatsApp && house.phone && (
             <button 
               onClick={(e) => { e.stopPropagation(); onSendWhatsApp(house); }} 
               className="w-12 h-12 flex items-center justify-center bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-slate-900 active:scale-90 transition-all"
             >
               <MessageCircle size={20} strokeWidth={2.5} />
             </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Badge label={house.status === 'Occupied' ? 'Dihuni' : house.status === 'Empty' ? 'Kosong' : 'Ekonomi'} variant={house.status === 'Occupied' ? 'indigo' : house.status === 'Empty' ? 'slate' : 'amber'} />
          {house.residenceType && house.status === 'Occupied' && (
            <Badge label={house.residenceType} variant="emerald" outline />
          )}
          {arrears.length > 0 && house.status === 'Occupied' && (
            <Badge label={`${arrears.length} Tunggakan`} variant="rose" icon={<AlertCircle size={12} strokeWidth={3} />} />
          )}
        </div>
      </div>

      {/* Actions: Re-structured for Clarity */}
      <div className="flex items-center gap-4 pt-7 border-t border-slate-100 relative z-10">
        <button 
          onClick={() => onOpenDetail(house)} 
          className="flex-[2] py-4 bg-slate-950 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-indigo-600 hover:shadow-2xl hover:shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 active:scale-95 group/btn"
        >
          <LayoutList size={16} strokeWidth={2.5} className="group-hover/btn:-translate-x-1 transition-transform" /> 
          Profil Detail
        </button>
        <div className="flex gap-2.5">
          <IconButton icon={<DollarSign size={20} strokeWidth={3} />} onClick={() => onOpenPay(house)} color="emerald" title="Bayar Iuran" />
          <IconButton icon={<Edit2 size={20} strokeWidth={3} />} onClick={() => onOpenEdit(house)} color="indigo" title="Edit Data" />
        </div>
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
