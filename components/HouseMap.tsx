import React, { useState, useEffect, useRef, useMemo } from 'react';
import { House, PaymentStatus, Report, Official, Checkpoint, MapPoint, PatrolSession, PanicAlert } from '../types';
import { Home, MapPin, Store, X, AlertTriangle, User, Edit, DollarSign, ShieldAlert, ChevronRight, Info, CheckCircle, ShieldCheck, Star, Baby, Heart, Accessibility, Smile, Users, GraduationCap, Key, Briefcase as BriefcaseIcon, Phone, MessageCircle, Droplets, Trash2, Settings2, Save, Move, Shield, Lightbulb, Video, Trash, Navigation, Bell, Search, MousePointer2, VideoOff, Activity, Clock, Filter, Flame, CreditCard, Compass, Thermometer, UserPlus, Printer, Download } from 'lucide-react';
import { domToPng } from 'modern-screenshot';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeToCheckpoints, updateCheckpointPosition, updateMapPointInDb, formatHouseId } from '../services/databaseService';
import { useFinancial } from '../context/FinancialContext';

interface HouseMapProps {
  houses: House[];
  isAdmin: boolean;
  reports?: Report[];
  officials?: Official[];
  mapPoints?: MapPoint[];
  iuranPayments?: any[];
  activePatrol?: PatrolSession | null;
  activePanicAlerts?: PanicAlert[];
  onEditHouse?: (house: House) => void;
  onPayDues?: (house: House) => void;
  onReportHouse?: (house: House) => void;
}

interface HouseDetailModalProps {
    house: House;
    onClose: () => void;
    reports: Report[];
    isAdmin: boolean;
    officials?: Official[];
    iuranPayments?: any[];
    onEditHouse?: (house: House) => void;
    onPayDues?: (house: House) => void;
    onReportHouse?: (house: House) => void;
}

// --- Helper Functions ---
const shortenName = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length <= 1) return fullName;
    let startIndex = 0;
    let prefix = "";
    if (parts[0].includes('.') || ['Bpk', 'Ibu', 'Sdr'].includes(parts[0])) {
        prefix = parts[0] + " ";
        startIndex = 1;
    }
    if (parts.length - startIndex <= 1) return fullName;
    const firstName = parts[startIndex];
    const initials = parts.slice(startIndex + 1).map(p => p[0] + ".").join(" ");
    return `${prefix}${firstName} ${initials}`;
};

const formatRole = (role: string) => {
    return role
        .replace(/Ketua RT/gi, "KETUA RT")
        .replace(/Ketua RW/gi, "KETUA RW")
        .replace(/Sekretaris/gi, "SEKR.")
        .replace(/Bendahara/gi, "BEND.")
        .replace(/Koordinator/gi, "KOORD.")
        .replace(/Keamanan/gi, "KAMTIB")
        .replace(/Seksi/gi, "SIE.")
        .toUpperCase();
};

const StatusBadge = ({ label, status, icon: Icon }: { label: string, status: PaymentStatus, icon: any }) => {
    const colorClass = status === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                       status === PaymentStatus.PENDING ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                       'bg-rose-50 text-rose-700 border-rose-200';
    return (
        <div className={`flex flex-1 items-center justify-between p-3 rounded-xl border shadow-sm ${colorClass}`}>
            <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-white/50"><Icon size={14}/></div>
                <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
            </div>
            <span className="text-[10px] font-black">{status}</span>
        </div>
    );
};

// --- Detail Modal Component ---
const HouseDetailModal: React.FC<HouseDetailModalProps> = ({ 
    house, 
    onClose, 
    reports, 
    isAdmin, 
    officials,
    iuranPayments,
    onEditHouse, 
    onPayDues, 
    onReportHouse 
}) => {
    const { getPaymentStatus, getArrearsForHouse } = useFinancial();
    const activeReports = reports.filter(r => r.houseId === house.id && r.status !== 'Selesai');
    const isSafe = activeReports.length === 0;
    const officialData = officials?.find(o => {
        const officialHouseId = formatHouseId(o.houseId);
        const currentHouseId = formatHouseId(`${house.block}-${house.number}`);
        return officialHouseId === currentHouseId;
    });
    const displayName = shortenName(house.headOfFamily);

    const statusAir = getPaymentStatus(house, 'Air');
    const statusSampah = getPaymentStatus(house, 'Sampah');
    const arrears = getArrearsForHouse(house);
    const isFullyPaid = arrears.length === 0;
    
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="bg-white w-full max-w-sm md:max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-slide-up ring-1 ring-slate-200 flex flex-col max-h-[85vh]">
                {/* Header Section */}
                <div className={`relative px-6 py-8 flex flex-col items-center justify-center text-center shrink-0 transition-colors duration-300 ${isSafe ? (officialData ? 'bg-slate-800' : 'bg-emerald-600') : 'bg-rose-600'}`}>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none"></div>
                    <button onClick={onClose} className="absolute top-3 right-3 z-20 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors backdrop-blur-sm"><X size={18}/></button>
                    <div className="relative text-white space-y-1 mt-2 z-10">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter shadow-sm drop-shadow-md">{house.block}-{house.number}</h2>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-90">Kavling Rumah</p>
                    </div>
                </div>

                {/* Content Section */}
                <div className="overflow-y-auto custom-scrollbar flex-1 bg-white">
                    <div className="p-6 space-y-6">

                         {/* OFFICIAL CARD SECTION */}
                         {officialData && (
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 text-white p-5 shadow-lg shadow-slate-300 ring-4 ring-slate-50 transform transition-all hover:scale-[1.02] border border-slate-700">
                                <div className="absolute top-0 right-0 p-4 opacity-10 transform rotate-12 pointer-events-none"><Star size={100} fill="currentColor" /></div>
                                <div className="relative z-10 flex items-center gap-5">
                                     <div className="relative shrink-0">
                                         <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-br from-amber-300 to-yellow-600 shadow-lg">
                                             <img src={officialData.photo || `https://ui-avatars.com/api/?name=${officialData.name}&background=random`} alt={officialData.name} className="w-full h-full rounded-full border-2 border-white object-cover bg-white"/>
                                         </div>
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <h3 className="font-black text-xl leading-tight text-white truncate">{officialData.role}</h3>
                                         <p className="text-sm text-slate-300 font-medium mt-0.5 truncate">{officialData.name}</p>
                                         <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center gap-3">
                                             <a href={`https://wa.me/${officialData.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-500 transition-colors shadow-sm ring-1 ring-emerald-400/50">
                                                <MessageCircle size={12}/> Hubungi
                                             </a>
                                         </div>
                                     </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Status Iuran (NEW: Air & Sampah) */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">Status Pembayaran Iuran</h4>
                                {!isFullyPaid && (
                                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 animate-pulse">
                                        {arrears.length} Tunggakan
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <StatusBadge label="OP Air" status={statusAir} icon={Droplets} />
                                <StatusBadge label="Sampah" status={statusSampah} icon={Trash2} />
                            </div>
                            {!isFullyPaid && (
                                <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100/50">
                                    <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1.5">Bulan Belum Lunas:</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {arrears.map(m => (
                                            <span key={m} className="px-2 py-0.5 bg-white text-rose-600 rounded-lg text-[9px] font-bold border border-rose-200">
                                                {m}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Residence Info */}
                        <div className="flex flex-wrap gap-2 justify-center pb-2 border-b border-slate-100">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm ${house.status === 'Occupied' ? 'bg-blue-50 text-blue-600 border-blue-100' : house.status === 'Business' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                {house.status === 'Occupied' ? 'Dihuni' : house.status === 'Business' ? 'Tempat Usaha' : 'Rumah Kosong'}
                            </span>
                            {house.status === 'Occupied' && (
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm flex items-center gap-1 ${house.residenceType === 'Kost' ? 'bg-cyan-50 text-cyan-600 border-cyan-200' : house.residenceType === 'Kontrak' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                                    {house.residenceType === 'Kost' ? <GraduationCap size={12}/> : house.residenceType === 'Kontrak' ? <Key size={12}/> : <Home size={12}/>}
                                    {house.residenceType === 'Kost' ? 'Kost' : house.residenceType === 'Kontrak' ? 'Kontrak/Sewa' : 'Milik Sendiri'}
                                </span>
                            )}
                        </div>

                        {/* Safety Status */}
                        {isSafe ? (
                             <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
                                <div className="bg-emerald-100 p-2.5 rounded-full shadow-sm text-emerald-600"><ShieldCheck size={24} strokeWidth={2.5}/></div>
                                <div><h4 className="font-bold text-emerald-700 text-sm">Status: Aman & Terkendali</h4><p className="text-xs text-emerald-600 mt-0.5">Tidak ada laporan gangguan keamanan.</p></div>
                            </div>
                        ) : (
                            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3 animate-fade-in ring-1 ring-rose-200 shadow-sm">
                                <div className="bg-rose-100 p-2 rounded-full animate-pulse text-rose-600"><AlertTriangle size={24} strokeWidth={2.5}/></div>
                                <div><h4 className="font-bold text-rose-700 text-sm">Laporan Aktif</h4><ul className="text-xs text-rose-600 mt-1 list-disc pl-4 space-y-0.5 font-medium">{activeReports.map(r => (<li key={r.id}>{r.type}: {r.description}</li>))}</ul></div>
                            </div>
                        )}

                        {/* Family Info */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                                <div className="bg-white p-3 rounded-xl text-slate-400 shadow-sm border border-slate-100"><User size={24}/></div>
                                <div><p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Kepala Keluarga</p><p className="font-bold text-slate-800 text-lg leading-tight">{displayName}</p></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center shadow-sm"><p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Penghuni</p><p className="font-bold text-slate-800 text-xl mt-1">{house.occupants} <span className="text-xs font-normal text-slate-500">Jiwa</span></p></div>
                               <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center shadow-sm"><p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Telepon</p><p className="font-bold text-slate-800 text-sm mt-2 break-all">{house.phone || '-'}</p></div>
                            </div>

                            {/* Demografi Detail */}
                            {(house.pregnantCount || house.babyCount || house.toddlerCount || house.elderlyCount || house.widowCount) ? (
                                <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 shadow-sm">
                                    <p className="text-[10px] text-rose-400 uppercase font-bold tracking-wider mb-3">Kelompok Rentan</p>
                                    <div className="flex flex-wrap gap-4">
                                        {house.pregnantCount ? (
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-white rounded-lg text-rose-400 shadow-sm"><Heart size={14} fill="currentColor"/></div>
                                                <span className="text-xs font-bold text-slate-700">{house.pregnantCount} Ibu Hamil</span>
                                            </div>
                                        ) : null}
                                        {house.babyCount ? (
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-white rounded-lg text-rose-500 shadow-sm"><Baby size={14}/></div>
                                                <span className="text-xs font-bold text-slate-700">{house.babyCount} Bayi</span>
                                            </div>
                                        ) : null}
                                        {house.toddlerCount ? (
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-white rounded-lg text-orange-500 shadow-sm"><Baby size={14}/></div>
                                                <span className="text-xs font-bold text-slate-700">{house.toddlerCount} Balita</span>
                                            </div>
                                        ) : null}
                                        {house.elderlyCount ? (
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-white rounded-lg text-indigo-500 shadow-sm"><Accessibility size={14}/></div>
                                                <span className="text-xs font-bold text-slate-700">{house.elderlyCount} Lansia</span>
                                            </div>
                                        ) : null}
                                        {house.widowCount ? (
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-white rounded-lg text-slate-500 shadow-sm"><User size={14}/></div>
                                                <span className="text-xs font-bold text-slate-700">{house.widowCount} Janda</span>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-50 p-4 border-t border-slate-100 shrink-0">
                    {isAdmin ? (
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => { onClose(); onEditHouse?.(house); }} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 active:scale-95 transition-all shadow-lg shadow-slate-300"><Edit size={16}/> Edit Data</button>
                            <button onClick={() => { onClose(); onPayDues?.(house); }} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 active:scale-95 transition-all shadow-lg shadow-emerald-200"><DollarSign size={16}/> Catat Iuran</button>
                        </div>
                    ) : (
                        <button onClick={() => { onClose(); onReportHouse?.(house); }} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-rose-600 text-white font-bold shadow-lg shadow-rose-200 hover:bg-rose-500 active:scale-95 transition-all"><ShieldAlert size={20}/> Lapor Masalah</button>
                    )}
                </div>
            </div>
        </div>
    );
};

interface HouseCardProps {
    house: House;
    hasIssue: boolean;
    officialRole?: string;
    isAdmin: boolean;
    iuranPayments?: any[];
    activePanicAlert?: PanicAlert;
    onClick: () => void;
    showHeatmap?: boolean;
    activeLayers?: string[];
}

const HouseCard: React.FC<HouseCardProps> = ({ house, hasIssue, officialRole, isAdmin, iuranPayments, activePanicAlert, onClick, showHeatmap = false, activeLayers = ['Security', 'Social', 'Financial'] }) => {
    const { getPaymentStatus, getArrearsForHouse } = useFinancial();
    const formattedRole = officialRole ? formatRole(officialRole) : null;
    
    const statusAir = getPaymentStatus(house, 'Air');
    const statusSampah = getPaymentStatus(house, 'Sampah');
    const arrears = getArrearsForHouse(house);
    const hasArrears = arrears.length > 0;

    const getHouseColor = () => {
        if (showHeatmap) {
          const occupants = house.occupants || 0;
          if (occupants > 5) return "bg-rose-500 border-rose-700 text-white";
          if (occupants > 3) return "bg-orange-400 border-orange-600 text-white";
          if (occupants > 0) return "bg-emerald-400 border-emerald-600 text-white";
          return "bg-slate-200 border-slate-300 text-slate-400";
        }

        if (hasIssue && activeLayers.includes('Security')) return "bg-rose-50 border-rose-500 text-rose-700 shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse ring-2 ring-rose-400 z-20";
        if (officialRole) return "bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900 border-amber-400 text-white shadow-lg shadow-indigo-500/40 z-10 ring-2 ring-amber-300";
        if (house.status === 'Empty') return "bg-slate-100 border-slate-300 text-slate-400 border-dashed opacity-70";
        if (house.status === 'Business') return "bg-purple-50 border-purple-300 text-purple-700";
        if (house.residenceType === 'Kost') return "bg-gradient-to-br from-cyan-100 to-blue-200 border-cyan-500 text-cyan-900";
        if (house.residenceType === 'Kontrak') return "bg-gradient-to-br from-amber-100 to-orange-200 border-amber-500 text-amber-900";
        return "bg-gradient-to-br from-emerald-100 to-teal-200 border-emerald-500 text-emerald-900";
    };

    const showSocial = activeLayers.includes('Social');
    const showFinancial = activeLayers.includes('Financial');

    return (
        <button onClick={onClick} className={`relative flex flex-col items-center justify-center p-1 rounded-lg border transition-all duration-200 min-h-[60px] w-full hover:shadow-md hover:-translate-y-0.5 ${getHouseColor()}`}>
            <span className={`font-black leading-none drop-shadow-sm ${officialRole ? 'text-lg' : 'text-sm'}`}>{house.number}</span>
            
            <div className="flex items-center justify-center mt-1 w-full gap-0.5">
                {formattedRole ? (
                    <div className="flex flex-col items-center w-full px-1">
                        <span className="text-[8px] font-bold uppercase tracking-tight bg-black/30 px-2 py-1 rounded text-amber-300 mt-1 w-full text-center leading-none border border-white/10 shadow-sm break-words whitespace-normal">{formattedRole}</span>
                    </div>
                ) : house.status === 'Business' ? (
                    <Store size={12} className="opacity-80"/>
                ) : (
                    <div className="flex flex-wrap items-center justify-center gap-0.5">
                        {house.residenceType === 'Kost' ? <GraduationCap size={10} className="opacity-80 text-cyan-800" /> :
                         house.residenceType === 'Kontrak' ? <Key size={10} className="opacity-80 text-amber-800" /> : 
                         <Home size={10} className="opacity-80"/>}
                        
                        {house.paymentStatusSampah === PaymentStatus.PAID && (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" title="Iuran Sampah Lunas" />
                        )}
                        
                        {showSocial && (
                          <div className="flex flex-wrap items-center justify-center gap-1 mt-1 bg-white/40 backdrop-blur-[2px] rounded-md px-1 py-0.5 border border-white/20">
                            {((house.babyCount || 0) > 0) && (
                                <div className="flex items-center gap-0.5" title="Bayi">
                                    <Baby size={10} className="text-rose-500" />
                                    <span className="text-[8px] font-black text-rose-600">{house.babyCount}</span>
                                </div>
                            )}
                            {((house.toddlerCount || 0) > 0) && (
                                <div className="flex items-center gap-0.5" title="Balita">
                                    <Baby size={10} className="text-orange-500" />
                                    <span className="text-[8px] font-black text-orange-600">{house.toddlerCount}</span>
                                </div>
                            )}
                            {((house.elderlyCount || 0) > 0) && (
                                <div className="flex items-center gap-0.5" title="Lansia">
                                    <Accessibility size={10} className="text-indigo-500" />
                                    <span className="text-[8px] font-black text-indigo-600">{house.elderlyCount}</span>
                                </div>
                            )}
                            {((house.pregnantCount || 0) > 0) && (
                                <div className="flex items-center gap-0.5" title="Ibu Hamil">
                                    <Heart size={10} className="text-rose-400" fill="currentColor" />
                                    <span className="text-[8px] font-black text-rose-500">{house.pregnantCount}</span>
                                </div>
                            )}
                            {((house.widowCount || 0) > 0) && (
                                <div className="flex items-center gap-0.5" title="Janda">
                                    <User size={10} className="text-slate-600" />
                                    <span className="text-[8px] font-black text-slate-700">{house.widowCount}</span>
                                </div>
                            )}
                          </div>
                        )}
                    </div>
                )}
            </div>
            {!officialRole && showFinancial && (
                <div className="absolute top-1 right-1 flex flex-col gap-0.5">
                    <div className={`w-2 h-2 rounded-full border border-white shadow-sm ${
                        (statusAir === PaymentStatus.PAID && statusSampah === PaymentStatus.PAID) 
                        ? 'bg-emerald-500' 
                        : 'bg-rose-500 animate-pulse'
                    }`}></div>
                </div>
            )}
            {hasIssue && activeLayers.includes('Security') && <div className="absolute -top-2.5 -left-2.5 text-rose-600 bg-white rounded-full p-1 border border-rose-200 shadow-sm z-20"><AlertTriangle size={14} fill="#e11d48"/></div>}
            
            {activePanicAlert && (
                <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                    <div className="absolute inset-0 bg-rose-500/20 animate-pulse rounded-lg"></div>
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-50"></div>
                        <div className="bg-rose-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white relative z-10">
                            <Bell size={16} className="animate-shake" fill="currentColor" />
                        </div>
                    </motion.div>
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-rose-600 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl border border-white whitespace-nowrap z-50 animate-bounce">
                        {activePanicAlert.residentName} ({house.block}-{house.number})
                    </div>
                </div>
            )}
        </button>
    );
};

interface BlockRendererProps {
    blockCode: string; houses: House[]; reports: Report[]; officials: Official[]; isAdmin: boolean; iuranPayments?: any[]; activePanicAlerts?: PanicAlert[]; onSelect: (h: House) => void; className?: string;
    showHeatmap?: boolean;
    activeLayers?: string[];
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ blockCode, houses, reports, officials, isAdmin, iuranPayments, activePanicAlerts = [], onSelect, className, showHeatmap, activeLayers }) => {
    const sortByNumber = (a: House, b: House) => parseInt(a.number, 10) - parseInt(b.number, 10);
    const sortByNumberDesc = (a: House, b: House) => parseInt(b.number, 10) - parseInt(a.number, 10);
    const sortedHouses = [...houses].sort(sortByNumber);
    const splitIndex = Math.ceil(sortedHouses.length / 2);
    const leftSide = sortedHouses.slice(0, splitIndex); 
    const rightSide = sortedHouses.slice(splitIndex).sort(sortByNumberDesc); 
    const getOfficialRole = (hid: string) => officials.find(o => formatHouseId(o.houseId) === formatHouseId(hid))?.role;
    const getPanicAlert = (hid: string) => activePanicAlerts.find(a => a.houseId === hid);

    return (
        <div id={`block-${blockCode}`} className={`flex flex-col bg-white border-2 border-slate-800 shadow-[4px_4px_0px_0px_rgba(15,23,42,0.2)] rounded-lg overflow-hidden ${className || 'h-full'}`}>
            <div className="bg-rose-600 text-white text-center py-1.5 border-b-2 border-slate-800 relative overflow-hidden shrink-0">
                 <h3 className="text-xl font-black tracking-tighter relative z-10 drop-shadow-md">{blockCode}</h3>
            </div>
            <div className="flex-1 bg-slate-100 p-2 relative">
                 <div className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-0 border-l-2 border-dashed border-slate-300 z-0"></div>
                 <div className="flex gap-4 relative z-10 h-full">
                    <div className="flex-1 flex flex-col gap-2">
                        {leftSide.map(house => (<HouseCard key={house.id} house={house} isAdmin={isAdmin} iuranPayments={iuranPayments} hasIssue={reports.some(r => r.houseId === house.id && r.status !== 'Selesai')} officialRole={getOfficialRole(house.id)} activePanicAlert={getPanicAlert(house.id)} onClick={() => onSelect(house)} showHeatmap={showHeatmap} activeLayers={activeLayers} />))}
                    </div>
                     <div className="flex-1 flex flex-col gap-2">
                        {rightSide.map(house => (<HouseCard key={house.id} house={house} isAdmin={isAdmin} iuranPayments={iuranPayments} hasIssue={reports.some(r => r.houseId === house.id && r.status !== 'Selesai')} officialRole={getOfficialRole(house.id)} activePanicAlert={getPanicAlert(house.id)} onClick={() => onSelect(house)} showHeatmap={showHeatmap} activeLayers={activeLayers} />))}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface MapLayoutProps {
    houses: House[];
    reports?: Report[];
    officials?: Official[];
    isAdmin?: boolean;
    iuranPayments?: any[];
    activePanicAlerts?: PanicAlert[];
    onSelect?: (h: House) => void;
    renderBlock: (blockCode: string, houses: House[], reports: Report[], officials: Official[], isAdmin: boolean, iuranPayments: any[], activePanicAlerts: PanicAlert[], onSelect: (h: House) => void, showHeatmap?: boolean, activeLayers?: string[]) => React.ReactNode;
    className?: string;
    showHeatmap?: boolean;
    activeLayers?: string[];
    mapPoints?: MapPoint[];
}

export const MapLayout: React.FC<MapLayoutProps> = ({ houses, reports = [], officials = [], isAdmin = false, iuranPayments = [], activePanicAlerts = [], onSelect = () => {}, renderBlock, className, showHeatmap, activeLayers, mapPoints = [] }) => {
    const getBlockHouses = (code: string) => houses.filter(h => h.block === code);
    const securityPost = mapPoints.find(p => p.type === 'Security');
    
    return (
        <div className="flex flex-col gap-4 pt-4 md:pt-8">
            {/* Main Road - North Side (Highway Style) */}
            <div className="flex items-center justify-center px-8 md:px-12 py-6 bg-slate-800 rounded-2xl border-y-4 border-slate-700 relative overflow-hidden group shadow-2xl shadow-slate-900/20">
                {/* Asphalt Texture */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asphalt-dark.png')] opacity-40 pointer-events-none"></div>
                
                {/* Lane Markings - Top & Bottom Shoulder */}
                <div className="absolute top-1 left-0 right-0 h-0.5 bg-white/30"></div>
                <div className="absolute bottom-1 left-0 right-0 h-0.5 bg-white/30"></div>
                
                {/* Center Lane Divider (Dashed) */}
                <div className="absolute top-1/2 left-0 right-0 h-1 border-t-2 border-dashed border-amber-400/60 -translate-y-1/2"></div>
                
                <div className="flex items-center gap-6 relative z-10">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/90 drop-shadow-md mb-1">Jl. Pue Lombe</span>
                        <div className="flex items-center gap-1">
                            <ChevronRight size={10} className="text-amber-400 animate-pulse" />
                            <ChevronRight size={10} className="text-amber-400 animate-pulse delay-75" />
                            <ChevronRight size={10} className="text-amber-400 animate-pulse delay-150" />
                        </div>
                    </div>
                </div>
            </div>

            <div className={`grid grid-cols-4 gap-4 md:gap-6 relative ${className}`}>
                {/* SVG Overlay for Emergency Paths */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-40 overflow-visible">
              {activePanicAlerts.map(alert => {
                if (!securityPost) return null;
                const houseId = alert.houseId;
                const houseEl = document.getElementById(`house-${houseId}`);
                const securityEl = document.getElementById(`mappoint-${securityPost.id}`);
                
                if (houseEl && securityEl) {
                  const mapRect = houseEl.closest('.relative')?.getBoundingClientRect();
                  if (!mapRect) return null;
                  
                  const hRect = houseEl.getBoundingClientRect();
                  const sRect = securityEl.getBoundingClientRect();
                  
                  const x1 = sRect.left - mapRect.left + sRect.width / 2;
                  const y1 = sRect.top - mapRect.top + sRect.height / 2;
                  const x2 = hRect.left - mapRect.left + hRect.width / 2;
                  const y2 = hRect.top - mapRect.top + hRect.height / 2;

                  return (
                    <motion.line 
                      key={alert.id}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="#e11d48"
                      strokeWidth="4"
                      strokeDasharray="8 8"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  );
                }
                return null;
              })}
            </svg>

            <div className="col-span-1 flex flex-col gap-4 md:gap-6">
                {renderBlock('C5', getBlockHouses('C5'), reports, officials, isAdmin, iuranPayments, activePanicAlerts, onSelect, showHeatmap, activeLayers)}
            </div>
            <div className="col-span-1 flex flex-col gap-4 md:gap-6">
                {renderBlock('C7', getBlockHouses('C7'), reports, officials, isAdmin, iuranPayments, activePanicAlerts, onSelect, showHeatmap, activeLayers)}
                {renderBlock('C8', getBlockHouses('C8'), reports, officials, isAdmin, iuranPayments, activePanicAlerts, onSelect, showHeatmap, activeLayers)}
            </div>
            <div className="col-span-1 flex flex-col gap-4 md:gap-6">
                {renderBlock('C9', getBlockHouses('C9'), reports, officials, isAdmin, iuranPayments, activePanicAlerts, onSelect, showHeatmap, activeLayers)}
                {renderBlock('C10', getBlockHouses('C10'), reports, officials, isAdmin, iuranPayments, activePanicAlerts, onSelect, showHeatmap, activeLayers)}
            </div>
            <div className="col-span-1 flex flex-col gap-4 md:gap-6">
                {renderBlock('C11', getBlockHouses('C11'), reports, officials, isAdmin, iuranPayments, activePanicAlerts, onSelect, showHeatmap, activeLayers)}
                {renderBlock('C12', getBlockHouses('C12'), reports, officials, isAdmin, iuranPayments, activePanicAlerts, onSelect, showHeatmap, activeLayers)}
            </div>
        </div>

        {/* Alternative Road - South Side (Secondary Road Style) */}
        <div className="flex items-center justify-center px-12 py-4 bg-slate-700 rounded-xl border-y-2 border-slate-600 relative overflow-hidden shadow-lg">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asphalt-dark.png')] opacity-20 pointer-events-none"></div>
            <div className="absolute top-1/2 left-0 right-0 h-0.5 border-t border-dashed border-slate-500/50 -translate-y-1/2"></div>
            <div className="flex items-center gap-3 relative z-10">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">Jalan Alternatif</span>
            </div>
        </div>
    </div>
);
};

export const HouseMap: React.FC<HouseMapProps> = ({ houses, isAdmin, reports = [], officials = [], mapPoints = [], iuranPayments = [], activePatrol, activePanicAlerts = [], onEditHouse, onPayDues, onReportHouse }) => {
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [showCheckpoints, setShowCheckpoints] = useState(false);
  const [isManageMode, setIsManageMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingType, setDraggingType] = useState<'checkpoint' | 'mappoint' | null>(null);

  useEffect(() => {
    const unsub = subscribeToCheckpoints((data) => {
      setCheckpoints(data);
    });
    return () => unsub();
  }, []);

  const handleMapClick = async (e: React.MouseEvent) => {
    if (!isManageMode || !draggingId || !mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    if (draggingType === 'checkpoint') {
      await updateCheckpointPosition(draggingId, x, y);
    } else if (draggingType === 'mappoint') {
      await updateMapPointInDb(draggingId, { x, y });
    }
    
    setDraggingId(null);
    setDraggingType(null);
  };

  const totalHouses = houses.length;
  const totalOccupied = houses.filter(h => h.status === 'Occupied').length;
  const totalIssues = reports.filter(r => r.status !== 'Selesai').length;
  
  // Demografi Totals
  const totalBaby = houses.reduce((acc, h) => acc + (h.babyCount || 0), 0);
  const totalToddler = houses.reduce((acc, h) => acc + (h.toddlerCount || 0), 0);
  const totalElderly = houses.reduce((acc, h) => acc + (h.elderlyCount || 0), 0);
  const totalPregnant = houses.reduce((acc, h) => acc + (h.pregnantCount || 0), 0);
  const totalWidow = houses.reduce((acc, h) => acc + (h.widowCount || 0), 0);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeLayers, setActiveLayers] = useState<string[]>(['Security', 'Social', 'Financial']);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<MapPoint | null>(null);
  const [activeCctv, setActiveCctv] = useState<MapPoint | null>(null);

  const handleDownload = async () => {
    if (!containerRef.current) return;
    
    try {
      // To prevent cut-off and ensure legend is visible, we temporarily adjust styles
      const originalHeight = containerRef.current.style.height;
      const originalOverflow = containerRef.current.style.overflow;
      const originalWidth = containerRef.current.style.width;
      
      // Force dimensions for a complete capture
      containerRef.current.style.height = 'auto';
      containerRef.current.style.overflow = 'visible';
      containerRef.current.style.width = '1200px'; 
      
      // Add a temporary class to show the print-only legend
      const printLegend = containerRef.current.querySelector('.print-only-legend');
      if (printLegend) printLegend.classList.remove('hidden');

      const dataUrl = await domToPng(containerRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        filter: (node) => {
          if (node instanceof HTMLElement) {
            // Exclude UI elements like search, buttons, and sidebar
            if (node.classList.contains('no-print')) return false;
            return true;
          }
          return true;
        }
      });

      // Restore original styles and hide legend again
      containerRef.current.style.height = originalHeight;
      containerRef.current.style.overflow = originalOverflow;
      containerRef.current.style.width = originalWidth;
      if (printLegend) printLegend.classList.add('hidden');
      
      const link = document.createElement('a');
      link.download = `denah-digital-rt02-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const filteredHouses = useMemo(() => {
    if (!searchQuery) return houses;
    const query = searchQuery.toLowerCase();
    return houses.filter(h => 
      h.number.toLowerCase().includes(query) || 
      h.headOfFamily.toLowerCase().includes(query) ||
      h.block.toLowerCase().includes(query)
    );
  }, [houses, searchQuery]);

  const getBlockHouses = (code: string) => filteredHouses.filter(h => h.block === code);
  
  return (
    <div ref={containerRef} className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-200 overflow-hidden flex flex-col h-[600px] md:h-[800px] relative print:fixed print:inset-0 print:z-[9999] print:h-screen print:w-screen print:rounded-none print:border-none print:shadow-none print:bg-white">
      <div className="bg-white border-b border-slate-100 px-4 py-3 md:px-6 md:py-4 z-20 shadow-sm relative space-y-3 md:space-y-4 print:pb-2 print:mb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
            <div className="flex-1 w-full">
               <h3 className="text-lg md:text-xl font-extrabold text-slate-800 flex items-center gap-2"><MapPin className="text-brand-blue" size={20}/> Denah Digital RT 02</h3>
               <div className="flex flex-col md:flex-row gap-2 md:gap-3 mt-2 no-print">
                 <div className="relative flex-1 w-full max-w-md">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                   <input 
                     type="text" 
                     placeholder="Cari nomor rumah atau nama warga..." 
                     className="w-full pl-9 pr-4 py-1.5 md:py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                   />
                 </div>
                 <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                   <button 
                     onClick={() => setShowHeatmap(!showHeatmap)}
                     className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-bold border transition-all flex items-center gap-2 whitespace-nowrap ${showHeatmap ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                   >
                     <Lightbulb size={12} /> Heatmap
                   </button>
                   <button 
                     onClick={() => window.print()}
                     className="px-3 py-1.5 md:px-4 md:py-2 bg-white text-slate-600 border border-slate-200 rounded-xl text-[10px] md:text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2 whitespace-nowrap"
                   >
                     <Printer size={12} /> Cetak
                   </button>
                   <button 
                     onClick={handleDownload}
                     className="px-3 py-1.5 md:px-4 md:py-2 bg-indigo-600 text-white border border-indigo-600 rounded-xl text-[10px] md:text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 whitespace-nowrap"
                   >
                     <Download size={12} /> Unduh
                   </button>
                 </div>
               </div>
            </div>
            
            <div className="flex gap-3 text-[9px] md:text-xs font-bold bg-slate-50 p-2 rounded-xl border border-slate-100 overflow-x-auto no-scrollbar w-full md:w-auto no-print print:hidden">
               <button onClick={() => setShowCheckpoints(!showCheckpoints)} className={`flex items-center gap-1.5 px-2 whitespace-nowrap ${showCheckpoints ? 'text-indigo-600' : 'text-slate-500'}`}>
                   <ShieldCheck size={12}/> {showCheckpoints ? 'Sembunyikan' : 'Tampilkan'} Patroli
               </button>
               {isAdmin && showCheckpoints && (
                 <button onClick={() => setIsManageMode(!isManageMode)} className={`flex items-center gap-1.5 px-2 border-l border-slate-200 whitespace-nowrap ${isManageMode ? 'text-rose-600' : 'text-slate-500'}`}>
                    {isManageMode ? <Save size={12}/> : <Settings2 size={12}/>} {isManageMode ? 'Selesai' : 'Atur'}
                 </button>
               )}
               <div className="flex items-center gap-1.5 px-2 border-l border-slate-200 whitespace-nowrap"><Droplets size={12} className="text-blue-500"/> OP Air</div>
               <div className="flex items-center gap-1.5 px-2 border-l border-slate-200 whitespace-nowrap"><Trash2 size={12} className="text-slate-500"/> Sampah</div>
            </div>
        </div>
      </div>

      <div className="flex-1 bg-slate-100 flex overflow-hidden">
        {/* Sidebar for Info & Controls */}
        <div className="w-64 bg-white border-r border-slate-200 overflow-y-auto p-6 hidden lg:flex flex-col gap-8 shrink-0 no-print">
          {/* Compass Section */}
          <div className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-white rounded-full shadow-lg border-2 border-slate-200 flex items-center justify-center">
              <Compass size={28} className="text-rose-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Orientasi Utara</span>
          </div>

          {/* Filter Layer Section */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Settings2 size={12} /> Filter Layer
            </h4>
            <div className="space-y-2">
              {[
                { id: 'Security', label: 'Keamanan', desc: 'CCTV, APAR, Pos Satpam' },
                { id: 'Social', label: 'Sosial', desc: 'Status Mudik, Tamu, Isoman' },
                { id: 'Financial', label: 'Keuangan', desc: 'Status Iuran Sampah' }
              ].map(layer => (
                <label key={layer.id} className={`flex flex-col gap-1 p-3 rounded-xl cursor-pointer transition-all border ${activeLayers.includes(layer.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={activeLayers.includes(layer.id)}
                      onChange={() => {
                        setActiveLayers(prev => prev.includes(layer.id) ? prev.filter(l => l !== layer.id) : [...prev, layer.id]);
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className={`text-xs font-bold ${activeLayers.includes(layer.id) ? 'text-indigo-700' : 'text-slate-600'}`}>
                      {layer.label}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter ml-7">
                    {layer.desc}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Map Legend Section */}
          <div className="space-y-6">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Fasilitas & Keamanan</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-rose-600 flex items-center justify-center shadow-sm shadow-rose-200"><Video size={8} className="text-white"/></div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Titik CCTV</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-200"><Shield size={8} className="text-white"/></div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Pos Keamanan</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-orange-500 flex items-center justify-center shadow-sm shadow-orange-200"><Flame size={8} className="text-white"/></div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Titik APAR</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center shadow-sm shadow-blue-200"><Droplets size={8} className="text-white"/></div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Hydrant / Air</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Status Hunian</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded bg-gradient-to-br from-emerald-100 to-teal-200 border border-emerald-500"></div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Rumah Tetap</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded bg-gradient-to-br from-amber-100 to-orange-200 border border-amber-500"></div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Rumah Kontrak</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded bg-gradient-to-br from-cyan-100 to-blue-200 border border-cyan-500"></div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Rumah Kost</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded bg-slate-100 border border-slate-300 border-dashed"></div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Rumah Kosong</span>
                </div>
              </div>
            </div>

            {showHeatmap && (
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Kepadatan Penghuni</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded bg-rose-500"></div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase">&gt; 5 Orang</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded bg-orange-400"></div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase">3 - 5 Orang</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded bg-emerald-400"></div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase">1 - 2 Orang</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Kelompok Rentan</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-2 bg-rose-50 rounded-xl border border-rose-100">
                  <div className="flex items-center gap-2">
                    <Baby size={12} className="text-rose-500" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Bayi</span>
                  </div>
                  <span className="text-[10px] font-black text-rose-600">{totalBaby}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="flex items-center gap-2">
                    <Baby size={12} className="text-orange-500" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Balita</span>
                  </div>
                  <span className="text-[10px] font-black text-orange-600">{totalToddler}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-indigo-50 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-2">
                    <Accessibility size={12} className="text-indigo-500" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Lansia</span>
                  </div>
                  <span className="text-[10px] font-black text-indigo-600">{totalElderly}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-rose-50 rounded-xl border border-rose-100">
                  <div className="flex items-center gap-2">
                    <Heart size={12} className="text-rose-400" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Hamil</span>
                  </div>
                  <span className="text-[10px] font-black text-rose-600">{totalPregnant}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                  <div className="flex items-center gap-2">
                    <User size={12} className="text-slate-500" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Janda / Duda</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-600">{totalWidow}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-auto pt-6 border-t border-slate-100">
            <div className="p-4 bg-slate-800 rounded-2xl text-white">
              <h5 className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <Info size={12} className="text-brand-blue" /> Tips Navigasi
              </h5>
              <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">
                Klik pada kotak rumah untuk melihat detail warga, status iuran, dan riwayat laporan.
              </p>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative overflow-auto p-4 md:p-8 print:p-0 print:overflow-visible print:h-auto">
          <div className="min-w-[1000px] mx-auto relative print:min-w-0 print:w-full print:transform print:scale-[0.85] print:origin-top">
              <div 
                  ref={mapRef}
                  onClick={handleMapClick}
                  className={`border-[4px] border-amber-400/20 bg-amber-50/10 p-12 md:p-16 rounded-[48px] relative transition-all duration-500 print:border-none print:bg-white print:p-0 print:rounded-none ${isManageMode ? 'cursor-crosshair ring-8 ring-rose-500/20 border-rose-400/50' : ''}`}
              >
                          <MapLayout 
                            houses={filteredHouses} 
                            reports={reports} 
                            officials={officials} 
                            isAdmin={isAdmin} 
                            iuranPayments={iuranPayments} 
                            activePanicAlerts={activePanicAlerts} 
                            onSelect={setSelectedHouse} 
                            showHeatmap={showHeatmap}
                            activeLayers={activeLayers}
                            mapPoints={mapPoints}
                            renderBlock={(code, bHouses, bReports, bOfficials, bIsAdmin, bIuran, bAlerts, bOnSelect, bHeatmap, bLayers) => (
                              <BlockRenderer 
                                blockCode={code} 
                                houses={bHouses} 
                                reports={bReports}
                                officials={bOfficials}
                                isAdmin={bIsAdmin}
                                iuranPayments={bIuran}
                                activePanicAlerts={bAlerts}
                                onSelect={bOnSelect}
                                showHeatmap={bHeatmap}
                                activeLayers={bLayers}
                              />
                            )} 
                          />
                          
                          {/* Patrol Path SVG Layer */}
                          {showCheckpoints && checkpoints.length > 1 && (
                              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                                  <defs>
                                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                          <feGaussianBlur stdDeviation="2" result="blur" />
                                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                      </filter>
                                  </defs>
                                  {/* Base Path (Dashed) */}
                                  <polyline
                                      points={checkpoints.map(cp => `${cp.x}%,${cp.y}%`).join(' ')}
                                      fill="none"
                                      stroke="rgba(79, 70, 229, 0.2)"
                                      strokeWidth="3"
                                      strokeDasharray="8,8"
                                      style={{ vectorEffect: 'non-scaling-stroke' }}
                                  />
                                  {/* Active/Visited Path (Solid) */}
                                  {activePatrol && activePatrol.visitedCheckpoints.length > 1 && (
                                      <motion.polyline
                                          initial={{ pathLength: 0 }}
                                          animate={{ pathLength: 1 }}
                                          points={checkpoints
                                              .filter(cp => activePatrol.visitedCheckpoints.includes(cp.id))
                                              .map(cp => `${cp.x}%,${cp.y}%`)
                                              .join(' ')}
                                          fill="none"
                                          stroke="#4f46e5"
                                          strokeWidth="4"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          filter="url(#glow)"
                                          style={{ vectorEffect: 'non-scaling-stroke' }}
                                      />
                                  )}
                              </svg>
                          )}

                          {/* Legend for Print & Download */}
                          <div className="hidden print:block print-only-legend mt-8 border-t border-slate-200 pt-6">
                            <div className="grid grid-cols-4 gap-6">
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Fasilitas & Keamanan</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-600 flex items-center justify-center"><Video size={8} className="text-white"/></div> <span className="text-[10px] font-bold text-slate-600 uppercase">Titik CCTV</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center"><Shield size={8} className="text-white"/></div> <span className="text-[10px] font-bold text-slate-600 uppercase">Pos Keamanan</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500 flex items-center justify-center"><Flame size={8} className="text-white"/></div> <span className="text-[10px] font-bold text-slate-600 uppercase">Titik APAR</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center"><Droplets size={8} className="text-white"/></div> <span className="text-[10px] font-bold text-slate-600 uppercase">Hydrant / Air</span></div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Status Hunian</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-500"></div> <span className="text-[10px] font-bold text-slate-600 uppercase">Rumah Tetap</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-100 border border-amber-500"></div> <span className="text-[10px] font-bold text-slate-600 uppercase">Rumah Kontrak</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-cyan-100 border border-cyan-500"></div> <span className="text-[10px] font-bold text-slate-600 uppercase">Rumah Kost</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-100 border border-slate-300 border-dashed"></div> <span className="text-[10px] font-bold text-slate-600 uppercase">Rumah Kosong</span></div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Demografi</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2"><Baby size={10} className="text-rose-500"/> <span className="text-[10px] font-bold text-slate-600 uppercase">Bayi</span></div>
                                        <div className="flex items-center gap-2"><Baby size={10} className="text-orange-500"/> <span className="text-[10px] font-bold text-slate-600 uppercase">Balita</span></div>
                                        <div className="flex items-center gap-2"><Accessibility size={10} className="text-indigo-500"/> <span className="text-[10px] font-bold text-slate-600 uppercase">Lansia</span></div>
                                        <div className="flex items-center gap-2"><Heart size={10} className="text-rose-400"/> <span className="text-[10px] font-bold text-slate-600 uppercase">Hamil</span></div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Keterangan</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2"><Droplets size={10} className="text-blue-500"/> <span className="text-[10px] font-bold text-slate-600 uppercase">OP Air</span></div>
                                        <div className="flex items-center gap-2"><Trash2 size={10} className="text-slate-500"/> <span className="text-[10px] font-bold text-slate-600 uppercase">Sampah</span></div>
                                        <div className="flex items-center gap-2"><Compass size={10} className="text-rose-600"/> <span className="text-[10px] font-bold text-slate-600 uppercase">Orientasi Utara</span></div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 text-[8px] text-slate-400 font-bold uppercase tracking-widest text-center">
                                Dicetak pada {new Date().toLocaleString('id-ID')} - Teras Warga RT 02
                            </div>
                          </div>

                          {/* Checkpoints Overlay */}
                          {showCheckpoints && checkpoints.map((cp, i) => {
                              const isVisited = activePatrol?.visitedCheckpoints.includes(cp.id);
                              return (
                                  <div 
                                      key={cp.id} 
                                      onClick={(e) => {
                                          if (isManageMode) {
                                              e.stopPropagation();
                                              setDraggingId(cp.id);
                                              setDraggingType('checkpoint');
                                          }
                                      }}
                                      className={`absolute z-30 flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg text-[10px] md:text-xs font-bold transition-all ${
                                          draggingId === cp.id && draggingType === 'checkpoint' 
                                              ? 'bg-rose-500 scale-110 ring-4 ring-rose-200' 
                                              : isVisited 
                                                  ? 'bg-emerald-500 ring-4 ring-emerald-100' 
                                                  : 'bg-indigo-600'
                                      } text-white ${isManageMode ? 'cursor-pointer hover:scale-105' : ''}`} 
                                      style={{ 
                                          top: cp.y !== undefined ? `${cp.y}%` : `${10 + i * 15}%`, 
                                          left: cp.x !== undefined ? `${cp.x}%` : `${10 + i * 20}%`,
                                          transform: 'translate(-50%, -50%)'
                                      }}
                                  >
                                      {isVisited ? <CheckCircle size={14}/> : <ShieldCheck size={14}/>} 
                                      <span className="hidden md:inline">{cp.name}</span>
                                      <span className="md:hidden">{i + 1}</span>
                                      {isManageMode && draggingId === cp.id && draggingType === 'checkpoint' && <span className="ml-2 animate-pulse text-[10px]">(Klik di peta untuk pindah)</span>}
                                  </div>
                              );
                          })}

                          {/* Map Points Overlay (General Info) */}
                          {mapPoints.map((point) => {
                              // Filter by layer
                              if (point.type === 'CCTV' && !activeLayers.includes('Security')) return null;
                              if (point.type === 'PJU' && !activeLayers.includes('Security')) return null;
                              if (point.type === 'Hydrant' && !activeLayers.includes('Security')) return null;
                              if (point.type === 'APAR' && !activeLayers.includes('Security')) return null;
                              if (point.type === 'Security' && !activeLayers.includes('Security')) return null;
                              if (point.type === 'Trash' && !activeLayers.includes('Social')) return null;

                              return (
                              <div 
                                  key={point.id}
                                  id={`mappoint-${point.id}`}
                                  onClick={(e) => {
                                      if (isManageMode) {
                                          e.stopPropagation();
                                          setDraggingId(point.id);
                                          setDraggingType('mappoint');
                                      } else {
                                          e.stopPropagation();
                                          if (point.type === 'CCTV') setActiveCctv(point);
                                          else setSelectedFacility(point);
                                      }
                                  }}
                                  className={`absolute z-20 flex flex-col items-center -translate-x-1/2 -translate-y-1/2 transition-all ${draggingId === point.id && draggingType === 'mappoint' ? 'scale-125 z-40' : ''} ${isManageMode ? 'cursor-pointer hover:scale-110' : 'cursor-pointer'}`}
                                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                              >
                                  <div className={`p-1.5 rounded-full shadow-md ${
                                      draggingId === point.id && draggingType === 'mappoint' ? 'bg-rose-500 ring-4 ring-rose-200' :
                                      point.type === 'Gate' ? 'bg-amber-500' :
                                      point.type === 'Security' ? 'bg-blue-500' :
                                      point.type === 'Block' ? 'bg-emerald-500' :
                                      point.type === 'PJU' ? 'bg-yellow-500' :
                                      point.type === 'CCTV' ? 'bg-indigo-500' :
                                      point.type === 'Hydrant' ? 'bg-rose-500' :
                                      point.type === 'APAR' ? 'bg-orange-600' :
                                      point.type === 'Trash' ? 'bg-orange-500' :
                                      'bg-slate-500'
                                  } text-white border-2 border-white`}>
                                      {point.type === 'Gate' ? <Move size={14} /> : 
                                       point.type === 'Security' ? <Shield size={14} /> : 
                                       point.type === 'PJU' ? <Lightbulb size={14} /> :
                                       point.type === 'CCTV' ? <Video size={14} /> :
                                       point.type === 'Hydrant' ? <Droplets size={14} /> :
                                       point.type === 'APAR' ? <Flame size={14} /> :
                                       point.type === 'Trash' ? <Trash size={14} /> :
                                       <MapPin size={14} />}
                                  </div>
                                  <span className="mt-1 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-black text-slate-800 shadow-sm border border-slate-200 uppercase tracking-tighter">
                                      {point.label}
                                  </span>
                                  {isManageMode && draggingId === point.id && draggingType === 'mappoint' && (
                                      <span className="absolute -bottom-6 whitespace-nowrap bg-rose-600 text-white text-[8px] px-2 py-0.5 rounded-full animate-pulse">Klik peta untuk pindah</span>
                                  )}
                              </div>
                              );
                          })}

                          {/* Active Patrol Location */}
                          {activePatrol?.currentLocation && (
                              <motion.div 
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute z-50 flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
                                  style={{ left: `${activePatrol.currentLocation.x}%`, top: `${activePatrol.currentLocation.y}%` }}
                              >
                                  <div className="relative">
                                      <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-25 scale-150"></div>
                                      <div className="bg-indigo-600 text-white p-3 md:p-4 rounded-full shadow-2xl shadow-indigo-300 ring-4 ring-white relative z-10">
                                          <Navigation size={24} fill="currentColor" className="animate-pulse" />
                                      </div>
                                  </div>
                                  <div className="mt-2 bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg border-2 border-white whitespace-nowrap">
                                      Petugas: {activePatrol.officerName}
                                  </div>
                              </motion.div>
                          )}

                          {/* Active Panic Alerts (Overlay for unknown locations) */}
                          {activePanicAlerts.filter(a => !a.houseId || a.houseId === 'Unknown').map((alert) => (
                              <motion.div 
                                  key={alert.id}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: [1, 1.3, 1] }}
                                  transition={{ repeat: Infinity, duration: 1 }}
                                  className="absolute z-50 flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
                                  style={{ left: `${alert.locationCoords?.x || 50}%`, top: `${alert.locationCoords?.y || 50}%` }}
                              >
                                  <div className="relative">
                                      <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-50 scale-200"></div>
                                      <div className="bg-rose-600 text-white p-4 md:p-5 rounded-full shadow-2xl shadow-rose-400 ring-4 ring-white relative z-10">
                                          <Bell size={32} className="animate-shake" />
                                       </div>
                                  </div>
                                  <div className="mt-3 bg-rose-600 text-white px-4 py-1.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl border-2 border-white animate-bounce">
                                      DARURAT: {alert.residentName} ({alert.location})
                                  </div>
                              </motion.div>
                          ))}
                      </div>
                  </div>
              </div>
      </div>
      {selectedHouse && (<HouseDetailModal house={selectedHouse} onClose={() => setSelectedHouse(null)} reports={reports} isAdmin={isAdmin} officials={officials} iuranPayments={iuranPayments} onEditHouse={onEditHouse} onPayDues={onPayDues} onReportHouse={onReportHouse} />)}
      
      {/* CCTV Modal */}
      {activeCctv && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border-4 border-slate-800"
          >
            <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-700 rounded-lg">
                  <Video size={20} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tighter text-lg">{activeCctv.label}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Live Surveillance Feed</p>
                </div>
              </div>
              <button onClick={() => setActiveCctv(null)} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="aspect-video bg-black relative flex items-center justify-center group">
              {activeCctv.cctvUrl ? (
                <iframe 
                  src={activeCctv.cctvUrl} 
                  className="w-full h-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-slate-700">
                    <VideoOff size={32} className="text-slate-500" />
                  </div>
                  <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Signal Lost / Camera Offline</p>
                  <p className="text-slate-600 text-xs mt-2 font-bold italic">Check connection or contact security administrator</p>
                </div>
              )}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-rose-600 px-2 py-1 rounded text-[10px] font-black text-white uppercase tracking-widest animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                Live
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-4 text-slate-500">
                <div className="flex items-center gap-1">
                  <Activity size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-bold uppercase">Bitrate: 4.2 Mbps</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span className="text-[10px] font-bold uppercase">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
              <button className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all shadow-lg">
                Full Screen
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Facility Info Modal */}
      {selectedFacility && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-4 border-slate-800"
          >
            <div className="bg-indigo-600 p-6 text-white relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative z-10 flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
                    <Info size={24} />
                  </div>
                  <div>
                    <h3 className="font-black uppercase tracking-tighter text-2xl leading-none">{selectedFacility.label}</h3>
                    <p className="text-xs text-indigo-100 font-bold uppercase tracking-widest mt-1">Informasi Fasilitas Umum</p>
                  </div>
                </div>
                <button onClick={() => setSelectedFacility(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-100 mb-6">
                <p className="text-slate-700 font-bold italic leading-relaxed">
                  {selectedFacility.facilityInfo || "Informasi detail mengenai fasilitas ini belum tersedia. Silakan hubungi pengurus RT untuk informasi lebih lanjut."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1">Status</p>
                  <p className="text-emerald-700 font-black uppercase text-sm">Aktif / Tersedia</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mb-1">Terakhir Update</p>
                  <p className="text-amber-700 font-black uppercase text-sm">Hari Ini</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-200">
              <button 
                onClick={() => setSelectedFacility(null)}
                className="w-full bg-slate-800 text-white py-3 rounded-xl font-black uppercase tracking-widest hover:bg-slate-700 transition-all shadow-lg"
              >
                Tutup Informasi
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
