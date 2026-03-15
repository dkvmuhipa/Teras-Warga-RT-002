import React from 'react';
import { House, PaymentStatus, Bill } from '../../types';
import { Phone, CheckCircle, XCircle, DollarSign, Edit2, Trash2, LayoutList, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ResidentCardProps {
  house: House;
  bills: Bill[];
  onOpenDetail: (house: House) => void;
  onOpenEdit: (house: House) => void;
  onDelete: (id: string) => void;
  onOpenBills: (house: House) => void;
  onOpenPay: (house: House) => void;
  dynamicStatusAir?: PaymentStatus;
  dynamicStatusSampah?: PaymentStatus;
  arrears?: string[];
}

export const ResidentCard: React.FC<ResidentCardProps> = ({ 
  house, bills, onOpenDetail, onOpenEdit, onDelete, onOpenBills, onOpenPay,
  dynamicStatusAir, dynamicStatusSampah, arrears = []
}) => {
  const houseBills = bills.filter(b => b.houseId === house.id);
  const isFullyPaid = houseBills.length > 0 && houseBills.every(b => b.total === 0);
  const paymentStatus = isFullyPaid ? PaymentStatus.PAID : PaymentStatus.PENDING;

  const statusAir = dynamicStatusAir || house.paymentStatusAir;
  const statusSampah = dynamicStatusSampah || house.paymentStatusSampah;

  return (
    <motion.div 
      layout
      className="bg-white p-3 md:p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:shadow-slate-200/50 transition-all group"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm md:text-base border border-indigo-100">
            {house.headOfFamily.charAt(0)}
          </div>
          <div className="min-w-0">
            <h4 className="font-black text-slate-800 text-xs md:text-sm truncate">{house.headOfFamily}</h4>
            {house.ownerName && house.ownerName !== house.headOfFamily && (
              <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-wide truncate">Pemilik: {house.ownerName}</p>
            )}
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
              <Phone size={8} className="md:w-2.5 md:h-2.5" /> {house.phone || '-'}
            </p>
          </div>
        </div>
        <span className={`shrink-0 font-mono font-black text-slate-600 bg-slate-100 px-2 md:px-3 py-1 rounded-lg text-[8px] md:text-[10px] border border-slate-200`}>
          {house.block}-{house.number}
        </span>
      </div>

      <div className="flex gap-1 md:gap-1.5 mb-3 md:mb-4 flex-wrap">
        <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border ${
          house.status === 'Occupied' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
          house.status === 'Empty' ? 'bg-slate-100 text-slate-500 border-slate-200' : 
          'bg-amber-50 text-amber-600 border-amber-100'
        }`}>
          {house.status === 'Occupied' ? 'Dihuni' : house.status === 'Empty' ? 'Kosong' : 'Usaha'}
        </span>
        
        {house.status === 'Occupied' && (
          <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border ${
            house.residenceType === 'Kontrak' ? 'bg-violet-50 text-violet-600 border-violet-100' :
            house.residenceType === 'Kost' ? 'bg-orange-50 text-orange-600 border-orange-100' :
            house.residenceType === 'Rumah Keluarga' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
            'bg-blue-50 text-blue-600 border-blue-100'
          }`}>
            {house.residenceType === 'Kontrak' ? 'Kontrak' : 
             house.residenceType === 'Kost' ? 'Kost' : 
             house.residenceType === 'Rumah Keluarga' ? 'Rumah Keluarga' : 'Pemilik'}
          </span>
        )}

        <span className={`flex items-center gap-1 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border ${
          statusAir === PaymentStatus.PAID ? 'bg-blue-50 text-blue-600 border-blue-100' : 
          'bg-rose-50 text-rose-600 border-rose-100'
        }`}>
          {statusAir === PaymentStatus.PAID ? <CheckCircle size={8} className="md:w-2.5 md:h-2.5"/> : <XCircle size={8} className="md:w-2.5 md:h-2.5"/>}
          Air: {statusAir === PaymentStatus.PAID ? 'Lunas' : 'Belum'}
        </span>

        <span className={`flex items-center gap-1 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border ${
          statusSampah === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
          'bg-rose-50 text-rose-600 border-rose-100'
        }`}>
          {statusSampah === PaymentStatus.PAID ? <CheckCircle size={8} className="md:w-2.5 md:h-2.5"/> : <XCircle size={8} className="md:w-2.5 md:h-2.5"/>}
          Sampah: {statusSampah === PaymentStatus.PAID ? 'Lunas' : 'Belum'}
        </span>

        {((house.pregnantCount || 0) > 0 || (house.babyCount || 0) > 0 || (house.toddlerCount || 0) > 0 || (house.elderlyCount || 0) > 0 || (house.widowCount || 0) > 0) && (
          <span className="px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border bg-rose-50 text-rose-600 border-rose-100">
            Rentan
          </span>
        )}

        {(house.isPKH || house.isBLT || house.isBansosLain) && (
          <span className="px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border bg-indigo-50 text-indigo-600 border-indigo-100">
            Bansos
          </span>
        )}

        {arrears.length > 0 && (
          <span className="px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border bg-amber-50 text-amber-600 border-amber-100 flex items-center gap-1">
            <AlertCircle size={8} className="md:w-2.5 md:h-2.5" /> {arrears.length} Bln
          </span>
        )}
      </div>

      {arrears.length > 0 && (
        <div className="mb-3 md:mb-4 p-2 bg-amber-50/50 rounded-xl border border-amber-100/50">
          <p className="text-[7px] md:text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">Tunggakan:</p>
          <div className="flex flex-wrap gap-1">
            {arrears.map(m => (
              <span key={m} className="text-[7px] md:text-[8px] font-bold text-amber-700 bg-white px-1 md:px-1.5 py-0.5 rounded border border-amber-200">
                {m.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1.5 pt-3 border-t border-slate-100">
        <button onClick={() => onOpenDetail(house)} className="flex-1 py-1.5 md:py-2 bg-slate-50 text-slate-600 rounded-lg font-bold text-[9px] md:text-[10px] hover:bg-slate-100 transition-all">Detail</button>
        <button onClick={() => onOpenPay(house)} className="p-1.5 md:p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all" title="Bayar Iuran"><DollarSign size={12} className="md:w-3.5 md:h-3.5" /></button>
        <button onClick={() => onOpenBills(house)} className="p-1.5 md:p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all" title="Riwayat Tagihan"><LayoutList size={12} className="md:w-3.5 md:h-3.5" /></button>
        <button onClick={() => onOpenEdit(house)} className="p-1.5 md:p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-all"><Edit2 size={12} className="md:w-3.5 md:h-3.5" /></button>
        <button onClick={() => onDelete(house.id)} className="p-1.5 md:p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all"><Trash2 size={12} className="md:w-3.5 md:h-3.5" /></button>
      </div>
    </motion.div>
  );
};
