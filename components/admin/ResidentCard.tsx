import React from 'react';
import { House, PaymentStatus, Bill } from '../../types';
import { Phone, CheckCircle, XCircle, DollarSign, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ResidentCardProps {
  house: House;
  bills: Bill[];
  onOpenDetail: (house: House) => void;
  onOpenEdit: (house: House) => void;
  onDelete: (id: string) => void;
  onOpenBills: (houseId: string) => void;
}

export const ResidentCard: React.FC<ResidentCardProps> = ({ 
  house, bills, onOpenDetail, onOpenEdit, onDelete, onOpenBills 
}) => {
  const houseBills = bills.filter(b => b.houseId === house.id);
  const isFullyPaid = houseBills.length > 0 && houseBills.every(b => b.total === 0);
  const paymentStatus = isFullyPaid ? PaymentStatus.PAID : PaymentStatus.PENDING;

  return (
    <motion.div 
      layout
      className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:shadow-slate-200/50 transition-all group"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-base border border-indigo-100">
            {house.headOfFamily.charAt(0)}
          </div>
          <div>
            <h4 className="font-black text-slate-800 text-sm">{house.headOfFamily}</h4>
            {house.ownerName && house.ownerName !== house.headOfFamily && (
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Pemilik: {house.ownerName}</p>
            )}
            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
              <Phone size={10} /> {house.phone || '-'}
            </p>
          </div>
        </div>
        <span className={`font-mono font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-lg text-[10px] border border-slate-200`}>
          {house.block}-{house.number}
        </span>
      </div>

      <div className="flex gap-1.5 mb-4 flex-wrap">
        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
          house.status === 'Occupied' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
          house.status === 'Empty' ? 'bg-slate-100 text-slate-500 border-slate-200' : 
          'bg-amber-50 text-amber-600 border-amber-100'
        }`}>
          {house.status === 'Occupied' ? 'Dihuni' : house.status === 'Empty' ? 'Kosong' : 'Usaha'}
        </span>
        
        {house.status === 'Occupied' && (
          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
            house.residenceType === 'Kontrak' ? 'bg-violet-50 text-violet-600 border-violet-100' :
            house.residenceType === 'Kost' ? 'bg-orange-50 text-orange-600 border-orange-100' :
            'bg-blue-50 text-blue-600 border-blue-100'
          }`}>
            {house.residenceType === 'Kontrak' ? 'Kontrak' : house.residenceType === 'Kost' ? 'Kost' : 'Pemilik'}
          </span>
        )}

        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
          paymentStatus === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
          'bg-rose-50 text-rose-600 border-rose-100'
        }`}>
          {paymentStatus === PaymentStatus.PAID ? <CheckCircle size={10}/> : <XCircle size={10}/>}
          {paymentStatus === PaymentStatus.PAID ? 'Lunas' : 'Belum'}
        </span>

        {((house.pregnantCount || 0) > 0 || (house.toddlerCount || 0) > 0 || (house.elderlyCount || 0) > 0) && (
          <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-rose-50 text-rose-600 border-rose-100">
            Rentan
          </span>
        )}
      </div>

      <div className="flex gap-1.5 pt-3 border-t border-slate-100">
        <button onClick={() => onOpenDetail(house)} className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg font-bold text-[10px] hover:bg-slate-100 transition-all">Detail</button>
        <button onClick={() => onOpenBills(house.id)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all"><DollarSign size={14} /></button>
        <button onClick={() => onOpenEdit(house)} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-all"><Edit2 size={14} /></button>
        <button onClick={() => onDelete(house.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all"><Trash2 size={14} /></button>
      </div>
    </motion.div>
  );
};
