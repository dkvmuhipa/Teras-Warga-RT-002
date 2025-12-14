
import React, { useState, useEffect } from 'react';
import { House, PaymentStatus, Report, Official } from '../types';
import { Home, MapPin, Store, X, AlertTriangle, User, Edit, DollarSign, ShieldAlert, ChevronRight, Info, CheckCircle, ShieldCheck, Star, Baby, Heart, Accessibility, Smile, Users, GraduationCap, Key, Briefcase as BriefcaseIcon, Phone, MessageCircle } from 'lucide-react';

interface HouseMapProps {
  houses: House[];
  isAdmin: boolean;
  reports?: Report[];
  officials?: Official[];
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
    onEditHouse?: (house: House) => void;
    onPayDues?: (house: House) => void;
    onReportHouse?: (house: House) => void;
}

// --- Helper Functions ---
const shortenName = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length <= 1) return fullName;

    // Pertahankan gelar (Bpk, Ibu, dr, dll) jika ada
    let startIndex = 0;
    let prefix = "";
    if (parts[0].includes('.') || ['Bpk', 'Ibu', 'Sdr'].includes(parts[0])) {
        prefix = parts[0] + " ";
        startIndex = 1;
    }

    if (parts.length - startIndex <= 1) return fullName;

    // Ambil nama depan penuh
    const firstName = parts[startIndex];
    
    // Singkat sisa nama
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

// --- Detail Modal Component ---
const HouseDetailModal: React.FC<HouseDetailModalProps> = ({ 
    house, 
    onClose, 
    reports, 
    isAdmin, 
    officials,
    onEditHouse, 
    onPayDues, 
    onReportHouse 
}) => {
    const activeReports = reports.filter(r => r.houseId === house.id && r.status !== 'Selesai');
    const isSafe = activeReports.length === 0;
    const officialData = officials?.find(o => o.houseId === house.id);
    
    // Shorten the head of family name for display
    const displayName = shortenName(house.headOfFamily);
    
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="bg-white w-full max-w-sm md:max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-slide-up ring-1 ring-slate-200 flex flex-col max-h-[85vh]">
                {/* Header Section (Fixed) */}
                <div className={`relative px-6 py-8 flex flex-col items-center justify-center text-center shrink-0 transition-colors duration-300 ${isSafe ? (officialData ? 'bg-slate-800' : 'bg-emerald-600') : 'bg-rose-600'}`}>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none"></div>
                    <button 
                        onClick={onClose} 
                        className="absolute top-3 right-3 z-20 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
                    >
                        <X size={18}/>
                    </button>
                    
                    <div className="relative text-white space-y-1 mt-2 z-10">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter shadow-sm drop-shadow-md">{house.block}-{house.number}</h2>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-90">Kavling Rumah</p>
                    </div>
                </div>

                {/* Content Section (Scrollable) */}
                <div className="overflow-y-auto custom-scrollbar flex-1 bg-white">
                    <div className="p-6 space-y-6">

                         {/* OFFICIAL CARD SECTION (NEW) */}
                         {officialData && (
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 text-white p-5 shadow-lg shadow-slate-300 ring-4 ring-slate-50 transform transition-all hover:scale-[1.02] border border-slate-700">
                                <div className="absolute top-0 right-0 p-4 opacity-10 transform rotate-12 pointer-events-none">
                                    <Star size={100} fill="currentColor" />
                                </div>
                                <div className="relative z-10 flex items-center gap-5">
                                     <div className="relative shrink-0">
                                         <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-br from-amber-300 to-yellow-600 shadow-lg">
                                             <img 
                                                src={officialData.photo || `https://ui-avatars.com/api/?name=${officialData.name}&background=random`} 
                                                alt={officialData.name}
                                                className="w-full h-full rounded-full border-2 border-white object-cover bg-white"
                                             />
                                         </div>
                                         <div className="absolute -bottom-1 -right-1 bg-amber-400 text-amber-900 p-1 rounded-full border-2 border-slate-800 shadow-sm">
                                            <Star size={12} fill="currentColor"/>
                                         </div>
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <div className="flex items-center gap-2 mb-1">
                                            <span className="inline-block px-2 py-0.5 rounded-md bg-white/10 border border-white/20 text-[10px] font-bold text-amber-300 uppercase tracking-widest">
                                                Pengurus RT 002
                                            </span>
                                         </div>
                                         <h3 className="font-black text-xl leading-tight text-white truncate">{officialData.role}</h3>
                                         <p className="text-sm text-slate-300 font-medium mt-0.5 truncate">{officialData.name}</p>

                                         <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center gap-3">
                                             <div className="flex items-center gap-1.5 text-xs text-slate-300">
                                                <Phone size={12} className="text-amber-400"/>
                                                <span className="font-mono tracking-tight">{officialData.phone}</span>
                                             </div>
                                             <a href={`https://wa.me/${officialData.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-500 transition-colors shadow-sm ring-1 ring-emerald-400/50 ml-auto md:ml-0">
                                                <MessageCircle size={12}/> Hubungi
                                             </a>
                                         </div>
                                     </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 justify-center pb-2 border-b border-slate-100">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm ${
                                house.status === 'Occupied' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                house.status === 'Business' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                                'bg-slate-50 text-slate-500 border-slate-200'
                            }`}>
                                {house.status === 'Occupied' ? 'Dihuni' : house.status === 'Business' ? 'Tempat Usaha' : 'Rumah Kosong'}
                            </span>
                            
                            {/* Residence Type Badge (Fixed to include Kost) */}
                            {house.status === 'Occupied' && (
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm flex items-center gap-1 ${
                                    house.residenceType === 'Kost'
                                    ? 'bg-cyan-50 text-cyan-600 border-cyan-200'
                                    : house.residenceType === 'Kontrak' 
                                    ? 'bg-amber-50 text-amber-600 border-amber-200' 
                                    : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                                }`}>
                                    {house.residenceType === 'Kost' ? <GraduationCap size={12}/> : house.residenceType === 'Kontrak' ? <Key size={12}/> : <Home size={12}/>}
                                    {house.residenceType === 'Kost' ? 'Kost' : house.residenceType === 'Kontrak' ? 'Kontrak/Sewa' : 'Milik Sendiri'}
                                </span>
                            )}

                            {isAdmin && (
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm ${
                                    house.paymentStatus === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                    house.paymentStatus === PaymentStatus.PENDING ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                    'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                    Iuran: {house.paymentStatus}
                                </span>
                            )}
                        </div>

                        {/* Status Report / Safety Check */}
                        {isSafe ? (
                             <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
                                <div className="bg-emerald-100 p-2.5 rounded-full shadow-sm text-emerald-600">
                                    <ShieldCheck size={24} strokeWidth={2.5}/>
                                </div>
                                <div>
                                    <h4 className="font-bold text-emerald-700 text-sm">Status: Aman & Terkendali</h4>
                                    <p className="text-xs text-emerald-600 mt-0.5">Tidak ada laporan gangguan keamanan atau fasilitas.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3 animate-fade-in ring-1 ring-rose-200 shadow-sm">
                                <div className="bg-rose-100 p-2 rounded-full animate-pulse text-rose-600">
                                    <AlertTriangle size={24} strokeWidth={2.5}/>
                                </div>
                                <div>
                                    <h4 className="font-bold text-rose-700 text-sm">Laporan Aktif</h4>
                                    <ul className="text-xs text-rose-600 mt-1 list-disc pl-4 space-y-0.5 font-medium">
                                        {activeReports.map(r => (
                                            <li key={r.id}>{r.type}: {r.description}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Demographics Badge (Only if available) */}
                        {(house.hasPregnant || house.hasBaby || house.hasToddler || house.hasTeenager || house.hasElderly) && (
                            <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Demografi & Kesehatan</h4>
                                <div className="flex flex-wrap gap-2">
                                    {house.hasPregnant && (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-50 border border-pink-100 text-pink-700 text-xs font-bold">
                                            <Heart size={12} fill="currentColor"/> Ibu Hamil
                                        </div>
                                    )}
                                    {house.hasBaby && (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-700 text-xs font-bold">
                                            <Baby size={14} /> Bayi
                                        </div>
                                    )}
                                    {house.hasToddler && (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-100 text-orange-700 text-xs font-bold">
                                            <Smile size={14} /> Balita
                                        </div>
                                    )}
                                    {house.hasTeenager && (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lime-50 border border-lime-100 text-lime-700 text-xs font-bold">
                                            <GraduationCap size={14} /> Remaja
                                        </div>
                                    )}
                                    {house.hasElderly && (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-100 text-purple-700 text-xs font-bold">
                                            <Accessibility size={14} /> Lansia
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Family Info */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                                <div className="bg-white p-3 rounded-xl text-slate-400 shadow-sm border border-slate-100"><User size={24}/></div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Kepala Keluarga</p>
                                    <p className="font-bold text-slate-800 text-lg leading-tight">{displayName}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                               <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center shadow-sm">
                                   <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Penghuni</p>
                                   <p className="font-bold text-slate-800 text-xl mt-1">{house.occupants} <span className="text-xs font-normal text-slate-500">Jiwa</span></p>
                               </div>
                               <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center shadow-sm">
                                   <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Telepon</p>
                                   <p className="font-bold text-slate-800 text-sm mt-2 break-all">{house.phone || '-'}</p>
                               </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions (Fixed) */}
                <div className="bg-slate-50 p-4 border-t border-slate-100 shrink-0">
                    {isAdmin ? (
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => { onClose(); onEditHouse?.(house); }} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 active:scale-95 transition-all shadow-lg shadow-slate-300">
                                <Edit size={16}/> Edit Data
                            </button>
                            <button onClick={() => { onClose(); onPayDues?.(house); }} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 active:scale-95 transition-all shadow-lg shadow-emerald-200">
                                <DollarSign size={16}/> Catat Iuran
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => { onClose(); onReportHouse?.(house); }} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-rose-600 text-white font-bold shadow-lg shadow-rose-200 hover:bg-rose-500 hover:shadow-rose-300 active:scale-95 transition-all">
                            <ShieldAlert size={20}/> Lapor Masalah di Rumah Ini
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

interface HouseCardProps {
    house: House;
    hasIssue: boolean;
    officialRole?: string; // New prop to pass specific role (e.g. "Ketua RT")
    isAdmin: boolean;
    onClick: () => void;
}

// --- House Card Component (Tiny) ---
const HouseCard: React.FC<HouseCardProps> = ({ house, hasIssue, officialRole, isAdmin, onClick }) => {
    const formattedRole = officialRole ? formatRole(officialRole) : null;

    const getHouseColor = () => {
        // 1. Critical: Has Report/Issue (Tetap Pulse tapi jangan scale)
        if (hasIssue) return "bg-rose-50 border-rose-500 text-rose-700 shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse ring-2 ring-rose-400 z-20";
        
        // 2. Official House (Pengurus RT) - VIP Look
        // Gradient Purple/Indigo background to stand out
        if (officialRole) return "bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900 border-amber-400 text-white shadow-lg shadow-indigo-500/40 z-10 ring-2 ring-amber-300";

        // 3. Status based
        if (house.status === 'Empty') return "bg-slate-100 border-slate-300 text-slate-400 border-dashed opacity-70";
        if (house.status === 'Business') return "bg-purple-50 border-purple-300 text-purple-700";
        
        // 4. Safe / Occupied (Vibrant Green)
        // Check for Kost specifically
        if (house.residenceType === 'Kost') return "bg-gradient-to-br from-cyan-100 to-blue-200 border-cyan-500 text-cyan-900 shadow-sm hover:shadow-cyan-300/50 hover:border-cyan-600";
        if (house.residenceType === 'Kontrak') return "bg-gradient-to-br from-amber-100 to-orange-200 border-amber-500 text-amber-900 shadow-sm hover:shadow-amber-300/50 hover:border-amber-600";
        
        return "bg-gradient-to-br from-emerald-100 to-teal-200 border-emerald-500 text-emerald-900 shadow-sm hover:shadow-emerald-300/50 hover:border-emerald-600";
    };

    // Demographic Icons check
    const hasDemographics = house.hasPregnant || house.hasBaby || house.hasToddler || house.hasTeenager || house.hasElderly;

    return (
        <button
            onClick={onClick}
            className={`
                relative flex flex-col items-center justify-center p-1 rounded-lg border transition-all duration-200
                min-h-[60px] w-full
                hover:shadow-md hover:-translate-y-0.5
                ${getHouseColor()}
            `}
        >
            <span className={`font-black leading-none drop-shadow-sm ${officialRole ? 'text-lg' : 'text-sm'}`}>
                {house.number}
            </span>
            
            <div className="flex items-center justify-center mt-1 w-full">
                {formattedRole ? (
                    // Display Role Label for Officials (Updated to prevent cutoff)
                    <div className="flex flex-col items-center w-full px-1">
                        <span className="text-[8px] font-bold uppercase tracking-tight bg-black/30 px-2 py-1 rounded text-amber-300 mt-1 w-full text-center leading-none border border-white/10 shadow-sm break-words whitespace-normal">
                            {formattedRole}
                        </span>
                    </div>
                ) : house.status === 'Business' ? (
                    <Store size={12} className="opacity-80"/>
                ) : (
                    // Show Key icon for Renters, Home for Permanent, Cap for Kost
                    house.residenceType === 'Kost' ? <GraduationCap size={12} className="opacity-80 text-cyan-800" /> :
                    house.residenceType === 'Kontrak' ? <Key size={12} className="opacity-80 text-amber-800" /> : 
                    <Home size={12} className="opacity-80"/>
                )}
            </div>

            {/* Demographic Indicators (Small Icons at Bottom) - Only if NOT an official to avoid clutter */}
            {!officialRole && hasDemographics && (
                <div className="flex gap-0.5 mt-1 opacity-80">
                    {house.hasPregnant && <div className="text-pink-600" title="Ibu Hamil"><Heart size={8} fill="currentColor"/></div>}
                    {house.hasBaby && <div className="text-cyan-600" title="Bayi"><Baby size={8} /></div>}
                    {house.hasToddler && <div className="text-orange-600" title="Balita"><Smile size={8} /></div>}
                    {house.hasTeenager && <div className="text-lime-600" title="Remaja"><GraduationCap size={8} /></div>}
                    {house.hasElderly && <div className="text-purple-600" title="Lansia"><Accessibility size={8} /></div>}
                </div>
            )}

            {/* Gold Star Icon for Officials (Top Right Corner) */}
            {officialRole && (
                <div className="absolute -top-2 -right-2 z-20">
                    <Star size={16} fill="#FACC15" className="text-amber-400 drop-shadow-md animate-bounce-slow" />
                </div>
            )}
            
            {/* Admin Payment Indicator */}
            {isAdmin && !officialRole && (
                <div className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${
                    house.paymentStatus === PaymentStatus.PAID ? 'bg-emerald-500' :
                    house.paymentStatus === PaymentStatus.PENDING ? 'bg-amber-500' : 'bg-rose-500'
                }`}></div>
            )}
            
            {/* Issue Indicator - More Prominent */}
            {hasIssue && (
                <div className="absolute -top-2.5 -left-2.5 text-rose-600 bg-white rounded-full p-1 border border-rose-200 shadow-sm z-20">
                    <AlertTriangle size={14} fill="#e11d48"/>
                </div>
            )}
        </button>
    );
};

interface BlockRendererProps {
    blockCode: string;
    houses: House[];
    reports: Report[];
    officials: Official[];
    isAdmin: boolean;
    onSelect: (h: House) => void;
    className?: string;
}

// --- Block Component ---
const BlockRenderer: React.FC<BlockRendererProps> = ({ blockCode, houses, reports, officials, isAdmin, onSelect, className }) => {
    // Basic numerical sort helper
    const sortByNumber = (a: House, b: House) => parseInt(a.number, 10) - parseInt(b.number, 10);
    const sortByNumberDesc = (a: House, b: House) => parseInt(b.number, 10) - parseInt(a.number, 10);

    // --- LOGIKA U-SHAPE GENERIK UNTUK SEMUA BLOK ---
    const sortedHouses = [...houses].sort(sortByNumber);
    const splitIndex = Math.ceil(sortedHouses.length / 2);
    
    // Split layout for U-Shape (Left: Ascending, Right: Descending)
    const leftSide = sortedHouses.slice(0, splitIndex); 
    const rightSide = sortedHouses.slice(splitIndex).sort(sortByNumberDesc); 
    
    // Helper to get official role string if exists
    const getOfficialRole = (hid: string) => {
        const official = officials.find(o => o.houseId === hid);
        return official ? official.role : undefined;
    };

    return (
        <div className={`flex flex-col bg-white border-2 border-slate-800 shadow-[4px_4px_0px_0px_rgba(15,23,42,0.2)] rounded-lg overflow-hidden ${className || 'h-full'}`}>
            {/* Red Header */}
            <div className="bg-rose-600 text-white text-center py-1.5 border-b-2 border-slate-800 relative overflow-hidden shrink-0">
                 <div className="absolute inset-0 bg-black/10 skew-x-12 scale-150 pointer-events-none"></div>
                 <h3 className="text-xl font-black tracking-tighter relative z-10 drop-shadow-md">{blockCode}</h3>
                 <p className="text-[9px] relative z-10 font-medium opacity-90">
                     {houses.length > 0 ? `${parseInt(sortedHouses[0].number)} - ${parseInt(sortedHouses[sortedHouses.length-1].number)}` : ''}
                 </p>
            </div>
            
            {/* Street Content */}
            <div className="flex-1 bg-slate-100 p-2 relative overflow-y-auto custom-scrollbar">
                 {/* Dashed Center Line (Street) */}
                 <div className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-0 border-l-2 border-dashed border-slate-300 z-0"></div>
                 
                 <div className="flex gap-4 relative z-10 h-full">
                    {/* Column 1 (Left) */}
                    <div className="flex-1 flex flex-col gap-2">
                        {leftSide.map(house => (
                            <HouseCard 
                                key={house.id} house={house} isAdmin={isAdmin} 
                                hasIssue={reports.some(r => r.houseId === house.id && r.status !== 'Selesai')}
                                officialRole={getOfficialRole(house.id)}
                                onClick={() => onSelect(house)}
                            />
                        ))}
                    </div>
                     {/* Column 2 (Right) */}
                     <div className="flex-1 flex flex-col gap-2">
                        {rightSide.map(house => (
                            <HouseCard 
                                key={house.id} house={house} isAdmin={isAdmin} 
                                hasIssue={reports.some(r => r.houseId === house.id && r.status !== 'Selesai')}
                                officialRole={getOfficialRole(house.id)}
                                onClick={() => onSelect(house)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


export const HouseMap: React.FC<HouseMapProps> = ({ 
  houses, 
  isAdmin, 
  reports = [], 
  officials = [],
  onEditHouse,
  onPayDues,
  onReportHouse
}) => {
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);

  // --- STATS ---
  const totalHouses = houses.length;
  const totalOccupied = houses.filter(h => h.status === 'Occupied').length;
  // const totalBusiness = houses.filter(h => h.status === 'Business').length; // Removed to make space
  const totalEmpty = houses.filter(h => h.status === 'Empty').length; // Re-enabled
  const totalIssues = reports.filter(r => r.status !== 'Selesai').length;

  // Ownership Stats
  const totalPermanent = houses.filter(h => h.status === 'Occupied' && (h.residenceType === 'Tetap' || !h.residenceType)).length;
  const totalRenter = houses.filter(h => h.status === 'Occupied' && h.residenceType === 'Kontrak').length;
  const totalKost = houses.filter(h => h.status === 'Occupied' && h.residenceType === 'Kost').length; // Add Kost stats

  // --- DEMOGRAPHIC STATS ---
  const totalResidents = houses.reduce((sum, h) => sum + (h.occupants || 0), 0);
  const totalPregnant = houses.filter(h => h.hasPregnant).length;
  const totalBabies = houses.filter(h => h.hasBaby).length;
  const totalToddlers = houses.filter(h => h.hasToddler).length;
  const totalTeenagers = houses.filter(h => h.hasTeenager).length;
  const totalElderly = houses.filter(h => h.hasElderly).length;

  // Helper to filter houses by block
  const getBlockHouses = (code: string) => houses.filter(h => h.block === code);
  
  // Use full C5 data sorted numerically
  const c5Houses = getBlockHouses('C5').sort((a,b) => parseInt(a.number)-parseInt(b.number));

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-200 overflow-hidden flex flex-col h-[750px]">
      {/* Header Info */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 z-20 shadow-sm relative space-y-4">
        
        {/* Row 1: Title & Legend */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                  <MapPin className="text-brand-blue" size={24}/> Denah Digital RT 002
               </h3>
               <p className="text-xs text-slate-500 font-medium">Klik kavling rumah untuk melihat detail informasi.</p>
            </div>
            
            <div className="flex gap-4 text-[10px] md:text-xs font-bold bg-slate-50 p-2 rounded-xl border border-slate-100 overflow-x-auto no-scrollbar max-w-full">
               <div className="flex items-center gap-1.5 px-2 whitespace-nowrap"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></span> {totalOccupied} Dihuni</div>
               
               {/* New Ownership Legend */}
               <div className="flex items-center gap-1.5 px-2 border-l border-slate-200 whitespace-nowrap text-indigo-600"><Home size={12}/> {totalPermanent} Tetap</div>
               <div className="flex items-center gap-1.5 px-2 border-l border-slate-200 whitespace-nowrap text-amber-600"><Key size={12}/> {totalRenter} Kontrak</div>
               <div className="flex items-center gap-1.5 px-2 border-l border-slate-200 whitespace-nowrap text-cyan-600"><GraduationCap size={12}/> {totalKost} Kost</div>

               {totalIssues > 0 && <div className="flex items-center gap-1.5 px-2 border-l border-slate-200 text-rose-600 animate-pulse whitespace-nowrap"><AlertTriangle size={12}/> {totalIssues} Laporan</div>}
            </div>
        </div>

        {/* Row 2: Demographic Stats (UPDATED with Total Houses) */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
             <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex items-center gap-3">
                 <div className="bg-white p-2 rounded-full text-indigo-500 shadow-sm"><Home size={16}/></div>
                 <div><p className="text-[10px] text-indigo-600 font-bold uppercase">Total Rumah</p><p className="text-lg font-black text-slate-700 leading-none">{totalHouses}</p></div>
             </div>
             <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center gap-3">
                 <div className="bg-white p-2 rounded-full text-blue-600 shadow-sm"><Users size={16}/></div>
                 <div><p className="text-[10px] text-blue-600 font-bold uppercase">Total Warga</p><p className="text-lg font-black text-slate-700 leading-none">{totalResidents}</p></div>
             </div>
             
             {/* New Empty House Stat */}
             <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                 <div className="bg-white p-2 rounded-full text-slate-500 shadow-sm"><Home size={16}/></div>
                 <div><p className="text-[10px] text-slate-500 font-bold uppercase">Rumah Kosong</p><p className="text-lg font-black text-slate-700 leading-none">{totalEmpty}</p></div>
             </div>

             <div className="bg-pink-50 p-3 rounded-xl border border-pink-100 flex items-center gap-3">
                 <div className="bg-white p-2 rounded-full text-pink-500 shadow-sm"><Heart size={16} fill="currentColor"/></div>
                 <div><p className="text-[10px] text-pink-600 font-bold uppercase">Ibu Hamil</p><p className="text-lg font-black text-slate-700 leading-none">{totalPregnant}</p></div>
             </div>
             <div className="bg-cyan-50 p-3 rounded-xl border border-cyan-100 flex items-center gap-3">
                 <div className="bg-white p-2 rounded-full text-cyan-500 shadow-sm"><Baby size={16}/></div>
                 <div><p className="text-[10px] text-cyan-600 font-bold uppercase">Bayi</p><p className="text-lg font-black text-slate-700 leading-none">{totalBabies}</p></div>
             </div>
             <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex items-center gap-3">
                 <div className="bg-white p-2 rounded-full text-orange-500 shadow-sm"><Smile size={16}/></div>
                 <div><p className="text-[10px] text-orange-600 font-bold uppercase">Balita</p><p className="text-lg font-black text-slate-700 leading-none">{totalToddlers}</p></div>
             </div>
             <div className="bg-lime-50 p-3 rounded-xl border border-lime-100 flex items-center gap-3">
                 <div className="bg-white p-2 rounded-full text-lime-600 shadow-sm"><GraduationCap size={16}/></div>
                 <div><p className="text-[10px] text-lime-600 font-bold uppercase">Remaja</p><p className="text-lg font-black text-slate-700 leading-none">{totalTeenagers}</p></div>
             </div>
             <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 flex items-center gap-3">
                 <div className="bg-white p-2 rounded-full text-purple-500 shadow-sm"><Accessibility size={16}/></div>
                 <div><p className="text-[10px] text-purple-600 font-bold uppercase">Lansia</p><p className="text-lg font-black text-slate-700 leading-none">{totalElderly}</p></div>
             </div>
        </div>

      </div>

      <div className="flex flex-1 overflow-hidden">
          {/* Map Area */}
          <div className="flex-1 overflow-auto bg-slate-50 relative custom-scrollbar p-4 md:p-8 scroll-smooth" id="map-container">
               {/* Blueprint Background Pattern */}
               <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none" style={{
                   backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                   backgroundSize: '20px 20px'
               }}></div>
               
               {/* Map Layout Container */}
               <div className="min-w-[900px]">
                   <div className="border-[6px] border-dashed border-amber-400 bg-amber-50/50 p-6 rounded-3xl relative">
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-400 text-amber-900 px-4 py-1 rounded-full font-bold text-xs shadow-sm uppercase tracking-widest border border-amber-500 z-10">
                           Batas Wilayah RT 002 / RW 020
                       </div>

                       {/* Grid Layout based on Physical Map */}
                       <div className="grid grid-cols-4 gap-6">
                           
                           {/* Column 1: Block C5 (Single Block) */}
                           <div className="col-span-1 flex flex-col gap-6">
                               <div id="block-C5">
                                    <BlockRenderer 
                                        blockCode="C5" 
                                        houses={c5Houses} 
                                        reports={reports} 
                                        officials={officials} 
                                        isAdmin={isAdmin} 
                                        onSelect={setSelectedHouse} 
                                        className="h-fit"
                                    />
                               </div>
                           </div>

                           {/* Column 2: C7 & C8 */}
                           <div className="col-span-1 flex flex-col gap-6">
                               <div id="block-C7"><BlockRenderer blockCode="C7" houses={getBlockHouses('C7')} reports={reports} officials={officials} isAdmin={isAdmin} onSelect={setSelectedHouse} /></div>
                               <div id="block-C8"><BlockRenderer blockCode="C8" houses={getBlockHouses('C8')} reports={reports} officials={officials} isAdmin={isAdmin} onSelect={setSelectedHouse} /></div>
                           </div>

                           {/* Column 3: C9 & C10 */}
                           <div className="col-span-1 flex flex-col gap-6">
                               <div id="block-C9"><BlockRenderer blockCode="C9" houses={getBlockHouses('C9')} reports={reports} officials={officials} isAdmin={isAdmin} onSelect={setSelectedHouse} /></div>
                               <div id="block-C10"><BlockRenderer blockCode="C10" houses={getBlockHouses('C10')} reports={reports} officials={officials} isAdmin={isAdmin} onSelect={setSelectedHouse} /></div>
                           </div>

                           {/* Column 4: C11 & C12 */}
                           <div className="col-span-1 flex flex-col gap-6">
                               <div id="block-C11"><BlockRenderer blockCode="C11" houses={getBlockHouses('C11')} reports={reports} officials={officials} isAdmin={isAdmin} onSelect={setSelectedHouse} /></div>
                               <div id="block-C12"><BlockRenderer blockCode="C12" houses={getBlockHouses('C12')} reports={reports} officials={officials} isAdmin={isAdmin} onSelect={setSelectedHouse} /></div>
                           </div>
                       </div>
                       
                       {/* Legend / Compass */}
                       <div className="absolute bottom-4 right-4 opacity-20 pointer-events-none">
                           <div className="w-20 h-20 border-4 border-slate-800 rounded-full flex items-center justify-center relative">
                               <div className="absolute -top-3 bg-slate-800 text-white text-[10px] px-1 font-bold">U</div>
                               <div className="w-1 h-16 bg-slate-800"></div>
                               <div className="w-12 h-1 bg-slate-800 absolute"></div>
                           </div>
                       </div>
                   </div>
               </div>
          </div>
      </div>

      {/* Detail Modal */}
      {selectedHouse && (
          <HouseDetailModal 
            house={selectedHouse} 
            onClose={() => setSelectedHouse(null)}
            reports={reports}
            isAdmin={isAdmin}
            officials={officials}
            onEditHouse={onEditHouse}
            onPayDues={onPayDues}
            onReportHouse={onReportHouse}
          />
      )}
    </div>
  );
};
