import React, { useState, useEffect, useRef } from 'react';
import { House, PaymentStatus, Report, Official, Checkpoint, MapPoint, PatrolSession, PanicAlert } from '../types';
import { Home, MapPin, Store, X, AlertTriangle, User, Edit, DollarSign, ShieldAlert, ChevronRight, Info, CheckCircle, ShieldCheck, Star, Baby, Heart, Accessibility, Smile, Users, GraduationCap, Key, Briefcase as BriefcaseIcon, Phone, MessageCircle, Droplets, Trash2, Settings2, Save, Move, Shield, Lightbulb, Video, Trash, Navigation, Bell } from 'lucide-react';
import { motion } from 'motion/react';
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
    onClick: () => void;
}

const HouseCard: React.FC<HouseCardProps> = ({ house, hasIssue, officialRole, isAdmin, iuranPayments, onClick }) => {
    const { getPaymentStatus, getArrearsForHouse } = useFinancial();
    const formattedRole = officialRole ? formatRole(officialRole) : null;
    
    const statusAir = getPaymentStatus(house, 'Air');
    const statusSampah = getPaymentStatus(house, 'Sampah');
    const arrears = getArrearsForHouse(house);
    const hasArrears = arrears.length > 0;

    const getHouseColor = () => {
        if (hasIssue) return "bg-rose-50 border-rose-500 text-rose-700 shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse ring-2 ring-rose-400 z-20";
        if (officialRole) return "bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900 border-amber-400 text-white shadow-lg shadow-indigo-500/40 z-10 ring-2 ring-amber-300";
        if (house.status === 'Empty') return "bg-slate-100 border-slate-300 text-slate-400 border-dashed opacity-70";
        if (house.status === 'Business') return "bg-purple-50 border-purple-300 text-purple-700";
        if (house.residenceType === 'Kost') return "bg-gradient-to-br from-cyan-100 to-blue-200 border-cyan-500 text-cyan-900";
        if (house.residenceType === 'Kontrak') return "bg-gradient-to-br from-amber-100 to-orange-200 border-amber-500 text-amber-900";
        return "bg-gradient-to-br from-emerald-100 to-teal-200 border-emerald-500 text-emerald-900";
    };

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
                        
                        {(house.hasBaby || (house.babyCount || 0) > 0) && (
                            <Baby size={10} className="text-rose-500" />
                        )}
                        {(house.hasToddler || (house.toddlerCount || 0) > 0) && (
                            <Baby size={10} className="text-orange-500" />
                        )}
                        {(house.hasElderly || (house.elderlyCount || 0) > 0) && (
                            <Accessibility size={10} className="text-indigo-500" />
                        )}
                        {(house.hasPregnant || (house.pregnantCount || 0) > 0) && (
                            <Heart size={10} className="text-rose-400" fill="currentColor" />
                        )}
                        {(house.hasWidow || (house.widowCount || 0) > 0) && (
                            <User size={10} className="text-slate-600" />
                        )}
                    </div>
                )}
            </div>
            {!officialRole && (
                <div className="absolute top-1 right-1 flex flex-col gap-0.5">
                    <div className={`w-2 h-2 rounded-full border border-white shadow-sm ${
                        (statusAir === PaymentStatus.PAID && statusSampah === PaymentStatus.PAID) 
                        ? 'bg-emerald-500' 
                        : 'bg-rose-500 animate-pulse'
                    }`}></div>
                </div>
            )}
            {hasIssue && <div className="absolute -top-2.5 -left-2.5 text-rose-600 bg-white rounded-full p-1 border border-rose-200 shadow-sm z-20"><AlertTriangle size={14} fill="#e11d48"/></div>}
        </button>
    );
};

interface BlockRendererProps {
    blockCode: string; houses: House[]; reports: Report[]; officials: Official[]; isAdmin: boolean; iuranPayments?: any[]; onSelect: (h: House) => void; className?: string;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ blockCode, houses, reports, officials, isAdmin, iuranPayments, onSelect, className }) => {
    const sortByNumber = (a: House, b: House) => parseInt(a.number, 10) - parseInt(b.number, 10);
    const sortByNumberDesc = (a: House, b: House) => parseInt(b.number, 10) - parseInt(a.number, 10);
    const sortedHouses = [...houses].sort(sortByNumber);
    const splitIndex = Math.ceil(sortedHouses.length / 2);
    const leftSide = sortedHouses.slice(0, splitIndex); 
    const rightSide = sortedHouses.slice(splitIndex).sort(sortByNumberDesc); 
    const getOfficialRole = (hid: string) => officials.find(o => formatHouseId(o.houseId) === formatHouseId(hid))?.role;

    return (
        <div className={`flex flex-col bg-white border-2 border-slate-800 shadow-[4px_4px_0px_0px_rgba(15,23,42,0.2)] rounded-lg overflow-hidden ${className || 'h-full'}`}>
            <div className="bg-rose-600 text-white text-center py-1.5 border-b-2 border-slate-800 relative overflow-hidden shrink-0">
                 <h3 className="text-xl font-black tracking-tighter relative z-10 drop-shadow-md">{blockCode}</h3>
            </div>
            <div className="flex-1 bg-slate-100 p-2 relative overflow-y-auto custom-scrollbar">
                 <div className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-0 border-l-2 border-dashed border-slate-300 z-0"></div>
                 <div className="flex gap-4 relative z-10 h-full">
                    <div className="flex-1 flex flex-col gap-2">
                        {leftSide.map(house => (<HouseCard key={house.id} house={house} isAdmin={isAdmin} iuranPayments={iuranPayments} hasIssue={reports.some(r => r.houseId === house.id && r.status !== 'Selesai')} officialRole={getOfficialRole(house.id)} onClick={() => onSelect(house)} />))}
                    </div>
                     <div className="flex-1 flex flex-col gap-2">
                        {rightSide.map(house => (<HouseCard key={house.id} house={house} isAdmin={isAdmin} iuranPayments={iuranPayments} hasIssue={reports.some(r => r.houseId === house.id && r.status !== 'Selesai')} officialRole={getOfficialRole(house.id)} onClick={() => onSelect(house)} />))}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface MapLayoutProps {
    houses: House[];
    renderBlock: (blockCode: string, houses: House[]) => React.ReactNode;
    className?: string;
}

export const MapLayout: React.FC<MapLayoutProps> = ({ houses, renderBlock, className }) => {
    const getBlockHouses = (code: string) => houses.filter(h => h.block === code);
    
    return (
        <div className={`grid grid-cols-4 gap-4 md:gap-6 ${className}`}>
            <div className="col-span-1 flex flex-col gap-4 md:gap-6">
                {renderBlock('C5', getBlockHouses('C5'))}
            </div>
            <div className="col-span-1 flex flex-col gap-4 md:gap-6">
                {renderBlock('C7', getBlockHouses('C7'))}
                {renderBlock('C8', getBlockHouses('C8'))}
            </div>
            <div className="col-span-1 flex flex-col gap-4 md:gap-6">
                {renderBlock('C9', getBlockHouses('C9'))}
                {renderBlock('C10', getBlockHouses('C10'))}
            </div>
            <div className="col-span-1 flex flex-col gap-4 md:gap-6">
                {renderBlock('C11', getBlockHouses('C11'))}
                {renderBlock('C12', getBlockHouses('C12'))}
            </div>
        </div>
    );
};

export const HouseMap: React.FC<HouseMapProps> = ({ houses, isAdmin, reports = [], officials = [], mapPoints = [], iuranPayments = [], activePatrol, activePanicAlerts = [], onEditHouse, onPayDues, onReportHouse }) => {
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [showCheckpoints, setShowCheckpoints] = useState(false);
  const [isManageMode, setIsManageMode] = useState(false);
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

  const getBlockHouses = (code: string) => houses.filter(h => h.block === code);
  
  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-200 overflow-hidden flex flex-col h-[750px]">
      <div className="bg-white border-b border-slate-100 px-6 py-4 z-20 shadow-sm relative space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2"><MapPin className="text-brand-blue" size={24}/> Denah Digital RT 02</h3>
               <p className="text-xs text-slate-500 font-medium">Klik kavling rumah untuk melihat detail informasi.</p>
            </div>
            <div className="flex gap-4 text-[10px] md:text-xs font-bold bg-slate-50 p-2 rounded-xl border border-slate-100 overflow-x-auto no-scrollbar">
               <button onClick={() => setShowCheckpoints(!showCheckpoints)} className={`flex items-center gap-1.5 px-2 whitespace-nowrap ${showCheckpoints ? 'text-indigo-600' : 'text-slate-500'}`}>
                   <ShieldCheck size={12}/> {showCheckpoints ? 'Sembunyikan' : 'Tampilkan'} Patroli
               </button>
               {isAdmin && showCheckpoints && (
                 <button onClick={() => setIsManageMode(!isManageMode)} className={`flex items-center gap-1.5 px-2 border-l border-slate-200 whitespace-nowrap ${isManageMode ? 'text-rose-600' : 'text-slate-500'}`}>
                    {isManageMode ? <Save size={12}/> : <Settings2 size={12}/>} {isManageMode ? 'Selesai Atur' : 'Atur Titik'}
                 </button>
               )}
               <div className="flex items-center gap-1.5 px-2 border-l border-slate-200 whitespace-nowrap"><Droplets size={12} className="text-blue-500"/> OP Air</div>
               <div className="flex items-center gap-1.5 px-2 border-l border-slate-200 whitespace-nowrap"><Trash2 size={12} className="text-slate-500"/> Sampah</div>
               <div className="flex items-center gap-1.5 px-2 border-l border-slate-200 whitespace-nowrap"><Baby size={12} className="text-rose-500"/> {totalBaby} Bayi</div>
               <div className="flex items-center gap-1.5 px-2 border-l border-slate-200 whitespace-nowrap"><Baby size={12} className="text-orange-500"/> {totalToddler} Balita</div>
               <div className="flex items-center gap-1.5 px-2 border-l border-slate-200 whitespace-nowrap"><Accessibility size={12} className="text-indigo-500"/> {totalElderly} Lansia</div>
               <div className="flex items-center gap-1.5 px-2 border-l border-slate-200 whitespace-nowrap"><Heart size={12} className="text-rose-400" fill="currentColor"/> {totalPregnant} Hamil</div>
               <div className="flex items-center gap-1.5 px-2 border-l border-slate-200 whitespace-nowrap"><User size={12} className="text-slate-600"/> {totalWidow} Janda</div>
            </div>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-auto bg-slate-50 relative custom-scrollbar p-4 md:p-8 scroll-smooth">
               <div className="min-w-[900px] relative">
                   <div 
                    ref={mapRef}
                    onClick={handleMapClick}
                    className={`border-[6px] border-dashed border-amber-400 bg-amber-50/50 p-6 rounded-3xl relative ${isManageMode ? 'cursor-crosshair' : ''}`}
                   >
                       <MapLayout 
                            houses={houses} 
                            renderBlock={(blockCode, blockHouses) => (
                                <BlockRenderer 
                                    blockCode={blockCode} 
                                    houses={blockHouses} 
                                    reports={reports} 
                                    officials={officials} 
                                    isAdmin={isAdmin} 
                                    iuranPayments={iuranPayments} 
                                    onSelect={setSelectedHouse} 
                                />
                            )}
                        />
                       
                       {/* Checkpoints Overlay */}
                       {showCheckpoints && checkpoints.map((cp, i) => (
                           <div 
                            key={cp.id} 
                            onClick={(e) => {
                                if (isManageMode) {
                                    e.stopPropagation();
                                    setDraggingId(cp.id);
                                    setDraggingType('checkpoint');
                                }
                            }}
                            className={`absolute z-30 flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg text-xs font-bold transition-all ${draggingId === cp.id && draggingType === 'checkpoint' ? 'bg-rose-500 scale-110 ring-4 ring-rose-200' : 'bg-indigo-600'} text-white ${isManageMode ? 'cursor-pointer hover:scale-105' : ''}`} 
                            style={{ 
                                top: cp.y !== undefined ? `${cp.y}%` : `${10 + i * 15}%`, 
                                left: cp.x !== undefined ? `${cp.x}%` : `${10 + i * 20}%`,
                                transform: 'translate(-50%, -50%)'
                            }}
                           >
                               <ShieldCheck size={14}/> {cp.name}
                               {isManageMode && draggingId === cp.id && draggingType === 'checkpoint' && <span className="ml-2 animate-pulse text-[10px]">(Klik di peta untuk pindah)</span>}
                           </div>
                       ))}

                        {/* Map Points Overlay (General Info) */}
                       {mapPoints.map((point) => (
                           <div 
                            key={point.id}
                            onClick={(e) => {
                                if (isManageMode) {
                                    e.stopPropagation();
                                    setDraggingId(point.id);
                                    setDraggingType('mappoint');
                                }
                            }}
                            className={`absolute z-20 flex flex-col items-center -translate-x-1/2 -translate-y-1/2 transition-all ${draggingId === point.id && draggingType === 'mappoint' ? 'scale-125 z-40' : ''} ${isManageMode ? 'cursor-pointer hover:scale-110' : ''}`}
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
                                   point.type === 'Trash' ? 'bg-orange-500' :
                                   'bg-slate-500'
                               } text-white border-2 border-white`}>
                                   {point.type === 'Gate' ? <Move size={14} /> : 
                                    point.type === 'Security' ? <Shield size={14} /> : 
                                    point.type === 'PJU' ? <Lightbulb size={14} /> :
                                    point.type === 'CCTV' ? <Video size={14} /> :
                                    point.type === 'Hydrant' ? <Droplets size={14} /> :
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
                       ))}

                       {/* Active Patrol Location */}
                       {activePatrol?.currentLocation && (
                           <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute z-50 flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
                            style={{ left: `${activePatrol.currentLocation.x}%`, top: `${activePatrol.currentLocation.y}%` }}
                           >
                               <div className="bg-indigo-600 text-white p-2 rounded-full shadow-xl shadow-indigo-200 ring-4 ring-indigo-100 animate-bounce">
                                   <Navigation size={18} fill="currentColor" />
                               </div>
                               <div className="mt-1 bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm">
                                   Petugas Ronda
                               </div>
                           </motion.div>
                       )}

                       {/* Active Panic Alerts */}
                       {activePanicAlerts.map((alert) => (
                           <motion.div 
                            key={alert.id}
                            initial={{ scale: 0 }}
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="absolute z-50 flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
                            style={{ left: `${alert.locationCoords?.x || 50}%`, top: `${alert.locationCoords?.y || 50}%` }}
                           >
                               <div className="bg-rose-600 text-white p-3 rounded-full shadow-xl shadow-rose-300 ring-8 ring-rose-100/50">
                                   <Bell size={24} className="animate-shake" />
                               </div>
                               <div className="mt-2 bg-rose-600 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg border-2 border-white">
                                   DARURAT: {alert.residentName}
                               </div>
                           </motion.div>
                       ))}
                   </div>
               </div>
          </div>
      </div>
      {selectedHouse && (<HouseDetailModal house={selectedHouse} onClose={() => setSelectedHouse(null)} reports={reports} isAdmin={isAdmin} officials={officials} iuranPayments={iuranPayments} onEditHouse={onEditHouse} onPayDues={onPayDues} onReportHouse={onReportHouse} />)}
    </div>
  );
};
