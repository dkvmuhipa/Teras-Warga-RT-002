import React from 'react';
import { House, PaymentStatus, Bill } from '../../types';
import { 
  Phone, CheckCircle, DollarSign, Edit2, AlertCircle, 
  MessageCircle, MapPin, ShieldCheck, FileText, Users, 
  Copy, ArrowRight, Building2
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useTenant } from '../../context/TenantContext';
import { openWhatsApp } from '../../services/whatsappService';

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
  house, onOpenDetail, onOpenEdit, onOpenPay, onSendWhatsApp,
  onUpdatePBB, dynamicStatusAir, dynamicStatusSampah, arrears = []
}) => {
  const { currentTenant } = useTenant();
  const rtDisplayName = currentTenant ? `Pengurus RT ${currentTenant.rt} / RW ${currentTenant.rw}` : 'Pengurus RT';
  const statusAir = dynamicStatusAir || house.paymentStatusAir;
  const statusSampah = dynamicStatusSampah || house.paymentStatusSampah;
  const isDuesPaid = statusAir === PaymentStatus.PAID && statusSampah === PaymentStatus.PAID;

  const occupantsCount = Math.max(house.occupants || 1, 1 + (house.familyMembers?.length || 0));
  const rawPhone = (house.phone || '').trim();
  const digits = rawPhone.replace(/\D/g, '');
  const hasValidPhone = Boolean(rawPhone && rawPhone !== '-' && rawPhone !== '0' && digits.length >= 8);

  const isKtpLocal = house.ktpStatus === 'Sesuai Domisili' || (
    !house.ktpStatus && house.addressKtp && (
      house.addressKtp.toLowerCase().includes('tondo') || 
      house.addressKtp.toLowerCase().includes('pue lombe')
    )
  );

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasValidPhone) {
      navigator.clipboard.writeText(rawPhone);
      toast.success('Nomor telepon disalin!');
    }
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasValidPhone) {
      toast.error('Nomor telepon WhatsApp warga belum terdata.');
      return;
    }
    if (onSendWhatsApp) {
      onSendWhatsApp(house);
    } else {
      const message = `Halo Bapak/Ibu ${house.headOfFamily || 'Warga'}, kami dari ${rtDisplayName} ingin berkoordinasi mengenai administrasi warga.`;
      const success = openWhatsApp(house.phone, message);
      if (!success) {
        toast.error('Nomor WhatsApp warga tidak valid atau belum terdaftar.');
      }
    }
  };

  return (
    <motion.div 
      layout
      whileHover={{ y: -2 }}
      className="relative bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs hover:border-indigo-400/50 hover:shadow-md transition-colors duration-200 flex flex-col justify-between select-none"
    >
      <div>
        {/* Header: Identity Section */}
        <div className="flex items-start gap-3 mb-3">
          <div className="relative shrink-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-2xs ${
              house.status === 'Occupied' 
                ? 'bg-indigo-600 text-white' 
                : house.status === 'Visiting'
                ? 'bg-sky-500 text-white'
                : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}>
              {house.headOfFamily && house.headOfFamily !== '-' 
                ? house.headOfFamily.charAt(0).toUpperCase() 
                : <MapPin size={16} className="text-slate-400" />}
            </div>
            {house.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-2xs">
                <div className="bg-emerald-500 text-white p-0.5 rounded-full">
                  <ShieldCheck size={9} strokeWidth={3} />
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-extrabold text-slate-900 text-sm tracking-tight truncate">
                {house.headOfFamily && house.headOfFamily !== '-' ? house.headOfFamily : (house.ownerName ? `Hunian: ${house.ownerName}` : 'Rumah Kosong')}
              </h4>
              <span className="px-2 py-0.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold font-mono tabular-nums shrink-0">
                {house.block}-{house.number}
              </span>
            </div>

            {house.ownerName && house.ownerName !== house.headOfFamily && (
              <p className="text-[10.5px] text-slate-400 font-medium truncate mt-0.5">
                Pemilik: {house.ownerName}
              </p>
            )}

            {/* Compact Status Badges (Max 3-4 clean pills) */}
            <div className="flex flex-wrap items-center gap-1 mt-1.5">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${
                house.status === 'Occupied' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70' :
                house.status === 'Empty' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                house.status === 'Business' ? 'bg-purple-50 text-purple-700 border-purple-200/70' :
                'bg-sky-50 text-sky-700 border-sky-200/70'
              }`}>
                {house.status === 'Occupied' ? 'Dihuni' : 
                 house.status === 'Empty' ? 'Kosong' : 
                 house.status === 'Business' ? 'Usaha' : 'Singgah'}
              </span>

              {house.residenceType && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${
                  house.residenceType === 'Sewa' ? 'bg-amber-50 text-amber-700 border-amber-200/70' : 'bg-indigo-50 text-indigo-700 border-indigo-200/70'
                }`}>
                  {house.residenceType === 'Rumah Keluarga' ? 'Keluarga' : house.residenceType}
                </span>
              )}

              {house.status === 'Occupied' && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[9px] font-bold font-mono tabular-nums">
                  <Users size={9} /> {occupantsCount} Jiwa
                </span>
              )}

              {house.status === 'Occupied' && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                  isKtpLocal ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70' : 'bg-amber-50 text-amber-700 border-amber-200/70'
                }`}>
                  {isKtpLocal ? 'KTP Lokal' : 'KTP Luar'}
                </span>
              )}

              {(house.hasBusiness || house.businessName) && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md border bg-amber-50 text-amber-700 border-amber-200/70 inline-flex items-center gap-1">
                  <Building2 size={9} />
                  <span className="truncate max-w-[90px]">{house.businessName || 'UMKM'}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Compact Financial & PBB Summary Strip */}
        <div className="grid grid-cols-3 gap-1.5 mb-2.5 p-2 rounded-2xl bg-slate-50/90 border border-slate-200/70 text-[10px]">
          <div className={`px-2 py-1.5 rounded-xl border ${
            isDuesPaid ? 'bg-emerald-50/80 border-emerald-200/60 text-emerald-700' : 'bg-rose-50/80 border-rose-200/60 text-rose-700'
          }`}>
            <p className="text-[8.5px] font-bold uppercase opacity-75">Iuran</p>
            <p className="font-extrabold truncate">{isDuesPaid ? 'Lunas' : 'Belum'}</p>
          </div>

          <div className="px-2 py-1.5 rounded-xl bg-white border border-slate-200/70">
            <p className="text-[8.5px] font-bold uppercase text-slate-400">Tunggakan</p>
            <p className={`font-extrabold font-mono tabular-nums truncate ${arrears.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {arrears.length > 0 ? `${arrears.length} Bln` : 'Nihil ✓'}
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onUpdatePBB?.(house); }}
            className={`px-2 py-1.5 rounded-xl border text-left transition-colors cursor-pointer ${
              house.pbbStatus === 'Sudah Diambil'
                ? 'bg-emerald-50/70 border-emerald-200/70 text-emerald-700 hover:bg-emerald-100/70'
                : 'bg-amber-50/70 border-amber-200/70 text-amber-800 hover:bg-amber-100/70'
            }`}
            title="Klik untuk ubah status PBB"
          >
            <p className="text-[8.5px] font-bold uppercase opacity-75 flex items-center gap-0.5">
              <FileText size={8} /> PBB
            </p>
            <p className="font-extrabold truncate flex items-center gap-0.5">
              {house.pbbStatus === 'Sudah Diambil' ? 'Diambil' : 'Belum'}
              {house.pbbStatus === 'Sudah Diambil' ? <CheckCircle size={9} /> : <AlertCircle size={9} />}
            </p>
          </button>
        </div>

        {/* Slim Contact Row */}
        <div className="flex items-center justify-between px-2.5 py-1.5 mb-3 bg-slate-50/70 border border-slate-200/60 rounded-xl gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Phone size={12} className="text-slate-400 shrink-0" />
            <span className={`text-[11px] truncate font-mono tabular-nums ${hasValidPhone ? 'font-bold text-slate-700' : 'text-slate-400 italic font-sans'}`}>
              {hasValidPhone ? rawPhone : 'Belum ada HP'}
            </span>
          </div>
          {hasValidPhone && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleCopyPhone}
                className="p-1 rounded-lg bg-white hover:bg-slate-200/70 text-slate-500 border border-slate-200/80 transition-colors cursor-pointer"
                title="Salin Nomor HP"
              >
                <Copy size={11} />
              </button>
              <button 
                onClick={handleWhatsAppClick} 
                className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200/80 transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                title="Hubungi via WhatsApp"
              >
                <MessageCircle size={11} className="stroke-[2.5]" />
                <span>WA</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-100 mt-auto">
        <button 
          onClick={() => onOpenDetail(house)} 
          className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Detail</span>
          <ArrowRight size={12} className="stroke-[2.5]" />
        </button>
        <IconButton icon={<DollarSign size={14} />} onClick={() => onOpenPay(house)} color="emerald" title="Bayar Iuran Kas" />
        <IconButton icon={<Edit2 size={14} />} onClick={() => onOpenEdit(house)} color="slate" title="Edit Data Warga" />
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
      className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-colors duration-200 active:scale-95 cursor-pointer ${themes[color]}`}
      title={title}
    >
      {React.cloneElement(icon as React.ReactElement, { size: 15, className: 'stroke-[2.3px]' })}
    </button>
  );
};
